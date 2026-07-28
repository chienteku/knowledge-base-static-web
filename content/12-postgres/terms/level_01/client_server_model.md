# Client-Server Model (in Databases)

> **Level 1 — What Is a Database?**
> The network architecture where PostgreSQL runs as a dedicated background server process (managing disk storage and caching), and software applications connect to it as clients to send SQL queries.

---

## 1. Prerequisites
- [PostgreSQL (Postgres)](postgresql.md) — The database server process.

---

## 2. Term Category
- **Network Architecture**

---

## 3. Environment Context
- **Universal Standard** (Universal database system architecture. Separation of database engines from application runtime scripts).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In simple file-based databases (like MS Access or SQLite), the database engine is compiled directly into the application code. The application reads and writes directly to the database file on disk. 

While simple, this has huge drawbacks:
1.  **No Remote Access:** The database file *must* live on the same physical server as the application. You cannot separate them.
2.  **Resource Bottlenecks:** If you run multiple instances of your application (to handle web traffic), they will fight over file access locks, slowing down or crashing.

To solve this, PostgreSQL was built using a **Client-Server Model**:

-   **The Server (`postgres` process):** A background program that runs continuously on a machine. It has sole authority to write to the physical database files. It manages memory caches, processes queries, and handles lock limits.
-   **The Client (Application / CLI / GUI):** Your Node.js backend, Python scripts, or admin tools. They do not touch database files. Instead, they connect to the server over a network socket (using TCP/IP or local Unix sockets) and send SQL commands.

This separation means your database can run on a highly optimized, separate database server machine in the cloud, while your web applications run on cheap, scalable app servers elsewhere.

---

### (2) Default Port
By default, the PostgreSQL server process listens for incoming client connections on network port **`5432`**.

---

### (3) Reality Metaphor
Imagine a professional restaurant:
-   **The Kitchen (Server)** is where the food, tools, and chefs live. Only trained chefs can handle the ingredients and cook.
-   **The Customers/Waiters (Clients)** sit in the dining room. They cannot walk into the kitchen and grab food. Instead, they write an order down (SQL query) and send it to the kitchen. The kitchen prepares the dish and returns the plate of food (query results) back to the table.

This keeps the kitchen clean, organized, and running at maximum speed.

---

### (4) Code Examples

#### Client-Server Query Flow

```text
+-----------------------+              +------------------------+
|     CLIENT TOOL       |              |   POSTGRESQL SERVER    |
| (NodeJS App / psql)   |              |   (Daemon on Port 5432) |
+-----------------------+              +------------------------+
|                       |  Connects    |                        |
|  1. Opens connection  | ------------>|                        |
|  2. Sends SQL Query   | ------------>|  Evaluates SQL,        |
|     "SELECT *..."     |              |  reads disk blocks,    |
|                       |  Returns     |  formats output        |
|  3. Receives rows     | <----------- |                        |
+-----------------------+              +------------------------+
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing a database connection stays alive forever without management

**The mistake:** Opening a connection from your application client code when the server starts, and assuming it will remain open and healthy indefinitely.

**Why it's wrong:** Sockets drop due to network blips, server restarts, or idle timeouts. If your application keeps trying to use a dead connection, it will crash.

**Fix: Use a connection pool (like `pg.Pool` in JavaScript) in your application client. The pool automatically monitors connections, drops dead sockets, and spawns fresh connections when needed.**

---



### Mistake 2: Assuming PostgreSQL Runs In-Process inside Application Memory (like SQLite)

**The mistake:** Importing a PostgreSQL driver package expecting it to automatically initialize local embedded database files.

**Why it's wrong:** PostgreSQL operates as a client-server database. Client applications communicate with a separate background server process (`postgres`) over TCP sockets (default port `5432`).

*Incorrect:*
```sql
// Expecting local in-memory DB without running postgres daemon
const db = require('pg'); db.connect('./my.db'); // ❌ Connection error!
```

*Fix:*
```sql
// Ensure PostgreSQL server service is running on target host and port
const pool = new Pool({ host: 'localhost', port: 5432, database: 'app' });
```

### Mistake 3: Creating New TCP Database Connection Handles for Every Single API Request

**The mistake:** Opening a new client socket connection (`new Client()`) on every incoming HTTP request without closing or pooling connection sockets.

**Why it's wrong:** Establishing a new TCP connection and fork/process handshake for PostgreSQL creates heavy CPU and memory overhead. Use connection pools (`pg.Pool`).

*Incorrect:*
```sql
app.get('/users', async (req, res) => {
  const client = new Client(); await client.connect(); // ❌ Socket exhaustion!
});
```

*Fix:*
```sql
const pool = new Pool(); // Global connection pool
app.get('/users', async (req, res) => { const client = await pool.connect(); try { ... } finally { client.release(); } });
```

## 6. Practice Exercises

### Exercise 1: Connection Troubleshooting

**Problem:** You boot up your Node.js server and try to query your local database. The server crashes with the error:
`Error: connect ECONNREFUSED 127.0.0.1:5432`
Explain what this error means in terms of the client-server model, and what you must do to fix it.

**Expected output:**
> [!check]- Answer
> ```text
> The error `ECONNREFUSED` means that your Node.js application (the client) tried to connect to port 5432 on your local machine, but no background service was listening on that port. 
> To fix this, you need to verify if the PostgreSQL server process is installed and start it (e.g. running `brew services start postgresql` or starting your Postgres Docker container).
> ```
> - Differentiate between client code errors and server running states.
> - Identify what service listens on port 5432.

---



### Exercise 2: Connection Pool Setup in Node.js

**Problem:** Initialize PostgreSQL connection pool in Node.js `pg` module connecting to `localhost:5432`.

**Expected output:**
> [!check]- Answer
> ```text
> const { Pool } = require('pg'); const pool = new Pool({ host: 'localhost', port: 5432, database: 'main' });
> ```
> ```javascript
> const { Pool } = require('pg');
> const pool = new Pool({
>   host: 'localhost',
>   port: 5432,
>   database: 'main'
> });
> ```
>
> **Explanation:** Connection pools manage reusable TCP client sockets efficiently.

---

### Exercise 3: Default PostgreSQL Port

**Problem:** What is the default TCP listening port for PostgreSQL server daemons? (`5432`).

**Expected output:**
> [!check]- Answer
> ```text
> 5432
> ```
> ```text
> 5432
> ```
>
> **Explanation:** PostgreSQL server daemons listen on TCP port 5432 by default.

## 7. Related Terms
- [PostgreSQL (Postgres)](postgresql.md) — The server engine.
- [Connection String / DSN](connection_string.md) — The client connection guide.

---

## 8. Key Takeaways
- PostgreSQL uses a Client-Server model to separate data storage from app code.
- The server process manages disk storage and caches, listening on default port `5432`.
- Clients (app code, CLI, GUI) connect over the network and send SQL queries.
- Applications never modify database files directly; they request changes via the server.
- Using a client-server architecture allows databases to reside on dedicated remote servers.
