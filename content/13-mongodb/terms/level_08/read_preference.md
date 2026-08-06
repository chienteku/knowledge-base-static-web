# Read Preference

> **Level 8 — Transactions, Consistency & Durability**
> The database configuration setting that controls how MongoDB client drivers route read queries to specific members (Primary or Secondaries) of a replica set to balance query load and latency.

---

## 1. Prerequisites

- [Read Concern](read_concern.md) — The read isolation context.
- [Replica Set](../level_09/replica_set.md) — The target cluster nodes.

---

## 2. Term Category

**Administration / Operations** (Replica Set Read Routing): Read Preference determines how client drivers route query read traffic across replica set members (`primary`, `primaryPreferred`, `secondary`, `secondaryPreferred`, `nearest`).



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Configurable in the connection string URI or per-query options. Governs driver-side connection routing logic).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Offloading Analytical Queries to Secondary Nodes

**Scenario:**
Configure an analytics pipeline to read from replica set secondary nodes using `readPreference: "secondary"`.

**Requirements:**
1. Pass `readPreference: "secondary"` in query options.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.find({ category: "analytics" })
>   .readPref("secondary");
> ```
>
> #### Technical Explanation
>
> 1. `readPreference: "secondary"` routes query requests exclusively to replica set secondary members.
> 2. Offloads heavy read-intensive reporting queries from the primary node.
> 3. Preserves primary node CPU and RAM for write operations.
> 
---

### Exercise 2: Fallback Read Preferences with `primaryPreferred` and `secondaryPreferred`

**Scenario:**
Configure an application API to read from secondary nodes by default, but fall back to the primary node if secondaries are unreachable.

**Requirements:**
1. Use `readPreference: "secondaryPreferred"`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const cursor = db.products.find({ active: true })
>   .readPref("secondaryPreferred");
> ```
>
> #### Technical Explanation
>
> 1. `secondaryPreferred` queries a secondary member if available; if all secondaries are down, it routes to the primary node.
> 2. Ensures high read availability during secondary node maintenance windows.
> 3. Resilient routing strategy.
> 
---

### Exercise 3: Low-Latency Geo-Routing with `nearest` and Tag Sets

**Scenario:**
Route reads to the nearest replica set node in region `"us-east"` using `readPreference: "nearest"` with `tagSets`.

**Requirements:**
1. Configure `nearest` with `tagSets: [{ region: "us-east" }]`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const client = new MongoClient(uri, {
>   readPreference: ReadPreference.NEAREST,
>   readPreferenceTags: [{ region: "us-east" }]
> });
> ```
>
> #### Technical Explanation
>
> 1. `nearest` routes reads to the node with the lowest network latency ping, regardless of primary/secondary status.
> 2. `tagSets` restricts candidate nodes to specific datacenter regions.
> 3. Minimizes cross-region network latency.
> 
---



## 6. Related Terms

- [Read Concern](read_concern.md) — The read isolation configuration.
- [Replica Set](../level_09/replica_set.md) — The target cluster.
- [Causal Consistency](causal_consistency.md) — Related concept: Causal Consistency.
- [Replication Lag](../level_09/replication_lag.md) — Related concept: Replication Lag.

---

## 7. Key Takeaways
- Read Preference determines how reads are routed across a replica set.
- `primary` (default) routes reads only to the primary node (strong consistency).
- `secondary` routes reads only to secondary backup nodes (offloads traffic).
- `nearest` routes reads to the node with the lowest network latency.
- Reading from secondaries introduces risks of reading stale data (replication lag).
- Do not route immediate read-after-write operations to secondaries.
- Set read preference in the connection string or per-query options.
