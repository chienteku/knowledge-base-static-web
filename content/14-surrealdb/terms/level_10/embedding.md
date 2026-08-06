# Embedding SurrealDB (Rust / WASM)

> **Level 10 — SDKs, Deployment & Production**
> Running SurrealDB directly inside an application process (without a separate database server process) using the native Rust crate or WebAssembly (WASM) in browser environments.

---

## 1. Prerequisites

- [SurrealDB](../level_01/surrealdb.md) — Multi-model database architecture.
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — In-memory and file storage backends.

---

## 2. Term Category


**Embedded Mode (Rust and WASM in-memory database engine)**: - **Architecture & Embedded Systems**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Embedded In-Memory Engine in Rust

**Scenario:**
A Rust desktop application initializes SurrealDB directly as an embedded in-memory database engine without running a separate server process.

**Requirements:**
1. Write Rust SDK connection initialization code using `surrealdb::engine::local::Mem`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use surrealdb::engine::local::Mem;
> use surrealdb::Surreal;

#[tokio::main]
async fn main() -> surrealdb::Result<()> {
    // Initialize embedded in-memory engine
    let db = Surreal::new::<Mem>(()).await?;
    db.use_ns("test").use_db("test").await?;
    
    println!("Embedded Rust database engine initialized!");
    Ok(())
}
```

> #### Technical Explanation
>
> 1. `Surreal::new::<Mem>(())` compiles the SurrealDB engine directly inside the Rust application binary.
> 2. Zero-network latency for local database queries.
> 3. Eliminates external database server installation requirements.

---

### Exercise 2: Embedded WebAssembly (WASM) in Browser Apps

**Scenario:**
An offline-first web application runs SurrealDB embedded inside the browser using WebAssembly (WASM) and IndexedDB persistence.

**Requirements:**
1. Describe browser WASM initialization using `@surrealdb/surrealdb/wasm`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { Surreal } from "@surrealdb/surrealdb";
> import { indb } from "@surrealdb/surrealdb/wasm";

const db = new Surreal();

// Initialize embedded WASM engine with browser IndexedDB storage
await db.connect("indxdb://my_app_db");
await db.use({ ns: "app", db: "main" });
```

> #### Technical Explanation
>
> 1. Compiles SurrealDB into WebAssembly (WASM) running inside browser client threads.
> 2. `indxdb://` connects to browser IndexedDB for local offline persistence.
> 3. Enables local-first desktop and web app architectures.

---

### Exercise 3: Comparing Embedded vs Client-Server Deployments

**Scenario:**
Compare embedded mode vs client-server WebSocket mode across latency, deployment complexity, and scalability dimensions.

**Requirements:**
1. Contrast latency and deployment overhead.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Embedded Mode:
> - Latency: Zero network latency (direct memory function calls).
> - Deployment: Single self-contained application binary.
> - Multi-Client: Restricted to process-local access.
> 
> Client-Server Mode:
> - Latency: Network WebSocket roundtrip (~1-5ms).
> - Deployment: Requires running separate database server cluster.
> - Multi-Client: Scales across thousands of concurrent web clients.
> ```
>
> #### Technical Explanation
>
> 1. Embedded mode excels in desktop apps, CLI tools, and offline-first browser apps.
> 2. Client-server mode excels in multi-tenant cloud applications with central databases.
> 3. Provides identical SurrealQL syntax across both deployment models.

---





## 6. Related Terms

- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — In-memory and local storage engines.
- [JavaScript / TypeScript SDK](js_sdk.md) — Web client SDK.
- [Direct Browser-to-Database Architecture](../level_08/browser_to_db.md) — Browser connectivity.

---

## 7. Key Takeaways
- SurrealDB can run embedded inside application processes without a separate server process.
- Native Rust crate embedding provides zero-latency in-process database execution.
- WebAssembly (WASM) embedding enables true offline-first local database storage inside web browsers.
