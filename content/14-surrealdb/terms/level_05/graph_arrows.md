# Graph Arrow Operators (`->`, `<-`)

> **Level 5 — Relational Data & Graph Operations**
> The SurrealQL query operators used to traverse graph relationships inside `SELECT` statements, navigating forward along outgoing edges (`->`) or backward along incoming edges (`<-`).

---

## 1. Prerequisites
- [`RELATE` Statement](relate.md) — The command creating the edges.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Parsed by the query executor. Resolves path traversals in constant time by reading relation pointers directly, bypassing table scans).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Using Single Dashes `-` in Place of Double Hyphen Arrows `->` in Graph Syntax

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

### Mistake 5: Omitting the Intermediate Edge Table Name in Arrow Traversals

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

## 6. Practice Exercises

### Exercise 1: Traversal Direction Selection

**Problem:** You have a database tracking which users have bought products. 
The relationship was created using: `RELATE user:alice -> bought -> product:shoes;`
Write the SurrealQL queries to:
1.  Find all products bought by `user:alice`.
2.  Find all users who bought `product:shoes`.

**Expected output:**
```sql
-- 1. Products bought by Alice (Outgoing)
SELECT ->bought->product FROM user:alice;

-- 2. Users who bought shoes (Incoming)
SELECT <-bought<-user FROM product:shoes;
```

> [!check]- Answer
> - The source node is `user` and the target is `product`.
> - Outgoing arrows (`->`) start at the source; incoming arrows (`<-`) start at the target.

---



### Exercise 2: Graph Arrow Directions Reference

**Problem:** State meaning: `->` (Outgoing), `<-` (Incoming), `<->` (Bidirectional).

**Expected output:**
```text
->: Outgoing, <-: Incoming, <->: Bidirectional
```

> [!check]- Answer
> ```text
> ->: Outgoing, <-: Incoming, <->: Bidirectional
> ```
>
> **Explanation:** Arrow directions specify graph traversal orientation relative to source nodes.

### Exercise 3: Filtering Traversed Target Nodes with Arrow Clauses

**Problem:** Select posts written by `user:alice` published after `d"2026-01-01T00:00:00Z"` using arrow filter syntax.

**Expected output:**
```text
SELECT ->wrote->(post WHERE created_at > d"2026-01-01T00:00:00Z") AS posts FROM user:alice;
```

> [!check]- Answer
> ```surrealql
> SELECT ->wrote->(post WHERE created_at > d"2026-01-01T00:00:00Z") AS posts FROM user:alice;
> ```
>
> **Explanation:** Parentheses inside arrow paths `->(table WHERE condition)` filter target graph nodes.

## 7. Related Terms
- [`RELATE` Statement](relate.md) — The command creating the edges.
- [Bidirectional Relationship Queries](bidirectional_queries.md) — Cross-referencing tables.

---

## 8. Key Takeaways
- Arrow operators (`->`, `<-`) traverse graph relationships in SurrealQL.
- Outgoing arrows (`->`) traverse forward from `in` source to `out` target.
- Incoming arrows (`<-`) traverse backward from `out` target to `in` source.
- Bypasses SQL `JOIN` clauses, keeping queries concise and visual.
- Traversal targets specify the relation table and the destination table.
- Reversing arrow directions in queries yields empty results.
- Chaining multiple arrows enables deep graph traversals across tables.
