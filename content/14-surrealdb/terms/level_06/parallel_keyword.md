# `PARALLEL` Keyword

> **Level 6 — Advanced Querying & Functions**
> The SurrealQL query modifier appended to statements (`UPDATE`, `DELETE`, `SELECT`) that instructs the database engine to process targeted records concurrently across multiple CPU threads, accelerating bulk operations on large datasets.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [`UPDATE`](../level_03/update.md) — Bulk write statement.

---

## 2. Term Category


**Performance / Operations (concurrent block execution modifier)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When operating on massive tables containing hundreds of thousands of records:
- Running a bulk update or complex regex search sequentially processes one record after another on a single CPU thread.
- If an operation takes 1 millisecond per record, running it sequentially on 100,000 records takes 100 seconds.

In standard SQL (PostgreSQL), parallel query execution is managed automatically by complex cost-based query planners. In MongoDB, bulk operations rely on background worker threads.

We designed the **`PARALLEL`** keyword in SurrealQL to give developers explicit control over multi-threaded processing. By appending `PARALLEL` to a bulk `UPDATE`, `DELETE`, or `SELECT` statement, you tell SurrealDB to split the target record list across all available CPU threads in its thread pool, executing the operation concurrently and completing bulk tasks in a fraction of the time.

---

### (2) How PARALLEL Multi-Threading Works
- **Sequential Execution (Default):**
  `Thread 1: Record 1 ➔ Record 2 ➔ Record 3 ➔ Record 4 ...`
- **Parallel Execution (`PARALLEL`):**
  `Thread 1: Record 1 ➔ Record 2`
  `Thread 2: Record 3 ➔ Record 4`
  `Thread 3: Record 5 ➔ Record 6`
  `Thread 4: Record 7 ➔ Record 8`

---

### (3) Reality Metaphor (Supermarket Checkout Lanes)
Imagine a busy grocery store:
- **Sequential Processing (No PARALLEL):** A single cashier scanning 100 shopping carts one-by-one. The line stretches out the door.
- **`PARALLEL` Keyword:** Opening **8 Checkout Lanes** at once. 
  - The 100 carts are distributed evenly across all 8 cashiers.
  - All cashiers scan carts simultaneously.
  - The entire queue is cleared 8 times faster.

---

### (4) Code Examples

#### Executing Parallel Operations in SurrealQL

```sql
-- 1. Parallel bulk UPDATE on a large dataset
UPDATE user SET 
  migrated = true,
  schema_version = 2
WHERE registered_at < d"2025-01-01T00:00:00Z"
PARALLEL;

-- 2. Parallel bulk DELETE for purging expired records
DELETE log 
WHERE created_at < time::now() - 90d
PARALLEL;

-- 3. Parallel SELECT for heavy computation queries across large tables
SELECT 
  id, 
  crypto::argon2::generate(email) AS hashed_id 
FROM large_dataset 
PARALLEL;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Appending 'PARALLEL' to single-record queries or tiny tables, expecting performance gains

**The mistake:** Running `UPDATE user:tobie SET active = true PARALLEL;` or using `PARALLEL` on a table with only 20 rows.

**Why it's wrong:** Multi-threaded execution incurs a small thread-spawning and coordination overhead. On single-record lookups or tiny tables, spawning parallel threads takes more CPU time than simply executing the single-threaded lookup.

**Fix: Only append `PARALLEL` to bulk operations on large tables (thousands of records or more).**

---



### Mistake 2: Using `PARALLEL` on Single Sequential Statements

**The mistake:** Adding `PARALLEL` to a single isolated `SELECT * FROM user;` statement.

**Why it's wrong:** `PARALLEL` executes multiple independent query statements concurrently. Adding `PARALLEL` to a single query provides no performance benefit.

*Incorrect:*
```surrealql
SELECT * FROM user PARALLEL; // Redundant on single query
```

*Fix:*
```surrealql
SELECT * FROM user;
SELECT * FROM product PARALLEL; // Executes multiple statements concurrently
```

### Mistake 3: Using `PARALLEL` on Queries Dependent on Prior Statement Variables

**The mistake:** Executing `LET $u = (CREATE user SET name = 'A'); SELECT * FROM $u PARALLEL;`.

**Why it's wrong:** Statements that rely on variables computed in preceding statements must execute sequentially. Executing them in parallel causes un-bound variable errors.

*Incorrect:*
```surrealql
LET $u = (CREATE user:1); SELECT * FROM $u PARALLEL; // ❌ Variable $u may not be set yet!
```

*Fix:*
```surrealql
LET $u = (CREATE user:1);
SELECT * FROM $u; // Sequential execution preserves variable order
```

## 5. Practice Exercises

### Exercise 1: Concurrent Block Execution with `PARALLEL`

**Scenario:**
A reporting query executes multiple heavy analytical subqueries concurrently using the `PARALLEL` block keyword modifier.

**Requirements:**
1. Execute two subqueries in a `PARALLEL` block.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> PARALLEL {
>     LET $total_users = (SELECT count() FROM user GROUP ALL);
>     LET $total_orders = (SELECT count() FROM order GROUP ALL);
> };
> ```
>
> #### Technical Explanation
>
> 1. `PARALLEL { ... }` executes statements within the block concurrently across available CPU threads.
> 2. Reduces overall query response latency for independent subqueries.
> 3. Leverages SurrealDB's async Rust Tokio runtime threads.
> 
---

### Exercise 2: Parallel Batch Record Creation

**Scenario:**
Create multiple independent audit records concurrently using `PARALLEL`.

**Requirements:**
1. Wrap multiple `CREATE` statements in a `PARALLEL` block.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> PARALLEL {
>     CREATE audit:1 SET action = "task_a";
>     CREATE audit:2 SET action = "task_b";
>     CREATE audit:3 SET action = "task_c";
> };
> ```
>
> #### Technical Explanation
>
> 1. Dispatches write statements to parallel execution channels.
> 2. Improves write throughput for un-correlated database insertions.
> 3. All statements commit together upon block completion.
> 
---

### Exercise 3: Parallel vs Sequential Execution Performance

**Scenario:**
Compare sequential query execution against `PARALLEL` execution for independent lookups.

**Requirements:**
1. Explain when to use `PARALLEL` vs standard sequential blocks.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Use Sequential Blocks: When query step B depends on parameter output from query step A.
> Use PARALLEL Blocks: When query steps A, B, and C are completely independent and can run concurrently.
> ```
>
> #### Technical Explanation
>
> 1. `PARALLEL` optimizes latency for non-dependent read/write operations.
> 2. Sequential execution remains mandatory for dependent data pipelines.
> 3. Maximizes multi-core CPU utilization during complex query scripts.
> 
---



## 6. Related Terms

- [`UPDATE`](../level_03/update.md) — Bulk write statement.
- [SurrealDB Server (`surreal start`)](../level_01/surreal_start.md) — Server multi-threading context.
- [Query Explanation & Performance](../level_07/query_explanation.md) — Related concept: Query Explanation & Performance.

---

## 7. Key Takeaways
- The `PARALLEL` keyword instructs SurrealDB to process queries concurrently.
- Leverages multi-core CPU thread pools in Rust for multi-threaded execution.
- Dramatically accelerates bulk `UPDATE`, `DELETE`, and complex `SELECT` queries on large datasets.
- Avoid using `PARALLEL` on single-record lookups or small tables due to thread coordination overhead.
- Positioned at the end of the query statement.
