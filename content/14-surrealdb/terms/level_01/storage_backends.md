# Storage Backends (Memory, RocksDB, TiKV)

> **Level 1 — What Is SurrealDB?**
> The pluggable storage engine architectures supported by SurrealDB: `memory` (volatile RAM for testing), `rocksdb` / `surrealkv` (local disk files for single-node production), and `tikv` (distributed key-value clusters for horizontally-scaled enterprise deployments).

---

## 1. Prerequisites

- [SurrealDB Server (`surreal start`)](surreal_start.md) — The startup command configuration.

---

## 2. Term Category


**Performance / Operations (pluggable storage engine backends)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional databases, the query parser and the storage format are tightly coupled:
-   PostgreSQL writes data to disk using its own custom directory pages.
-   MongoDB relies on the WiredTiger engine.
-   If you want to run PostgreSQL entirely in-memory for fast unit testing, or shard it across 10 servers, you must install complex extensions.

We designed SurrealDB with a **Pluggable Storage Engine Architecture**. 

The SurrealQL query compiler sits on top of a generic key-value abstraction layer. 

This means SurrealDB does not care *where* the data is physically saved. 

By changing a single command argument, you can switch the storage engine from local RAM (for development speed) to a local file cabinet (for small apps), or a massive distributed key-value cluster (for global scale), without changing a single line of your application query code.

---

### (2) The Three Primary Backends

#### 1. Memory (`memory`)
Stores all data in the server's RAM cache.
-   *Pros:* Extremely fast query execution times; zero disk setup required.
-   *Cons:* Volatile. When the server process terminates, all data is lost.
-   *Use Case:* Local testing, unit tests, and fast CRUD prototyping.

#### 2. Local Disk (`rocksdb` / `surrealkv`)
Stores data in local files on the server's hard drive.
-   **RocksDB:** Facebook's high-performance embeddable key-value store.
-   **SurrealKV:** A native Rust key-value store built specifically for SurrealDB (includes native versioning).
-   *Pros:* Persistent data. Highly optimized for SSD storage.
-   *Cons:* Single-node restriction. Cannot scale out horizontally across multiple machines easily.
-   *Use Case:* Small-to-medium production apps running on a single server.

#### 3. Distributed KV (`tikv`)
An open-source, transactional distributed key-value database (maintained by the CNCF).
-   *Pros:* Automatically handles horizontal scaling, sharding, high-availability replication, and failover across multiple servers.
-   *Cons:* High operational setup complexity.
-   *Use Case:* Large, enterprise production deployments.

---

### (3) Reality Metaphor (Filing Papers)
Imagine storing client medical records in a doctor's office:
-   **Memory (`memory`):** Spreading all client papers out across your **Office Desks**. 
    -   You can read any page instantly. 
    -   But if a sudden gust of wind blows through the window (server crash or restart), all your files blow away and are lost forever.
-   **Local Disk (`rocksdb`):** Storing papers inside a **Locked Metal Cabinet** in the office. 
    -   Files are persistent and safe. 
    -   But if the building loses power or you run out of floor space, you cannot store more files.
-   **Distributed (`tikv`):** Renting space in a **Statewide Network of Secure Warehouses**. 
    -   If one warehouse floods, duplicate copies of your files exist at the other warehouses. 
    -   If you need more space, the company builds another warehouse.

---

### (4) Code Examples

#### Starting SurrealDB with Different Backends
You select the backend using the connection protocol prefix in the final argument:

```bash
# 1. Start in-memory (volatile, local testing)
surreal start --user root --pass root memory

# 2. Start using local file-based persistent storage (RocksDB)
# Creates files in '/var/lib/surreal/data/'
surreal start --user root --pass root file:///var/lib/surreal/data/mydb

# 3. Start using distributed TiKV cluster
# Connects to the TiKV cluster nodes list
surreal start --user root --pass root tikv://10.0.0.1:2379,10.0.0.2:2379
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Launching a production application pointing to the 'memory' storage backend, resulting in complete database data loss on server reboots

**The mistake:** Deploying a website, configuring the system service to start SurrealDB using `surreal start memory`, and noticing that when the cloud VPS reboots for standard kernel updates, all user records and billing ledgers disappear.

**Why it's wrong:** The `memory` backend does not write changes to disk. 

It is designed strictly for transient development testing. 

Any server crash, process reboot, or system update will wipe the database clean.

**Fix: Always use a persistent protocol like `file://` (RocksDB/SurrealKV) or `tikv://` for production databases to ensure durability.**

---



### Mistake 2: Deploying In-Memory Engine `mem://` to Production Environments

**The mistake:** Starting production database servers with `surreal start mem://`.

**Why it's wrong:** `mem://` stores all data purely in RAM volatile memory. When the process restarts or crashes, all data is lost permanently.

*Incorrect:*
```surrealql
$ surreal start mem:// --user root --pass root # ❌ Volatile! Data lost on restart!
```

*Fix:*
```surrealql
$ surreal start rocksdb:///var/lib/surrealdb/data.db # Persistent disk storage
```

### Mistake 3: Using File-Based Storage (`surrealkv` / `rocksdb`) for Distributed Multi-Node Clusters

**The mistake:** Attempting to run multiple distributed SurrealDB nodes pointing to a single file path `rocksdb://data.db`.

**Why it's wrong:** Local file backends support single-node instances only. For distributed multi-node HA clusters, use `tikv://` backend.

*Incorrect:*
```surrealql
$ surreal start rocksdb://shared_nfs/data.db # ❌ File lock contention in cluster!
```

*Fix:*
```surrealql
$ surreal start tikv://10.0.0.1:2379 # Distributed TiKV cluster storage
```

## 5. Practice Exercises

### Exercise 1: Storage Engine Selection Matrix

**Scenario:**
An infrastructure architect is selecting storage engine backends for three distinct SurrealDB deployment workloads.

**Requirements:**
1. Select a storage engine for stateless microservice CI/CD unit testing.
2. Select a storage engine for a single-node persistent edge gateway device.
3. Select a storage engine for a multi-node distributed cloud deployment handling petabytes of data.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> - Unit Testing: Memory Engine (mem://)
> - Single-Node Edge Persistence: SurrealKV or RocksDB (file://data/app.db or rocksdb://data/app.db)
> - Multi-Node Distributed Cloud: TiKV Cluster (tikv://localhost:2379)
> ```
>
> #### Technical Explanation
>
> 1. `mem://` runs in RAM with zero disk I/O, providing instantaneous startup and teardown for test suites.
> 2. `SurrealKV` / `RocksDB` provide ACID persistent key-value storage on local disk for single-instance deployments.
> 3. `TiKV` is a CNCF distributed transactional key-value store that allows SurrealDB to scale horizontally across server clusters.
> 
---

### Exercise 2: CLI Startup for Distributed TiKV Backend

**Scenario:**
A DevOps engineer needs to start a production SurrealDB instance connecting to an existing TiKV cluster at `10.0.0.1:2379`.

**Requirements:**
1. Formulate the `surreal start` command specifying the TiKV storage engine path.
2. Include authentication and binding configurations.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal start >   --bind 0.0.0.0:8000 >   --user root >   --pass SuperSecretRootPass123 >   tikv://10.0.0.1:2379
> ```
>
> #### Technical Explanation
>
> 1. The `tikv://` URI prefix instructs SurrealDB to delegate key-value storage operations to a TiKV cluster.
> 2. Decouples SurrealDB compute nodes from underlying storage, enabling stateless auto-scaling of database compute instances.
> 3. `--bind 0.0.0.0:8000` exposes the SurrealDB WebSocket/HTTP interface to external application traffic.
> 
---

### Exercise 3: Storage Backend Abstraction Invariants

**Scenario:**
A developer asks if SurrealQL queries (`SELECT`, `RELATE`, `DEFINE TABLE`) need to be rewritten when migrating from single-node `file://` storage to distributed `tikv://` storage.

**Requirements:**
1. State whether SurrealQL code changes across storage engines.
2. Explain the storage abstraction layer architecture of SurrealDB.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Answer: No, zero SurrealQL query code changes are required.
> ```
> 
> ```surrealql
> -- This query executes identically regardless of whether the backend is mem://, file://, or tikv://!
> SELECT * FROM user WHERE status = "active";
> ```
>
> #### Technical Explanation
>
> 1. SurrealDB uses a pluggable Key-Value (KV) storage abstraction layer separating query parsing from physical storage engines.
> 2. All tables, documents, indexes, and graph edges are serialized into standardized key-value ranges regardless of storage engine.
> 3. Applications can move from local prototyping (`mem://`) to single-node disk (`file://`) to cloud clusters (`tikv://`) without modifying SurrealQL query scripts.
> 
---



## 6. Related Terms

- [SurrealDB Server (`surreal start`)](surreal_start.md) — The startup command configuration.
- [TiKV Backend (Distributed Mode)](../level_10/tikv_backend.md) — The distributed mode.
- [Transaction Isolation & Atomicity Semantics](../level_09/transaction_isolation.md) — Related concept: Transaction Isolation & Atomicity Semantics.
- [Docker Deployment](../level_10/docker_deployment.md) — Related concept: Docker Deployment.
- [Embedding SurrealDB (Rust / WASM)](../level_10/embedding.md) — Related concept: Embedding SurrealDB (Rust / WASM).

---

## 7. Key Takeaways
- Pluggable storage architecture separates query parsing from physical disk writes.
- Changing storage backends does not require altering query SurrealQL code.
- `memory` stores data in RAM (blazing fast, volatile, ideal for local tests).
- `file://` writes to local disk files using RocksDB or SurrealKV engines.
- `tikv://` connects to a distributed cluster for horizontal scaling and redundancy.
- Never use the `memory` storage backend for production environments.
- Verify write permissions on file paths when starting `file://` engines.
