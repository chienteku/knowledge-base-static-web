# `pg_stat_statements` / Monitoring

> **Level 10 — Administration, Security & Production**
> The database monitoring system views and extensions (like `pg_stat_statements`) used to track query execution times, identify performance bottlenecks, and monitor active connection states in production.

---

## 1. Prerequisites
- [Extensions (`CREATE EXTENSION`)](extensions.md) — The packaging system used to enable `pg_stat_statements`.
- [`EXPLAIN` / `EXPLAIN ANALYZE`](../level_07/explain_analyze.md) — Analyzing the individual slow queries identified by monitoring.

---

## 2. Term Category
- **Database Administration / Monitoring**

---

## 3. Environment Context
- **PostgreSQL Core** (Requires adding `pg_stat_statements` to the `shared_preload_libraries` parameter in `postgresql.conf` and restarting the server because it allocates shared RAM buffers to track queries globally).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In production, you cannot wait for users to email support saying *"The website is slow"* before you look at query performance. 

You need proactive metrics:
-   Which SQL queries are taking up the most database CPU time?
-   Which queries are running right now, and are any blocking connection slots?
-   What percentage of queries are reading from fast RAM vs. slow hard drives?

We designed **PostgreSQL Monitoring Views** and the **`pg_stat_statements`** extension to make the database server's health transparent in real-time.

---

### (2) The Key Monitoring Views

#### 1. `pg_stat_statements` (Query Bottlenecks)
This extension aggregates metrics for all queries run on the server: it groups similar queries (replacing specific parameters with `$1`, `$2`), and records how many times they ran (`calls`), total time spent, and rows returned. 

This is the first place a DBA checks to find queries that need index optimization.

#### 2. `pg_stat_activity` (Real-Time Sessions)
Shows every active connection process in the database. 

It lists the client IP, login username, current running query, and how long the query has been running. 

If a query freezes due to a lock, you can locate its Process ID (PID) here and terminate it.

---

### (3) Cache Hit Ratio (The Speed Indicator)
A critical metric calculated from `pg_stat_database`. 

It measures what percentage of data page reads were resolved in the RAM shared buffers (`shared_buffers`) versus reading from the hard drive.
-   *Production Target:* **>99%**. If it drops lower, your server needs more RAM or optimized indexes to prevent reading slow disk sectors.

---

### (4) Reality Metaphor
Imagine managing a factory power plant:
-   **Flying Blind (No Monitoring):** You only know something is wrong when the power plant explodes or the factory lights go out.
-   **With Monitoring:** You stand in front of a **Control Panel dashboard** containing dials and graphs showing:
    -   Which specific machine is drawing the most electrical current (`pg_stat_statements`).
    -   How many workers are currently inside the turbine rooms (`pg_stat_activity`).
    -   The efficiency ratio of recycled steam water vs. wasted water (Cache Hit Ratio).

---

### (5) Code Examples

#### 1. Finding Long-Running Queries (pg_stat_activity)
Find queries that have been running for more than 5 seconds right now:

```sql
SELECT pid, usename, query_start, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND (now() - query_start) > interval '5 seconds';
```

If you find a blocked query (e.g. pid `4512`) that is freezing your app, you can cancel it:

```sql
-- Safely cancel only the active query (connection stays open)
SELECT pg_cancel_backend(4512);

-- Or forcefully kill the entire connection process immediately
SELECT pg_terminate_backend(4512);
```

#### 2. Finding the Top 5 Slowest Queries (pg_stat_statements)
Once the extension is enabled, search for queries consuming the most total time:

```sql
SELECT 
  query, 
  calls, 
  total_exec_time / 1000 AS total_exec_seconds,
  mean_exec_time AS average_ms,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 5;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Enabling pg_stat_statements in SQL without adding it to postgresql.conf

**The mistake:** Running `CREATE EXTENSION pg_stat_statements;` and getting a failure saying the library must be preloaded.

**Why it's wrong:** To track query stats globally across all connections, the extension's code must load into memory during PostgreSQL server bootup. You cannot enable it on-the-fly without changing server configs first.

**Fix: Edit your `postgresql.conf` file, add `pg_stat_statements` to the `shared_preload_libraries` list, restart the PostgreSQL service, and *then* run the DDL query.**

```text
# Inside postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
```

---



### Mistake 2: Failing to Enable `pg_stat_statements` Extension for Query Performance Monitoring

**The mistake:** Running production PostgreSQL database without installing `pg_stat_statements` extension.

**Why it's wrong:** Without `pg_stat_statements`, identifying slow, resource-heavy SQL queries requires parsing log files. `pg_stat_statements` tracks execution counts, total time, and CPU usage for all queries.

*Incorrect:*
```sql
// Operating production Postgres without pg_stat_statements
```

*Fix:*
```sql
Add 'pg_stat_statements' to shared_preload_libraries and CREATE EXTENSION pg_stat_statements;
```

### Mistake 3: Ignoring `pg_stat_activity` Long-Running `Idle in Transaction` Sessions

**The mistake:** Allowing client connections to remain `idle in transaction` for hours.

**Why it's wrong:** `Idle in transaction` connections hold open table locks and block `VACUUM` dead tuple cleanup. Monitor `pg_stat_activity` and set `idle_in_transaction_session_timeout`.

*Incorrect:*
```sql
// Ignoring idle in transaction sessions in pg_stat_activity
```

*Fix:*
```sql
SET idle_in_transaction_session_timeout = '10s';
```

## 6. Practice Exercises

### Exercise 1: Diagnostic Query Parsing

**Problem:** You query `pg_stat_statements` and see this record:
-   `query`: `SELECT * FROM articles WHERE id = $1`
-   `calls`: `1,000,000`
-   `mean_exec_time` (average): `0.05 ms`
-   `total_exec_time` (total): `50,000 ms` (50 seconds)
1.  Is this individual query slow?
2.  Should you spend time optimizing it? Explain why.

**Expected output:**
> [!check]- Answer
> ```text
> 1. No, the query is extremely fast (average execution time is 0.05 ms, indicating it is using a primary key index scan).
> 2. No, you should not spend time optimizing it. Although it is the highest consumer of total execution time (50 seconds), this is simply because it was called 1 million times. Because the average speed is already optimal, there is no way to make it faster. Focus your efforts instead on queries that have a high `mean_exec_time` (e.g. 500ms), even if they have fewer calls.
> ```
> - Differentiate the query's average speed (`mean_exec_time`) from its cumulative load (`total_exec_time`).
> - Focus optimization efforts on queries with poor average performance.

---



### Exercise 2: Querying Top 5 Slowest Queries via pg_stat_statements

**Problem:** Query top 5 queries by mean execution time from `pg_stat_statements`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT query, calls, total_exec_time, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5;
> ```
> ```sql
> SELECT query, calls, total_exec_time, mean_exec_time
> FROM pg_stat_statements
> ORDER BY mean_exec_time DESC LIMIT 5;
> ```
>
> **Explanation:** `pg_stat_statements` tracks aggregated query execution metrics across all client connections.

---

### Exercise 3: Querying Active Long-Running Queries

**Problem:** Query active queries running for longer than 5 seconds from `pg_stat_activity`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > INTERVAL '5 seconds';
> ```
> ```sql
> SELECT pid, now() - query_start AS duration, query
> FROM pg_stat_activity
> WHERE state = 'active'
>   AND now() - query_start > INTERVAL '5 seconds';
> ```
>
> **Explanation:** `pg_stat_activity` monitors real-time active backend connection queries.

## 7. Related Terms
- [Extensions (`CREATE EXTENSION`)](extensions.md) — The packaging system.
- [`postgresql.conf` (Server Configuration)](postgresql_conf.md) — Setting preloads.

---

## 8. Key Takeaways
- PostgreSQL monitoring views provide real-time metrics on server health.
- `pg_stat_statements` tracks execution calls and times for all SQL queries.
- `pg_stat_activity` monitors current active connection states and processes.
- Use `pg_cancel_backend(pid)` to cancel long-running, blocked queries.
- Cache Hit Ratio indicates what percentage of reads are resolved in RAM.
- `pg_stat_statements` requires preloading in `postgresql.conf` before activation.
- Essential for database administrators to maintain production performance.
