# Bidirectional Relationship Queries

> **Level 5 — Relational Data & Graph Operations**
> The design pattern and query strategy in SurrealDB used to traverse relationships from both sides using a single edge record, eliminating the need to write duplicate reciprocal rows.

---

## 1. Prerequisites

- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — The query traversal operators.

---

## 2. Term Category


**Query Feature (bidirectional graph edge traversal)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database systems (PostgreSQL), many-to-many relationships (like "friendships") are hard to model:
-   If User A is friends with User B, friendship is mutual (bidirectional).
-   If you store this in a `friends` junction table, you must insert **two rows** to support lookups from either side: `(UserA, UserB)` and `(UserB, UserA)`.
-   If you only insert one row, your lookup query must write complex OR conditions:
    `SELECT * FROM friends WHERE user_a = 5 OR user_b = 5;`
-   This slows down query speeds and duplicates database storage requirements.

We designed **Bidirectional Querying** in SurrealDB to solve this duplication. 

Because a graph edge is a single record storing `in` (source) and `out` (target) pointers, SurrealDB allows you to traverse the edge in both directions. 

You only write one edge record. 

To find connections, you query forward (`->`) or backward (`<-`) using the arrow operators, resolving the relationship from either side without duplicating data on disk.

---

### (2) Querying Directions
Using a single `follows` edge table, you can easily query both sides of a relationship:
-   **Following (Outgoing):** Whom does this user follow?
    `SELECT ->follows->user FROM user:alice;`
-   **Followers (Incoming):** Who follows this user?
    `SELECT <-follows<-user FROM user:alice;`

---

### (3) Reality Metaphor (The Mutual Rope)
Imagine connecting two anchor points:
-   **SQL Reciprocal Rows:** Building **two separate one-way footbridges** side-by-side: one for walking east, and one for walking west. (High building cost, duplicates bridges).
-   **SurrealDB Bidirectional Edge:** Tying a **Single Rope between two Trees**. 
    -   If you stand at Tree A, you can pull the rope to guide you to Tree B.
    -   If you stand at Tree B, you can pull the same rope to guide you to Tree A.
    -   It is one physical rope, but it works in both directions.

---

### (4) Code Examples

#### Social Network Queries (Followers vs. Following)
Let's see how a single `follows` edge handles bidirectional queries:

```sql
-- 1. Create a single relationship edge
-- Alice follows Bob
RELATE user:alice -> follows -> user:bob;

-- 2. QUERY TYPE A: Fetch Bob's profile from Alice's context (Whom does Alice follow?)
-- Uses the Outgoing Arrow (->)
SELECT ->follows->user.name AS following FROM user:alice;
-- Returns: [ { "following": ["Bob"] } ]

-- 3. QUERY TYPE B: Fetch Alice's profile from Bob's context (Who follows Bob?)
-- Uses the Incoming Arrow (<-)
SELECT <-follows<-user.name AS followers FROM user:bob;
-- Returns: [ { "followers": ["Alice"] } ]

-- 4. Get a unified dashboard showing both counts for 'user:alice' in a single query!
SELECT
  count(->follows->user) AS following_count,
  count(<-follows<-user) AS followers_count
FROM user:alice;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Inserting two reciprocal edge records for mutual relationships, wasting storage space and doubling write transaction workloads

**The mistake:** Writing the queries `RELATE user:a -> friend -> user:b;` AND `RELATE user:b -> friend -> user:a;` to represent a single friendship connection.

**Why it's wrong:** SurrealDB traverses edge records in both directions natively. 

Inserting two reciprocal edges duplicates storage and requires your application to run two writes instead of one, wasting server database resources.

**Fix: Only insert one edge record to connect two nodes. Use incoming/outgoing query combinations to retrieve connections from either side:**

```sql
-- BAD (Duplicates data)
RELATE user:a -> friend -> user:b;
RELATE user:b -> friend -> user:a;

-- GOOD (Single edge, query from both sides)
RELATE user:a -> friend -> user:b;
// Query friends of User B: SELECT <-friend<-user FROM user:b;
```

---



### Mistake 2: Confusing Incoming `<-` and Outgoing `->` Graph Arrow Directions

**The mistake:** Writing `SELECT <-wrote<-post FROM user:alice;` expecting outgoing articles.

**Why it's wrong:** `->` represents outgoing edge traversals (`user:alice -> wrote -> post`). `<-` represents incoming edge traversals (`post <- wrote <- user:alice`). Reversing arrows flips edge traversal logic.

*Incorrect:*
```surrealql
-- Expecting posts written by alice, but using incoming arrow
SELECT <-wrote<-post FROM user:alice; // ❌ Flips edge direction!
```

*Fix:*
```surrealql
-- Outgoing edge traversal from user to post
SELECT ->wrote->post FROM user:alice;
```

### Mistake 3: Using Undirected Arrow `<->` when Explicit Edge Direction is Required

**The mistake:** Using `user:alice<->friend<->user` expecting to enforce asymmetric follower relationships.

**Why it's wrong:** `<->` traverses graph edges in BOTH incoming and outgoing directions bi-directionally. For directed relationships (like follower/following), specify explicit `->` or `<-` arrows.

*Incorrect:*
```surrealql
SELECT <->follows<->user FROM user:alice; // Traverses followers AND following!
```

*Fix:*
```surrealql
SELECT ->follows->user FROM user:alice; // Outgoing following users only
```





## 5. Practice Exercises

### Exercise 1: Outgoing vs Incoming Graph Traversals

**Scenario:**
Query a social network graph where user `user:alice` follows `user:bob` via relation edge `follows`. Traverse both outgoing (`->follows->user`) and incoming (`<-follows<-user`) connections.

**Requirements:**
1. Relate `user:alice -> follows -> user:bob`.
2. Write outgoing query from `user:alice` to find who Alice follows.
3. Write incoming query from `user:bob` to find Bob's followers.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice";
> CREATE user:bob SET name = "Bob";
> RELATE user:alice->follows->user:bob;
> 
> -- Outgoing: Who does Alice follow?
> SELECT ->follows->user.name AS following FROM user:alice;
> 
> -- Incoming: Who is following Bob?
> SELECT <-follows<-user.name AS followers FROM user:bob;
> ```
>
> #### Technical Explanation
>
> 1. `->follows->user` traverses outgoing relation edges from the current record to target records.
> 2. `<-follows<-user` traverses incoming relation edges in reverse to find source records.
> 3. Executes bidirectional graph navigation in $O(1)$ constant time per edge lookup.
> 
---

### Exercise 2: Undirected / Both-Directions Arrow Traversal

**Scenario:**
Query all mutual connections connected to `user:alice` regardless of arrow direction using `<->follows<->user`.

**Requirements:**
1. Write the bidirectional traversal query using `<->follows<->user`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT <->follows<->user.name AS all_connections FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `<->edge<->table` navigates both incoming and outgoing relation edges simultaneously.
> 2. Merges incoming and outgoing graph neighbors into a single result collection.
> 3. Ideal for undirected social graph networks (friends, connections).
> 
---

### Exercise 3: Edge Record Inspection during Bidirectional Queries

**Scenario:**
Query incoming followers of `user:bob` and extract edge property `created_at` along with the follower's name.

**Requirements:**
1. Relate `user:alice -> follows -> user:bob SET created_at = time::now()`.
2. Select incoming `<-follows` edge records from `user:bob`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT <-follows AS follower_edges FROM user:bob;
> ```
>
> #### Technical Explanation
>
> 1. `<-follows` returns the relation edge records themselves (including `id`, `in`, `out`, and edge properties).
> 2. Allows inspection of edge metadata (timestamps, weights) without resolving vertex records.
> 3. Enables detailed edge auditing in graph applications.
> 
---





## 6. Related Terms

- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — The query traversal operators.
- [Graph Traversal vs. Relational JOINs](graph_vs_joins.md) — Speed performance trade-offs.

---

## 7. Key Takeaways
- Bidirectional queries allow relationships to be navigated from both sides.
- A single edge record is sufficient to connect two nodes bidirectionally.
- Outgoing query paths (`->`) find targets; incoming paths (`<-`) find sources.
- Prevents database storage bloat by eliminating duplicate reciprocal rows.
- Standard query: `count(->follows)` vs `count(<-follows)` handles following/followers.
- Restrict bidirectional traversals to appropriate relation tables.
- Updates to a single edge record are reflected on both sides instantly.
