# Parallel Edge Traversals

> **Level 5 — Relational Data & Graph Operations**
> The query strategy in SurrealDB used to traverse multiple independent relationship paths simultaneously inside a single `SELECT` projection list, returning nested arrays without triggering SQL-style Cartesian product duplicate rows.

---

## 1. Prerequisites

- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — The query traversal operators.

---

## 2. Term Category


**Query Feature (multi-edge parallel graph traversal)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In application interfaces (like user dashboards), you need to display multiple related lists at once:
-   Show a user's liked posts.
-   Show a user's purchased products.
-   Show a user's active followers.

In relational SQL (PostgreSQL), joining two separate one-to-many tables (likes and purchases) to the same user row creates a **Cartesian Product**:
-   If a user has 3 liked posts and 3 purchases, a standard JOIN query returns **9 rows** (3 x 3).
-   This duplicates values in the result set, making counting items difficult and forcing you to write subqueries or deduplicate data in your application code.

We designed **Parallel Edge Traversals** in SurrealQL to solve this Cartesian duplication. 

Because SurrealDB projects traversals directly into nested JSON arrays, you can query multiple independent edge paths as separate fields inside a single `SELECT` statement (e.g. `SELECT ->likes, ->bought FROM user`). 

SurrealDB executes the traversals in parallel. 

It returns a single JSON object containing two separate arrays, preventing data duplication and keeping query payloads clean.

---

### (2) Sequential vs. Parallel Traversal
-   **Sequential Chain (Chained Arrows):** `->follows->user->likes->post`
    -   *Behavior:* Walks a single, deep path. (Finds posts liked by people you follow).
-   **Parallel Projection (Multiple Select Fields):** `SELECT ->likes->post, ->bought->product`
    -   *Behavior:* Walks two separate, independent paths starting from the same source. (Finds your liked posts AND your bought products).

---

### (3) Reality Metaphor (The Railway Terminal)
Imagine standing in a central transportation hub:
-   **SQL Cartesian JOIN:** Forcing all passengers from both lines to crowd into a single train, duplicating lists and causing confusion.
-   **Parallel Traversal:** A **Central Railway Hub Terminal**. 
    -   You stand in the center (the user node). 
    -   Two separate tracks depart from the terminal in opposite directions: Track A goes to the post station (`likes`), and Track B goes to the product mall (`bought`). 
    -   You dispatch two search drones down both tracks simultaneously. 
    -   They return in parallel, dropping their findings into two separate, clean baskets on your desk. The tracks never cross.

---

### (4) Code Examples

#### Querying Parallel Edges in SurrealQL
Let's build a unified user dashboard query:

```sql
-- Assume relationship exists:
-- user:john -> likes -> post:first
-- user:john -> bought -> product:laptop

-- 1. Query multiple independent relationship paths in parallel
SELECT
  name,
  email,
  ->likes->post.title AS liked_posts,       -- Path A (Outgoing)
  ->bought->product.title AS bought_products, -- Path B (Outgoing)
  <-follows<-user.name AS followers           -- Path C (Incoming)
FROM user:john;

-- Output returned (returns a single object containing clean, nested arrays!):
// [
//   {
//     "name": "John Doe",
//     "email": "john@example.com",
//     "liked_posts": ["SurrealDB Graph Syntax"],
//     "bought_products": ["Laptop Pro"],
//     "followers": ["Alice"]
//   }
// ]
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to write parallel relationship lookups as a single chained arrow path, resulting in empty array returns

**The mistake:** Writing the query `SELECT ->likes->post->bought->product FROM user:john;` expecting to retrieve both liked posts and bought products.

**Why it's wrong:** Chaining arrows executes a **sequential** walk. 

This query tells SurrealDB to find the posts John liked, and then from *those posts*, find the products they bought. 

Since posts cannot buy products, the path finds no matches and returns `[]`.

**Fix: Place independent relationship paths in separate projection fields inside the `SELECT` clause, rather than chaining them sequentially:**

```sql
-- BAD (Sequential chain)
SELECT ->likes->post->bought->product FROM user:john;

-- GOOD (Parallel fields projection)
SELECT ->likes->post, ->bought->product FROM user:john;
```

---



### Mistake 2: Traversing Multiple Parallel Edges Without Union Brackets

**The mistake:** Writing `SELECT ->(wrote, liked)->post FROM user:alice;` using incorrect syntax.

**Why it's wrong:** Traversing multiple parallel edge relationships simultaneously uses array or multi-edge syntax `->(wrote | liked)->post` or `->(wrote, liked)->post`.

*Incorrect:*
```surrealql
SELECT ->wrote, liked->post FROM user:alice; // ❌ Invalid syntax!
```

*Fix:*
```surrealql
SELECT ->wrote->post AS created, ->liked->post AS liked FROM user:alice;
-- Or combined multi-edge traversal
```

### Mistake 3: Confusing Parallel Edge Traversals with Parallel Transaction Execution (`PARALLEL`)

**The mistake:** Using `PARALLEL` keyword expecting multi-edge graph traversal.

**Why it's wrong:** The `PARALLEL` keyword executes statement queries concurrently. Parallel edge traversal refers to querying multiple relationship edge types in a graph.

*Incorrect:*
```surrealql
SELECT PARALLEL ->wrote->post FROM user:alice;
```

*Fix:*
```surrealql
SELECT ->wrote->post AS wrote, ->liked->post AS liked FROM user:alice;
```





## 5. Practice Exercises

### Exercise 1: Multi-Edge Type Parallel Traversal

**Scenario:**
A user profile activity feed queries both posts `wrote` by `user:alice` AND posts `liked` by `user:alice` in a single parallel edge traversal.

**Requirements:**
1. Relate `user:alice -> wrote -> post:p1`.
2. Relate `user:alice -> liked -> post:p2`.
3. Select `->(wrote, liked)->post.title` from `user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice";
> CREATE post:p1 SET title = "Authored Post";
> CREATE post:p2 SET title = "Liked Post";
> 
> RELATE user:alice->wrote->post:p1;
> RELATE user:alice->liked->post:p2;
> 
> -- Parallel multi-edge traversal
> SELECT ->(wrote, liked)->post.title AS activity_posts FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `->(edge1, edge2)->table` traverses multiple edge tables in parallel within a single query pass.
> 2. Merges records from both `wrote` and `liked` relation edges into a unified result set.
> 3. Eliminates duplicate queries or manual application-side array merging.
> 
---

### Exercise 2: Parallel Edge Filtering

**Scenario:**
Query posts connected to `user:alice` via `wrote` or `bookmarked` edges where the edge creation date is within the last 7 days.

**Requirements:**
1. Write `SELECT ->(wrote, bookmarked)[WHERE created_at > time::now() - 7d]->post.title FROM user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT ->(wrote, bookmarked)[WHERE created_at > time::now() - 7d]->post.title AS recent_activity 
> FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. Applies filter conditions `[WHERE created_at > ...]` to all parallel edge types simultaneously.
> 2. Filters out stale relation edges across both edge tables.
> 3. Optimizes activity feed generation queries.
> 
---

### Exercise 3: Flattening Parallel Traversal Collections

**Scenario:**
Flatten parallel traversal results from `->(wrote, liked)->post.title` into a single 1D array of unique post titles using `array::distinct()`.

**Requirements:**
1. Combine `SELECT VALUE` and `array::distinct()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT array::distinct(array::flatten(->(wrote, liked)->post.title)) AS unique_titles 
> FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `array::flatten()` unwraps multi-edge result arrays.
> 2. `array::distinct()` removes duplicate post titles if a post was both written AND liked.
> 3. Returns a clean deduplicated list of activity titles.
> 
---





## 6. Related Terms

- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — The query traversal operators.
- [Deep Graph Traversal (Chained arrows)](deep_graph_traversal.md) — Sequential path walks.

---

## 7. Key Takeaways
- Parallel edge traversals query multiple relationship paths in a single statement.
- Projects independent relationship streams as separate fields in the query.
- Returns nested JSON arrays, preventing SQL-style Cartesian product duplicate rows.
- Keeps query payloads clean and eliminates client-side deduplication loops.
- Do not chain parallel lookups sequentially; separate them using commas.
- Supports traversing both incoming (`<-`) and outgoing (`->`) edges in parallel.
- Highly useful for building consolidated user dashboards and profiles.
