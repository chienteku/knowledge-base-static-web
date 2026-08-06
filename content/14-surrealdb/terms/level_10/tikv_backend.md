# TiKV Backend (Distributed Mode)

> **Level 10 — SDKs, Deployment & Production**
> SurrealDB's distributed storage engine backend leveraging TiKV to provide horizontal scaling, automatic data sharding, multi-region replication, and high availability for enterprise production workloads.

---

## 1. Prerequisites

- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Pluggable storage architecture.
- [Transaction Isolation & Atomicity Semantics](../level_09/transaction_isolation.md) — Snapshot isolation.

---

## 2. Term Category


**Performance / Operations (distributed TiKV key-value storage engine)**: - **Distributed Systems & Storage**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Starting SurrealDB with a Distributed TiKV Backend

**Scenario:**
A DevOps engineer launches a production SurrealDB node connected to an external distributed TiKV cluster at `10.0.0.1:2379`.

**Requirements:**
1. Formulate `surreal start` command specifying storage path `tikv://10.0.0.1:2379`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal start >   --bind 0.0.0.0:8000 >   --user root >   --pass "ProductionRootPass!" >   tikv://10.0.0.1:2379
> ```
>
> #### Technical Explanation
>
> 1. `tikv://` configures SurrealDB to use TiKV (CNCF distributed key-value store) as its storage engine backend.
> 2. Decouples SurrealDB stateless compute nodes from physical key-value storage nodes.
> 3. Scales horizontally to handle petabytes of data across distributed server clusters.
> 
---

### Exercise 2: Stateless Compute Auto-Scaling over TiKV

**Scenario:**
Deploy multiple stateless SurrealDB compute instances connecting to the same underlying TiKV cluster.

**Requirements:**
1. Explain how stateless query nodes scale horizontally.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Architecture Setup:
> - Compute Tier: 5 stateless SurrealDB nodes behind a load balancer (ws://lb.example.com).
> - Storage Tier: 3 TiKV storage nodes managing distributed Raft consensus regions.
> ```
>
> #### Technical Explanation
>
> 1. Stateless SurrealDB nodes execute query parsing, permissions, and graph logic.
> 2. Multiple compute nodes read and write to the shared TiKV key-value cluster concurrently.
> 3. Compute nodes can auto-scale up or down dynamically based on query traffic.
> 
---

### Exercise 3: Distributed ACID Transaction Guarantees in TiKV

**Scenario:**
Explain how TiKV maintains ACID transaction guarantees across distributed nodes using 2-Phase Commit (2PC) and Raft consensus.

**Requirements:**
1. Describe distributed transaction consistency.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Distributed Transaction Protocol:
> - TiKV uses 2-Phase Commit (2PC) with Percolator-style transaction isolation.
> - Raft consensus protocol replicates data across 3+ storage nodes for fault tolerance.
> - Guarantees linearizable ACID transaction safety across regions.
> ```
>
> #### Technical Explanation
>
> 1. TiKV provides distributed multi-master ACID transactions across cluster nodes.
> 2. Replicates data ranges via Raft consensus groups.
> 3. Guarantees zero data loss during node failures.
> 
---





## 6. Related Terms

- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Storage backend overview.
- [SurrealDB Server (`surreal start`)](../level_01/surreal_start.md) — Server startup flags.
- [SurrealDB Cloud](surrealdb_cloud.md) — Managed distributed cloud instances.

---

## 7. Key Takeaways
- TiKV is SurrealDB's distributed storage engine for multi-node production clusters.
- Provides horizontal data scaling, automatic sharding, and Raft-based multi-region replication.
- Decouples stateless compute (SurrealDB query nodes) from distributed state (TiKV storage nodes).
