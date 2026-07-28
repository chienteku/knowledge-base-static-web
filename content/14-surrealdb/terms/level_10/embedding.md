# Embedding SurrealDB (Rust / WASM)

> **Level 10 — SDKs, Deployment & Production**
> Running SurrealDB directly inside an application process (without a separate database server process) using the native Rust crate or WebAssembly (WASM) in browser environments.

---

## 1. Prerequisites
- [SurrealDB](../level_01/surrealdb.md) — Multi-model database architecture.
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — In-memory and file storage backends.

---

## 2. Term Category
- **Architecture & Embedded Systems**

---

## 3. Environment Context
- **Embedded Application Runtimes** (Rust desktop applications, CLI binaries, Edge devices, or WebAssembly browser applications).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Traditional databases (PostgreSQL, MongoDB) require running a separate client-server process. For desktop applications (Electron/Tauri), mobile apps, local CLI tools, offline-first WebAssembly web apps, or edge computing, running a separate database server process adds installation friction and system overhead. SQLite is traditionally used for embedded storage, but lacks document nesting, graph traversal, and real-time live queries.

Because SurrealDB is written in Rust, the entire SurrealDB engine can be compiled and **embedded directly into an application process**:
1. **Rust Crate (`surrealdb`)**: Rust applications import SurrealDB as a library (`surrealdb::engine::local::Mem`). The database runs in the same memory space as the application with zero network latency.
2. **WebAssembly (WASM)**: SurrealDB compiles to WASM, allowing full database instances to run inside browser memory (`IndexedDB` persistent storage). This enables true **offline-first local-first web applications**.

### (2) Reality Metaphor
Think of audio playback:
- **Client-Server DB (PostgreSQL/MongoDB)**: Streaming music over Spotify — your app requires an active network connection to a distant streaming server.
- **Embedded DB (SurrealDB Rust/WASM)**: Playing an MP3 file stored directly on your phone — instant playback with zero latency, working 100% offline in airplane mode.

### (3) Code Examples

#### Short Snippet (Rust Embedded Database)
```rust
// Embedded Rust SurrealDB instance running in-memory (No server process needed!)
use surrealdb::engine::local::Mem;
use surrealdb::Surreal;

#[tokio::main]
async fn main() -> surrealdb::Result<()> {
    let db = Surreal::new::<Mem>(()).await?;
    db.use_ns("test").use_db("test").await?;

    // Query in-memory embedded database directly
    let users: Vec<serde_json::Value> = db.select("user").await?;
    println!("Users: {:?}", users);
    Ok(())
}
```

#### Fuller Example (WASM Browser In-Memory / IndexedDB)
```typescript
import { Surreal } from 'surrealdb';
import { surrealkv } from 'surrealdb/wasm'; // WebAssembly storage engine

async function initOfflineFirstApp() {
    const db = new Surreal();

    // 1. Initialize embedded WASM SurrealDB engine inside Browser memory
    await db.connect('wasm://', {
        engines: { surrealkv }
    });

    await db.use({ namespace: 'local_app', database: 'offline_db' });

    // 2. Perform full SurrealQL queries locally in the browser offline!
    await db.create('note', {
        title: 'Offline Note',
        content: 'Written while on an airplane with no internet connection!',
        created_at: new Date()
    });

    const notes = await db.select('note');
    console.log('Local WASM Database Notes:', notes);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting Embedded WASM Databases to Share Memory across Multiple Browser Tabs

**The mistake:** Assuming an embedded WASM in-memory database instance opened in Browser Tab A is automatically accessible to Browser Tab B.

**Why it's wrong:** Each browser tab runs in an isolated JavaScript worker thread. In-memory WASM instances are tab-specific unless backed by browser storage engines like IndexedDB (`surrealkv`).

*Fix:*
Use IndexedDB-backed WASM storage for multi-tab persistence, or use standard WebSocket client connections when connecting to a central server.

---



### Mistake 2: Attempting RPC Network Overhead Calls in Embedded Rust Instances

**The mistake:** Connecting via `ws://` inside embedded Rust applications.

**Why it's wrong:** Embedded SurrealDB runs directly inside the application process memory without network latency. Use `Surreal::new::<RocksDb>("path/to/db")` directly.

*Incorrect:*
```surrealql
// Unnecessary network call in embedded Rust app
let db = Surreal::new::<Ws>("127.0.0.1:8000").await?;
```

*Fix:*
```surrealql
let db = Surreal::new::<RocksDb>("path/to/db").await?; // Zero network overhead embedded instance
```

### Mistake 3: Using Non-Thread-Safe Database Handles Across Concurrent Tokio Threads

**The mistake:** Creating a new database instance on every async HTTP request in Rust.

**Why it's wrong:** SurrealDB handles `Surreal<C>` are thread-safe and cheap to clone (`Arc` wrapper). Share a single `Surreal` handle across application worker threads.

*Incorrect:*
```surrealql
// Creating database instance per request
let db = Surreal::new::<Mem>(()).await?; // ❌ Expensive re-initialization!
```

*Fix:*
```surrealql
let db = db.clone(); // Cheap thread-safe handle clone
```



### Mistake 4: Attempting RPC Network Overhead Calls in Embedded Rust Instances

**The mistake:** Connecting via `ws://` inside embedded Rust applications.

**Why it's wrong:** Embedded SurrealDB runs directly inside the application process memory without network latency. Use `Surreal::new::<RocksDb>("path/to/db")` directly.

*Incorrect:*
```surrealql
// Unnecessary network call in embedded Rust app
let db = Surreal::new::<Ws>("127.0.0.1:8000").await?;
```

*Fix:*
```surrealql
let db = Surreal::new::<RocksDb>("path/to/db").await?; // Zero network overhead embedded instance
```

### Mistake 5: Using Non-Thread-Safe Database Handles Across Concurrent Tokio Threads

**The mistake:** Creating a new database instance on every async HTTP request in Rust.

**Why it's wrong:** SurrealDB handles `Surreal<C>` are thread-safe and cheap to clone (`Arc` wrapper). Share a single `Surreal` handle across application worker threads.

*Incorrect:*
```surrealql
// Creating database instance per request
let db = Surreal::new::<Mem>(()).await?; // ❌ Expensive re-initialization!
```

*Fix:*
```surrealql
let db = db.clone(); // Cheap thread-safe handle clone
```

## 6. Practice Exercises

### Exercise 1: Embedded Architecture Capability
Name the 2 primary embedded runtimes supported by SurrealDB:
1. Native desktop/CLI systems language runtime.
2. In-browser client WebAssembly runtime.

> [!check]- Answer
> - 1 = Rust crate (`surrealdb`).
> - 2 = WebAssembly (`WASM` / IndexedDB).

---



### Exercise 2: Rust Embedded In-Memory Instance Initialization

**Problem:** Initialize embedded in-memory SurrealDB instance in Rust using `Surreal::new::<Mem>(())`.

**Expected output:**
```text
let db = Surreal::new::<Mem>(()).await?;
```

> [!check]- Answer
> ```rust
> use surrealdb::engine::local::Mem;
> use surrealdb::Surreal;
> let db = Surreal::new::<Mem>(()).await?;
> ```
>
> **Explanation:** Embedded Rust instances run SurrealDB in-process without network overhead.

### Exercise 3: Rust Embedded RocksDB Storage Initialization

**Problem:** Initialize embedded persistent RocksDB instance in Rust.

**Expected output:**
```text
let db = Surreal::new::<RocksDb>("path/to/db").await?;
```

> [!check]- Answer
> ```rust
> use surrealdb::engine::local::RocksDb;
> use surrealdb::Surreal;
> let db = Surreal::new::<RocksDb>("path/to/db").await?;
> ```
>
> **Explanation:** `RocksDb` provides embedded local disk storage in Rust.

## 7. Related Terms
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — In-memory and local storage engines.
- [JavaScript / TypeScript SDK](js_sdk.md) — Web client SDK.
- [Direct Browser-to-Database Architecture](../level_08/browser_to_db.md) — Browser connectivity.

---

## 8. Key Takeaways
- SurrealDB can run embedded inside application processes without a separate server process.
- Native Rust crate embedding provides zero-latency in-process database execution.
- WebAssembly (WASM) embedding enables true offline-first local database storage inside web browsers.
