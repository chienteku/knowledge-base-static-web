# SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`)

> **Level 10 — SDKs, Deployment & Production**
> The standard initialization and shutdown sequence for SurrealDB client SDKs: connecting, setting namespace/database boundaries, authenticating credentials, and releasing network resources.

---

## 1. Prerequisites

- [JavaScript / TypeScript SDK](js_sdk.md) — The `surrealdb` client package.
- [Connection Credentials (`USE NS ... DB ...`)](../level_01/connection_credentials.md) — Namespace and database scope concepts.

---

## 2. Term Category


**Integration / Ecosystem (SDK connection lifecycle management)**: - **SDK & Lifecycle**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
To query a SurrealDB instance reliably, a client application must progress through a deterministic sequence of state transitions:
1. **`connect(url)`**: Opens the underlying WebSocket or HTTP network socket to the server.
2. **`use({ namespace, database })`**: Sets the target namespace and database scope for all subsequent queries.
3. **`signin(credentials)`** (or `authenticate(token)`): Authenticates as a System User (`root`/`db`) or Record Access User, binding `$auth` to the connection session.
4. **`close()`**: Cleanly closes network sockets, terminates active live queries, and releases client resources.

Following this standard lifecycle ensures application code does not suffer from unauthenticated query errors, scope mismatches, or hanging socket connections.

### (2) Reality Metaphor
Think of logging into a corporate workstation:
- **`connect`**: Turning on the computer monitor and connecting to the office local network.
- **`use`**: Selecting your regional office branch and department folder.
- **`signin`**: Typing your corporate username and password.
- **`close`**: Logging out and turning off the workstation at the end of the day.

### (3) Code Examples

#### Short Snippet
```typescript
import { Surreal } from 'surrealdb';

const db = new Surreal();
await db.connect('ws://localhost:8000/rpc');
await db.use({ namespace: 'production', database: 'main' });
await db.signin({ user: 'root', pass: 'root' });
// Ready to execute queries...
await db.close();
```

#### Fuller Example
```typescript
import { Surreal } from 'surrealdb';

class DatabaseClient {
    private db = new Surreal();

    async init() {
        // Step 1: Connect over WebSocket
        await this.db.connect('wss://db.example.com/rpc');

        // Step 2: Set Namespace and Database context
        await this.db.use({
            namespace: process.env.SURREAL_NS || 'app',
            database: process.env.SURREAL_DB || 'prod'
        });

        // Step 3: Sign in with service credentials
        await this.db.signin({
            user: process.env.SURREAL_USER,
            pass: process.env.SURREAL_PASS
        });

        console.log('SurrealDB client successfully initialized.');
    }

    get client() {
        return this.db;
    }

    async teardown() {
        // Step 4: Gracefully disconnect
        await this.db.close();
        console.log('SurrealDB connection closed.');
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating a New Surreal Client Instance on Every API Route Handler

**The mistake:** Calling `new Surreal()` and `.connect()` inside every single HTTP route handler or serverless function invocation without reusing client connections.

**Why it's wrong:** Opening and closing network sockets repeatedly causes socket exhaustion, high latency, and unnecessary server connection overhead.

*Incorrect:*
```typescript
// Express Route Handler
app.get('/users', async (req, res) => {
    const db = new Surreal(); // Creates new socket every request!
    await db.connect('ws://localhost:8000/rpc');
    await db.use({ namespace: 'ns', database: 'db' });
    const users = await db.select('user');
    res.json(users);
});
```

*Fix:*
```typescript
// Initialize singleton DB instance once at app startup
const db = new Surreal();
await db.connect('ws://localhost:8000/rpc');
await db.use({ namespace: 'ns', database: 'db' });

app.get('/users', async (req, res) => {
    const users = await db.select('user'); // Reuse existing connection
    res.json(users);
});
```

---



### Mistake 2: Using `http://` Connection Endpoints for Real-Time `db.live()` Subscriptions

**The mistake:** Connecting SDK to `http://` endpoint when using `db.live()` listeners.

**Why it's wrong:** HTTP protocol is stateless and does NOT support real-time WebSocket live query push events. Connect via `ws://` or `wss://`.

*Incorrect:*
```surrealql
await db.connect("http://127.0.0.1:8000/rpc");
await db.live("user"); // ❌ Live queries unsupported over HTTP!
```

*Fix:*
```surrealql
await db.connect("ws://127.0.0.1:8000/rpc");
await db.live("user"); // WebSocket connection enables live queries
```

### Mistake 3: Omitting Connection Closing in Ephemeral Node.js Scripts

**The mistake:** Running batch CLI scripts using JS SDK without calling `await db.close()` before script exit.

**Why it's wrong:** Un-closed WebSocket connections keep Node.js event loops active, preventing CLI scripts from exiting cleanly.

*Incorrect:*
```surrealql
// Script finishes without closing connection
await db.select("user"); // ❌ Node process hangs!
```

*Fix:*
```surrealql
await db.select("user");
await db.close(); // Closes WebSocket connection cleanly
```





## 5. Practice Exercises

### Exercise 1: Connection Lifecycle Management

**Scenario:**
Manage an SDK connection lifecycle: connect over WebSockets, target namespace/database using `db.use()`, and disconnect on exit.

**Requirements:**
1. Call `db.connect()`.
2. Call `db.use({ ns: "prod", db: "main" })`.
3. Call `db.close()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import Surreal from "@surrealdb/surrealdb";
> 
> const db = new Surreal();
> 
> await db.connect("ws://localhost:8000/rpc");
> await db.use({ ns: "prod", db: "main" });
> 
> // Perform operations...
> 
> await db.close();
> ```
> 
> #### Technical Explanation
>
> 1. `db.connect()` initializes binary WebSocket protocol connections.
> 2. `db.use({ ns, db })` updates active session namespace and database targets.
> 3. `db.close()` terminates the connection cleanly.
> 
---

### Exercise 2: Managing Connection State Status

**Scenario:**
Inspect connection status flags (`db.status`) to verify whether the SDK is actively connected before running queries.

**Requirements:**
1. Check connection status before executing queries.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> if (db.status === "connected") {
>   const result = await db.select("product");
> } else {
>   console.error("SDK is not connected!");
> }
> ```
>
> #### Technical Explanation
>
> 1. `db.status` exposes connection state (`"disconnected"`, `"connecting"`, `"connected"`).
> 2. Prevents executing queries on uninitialized WebSocket connections.
> 3. Simplifies connection state handling in UI frameworks (React/Vue).
> 
---

### Exercise 3: Automatic Connection Reconnection

**Scenario:**
Configure SDK connection options to enable automatic reconnection if the network drops temporarily.

**Requirements:**
1. Describe built-in SDK WebSocket auto-reconnect capabilities.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // SDK automatically attempts WebSocket reconnection on network drop
> await db.connect("wss://db.example.com/rpc");
> ```
>
> #### Technical Explanation
>
> 1. The SurrealDB JavaScript SDK includes built-in exponential backoff auto-reconnection logic.
> 2. Re-establishes WebSocket channels automatically when network connectivity recovers.
> 3. Re-authenticates active session tokens on successful reconnection.
> 
---





## 6. Related Terms

- [JavaScript / TypeScript SDK](js_sdk.md) — SurrealDB npm package overview.
- [Connection Credentials (`USE NS ... DB ...`)](../level_01/connection_credentials.md) — Scope selection.
- [WebSocket vs HTTP Connection](websocket_vs_http.md) — Transport choices.

---

## 7. Key Takeaways
- The standard connection sequence is `.connect()` → `.use()` → `.signin()` → `.close()`.
- Reuse a single connected client instance across requests rather than instantiating new clients per query.
- Always invoke `.close()` during application teardown to free server sockets.
