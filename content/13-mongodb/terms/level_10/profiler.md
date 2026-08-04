# MongoDB Profiler (`db.setProfilingLevel()`)

> **Level 10 — Administration, Security & Advanced Features**
> MongoDB's built-in query analysis tool that monitors and logs slow-running database operations into the capped `system.profile` collection, serving as the direct equivalent of PostgreSQL's `log_min_duration_statement` configuration.

---

## 1. Prerequisites
- [`explain()` Method](../level_07/explain.md) — The single query analyzer.
- [Database Diagnostics](server_diagnostics.md) — The parent monitoring tools.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Configured per database. When enabled, operations are logged into the system-created `system.profile` capped collection).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Slow Query Audit Filter

**Problem:** You have enabled Level 1 profiling. Write the MongoDB query to search the `system.profile` collection for any queries that:
1.  Targeted the `"shop.orders"` namespace (the `ns` field).
2.  Executed a Collection Scan (indicated by the `planSummary` string containing `"COLLSCAN"` or `docsExamined` being greater than 0 while `keysExamined` is 0).

**Expected output:**
> [!check]- Answer
> ```javascript
> db.system.profile.find({
>   ns: "shop.orders",
>   planSummary: { $regex: /COLLSCAN/ }
> });
> ```
> - Search within the `system.profile` collection.
> - Match the namespace `ns` and use a regex check on the `planSummary` field.

---



### Exercise 2: Enabling Database Profiler for Slow Queries

**Problem:** Enable Profiler Level 1 logging queries taking longer than 200 milliseconds.

**Expected output:**
> [!check]- Answer
> ```text
> db.setProfilingLevel(1, { slowms: 200 });
> ```
> ```javascript
> db.setProfilingLevel(1, { slowms: 200 });
> ```
>
> **Explanation:** `setProfilingLevel(1, { slowms })` logs queries exceeding specified latency thresholds.

---

### Exercise 3: Querying `system.profile` Collection

**Problem:** Query top 5 slowest operations recorded in `system.profile` collection.

**Expected output:**
> [!check]- Answer
> ```text
> db.system.profile.find().sort({ millis: -1 }).limit(5);
> ```
> ```javascript
> db.system.profile.find().sort({ millis: -1 }).limit(5);
> ```
>
> **Explanation:** `system.profile` stores detailed execution stats for slow operations.

## 7. Related Terms
- [`explain()` Method](../level_07/explain.md) — The single query analyzer.
- [Database Diagnostics](server_diagnostics.md) — The parent monitoring tools.

---

## 8. Key Takeaways
- The Profiler logs slow database operations to the `system.profile` collection.
- Direct NoSQL equivalent to PostgreSQL's `log_min_duration_statement` configuration.
- Level 0 is disabled (default); Level 1 logs slow queries; Level 2 logs all queries.
- `system.profile` is a queryable capped collection; it never grows out of bounds.
- Use Level 1 in production with a minimum threshold (e.g. `slowms: 100`).
- Level 2 profiling degrades database write performance under heavy loads.
- Audit `docsExamined` and `planSummary` in logs to identify unindexed queries.
