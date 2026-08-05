# Targeted vs. Scatter-Gather Queries

> **Level 9 — Replica Sets & Sharding**
> The two query routing modes in a sharded cluster: Targeted Queries (where `mongos` routes to a single shard using the shard key) and Scatter-Gather Queries (where `mongos` broadcasts to all shards because the shard key is missing).

---

## 1. Prerequisites

- [Shard Key](shard_key.md) — The routing index key.
- [Config Servers & `mongos` Router](config_servers_mongos.md) — The query routing layer.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **MongoDB Core** (Determined during query parsing at the `mongos` router. Auditable inside query execution plans to identify cluster performance bottlenecks).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
The main goal of sharding is to scale performance by dividing work:
-   If you have 10 shards, you want each server to handle roughly 10% of the traffic.
-   If a query must be processed by all 10 servers simultaneously to return a single result, you are not scaling; you are creating redundant work.

We designed the **Targeted** and **Scatter-Gather** execution modes to manage this query distribution. 

If your query filter includes the Shard Key, `mongos` routes it directly to the single server holding the data (Targeted). 

If the shard key is missing, `mongos` is forced to broadcast the query to every server in the cluster (Scatter-Gather). 

Minimizing scatter-gather queries is essential to maintain high performance in sharded clusters.

---

### (2) The Two Query Modes Contrast

#### 1. Targeted Query (Single-Shard Query)
The query filter contains the shard key fields.
-   *Routing:* `mongos` checks the config mapping and sends the query directly to **one specific shard**.
-   *Performance:* Highly efficient. Latency stays low, and cluster throughput scales linearly as you add shards.

#### 2. Scatter-Gather Query (Broadcast Query)
The query filter does **not** contain the shard key fields.
-   *Routing:* `mongos` must **broadcast the query to all shards in the cluster** in parallel. It waits for all shards to complete their scans, merges the results, sorts them, and returns them to the client.
-   *Performance:* Poor. If you have 50 shards, a single query runs 50 disk searches in parallel, consuming CPU across the entire cluster.

---

### (3) Reality Metaphor (School Paging Systems)
Imagine trying to locate a student in a large school with 10 classrooms:
-   **Targeted Query (Classroom specified):** You walk to the main desk and say: *"I need to see student ID 105 (shard key)"*. 
    -   The receptionist looks at the roster, sees ID 105 is in **Classroom 3**, and calls Classroom 3 directly. (Fast, no other class is interrupted).
-   **Scatter-Gather Query (Name only, no ID):** You say: *"I need to find a student named 'Alice Smith'."* 
    -   The receptionist has no name-to-classroom index. 
    -   They must turn on the **School-Wide Intercom Megaphone** and broadcast: *"Attention all rooms! Does anyone have a student named Alice Smith? Send her to the office!"* 
    -   Every teacher in all 10 rooms must stop teaching, check their rosters, and respond.

---

### (4) Code Examples

#### Targeted vs. Broadcast Scans
Suppose a collection `orders` is sharded on the shard key `{ customer_id: 1 }`:

```javascript
// 1. TARGETED QUERY: Filter contains the shard key!
// mongos routes this directly to Shard A.
db.orders.find({ customer_id: "alice_12", status: "completed" });

// 2. SCATTER-GATHER QUERY: Missing the shard key!
// mongos must broadcast this query to every shard in the cluster.
db.orders.find({ status: "completed", amount: { $gt: 100 } });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Designing an application query path that forgets to pass the shard key on high-frequency API routes (like user login or profile lookups)

**The mistake:** Sharding the `users` collection on `{ company_id: 1 }` and writing the login check query as `db.users.findOne({ email: "alice@company.com" })`.

**Why it's wrong:** Because `company_id` (the shard key) is missing from the query filter, `mongos` must run a scatter-gather query. 

Every single login attempt will broadcast queries to all shards in the cluster, driving database CPU usage to 100% under normal user traffic.

**Fix: Ensure that high-frequency query filters include the shard key fields. If a user logs in, prompt them for their email and company ID, or look up their company ID in a cached lookup table first, to allow a targeted query path: `{ email: "alice@company.com", company_id: "corp_A" }`.**

---



### Mistake 2: Omitting Shard Keys from High-Frequency API Read Queries (Scatter-Gather Overhead)

**The mistake:** Executing high-frequency user lookup queries `db.users.find({ email })` on a collection sharded by `{ tenantId: 1 }` without including `tenantId`.

**Why it's wrong:** Omitting the shard key forces `mongos` to broadcast the query to ALL shards (`Scatter-Gather`), increasing latency and cluster load.

*Incorrect:*
```javascript
db.users.find({ email: "alice@ex.com" }); // ❌ Scatter-gather query across all shards!
```

*Fix:*
```javascript
db.users.find({ tenantId: 100, email: "alice@ex.com" }); // Targeted single-shard query
```

### Mistake 3: Expecting Scatter-Gather Aggregations to Outperform Single Shard Queries

**The mistake:** Running complex multi-stage aggregation pipelines that omit shard key filters.

**Why it's wrong:** Scatter-Gather aggregations execute sub-pipelines on all shards and merge results on `mongos`, creating memory and CPU bottlenecks on query routers.

*Incorrect:*
```javascript
// Running heavy un-targeted aggregation pipeline
```

*Fix:*
```javascript
Include shard key in initial $match stage to route aggregation to a single shard
```

## 6. Practice Exercises

### Exercise 1: Query Routing Classification

**Problem:** A collection `products` is sharded on the shard key `{ sku: 1 }`. 
Classify these queries as either **Targeted** or **Scatter-Gather**:
1.  `db.products.find({ sku: "SKU-9908" })`
2.  `db.products.find({ category: "shoes", price: { $lt: 50 } })`
3.  `db.products.find({ sku: "SKU-9908", price: { $lt: 50 } })`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Targeted: The query filters on the shard key `sku` directly.
> 2. Scatter-Gather: The query filter lacks the shard key `sku`, forcing `mongos` to broadcast to all shards.
> 3. Targeted: The query filters on `sku` (shard key) and `price`. Since the shard key is present, `mongos` can route the query directly to the correct shard.
> ```
> - Check for the presence of the shard key `sku` inside each query filter object.
> - Additional filter parameters do not disable targeted routing.

---



### Exercise 2: Targeted vs Scatter-Gather Comparison

**Problem:** State difference: Targeted Query (Includes shard key, routed directly to 1 shard); Scatter-Gather Query (Omits shard key, broadcast to all shards).

**Expected output:**
> [!check]- Answer
> ```text
> Targeted: routed to 1 shard via shard key; Scatter-Gather: broadcast to all cluster shards
> ```
> ```text
> Targeted: routed to 1 shard via shard key; Scatter-Gather: broadcast to all cluster shards
> ```
>
> **Explanation:** Targeted queries minimize network RPCs and CPU churn in sharded clusters.

---

### Exercise 3: Verifying Shard Routing in Explain Output

**Problem:** What explain output property indicates single-shard targeted query routing? (`SINGLE_SHARD` stage or single shard execution stats).

**Expected output:**
> [!check]- Answer
> ```text
> SINGLE_SHARD execution stage
> ```
> ```text
> SINGLE_SHARD execution stage
> ```
>
> **Explanation:** `SINGLE_SHARD` verifies that `mongos` routed the query to a single target shard.

## 7. Related Terms

- [Shard Key](shard_key.md) — The partitioning index key.
- [Hashed vs. Ranged Sharding](hashed_vs_ranged.md) — Distribution strategies.

---

## 8. Key Takeaways
- Targeted queries route to a single shard using the shard key.
- Scatter-gather queries broadcast to all shards because the shard key is missing.
- Targeted queries scale performance and latency linearly as shards are added.
- Scatter-gather queries degrade cluster CPU performance by running redundant disk scans.
- Always include shard keys in high-frequency queries (e.g. logins, profile reads).
- Scatter-gather is acceptable for occasional, low-frequency administrative reports.
- View explain plans to verify query stages lack broadcast markers.
