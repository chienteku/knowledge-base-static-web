# Targeted vs. Scatter-Gather Queries

> **Level 9 — Replica Sets & Sharding**
> The two query routing modes in a sharded cluster: Targeted Queries (where `mongos` routes to a single shard using the shard key) and Scatter-Gather Queries (where `mongos` broadcasts to all shards because the shard key is missing).

---

## 1. Prerequisites

- [Shard Key](shard_key.md) — The routing index key.
- [Config Servers & `mongos` Router](config_servers_mongos.md) — The query routing layer.

---

## 2. Term Category

**Administration / Operations** (Sharded Query Routing Strategies): Targeted Queries route directly to a single shard using the shard key, whereas Scatter-Gather Queries broadcast to every shard in the cluster.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Determined during query parsing at the `mongos` router. Auditable inside query execution plans to identify cluster performance bottlenecks).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Diagnosing Targeted Single-Shard Queries with `explain()`

**Scenario:**
Verify that a query including the shard key `{ customerId: "CUST-100" }` executes as a Single-Shard Targeted Query.

**Requirements:**
1. Inspect `shards` object in `explain()` output.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const plan = db.orders.find({ customerId: "CUST-100" }).explain("executionStats");
> console.log("Targeted Shards Count:", Object.keys(plan.executionStats.executionStages.shards).length);
> ```
>
> #### Technical Explanation
>
> 1. Including the shard key in the query filter allows `mongos` to consult Config Server metadata and route the query to a SINGLE target shard.
> 2. `shards` object in `explain()` contains exactly 1 entry.
> 3. Maximum query throughput and lowest network latency.

---

### Exercise 2: Identifying Scatter-Gather Query Overhead

**Scenario:**
Run `explain()` on a query omitting the shard key (`find({ unindexedField: "value" })`) to demonstrate Scatter-Gather execution.

**Requirements:**
1. Inspect multi-shard broadcast execution.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const plan = db.orders.find({ unindexedField: "value" }).explain("executionStats");
> console.log("Broadcast Shards Count:", Object.keys(plan.executionStats.executionStages.shards).length);
> ```
>
> #### Technical Explanation
>
> 1. Queries omitting the shard key MUST be broadcast by `mongos` to EVERY shard in the cluster (Scatter-Gather).
> 2. `mongos` waits for all shards to respond and merges results in memory.
> 3. Degrades cluster scalability as shard node counts grow.

---

### Exercise 3: Architectural Rules to Eliminate Scatter-Gather Queries

**Scenario:**
Formulate a 3-point design rulebook ensuring top application API endpoints run as targeted queries.

**Requirements:**
1. Outline shard key query inclusion requirements.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Targeted Query Optimization Rules:
> - Rule 1: Ensure all high-frequency API endpoints include the shard key in their query filters.
> - Rule 2: For multi-tenant applications, use `tenantId` as the leading key in compound shard patterns.
> - Rule 3: Reserve scatter-gather queries for low-frequency background analytical reports.
> ```
>
> #### Technical Explanation
>
> 1. Targeted queries scale linearly with cluster growth ($O(1)$ routing).
> 2. Scatter-gather queries suffer from long-tail shard latency ($O(S)$ where $S$ is shard count).
> 3. Core design goal for sharded cluster architectures.

---



## 6. Related Terms

- [Shard Key](shard_key.md) — The partitioning index key.
- [Hashed vs. Ranged Sharding](hashed_vs_ranged.md) — Distribution strategies.

---

## 7. Key Takeaways
- Targeted queries route to a single shard using the shard key.
- Scatter-gather queries broadcast to all shards because the shard key is missing.
- Targeted queries scale performance and latency linearly as shards are added.
- Scatter-gather queries degrade cluster CPU performance by running redundant disk scans.
- Always include shard keys in high-frequency queries (e.g. logins, profile reads).
- Scatter-gather is acceptable for occasional, low-frequency administrative reports.
- View explain plans to verify query stages lack broadcast markers.
