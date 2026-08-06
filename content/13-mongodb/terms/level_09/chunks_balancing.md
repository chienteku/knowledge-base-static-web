# Chunks & Balancing

> **Level 9 — Replica Sets & Sharding**
> The data partitioning mechanisms in MongoDB sharding: Chunks (logical ranges of shard key values capped at 64MB) and the Balancer (the background process that migrates chunks across shards to keep cluster storage even).

---

## 1. Prerequisites

- [Shard Key](shard_key.md) — The partitioning keys.

---

## 2. Term Category

**Administration / Operations** (Sharded Data Distribution): Chunks and Balancing manage the automatic partitioning of sharded collection data into 64MB chunks and their background migration across shard nodes via the balancer process.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Managed by the Config Server primary node. Migrations run asynchronously over the network, utilizing disk write I/O).

### (1) Design Motivation — "Why did we design this?"
In a sharded cluster, database documents are constantly inserted, updated, and deleted. 

Over time, this creates data skew:
-   Users on Shard A might write 100,000 documents, while users on Shard B only write 1,000.
-   If left alone, Shard A will run out of disk space and CPU cache, while Shard B remains underutilized.

We designed **Chunks** and the **Balancer** to automate load balancing. 

Instead of moving individual documents, MongoDB groups documents into range blocks called **Chunks**. 

An internal monitor (the **Balancer**) tracks chunk counts on each server. 

If the count gets uneven, the balancer automatically moves chunks from overloaded shards to underloaded shards behind the scenes, ensuring the cluster storage load stays balanced.

---

### (2) The Mechanics of Chunks and Splits

#### 1. Chunks (Logical Ranges)
A chunk represents a contiguous range of shard key values (e.g. `[customer_id: "AAA" to customer_id: "FFF")`).
-   **Size Cap:** By default, a chunk is capped at **64 Megabytes**.
-   **Splitting:** As writes occur, if a chunk's data footprint exceeds 64MB, MongoDB automatically splits it into two smaller chunks (e.g. splitting at `"CCC"`). This is a metadata-only split and is instant (no disk data moves).

#### 2. The Balancer (Migration Engine)
The Balancer is a background thread that runs on the Config Server primary.
-   It audits chunk counts across all shards.
-   **Migration:** If Shard 1 has 10 more chunks than Shard 2, the Balancer initiates a **Chunk Migration**. It copies the BSON documents of a chunk over the network to the new shard, updates the config server routing tables, and deletes the old copy, preserving read/write access during the transfer.

---

### (3) Reality Metaphor (Cargo Box Balancing)
Imagine loading packages onto cargo ships:
-   **Chunks:** Standard **Cardboard Shipping Boxes** (capped at 64 items). If you try to drop item #65 inside, the box split into two boxes.
-   **The Balancer:** A **Crane Operator** at the port.
    -   They look at two ships: Ship A is carrying 100 boxes, while Ship B is carrying only 20.
    -   They run the crane (the balancer) to lift boxes from Ship A and place them onto Ship B until both carry 60 boxes. 
    -   The shipping clerks can still drop packages into boxes during this, but the crane takes up workspace aisle space.

---

### (4) Code Examples

#### 1. Checking Chunk Status in mongosh
You can output sharding details and chunk range counts using:

```javascript
sh.status();
// Output showing collections chunks:
// ecom.orders
//   shard key: { customer_id: 1 }
//   unique: false
//   balancing: true
//   chunks:
//     shard-01: 22 // Shard 01 has 22 chunks
//     shard-02: 21 // Shard 02 has 21 chunks
//     { customer_id: "$minKey" } -->> { customer_id: "M" } on shard-01
//     { customer_id: "M" } -->> { customer_id: "$maxKey" } on shard-02
```

#### 2. Restricting Balancer Running Windows
To prevent migrations from slowing down your database during peak business hours, you can configure an active balancer window:

```javascript
// Configure balancer to run only between 1:00 AM and 5:00 AM
db.getSiblingDB("config").settings.updateOne(
  { _id: "balancer" },
  { $set: { activeWindow: { start: "01:00", stop: "05:00" } } },
  { upsert: true }
);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Leaving the balancer active 24/7 on database clusters experiencing high write concurrency during peak traffic hours

**The mistake:** Allowing chunk migrations to run at 10 AM on a Monday, when the database is already struggling under checkout transactions volume.

**Why it's wrong:** Chunk migrations copy large amounts of data over the network and write them to disk. 

This consumes disk I/O bandwidth and network throughput, slowing down active user queries and causing API connection drops.

**Fix: Configure a strict Balancer active window so that chunk balancing operations are restricted to low-traffic hours (e.g. 1 AM to 5 AM).**

---



### Mistake 2: Choosing Low Cardinality Shard Keys Causing Jumbo Chunks That Cannot Be Split

**The mistake:** Choosing low-cardinality `country` (5 values) as a shard key for a 500M document collection.

**Why it's wrong:** When a single shard key value contains millions of documents, chunk sizes exceed 64MB, producing 'Jumbo Chunks' that cannot be split or balanced across shards.

*Incorrect:*
```javascript
sh.shardCollection("app.users", { country: 1 }); // ❌ Jumbo chunk creation!
```

*Fix:*
```javascript
sh.shardCollection("app.users", { country: 1, userId: 1 }); // High cardinality compound key
```

### Mistake 3: Running Automatic Chunk Balancer Routines During Peak Traffic Hours

**The mistake:** Leaving the chunk balancer active 24/7 during heavy peak write traffic hours.

**Why it's wrong:** Chunk migrations generate heavy internal cluster network traffic and disk IOPS, competing with application traffic. Configure balancer active windows for off-peak hours.

*Incorrect:*
```javascript
// Balancer active 24/7 during peak traffic
```

*Fix:*
```javascript
sh.setBalancerWindow("01:00", "05:00"); // Restrict balancer to off-peak hours
```

## 5. Practice Exercises

### Exercise 1: Monitoring Shard Chunk Distribution with `sh.status()`

**Scenario:**
Inspect chunk distribution and balancer status across a sharded MongoDB cluster using `sh.status()`.

**Requirements:**
1. Execute `sh.status()` in `mongosh`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> sh.status();
> ```
>
> #### Technical Explanation
>
> 1. `sh.status()` displays sharded cluster metadata, active shard nodes, collection chunk counts, and balancer status.
> 2. Identifies chunk imbalances across shard nodes.
> 3. Core command for sharded cluster administration.
> 
---

### Exercise 2: Managing Balancer Window Schedules

**Scenario:**
Configure the MongoDB balancer to run ONLY during off-peak maintenance hours (2:00 AM to 6:00 AM) using `config.settings`.

**Requirements:**
1. Update `config.settings` for `balancer` window.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> use config;
> db.settings.updateOne(
>   { _id: "balancer" },
>   {
>     $set: {
>       activeWindow: { start: "02:00", stop: "06:00" }
>     }
>   },
>   { upsert: true }
> );
> ```
>
> #### Technical Explanation
>
> 1. `activeWindow` restricts background chunk balancing migrations to off-peak hours.
> 2. Prevents chunk migration IOPS from competing with peak daytime application traffic.
> 3. Essential production maintenance setting.
> 
---

### Exercise 3: Manual Chunk Splitting with `sh.splitAt()`

**Scenario:**
Split an oversized 128MB chunk at a specific shard key split point using `sh.splitAt()`.

**Requirements:**
1. Execute `sh.splitAt("dbname.collection", { shardKey: "val" })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> sh.splitAt("store.orders", { zipCode: "78701" });
> ```
>
> #### Technical Explanation
>
> 1. `sh.splitAt()` manually splits a chunk into two smaller chunks at a specified boundary value.
> 2. Helps resolve jumbo chunks that exceed the default 64MB chunk size.
> 3. Restores chunk migration capability.
> 
---



## 6. Related Terms

- [Shard Key](shard_key.md) — The partitioning index key.
- [Config Servers & `mongos` Router](config_servers_mongos.md) — Cluster infrastructure.

---

## 7. Key Takeaways
- Chunks are contiguous ranges of shard key values, capped at 64MB by default.
- When a chunk grows past 64MB, MongoDB splits it (a metadata-only change).
- The Balancer is a background thread that manages chunk distributions.
- Balancer migrates chunks across shards to ensure even storage footprints.
- Chunk migrations run online, allowing reads and writes to continue.
- Migrations consume high disk I/O and network bandwidth.
- Configure Balancer windows to restrict migrations to off-peak hours.
