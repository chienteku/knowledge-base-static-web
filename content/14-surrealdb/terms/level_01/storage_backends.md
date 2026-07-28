# Storage Backends (Memory, RocksDB, TiKV)

> **Level 1 — What Is SurrealDB?**
> The pluggable storage engine architectures supported by SurrealDB: `memory` (volatile RAM for testing), `rocksdb` / `surrealkv` (local disk files for single-node production), and `tikv` (distributed key-value clusters for horizontally-scaled enterprise deployments).

---

## 1. Prerequisites
- [SurrealDB Server (`surreal start`)](surreal_start.md) — The startup command configuration.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Selected as the final startup argument. Decoupled from the SurrealQL query compiler layer).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Backend Selector

**Problem:** You are managing the database lifecycle for a new startup. 
Select the optimal storage backend (**memory**, **file**, or **tikv**) for each phase:
1.  Running automated unit tests in a Github Actions CI/CD pipeline (needs to run in under 30 seconds).
2.  Deploying the initial MVP product to a single AWS EC2 virtual machine (requires data to survive server restarts, but budget is minimal).
3.  Upgrading the production database to handle 50,000 transactions per second across 5 server instances with automatic failover backup redundancy.

**Expected output:**
> [!check]- Answer
> ```text
> 1. memory: In-memory is fast, requires zero disk cleanup between test runs, and volatile loss is fine because tests discard data anyway.
> 2. file (file://): Local file-based RocksDB/SurrealKV provides disk persistence on a single VM without the cost or complexity of a cluster.
> 3. tikv (tikv://): The distributed TiKV backend scales horizontally across multiple servers, providing high-availability replication and sharding.
> ```
> - Match speed requirements and volatility profiles to the engine characteristics.
> - Consider if the deployment is a single machine or a multi-server cluster.

---



### Exercise 2: Selecting Storage Backend Schemes

**Problem:** Match use case with scheme: Local persistent single-node (`rocksdb://` / `surrealkv://`), Multi-node cluster (`tikv://`), Testing (`mem://`).

**Expected output:**
> [!check]- Answer
> ```text
> Testing: mem://, Local Disk: rocksdb:// or surrealkv://, Cluster: tikv://
> ```
> ```text
> Testing: mem://, Local Disk: rocksdb:// or surrealkv://, Cluster: tikv://
> ```
>
> **Explanation:** Storage engine backends plug into SurrealDB core depending on deployment scale.

---

### Exercise 3: Native SurrealKV Engine

**Problem:** What is SurrealDB's embedded Rust key-value storage engine backend? (`surrealkv://`).

**Expected output:**
> [!check]- Answer
> ```text
> surrealkv://
> ```
> ```text
> surrealkv://
> ```
>
> **Explanation:** SurrealKV is SurrealDB's native, zero-dependency embedded Rust storage backend.

## 7. Related Terms
- [SurrealDB Server (`surreal start`)](surreal_start.md) — The startup command configuration.
- [TiKV Backend](../level_10/tikv_backend.md) — The distributed mode.

---

## 8. Key Takeaways
- Pluggable storage architecture separates query parsing from physical disk writes.
- Changing storage backends does not require altering query SurrealQL code.
- `memory` stores data in RAM (blazing fast, volatile, ideal for local tests).
- `file://` writes to local disk files using RocksDB or SurrealKV engines.
- `tikv://` connects to a distributed cluster for horizontal scaling and redundancy.
- Never use the `memory` storage backend for production environments.
- Verify write permissions on file paths when starting `file://` engines.
