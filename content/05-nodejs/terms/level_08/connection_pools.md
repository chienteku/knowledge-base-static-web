# Connection Pooling

> **Level 8 — Database Integration**
> A cache of active, ready-to-use database connections maintained by your Node.js server to prevent the massive performance penalty of repeatedly logging into the database.

---

## 1. Prerequisites
- [The Event Loop & Libuv](../level_01/event_loop.md) — Node handles thousands of requests, requiring an efficient database strategy.
- [SQL vs NoSQL](sql_vs_nosql.md) — Connection pools apply to almost all database types.

---

## 2. Term Category

**Performance / Database Architecture (Node.js Server Infrastructure)**: Connection Pooling is a fundamental concept in this technology stack. **Level 8 — Database Integration**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When your Node.js app needs to fetch a user from PostgreSQL, it has to do a "Handshake." It knocks on the database's door, provides a username and password, establishes a secure TCP socket, and creates a connection. 
**This process takes about 100 milliseconds.**
If you get 1,000 visitors per second, and your server creates a brand new connection for *every single visitor*, your server will spend 100% of its time just logging into the database. The app will freeze and crash.

### (2) The Pool Metaphor
Instead of buying a new car every time you need to go to the store, and throwing the car away when you get home... you use a **Taxi Stand (A Connection Pool)**.
When your Node.js server starts, it logs into the database 10 times and parks those 10 active connections in the "Pool".
1. A user requests the homepage.
2. Node grabs Connection #1 from the pool, runs the query (takes 2 milliseconds), and puts Connection #1 back in the pool.
3. The next user requests the homepage. Node reuses Connection #1 instantly.

Because the connections are already established, querying the database takes 2ms instead of 102ms!

### (3) How to use it
Most modern database drivers (like `pg` for PostgreSQL or Mongoose for MongoDB) handle connection pooling automatically. You just have to configure the size of the pool.
```javascript
const { Pool } = require('pg');

// Create a pool of 20 reusable connections
const pool = new Pool({
  user: 'admin',
  password: 'password123',
  max: 20 
});

// Grab a taxi, run the query, and return the taxi!
const result = await pool.query('SELECT * FROM users');
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Opening a new connection inside the route

**The mistake:** A developer writes a connection script *inside* their Express route.
```javascript
app.get('/users', async (req, res) => {
  const client = new Client({ user: 'admin', password: 'password' });
  await client.connect(); // Logs in to the DB
  const data = await client.query('SELECT * FROM users');
  res.json(data);
});
```

**Why it's wrong:** You are forcing Node.js to perform the 100ms database handshake every single time someone visits the `/users` page. Furthermore, because the developer forgot to call `client.end()`, those connections stay open forever, rapidly causing a "Too many connections" fatal crash on the database server.
**Golden Rule:** ALWAYS create your Connection Pool once, outside of your routes (usually when the server starts), and reuse it inside the routes.

---



### Mistake 2: Creating a New Database Connection Pool Inside Every HTTP Request Handler

**The mistake:** Calling `mysql.createPool()` or `new Pool()` inside an Express route handler function.

**Why it's wrong:** Instantiating connection pools per request creates thousands of un-managed database sockets, exhausting DB connection limits instantly and crashing the database.

*Incorrect:*
```javascript
app.get('/users', async (req, res) => {
  const pool = mysql.createPool(config); // ❌ Creates new pool on every HTTP request!
  const [rows] = await pool.query('SELECT * FROM users');
});
```

*Fix:*
```javascript
// Create single pool instance at application startup at module scope:
const pool = mysql.createPool(config);
app.get('/users', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users');
});
```

### Mistake 3: Acquiring Pool Connections via `pool.getConnection()` Without Releasing Them in `finally` Blocks

**The mistake:** Acquiring a client connection from pool `const conn = await pool.getConnection()` without releasing it on error.

**Why it's wrong:** If an error occurs after acquiring a connection, failing to call `conn.release()` leaks the socket. The pool eventually runs out of free connections, freezing all future queries.

*Incorrect:*
```javascript
const conn = await pool.getConnection();
await conn.query('UPDATE users SET status = 1'); // ❌ Unreleased connection if query throws!
```

*Fix:*
```javascript
const conn = await pool.getConnection();
try {
  await conn.query('UPDATE users SET status = 1');
} finally {
  conn.release(); // Always release connection back to pool
}
```

## 5. Practice Exercises

### Exercise 1: Node.js PostgreSQL Connection Pool Allocator

**Scenario:** A backend microservice acquires database clients from a connection pool (e.g. `pg.Pool`), executes queries, and guarantees client release back to pool via `try...finally`.

**Requirements:**
1. Write executePooledQuery(poolMock, sqlQuery, queryParams).
2. Acquire client via `pool.connect()`.
3. Execute query.
4. Ensure client release in `finally` block.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executePooledQuery(poolMock, sqlQuery, queryParams = []) {
>   let client = null;
>   try {
>     client = await poolMock.connect();
>     const result = await client.query(sqlQuery, queryParams);
>     return { success: true, rows: result.rows, rowCount: result.rowCount };
>   } catch (err) {
>     return { success: false, error: err.message };
>   } finally {
>     if (client && typeof client.release === "function") {
>       client.release();
>     }
>   }
> }
>
> // Verification tests
> let released = false;
> const mockPool = {
>   connect: async () => ({
>     query: async (sql, params) => ({ rows: [{ id: 1, name: "Alice" }], rowCount: 1 }),
>     release: () => { released = true; }
>   })
> };
>
> executePooledQuery(mockPool, "SELECT * FROM users WHERE id = $1", [1]).then(res => {
>   console.assert(res.success === true, "Test 1 Failed");
>   console.assert(res.rows.length === 1, "Test 2 Failed");
>   console.assert(released === true, "Test 3 Failed: Client released in finally block");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Connection Pool Reuse**: Opening raw TCP connections to DB servers takes 50–100ms; connection pools keep pre-opened sockets warm for instant reuse.
> 2. **Mandatory `client.release()`**: Failing to release pooled connections leaks socket handles, eventually causing the application to hang when pool limits are reached.
> 3. **`try...finally` Safety Pattern**: Always place `client.release()` inside a `finally` block to guarantee release even if queries throw errors.
> 
---

### Exercise 2: Connection Pool Exhaustion & Queue Timeout Guard

**Scenario:** A high-concurrency API endpoint sets client acquisition timeouts to reject incoming requests when all pooled connections are busy.

**Requirements:**
1. Write acquirePooledClientWithTimeout(poolMock, timeoutMs).
2. Attempt `pool.connect()`.
3. Race connection against timeout timer.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function acquirePooledClientWithTimeout(poolMock, timeoutMs = 5000) {
>   return new Promise((resolve, reject) => {
>     let timer = null;
>
>     const timeoutPromise = new Promise((_, rej) => {
>       timer = setTimeout(() => rej(new Error("POOL_ACQUISITION_TIMEOUT")), timeoutMs);
>     });
>
>     Promise.race([poolMock.connect(), timeoutPromise])
>       .then((client) => {
>         clearTimeout(timer);
>         resolve(client);
>       })
>       .catch((err) => {
>         clearTimeout(timer);
>         reject(err);
>       });
>   });
> }
>
> // Verification tests
> const slowPool = {
>   connect: () => new Promise(resolve => setTimeout(() => resolve({ id: "client1" }), 50))
> };
>
> acquirePooledClientWithTimeout(slowPool, 10).catch(err => {
>   console.assert(err.message === "POOL_ACQUISITION_TIMEOUT", "Test 1 Failed: Timed out on slow pool acquisition");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Pool Exhaustion Hazard**: When all pooled connections are active, incoming queries queue indefinitely until client connections free up.
> 2. **Acquisition Timeouts**: Enforcing connection acquisition timeouts prevents API gateway request timeouts and thread starvation.
> 3. **Sizing Connection Pools**: Formula: `maxConnections = (Core Count * 2) + Effective Spindle Count`; oversized pools degrade DB CPU performance.
> 
---

### Exercise 3: Graceful Pool Teardown & Drain Manager

**Scenario:** A process shutdown handler drains database connection pools gracefully when receiving `SIGTERM` signals.

**Requirements:**
1. Write drainConnectionPool(poolMock, loggerMock).
2. Invoke `pool.end()`.
3. Log pool drain completion.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function drainConnectionPool(poolMock, loggerMock) {
>   if (!poolMock || typeof poolMock.end !== "function") {
>     return { drained: false, error: "INVALID_POOL" };
>   }
>
>   try {
>     await poolMock.end();
>     if (loggerMock && typeof loggerMock.info === "function") {
>       loggerMock.info("Database connection pool drained gracefully.");
>     }
>     return { drained: true };
>   } catch (err) {
>     return { drained: false, error: err.message };
>   }
> }
>
> // Verification tests
> let ended = false;
> const mockPool = { end: async () => { ended = true; } };
>
> drainConnectionPool(mockPool, { info: () => {} }).then(res => {
>   console.assert(res.drained === true, "Test 1 Failed");
>   console.assert(ended === true, "Test 2 Failed: Executed pool.end()");
> });
> ```
>
> #### Technical Explanation
>
> 1. **`pool.end()` Lifecycle Method**: Closes all idle pool sockets and waits for active queries to complete before disconnecting.
> 2. **Graceful Shutdown Integration**: Call `pool.end()` inside `process.on('SIGTERM')` listeners before `process.exit(0)`.
> 3. **Preventing Dangling Sockets**: Prevents database server from keeping abandoned TCP connections open after Node.js app terminates.
## 6. Related Terms
- [ORMs & ODMs](orms_odms.md) — ORMs manage the Connection Pool for you automatically.
- [Database Transactions](db_transactions.md) — Related concept: Database Transactions.

---

## 7. Key Takeaways
- A **Connection Pool** is a cache of active database connections maintained by Node.js.
- It eliminates the massive performance penalty of repeatedly authenticating with the database.
- You grab a connection from the pool, run the query, and return the connection to the pool.
- Never create new database connections inside of an API route. Create the pool once globally.
