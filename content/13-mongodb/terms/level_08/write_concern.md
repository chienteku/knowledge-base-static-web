# Write Concern

> **Level 8 — Transactions, Consistency & Durability**
> The database setting that controls the level of acknowledgment and durability verification MongoDB requires from replica set nodes before confirming a successful write operation to the client application.

---

## 1. Prerequisites

- [`insertOne()` / `insertMany()`](../level_03/insert.md) — Write operations.
- [Multi-Document Transaction](multi_document_transaction.md) — The transaction context.
- [Replica Set](../level_09/replica_set.md) — The distributed cluster context.

---

## 2. Term Category

**Administration / Operations** (Write Durability Acknowledgment Level): Write Concern (`w: 1`, `w: "majority"`, `j: true`, `wtimeout`) configures the level of durability acknowledgment required from `mongod` before returning write success.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Configurable at the client connection level, database level, or per-query. Governs replica set synchronization handshakes).

### (1) Design Motivation — "Why did we design this?"
In a distributed database cluster (Replica Set), data is copied across multiple servers for high availability.

When your application saves a document:
-   *When should MongoDB return a "Success" response to your Node.js API?*
-   If it returns success immediately after receiving the network packet: what if the server crashes before writing the data to disk?
-   If it waits until the data is written to all 3 servers: queries will be slow.

We designed **Write Concern** to solve this durability configuration choice. 

It allows you to customize the trade-off between write speed and data durability per query, ranging from "fast and risky" to "slow and bulletproof."

---

### (2) The Write Concern Parameters
Write concern is declared using three parameters: `{ w: <value>, j: <boolean>, wtimeout: <number> }`

#### 1. The `w` Parameter (Acknowledgment Level)
Controls how many replica set nodes must confirm the write:
-   **`w: 0` (Unacknowledged):** "Fire and forget." The driver returns success the moment the network packet is sent. It does not report duplicate key errors or validation crashes. (Fastest, but insecure).
-   **`w: 1`:** The default for standalone instances. Waits for acknowledgment from the single Primary node (hits its memory).
-   **`w: "majority"`:** The default for replica sets (since MongoDB 5.0). Waits until a majority of active voting replica nodes acknowledge the write in memory. **Protects against rollback data loss if the primary crashes.**

#### 2. The `j` Parameter (Journaling)
Enforces disk persistence.
-   **`j: true`:** The primary must write the write operation to the physical on-disk journal log before confirming success, guaranteeing durability against sudden power losses.

#### 3. The `wtimeout` Parameter
Limits waiting times.
-   Caps how many milliseconds the primary will wait for secondaries to replicate the write before returning a timeout error (prevents write commands from blocking indefinitely if a secondary goes offline).

---

### (3) Reality Metaphor (Homework Submissions)
Imagine submitting a paper to a teacher:
-   **`w: 0` (Fire & Forget):** Tossing the paper toward the classroom doorway slots and running home. You don't know if it landed inside or was swept away by the janitor.
-   **`w: 1` (Primary):** Handing the paper directly to the teacher. They hold it in their hand. (If they slip on ice on the way to their car, the paper is lost).
-   **`w: "majority"`:** Handing the paper to the teacher while **three classmates** make photocopies of it. You only leave the classroom once a majority of them nod and confirm they have their copies.

---

### (4) Code Examples

#### Overriding Write Concern on Writes
Let's save transaction records with high-durability requirements:

```javascript
// High Durability: Wait for majority replication AND disk journaling flush
db.payments.insertOne(
  { invoice_id: 9988, amount: 250.00 },
  {
    writeConcern: {
      w: "majority",
      j: true,
      wtimeout: 5000 // Timeout after 5 seconds if replication stalls
    }
  }
);

// High Speed (Low Durability): Log clicks without waiting
db.clicks.insertOne(
  { button: "submit", time: new Date() },
  { writeConcern: { w: 0 } } // Unacknowledged, returns instantly!
);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using 'w: 0' (Unacknowledged) writes for critical business transactions (such as payments or user registrations)

**The mistake:** Logging payment transactions using `w: 0` to make the API response feel faster.

**Why it's wrong:** Under `w: 0`, MongoDB does not check write success. 

If the database throws a duplicate key error, a schema validation error, or the network drops, your application code receives a "success" response anyway. 

The payment record is lost, creating financial discrepancies.

**Fix: Always use `w: 1` or `w: "majority"` with `j: true` for business-critical writes where data loss is unacceptable.**

---



### Mistake 2: Using `w: 0` (Un-Acknowledged Write Concern) for Critical Business Mutations

**The mistake:** Executing user account creation updates with `{ writeConcern: { w: 0 } }`.

**Why it's wrong:** `w: 0` returns success immediately without waiting for server network acknowledgement! Network errors or primary key collisions are completely ignored.

*Incorrect:*
```javascript
db.users.insertOne({ name: "Alice" }, { writeConcern: { w: 0 } }); // ❌ Unacknowledged write!
```

*Fix:*
```javascript
db.users.insertOne({ name: "Alice" }, { writeConcern: { w: "majority" } }); // Majority acknowledged
```

### Mistake 3: Using Un-Achievable Numerical `w: N` Values Exceeding Active Replica Set Node Counts

**The mistake:** Setting `{ w: 5 }` on a 3-node replica set cluster.

**Why it's wrong:** Requesting `w: 5` on a 3-node cluster causes operations to block indefinitely until timing out with `WriteConcernError`.

*Incorrect:*
```javascript
db.orders.insertOne({ ... }, { writeConcern: { w: 5, wtimeoutMS: 5000 } }); // ❌ 3-node cluster cannot fulfill w:5!
```

*Fix:*
```javascript
db.orders.insertOne({ ... }, { writeConcern: { w: "majority" } }); // Dynamically targets active majority
```

## 5. Practice Exercises

### Exercise 1: Configuring Majority Write Durability

**Scenario:**
Execute an `insertOne()` write operation with `writeConcern: { w: "majority", wtimeout: 5000 }` to guarantee cross-node durability.

**Requirements:**
1. Pass `writeConcern: { w: "majority", wtimeout: 5000 }` in write options.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.insertOne(
>   { orderId: "ORD-99", amount: 199.99, createdAt: new Date() },
>   { writeConcern: { w: "majority", wtimeout: 5000 } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `w: "majority"` requires the write operation to be acknowledged by a majority of replica set nodes before returning success.
> 2. `wtimeout: 5000` prevents client driver from blocking indefinitely if secondary replication lags.
> 3. Guarantees write durability against primary node crash failovers.
> 
---

### Exercise 2: Journal Flushing Control with `j: true`

**Scenario:**
Configure a high-security financial transaction write requiring disk journal flushing acknowledgment (`j: true`).

**Requirements:**
1. Pass `writeConcern: { w: "majority", j: true }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.ledger.insertOne(
>   { txId: "TX-1001", amount: 5000 },
>   { writeConcern: { w: "majority", j: true } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `j: true` requires `mongod` to flush the write operation to the on-disk WiredTiger journal file before acknowledging success.
> 2. Protects write durability even if all replica set nodes suffer simultaneous power loss.
> 3. Maximum single-node write durability option.
> 
---

### Exercise 3: Unacknowledged Writes (`w: 0`) for High-Volume Telemetry

**Scenario:**
Configure an unacknowledged write (`w: 0`) for non-critical high-frequency IoT log ingestion.

**Requirements:**
1. Pass `writeConcern: { w: 0 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.sensor_logs.insertOne(
>   { deviceId: "DEV-01", temp: 22.1, time: new Date() },
>   { writeConcern: { w: 0 } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `w: 0` sends the write command over network socket without waiting for server acknowledgment.
> 2. Provides maximum write throughput at the cost of zero error detection (network drops or duplicate key errors are ignored).
> 3. Use only for non-critical logging where losing occasional data points is acceptable.
> 
---



## 6. Related Terms

- [Read Concern](read_concern.md) — Read durability parameters.
- [Replica Set](../level_09/replica_set.md) — The cluster context.
- [`WriteConcernError` / `WriteError`](write_errors.md) — Related concept: `WriteConcernError` / `WriteError`.

---

## 7. Key Takeaways
- Write Concern configures write durability verification thresholds.
- `w` controls how many replica nodes must acknowledge the write.
- `w: 0` is unacknowledged (fastest, no error reporting).
- `w: "majority"` waits for a majority of replica set nodes to sync data.
- `j: true` guarantees disk-level recovery by waiting for journal flushes.
- `wtimeout` prevents write operations from blocking during secondary outages.
- High-durability concerns slow down write performance due to network wait times.
