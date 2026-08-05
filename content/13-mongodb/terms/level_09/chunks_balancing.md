# Chunks & Balancing

> **Level 9 — Replica Sets & Sharding**
> The data partitioning mechanisms in MongoDB sharding: Chunks (logical ranges of shard key values capped at 64MB) and the Balancer (the background process that migrates chunks across shards to keep cluster storage even).

---

## 1. Prerequisites

- [Shard Key](shard_key.md) — The partitioning keys.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **MongoDB Core** (Managed by the Config Server primary node. Migrations run asynchronously over the network, utilizing disk write I/O).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Chunk Split Logic

**Problem:** You shard a collection on the `zip_code` field. One zip code `"90210"` receives a massive influx of inserts, causing the chunk range `[90000, 91000)` to grow past 64MB.
1.  Explain what action MongoDB will execute.
2.  Explain why this split does not involve moving physical documents on disk.

**Expected output:**
> [!check]- Answer
> ```text
> 1. MongoDB will execute a Chunk Split, dividing the range `[90000, 91000)` into two smaller ranges, for example: `[90000, 90210)` and `[90210, 91000)`.
> 2. A chunk split is a metadata-only operation. MongoDB simply updates the range boundary definitions stored on the Config Servers; the actual documents remain untouched on the same physical disks of the shard.
> ```
> - Check how chunk limits trigger splits.
> - Consider where chunk range boundary metadata is stored.

---



### Exercise 2: Configuring Balancer Active Window

**Problem:** Configure chunk balancer active window between `02:00` and `06:00` UTC.

**Expected output:**
> [!check]- Answer
> ```text
> sh.setBalancerWindow("02:00", "06:00");
> ```
> ```javascript
> sh.setBalancerWindow("02:00", "06:00");
> ```
>
> **Explanation:** `sh.setBalancerWindow()` restricts chunk migration background traffic to off-peak hours.

---

### Exercise 3: Inspecting Jumbo Chunks

**Problem:** Command to inspect sharding status and jumbo chunk warnings (`sh.status()`).

**Expected output:**
> [!check]- Answer
> ```text
> sh.status();
> ```
> ```javascript
> sh.status();
> ```
>
> **Explanation:** `sh.status()` reports shard distributions, chunk counts, and jumbo chunk warnings.

## 7. Related Terms

- [Shard Key](shard_key.md) — The partitioning index key.
- [Config Servers & `mongos` Router](config_servers_mongos.md) — Cluster infrastructure.

---

## 8. Key Takeaways
- Chunks are contiguous ranges of shard key values, capped at 64MB by default.
- When a chunk grows past 64MB, MongoDB splits it (a metadata-only change).
- The Balancer is a background thread that manages chunk distributions.
- Balancer migrates chunks across shards to ensure even storage footprints.
- Chunk migrations run online, allowing reads and writes to continue.
- Migrations consume high disk I/O and network bandwidth.
- Configure Balancer windows to restrict migrations to off-peak hours.
