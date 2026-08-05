# JavaScript / TypeScript SDK

> **Level 10 — SDKs, Deployment & Production**
> The official `surrealdb` npm package providing TypeScript-first client connectivity, authentication, query execution, and real-time WebSocket subscriptions for Node.js and browser environments.

---

## 1. Prerequisites

- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](../level_01/connection_uri.md) — Protocol formats (`ws://`, `wss://`, `http://`).
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](../level_08/define_access_record.md) — Client authentication.
- [SurrealDB](../level_01/surrealdb.md) — SurrealDB core server.

---

## 2. Term Category
- **SDK & Driver**

---

## 3. Environment Context
- **Client Application Runtime** (Node.js, Bun, Deno, modern Web Browsers, and React Native).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
To query SurrealDB from application code, developers need a robust driver library that manages network sockets, encodes JSON parameters, serializes record IDs, handles TypeScript types, and reconnects automatically when WebSocket connections drop.

The official `surrealdb` library (installed via `npm install surrealdb`) is SurrealDB's primary client SDK. Written in TypeScript, it supports both isomorphic environments (Node.js backend and browser frontend) and exposes ergonomic methods for authentication (`.signin()`), schema execution (`.query()`), CRUD operations (`.select()`), and real-time push streams (`.live()`).

### (2) Reality Metaphor
Think of an international adapter plug:
- **SurrealDB Engine**: A high-voltage power grid supplying clean electricity.
- **`surrealdb` SDK**: The universal smart adapter plug. It translates your device's standard TypeScript function calls (`db.select('user')`) into the exact network protocol messages expected by the grid.

### (3) Code Examples

#### Short Snippet
```typescript
import { Surreal } from 'surrealdb';

const db = new Surreal();
// Connect to SurrealDB instance
await db.connect('ws://127.0.0.1:8000/rpc');
```

#### Fuller Example
```typescript
import { Surreal, RecordId } from 'surrealdb';

interface User {
    id: RecordId<'user'>;
    name: string;
    email: string;
}

async function main() {
    const db = new Surreal();

    try {
        // 1. Connect over WebSocket
        await db.connect('ws://127.0.0.1:8000/rpc');

        // 2. Select Namespace and Database
        await db.use({ namespace: 'app', database: 'prod' });

        // 3. Authenticate
        await db.signin({
            access: 'account_auth',
            variables: { email: 'user@example.com', pass: 'secret123' }
        });

        // 4. Perform typed query
        const users = await db.select<User>('user');
        console.log('Fetched users:', users);

    } finally {
        // 5. Close connection gracefully
        await db.close();
    }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Call `.use()` Before Querying

**The mistake:** Calling `db.connect()` and immediately executing queries without setting namespace and database via `.use()`.

**Why it's wrong:** SurrealDB needs to know which Namespace and Database context to query. Omitting `.use()` results in "No namespace selected" errors.

*Incorrect:*
```typescript
const db = new Surreal();
await db.connect('ws://localhost:8000/rpc');
await db.select('post'); // Error: No namespace or database selected!
```

*Fix:*
```typescript
const db = new Surreal();
await db.connect('ws://localhost:8000/rpc');
await db.use({ namespace: 'my_ns', database: 'my_db' });
await db.select('post'); // Works!
```

---



### Mistake 2: Instantiating `new Surreal()` without Awaiting `db.connect()`

**The mistake:** Calling `db.select('user')` immediately after `const db = new Surreal()` without calling `await db.connect()`.

**Why it's wrong:** `new Surreal()` creates the SDK client object. Connecting over WebSockets is async and must be awaited before executing queries.

*Incorrect:*
```surrealql
const db = new Surreal();
await db.select("user"); // ❌ Error: Connection not established!
```

*Fix:*
```surrealql
const db = new Surreal();
await db.connect("ws://127.0.0.1:8000/rpc");
await db.select("user"); // Correct awaited connection
```

### Mistake 3: Executing Queries Before Specifying Namespace and Database in JS SDK

**The mistake:** Connecting to WebSocket and running queries without calling `db.use({ ns, db })` or `db.signin()`.

**Why it's wrong:** Executing queries without selecting active namespace and database scope targets throws `There is no database selected` error.

*Incorrect:*
```surrealql
await db.connect("ws://127.0.0.1:8000/rpc");
await db.select("user"); // ❌ Missing ns and db scope!
```

*Fix:*
```surrealql
await db.connect("ws://127.0.0.1:8000/rpc");
await db.use({ ns: "main", db: "app" });
await db.select("user");
```



### Mistake 4: Instantiating `new Surreal()` without Awaiting `db.connect()`

**The mistake:** Calling `db.select('user')` immediately after `const db = new Surreal()` without calling `await db.connect()`.

**Why it's wrong:** `new Surreal()` creates the SDK client object. Connecting over WebSockets is async and must be awaited before executing queries.

*Incorrect:*
```surrealql
const db = new Surreal();
await db.select("user"); // ❌ Error: Connection not established!
```

*Fix:*
```surrealql
const db = new Surreal();
await db.connect("ws://127.0.0.1:8000/rpc");
await db.select("user"); // Correct awaited connection
```

### Mistake 5: Executing Queries Before Specifying Namespace and Database in JS SDK

**The mistake:** Connecting to WebSocket and running queries without calling `db.use({ ns, db })` or `db.signin()`.

**Why it's wrong:** Executing queries without selecting active namespace and database scope targets throws `There is no database selected` error.

*Incorrect:*
```surrealql
await db.connect("ws://127.0.0.1:8000/rpc");
await db.select("user"); // ❌ Missing ns and db scope!
```

*Fix:*
```surrealql
await db.connect("ws://127.0.0.1:8000/rpc");
await db.use({ ns: "main", db: "app" });
await db.select("user");
```

## 6. Practice Exercises

### Exercise 1: Install Package Command
What NPM command is used to install the official SurrealDB JavaScript/TypeScript client library?

> [!check]- Answer
> - Package name: `surrealdb`. Command: `npm install surrealdb`.

---



### Exercise 2: JavaScript SDK Setup Flow

**Problem:** Write full JS SDK startup sequence: 1. Instantiate `Surreal`, 2. Connect, 3. Select NS/DB, 4. Signin.

**Expected output:**
> [!check]- Answer
> ```text
> const db = new Surreal(); await db.connect(uri); await db.use({ ns, db }); await db.signin(creds);
> ```
> ```javascript
> const db = new Surreal();
> await db.connect("ws://127.0.0.1:8000/rpc");
> await db.use({ ns: "main", db: "app" });
> await db.signin({ user: "root", pass: "root" });
> ```
>
> **Explanation:** Modern SurrealDB JS SDK workflow requires connecting, setting scope, and signing in.

---

### Exercise 3: SDK Package Name

**Problem:** Official npm package name for SurrealDB JavaScript SDK (`surrealdb` or `@surrealdb/surrealdb`).

**Expected output:**
> [!check]- Answer
> ```text
> surrealdb
> ```
> ```text
> surrealdb
> ```
>
> **Explanation:** `npm install surrealdb` installs the official JavaScript/TypeScript SDK.

## 7. Related Terms

- [SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`)](sdk_connection.md) — Connection sequence details.
- [SDK CRUD Methods (`.select()` / `.create()` / `.update()` / `.delete()`)](sdk_crud.md) — Ergonomic methods.
- [WebSocket vs HTTP Connection](websocket_vs_http.md) — Choosing transport protocols.
- [SurrealQL Injection Prevention](../level_08/injection_prevention.md) — Related concept: SurrealQL Injection Prevention.
- [`KILL` (Stopping Live Queries)](../level_09/kill_live_query.md) — Related concept: `KILL` (Stopping Live Queries).
- [Embedding SurrealDB (Rust / WASM)](embedding.md) — Related concept: Embedding SurrealDB (Rust / WASM).
- [SDK Error Handling & Retry Patterns](sdk_error_handling.md) — Related concept: SDK Error Handling & Retry Patterns.
- [SDK Live Query Subscriptions](sdk_live_queries.md) — Related concept: SDK Live Query Subscriptions.

---

## 8. Key Takeaways
- The `surrealdb` npm package is the official isomorphic TypeScript driver.
- Supports both backend (Node.js/Bun/Deno) and frontend (Browser/React Native) runtimes.
- Provides type inference, auto-reconnection, and WebSocket stream support out of the box.
