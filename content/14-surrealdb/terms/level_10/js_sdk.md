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


**Integration / Ecosystem (official JavaScript/TypeScript SDK library)**: - **SDK & Driver**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: JavaScript SDK Initialization and Scoped Signin

**Scenario:**
Initialize the official `@surrealdb/surrealdb` JavaScript SDK, connect over WebSockets, and sign in to a RECORD access scope.

**Requirements:**
1. Import `Surreal`.
2. Connect to `wss://db.example.com/rpc`.
3. Sign in using `db.signin()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import Surreal from "@surrealdb/surrealdb";

const db = new Surreal();

async function main() {
  await db.connect("wss://db.example.com/rpc");

  await db.signin({
    access: "user_access",
    ns: "main",
    db: "app",
    username: "alice",
    pass: "UserPass123!"
  });

  console.log("SDK connected and authenticated!");
}
```

> #### Technical Explanation
>
> 1. `@surrealdb/surrealdb` provides official TypeScript type-safe client APIs.
> 2. `db.connect()` opens persistent WebSocket binary channels to SurrealDB nodes.
> 3. `db.signin()` authenticates client sessions and stores session tokens automatically.

---

### Exercise 2: Type-Safe SDK Record Selection

**Scenario:**
Execute a type-safe `db.select<User>()` call to fetch user records into typed TypeScript objects.

**Requirements:**
1. Define interface `User`.
2. Execute `db.select<User>("user")`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User {
>   id: string;
>   name: string;
>   email: string;
> }

const users = await db.select<User>("user");
users.forEach(u => console.log(u.name, u.email));
```

> #### Technical Explanation
>
> 1. Generic type parameters (`db.select<User>()`) enforce TypeScript interface typing on returned query payloads.
> 2. Prevents runtime `any` type casting errors in frontend applications.
> 3. Provides IDE auto-completion for record fields.

---

### Exercise 3: Closing SDK Connections Cleanly

**Scenario:**
Close an active SDK database connection cleanly during application shutdown using `db.close()`.

**Requirements:**
1. Call `await db.close()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> async function cleanup() {
>   await db.close();
>   console.log("SDK connection closed cleanly.");
> }
> ```
>
> #### Technical Explanation
>
> 1. `db.close()` closes the underlying WebSocket connection and releases socket listeners.
> 2. Prevents memory leaks and hung process handles during process exit.
> 3. Good practice in serverless or desktop application teardown routines.

---





## 6. Related Terms

- [SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`)](sdk_connection.md) — Connection sequence details.
- [SDK CRUD Methods (`.select()` / `.create()` / `.update()` / `.delete()`)](sdk_crud.md) — Ergonomic methods.
- [WebSocket vs HTTP Connection](websocket_vs_http.md) — Choosing transport protocols.
- [SurrealQL Injection Prevention](../level_08/injection_prevention.md) — Related concept: SurrealQL Injection Prevention.
- [`KILL` (Stopping Live Queries)](../level_09/kill_live_query.md) — Related concept: `KILL` (Stopping Live Queries).
- [Embedding SurrealDB (Rust / WASM)](embedding.md) — Related concept: Embedding SurrealDB (Rust / WASM).
- [SDK Error Handling & Retry Patterns](sdk_error_handling.md) — Related concept: SDK Error Handling & Retry Patterns.
- [SDK Live Query Subscriptions](sdk_live_queries.md) — Related concept: SDK Live Query Subscriptions.

---

## 7. Key Takeaways
- The `surrealdb` npm package is the official isomorphic TypeScript driver.
- Supports both backend (Node.js/Bun/Deno) and frontend (Browser/React Native) runtimes.
- Provides type inference, auto-reconnection, and WebSocket stream support out of the box.
