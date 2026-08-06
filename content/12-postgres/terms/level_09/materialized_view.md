# Materialized View

> **Level 9 — Views, Functions & Advanced SQL**
> A specialized database view that physically executes its defining query and saves the results to disk, acting as a cached read-only table that must be manually or scheduled to refresh.

---

## 1. Prerequisites
- [View](view.md) — The parent virtual table concept.

---

## 2. Term Category

**Advanced Feature** (Persisted Aggregate View Caches): Materialized Views persist aggregation query results into physical disk tables, supporting online asynchronous cache updates (`REFRESH MATERIALIZED VIEW`).



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Fully supported. Requires a unique index on the view to run background, lock-free **`CONCURRENTLY`** refreshes).

### (1) Design Motivation — "Why did we design this?"
In `view.md`, we learned that standard views evaluate on-the-fly, which means they do not speed up heavy queries.

If you are building an executive dashboard that reads 20 million sales logs to calculate monthly totals:
-   Executing that heavy query every time a manager refreshes the dashboard chokes the database CPU.
-   However, monthly sales figures do not change every second. It is acceptable if the dashboard shows data cached from an hour ago.

We designed the **Materialized View** to solve this heavy-query bottleneck. 

Unlike a standard view, a materialized view physically executes the query once, compiles the outputs, and writes them to a new table file on the hard drive. 

When users query the materialized view, Postgres reads the cached records directly off disk in microseconds, bypassing the heavy joins and counts.

---

### (2) The Cache Refresh Duty
Because materialized views store physical data snapshots on disk, **they do not update automatically when base tables change.** 

If you add a new transaction log, the materialized view is out-of-sync.

To sync the data, you must run the refresh command:
`REFRESH MATERIALIZED VIEW mv_sales_summaries;`

By default, refreshing locks the materialized view, blocking users from reading it. 

Postgres supports **`REFRESH MATERIALIZED VIEW CONCURRENTLY`** to refresh the cache in the background without blocking read traffic. 

*Requirement:* To use concurrent refreshing, the materialized view must have at least one `UNIQUE` index.

---

### (3) Reality Metaphor
Imagine shopping at a massive furniture store:
-   **Standard View:** Looking through a glass window directly at the warehouse floor. If a forklift moves a couch, you see it shift instantly.
-   **Materialized View:** A printed **Paper Catalog Book** printed on Monday. It is fast to carry and check item prices (reads are instant), but if someone buys a couch on Tuesday, the printed catalog is out-of-date. You must print a new edition of the catalog (run a `REFRESH`) to update the pages.

---

### (4) Code Examples

#### Creating and Indexing a Materialized View
```sql
CREATE TABLE transaction_logs (
  id INT PRIMARY KEY,
  amount NUMERIC(10,2),
  logged_at TIMESTAMP
);

INSERT INTO transaction_logs VALUES (1, 150.00, NOW());

-- 1. Create the Materialized View
CREATE MATERIALIZED VIEW mv_hourly_totals AS
SELECT DATE_TRUNC('hour', logged_at) AS hour_bucket, SUM(amount) AS total_sales
FROM transaction_logs
GROUP BY 1;

-- 2. Create a unique index to support concurrent refreshing
CREATE UNIQUE INDEX idx_mv_hour_bucket ON mv_hourly_totals(hour_bucket);
```

#### Verifying Snapshot Stale Behavior
```sql
-- Insert a new log
INSERT INTO transaction_logs VALUES (2, 50.00, NOW());

-- Querying the materialized view still shows the old total (150.00)
SELECT * FROM mv_hourly_totals;

-- 3. Run background refresh to update cache
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hourly_totals;

-- Query now shows the updated total (200.00)
SELECT * FROM mv_hourly_totals;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using materialized views for real-time transactional operations

**The mistake:** Using a materialized view to check if a user has enough funds in their bank account before approving a cash withdrawal.

**Why it's wrong:** Materialized views are cached snapshots. If a user withdraws `$50` at an ATM, but the materialized view hasn't been refreshed yet, the view will display the old balance. The user can exploit this to withdraw money multiple times, resulting in overdrafts.

**Fix: Only use materialized views for analytics, charts, reporting, or summary tables where displaying slightly stale data (minutes or hours old) is acceptable. For transactional business rules, always query base tables directly.**

---



### Mistake 2: Running Non-Concurrent `REFRESH MATERIALIZED VIEW` Blocking Concurrent Queries

**The mistake:** Executing `REFRESH MATERIALIZED VIEW sales_summary;` on a view taking 5 minutes to compute.

**Why it's wrong:** Standard `REFRESH MATERIALIZED VIEW` acquires an `EXCLUSIVE` lock, blocking all `SELECT` queries on the view for 5 minutes! Use `REFRESH MATERIALIZED VIEW CONCURRENTLY`.

*Incorrect:*
```sql
REFRESH MATERIALIZED VIEW sales_summary; -- ❌ Blocks all SELECT queries during refresh!
```

*Fix:*
```sql
CREATE UNIQUE INDEX idx_sales_summary_id ON sales_summary (id);
REFRESH MATERIALIZED VIEW CONCURRENTLY sales_summary; -- Non-blocking refresh
```

### Mistake 3: Executing `REFRESH MATERIALIZED VIEW CONCURRENTLY` Without a Supporting Unique Index

**The mistake:** Running `REFRESH MATERIALIZED VIEW CONCURRENTLY view_name;` when the view lacks a unique index.

**Why it's wrong:** Concurrent refresh REQUIRES at least one unique index on the materialized view! Without a unique index, concurrent refresh fails with error `cannot refresh materialized view concurrently without a unique index`.

*Incorrect:*
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY view_name; -- ❌ Error: missing unique index!
```

*Fix:*
```sql
CREATE UNIQUE INDEX idx_mv_id ON view_name (id);
REFRESH MATERIALIZED VIEW CONCURRENTLY view_name;
```

## 5. Practice Exercises

### Exercise 1: Creating Materialized Views for Aggregation Caching

**Scenario:**
Create a Materialized View `mv_monthly_sales_summary` caching heavy aggregate calculations over table `orders`.

**Requirements:**
1. Execute `CREATE MATERIALIZED VIEW mv_monthly_sales_summary AS SELECT DATE_TRUNC('month', created_at) ...`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE MATERIALIZED VIEW mv_monthly_sales_summary AS 
> SELECT 
>   DATE_TRUNC('month', created_at) AS sales_month,
>   COUNT(*) AS total_orders,
>   SUM(total_cents) / 100.0 AS total_revenue 
> FROM orders 
> GROUP BY sales_month;
> 
> CREATE UNIQUE INDEX idx_mv_sales_month ON mv_monthly_sales_summary(sales_month);
> ```
>
> #### Technical Explanation
>
> 1. `CREATE MATERIALIZED VIEW` executes the underlying query once and persists the result set to a physical disk table.
> 2. Sub-millisecond read velocity over millions of historical rows.
> 3. Creating a unique index allows concurrent background refreshing.
> 
---

### Exercise 2: Concurrent Zero-Downtime Refreshing

**Scenario:**
Refresh `mv_monthly_sales_summary` online without locking concurrent read queries using `CONCURRENTLY`.

**Requirements:**
1. Execute `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_sales_summary`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_sales_summary;
> ```
>
> #### Technical Explanation
>
> 1. Standard `REFRESH MATERIALIZED VIEW` acquires an exclusive lock blocking concurrent SELECT queries.
> 2. `CONCURRENTLY` updates cache data in the background without blocking active read queries.
> 3. Requires a unique index on the materialized view.
> 
---

### Exercise 3: Trade-Off Analysis: Standard Views vs Materialized Views

**Scenario:**
Formulate a selection matrix comparing standard Virtual Views against Materialized Views.

**Requirements:**
1. Contrast compute freshness, disk storage, and read query speed.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> View Architecture Selection Matrix:
> - Standard View: Zero disk storage, 100% real-time data freshness, executes query on every SELECT (higher CPU/latency).
> - Materialized View: Consumes disk space, data is stale until REFRESH, instant sub-millisecond query execution.
> Selection Rule: Use Standard Views for lightweight abstractions; use Materialized Views for expensive multi-table analytical aggregations.
> ```
>
> #### Technical Explanation
>
> 1. Standard Views provide logical encapsulation; Materialized Views provide physical performance caching.
> 2. Trade data freshness for read execution speed.
> 3. High performance analytics architecture.
> 
---



## 6. Related Terms
- [View](view.md) — The parent virtual view concept.
- [Denormalization](../level_06/denormalization.md) — The caching design theory.

---

## 7. Key Takeaways
- A Materialized View physically saves its query results to disk files.
- Acts as a cached snapshotted table to speed up heavy analytics queries.
- Does not update automatically; base table changes are invisible until refreshed.
- Run `REFRESH MATERIALIZED VIEW` to manually synchronize data.
- Use `REFRESH ... CONCURRENTLY` in production to prevent read blocks.
- Concurrent refreshing requires defining a `UNIQUE` index on the materialized view.
- Perfect for reporting databases; dangerous for real-time transactions.
