# Connection Pooling

> **Level 8 — Database Integration**
> A cache of active, ready-to-use database connections maintained by your Node.js server to prevent the massive performance penalty of repeatedly logging into the database.

---

## 1. Prerequisites
- [The Event Loop & Libuv](../level_01/event_loop.md) — Node handles thousands of requests, requiring an efficient database strategy.
- [SQL vs NoSQL](sql_vs_nosql.md) — Connection pools apply to almost all database types.
---

## 2. Term Category
- **Performance / Database Architecture**

---

## 3. Environment Context
- **Node.js Server Infrastructure**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Sizing the Pool

**Problem:** You have a massive server handling 50,000 requests per second. You think to yourself, "I should increase my Connection Pool size from 20 to 10,000 so everyone gets a connection!" Why is this a terrible idea?

**Expected output:**
> [!check]- Answer
> ```text
> Every open connection consumes RAM and CPU on the actual Database Server! If you open 10,000 connections, the Database Server will run out of RAM and crash. 
> A small pool (like 20 to 50) is actually faster, because connections are returned to the pool so quickly (in 2ms) that a small number of taxis can easily handle thousands of riders.
> ```
> - Who has to manage and maintain those open connections? The DB!

---



### Exercise 2: Database Pool Size Configuration

**Problem:** Set max database connection pool limit to 20 connections using `pg` Pool options.

**Expected output:**
> [!check]- Answer
> ```text
> const pool = new Pool({ max: 20 });
> ```
> ```javascript
> const { Pool } = require('pg');
> const pool = new Pool({ max: 20 });
> ```
>
> **Explanation:** `max` option restricts maximum concurrent socket connections opened by the pool.

---

### Exercise 3: Pool Query Shortcut

**Problem:** Why is `pool.query('SELECT...')` safer for single queries than `pool.getConnection()`?

**Expected output:**
> [!check]- Answer
> ```text
> pool.query() automatically acquires and releases the connection back to the pool in a single call.
> ```
> ```text
> pool.query() automatically acquires and releases the connection back to the pool in a single call.
> ```
>
> **Explanation:** Direct pool queries handle connection lifecycle management automatically.

## 7. Related Terms
- [ORMs & ODMs](orms_odms.md) — ORMs manage the Connection Pool for you automatically.
- [Database Transactions](db_transactions.md) — Related concept: Database Transactions.
---

## 8. Key Takeaways
- A **Connection Pool** is a cache of active database connections maintained by Node.js.
- It eliminates the massive performance penalty of repeatedly authenticating with the database.
- You grab a connection from the pool, run the query, and return the connection to the pool.
- Never create new database connections inside of an API route. Create the pool once globally.
