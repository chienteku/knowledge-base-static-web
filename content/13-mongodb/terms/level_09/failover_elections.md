# Automatic Failover & Elections

> **Level 9 — Replica Sets & Sharding**
> The automated process by which a MongoDB replica set detects primary node failures through heartbeat pings and elects a new primary to restore write capabilities within seconds, ensuring continuous database uptime.

---

## 1. Prerequisites
- [Primary / Secondary / Arbiter](primary_secondary_arbiter.md) — The cluster roles.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Calculated automatically by consensus protocols. During the short election window—typically under 12 seconds—the replica set blocks writes and becomes read-only).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional database administration, if the main database server crashes, a human system administrator receives an alert, wakes up, inspects logs, manually launches a standby server, updates the DNS IP records, and restarts the web application. 

This recovery process can take minutes or hours.

We designed **Automatic Failover and Elections** to eliminate this human bottleneck. 

A MongoDB replica set constantly monitors itself. 

If the primary node drops off the network, the remaining secondaries immediately run an automated election, promote a new primary, and update the client drivers, restoring database write capabilities automatically in seconds.

---

### (2) Step-by-Step Failover Mechanics

```mermaid
sequenceDiagram
    participant P as Primary (Crashes)
    participant S1 as Secondary 1 (Candidate)
    participant S2 as Secondary 2 (Voter)

    Note over S1,S2: 1. Heartbeats miss for 10 seconds
    S1->>S2: 2. "Nominate me! My log is fresh."
    S2->>S1: 3. "Vote Yes (Majority of 2 achieved)"
    Note over S1: 4. Secondary 1 steps up as PRIMARY
```

#### 1. Heartbeat Pings
Every node in a replica set sends a ping request to every other node **once every 2 seconds**.

#### 2. Timeout Detection
If the Primary node does not respond to a heartbeat within **10 seconds** (controlled by the database parameter `electionTimeoutMillis`), the other nodes mark it as offline.

#### 3. Nominating Candidates
A Secondary node with the most up-to-date replication log nominates itself as a candidate to become the new Primary.

#### 4. Casting Votes
The remaining nodes check the candidate. 
-   They vote **Yes** if the candidate is reachable, has the most recent data log, and the voter has no connection to the old primary.
-   To win, the candidate **must secure a strict majority** of votes from the total configured replica set nodes.

#### 5. Driver Redirection
Once the election is resolved, the new primary takes over. 

The client driver (e.g. your Node.js application) automatically learns of the change and routes new writes to the new primary with zero query code changes.

---

### (3) Reality Metaphor (Radio Check-ins)
Imagine a team of guards in a dark forest:
-   **Heartbeats:** Every 2 minutes, guards check in over their walkie-talkies: *"Guard A here" ... "Guard B here" ... "Captain here."*
-   **Failover Election:** Suddenly, the Captain goes silent. 
    -   Ten minutes pass without a check-in. 
    -   Guard B calls out: *"Captain is down! I am nominating myself as the new squad leader. Guard C, do you agree?"* 
    -   Guard C replies: *"Yes, your radio signal is strong, and you have the map. I vote for you."* 
    -   Guard B takes lead, and the mission continues.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Configuring an even number of voting nodes in a replica set (e.g., a 4-node cluster) without an Arbiter, leading to election deadlocks during network splits

**The mistake:** Setting up a 4-node replica set, assuming: *"Four servers are safer than three."*

**Why it's wrong:** If a network split occurs, dividing the cluster exactly in half (2 servers on the West Coast, 2 servers on the East Coast):
-   To elect a primary, a node needs a strict majority of 4 nodes, which is **3 votes**.
-   Neither side can communicate with the other, so the East Coast can only get 2 votes, and the West Coast can only get 2 votes.
-   Because neither side can achieve 3 votes, **no primary can be elected**. 
-   Your entire database becomes read-only until the network split is repaired.

**Fix: Always maintain an ODD number of voting members in your replica set (3, 5, or 7). If you have an even number of data nodes, deploy a vote-only Arbiter node to break ties.**

---



### Mistake 2: Configuring Even Numbers of Voting Replica Set Nodes Without Arbiters

**The mistake:** Deploying a 2-node or 4-node replica set cluster without an arbiter.

**Why it's wrong:** Primary elections require a strict MAJORITY of votes ($N/2 + 1$). In a 2-node cluster, if 1 node drops, remaining 1 node cannot reach majority ($2/2 + 1 = 2$), preventing primary election. Use odd node counts (3, 5).

*Incorrect:*
```javascript
// 2-node replica set cluster configuration
```

*Fix:*
```javascript
Deploy 3 nodes or add 1 voting Arbiter to achieve odd voting counts
```

### Mistake 3: Setting Low Heartbeat Timeout Thresholds (`electionTimeoutMillis`) in Unstable Networks

**The mistake:** Setting `electionTimeoutMillis: 1000` over WAN networks.

**Why it's wrong:** Low election timeouts cause frequent false-alarm elections on minor network blips, dropping active primary connections.

*Incorrect:*
```javascript
settings: { electionTimeoutMillis: 1000 } // ❌ Triggers false-alarm elections!
```

*Fix:*
```javascript
Keep default electionTimeoutMillis: 10000 (10 seconds)
```

## 6. Practice Exercises

### Exercise 1: Split-Brain Election Analysis

**Problem:** You have a 5-node replica set. Nodes 1, 2, and 3 are on Server Rack A. Nodes 4 and 5 are on Server Rack B. 
A power failure cuts the network link between Rack A and Rack B (network partition).
Explain:
1.  Whether the nodes on Rack A (Nodes 1, 2, 3) can elect a Primary.
2.  Whether the nodes on Rack B (Nodes 4, 5) can elect a Primary.

**Expected output:**
```text
1. Yes: Rack A contains 3 nodes. Since 3 is a strict majority of the total 5 nodes (3 / 5 = 60%), the nodes on Rack A can vote and successfully elect a Primary.
2. No: Rack B only contains 2 nodes. Since 2 is not a majority of 5 (2 / 5 = 40%), the nodes on Rack B cannot achieve the 3 votes required, and will remain as read-only secondaries.
```

> [!check]- Answer
> - The voting majority threshold is calculated based on the total cluster configuration (5 nodes), not local partitions.
> - A partition must hold at least 3 nodes to nominate a primary.

---



### Exercise 2: Calculating Primary Election Majority Vote

**Problem:** Calculate minimum votes needed to elect primary in 5-node replica set ($5/2 + 1 = 3$).

**Expected output:**
```text
3 votes (majority of 5 nodes)
```

> [!check]- Answer
> ```text
> 3 votes (majority of 5 nodes)
> ```
>
> **Explanation:** Replica set elections require a strict majority vote ($N/2 + 1$).

### Exercise 3: Replica Set Status Inspection

**Problem:** Command in `mongosh` to inspect replica set member health and election state (`rs.status()`).

**Expected output:**
```text
rs.status();
```

> [!check]- Answer
> ```javascript
> rs.status();
> ```
>
> **Explanation:** `rs.status()` details member node health, heartbeat latencies, and election states.

## 7. Related Terms
- [Replica Set](replica_set.md) — The parent cluster architecture.
- [Primary / Secondary / Arbiter](primary_secondary_arbiter.md) — Node roles.

---

## 8. Key Takeaways
- Automatic Failover removes the need for manual DB administrator recovery.
- Nodes exchange heartbeat pings once every 2 seconds.
- Primary offline status is triggered after a 10-second heartbeat silence.
- Secondaries hold an election to nominate and vote on a new Primary.
- Winning an election requires a strict majority of configured votes.
- Keep an odd number of voting nodes (3, 5, etc.) to prevent split-brain deadlocks.
- During elections, writes are blocked, and the cluster is read-only.
