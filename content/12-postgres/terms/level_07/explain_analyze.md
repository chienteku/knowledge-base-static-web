# `EXPLAIN` / `EXPLAIN ANALYZE`

> **Level 7 — Indexes & Query Performance**
> The diagnostic SQL commands used to display the database query planner's execution strategy (`EXPLAIN`) and measure actual runtime performance metrics (`EXPLAIN ANALYZE`).

---

## 1. Prerequisites
- [Index (Concept)](index_concept.md) — The performance structures being diagnosed.
- [SQL (Structured Query Language)](../level_01/sql.md) — The parent language.

---

## 2. Term Category
- **PostgreSQL Command**

---

## 3. Environment Context
- **PostgreSQL Core** (Evaluated directly inside the query execution engine. Essential for performance profiling and index validation).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When an application's database queries start slowing down, developers cannot guess why. They need to know:
-   Is the query leveraging B-tree indexes or running slow sequential scans?
-   Is it joining tables in the most efficient order?
-   Are the database's row count estimates accurate?

We designed **`EXPLAIN`** and **`EXPLAIN ANALYZE`** to make the database's internal decision-making transparent. 

They display the **Execution Plan**: the tree of logical operations (scans, joins, sorts) that the database will use to execute the query.

---

### (2) EXPLAIN vs. EXPLAIN ANALYZE

-   **`EXPLAIN` (Estimation):** Shows the plan **without executing the query**. It is fast, safe, and displays cost estimations calculated by the query planner.
-   **`EXPLAIN ANALYZE` (Execution):** Actually **runs the query** on disk. It measures real-world execution times, memory usage, and loops, displaying a detailed comparison of the planner's estimates vs. actual runtime statistics.

---

### (3) The Write Mutation Danger
Because `EXPLAIN ANALYZE` actually executes the query, running it on an `UPDATE` or `DELETE` statement **will modify or delete your data!**

To safely analyze a write query in production, you must wrap it in a transaction block and roll it back:

```sql
BEGIN;
EXPLAIN ANALYZE DELETE FROM users WHERE active = FALSE;
ROLLBACK; -- Undoes the deletion, keeping data safe!
```

---

### (4) Reality Metaphor
Imagine planning a road trip:
-   **`EXPLAIN`** is like opening a mapping app. The app draws the route (highways vs side streets) and estimates the trip will take `2 hours` based on speed limits. The car never leaves the garage.
-   **`EXPLAIN ANALYZE`** is like actually driving the route. You start a stopwatch, drive the car, and record the real trip time (`2.5 hours` because you hit traffic).

---

### (5) Code Examples

#### Running EXPLAIN
Let's see the planner's estimations:

```sql
EXPLAIN SELECT * FROM users WHERE id = 105;
-- Output (estimates):
-- Index Scan using users_pkey on users  (cost=0.29..8.30 rows=1 width=56)
```

-   **`cost=0.29..8.30`:** Arbitrary unit scores. `0.29` is the cost to fetch the first row (startup); `8.30` is the total query cost.
-   **`rows=1`:** The planner estimates this query will yield 1 row.

#### Running EXPLAIN ANALYZE
Actually run and measure real times:

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE id = 105;
-- Output (actual measurements):
-- Index Scan using users_pkey on users  (cost=0.29..8.30 rows=1 width=56)
--   Index Cond: (id = 105)
-- Planning Time: 0.082 ms
-- Execution Time: 0.045 ms <-- Real time!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running EXPLAIN ANALYZE on DML write statements without a rollback

**The mistake:** Running `EXPLAIN ANALYZE DELETE FROM products;` to profile deletion performance, and accidentally wiping out the entire catalog.

**Why it's wrong:** Developers assume "EXPLAIN" queries are read-only. But "ANALYZE" forces execution. The database will delete the rows on disk, print the analysis log, and commit the deletion.

**Fix: Always run write profiling inside a `BEGIN` transaction block and end with `ROLLBACK`.**

---



### Mistake 2: Executing `EXPLAIN ANALYZE` on Destructive DML Queries Expecting Dry-Run Behavior

**The mistake:** Running `EXPLAIN ANALYZE DELETE FROM users WHERE active = false;` expecting it to be a dry run.

**Why it's wrong:** `EXPLAIN ANALYZE` ACTUALLY EXECUTES the query statement! Running `EXPLAIN ANALYZE DELETE` will delete real production data! Wrap destructive queries in a transaction with `ROLLBACK`.

*Incorrect:*
```sql
EXPLAIN ANALYZE DELETE FROM users; -- 💥 ACTUALLY DELETES REAL DATA!
```

*Fix:*
```sql
BEGIN;
EXPLAIN ANALYZE DELETE FROM users;
ROLLBACK; -- Safe dry-run analysis
```

### Mistake 3: Relying Solely on `EXPLAIN` (Without `ANALYZE`) for Runtime Latency Metrics

**The mistake:** Running `EXPLAIN SELECT ...` to measure query execution time in milliseconds.

**Why it's wrong:** `EXPLAIN` without `ANALYZE` returns estimated cost units (`cost=0.00..8.50`) from the query planner without executing the query. `ANALYZE` measures real execution time (`actual time=0.015..0.045`).

*Incorrect:*
```sql
EXPLAIN SELECT * FROM users; -- Returns cost estimates, NOT real execution milliseconds
```

*Fix:*
```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users; -- Real execution stats
```

## 6. Practice Exercises

### Exercise 1: Plan Analysis

**Problem:** You run an explain query and receive this output:
```text
Seq Scan on product_catalog  (cost=0.00..355.00 rows=10000 width=45)
  Filter: (price > 100.00)
```
1.  What scan type did the database use?
2.  Is there an index optimized for this query?
3.  How many rows does the planner estimate will match?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Scan Type: Sequential Scan (Seq Scan).
> 2. Index Check: No. The database had to scan the table sequentially, indicating that there is no active B-tree index on the `price` column.
> 3. Row Estimate: 10,000 rows.
> ```
> - Read the first line of the plan node.
> - Look for keywords like "Seq Scan" or "Index Scan".

---



### Exercise 2: Safe Execution Analysis of DML Query

**Problem:** Safely run `EXPLAIN (ANALYZE, BUFFERS)` on `UPDATE` query inside a transaction block rolled back at the end.

**Expected output:**
> [!check]- Answer
> ```text
> BEGIN; EXPLAIN (ANALYZE, BUFFERS) UPDATE users SET status = 'active' WHERE id = 1; ROLLBACK;
> ```
> ```sql
> BEGIN;
> EXPLAIN (ANALYZE, BUFFERS)
> UPDATE users SET status = 'active' WHERE id = 1;
> ROLLBACK;
> ```
>
> **Explanation:** Wrapping `EXPLAIN ANALYZE` inside `BEGIN...ROLLBACK` safely measures runtime execution without committing data mutations.

---

### Exercise 3: Key Metrics in EXPLAIN ANALYZE Output

**Problem:** List 3 essential metrics in `EXPLAIN ANALYZE` output (`actual time`, `rows`, `Buffers: shared hit/read`).

**Expected output:**
> [!check]- Answer
> ```text
> actual time, rows, Buffers (shared hit/read)
> ```
> ```text
> actual time, rows, Buffers (shared hit/read)
> ```
>
> **Explanation:** Actual time measures execution milliseconds; Buffers report RAM cache hit vs disk read metrics.

## 7. Related Terms
- [Query Planner / Optimizer](query_planner.md) — The engine generating the plans.
- [Sequential Scan vs. Index Scan](seq_scan_vs_index_scan.md) — The two scan behaviors.

---

## 8. Key Takeaways
- `EXPLAIN` displays query plans without running queries; safe for production.
- `EXPLAIN ANALYZE` executes queries to measure actual timing and loop stats.
- Reveals if query plans are using B-tree indexes or slow Sequential Scans.
- Cost metrics represent arbitrary units computed by the query planner.
- Always wrap write query checks inside transaction rollbacks to prevent mutations.
- Essential for diagnosing index failures, slow joins, and query optimizer bugs.
