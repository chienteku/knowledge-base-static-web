# Materialized View

> **Level 9 — Views, Functions & Advanced SQL**
> A specialized database view that physically executes its defining query and saves the results to disk, acting as a cached read-only table that must be manually or scheduled to refresh.

---

## 1. Prerequisites
- [View](view.md) — The parent virtual table concept.
---

## 2. Term Category
- **Database Object / Abstraction Layer**

---

## 3. Environment Context
- **PostgreSQL Core** (Fully supported. Requires a unique index on the view to run background, lock-free **`CONCURRENTLY`** refreshes).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Analytics View Setup

**Problem:** You have a `clicks` table containing millions of records. Write the SQL queries to:
1.  Create a materialized view named `mv_clicks_by_device` that counts total click records grouped by the `device_type` column.
2.  Write the command to rebuild and refresh the cache concurrently in the background (assume a unique index is already active on the device type).

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE MATERIALIZED VIEW mv_clicks_by_device AS
> SELECT device_type, COUNT(*) AS click_count
> FROM clicks
> GROUP BY device_type;
> 
> REFRESH MATERIALIZED VIEW CONCURRENTLY mv_clicks_by_device;
> ```
> - Remember to include the `MATERIALIZED` keyword in the view creation command.
> - Specify `CONCURRENTLY` in the refresh command to avoid table locks.

---



### Exercise 2: Creating Materialized View and Unique Index

**Problem:** Create materialized view `mv_daily_sales` summarizing daily total sales and create unique index on `sale_date`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE MATERIALIZED VIEW mv_daily_sales AS SELECT DATE(created_at) AS sale_date, SUM(total) AS total_sales FROM orders GROUP BY DATE(created_at); CREATE UNIQUE INDEX idx_mv_sale_date ON mv_daily_sales (sale_date);
> ```
> ```sql
> CREATE MATERIALIZED VIEW mv_daily_sales AS
> SELECT DATE(created_at) AS sale_date, SUM(total) AS total_sales
> FROM orders GROUP BY DATE(created_at);
> CREATE UNIQUE INDEX idx_mv_sale_date ON mv_daily_sales (sale_date);
> ```
>
> **Explanation:** Materialized views cache computed query results physically on disk.

---

### Exercise 3: Refreshing Materialized View Concurrently

**Problem:** Refresh `mv_daily_sales` concurrently without blocking reader queries.

**Expected output:**
> [!check]- Answer
> ```text
> REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
> ```
> ```sql
> REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
> ```
>
> **Explanation:** `CONCURRENTLY` uses unique indexes to swap updated materialized view pages without locking readers.

## 7. Related Terms
- [View](view.md) — The parent virtual view concept.
- [Denormalization](../level_06/denormalization.md) — The caching design theory.
---

## 8. Key Takeaways
- A Materialized View physically saves its query results to disk files.
- Acts as a cached snapshotted table to speed up heavy analytics queries.
- Does not update automatically; base table changes are invisible until refreshed.
- Run `REFRESH MATERIALIZED VIEW` to manually synchronize data.
- Use `REFRESH ... CONCURRENTLY` in production to prevent read blocks.
- Concurrent refreshing requires defining a `UNIQUE` index on the materialized view.
- Perfect for reporting databases; dangerous for real-time transactions.
