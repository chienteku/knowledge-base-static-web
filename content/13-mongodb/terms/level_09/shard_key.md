# Shard Key

> **Level 9 — Replica Sets & Sharding**
> The specific document field (or compound fields) used by MongoDB to partition collection data across shards, representing the most critical architectural decision in a sharded cluster deployment.

---

## 1. Prerequisites

- [Sharding (Horizontal Scaling)](sharding.md) — Sharding architecture.

---

## 2. Term Category

**Administration / Operations** (Cluster Data Partitioning Key): A Shard Key is an immutable document field or compound fields chosen to partition collection documents across shard nodes.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Configured through `mongos` using administrative shell commands. The shard key fields must be indexed before the collection can be sharded).

### (1) Design Motivation — "Why did we design this?"
As learned in `sharding.md`, sharding splits a collection's documents across multiple physical servers. 

However, the database engine cannot guess where to route writes:
-   If you insert `{ name: "Alice", country: "US" }`, does it save to Shard 1, 2, or 3?
-   If a user queries `{ name: "Alice" }`, which server should `mongos` search?

We designed the **Shard Key** to act as a routing guide. 

The shard key is a field (or set of fields) present in every document in the collection. 

MongoDB evaluates this field's value to decide which server (shard) owns the document. 

Selecting the correct shard key is the single most important decision in database architecture: choosing a bad key can create server bottlenecks (hotspots) and slow down queries.

---

### (2) The Three Requirements of a Good Shard Key

#### 1. High Cardinality (Unique Value Density)
The shard key must have many unique values (e.g. `user_id` or `email`). 
-   *Why:* If you choose a low-cardinality field like `status` (active/inactive), MongoDB can only split your data into 2 parts. 
-   If you have 10 shards, 8 of them will stay empty.

#### 2. Even Write Distribution (No Hotspots)
You must avoid **Monotonically Increasing Keys** (values that grow sequentially, like auto-incrementing IDs, ObjectIds, or timestamps: `created_at`).
-   *Why:* If you shard by `created_at`, every *new* document written has a newer timestamp. 
-   This means **100% of incoming writes** will route to the exact same shard (the "hot" shard) handling the latest time range, while your other servers sit idle. 
-   This eliminates the write-scaling benefits of sharding.

#### 3. Query Isolation
Most of your application's common queries should include the shard key in their filter.
-   *Why:* This allows the `mongos` router to send the query directly to a single shard (Targeted Query) instead of broadcasting it to all shards (Scatter-Gather Query).

---

### (3) Reality Metaphor (Mail Sorting Rooms)
Imagine sorting incoming mail to 3 workers:
-   **Bad Shard Key (Monotoniic Time):** You sort mail by **Arrival Hour**. 
    -   Worker 1 gets mail from 9–10 AM. 
    -   Worker 2 from 10–11 AM. 
    -   If the mail truck always arrives at 9:30 AM, **all letters** dump onto Worker 1's desk. 
    -   Worker 1 is overwhelmed, while Workers 2 and 3 sit idle. (Write hotspot).
-   **Good Shard Key (Customer ID Hash):** You calculate a math hash of the **Customer's Name** and write it on the envelope. 
    -   The letters are evenly distributed across all 3 workers' desks, regardless of when they arrive.

---

### (4) Code Examples

#### Enabling Sharding and Defining a Shard Key
To shard a collection in mongosh, you must first enable sharding on the database, ensure an index exists, and then run the shard command:

```javascript
// 1. Connect to mongos and enable sharding on the database
sh.enableSharding("ecom");

// 2. Build an index on the target shard key field (mandatory!)
db.getSiblingDB("ecom").orders.createIndex({ customer_id: 1 });

// 3. Shard the collection using the indexed key
sh.shardCollection("ecom.orders", { customer_id: 1 });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Choosing a monotonically increasing field (like 'created_at' or standard 'ObjectId') as a ranged shard key, creating write bottlenecks

**The mistake:** Sharding a high-volume payment transactions collection using `{ transaction_date: 1 }` as the shard key.

**Why it's wrong:** Because transactions occur sequentially in time, all new writes target the max range boundary. 

This causes 100% of write traffic to hit the same shard. 

The primary server of that shard will experience CPU and disk saturation, while the other shards remain underutilized.

**Fix: If you must shard by date or sequential IDs, use Hashed Sharding to scramble the values before routing, or use a Compound Shard Key that starts with a high-cardinality, non-sequential field: `{ customer_id: 1, transaction_date: 1 }`.**

---



### Mistake 2: Choosing Monotonically Increasing Fields as Ranged Shard Keys (Hotspotting)

**The mistake:** Choosing `createdAt` timestamp as a ranged shard key.

**Why it's wrong:** Monotonically increasing keys route all new insertions to the highest-range single shard, creating a severe write bottleneck.

*Incorrect:*
```javascript
sh.shardCollection("app.logs", { createdAt: 1 }); // ❌ Monotonic write hotspot!
```

*Fix:*
```javascript
sh.shardCollection("app.logs", { _id: "hashed" }); // Hashed sharding for uniform writes
```

### Mistake 3: Choosing Low Cardinality Fields as Shard Keys (Jumbo Chunk Error)

**The mistake:** Choosing `gender` or `status` (3 distinct values) as a shard key.

**Why it's wrong:** Low cardinality fields produce Jumbo Chunks containing millions of documents that cannot be split or balanced across shards.

*Incorrect:*
```javascript
sh.shardCollection("app.users", { status: 1 }); // ❌ Low cardinality jumbo chunk error!
```

*Fix:*
```javascript
Choose high cardinality fields or compound keys: { status: 1, userId: 1 }
```

## 5. Practice Exercises

### Exercise 1: Choosing High-Cardinality Shard Keys

**Scenario:**
Evaluate shard key selection for a 1,000,000,000 document collection `events` comparing `status` (low cardinality) vs `eventId` (high cardinality).

**Requirements:**
1. Explain why `eventId` is a superior shard key candidate over `status`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Shard Key Cardinality Analysis:
> - Low Cardinality (status: 3 values): Creates at most 3 chunks -> Data CANNOT split across 10 shard nodes (Hot Spots!).
> - High Cardinality (eventId: 1,000,000,000 values): Creates millions of chunks -> Data splits perfectly across 100+ shard nodes!
> ```
>
> #### Technical Explanation
>
> 1. Shard keys MUST possess high cardinality to enable splitting data into thousands of distinct chunks.
> 2. Low-cardinality keys lock data into indivisible jumbo chunks.
> 3. Primary criteria for shard key selection.

---

### Exercise 2: Designing Compound Shard Keys for Query Targeting

**Scenario:**
Design a compound shard key `{ tenantId: 1, createdAt: 1 }` for a multi-tenant SaaS application.

**Requirements:**
1. Execute `sh.shardCollection("saas.logs", { tenantId: 1, createdAt: 1 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.logs.createIndex({ tenantId: 1, createdAt: 1 });
> sh.shardCollection("saas.logs", { tenantId: 1, createdAt: 1 });
> ```
>
> #### Technical Explanation
>
> 1. Compound shard keys (`tenantId` + `createdAt`) isolate queries for a specific tenant to a single shard (`tenantId`).
> 2. `createdAt` provides high cardinality to split large tenants into multiple chunks.
> 3. Eliminates scatter-gather queries for multi-tenant applications.

---

### Exercise 3: Refactoring Shard Keys with `refineCollectionShardKey`

**Scenario:**
Refine an existing single-field shard key `{ tenantId: 1 }` by appending a secondary field `orderId: 1` using `refineCollectionShardKey`.

**Requirements:**
1. Execute `sh.refineCollectionShardKey("store.orders", { tenantId: 1, orderId: 1 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.createIndex({ tenantId: 1, orderId: 1 });
> sh.refineCollectionShardKey("store.orders", { tenantId: 1, orderId: 1 });
> ```
>
> #### Technical Explanation
>
> 1. MongoDB 4.4+ allows refining shard keys by appending suffix fields to existing shard key patterns.
> 2. Increases shard key cardinality for growing collections without re-sharded data migrations.
> 3. Powerful online schema refactoring capability.

---



## 6. Related Terms

- [Sharding (Horizontal Scaling)](sharding.md) — The parent partitioning concept.
- [Targeted vs. Scatter-Gather Queries](targeted_vs_scatter.md) — Query routing modes.
- [Hashed vs. Ranged Sharding](hashed_vs_ranged.md) — Distribution strategies.
- [Chunks & Balancing](chunks_balancing.md) — Related concept: Chunks & Balancing.

---

## 7. Key Takeaways
- The Shard Key determines how document data is distributed across shards.
- Choosing a shard key is the most critical decision in a sharded architecture.
- An index must exist on the shard key fields before sharding a collection.
- Good shard keys require high cardinality to allow even splits.
- Avoid monotonically increasing keys (like dates) to prevent write hotspots.
- Choose shard keys that are frequently used in query filters to enable targeted routing.
- Compound shard keys combine multiple fields to satisfy cardinality and query paths.
- Changing a shard key in production is highly complex; choose carefully.
