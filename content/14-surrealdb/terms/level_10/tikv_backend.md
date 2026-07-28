# TiKV Backend (Distributed Mode)

> **Level 10 — SDKs, Deployment & Production**
> SurrealDB's distributed storage engine backend leveraging TiKV to provide horizontal scaling, automatic data sharding, multi-region replication, and high availability for enterprise production workloads.

---

## 1. Prerequisites
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Pluggable storage architecture.
- [Transaction Isolation & Atomicity Semantics](../level_09/transaction_isolation.md) — Snapshot isolation.

---

## 2. Term Category
- **Distributed Systems & Storage**

---

## 3. Environment Context
- **Large-Scale Production Clusters** (Deployed across Kubernetes or multi-node cloud servers for high-concurrency workloads).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Single-node file-based storage engines (like RocksDB or SurrealKV) are fast and easy to set up for local development or small applications. However, single-node storage cannot scale beyond the physical disk capacity or CPU throughput of a single server. If that single server fails, the database goes offline.

For large-scale, mission-critical applications, SurrealDB integrates **TiKV** (a CNCF-graduated, open-source distributed transactional key-value store). When started with `tikv://pd-cluster:2379`, SurrealDB functions as a **horizontally scalable distributed database**:
- **Automatic Data Sharding**: Data is automatically partitioned across multiple TiKV nodes without manual database sharding code.
- **Raft Consensus Replication**: Data chunks (Regions) are replicated using the Raft consensus algorithm, guaranteeing zero data loss if individual nodes crash.
- **Stateless Compute Scaling**: SurrealDB query processing nodes become completely stateless, allowing you to add or remove query nodes dynamically behind a load balancer.

### (2) Reality Metaphor
Think of a large logistics fulfillment center network:
- **Single-Node Storage**: One large warehouse. If that warehouse fills up or burns down, fulfillment stops.
- **TiKV Distributed Storage**: A national network of 50 connected fulfillment hubs. Incoming inventory is automatically split into smaller packages and distributed across multiple hubs. If one hub suffers a power outage, the other 49 hubs immediately reroute deliveries without interruption.

### (3) Code Examples

#### Short Snippet
```bash
# Start SurrealDB server connecting to a distributed TiKV Placement Driver (PD) cluster
surreal start --user root --pass root tikv://10.0.1.20:2379
```

#### Fuller Example Architecture
```
                     ┌───────────────────────┐
                     │   Load Balancer       │
                     └──────────┬────────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
    ┌────────────────────┐            ┌────────────────────┐
    │ SurrealDB Node 1   │            │ SurrealDB Node 2   │
    │ (Stateless Compute)│            │ (Stateless Compute)│
    └──────────┬─────────┘            └──────────┬─────────┘
               │                                 │
    ───────────┴─────────────────────────────────┴───────────
    Distributed Storage Layer (TiKV Cluster via Raft Consensus)
    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
    │ TiKV Node A  │      │ TiKV Node B  │      │ TiKV Node C  │
    └──────────────┘      └──────────────┘      └──────────────┘
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using TiKV Backend for Local Single-Developer Setups

**The mistake:** Setting up a full multi-node TiKV cluster for local laptop development or small single-node hobby projects.

**Why it's wrong:** TiKV requires placement driver (PD) cluster orchestration, extra RAM, and network complexity. For local development or simple single-node deployments, use `memory://` or `surrealkv://`.

*Incorrect:*
```bash
# Excessive complexity for simple local testing!
surreal start tikv://127.0.0.1:2379
```

*Fix:*
```bash
# Use local file-based storage for single-node development
surreal start surrealkv://data/my_database.db
```

---



### Mistake 2: Using File Storage Backends (`rocksdb`) for Distributed Multi-Node High Availability Clusters

**The mistake:** Attempting to point 5 SurrealDB nodes to a single shared file directory `rocksdb://shared_nfs`.

**Why it's wrong:** Local file backends support single-node instances only. Multi-node distributed SurrealDB clusters strictly require the `tikv://` backend.

*Incorrect:*
```surrealql
$ surreal start rocksdb://shared_nfs/data.db # ❌ File locking errors in cluster!
```

*Fix:*
```surrealql
$ surreal start tikv://10.0.0.1:2379 # Distributed TiKV cluster storage
```

### Mistake 3: Deploying Single-Node TiKV Cluster Without Placement Driver (PD) Endpoints

**The mistake:** Starting SurrealDB with `tikv://` without specifying TiKV Placement Driver (PD) server addresses.

**Why it's wrong:** SurrealDB communicates with TiKV clusters through PD endpoints (`tikv://pd1:2379,pd2:2379`).

*Incorrect:*
```surrealql
$ surreal start tikv:// # ❌ Missing PD endpoint addresses!
```

*Fix:*
```surrealql
$ surreal start tikv://10.0.0.1:2379,10.0.0.2:2379
```



### Mistake 4: Using File Storage Backends (`rocksdb`) for Distributed Multi-Node High Availability Clusters

**The mistake:** Attempting to point 5 SurrealDB nodes to a single shared file directory `rocksdb://shared_nfs`.

**Why it's wrong:** Local file backends support single-node instances only. Multi-node distributed SurrealDB clusters strictly require the `tikv://` backend.

*Incorrect:*
```surrealql
$ surreal start rocksdb://shared_nfs/data.db # ❌ File locking errors in cluster!
```

*Fix:*
```surrealql
$ surreal start tikv://10.0.0.1:2379 # Distributed TiKV cluster storage
```

### Mistake 5: Deploying Single-Node TiKV Cluster Without Placement Driver (PD) Endpoints

**The mistake:** Starting SurrealDB with `tikv://` without specifying TiKV Placement Driver (PD) server addresses.

**Why it's wrong:** SurrealDB communicates with TiKV clusters through PD endpoints (`tikv://pd1:2379,pd2:2379`).

*Incorrect:*
```surrealql
$ surreal start tikv:// # ❌ Missing PD endpoint addresses!
```

*Fix:*
```surrealql
$ surreal start tikv://10.0.0.1:2379,10.0.0.2:2379
```

## 6. Practice Exercises

### Exercise 1: Identify Distributed Storage Component
What CNCF-graduated distributed key-value engine does SurrealDB use to achieve horizontal scaling and Raft consensus replication?

> [!check]- Answer
> - Engine name: TiKV.

---



### Exercise 2: Starting SurrealDB with TiKV Backend

**Problem:** CLI command to start SurrealDB server connected to TiKV PD cluster at `10.0.0.1:2379`.

**Expected output:**
```text
surreal start --bind 0.0.0.0:8000 tikv://10.0.0.1:2379
```

> [!check]- Answer
> ```text
> surreal start --bind 0.0.0.0:8000 tikv://10.0.0.1:2379
> ```
>
> **Explanation:** `tikv://pd_address:2379` connects SurrealDB nodes to distributed TiKV storage clusters.

### Exercise 3: Distributed Scaling Architecture

**Problem:** Explain role of TiKV in SurrealDB multi-node deployments (Provides distributed horizontal key-value storage with Raft consensus).

**Expected output:**
```text
Provides distributed ACID key-value storage and Raft consensus replication across nodes
```

> [!check]- Answer
> ```text
> Provides distributed ACID key-value storage and Raft consensus replication across nodes
> ```
>
> **Explanation:** TiKV enables unlimited horizontal scale and high availability for SurrealDB clusters.

## 7. Related Terms
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Storage backend overview.
- [SurrealDB Server (`surreal start`)](../level_01/surreal_start.md) — Server startup flags.
- [SurrealDB Cloud](surrealdb_cloud.md) — Managed distributed cloud instances.

---

## 8. Key Takeaways
- TiKV is SurrealDB's distributed storage engine for multi-node production clusters.
- Provides horizontal data scaling, automatic sharding, and Raft-based multi-region replication.
- Decouples stateless compute (SurrealDB query nodes) from distributed state (TiKV storage nodes).
