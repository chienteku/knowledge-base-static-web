# Read Concern

> **Level 8 — Transactions, Consistency & Durability**
> The database setting that controls what data a read query is allowed to return based on durability and replication guarantees, managing the risk of reading data that might later be rolled back.

---

## 1. Prerequisites

- [Write Concern](write_concern.md) — The writing durability equivalent.

---

## 2. Term Category

**Administration / Operations** (Read Data Isolation Levels): Read Concern controls the isolation level and data freshness guarantees (`local`, `available`, `majority`, `linearizable`, `snapshot`) returned by read operations.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Configurable at the connection, database, or collection level. Evaluates replica synchronization metadata stored in the cluster logs to isolate data).

### (1) Design Motivation — "Why did we design this?"
In a distributed replica set, writing data is a process:
-   Step 1: Write is applied to the Primary server.
-   Step 2: Write is replicated to Secondary A.
-   Step 3: Write is replicated to Secondary B.

If your application reads data while this replication is in progress:
-   *Should the query see the new write immediately?*
-   If you read from the Primary node and it crashes before Step 2, the write is rolled back and disappears. 
-   Your application just executed a **Dirty Read** of data that technically never existed permanently.

We designed **Read Concern** to solve this read isolation choice. 

It allows you to specify the required level of verification before reading data, protecting your application from reading stale or temporary rollback data.

---

### (2) The Read Concern Levels

#### 1. `"local"` (Default)
Returns the node's most recent data snapshot.
-   *Behavior:* Does not check if data has been replicated.
-   *Risk:* High rollback risk. If the node crashes, the data you read might be undone.
-   *SQL Equivalent:* `READ UNCOMMITTED` / `READ COMMITTED`

#### 2. `"majority"`
Returns data that has been acknowledged by a majority of replica set nodes.
-   *Behavior:* Reads from a stable memory snapshot.
-   *Safety:* **Guaranteed to never be rolled back.** Even if the primary node crashes, this data is saved on secondaries and will persist.

#### 3. `"linearizable"`
Enforces the absolute strongest read consistency.
-   *Behavior:* The primary node halts the query and performs a consensus handshake with other nodes to verify it is still the active primary before returning data.
-   *Safety:* Prevents reading stale data from a "split-brain" primary server (a primary that has been disconnected from the cluster but doesn't know it yet). Very slow.

#### 4. `"snapshot"`
Used in transactions. Reads from a synchronized snapshot across the replica set.

---

### (3) Reality Metaphor (News Verification)
Imagine checking sports scores:
-   **`"local"` Read Concern:** Reading a **Rumor Tweet** posted by a fan in the stadium. (Fast, but the play might be overturned by the referee, and the tweet deleted).
-   **`"majority"` Read Concern:** Checking the **ESPN Official scoreboard** after the referees have reviewed the video feed and both coaches have confirmed the score. (Slower, but the score is final and will not change).

---

### (4) Code Examples

#### Configuring Read Concern in Queries
Let's query account details with majority checks:

```javascript
// Read bank balances (guaranteed to never roll back!)
db.accounts.find(
  { user_id: 105 },
  { balance: 1 }
).readConcern("majority");

// Read sensor metrics (speed is prioritized, local is fine)
db.metrics.find(
  { sensor_id: "temp-01" }
).readConcern("local");
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on default 'local' read concern for financial calculations or inventory checkouts in replica sets

**The mistake:** Running `db.inventory.find({ item: "CPU" }).readConcern("local")` before confirming an order, assuming the stock count is permanent.

**Why it's wrong:** If the primary node crashes immediately after a stock deduction, the database rolls back the write. 

Because your code read the value using `"local"`, your application assumes the stock is deducted, leading to double-selling errors.

**Fix: Always use `.readConcern("majority")` for critical checkouts where reading data that might roll back would break application logic.**

---



### Mistake 2: Reading Dirty Un-Committed Data Using `readConcern: 'local'` During Primary Failovers

**The mistake:** Reading critical financial data with default `readConcern: 'local'`.

**Why it's wrong:** `readConcern: 'local'` returns data written to memory, which can be rolled back if the Primary node crashes before replicating to Secondaries. Use `readConcern: 'majority'`.

*Incorrect:*
```javascript
db.accounts.find({ _id: id }, { readConcern: { level: "local" } }); // ❌ Rollback risk!
```

*Fix:*
```javascript
db.accounts.find({ _id: id }, { readConcern: { level: "majority" } }); // Majority committed data
```

### Mistake 3: Using `readConcern: 'linearizable'` for High-Throughput Read APIs

**The mistake:** Setting `readConcern: 'linearizable'` on all read requests in a high-throughput API.

**Why it's wrong:** `linearizable` forces the Primary to verify its leadership status with a majority of nodes BEFORE returning reads, introducing heavy latency overhead. Use `readConcern: 'majority'`.

*Incorrect:*
```javascript
db.products.find({}, { readConcern: { level: "linearizable" } }); // ❌ Heavy latency overhead!
```

*Fix:*
```javascript
db.products.find({}, { readConcern: { level: "majority" } });
```

## 5. Practice Exercises

### Exercise 1: Majority Read Isolation Configuration

**Scenario:**
Configure query `find()` with `readConcern: "majority"` to guarantee returned documents cannot be rolled back by primary node failover.

**Requirements:**
1. Execute `find().readConcern("majority")`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.find({ status: "completed" })
>   .readConcern("majority");
> ```
>
> #### Technical Explanation
>
> 1. `readConcern: "majority"` returns data that has been acknowledged by a majority of replica set nodes.
> 2. Guarantees read data is durable against primary node crash and failover rollbacks.
> 3. Essential isolation level for financial reporting.
> 
---

### Exercise 2: Snapshot Isolation for Point-in-Time Queries

**Scenario:**
Execute a multi-collection analytics query using `readConcern: "snapshot"` to inspect a consistent point-in-time database view.

**Requirements:**
1. Use `readConcern: "snapshot"` inside a session.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const session = client.startSession();
> const orders = db.collection("orders");
> 
> const result = await orders.find(
>   { status: "completed" },
>   { session, readConcern: { level: "snapshot" } }
> ).toArray();
> 
> session.endSession();
> ```
> 
> #### Technical Explanation
>
> 1. `readConcern: "snapshot"` utilizes WiredTiger MVCC to read from a single, consistent point-in-time snapshot.
> 2. Prevents phantom reads and dirty reads across multi-collection queries.
> 3. Used natively inside ACID transactions.
> 
---

### Exercise 3: Comparing Read Concern Levels

**Scenario:**
Formulate a technical decision matrix comparing `local`, `majority`, `linearizable`, and `snapshot` read concern levels.

**Requirements:**
1. Evaluate latency vs isolation trade-offs across read concern options.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Read Concern Selection Matrix:
> - "local" / "available": Default mode. Lowest latency, reads current node memory (risk of rollback if node fails).
> - "majority": Balanced mode. Reads data committed to majority of nodes (durable against rollbacks).
> - "snapshot": Transaction mode. Point-in-time MVCC view across multiple operations.
> - "linearizable": Strictest mode. Real-time quorum check with all nodes (highest latency).
> ```
>
> #### Technical Explanation
>
> 1. Higher isolation levels trade query latency for durability guarantees.
> 2. Use `local` for high-speed dashboards; use `majority` for order confirmation.
> 3. Tailor read concern to business domain requirements.
> 
---



## 6. Related Terms

- [Write Concern](write_concern.md) — The writing durability equivalent.
- [Read Preference](read_preference.md) — Query routing targets.

---

## 7. Key Takeaways
- Read Concern controls what data is visible to queries in replica sets.
- `"local"` (default) returns latest data, but carries rollback risks.
- `"majority"` returns durable data that is guaranteed to never be rolled back.
- `"linearizable"` checks cluster consensus before reading to prevent stale primary reads.
- Always use `"majority"` read concern for financial and inventory checks.
- High-durability read concerns (majority, linearizable) increase query latency.
- Pairs with Write Concern `"majority"` to establish strong database consistency.
