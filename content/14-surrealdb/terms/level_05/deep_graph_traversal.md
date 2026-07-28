# Deep Graph Traversal (Chained arrows)

> **Level 5 — Relational Data & Graph Operations**
> The query strategy in SurrealDB used to navigate relationships across multiple tables by chaining arrow operators (e.g., `node->edge->node->edge->node`), executing deep network walks in a single expression.

---

## 1. Prerequisites
- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — The query traversal operators.
- [Graph Traversal vs Relational JOINs](graph_vs_joins.md) — The performance mechanics.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the graph resolver. Sequentially walks pointer chains in memory, resolving multiple table records in a single read transaction pass).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In social networks, e-commerce recommendation engines, and logistics systems, relationships are deep:
-   You want to find: *"Tags of posts liked by people that Alice follows."*
-   This represents a 4-level deep network walk: `User (Alice) -> follows -> User -> likes -> Post -> tagged -> Tag`.

In relational databases (PostgreSQL), executing this query requires a massive, complex block of code:
-   You must join the `users`, `follows`, `users` (again), `likes`, `posts`, `tagged`, and `tags` tables together.
-   This requires 7 tables and 6 `INNER JOIN` statements, which are hard to read and run slowly because index scans accumulate.

We designed **Deep Graph Traversal** in SurrealQL to support these multi-level lookups. 

Instead of writing JOIN blocks, you chain arrow operators to write the path: `->follows->user->likes->post->tagged->tag`. 

The query compiler walks the direct pointer links step-by-step. 

Because each step is resolved in constant time, the query remains fast, enabling real-time recommendation engines directly in the database.

---

### (2) The Chaining Rule
When chaining relationships, you **must alternate** between edge tables and node tables:

$$\text{Node} \longrightarrow \text{Edge} \longrightarrow \text{Node} \longrightarrow \text{Edge} \longrightarrow \text{Node}$$

You cannot skip intermediate tables. 

For example, trying to hop directly from the `follows` edge to the `likes` edge (`->follows->likes`) fails, because the database needs to know which node table acts as the middle link.

---

### (3) Reality Metaphor (Connected Hallways)
Imagine a treasure hunt through a palace:
-   **SQL JOINs (Directory Lookups):** Standing in the lobby. 
    -   You look up a ledger to find room A. 
    -   You walk to room A, look up another ledger to find room B, walk to room B, and search a third ledger to find room C. (Index searches).
-   **Chained Arrows:** Walking through a **Series of Connected Hallways**. 
    -   You walk through the first door (follows), step into user space, walk straight through the next door (likes), step into post space, and exit through the "tagged" door, arriving at the tags room. 
    -   You follow a single path without stopping to look at directory catalogs.

---

### (4) Code Comparison

Query: *"Find the names of tags on posts liked by users that user:alice follows."*

#### PostgreSQL (7-Table JOIN)
```sql
SELECT t.name 
FROM tags t
INNER JOIN post_tags pt ON t.id = pt.tag_id
INNER JOIN posts p ON pt.post_id = p.id
INNER JOIN likes l ON p.id = l.post_id
INNER JOIN users u1 ON l.user_id = u1.id
INNER JOIN follows f ON u1.id = f.target_id
WHERE f.source_id = 1; -- Complex and slow index matching
```

#### SurrealDB (Chained Arrow Traversal)
```sql
SELECT ->follows->user->likes->post->tagged->tag.name AS tag_names FROM user:alice;
-- Visual, fast, single-path traversal!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Skipping intermediate node tables when chaining arrow operators, triggering query compilation errors

**The mistake:** Writing the query `SELECT ->follows->likes->post.title FROM user:alice;` trying to skip the intermediate `user` table.

**Why it's wrong:** The `follows` edge links users to users. 

The `likes` edge links users to posts. 

If you omit the intermediate `user` node, the query parser cannot bridge the edges, resulting in a syntax compilation error:
`Database compilation error: Expected a node table in graph traversal...`

**Fix: Always alternate between edge tables and node tables in your traversal chains:**

```sql
-- BAD
SELECT ->follows->likes->post FROM user:alice;

-- GOOD
SELECT ->follows->user->likes->post FROM user:alice;
```

---



### Mistake 2: Un-Aliasing Deep Multi-Hop Arrow Traversal Projections

**The mistake:** Selecting `SELECT ->knows->user->knows->user FROM user:alice;` without aliasing.

**Why it's wrong:** Un-aliased deep arrow traversals produce complex nested key names in query result objects. Use `AS alias` (e.g. `AS friends_of_friends`).

*Incorrect:*
```surrealql
SELECT ->knows->user->knows->user FROM user:alice; // Un-friendly output keys
```

*Fix:*
```surrealql
SELECT ->knows->user->knows->user AS fof FROM user:alice; // Clean aliased projection
```

### Mistake 3: Creating Cyclic Infinite Loops in Unbounded Graph Traversals

**The mistake:** Traversing recursive cyclic friend relationships without filtering or depth limits.

**Why it's wrong:** Cyclic graph connections (A -> B -> A) can create redundant nested object trees during multi-hop traversals.

*Incorrect:*
```surrealql
-- Unbounded multi-hop lookup on cyclic graph
SELECT ->knows->user->knows->user->knows->user FROM user:alice;
```

*Fix:*
```surrealql
SELECT array::distinct(->knows->user->knows->user) AS fof FROM user:alice; // Deduplicate visited nodes
```



### Mistake 4: Un-Aliasing Deep Multi-Hop Arrow Traversal Projections

**The mistake:** Selecting `SELECT ->knows->user->knows->user FROM user:alice;` without aliasing.

**Why it's wrong:** Un-aliased deep arrow traversals produce complex nested key names in query result objects. Use `AS alias` (e.g. `AS friends_of_friends`).

*Incorrect:*
```surrealql
SELECT ->knows->user->knows->user FROM user:alice; // Un-friendly output keys
```

*Fix:*
```surrealql
SELECT ->knows->user->knows->user AS fof FROM user:alice; // Clean aliased projection
```

### Mistake 5: Creating Cyclic Infinite Loops in Unbounded Graph Traversals

**The mistake:** Traversing recursive cyclic friend relationships without filtering or depth limits.

**Why it's wrong:** Cyclic graph connections (A -> B -> A) can create redundant nested object trees during multi-hop traversals.

*Incorrect:*
```surrealql
-- Unbounded multi-hop lookup on cyclic graph
SELECT ->knows->user->knows->user->knows->user FROM user:alice;
```

*Fix:*
```surrealql
SELECT array::distinct(->knows->user->knows->user) AS fof FROM user:alice; // Deduplicate visited nodes
```

## 6. Practice Exercises

### Exercise 1: Deep Path Construction

**Problem:** You are building a movie recommendation database.
-   Users follow other users (`->follows->user`).
-   Users watch movies, storing ratings on the edge (`->watched->movie`).
-   Movies are classified in genres (`->genre->genre`).
Write the SurrealQL query starting from `user:john` to retrieve all genre names of movies watched by users that John follows.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT ->follows->user->watched->movie->genre->genre.name AS genres FROM user:john;
> ```
> - Follow the node-edge-node alternation pattern strictly.
> - Chain the path: `user:john` $\rightarrow$ `follows` $\rightarrow$ `user` $\rightarrow$ `watched` $\rightarrow$ `movie` $\rightarrow$ `genre` $\rightarrow$ `genre`.

---



### Exercise 2: 2-Hop Friends-of-Friends Traversal

**Problem:** Query 2-hop friends-of-friends from `user:alice` deduplicating result IDs.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT array::distinct(->knows->user->knows->user) AS fof FROM user:alice;
> ```
> ```surrealql
> SELECT array::distinct(->knows->user->knows->user) AS fof FROM user:alice;
> ```
>
> **Explanation:** Chaining arrow paths `->edge->table->edge->table` traverses multi-hop graph networks.

---

### Exercise 3: 3-Hop Supply Chain Traversal

**Problem:** Query suppliers 3 hops away: `product:1 -> ->supplied_by->vendor -> ->sourced_from->factory -> ->owned_by->company`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT ->supplied_by->vendor->sourced_from->factory->owned_by->company AS owner FROM product:1;
> ```
> ```surrealql
> SELECT ->supplied_by->vendor->sourced_from->factory->owned_by->company AS owner FROM product:1;
> ```
>
> **Explanation:** SurrealDB executes multi-hop graph traversals in constant pointer time.

## 7. Related Terms
- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — The query traversal operators.
- [Graph Traversal vs Relational JOINs](graph_vs_joins.md) — The performance mechanics.

---

## 8. Key Takeaways
- Deep graph traversal chains multiple arrow operators in a single path.
- Replaces complex multi-table SQL JOIN queries with a clean, visual syntax.
- Path syntax must alternate: Node $\rightarrow$ Edge $\rightarrow$ Node $\rightarrow$ Edge $\rightarrow$ Node.
- Skipping intermediate node tables causes query compilation errors.
- Resolves deep relationships in constant time, ideal for real-time recommendations.
- Combine deep traversals with dot-notation field projections to extract data.
- Supports both incoming (`<-`) and outgoing (`->`) arrows in the same chain.
