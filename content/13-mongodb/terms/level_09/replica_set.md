# Replica Set

> **Level 9 — Replica Sets & Sharding**
> The core high-availability architecture in MongoDB consisting of a cluster group of servers maintaining identical data copies, providing automatic failover, data redundancy, and disaster recovery.

---

## 1. Prerequisites

- [`mongod` (MongoDB Server Daemon)](../level_01/mongod.md) — MongoDB server daemon.
- [Database (MongoDB Context)](../level_01/database_context.md) — The single `mongod` process.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (The mandatory configuration standard for production systems. Multi-document transactions, causal consistency, and retryable operations all depend on a replica set environment to function).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Running a database on a single server machine is a major risk:
-   If the server's hard drive crashes, you lose your data.
-   If the server loses network connection, your website goes offline.
-   If you take the server offline for OS patches, your system has downtime.

In PostgreSQL, you solve this by manually configuring standby replication nodes.

In MongoDB, redundancy is built natively into the core design through **Replica Sets**. 

A replica set is a cluster of database nodes (usually 3 or more physical servers) that act as a single unit. 

One server is chosen as the **Primary** (receives all writes), and the others act as **Secondaries** (replicate the data). 

If the primary server goes offline, the secondaries automatically detect it, hold an election, and promote a secondary to be the new primary in seconds, guaranteeing your application stays online.

---

### (2) Why Standalone is forbidden in Production
While you can run a single standalone MongoDB server in local development, you **cannot** use it in production because standalone instances lack:
1.  **Replica Failover:** No backup nodes to assume write traffic during crashes.
2.  **Transactions Support:** Multi-document transactions depend on replica set Oplog streams to commit and roll back writes safely.
3.  **Retryable Writes:** Drivers cannot retry failed writes if there is no secondary node to take over.

---

### (3) Reality Metaphor (Court Scribes)
Imagine a team of court transcribers:
-   **Replica Set:** A group of 3 writers recording a trial.
    -   The **Lead Scribe (Primary)** sits at the table, listens to the speaker, and writes the official log.
    -   The **two Backup Scribes (Secondaries)** sit behind the lead, copying every line the lead scribe writes onto their own pads.
    -   If the lead scribe suffers a sudden medical emergency and must leave the room (primary server crash), one of the backup scribes immediately steps up to the main table and continues writing, ensuring not a single word of the trial is missed.

---

### (4) Code Examples

#### 1. Replica Set Connection String
To connect to a replica set, your connection string lists the seed nodes and replica set name:

```javascript
// Connection URI indicating the replicaSet parameter:
const uri = "mongodb://node1.example.com:27017,node2.example.com:27017,node3.example.com:27017/?replicaSet=myProdReplicaSet";
```

#### 2. Checking Replica Set Status in mongosh
You can audit the health of your replica set from the command shell:

```javascript
rs.status();
// Output returns nodes list, sync status, and state:
// "members": [
//   { "_id": 0, "name": "node1:27017", "stateStr": "PRIMARY" },
//   { "_id": 1, "name": "node2:27017", "stateStr": "SECONDARY" },
//   { "_id": 2, "name": "node3:27017", "stateStr": "SECONDARY" }
// ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running production applications on standalone MongoDB instances, assuming standard backups are sufficient for high availability

**The mistake:** Deploying a single standalone database server to production, thinking: *"I run nightly backups, so I don't need a replica set."*

**Why it's wrong:** If your standalone server crashes at 2 PM, your website goes offline immediately. 

You must manually spin up a new server, restore the backup files, and update DNS pointers, resulting in hours of downtime and losing all transactions processed between 2 AM and 2 PM.

**Fix: Always deploy production databases as a Replica Set containing a minimum of 3 nodes (1 Primary and 2 Secondaries) to enable automatic, sub-second failover recovery.**

---



### Mistake 2: Deploying Production Replica Sets with Less Than 3 Nodes

**The mistake:** Deploying a 2-node replica set without an arbiter for production environments.

**Why it's wrong:** A 2-node cluster cannot elect a new primary if 1 node fails (majority requires 2/2 votes). Production replica sets require at least 3 nodes (or 2 data nodes + 1 arbiter).

*Incorrect:*
```javascript
// 2-node production deployment
```

*Fix:*
```javascript
Deploy 3 data nodes (PSS) or 2 data nodes + 1 arbiter (PSA)
```

### Mistake 3: Hardcoding Single Host IPs in Application Connection Strings Instead of Replica Set Name

**The mistake:** Connecting to `mongodb://node1:27017/app` without specifying `replicaSet=rs0`.

**Why it's wrong:** Omitting `replicaSet=rs0` prevents the driver from discovering secondary nodes and handling automatic primary failovers.

*Incorrect:*
```javascript
mongodb://node1:27017/app // Missing replicaSet parameter!
```

*Fix:*
```javascript
mongodb://node1:27017,node2:27017,node3:27017/app?replicaSet=rs0
```

## 6. Practice Exercises

### Exercise 1: High Availability Calculations

**Problem:** You manage a 3-node replica set. Server A is the Primary, and Servers B and C are Secondaries. 
A backhoe digs up the network fiber trunk line to Server A, disconnecting it from the internet.
Explain:
1.  What will happen to the write traffic sent by your application.
2.  What roles Servers B and C will assume.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Write traffic will pause briefly (for a few seconds) while the driver detects the connection drop.
> 2. Servers B and C will recognize that Server A is offline, hold an election, promote one of themselves (e.g. Server B) to be the new Primary, and resume processing write traffic. Server A, when reconnected, will join as a Secondary.
> ```
> - Replica sets monitor nodes using heartbeat pings.
> - Consider how elections promote standby secondary servers.

---



### Exercise 2: Initiating Replica Set in mongosh

**Problem:** Command to initialize a new replica set named `rs0` with local node.

**Expected output:**
> [!check]- Answer
> ```text
> rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "localhost:27017" }] });
> ```
> ```javascript
> rs.initiate({
>   _id: "rs0",
>   members: [{ _id: 0, host: "localhost:27017" }]
> });
> ```
>
> **Explanation:** `rs.initiate()` initializes new replica set configurations.

---

### Exercise 3: Inspecting Replication Lag

**Problem:** Command to print replication lag details across secondary nodes (`rs.printSlaveReplicationInfo()`).

**Expected output:**
> [!check]- Answer
> ```text
> rs.printSecondaryReplicationInfo();
> ```
> ```javascript
> rs.printSecondaryReplicationInfo();
> ```
>
> **Explanation:** `rs.printSecondaryReplicationInfo()` displays seconds of replication lag per secondary node.

## 7. Related Terms

- [Primary / Secondary / Arbiter](primary_secondary_arbiter.md) — Node roles.
- [Automatic Failover & Elections](failover_elections.md) — The election process.
- [ACID vs BASE](../level_08/acid_vs_base.md) — Related concept: ACID vs BASE.
- [Read Preference](../level_08/read_preference.md) — Related concept: Read Preference.
- [Retryable Writes / Retryable Reads](../level_08/retryable_operations.md) — Related concept: Retryable Writes / Retryable Reads.
- [Write Concern](../level_08/write_concern.md) — Related concept: Write Concern.
- [Oplog (Operations Log)](oplog.md) — Related concept: Oplog (Operations Log).
- [Sharding (Horizontal Scaling)](sharding.md) — Related concept: Sharding (Horizontal Scaling).
- [Change Streams](../level_10/change_streams.md) — Related concept: Change Streams.

---

## 8. Key Takeaways
- A Replica Set is a group of database servers maintaining identical data.
- Provides data redundancy, high availability, and disaster recovery.
- Consists of exactly one Primary server and multiple Secondary servers.
- The Primary handles all writes; secondaries copy data asynchronously.
- Transactions, retryable operations, and failovers require replica sets.
- A minimum of 3 nodes is required to prevent split-brain election stalemates.
- Run `rs.status()` in mongosh to monitor replica set member health.
