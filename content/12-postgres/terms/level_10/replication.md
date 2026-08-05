# Replication (Streaming / Logical)

> **Level 10 — Administration, Security & Production**
> The database architecture process of copying transaction logs from a primary database server (Master) to one or more replica servers (Standby) in real-time, providing high availability and read scalability.

---

## 1. Prerequisites
- [WAL (Write-Ahead Log)](wal.md) — The transaction logs used to synchronize replicas.
---

## 2. Term Category
- **Database Architecture / Scaling**

---

## 3. Environment Context
- **PostgreSQL Core** (Fully supported. Requires configuring replication roles, replication slots, and network firewall rules inside `pg_hba.conf`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If your application relies on a single database server:
-   **Single Point of Failure:** If the server hardware dies, your website goes offline immediately.
-   **Read Bottlenecks:** If you have millions of active users browsing catalog pages, a single server CPU will choke under the search load.

We designed **Replication** to solve this scaling and reliability problem. 

By replicating data across multiple servers, you can:
1.  **Read Scaling:** Route all write transactions (`INSERT`/`UPDATE`) to the **Primary** server, and distribute read transactions (`SELECT`) across multiple **Replica** servers.
2.  **High Availability (HA):** If the primary server crashes, your management scripts can automatically promote a replica to become the new primary (Failover), keeping your website online.

---

### (2) The Two Replication Types in PostgreSQL

#### 1. Physical / Streaming Replication (Binary Copy)
The primary server streams its raw **WAL (Write-Ahead Log) bytes** directly to the replica over a network socket. 

The replica replays these WAL bytes, keeping its disk files identical down to the byte.
-   *Pros:* Extremely fast, low CPU overhead, simple.
-   *Cons:* The replica is a read-only clone of the *entire* database cluster, running the exact same version of PostgreSQL.

#### 2. Logical Replication (SQL Change Copy)
The primary streams logical write events (e.g. *"Insert row [id=5, name='Bob']"*) targeting specific tables using a **Publisher/Subscriber** model.
-   *Pros:* Highly flexible. You can replicate only *some* tables. The replica can run a different Postgres version (e.g. for zero-downtime upgrades) and can support local writes.
-   *Cons:* Slightly higher CPU overhead than streaming.

---

### (3) Reality Metaphor
Imagine managing a project notebook:
-   **Streaming Replication (Photocopying):** You take photocopies of your notebook pages as you write. You stream exact page images to a backup notebook. The backup is an identical clone; you cannot write separate notes on it.
-   **Logical Replication (Dictating):** You hire a clerk. When you make changes, you call out: *"Add Bob to the customer roster"* (logical statement). The clerk writes that down in their own notebook. The clerk's notebook can be a different size, have a different cover, and they can write their own side notes in it.

---

### (4) Architecture Pipelines

#### Streaming (Physical) Replication
```text
Primary Server (Read/Write)             Standby Replica (Read-Only)
[Writes WAL to pg_wal/]                 [Receives WAL stream]
       |                                           |
       +------Streams binary WAL bytes ----------->+ (Replays blocks)
```

#### Logical Replication
```text
Publisher DB (Read/Write)               Subscriber DB (Read/Write)
[Table A (Published)]                   [Table A (Subscribed)]
       |                                           |
       +------Streams Logical DML events--------->+ (Executes row inserts)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Directing write queries (INSERT/UPDATE/DELETE) to a streaming physical standby replica

**The mistake:** Configuring your web application's main connection string to connect to a physical replica, and experiencing transaction crashes on save events.

**Why it's wrong:** Physical streaming replicas are **strictly read-only**. 

Because their disk blocks must remain identical clones of the primary, they reject all DML writes, throwing a `read-only SQL transaction` error.

**Fix: Configure your application backend with two database connection strings: route all database writes (`INSERT`, `UPDATE`, `DELETE`) to the Primary server connection. Route read-only queries (`SELECT`) to the Replica pool connection.**

---



### Mistake 2: Confusing Physical Streaming Replication (Whole Database) with Logical Replication (Selective Tables)

**The mistake:** Attempting to replicate a single table between PostgreSQL 12 and 15 using Physical Streaming Replication.

**Why it's wrong:** Physical Streaming Replication operates at the WAL byte-level, replicating the ENTIRE database instance bit-for-bit to identical server versions. Use Logical Replication (`PUBLICATION` / `SUBSCRIPTION`) for selective table or cross-version replication.

*Incorrect:*
```sql
// Using Physical Streaming Replication for selective single table sync
```

*Fix:*
```sql
Use Logical Replication: CREATE PUBLICATION my_pub FOR TABLE my_table;
```

### Mistake 3: Ignoring Replication Lag Monitoring on Read Replicas

**The mistake:** Routing real-time write-after-read user requests to asynchronous read replicas without checking replication lag.

**Why it's wrong:** Asynchronous replication introduces milliseconds to seconds of lag. Reading immediately after writing can serve stale data! Read critical write-after-read data from Primary node.

*Incorrect:*
```sql
// Reading immediately updated user profile from asynchronous replica
```

*Fix:*
```sql
Route write-after-read queries to Primary database node
```

## 6. Practice Exercises

### Exercise 1: Scaling Architecture Selection

**Problem:** You are the Lead Database Architect. Select the correct replication type (**Streaming** or **Logical**) for these scenarios:
1.  You want a high-availability backup database that can take over instantly if the main database hardware dies.
2.  You want to sync only 3 specific analytics tables from your main production database to a separate data warehouse database running on a different server version.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Streaming Replication: Perfect for high availability. It copies the entire cluster block-by-block with minimal latency, providing a ready standby clone for failovers.
> 2. Logical Replication: Perfect for table-specific synchronization. It allows you to publish only the 3 target tables and sync them to a different database layout and version.
> ```
> - Determine if the backup must contain the entire database cluster or a subset.
> - Consider version compatibility constraints.

---



### Exercise 2: Logical Replication Setup Sequence

**Problem:** Write DDL creating publication `pub_orders` on Primary and subscription `sub_orders` on Replica.

**Expected output:**
> [!check]- Answer
> ```text
> Primary: CREATE PUBLICATION pub_orders FOR TABLE orders; Replica: CREATE SUBSCRIPTION sub_orders CONNECTION 'host=primary_host dbname=prod' PUBLICATION pub_orders;
> ```
> ```sql
> -- On Primary:
> CREATE PUBLICATION pub_orders FOR TABLE orders;
>
> -- On Replica:
> CREATE SUBSCRIPTION sub_orders
> CONNECTION 'host=primary_host dbname=prod user=rep_user'
> PUBLICATION pub_orders;
> ```
>
> **Explanation:** Logical replication uses Publications and Subscriptions for selective table data streaming.

---

### Exercise 3: Monitoring Replication Lag Query

**Problem:** Query replication lag bytes from `pg_stat_replication` on Primary node.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT client_addr, pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes FROM pg_stat_replication;
> ```
> ```sql
> SELECT client_addr, pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
> FROM pg_stat_replication;
> ```
>
> **Explanation:** `pg_stat_replication` tracks streaming replica LSN replay byte positions.

## 7. Related Terms
- [WAL (Write-Ahead Log)](wal.md) — The sync fuel.
- [Point-in-Time Recovery (PITR)](pitr.md) — - Offline WAL replaying.
---

## 8. Key Takeaways
- Replication duplicates data across multiple standby servers in real-time.
- Solves single points of failure (high availability) and read bottlenecks (read scaling).
- Streaming Replication copies raw WAL bytes; replica is a strict read-only clone.
- Logical Replication copies logical DML events using a Publisher/Subscriber model.
- Physical standby replicas reject all database writes with SQL errors.
- Always route writes to the primary server and reads to standby replicas.
- Failover is the process of promoting a replica to primary during crashes.
