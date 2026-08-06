# Graph Arrow Operators (`->`, `<-`)

> **Level 5 — Relational Data & Graph Operations**
> The SurrealQL query operators used to traverse graph relationships inside `SELECT` statements, navigating forward along outgoing edges (`->`) or backward along incoming edges (`<-`).

---

## 1. Prerequisites

- [`RELATE` Statement](relate.md) — The command creating the edges.

---

## 2. Term Category


**Query Feature (graph traversal arrow operators)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Querying connected databases typically requires writing verbose query strings:
-   **PostgreSQL:** Requires writing multiple `INNER JOIN` clauses:
    `SELECT p.title FROM posts p INNER JOIN likes l ON p.id = l.post_id WHERE l.user_id = 5;`
-   **MongoDB:** Requires multi-stage `$lookup` aggregation pipelines.

We designed the **Graph Arrow Operators** (`->`, `<-`) in SurrealQL to make relationship querying visual and concise. 

Instead of writing JOIN code, you use arrow operators to write query paths that show the direction of the relationship. 

The database engine reads these arrows, walks the record links, and fetches the connected documents directly, simplifying queries.

---

### (2) Arrow Directions & Syntax
The arrows represent the direction of the relationship:

```text
Node A (in)  ===>  Edge Table  ===>  Node B (out)
```

#### 1. Outgoing Arrow (`->`)
Traverses forward (from source `in` to target `out`).
-   *Syntax:* `->edge_table->target_table`
-   *Example:* Querying from `user:john`:
    `SELECT ->likes->post FROM user:john;` (finds the posts liked by John).

#### 2. Incoming Arrow (`<-`)
Traverses backward (from target `out` to source `in`).
-   *Syntax:* `<-edge_table<-source_table`
-   *Example:* Querying from `post:first`:
    `SELECT <-likes<-user FROM post:first;` (finds the users who liked this post).

---

### (3) Reality Metaphor (One-Way Traffic)
Imagine a town road network:
-   **Outgoing Arrow (`->`):** Driving **with the flow of traffic** on a one-way street. 
    -   You start at the user's house, drive down "likes" street, and arrive at the post office.
-   **Incoming Arrow (`<-`):** Looking **backwards down the one-way street**. 
    -   You stand at the post office, look back down "likes" street, and see which houses the cars came from.

---

### (4) Code Examples

#### Traversing Graphs in SurrealQL
Let's query a user-post graph network:

```sql
-- Assume relationship exists: user:john -> likes -> post:first

-- 1. Find all posts liked by 'user:john' (Outgoing)
SELECT ->likes->post.title AS liked_titles FROM user:john;

-- Output returned:
// [ { "liked_titles": ["SurrealDB Graph Syntax"] } ]

-- 2. Find all users who liked 'post:first' (Incoming)
SELECT <-likes<-user.name AS user_names FROM post:first;

-- Output returned:
// [ { "user_names": ["John Doe"] } ]

-- 3. Get the count of likes for a post
SELECT count(<-likes<-user) AS total_likes FROM post:first;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Reversing the arrow direction when writing queries, returning empty arrays because the database looks for non-existent connections

**The mistake:** Running the query `SELECT <-likes<-post FROM user:john;` (using incoming arrow starting from user) expecting to see the posts John liked.

**Why it's wrong:** Relationships are directed. 

The `likes` edge was created *from* `user` (source) *to* `post` (target). 

This means user is `in` and post is `out`. 

Using `<-likes` tells SurrealDB to look for incoming edges where the user is the target (`out`). 

Since posts cannot "like" users, no such records exist, and the query returns `[]`.

**Fix: Always trace your arrow direction matching how the relationship was defined in the `RELATE` query:**

```sql
-- BAD (Looks for posts that liked John)
SELECT <-likes<-post FROM user:john;

-- GOOD (Looks for posts liked by John)
SELECT ->likes->post FROM user:john;
```

---



### Mistake 2: Using Single Dashes `-` in Place of Double Hyphen Arrows `->` in Graph Syntax

**The mistake:** Writing `SELECT -wrote-post FROM user:alice;` (SyntaxError).

**Why it's wrong:** SurrealQL graph arrow syntax strictly requires `->`, `<-`, or `<->`.

*Incorrect:*
```surrealql
SELECT -wrote-post FROM user:alice; // ❌ Parse error!
```

*Fix:*
```surrealql
SELECT ->wrote->post FROM user:alice; // Correct double-character arrow syntax
```

### Mistake 3: Omitting the Intermediate Edge Table Name in Arrow Traversals

**The mistake:** Writing `SELECT ->post FROM user:alice;` expecting to traverse `wrote` edge automatically.

**Why it's wrong:** Arrow traversals require specifying both the edge table AND the target node table: `->edge_table->node_table`.

*Incorrect:*
```surrealql
SELECT ->post FROM user:alice; // ❌ Missing edge table name!
```

*Fix:*
```surrealql
SELECT ->wrote->post FROM user:alice;
```





## 5. Practice Exercises

### Exercise 1: Outgoing Graph Arrow Syntax (`->`)

**Scenario:**
Query all blog posts written by `user:alice` using outgoing graph arrow syntax (`->wrote->post`).

**Requirements:**
1. Create user `user:alice` and post `post:p1`.
2. Relate `user:alice -> wrote -> post:p1`.
3. Select `->wrote->post.title` from `user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice";
> CREATE post:p1 SET title = "Graph Arrows in SurrealDB";
> RELATE user:alice->wrote->post:p1;
> 
> -- Outgoing arrow traversal
> SELECT ->wrote->post.title AS written_posts FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `->wrote->post` specifies outgoing edge direction from `user` to `post`.
> 2. `->wrote` selects the edge table; `->post` selects the target vertex table.
> 3. Replaces relational foreign key JOINs with direct arrow navigation.

---

### Exercise 2: Incoming Graph Arrow Syntax (`<-`)

**Scenario:**
Query all authors who wrote post `post:p1` using incoming graph arrow syntax (`<-wrote<-user`).

**Requirements:**
1. Write incoming traversal query `SELECT <-wrote<-user.name FROM post:p1`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Incoming arrow traversal
> SELECT <-wrote<-user.name AS authors FROM post:p1;
> ```
>
> #### Technical Explanation
>
> 1. `<-wrote<-user` specifies incoming edge direction from `post` back to `user`.
> 2. `<-wrote` targets incoming relation edge records where `out = post:p1`.
> 3. Enables reverse graph navigation without secondary indexes.

---

### Exercise 3: Undirected Graph Arrow Syntax (`<->`)

**Scenario:**
Query all friends connected to `user:alice` regardless of whether the `knows` edge is incoming or outgoing using `<->knows<->user`.

**Requirements:**
1. Write bidirectional query `SELECT <->knows<->user.name FROM user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT <->knows<->user.name AS all_friends FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `<->knows<->user` traverses both incoming and outgoing `knows` edges.
> 2. Merges bidirectional graph neighbors into a single unified result list.
> 3. Ideal for symmetric friendship and network connectivity queries.

---





## 6. Related Terms

- [`RELATE` Statement](relate.md) — The command creating the edges.
- [Bidirectional Relationship Queries](bidirectional_queries.md) — Cross-referencing tables.
- [Deep Graph Traversal (Chained arrows)](deep_graph_traversal.md) — Related concept: Deep Graph Traversal (Chained arrows).
- [Graph Traversal vs. Relational JOINs](graph_vs_joins.md) — Related concept: Graph Traversal vs. Relational JOINs.
- [Parallel Edge Traversals](parallel_edge_traversals.md) — Related concept: Parallel Edge Traversals.

---

## 7. Key Takeaways
- Arrow operators (`->`, `<-`) traverse graph relationships in SurrealQL.
- Outgoing arrows (`->`) traverse forward from `in` source to `out` target.
- Incoming arrows (`<-`) traverse backward from `out` target to `in` source.
- Bypasses SQL `JOIN` clauses, keeping queries concise and visual.
- Traversal targets specify the relation table and the destination table.
- Reversing arrow directions in queries yields empty results.
- Chaining multiple arrows enables deep graph traversals across tables.
