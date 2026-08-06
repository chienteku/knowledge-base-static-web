# MongoDB Profiler (`db.setProfilingLevel()`)

> **Level 10 — Administration, Security & Advanced Features**
> MongoDB's built-in query analysis tool that monitors and logs slow-running database operations into the capped `system.profile` collection, serving as the direct equivalent of PostgreSQL's `log_min_duration_statement` configuration.

---

## 1. Prerequisites

- [`explain()` Method](../level_07/explain.md) — The single query analyzer.
- [`serverStatus` / `currentOp` / `db.stats()`](server_diagnostics.md) — The parent monitoring tools.

---

## 2. Term Category

**Administration / Operations** (Slow Query Performance Diagnostic Profiler): The Database Profiler logs query execution metrics, lock wait times, and scan counts for queries exceeding a execution threshold into `system.profile`.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Configured per database. When enabled, operations are logged into the system-created `system.profile` capped collection).

### (1) Design Motivation — "Why did we design this?"
While the `explain()` method is great for testing a single query you suspect is slow, it cannot monitor live production environments:
-   You don't know which queries users are executing in real-time.
-   You cannot guess which combination of parameters is causing latency spikes.

In PostgreSQL, you identify production bottlenecks by enabling `log_min_duration_statement` to write slow statements to log files.

We designed the **Database Profiler** to automate this query auditing natively inside MongoDB. 

Instead of writing to external server log files, the profiler writes diagnostics directly into a queryable MongoDB collection (`system.profile`). 

This allows you to query, sort, and analyze slow queries using standard MongoDB filters, making it easy to identify which fields need indexes.

---

### (2) The Three Profiling Levels
You configure the profiler behavior using the `db.setProfilingLevel(level, options)` helper method:

-   **Level `0` (Off):** The default. No profiling data is captured.
-   **Level `1` (Slow Operations Only):** The recommended production setting. Logs only operations that take longer than a specified threshold (e.g. `slowms: 100` milliseconds).
-   **Level `2` (All Operations):** Logs every single database operation. Useful for local development debugging, but causes severe performance degradation in production.

---

### (3) Reality Metaphor (Security Hallway Cameras)
Imagine monitoring traffic in an office building hallway:
-   **Level 0 (Off):** The security camera is unplugged. You save electricity, but you have no logs.
-   **Level 1 (Motion-Activated):** The camera has a **Speed Sensor**. 
    -   It sits idle while people walk normally. 
    -   However, if someone runs down the hall at high speed (exceeds the `slowms` threshold), the camera activates, logs their photo, and saves it in a file. (Efficient, captures alerts).
-   **Level 2 (Continuous Record):** The camera records video 24/7, logging every step, breeze, and shadow. 
    -   The storage disk fills up in hours, and you waste days reviewing normal traffic.

---

### (4) Code Examples

#### Enabling and Querying the Profiler in mongosh

```javascript
// 1. Enable Level 1 profiling: Log queries taking longer than 100 milliseconds
db.setProfilingLevel(1, { slowms: 100 });
// Returns: { "was": 0, "slowms": 100, "ok": 1 }

// 2. Query the system.profile collection to find the top 5 slowest queries
db.system.profile.find()
  .sort({ millis: -1 }) // Sort by execution time descending
  .limit(5)
  .pretty();

// Output log document snippet (JSON):
// {
//   "op": "query",
//   "ns": "shop.products",
//   "command": { "find": "products", "filter": { "price": 45 } },
//   "keysExamined": 0,
//   "docsExamined": 500000, // COLLSCAN alert!
//   "millis": 250,          // Query took 250ms
//   "ts": ISODate("2026-07-21T15:30:00Z")
// }

// 3. Disable profiling when finished auditing
db.setProfilingLevel(0);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Setting the database profiling level to 2 (Log All Operations) in high-traffic production environments

**The mistake:** Enabling Level 2 profiling on a production database cluster handling thousands of queries per second, hoping to get a "complete log."

**Why it's wrong:** Level 2 profiling forces the database to write a diagnostic log document to the `system.profile` collection for **every single query**. 

This doubles the database write load, saturates disk write channels, and degrades database performance.

**Fix: Use Level 1 profiling with a reasonable threshold (like `slowms: 100` or `200`) in production. Save Level 2 profiling strictly for isolated staging or local debugging environments.**

---



### Mistake 2: Leaving Profiling Level 2 Active in Production Databases (Performance Degradation)

**The mistake:** Setting `db.setProfilingLevel(2)` permanently on production databases.

**Why it's wrong:** Profiling Level 2 logs EVERY SINGLE database operation to `system.profile` collection, creating heavy disk write overhead. Use Level 1 with slowms thresholds (`db.setProfilingLevel(1, { slowms: 100 })`).

*Incorrect:*
```javascript
db.setProfilingLevel(2); // ❌ Logs ALL operations, creating disk write churn!
```

*Fix:*
```javascript
db.setProfilingLevel(1, { slowms: 100 }); // Logs slow operations exceeding 100ms
```

### Mistake 3: Ignoring `system.profile` Capped Collection Size Limits

**The mistake:** Expecting `system.profile` to hold 6 months of historical slow query logs.

**Why it's wrong:** `system.profile` is a capped collection (default 1MB). Old profile entries are overwritten automatically.

*Incorrect:*
```javascript
// Expecting system.profile to store infinite history
```

*Fix:*
```javascript
Use MongoDB Database Profiler, Atlas Performance Advisor, or log aggregation tools
```

## 5. Practice Exercises

### Exercise 1: Enabling Database Profiler Level 2

**Scenario:**
Enable Database Profiler Level 2 (`profile: 2`, `slowms: 50`) to log all queries taking longer than 50ms into `system.profile`.

**Requirements:**
1. Execute `db.setProfilingLevel(2, { slowms: 50 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.setProfilingLevel(2, { slowms: 50 });
> ```
>
> #### Technical Explanation
>
> 1. Profiler Level 1 logs slow operations exceeding `slowms`; Level 2 logs ALL database operations.
> 2. Profiler entries are recorded in capped collection `system.profile`.
> 3. Diagnostic tool for identifying performance bottlenecks.
> 
---

### Exercise 2: Querying `system.profile` for Slow Collection Scans

**Scenario:**
Query `system.profile` for the top 5 slowest queries that executed collection scans (`execStats.stage: "COLLSCAN"`).

**Requirements:**
1. Query `system.profile` sorting by `millis: -1`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.system.profile.find({
>   "execStats.stage": "COLLSCAN"
> })
> .sort({ millis: -1 })
> .limit(5);
> ```
>
> #### Technical Explanation
>
> 1. `system.profile` stores detailed query execution stats (`millis`, `keysExamined`, `docsExamined`, `command`).
> 2. Filtering for `execStats.stage: "COLLSCAN"` isolates queries missing secondary indexes.
> 3. Directs index creation efforts to queries causing real performance impact.
> 
---

### Exercise 3: Managing Profiler Overhead in Production

**Scenario:**
Explain why Profiler Level 2 should NOT be left enabled permanently in high-throughput production databases.

**Requirements:**
1. Explain profiler write overhead.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Profiler Overhead Warning:
> - Profiler Level 2 writes an entry to system.profile for EVERY query operation!
> - Generates heavy write amplification and locks system.profile.
> Recommendation: Use Profiler Level 1 with slowms: 100 in production, or enable temporarily for active debugging.
> ```
>
> #### Technical Explanation
>
> 1. Level 2 profiler logging degrades database write throughput under heavy query load.
> 2. Level 1 with `slowms: 100` captures problematic queries with minimal overhead.
> 3. Operational profiling guidelines.
> 
---



## 6. Related Terms

- [`explain()` Method](../level_07/explain.md) — The single query analyzer.
- [`serverStatus` / `currentOp` / `db.stats()`](server_diagnostics.md) — The parent monitoring tools.

---

## 7. Key Takeaways
- The Profiler logs slow database operations to the `system.profile` collection.
- Direct NoSQL equivalent to PostgreSQL's `log_min_duration_statement` configuration.
- Level 0 is disabled (default); Level 1 logs slow queries; Level 2 logs all queries.
- `system.profile` is a queryable capped collection; it never grows out of bounds.
- Use Level 1 in production with a minimum threshold (e.g. `slowms: 100`).
- Level 2 profiling degrades database write performance under heavy loads.
- Audit `docsExamined` and `planSummary` in logs to identify unindexed queries.
