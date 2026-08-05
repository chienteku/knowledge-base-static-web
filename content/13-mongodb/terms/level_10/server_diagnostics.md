# `serverStatus` / `currentOp` / `db.stats()`

> **Level 10 — Administration, Security & Advanced Features**
> The three core database diagnostic tools in MongoDB: `db.serverStatus()` (server health metrics), `db.currentOp()` (real-time running operations), and `db.stats()` (storage sizing metrics), used to monitor and debug deployments.

---

## 1. Prerequisites

- [Database (MongoDB Context)](../level_01/database_context.md) — The `mongod` server connection.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Executed inside `mongosh`. Analyzing outputs requires administrative or diagnostic role permissions).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When running database clusters in production, you must monitor performance to prevent outages:
-   *"Are our connection pool sockets saturated?"*
-   *"What queries are running right now that are blocking writes?"*
-   *"How much disk space is our data consuming?"*

In PostgreSQL, you audit these metrics using system tables like `pg_stat_activity` or running `SELECT pg_size_pretty(...)`.

We designed the **`serverStatus`**, **`currentOp`**, and **`db.stats()`** commands to provide this insight in MongoDB. 

They provide real-time information on server health, running queries, and database sizing.

---

### (2) The Three Diagnostic Tools

#### 1. `db.serverStatus()` (Health Panel)
Returns a comprehensive document outlining server runtime metrics.
-   *Key Metrics:* Connections count (`connections`), memory usage (`mem`), cache performance (`wiredTiger.cache`), and operations metrics (`opcounters`).
-   *SQL Analogy:* Checking server system metrics.

#### 2. `db.currentOp()` (Real-Time Radar)
Lists all active query operations running on the database server.
-   *Key Metrics:* Query execution times (`secs_running`), database namespaces (`ns`), and operation IDs (`opid`).
-   *Emergency Tool:* If a query runs too long and locks the database, you search `db.currentOp()`, locate the query `opid`, and terminate it using **`db.killOp(opid)`**.

#### 3. `db.stats()` / `db.collection.stats()` (Storage Scale)
Returns storage size and document count statistics.
-   *Key Metrics:* Document count (`count`), raw data size (`size`), and index size (`indexSize`).

---

### (3) Reality Metaphor (Airplane Cockpits)
Imagine flying an airliner:
-   **`db.serverStatus()`:** The **Main Instrument Panel**. It shows engine RPM, fuel flow, battery voltage, and oil pressure. (Is the plane healthy?).
-   **`db.currentOp()`:** The **Radar Display**. It shows which other planes are flying in your immediate airspace. 
    -   If a rogue drone is hovering in your path, you identify it and signal to ground control to disable it (`db.killOp`).
-   **`db.stats()`:** The **Cargo Manifest Log**. It lists how many bags are in the cargo hold, and the total weight of the luggage.

---

### (4) Code Examples

#### Running Diagnostic Queries in mongosh

```javascript
// 1. Audit server connection counts
db.serverStatus().connections;
// Output: { "current": 45, "available": 824, "totalCreated": 1050 }

// 2. Identify queries running for longer than 5 seconds
db.currentOp({
  "active": true,
  "secs_running": { $gt: 5 }
});

// Output Opid snippet: { "opid": 45520, "secs_running": 12, "ns": "shop.orders" }

// Kill the runaway query using its ID:
db.killOp(45520);

// 3. View database storage metrics
db.stats();
// Output: { "collections": 12, "objects": 150000, "dataSize": 4500000 }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running db.currentOp() as a standard non-admin database user, getting empty results

**The mistake:** Connecting to a collection with a read-only role, running `db.currentOp()` to find why queries are slow, and concluding "nothing is running" because the query returns an empty array.

**Why it's wrong:** To prevent data leaks and security breaches, MongoDB blocks standard users from viewing other clients' active queries. 

Only users authenticated with `admin` roles (like `root` or `clusterAdmin`) can view global cluster operations.

**Fix: Log in as a database administrator user to execute global currentOp audits.**

---



### Mistake 2: Ignoring `mongostat` and `mongotop` CLI Monitoring Diagnostics During Performance Outages

**The mistake:** Attempting to guess database latency root causes without running diagnostic monitoring tools.

**Why it's wrong:** `mongostat` prints real-time operation rates, lock percentages, and cache usage. `mongotop` reports read/write time spent per collection.

*Incorrect:*
```javascript
// Guessing root causes during database performance slowdowns
```

*Fix:*
```javascript
Run mongostat and mongotop CLI tools to inspect collection read/write lock latencies
```

### Mistake 3: Ignoring `db.serverStatus()` WiredTiger Cache Usage Metrics

**The mistake:** Failing to check `wiredTiger.cache` metrics when servers experience high page eviction latencies.

**Why it's wrong:** `db.serverStatus().wiredTiger.cache` reports cache usage. If dirty data exceeds 20%, page eviction stalls operations.

*Incorrect:*
```javascript
// Ignoring WiredTiger cache usage metrics
```

*Fix:*
```javascript
Monitor db.serverStatus().wiredTiger.cache for dirty data page eviction thresholds
```

## 6. Practice Exercises

### Exercise 1: Runtime Emergency Resolution

**Problem:** Your production server CPU spikes to 100%. Web requests are failing due to timeouts. 
Write the sequential mongosh commands to:
1.  Locate any active query running on the `reports.sales` collection for more than `10` seconds.
2.  Terminate that query using its operation ID (assume the operation ID returned is `99088`).

**Expected output:**
> [!check]- Answer
> ```javascript
> // 1. Locate the query
> db.currentOp({
>   "active": true,
>   "ns": "reports.sales",
>   "secs_running": { $gt: 10 }
> });
> 
> // 2. Terminate the query
> db.killOp(99088);
> ```
> - Add search filter criteria inside `db.currentOp()` targeting the namespace `ns` and `secs_running`.
> - Use the `db.killOp()` helper method to cancel the operation.

---



### Exercise 2: Inspecting Real-Time Collection Read/Write Time with `mongotop`

**Problem:** CLI command to monitor time spent reading and writing per collection every 2 seconds (`mongotop 2`).

**Expected output:**
> [!check]- Answer
> ```text
> mongotop 2
> ```
> ```bash
> mongotop 2
> ```
>
> **Explanation:** `mongotop [interval]` outputs real-time read and write time metrics per collection.

---

### Exercise 3: Inspecting Server Status Metrics

**Problem:** Command in `mongosh` to return detailed server status metrics (`db.serverStatus()`).

**Expected output:**
> [!check]- Answer
> ```text
> db.serverStatus();
> ```
> ```javascript
> db.serverStatus();
> ```
>
> **Explanation:** `db.serverStatus()` outputs memory, connection pool, locks, and WiredTiger metrics.

## 7. Related Terms

- [Database (MongoDB Context)](../level_01/database_context.md) — The target server.
- [MongoDB Profiler (`db.setProfilingLevel()`)](profiler.md) — Slow query logging.

---

## 8. Key Takeaways
- `db.serverStatus()` monitors server connections, RAM cache, and CPU counters.
- `db.currentOp()` lists active, running queries in real-time.
- `db.stats()` measures storage footprint, index sizes, and collection counts.
- Administrators use `db.killOp(opid)` to terminate runaway, locking queries.
- Global diagnostic commands require admin role credentials to see all metrics.
- Monitor `connections.current` to adjust application pool sizing.
- Sizing stats help verify if indexes are fitting completely in RAM cache.
