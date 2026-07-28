# Connection Pooling

> **Level 10 — Administration, Security & Production**
> A performance optimization technique that maintains a cache (pool) of active, pre-established database connections, allowing application servers to reuse them instead of spawning new connection processes for every query.

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The query execution context.

---

## 2. Term Category
- **Database Performance / Optimization**

---

## 3. Environment Context
- **Universal Standard** (Crucial for PostgreSQL because Postgres spawns a separate physical operating system process (consuming ~10MB of RAM) for every client connection. Production servers often use **PgBouncer** as a lightweight external pooler).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern web applications, database queries are triggered by incoming HTTP requests. 

If your backend code opens a brand-new database connection for every request:

```text
HTTP Request -> Create TCP Socket -> TLS Handshake -> DB Authentication -> Run Query -> Close Connection
```

This sequence introduces severe bottlenecks:
-   **Connection Overhead:** Establishing a connection takes 50 to 100 milliseconds. This delays your page load times.
-   **Server Memory Crash:** PostgreSQL forks a new OS process for every client. If 1,000 users visit your site simultaneously, the server tries to spawn 1,000 processes, consuming 10GB of RAM instantly and crashing due to out-of-memory errors.

We designed **Connection Pooling** to solve this resource overhead. 

When your application server starts, it initializes a **Pool** of connections (e.g., 20 pre-established, authenticated database connections kept idle in memory).

When a user visits your website:
1.  The backend server instantly borrows a connection from the pool (takes 0ms).
2.  Executes the query.
3.  Releases the connection back to the pool immediately.

This allows a small pool of 20 connections to handle tens of thousands of users per minute.

---

### (2) External Poolers: PgBouncer
If your application scales across multiple microservices or serverless functions (like AWS Lambda or Vercel), they cannot share a single in-memory pool. 

Each function creates its own connections, quickly hitting PostgreSQL's limit (`max_connections`).

To solve this, developers place **PgBouncer** in front of PostgreSQL. 

PgBouncer acts as a lightweight proxy: it accepts thousands of incoming application connections and multiplexes them down to a tiny, efficient pool of real PostgreSQL sockets.

---

### (3) Reality Metaphor
Imagine an airport passenger transportation system:
-   **No Pooling (Create on Demand):** When a traveler exits the terminal, the airport calls a factory to assemble a brand-new taxi, paint it, hire a driver, and bring it to the curb. (Slow, expensive, and logistically impossible).
-   **With Connection Pooling:** A **Taxi Rank** has 10 pre-assembled, running taxis waiting at the curb (the pool). When a passenger arrives, they hop in, drive to their destination, get out, and the taxi drives back to the rank to wait for the next traveler.

---

### (4) Code Examples

#### Initializing a Global Pool in Node.js (pg client)
You must initialize the pool **once** when your app starts:

```javascript
const { Pool } = require('pg');

// Create a single, global pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Keep maximum 20 connections active in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
});

// Export the pool to share across your API routes
module.exports = pool;
```

#### Reusing Connections in API Routes
```javascript
const pool = require('./db');

app.get('/products', async (req, res) => {
  try {
    // query() automatically borrows a client, runs the SQL,
    // and returns the client to the pool immediately!
    const { rows } = await pool.query('SELECT * FROM products LIMIT 10');
    res.json(rows);
  } catch (err) {
    res.status(500).send('Database Error');
  }
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Initializing a new Pool object inside every single API route handler function

**The mistake:** Writing `const pool = new Pool(...)` inside your route endpoint handler code, creating a pool on every page reload:

```javascript
// BAD: Leaks database connections on every request!
app.get('/users', async (req, res) => {
  const pool = new Pool(); // Spawns fresh connections
  const data = await pool.query('...');
  res.json(data.rows);
});
```

**Why it's wrong:** Instead of reusing connections, this code spawns a new pool (and its 20 connections) on every page reload. 

Within minutes, your database hits its process limits, throws `'too many clients already'` errors, and locks out all users.

**Fix: Always initialize the `Pool` once in a separate configuration file, and export/import that single instance across all your router files.**

---



### Mistake 2: Using Session Pooling Mode in PgBouncer with Prepared Statements or Advisory Locks

**The mistake:** Configuring PgBouncer in Transaction pooling mode (`pool_mode = transaction`) while application relies on `PREPARE` statements or session-level advisory locks.

**Why it's wrong:** In Transaction pooling mode, different transactions from the same client can land on different backend server connections! Session-level state (like `PREPARE` statements or `pg_advisory_lock`) is lost between transactions. Use `pool_mode = session` or PgBouncer 1.21+ prepared statement support.

*Incorrect:*
```sql
// Using session-level state under Transaction pooling mode
```

*Fix:*
```sql
Use PgBouncer 1.21+ or protocol-level prepared statement support
```

### Mistake 3: Configuring Max Connection Pool Size Equal to Max Server Connections (`max_connections`)

**The mistake:** Setting application pool size to 100 on 5 web servers (500 connections) when PostgreSQL `max_connections = 100`.

**Why it's wrong:** PostgreSQL forks a dedicated OS backend process per connection. Setting pool size too high exhausts RAM and CPU context switching. Keep pool sizes small (e.g. 20 connections per app instance).

*Incorrect:*
```sql
// 500 total connections against PostgreSQL server with max_connections = 100
```

*Fix:*
```sql
Keep pool size small (e.g. pool_size = (CPU cores * 2) + disk_spindle_count)
```

## 6. Practice Exercises

### Exercise 1: Connection Capacity Audit

**Problem:** Your cloud PostgreSQL server is configured with `max_connections = 100`. You deploy 5 separate instances of your Node.js API server to a load balancer. Each API instance initializes a database pool with `max = 30`. 
Explain why this setup will crash under heavy traffic.

**Expected output:**
> [!check]- Answer
> ```text
> The setup will crash because of connection limits!
> Under heavy traffic, each of the 5 API instances will grow its pool to its maximum limit of 30 connections. 
> Together, they will try to open:
> 5 instances * 30 connections/pool = 150 connections.
> Since the PostgreSQL server only permits a maximum of 100 connections, the database will reject the remaining 50 connections, throwing "too many clients already" errors and crashing the APIs.
> ```
> - Multiply the number of server instances by the maximum pool size of each instance.
> - Compare the total to the server's `max_connections` setting.

---



### Exercise 2: PgBouncer Pooling Modes List

**Problem:** List 3 pooling modes in PgBouncer (`session`, `transaction`, `statement`).

**Expected output:**
> [!check]- Answer
> ```text
> session, transaction, statement
> ```
> ```text
> session, transaction, statement
> ```
>
> **Explanation:** Transaction pooling binds connections strictly for transaction durations, maximizing connection reuse.

---

### Exercise 3: Node.js Pg Pool Error Handling

**Problem:** Attach error event listener to `pg.Pool` instance handling idle client errors cleanly.

**Expected output:**
> [!check]- Answer
> ```text
> pool.on('error', (err, client) => { console.error('Unexpected idle client error', err); process.exit(-1); });
> ```
> ```javascript
> pool.on('error', (err, client) => {
>   console.error('Unexpected idle client error', err);
>   process.exit(-1);
> });
> ```
>
> **Explanation:** Handling `pool.on('error')` prevents unhandled process crashes from broken idle TCP sockets.

## 7. Related Terms
- [`postgresql.conf` (Server Configuration)](postgresql_conf.md) — Setting connection thresholds.

---

## 8. Key Takeaways
- Connection pooling caches pre-opened database connections for query reuse.
- Bypasses TCP handshakes and process fork overhead, reducing query lag.
- Prevents database memory exhaustion by capping maximum concurrent processes.
- Postgres forks a process per socket; PgBouncer multiplexes connections.
- Always configure the pool once globally; never create pools inside route handlers.
- Capping pool sizes prevents exceeding database server `max_connections` limits.
