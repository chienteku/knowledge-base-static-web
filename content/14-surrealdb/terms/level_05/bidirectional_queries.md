# Bidirectional Relationship Queries

> **Level 5 — Relational Data & Graph Operations**
> The design pattern and query strategy in SurrealDB used to traverse relationships from both sides using a single edge record, eliminating the need to write duplicate reciprocal rows.

---

## 1. Prerequisites

- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — The query traversal operators.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Supported by the relationship index engine. Evaluates queries from both the `in` pointer and `out` pointer branches in parallel, yielding fast bidirectional lookups).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Confusing Incoming `<-` and Outgoing `->` Graph Arrow Directions

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

### Mistake 5: Using Undirected Arrow `<->` when Explicit Edge Direction is Required

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

## 6. Practice Exercises

### Exercise 1: Bidirectional Query Construction

**Problem:** You are building a student-course enrollment database. 
The relationship was created using: `RELATE student:alice -> enrolled -> course:math;`
Write the SurrealQL queries to:
1.  Find all course names student `student:alice` is enrolled in.
2.  Find all student names enrolled in course `course:math`.

**Expected output:**
> [!check]- Answer
> ```sql
> -- 1. Courses Alice is in (Outgoing)
> SELECT ->enrolled->course.name AS courses FROM student:alice;
> 
> -- 2. Students in Math (Incoming)
> SELECT <-enrolled<-student.name AS students FROM course:math;
> ```
> - The edge table is `enrolled`.
> - Check which node corresponds to the `in` source (student) and which to the `out` target (course) to orient your arrow queries.

---



### Exercise 2: Bidirectional Social Follower Traversal

**Problem:** Write SurrealQL queries to select: 1. Users `user:alice` follows (`->follows->user`), 2. Users following `user:alice` (`<-follows<-user`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. SELECT ->follows->user FROM user:alice; 2. SELECT <-follows<-user FROM user:alice;
> ```
> ```surrealql
> SELECT ->follows->user FROM user:alice;
> SELECT <-follows<-user FROM user:alice;
> ```
>
> **Explanation:** `->` traverses outgoing edges; `<-` traverses incoming edges.

---

### Exercise 3: Undirected Friendship Graph Query

**Problem:** Query all friends connected via `friend_of` in either direction using `<->`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT <->friend_of<->user AS friends FROM user:alice;
> ```
> ```surrealql
> SELECT <->friend_of<->user AS friends FROM user:alice;
> ```
>
> **Explanation:** `<->` traverses graph relations in both directions simultaneously.

## 7. Related Terms

- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — The query traversal operators.
- [Graph Traversal vs. Relational JOINs](graph_vs_joins.md) — Speed performance trade-offs.

---

## 8. Key Takeaways
- Bidirectional queries allow relationships to be navigated from both sides.
- A single edge record is sufficient to connect two nodes bidirectionally.
- Outgoing query paths (`->`) find targets; incoming paths (`<-`) find sources.
- Prevents database storage bloat by eliminating duplicate reciprocal rows.
- Standard query: `count(->follows)` vs `count(<-follows)` handles following/followers.
- Restrict bidirectional traversals to appropriate relation tables.
- Updates to a single edge record are reflected on both sides instantly.
