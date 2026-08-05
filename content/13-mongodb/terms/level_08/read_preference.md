# Read Preference

> **Level 8 — Transactions, Consistency & Durability**
> The database configuration setting that controls how MongoDB client drivers route read queries to specific members (Primary or Secondaries) of a replica set to balance query load and latency.

---

## 1. Prerequisites

- [Read Concern](read_concern.md) — The read isolation context.
- [Replica Set](../level_09/replica_set.md) — The target cluster nodes.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Configurable in the connection string URI or per-query options. Governs driver-side connection routing logic).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, in a replica set, all writes and **all reads** are processed by the single Primary node. 

The Secondary nodes sit idle, copying the Oplog.

If your application has a high read-to-write ratio (e.g. an article site where millions read posts, but only a few write them):
-   The Primary node can become overloaded with read queries, slowing down writes.
-   You want to utilize your Secondary backup nodes to process reads, distributing the traffic.

We designed **Read Preference** to solve this load-balancing problem. 

It allows you to specify which nodes should handle read queries, letting you offload read traffic to secondaries while keeping your primary free for writes.

---

### (2) The Five Read Preference Modes

#### 1. `primary` (Default)
All reads route **only** to the primary node. If the primary is offline, reads throw errors.
-   *Guarantees:* Strong consistency (you always read the freshest data).

#### 2. `primaryPreferred`
Reads route to the primary first. If the primary is offline (e.g., during failover elections), reads failover to secondaries.

#### 3. `secondary`
All reads route **only** to secondary nodes. If no secondaries are available, queries throw errors.
-   *Use Case:* Running heavy data analysis or reporting queries that do not need real-time data.

#### 4. `secondaryPreferred`
Reads route to secondaries first. If all secondaries are offline, reads failover to the primary.

#### 5. `nearest`
Reads route to the replica node with the **lowest network latency** (pings), regardless of whether it is primary or secondary.
-   *Use Case:* Multi-region global deployments where low latency is critical.

---

### (3) The Stale Data Gotcha (Replication Lag)
If you read from a secondary using `secondary` or `nearest`:
-   Replication is asynchronous, creating **Replication Lag**.
-   If a user updates their profile (writes to primary) and immediately refreshes their homepage (reads from secondary):
-   They will see their **old profile data**. This is called **eventual consistency**.

---

### (4) Reality Metaphor (The Director vs. Assistants)
Imagine seeking details in a busy business office:
-   **`primary`:** You ask the **Director** directly. They know the absolute latest decisions, but they have a long queue of visitors waiting outside their door (bottleneck).
-   **`secondary`:** You ask the **Executive Assistants**. 
    -   They have a printed schedule in their hands. 
    -   They can answer you instantly without waiting in line, but their schedule is printed once an hour, so they might miss a meeting the Director booked 5 minutes ago.
-   **`nearest`:** You ask whichever employee is sitting closest to your desk to save walking time.

---

### (5) Code Examples

#### Configuring Read Preference
You can set read preference in the connection string or per query:

```javascript
// 1. Connection URI: Route all queries to secondaries by default
const uri = "mongodb://localhost:27017/?replicaSet=myRepl&readPreference=secondaryPreferred";

// 2. Query Override: Force read from primary for critical balance checks
db.accounts.find(
  { user_id: 105 }
).readPref("primary");

// 3. Query Override: Route heavy exports to secondaries
db.orders.find().readPref("secondary");
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Setting read preference to 'secondary' for the entire application to "speed things up," leading to consistency bugs

**The mistake:** Configuring the global driver connection string to `readPreference=secondary` and receiving support tickets saying: *"I updated my name, but when the page reloaded, my old name was still showing!"*

**Why it's wrong:** Because secondaries lag behind the primary, immediate read-after-write operations fail to see the changes. 

Users assume their edits are lost.

**Fix: Keep the default read preference as `primary` for standard user CRUD actions to guarantee consistency. Only route read preference to `secondary` or `secondaryPreferred` for specific, heavy read-only dashboards, reporting exports, or search filters.**

---



### Mistake 2: Reading Stale Data by Directing Web Client Queries to Secondaries Without Handling Replication Lag

**The mistake:** Using `readPreference: 'secondary'` for immediate post-mutation user UI rendering.

**Why it's wrong:** Replication to secondaries is asynchronous. Reading from secondaries immediately after writing to primary can render stale pre-update data. Use `primary` or `primaryPreferred`.

*Incorrect:*
```javascript
await db.users.updateOne({ _id: id }, { $set: { name: "New Name" } });
// Immediate secondary read:
const user = await db.users.findOne({ _id: id }, { readPreference: "secondary" }); // ❌ May return old name!
```

*Fix:*
```javascript
Use readPreference: 'primary' for read-after-write user profile views
```

### Mistake 3: Expecting `readPreference: 'secondary'` to Increase Overall Cluster Write Capacity

**The mistake:** Offloading queries to secondaries expecting it to increase collection write throughput.

**Why it's wrong:** MongoDB replica sets have a SINGLE primary node handling all writes. Directing reads to secondaries reduces primary read load but does NOT increase write capacity.

*Incorrect:*
```javascript
// Expecting secondary read preference to solve write bottlenecks
```

*Fix:*
```javascript
Use Sharding to scale cluster write throughput horizontally
```

## 6. Practice Exercises

### Exercise 1: Read Preference Selector

**Problem:** You are configuring a global replica set deployed across New York, London, and Tokyo.
Select the optimal Read Preference mode for these application tasks:
1.  A nightly offline marketing report script that exports sales metrics.
2.  A global user checkout page that reads stock levels.
3.  A mobile user looking up static help articles, where fast page loads are critical.

**Expected output:**
> [!check]- Answer
> ```text
> 1. secondary: Offloads heavy log analysis queries completely from the primary node to prevent CPU lockups.
> 2. primary: Guarantees strong consistency to prevent double-selling inventory due to replication lag.
> 3. nearest: Routes queries to the closest geographic server node (New York, London, or Tokyo) to minimize page load latency.
> ```
> - Evaluate the impact of stale data on the action.
> - Consider if network latency is the primary bottleneck.

---



### Exercise 2: Configuring Secondary Read Preference with Tag Sets

**Problem:** Configure read preference routing queries to secondary nodes in datacenter `analytics` (`{ dc: "analytics" }`).

**Expected output:**
> [!check]- Answer
> ```text
> db.orders.find({}, { readPreference: new ReadPreference("secondary", [{ dc: "analytics" }]) });
> ```
> ```javascript
> const { ReadPreference } = require('mongodb');
> db.orders.find({}, {
>   readPreference: new ReadPreference("secondary", [{ dc: "analytics" }])
> });
> ```
>
> **Explanation:** Tag sets route secondary read queries to specific designated datacenter nodes.

---

### Exercise 3: Read Preference Modes List

**Problem:** List 5 read preference modes in MongoDB (`primary`, `primaryPreferred`, `secondary`, `secondaryPreferred`, `nearest`).

**Expected output:**
> [!check]- Answer
> ```text
> primary, primaryPreferred, secondary, secondaryPreferred, nearest
> ```
> ```text
> primary, primaryPreferred, secondary, secondaryPreferred, nearest
> ```
>
> **Explanation:** Read preferences dictate which replica set nodes execute read queries.

## 7. Related Terms

- [Read Concern](read_concern.md) — The read isolation configuration.
- [Replica Set](../level_09/replica_set.md) — The target cluster.
- [Causal Consistency](causal_consistency.md) — Related concept: Causal Consistency.
- [Replication Lag](../level_09/replication_lag.md) — Related concept: Replication Lag.

---

## 8. Key Takeaways
- Read Preference determines how reads are routed across a replica set.
- `primary` (default) routes reads only to the primary node (strong consistency).
- `secondary` routes reads only to secondary backup nodes (offloads traffic).
- `nearest` routes reads to the node with the lowest network latency.
- Reading from secondaries introduces risks of reading stale data (replication lag).
- Do not route immediate read-after-write operations to secondaries.
- Set read preference in the connection string or per-query options.
