# Config Servers & `mongos` Router

> **Level 9 — Replica Sets & Sharding**
> The infrastructure control components of a MongoDB sharded cluster: `mongos` (the stateless query router that interfaces with client applications) and Config Servers (the replica set storing the master routing metadata).

---

## 1. Prerequisites

- [Sharding (Horizontal Scaling)](sharding.md) — The parent cluster architecture.

---

## 2. Term Category

**Administration / Operations** (Sharded Cluster Metadata & Routing): Config Servers store cluster configuration metadata while mongos query routers intercept and route client queries to appropriate shard nodes.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Must be deployed on separate physical servers or container runtimes to prevent single points of failure. Manage cluster communication routing).

### (1) Design Motivation — "Why did we design this?"
In a sharded database, data is split across multiple independent servers. 

If your backend Node.js application had to manage this:
-   Your code would have to track which server holds which user ID.
-   If a chunk migrated, you would have to rewrite your app's connection settings.
-   Your code would become cluttered with database routing logic.

We designed the **`mongos` Router** and **Config Servers** to abstract this complexity. 

Your application connects to `mongos` as if it were a single, standard MongoDB database. 

The `mongos` router handles the query routing. 

It queries the **Config Servers** (which hold the master map of chunk ranges) to locate the target shard, forwards the queries, and returns the consolidated results, keeping the sharding details hidden from your application code.

---

### (2) Component Details

#### 1. `mongos` (The Query Router)
A lightweight, stateless routing service.
-   **Stateless:** It does not store any data files or configuration metadata. It caches config server maps in RAM.
-   **Scaling:** Because it is stateless, you can spin up 5 separate `mongos` routers behind an application load balancer to prevent routing bottlenecks.

#### 2. Config Servers (The Master Metadata Store)
A dedicated replica set of `mongod` instances.
-   **What they store:** Shard list directory, chunks range boundaries, authentication configurations, and balancer rules.
-   **Criticality:** If the Config Servers go offline, the cluster stops. `mongos` routers cannot route writes, and chunk splits or balancing operations are blocked.

---

### (3) Reality Metaphor (Museum Tour Guides)
Imagine visiting a massive museum containing millions of paintings split across 3 buildings (shards):
-   **`mongos` Router:** The **Tour Guide** standing at the entrance desk. You ask: *"Where is the painting 'Mona Lisa'?"* The guide checks their tablet, directs you to Building 2, and escorts you there.
-   **Config Servers:** The **Museum Master Directory Map Tablet**. 
    -   It lists every painting name and the building room it resides in. 
    -   If the tablet battery dies (config servers offline), the tour guide cannot direct any tourists, and the museum lobby shuts down.

---

### (4) Code Examples

#### Sharded Cluster Connection URI
In a sharded cluster, the connection string targets the `mongos` router addresses, not the shard nodes:

```javascript
// Connection URI targeting two mongos routers (prevents router single-point-of-failure):
const uri = "mongodb://mongos-router-01.example.com:27017,mongos-router-02.example.com:27017/ecom";
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Connecting client applications directly to a shard replica set node instead of the 'mongos' router when using sharding

**The mistake:** Configuring Mongoose connection settings to connect directly to the primary node of Shard 1 (`shard1-primary:27017`), bypassing the `mongos` router.

**Why it's wrong:** Because Shard 1 only stores a fraction of the collection data (e.g. usernames starting A-H):
-   Your application will only be able to query or write that subset of users.
-   If a user with name `"Smith"` (stored on Shard 2) logs in, the query will return `null` (not found), breaking application logic.

**Fix: Always configure your application drivers to connect strictly to the `mongos` router addresses.**

---



### Mistake 2: Directly Connecting Application Clients to Individual Shard `mongod` Instances

**The mistake:** Connecting driver connection URIs directly to individual shard primary node IP addresses.

**Why it's wrong:** Applications MUST connect to `mongos` query router routers (`mongodb://mongos1:27017,mongos2:27017`). Direct shard connections bypass cluster routing and cause data corruption.

*Incorrect:*
```javascript
mongodb://shard1-primary:27017/db // ❌ Direct shard connection bypasses mongos!
```

*Fix:*
```javascript
mongodb://mongos1:27017,mongos2:27017/db // Connect to mongos routers
```

### Mistake 3: Deploying Single Non-Replica Config Server (CSRS) Clusters in Production

**The mistake:** Deploying 1 single Config Server process for production sharded clusters.

**Why it's wrong:** Config Servers manage cluster metadata mapping. Config Servers MUST be deployed as a 3-node Replica Set (CSRS) for high availability.

*Incorrect:*
```javascript
$ mongod --configsvr ... # Single node config server
```

*Fix:*
```javascript
Deploy 3-node Config Server Replica Set (CSRS)
```

## 5. Practice Exercises

### Exercise 1: Routing Queries Through `mongos`

**Scenario:**
Connect application driver to a sharded cluster via `mongos` router instance endpoints.

**Requirements:**
1. Specify `mongos` hosts in connection URI.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const uri = "mongodb://mongos1.example.com:27017,mongos2.example.com:27017/store_db";
> const client = new MongoClient(uri);
> ```
>
> #### Technical Explanation
>
> 1. `mongos` acts as a stateless query router intercepting client database requests.
> 2. Queries Config Servers to cache cluster chunk location routing tables.
> 3. Hides sharded cluster topology from client application code.
> 
---

### Exercise 2: Inspecting Config Server Metadata Collections

**Scenario:**
Inspect the `config.shards` and `config.chunks` metadata collections on Config Servers.

**Requirements:**
1. Query `config.shards` and `config.chunks`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> use config;
> console.log("Shard Nodes:", db.shards.find().toArray());
> console.log("Chunk Count:", db.chunks.countDocuments());
> ```
>
> #### Technical Explanation
>
> 1. Config Servers run as a dedicated 3-node replica set (`CSRS`) storing cluster metadata.
> 2. `config.shards` tracks registered shard replica set connection strings.
> 3. `config.chunks` tracks chunk ranges and target shard assignments.
> 
---

### Exercise 3: High Availability `mongos` Router Pools

**Scenario:**
Explain how listing multiple `mongos` instances in the driver URI provides connection failover.

**Requirements:**
1. Describe multi-mongos client connection pool routing.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Multi-Mongos Architecture:
> - Client drivers maintain active connection pools to all listed mongos instances.
> - If mongos1 crashes, driver automatically routes queries to mongos2 seamlessly.
> ```
>
> #### Technical Explanation
>
> 1. `mongos` instances are stateless and can be scaled horizontally behind load balancers.
> 2. Driver automatically fails over to healthy `mongos` instances.
> 3. Eliminates single points of failure in sharded clusters.
> 
---



## 6. Related Terms

- [Sharding (Horizontal Scaling)](sharding.md) — The parent partitioning concept.
- [Chunks & Balancing](chunks_balancing.md) — The balancing logic.

---

## 7. Key Takeaways
- `mongos` is the stateless router interface for client applications.
- Config Servers store the master metadata mapping chunks to shards.
- Config Servers must be configured as a replica set to prevent cluster lockups.
- Connecting directly to shards leads to incomplete data reads.
- Run multiple `mongos` routers to prevent single routing bottlenecks.
- Client drivers connect to `mongos` exactly like a standalone database.
- If config servers go offline, the cluster blocks all splits and writes.
