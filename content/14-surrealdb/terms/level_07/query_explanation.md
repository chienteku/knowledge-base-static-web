# Query Explanation & Performance

> **Level 7 — Indexes, Full-Text Search & Performance**
> The techniques, profiling flags, and query analysis strategies in SurrealDB used to inspect query execution plans, verify index utilization, and optimize slow-running database operations.

---

## 1. Prerequisites

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The index architecture.
- [SurrealDB CLI (`surreal sql`)](../level_01/surreal_cli.md) — Interactive CLI tools.

---

## 2. Term Category


**Performance / Operations (EXPLAIN query execution plan analysis)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When an application query runs slowly in production:
- Guessing why it is slow (Is it doing a full table scan? Is an index being ignored? Is a join path failing?) leads to wasted optimization effort.
- Developers need concrete execution telemetry showing how the database engine parsed and executed the query.

In PostgreSQL, developers use `EXPLAIN ANALYZE`. In MongoDB, developers call `.explain()`.

We designed **Query Explanation & Performance** tools in SurrealDB to provide query execution transparency. Using query explanation options, developers can inspect whether the query planner selected a B-Tree index, how many records were scanned, and the execution time in milliseconds, allowing targeted performance tuning.

---

### (2) Performance Tuning Checklist

When optimizing a slow SurrealQL query, follow these four rules:

1. **Verify Index Selection:**
   Check if the fields inside the `WHERE` clause have active B-Tree, FTS, or spatial indexes defined.
2. **Check Record Link Indexing:**
   Ensure reverse filtering queries (`WHERE child_link = parent_id`) have B-Tree indexes defined on the link fields.
3. **Use Projection Fields (Avoid `SELECT *`):**
   Request only necessary fields (`SELECT id, name`) to reduce memory allocation and network payload serialization.
4. **Leverage `PARALLEL` for Bulk Writes:**
   Append `PARALLEL` to bulk `UPDATE` or `DELETE` statements on large tables to distribute writes across CPU cores.

---

### (3) Reality Metaphor (Vehicle Diagnostic Scanner)
Imagine troubleshooting a car engine that is losing power:
- **Guessing (No Explanation):** Randomly replacing spark plugs, changing tires, and refilling oil without checking what's wrong.
- **Query Explanation Tool:** Plugging a **Diagnostic Scanner Tool** into the car's OBD-II port.
  - The scanner reads error codes and sensor output: *"Cylinder 3 is misfiring due to low fuel pressure."*
  - You fix the exact misfiring fuel injector without touching any other part of the engine.

---

### (4) Code Examples

#### Profiling and Optimizing SurrealQL Queries

```sql
-- 1. Unoptimized query (Full Table Scan on unindexed status field)
SELECT * FROM order WHERE status = "pending";

-- 2. Applying index optimization
DEFINE INDEX idx_order_status ON order COLUMNS status;

-- Now SurrealDB query engine automatically routes the query through idx_order_status B-Tree!
SELECT * FROM order WHERE status = "pending";

-- 3. Optimizing projection payloads (Select specific fields instead of SELECT *)
SELECT id, title, price FROM product WHERE category = "electronics";
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on 'SELECT *' in high-throughput API endpoints, inflating memory usage and slowing down JSON serialization

**The mistake:** Fetching entire documents (`SELECT *`) when the client application only displays the record `id` and `name`.

**Why it's wrong:** `SELECT *` forces SurrealDB to read all nested objects, arrays, and fields from disk, construct full JSON memory trees, and transfer large network payloads.

**Fix: Specify only the required fields in `SELECT` projections:**

```sql
-- BAD
SELECT * FROM user WHERE active = true;

-- GOOD
SELECT id, username, email FROM user WHERE active = true;
```

---



### Mistake 2: Ignoring `EXPLAIN` Query Plan Outputs Before Deploying Complex Queries

**The mistake:** Deploying un-indexed multi-field filter queries to production without inspecting `EXPLAIN` execution plans.

**Why it's wrong:** Running `EXPLAIN` (or `EXPLAIN FULL`) reveals whether a query performs an efficient index scan vs a slow full table scan.

*Incorrect:*
```surrealql
-- Deploying without checking plan
SELECT * FROM user WHERE role = "admin" AND active = true;
```

*Fix:*
```surrealql
EXPLAIN FULL SELECT * FROM user WHERE role = "admin" AND active = true; // Inspect plan for full table scan
```

### Mistake 3: Confusing `EXPLAIN` (Plan Only) with `EXPLAIN FULL` (Detailed Plan & Statistics)

**The mistake:** Running `EXPLAIN` expecting detailed execution time metrics.

**Why it's wrong:** `EXPLAIN` shows the query execution plan. `EXPLAIN FULL` provides detailed execution plan breakdowns.

*Incorrect:*
```surrealql
EXPLAIN SELECT * FROM user;
```

*Fix:*
```surrealql
EXPLAIN FULL SELECT * FROM user;
```

## 5. Practice Exercises

### Exercise 1: Query Execution Plan Inspection with `EXPLAIN`

**Scenario:**
A database administrator inspects a slow `SELECT` query execution plan using `EXPLAIN` to determine whether an index was used.

**Requirements:**
1. Execute `EXPLAIN SELECT * FROM user WHERE email = "alice@example.com"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> EXPLAIN SELECT * FROM user WHERE email = "alice@example.com";
> ```
>
> #### Technical Explanation
>
> 1. `EXPLAIN` returns query planner execution details without running full document fetches.
> 2. Details whether the query executed a table scan (`FullScan`) or an index lookup (`IndexScan`).
> 3. Essential tool for identifying missing secondary indexes.

---

### Exercise 2: Detailed Execution Metrics with `EXPLAIN FULL`

**Scenario:**
Inspect actual execution timings, records scanned, and index fetch counts by running `EXPLAIN FULL`.

**Requirements:**
1. Execute `EXPLAIN FULL SELECT * FROM user WHERE email = "alice@example.com"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> EXPLAIN FULL SELECT * FROM user WHERE email = "alice@example.com";
> ```
>
> #### Technical Explanation
>
> 1. `EXPLAIN FULL` executes the query and returns empirical execution metrics (time taken, memory, rows evaluated).
> 2. Highlights query bottlenecks in multi-join or graph-heavy operations.
> 3. Guides query performance tuning and index optimization.

---

### Exercise 3: Comparing Table Scans vs Index Lookups

**Scenario:**
Compare `EXPLAIN` outputs before and after defining an index on `user(email)`.

**Requirements:**
1. Compare `FullScan` output vs `IndexScan` output.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Before Index: { detail: "FullScan", records_evaluated: 100000 }
> After Index:  { detail: "IndexScan(idx_user_email)", records_evaluated: 1 }
> ```
>
> #### Technical Explanation
>
> 1. `FullScan` indicates the engine scanned every record in the table sequentially ($O(N)$).
> 2. `IndexScan` indicates the engine used a B-tree index to jump directly to target records ($O(\log N)$).
> 3. Verifies index utilization before deploying production queries.

---



## 6. Related Terms

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [Composite Index](composite_index.md) — Multi-column optimization.
- [`PARALLEL` Keyword](../level_06/parallel_keyword.md) — Multi-threaded execution.

---

## 7. Key Takeaways
- Query explanation tools help identify full table scans and slow execution steps.
- Always index fields referenced in `WHERE` filters to achieve $O(\log N)$ performance.
- Index record link fields to accelerate reverse relationship queries.
- Project specific fields (`SELECT id, name`) instead of `SELECT *` to save memory.
- Use `PARALLEL` on bulk operations to leverage multi-threaded CPU execution.
