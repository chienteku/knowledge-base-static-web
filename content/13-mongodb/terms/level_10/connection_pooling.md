# Connection Pooling

> **Level 10 — Administration, Security & Advanced Features**
> The database optimization technique where a client driver maintains a reusable cache of open TCP database connections, preventing the latency and CPU overhead of establishing new connections for every database query.

---

## 1. Prerequisites

- [Connection String URI](connection_string.md) — Configuring pool parameters.

---

## 2. Term Category

**Driver / Integration** (Database Connection Lifecycle Management): Connection Pooling manages a reusable cache of active database socket connections (`minPoolSize`, `maxPoolSize`, `maxIdleTimeMS`) in client drivers.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Core optimization pattern across all SQL and NoSQL environments. Handled natively inside MongoDB client drivers by default).

### (1) Design Motivation — "Why did we design this?"
Opening a new connection to a database server is expensive:
-   It requires a **TCP 3-way handshake** (network latency).
-   If TLS is active, it requires a secure key exchange handshake.
-   It requires a cryptographic **SCRAM authentication** challenge-response cycle.
-   The database server must allocate CPU and RAM threads to monitor the connection socket.

If your backend application opened a new connection for *every single API request*, ran the query, and immediately closed it:
-   Every page load would lag by 50ms–100ms.
-   Under heavy user traffic, your database server would quickly exhaust its maximum connection limits, crashing your app.

We designed **Connection Pooling** to solve this connection overhead. 

The client driver opens a fixed set of connections (the **Pool**) when the application boots up. 

When a query is run, the driver borrows an idle connection from the pool, runs the query in milliseconds, and returns it to the pool. 

This keeps connection overhead at zero for incoming queries.

---

### (2) Key Pooling Parameters
You configure pool limits inside the connection string URI or driver options:
-   **`maxPoolSize`:** The maximum number of concurrent connections the driver is allowed to open. Defaults to **100**. If all 100 connections are busy, new queries are queued.
-   **`minPoolSize`:** The minimum number of idle connections the driver keeps open in the background (helps prevent connection lag when traffic spikes). Defaults to **0**.
-   **`maxIdleTimeMS`:** How long a connection can sit idle in the pool before the driver closes it to release resources.

---

### (3) Reality Metaphor (Airport Taxi Stands)
Imagine travelers landing at an airport needing a ride:
-   **No Connection Pooling:** Every time a passenger walks out the door, the airport dispatcher calls a factory, orders a brand-new taxi to be built and painted, waits for it to drive to the terminal, carries the passenger home, and then drives the taxi to a junkyard to be crushed. (Extremely slow and wasteful).
-   **Connection Pooling:** An active **Taxi Stand** (the pool) outside the terminal containing **10 idling taxis**. 
    -   A passenger walks out, jumps into the first taxi in line, rides home, and the taxi drives back to wait at the end of the line. 
    -   The cars are constantly reused.

---

### (4) Code Examples

#### Configuring Connection Pools in Node.js
You can pass pooling options in the connection URI string or client parameters:

```javascript
const { MongoClient } = require('mongodb');

// Configure pooling in the connection string:
// maxPoolSize=50 restricts the driver to 50 active sockets
const uri = "mongodb://localhost:27017/shop?maxPoolSize=50&minPoolSize=10";

const client = new MongoClient(uri);

async function run() {
  await client.connect();
  // The driver has pre-opened 10 sockets in the background!
  
  const users = client.db('shop').collection('users');
  
  // This query borrows a socket from the pool and returns it instantly
  const user = await users.findOne({ username: "alice" }); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Initializing a new MongoClient instance inside every API route handler or serverless function, causing database connection exhaustion

**The mistake:** Instantiating a new client on every Express request or serverless function call:

```javascript
// BAD CODE: Connection Leak!
app.post('/api/user', async (req, res) => {
  const client = new MongoClient("mongodb://localhost:27017"); // Starts a NEW pool of 100 on every hit!
  await client.connect();
  const user = await client.db('shop').collection('users').findOne({ _id: req.body.id });
  res.json(user);
  // Forgot to close client, leading to socket exhaustion!
});
```

**Why it's wrong:** Every time this route is called, the app opens a new pool of up to 100 connections. 

Under moderate traffic, the application will attempt to open thousands of sockets to MongoDB, saturating the database server's file descriptor limits and crashing the connection listener.

**Fix: Instantiate a single global `MongoClient` when your application boots up, and share this client instance across all your routes and controller files.**

---



### Mistake 2: Instantiating a New `MongoClient` Connection Instance on Every Single HTTP Request

**The mistake:** Calling `const client = new MongoClient(...)` inside serverless or Express request handlers.

**Why it's wrong:** Instantiating new client connections per request destroys connection pooling, causing TCP socket exhaustion and slow handshake latencies. Reuse a single shared `MongoClient` across application handlers.

*Incorrect:*
```javascript
app.get("/users", async (req, res) => {
  const client = new MongoClient(uri); // ❌ Creates new TCP pool per request!
  await client.connect();
});
```

*Fix:*
```javascript
const client = new MongoClient(uri); await client.connect(); // Global shared pool
app.get("/users", async (req, res) => { ... });
```

### Mistake 3: Setting Overly Large `maxPoolSize` Values Causing Database Thread Exhaustion

**The mistake:** Setting `maxPoolSize: 1000` across 50 application microservice containers (50,000 total connections).

**Why it's wrong:** 50,000 connections consume gigabytes of server RAM for socket buffers. Keep `maxPoolSize` tuned (e.g. 20-50 per container).

*Incorrect:*
```javascript
mongodb://localhost:27017/app?maxPoolSize=1000 // ❌ Connection pool exhaustion!
```

*Fix:*
```javascript
mongodb://localhost:27017/app?maxPoolSize=50 // Controlled connection pool
```

## 5. Practice Exercises

### Exercise 1: Configuring Connection Pool Limits in Driver URI

**Scenario:**
Configure driver connection pool limits with `maxPoolSize=50`, `minPoolSize=10`, and `maxIdleTimeMS=30000`.

**Requirements:**
1. Append pool settings to connection string URI.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const uri = "mongodb://localhost:27017/app_db?maxPoolSize=50&minPoolSize=10&maxIdleTimeMS=30000";
> const client = new MongoClient(uri);
> ```
>
> #### Technical Explanation
>
> 1. `maxPoolSize=50` limits total open socket connections per driver instance to 50.
> 2. `minPoolSize=10` maintains 10 warm idle connections ready for immediate queries.
> 3. `maxIdleTimeMS=30000` closes idle sockets unused for over 30 seconds.

---

### Exercise 2: Reusing Singleton `MongoClient` Instances

**Scenario:**
Refactor a Node.js API server to reuse a single global `MongoClient` instance instead of instantiating new clients per HTTP request.

**Requirements:**
1. Implement singleton client module.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { MongoClient } from "mongodb";

let clientInstance: MongoClient | null = null;

export async function getDbClient(): Promise<MongoClient> {
  if (!clientInstance) {
    clientInstance = new MongoClient(process.env.MONGODB_URI!);
    await clientInstance.connect();
  }
  return clientInstance;
}
```

> #### Technical Explanation
>
> 1. Creating a new `MongoClient` per HTTP request destroys connection pooling benefits, opening thousands of TCP sockets.
> 2. Singleton client instances share a managed connection pool across all incoming HTTP handler threads.
> 3. Prevents database server socket exhaustion (`Too many open files`).

---

### Exercise 3: Monitoring Active Pool Socket Metrics

**Scenario:**
Subscribe to driver connection pool events (`connectionCreated`, `connectionClosed`, `connectionCheckOutFailed`).

**Requirements:**
1. Attach event listeners to `MongoClient`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const client = new MongoClient(uri);
> 
> client.on("connectionCreated", (event) => console.log("Pool Socket Opened:", event.connectionId));
> client.on("connectionClosed", (event) => console.log("Pool Socket Closed:", event.connectionId));
> client.on("connectionCheckOutFailed", (event) => console.warn("Pool Exhausted! Checkout Failed:", event.reason));
> ```
>
> #### Technical Explanation
>
> 1. Connection pool telemetry identifies connection pool exhaustion bottlenecks under heavy load.
> 2. Helps tune `maxPoolSize` based on peak concurrency metrics.
> 3. Essential driver monitoring practice.

---



## 6. Related Terms

- [Connection String URI](connection_string.md) — Configuring pool parameters.
- [MongoDB Node.js Driver](node_driver.md) — The driver interface.

---

## 7. Key Takeaways
- Connection Pooling maintains a cache of open sockets to prevent connection overhead.
- Eliminates TCP and SCRAM authentication handshake latency on queries.
- Default `maxPoolSize` is 100 (restricts active query concurrency).
- `minPoolSize` maintains a base level of idle connections to handle traffic spikes.
- Always instantiate a single, global `MongoClient` instance to prevent connection leaks.
- Initializing clients inside route handlers exhausts server connection limits quickly.
- Monitor active sockets using `db.serverStatus().connections` diagnostics.
