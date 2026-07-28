# Query Explanation & Performance

> **Level 7 — Indexes, Full-Text Search & Performance**
> The techniques, profiling flags, and query analysis strategies in SurrealDB used to inspect query execution plans, verify index utilization, and optimize slow-running database operations.

---

## 1. Prerequisites
- [DEFINE INDEX (Deep Dive)](define_index.md) — The index architecture.
- [SurrealDB CLI (`surreal sql`)](../level_01/surreal_cli.md) — Interactive CLI tools.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the query planner and execution engine. Logs execution telemetry and index search tree statistics during statement processing).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Query Optimization Diagnosis

**Problem:** You have a `logs` table with 2,000,000 records.
The query `SELECT * FROM logs WHERE severity = "ERROR" AND created_at >= d"2026-07-01T00:00:00Z";` takes 4.5 seconds to run.
Write the SurrealQL command to create the single most effective composite index to optimize both filters.

**Expected output:**
> [!check]- Answer
> ```sql
> DEFINE INDEX idx_logs_severity_date ON logs COLUMNS severity, created_at;
> ```
> - Combine `severity` and `created_at` in a composite index.
> - The leftmost column should match the exact match filter (`severity`).

---



### Exercise 2: Running Query Explanation

**Problem:** Run `EXPLAIN FULL` on query `SELECT * FROM user WHERE email = 'alice@example.com'`.

**Expected output:**
> [!check]- Answer
> ```text
> EXPLAIN FULL SELECT * FROM user WHERE email = 'alice@example.com';
> ```
> ```surrealql
> EXPLAIN FULL SELECT * FROM user WHERE email = 'alice@example.com';
> ```
>
> **Explanation:** `EXPLAIN FULL` outputs the database query execution plan and index utilization details.

---

### Exercise 3: Identifying Full Table Scans in Query Plans

**Problem:** What property in `EXPLAIN` output indicates an index was utilized? (`FETCH` / `INDEX` plan operator).

**Expected output:**
> [!check]- Answer
> ```text
> INDEX operator presence in execution plan steps
> ```
> ```text
> INDEX operator presence in execution plan steps
> ```
>
> **Explanation:** `EXPLAIN` plan steps display whether `INDEX` range scans or full table scans are used.

## 7. Related Terms
- [DEFINE INDEX (Deep Dive)](define_index.md) — The parent index context.
- [Composite Index](composite_index.md) — Multi-column optimization.
- [`PARALLEL` Keyword](../level_06/parallel_keyword.md) — Multi-threaded execution.

---

## 8. Key Takeaways
- Query explanation tools help identify full table scans and slow execution steps.
- Always index fields referenced in `WHERE` filters to achieve $O(\log N)$ performance.
- Index record link fields to accelerate reverse relationship queries.
- Project specific fields (`SELECT id, name`) instead of `SELECT *` to save memory.
- Use `PARALLEL` on bulk operations to leverage multi-threaded CPU execution.
