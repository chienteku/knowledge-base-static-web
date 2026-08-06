# `bulkWrite()`

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The MongoDB collection method used to execute a heterogeneous batch of write operations (inserts, updates, replaces, and deletes) in a single network roundtrip for maximum performance.

---

## 1. Prerequisites

- [`insertOne()` / `insertMany()`](insert.md) — The insert operation.
- [`updateOne()` / `updateMany()`](update.md) — The update operation.
- [`deleteOne()` / `deleteMany()`](delete.md) — The delete operation.

---

## 2. Term Category

**CRUD Operation** (Batch Execution API): bulkWrite() executes multiple write operations (inserts, updates, deletes) in a single network batch payload for optimal write throughput.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Optimizes disk storage writes by grouping bulk operations into single batch transactions at the WiredTiger storage engine layer).

### (1) Design Motivation — "Why did we design this?"
When building data synchronization workers or running nightly migration scripts:
-   You need to process thousands of database changes: inserting new products, updating stock prices, and deleting discontinued items.
-   **The network latency barrier:** If you execute these 10,000 operations one-by-one using separate database queries (`db.users.insertOne()`, then `db.users.updateOne()`), the application must wait for 10,000 network roundtrips. Network delay will slow down your script, taking minutes to complete.
-   While `insertMany()` batches writes, it is **homogeneous** (it only supports inserts). You cannot mix updates or deletes inside it.

We designed **`bulkWrite()`** to bypass this network roundtrip bottleneck. 

It allows you to compile a **mixed batch** of write commands and send them to MongoDB as a single payload. 

MongoDB executes the entire list of writes on the server in one block, reducing network overhead and speeding up executions.

---

### (2) Ordered vs. Unordered Execution
You can configure `bulkWrite()` using an options object:

-   **Ordered (Default - `ordered: true`):** MongoDB executes operations in the exact order they are listed in the array. If operation #3 fails (e.g. due to a duplicate key), MongoDB **halts immediately** and does not execute the remaining operations.
-   **Unordered (`ordered: false`):** MongoDB executes operations in parallel. If one operation fails, the engine continues processing the rest. All successful writes are saved, and all errors are reported at the end. (Faster performance, best for data syncing).

---

### (3) Reality Metaphor (Cargo Shipping Crates)
-   **One-by-one writes:** Driving your car back-and-forth to the post office 50 times, mailing one envelope per trip. (Exhausting, slow, and wastes gas).
-   **`bulkWrite()`:** Packing a **Giant Wooden Cargo Crate**. 
    -   Inside the crate, you place 10 letters to mail (inserts), 5 packages to change addresses on (updates), and 3 items to throw in the trash (deletes). 
    -   You ship the entire crate to the post office in a single truck delivery.

---

### (4) Code Examples

#### Executing a Mixed bulkWrite Batch
You pass an array of operation objects to the method:

```javascript
db.products.bulkWrite([
  // 1. Insert Operation
  {
    insertOne: {
      document: { _id: 201, name: "Tape Measure", price: NumberDecimal("9.99") }
    }
  },
  // 2. Update Operation
  {
    updateOne: {
      filter: { _id: 105 },
      update: { $inc: { stock: -1 } }
    }
  },
  // 3. Delete Operation
  {
    deleteOne: {
      filter: { status: "discontinued" }
    }
  }
], { ordered: false }); // Execute in parallel (unordered)
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing the deeply nested object syntax of bulkWrite operations

**The mistake:** Writing `{ insertOne: { name: "Hammer" } }` instead of wrapping the document inside the `document` sub-key.

**Why it's wrong:** `bulkWrite()` requires a highly structured format because it supports multiple operation types. 
-   `insertOne` expects the key `document`: `{ insertOne: { document: { ... } } }`.
-   `updateOne` expects the keys `filter` and `update`: `{ updateOne: { filter: { ... }, update: { ... } } }`.
Omitting these sub-keys will trigger immediate query validation crashes.

**Fix: Always double-check your nesting layers when constructing bulk arrays.**

---





### Mistake 2: Executing Multiple Individual Write Network Requests in Loops Instead of `bulkWrite()`

**The mistake:** Running a 5,000-iteration `for` loop executing `await db.collection.updateOne()` on every iteration.

**Why it's wrong:** 5,000 individual write calls create 5,000 network RPC roundtrips, taking minutes to execute. `bulkWrite()` sends all operations in a single network batch request.

*Incorrect:*
```javascript
for (const item of items) { await db.coll.updateOne({ _id: item.id }, { $set: { val: item.val } }); } // ❌ 5,000 RPC roundtrips!
```

*Fix:*
```javascript
const ops = items.map(item => ({ updateOne: { filter: { _id: item.id }, update: { $set: { val: item.val } } } })); await db.coll.bulkWrite(ops);
```



### Mistake 3: Assuming `bulkWrite()` Operations Execute In Parallel Across Nodes

**The mistake:** Expecting `{ ordered: false }` bulk operations to automatically execute in parallel worker threads.

**Why it's wrong:** `{ ordered: false }` allows MongoDB to re-order and continue execution past individual write errors. It does NOT spawn multi-threaded parallel executions.

*Incorrect:*
```javascript
// Expecting ordered: false to create multi-threaded parallel writes
```

*Fix:*
```javascript
Use ordered: false to allow non-blocking continuation on write errors
```



## 5. Practice Exercises

### Exercise 1: High-Throughput Batch Operations with `bulkWrite`

**Scenario:**
Execute a batch insertion and update operation across collection `inventory` in a single network request using `bulkWrite()`.

**Requirements:**
1. Combine `insertOne` and `updateOne` inside `bulkWrite()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.inventory.bulkWrite([
>   {
>     insertOne: {
>       document: { item: "itemA", qty: 100, status: "A" }
>     }
>   },
>   {
>     updateOne: {
>       filter: { item: "itemB" },
>       update: { $inc: { qty: 50 } }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `bulkWrite()` bundles multiple CRUD commands into a single binary payload sent to `mongod`.
> 2. Reduces network roundtrip latency significantly compared to sequential writes.
> 3. Returns a unified `BulkWriteResult` object summarizing operations.

---

### Exercise 2: Unordered Bulk Writes for High Write Availability

**Scenario:**
Execute an unordered bulk write batch so that if one write operation fails, remaining write operations continue executing.

**Requirements:**
1. Pass `{ ordered: false }` option to `bulkWrite()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.inventory.bulkWrite([
>   { insertOne: { document: { _id: 1, item: "A" } } },
>   { insertOne: { document: { _id: 1, item: "B" } } }, // Duplicate key error!
>   { insertOne: { document: { _id: 2, item: "C" } } }
> ], { ordered: false });
> ```
>
> #### Technical Explanation
>
> 1. `{ ordered: false }` allows MongoDB to execute operations in parallel and continue processing upon errors.
> 2. Duplicate key errors on individual items do not abort remaining writes in the batch.
> 3. Maximizes write throughput in multi-node clusters.

---

### Exercise 3: Bulk Upsert Operations

**Scenario:**
Perform batch upserts updating existing records or inserting missing records based on product SKU.

**Requirements:**
1. Use `updateOne` with `upsert: true` inside `bulkWrite()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.bulkWrite([
>   {
>     updateOne: {
>       filter: { sku: "SKU-001" },
>       update: { $set: { price: 29.99 } },
>       upsert: true
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `upsert: true` creates missing records when filters fail to match existing documents.
> 2. Standard pattern for synchronization and ETL data ingestion scripts.
> 3. Executes batch upserts atomically.

---



## 6. Related Terms

- [`insertOne()` / `insertMany()`](insert.md) — Standard inserts.
- [`updateOne()` / `updateMany()`](update.md) — Standard updates.
- [`deleteOne()` / `deleteMany()`](delete.md) — Standard deletes.

---

## 7. Key Takeaways
- `bulkWrite()` batch-executes mixed writes in a single network roundtrip.
- Greatly optimizes execution speed for migrations, seeds, and API sync scripts.
- Supports combining inserts, updates, replaces, and deletes in one array.
- Ordered mode halts on the first error; Unordered mode runs in parallel.
- Requires strict nesting syntax rules (e.g. `{ insertOne: { document: { ... } } }`).
- Reduces transaction write locks at the storage engine layer.
- Use unordered writes for maximum speed when operations are independent.
