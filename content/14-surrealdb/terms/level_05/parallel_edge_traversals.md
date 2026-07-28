# Parallel Edge Traversals

> **Level 5 — Relational Data & Graph Operations**
> The query strategy in SurrealDB used to traverse multiple independent relationship paths simultaneously inside a single `SELECT` projection list, returning nested arrays without triggering SQL-style Cartesian product duplicate rows.

---

## 1. Prerequisites
- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — The query traversal operators.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Processed at the projection compilation stage. Executes parallel read sub-queries in memory to resolve different edge paths before merging them into the final JSON output object).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Traversing Multiple Parallel Edges Without Union Brackets

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

### Mistake 5: Confusing Parallel Edge Traversals with Parallel Transaction Execution (`PARALLEL`)

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

## 6. Practice Exercises

### Exercise 1: Dashboard Query Design

**Problem:** You are building a student profile page. 
-   Students belong to classes (`->enrolled_in->class`).
-   Students borrow library books (`->borrowed->book`).
Write the SurrealQL query starting from `student:alice` to retrieve the student's `name` along with two parallel arrays:
1.  `classes`: List of class names she is enrolled in.
2.  `books`: List of book titles she has borrowed.

**Expected output:**
```sql
SELECT name, ->enrolled_in->class.name AS classes, ->borrowed->book.title AS books FROM student:alice;
```

> [!check]- Answer
> - The source node is `student:alice`.
> - Project the two relationship paths as separate, comma-separated fields in the `SELECT` statement.

---



### Exercise 2: Parallel Graph Edge Projection

**Problem:** Query user `user:alice` projecting both `wrote` posts and `liked` posts in a single statement.

**Expected output:**
```text
SELECT ->wrote->post AS wrote, ->liked->post AS liked FROM user:alice;
```

> [!check]- Answer
> ```surrealql
> SELECT ->wrote->post AS wrote, ->liked->post AS liked FROM user:alice;
> ```
>
> **Explanation:** Projecting multiple arrow paths retrieves parallel edge relationship targets.

### Exercise 3: Deduplicating Multi-Edge Traversals

**Problem:** Combine and deduplicate post IDs from both `wrote` and `liked` edges.

**Expected output:**
```text
SELECT array::distinct(array::add(->wrote->post, ->liked->post)) AS all_posts FROM user:alice;
```

> [!check]- Answer
> ```surrealql
> SELECT array::distinct(array::add(->wrote->post, ->liked->post)) AS all_posts FROM user:alice;
> ```
>
> **Explanation:** `array::distinct()` deduplicates record IDs retrieved across multiple edge paths.

## 7. Related Terms
- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — The query traversal operators.
- [Deep Graph Traversal (Chained arrows)](deep_graph_traversal.md) — Sequential path walks.

---

## 8. Key Takeaways
- Parallel edge traversals query multiple relationship paths in a single statement.
- Projects independent relationship streams as separate fields in the query.
- Returns nested JSON arrays, preventing SQL-style Cartesian product duplicate rows.
- Keeps query payloads clean and eliminates client-side deduplication loops.
- Do not chain parallel lookups sequentially; separate them using commas.
- Supports traversing both incoming (`<-`) and outgoing (`->`) edges in parallel.
- Highly useful for building consolidated user dashboards and profiles.
