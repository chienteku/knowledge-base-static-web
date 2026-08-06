# `EXPLAIN` / `EXPLAIN ANALYZE`

> **Level 7 — Indexes & Query Performance**
> The diagnostic SQL commands used to display the database query planner's execution strategy (`EXPLAIN`) and measure actual runtime performance metrics (`EXPLAIN ANALYZE`).

---

## 1. Prerequisites
- [Index (Concept)](index_concept.md) — The performance structures being diagnosed.
- [SQL (Structured Query Language)](../level_01/sql.md) — The parent language.

---

## 2. Term Category

**Performance / Optimization** (Query Execution Plan Diagnostic): `EXPLAIN ANALYZE` executes queries and displays physical query plan nodes, row estimates, scan types, and exact millisecond execution times.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Evaluated directly inside the query execution engine. Essential for performance profiling and index validation).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Reading Physical Execution Plans with EXPLAIN ANALYZE

**Scenario:**
Execute `EXPLAIN (ANALYZE, BUFFERS)` to inspect query planning time, execution time, scan types, and shared buffer hits.

**Requirements:**
1. Execute `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users WHERE email = 'alice@example.com'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> EXPLAIN (ANALYZE, BUFFERS) 
> SELECT * FROM users 
> WHERE email = 'alice@example.com';
> ```
>
> #### Technical Explanation
>
> 1. `EXPLAIN` shows the estimated query plan; `ANALYZE` actually *executes* the query and records exact execution statistics.
> 2. `BUFFERS` reports RAM cache hits (`shared hit`) vs disk page reads (`shared read`).
> 3. Displays node types (`Index Scan`, `Seq Scan`, `Hash Join`) and exact millisecond timings.

---

### Exercise 2: Diagnosing Table Scans (`Seq Scan`)

**Scenario:**
Identify a slow `Seq Scan` on table `orders` and verify that creating an index converts execution to `Index Scan`.

**Requirements:**
1. Run `EXPLAIN ANALYZE`, create index, re-run `EXPLAIN ANALYZE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- 1. Inspect un-indexed query (shows Seq Scan on orders)
> EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
> 
> -- 2. Create index
> CREATE INDEX idx_orders_status ON orders(status);
> 
> -- 3. Inspect indexed query (shows Bitmap Index Scan)
> EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
> ```
>
> #### Technical Explanation
>
> 1. `Seq Scan` reads every 8KB table page sequentially from disk, resulting in $O(N)$ high execution times on large tables.
> 2. `Bitmap Index Scan` uses the index to construct a tuple bitmap, jumping directly to target table pages.
> 3. Empirical verification of index performance optimizations.

---

### Exercise 3: Identifying Estimation Skew (Row Count Discrepancy)

**Scenario:**
Spot an estimation discrepancy between `rows=1` (planner estimate) vs `actual rows=50000` in plan node outputs.

**Requirements:**
1. Explain causes of query planner row estimation skew and resolve with `ANALYZE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- Run ANALYZE to update stale table statistics catalog
> ANALYZE orders;
> ```
>
> #### Technical Explanation
>
> 1. Severe discrepancies between estimated `rows` and `actual rows` indicate stale catalog statistics in `pg_statistic`.
> 2. Estimation skew causes the planner to choose sub-optimal join types (e.g. choosing Nested Loop instead of Hash Join).
> 3. Running `ANALYZE` updates catalog statistics and restores accurate query planning.

---



## 6. Related Terms
- [Query Planner / Optimizer](query_planner.md) — The engine generating the plans.
- [Sequential Scan vs. Index Scan](seq_scan_vs_index_scan.md) — The two scan behaviors.
- [Index (Concept)](index_concept.md) — Related concept: Index (Concept).

---

## 7. Key Takeaways
- `EXPLAIN` displays query plans without running queries; safe for production.
- `EXPLAIN ANALYZE` executes queries to measure actual timing and loop stats.
- Reveals if query plans are using B-tree indexes or slow Sequential Scans.
- Cost metrics represent arbitrary units computed by the query planner.
- Always wrap write query checks inside transaction rollbacks to prevent mutations.
- Essential for diagnosing index failures, slow joins, and query optimizer bugs.
