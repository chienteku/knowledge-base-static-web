# Primary / Secondary / Arbiter

> **Level 9 — Replica Sets & Sharding**
> The three specific roles a member node can assume in a MongoDB replica set: Primary (handles writes), Secondary (replicates data), and Arbiter (holds no data, participates only in elections to break ties).

---

## 1. Prerequisites

- [Replica Set](replica_set.md) — The parent cluster architecture.

---

## 2. Term Category

**Administration / Operations** (Replica Set Node Roles): Primary, Secondary, and Arbiter define the operational roles of nodes within a replica set cluster.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Configured during replica set initialization. Arbiters require very little RAM and CPU because they do not participate in database storage pipelines).

### (1) Design Motivation — "Why did we design this?"
To elect a new primary node when a crash occurs, a replica set must hold an **election vote**. 

To win an election and assume the primary role, a node **must receive a strict majority of votes** from the total configured members of the replica set (e.g. in a 3-node set, you need 2 votes; in a 5-node set, you need 3 votes).

What if you have a budget constraint?
-   You want high availability but can only afford **two** servers to store your data (Node A and Node B).
-   If Node A (Primary) crashes, Node B is left standing. 
-   The total configured nodes list is 2. Node B can only cast 1 vote. 
-   Because 1 is not a majority of 2 (it's exactly 50%), Node B **cannot elect itself primary**, and your database becomes read-only.

To solve this without paying for a third expensive database server to store your gigabytes of data, we designed the **Arbiter**. 

An Arbiter is a lightweight, vote-only node. 

It does not store any documents, so you can run it on a cheap, low-spec server. 

It joins the cluster solely to cast the deciding vote during elections, allowing you to achieve high-availability majorities with only 2 data nodes.

---

### (2) The Three Node Roles

#### 1. Primary
-   **Writes:** Handles 100% of write traffic.
-   **Reads:** Handles reads by default.
-   **Count:** Exactly **one** active primary can exist in a replica set at any time.

#### 2. Secondary
-   **Writes:** Cannot write data. Replicates the primary's logs.
-   **Reads:** Can handle reads (see Read Preference).
-   **Count:** Multiple secondaries can exist. Can be promoted to Primary during elections.

#### 3. Arbiter
-   **Writes/Reads:** None. Stores no collection files.
-   **Function:** Heartbeat pings check and voting only.
-   **Benefits:** Saves cost; requires no disk storage sync overhead.

---

### (3) Reality Metaphor (Board Meetings)
Imagine a corporate board of directors:
-   **Primary:** The **Managing Director** (makes all company decisions and writes checks).
-   **Secondary:** The **Assistant Directors** (follow the Managing Director, read their notes, and are ready to take over the role).
-   **Arbiter:** An **Independent Outside Arbitrator** sitting in the corner. 
    -   They own no stock (no data) and cannot run the company. 
    -   However, they hold a **voting seat** at the board meeting. 
    -   If the Managing Director leaves and there is a tie, their vote breaks the tie, letting the board elect a new leader.

---

### (4) Code Examples

#### Adding Nodes to a Replica Set in mongosh
Here is how to add secondaries and arbiters to a cluster:

```javascript
// 1. Add a standard Secondary data node
rs.add("secondary-node-01.example.com:27017");

// 2. Add an Arbiter node (uses a separate method)
rs.addArb("arbiter-node.example.com:27017");
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Deploying the Arbiter on the same physical server (or Virtual Machine) as the primary or secondary node

**The mistake:** Co-locating the Arbiter process on the same VM that runs the Primary node to "save server fees."

**Why it's wrong:** If that VM crashes or loses power, **both** the Primary and the Arbiter go offline simultaneously. 

The remaining Secondary node is left alone, fails to achieve a voting majority, and cannot promote itself, leaving your application offline.

**Fix: Always host the Arbiter node on a completely separate physical machine or isolated cloud instance to ensure its voting capability stays online during node crashes.**

---



### Mistake 2: Deploying Arbiters on Data Nodes That Consume Disk Storage and Cache

**The mistake:** Allocating heavy disk and RAM resources for Replica Set Arbiters.

**Why it's wrong:** Arbiters do NOT hold data copies! They participate solely in primary elections. Deploying Arbiters on separate lightweight VMs saves storage costs.

*Incorrect:*
```javascript
// Provisioning 1TB SSD storage for an Arbiter node
```

*Fix:*
```javascript
Deploy Arbiters on lightweight minimal VMs since they store zero data
```

### Mistake 3: Deploying Multiple Arbiters in a Single Replica Set Cluster

**The mistake:** Adding 2 Arbiters to a 3-node data replica set.

**Why it's wrong:** MongoDB rules mandate at most ONE Arbiter per replica set. Adding multiple Arbiters creates tie-vote election instability.

*Incorrect:*
```javascript
// Adding 2 Arbiters to a replica set
```

*Fix:*
```javascript
Deploy at most 1 Arbiter per replica set cluster
```

## 5. Practice Exercises

### Exercise 1: Configuring a Replica Set Member as Hidden

**Scenario:**
Configure secondary node `node3.example.com` as hidden (`hidden: true`, `priority: 0`) for dedicated analytical backups.

**Requirements:**
1. Update `rs.conf()` member configuration.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const cfg = rs.conf();
> cfg.members[2].priority = 0;
> cfg.members[2].hidden = true;
> 
> rs.reconfig(cfg);
> ```
>
> #### Technical Explanation
>
> 1. `hidden: true` hides the node from driver routing tables so applications never query it directly.
> 2. `priority: 0` prevents the node from ever seeking election as primary.
> 3. Ideal for dedicated reporting, ETL, and backup tasks.

---

### Exercise 2: Deploying an Arbiter Node for Tie-Breaking Votes

**Scenario:**
Add an Arbiter node (`arbiterOnly: true`) to a 2-data-node cluster to achieve an odd vote count (3 votes) for primary elections.

**Requirements:**
1. Execute `rs.addArb("arbiter1.example.com:27017")`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> rs.addArb("arbiter1.example.com:27017");
> ```
>
> #### Technical Explanation
>
> 1. Arbiters hold election voting rights (`votes: 1`) but store NO database data (`arbiterOnly: true`).
> 2. Provides tie-breaking votes for primary elections in 2-node clusters without requiring full data storage hardware.
> 3. Note: Arbiters do not contribute to data redundancy or read scaling.

---

### Exercise 3: Node Architecture Comparison

**Scenario:**
Compare hardware and functional differences between Primary, Secondary, and Arbiter nodes.

**Requirements:**
1. Contrast read/write capabilities, data storage, and voting rights.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Replica Set Member Role Matrix:
> - Primary: Receives all writes (w:1+), holds full data, holds 1 vote.
> - Secondary: Replicates oplog, serves reads (optional), holds full data, holds 1 vote.
> - Arbiter: Stores zero data, serves zero reads/writes, holds 1 election vote.
> ```
>
> #### Technical Explanation
>
> 1. Primary nodes handle cluster write authority.
> 2. Secondary nodes provide data redundancy and read scaling.
> 3. Arbiters provide low-cost election quorum voting.

---



## 6. Related Terms

- [Replica Set](replica_set.md) — The parent cluster architecture.
- [Automatic Failover & Elections](failover_elections.md) — The election process.

---

## 7. Key Takeaways
- The Primary handles all write traffic; only one can exist at a time.
- Secondaries copy data from the primary and can become primary during elections.
- Arbiters do not store data or handle writes; they only participate in elections.
- A voting majority is required to elect a Primary node.
- Arbiters help form voting majorities on 2-data-node budgets.
- Never host an Arbiter on the same physical VM as a data node.
- Add secondaries using `rs.add()`; add arbiters using `rs.addArb()`.
