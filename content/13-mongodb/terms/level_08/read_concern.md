# Read Concern

> **Level 8 — Transactions, Consistency & Durability**
> The database setting that controls what data a read query is allowed to return based on durability and replication guarantees, managing the risk of reading data that might later be rolled back.

---

## 1. Prerequisites
- [Write Concern](write_concern.md) — The writing durability equivalent.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Configurable at the connection, database, or collection level. Evaluates replica synchronization metadata stored in the cluster logs to isolate data).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Read Concern Selector

**Problem:** You are building three different features in a social networking app. 
Select the optimal Read Concern level (**"local"**, **"majority"**, or **"linearizable"**) for each requirement:
1.  Loading a user's homepage feed posts (low risk, speed is priority).
2.  Checking if a user's subscription transaction went through (requires permanent data validation).
3.  An administrative panel check confirming a user's admin role status before running critical account deletions.

**Expected output:**
```text
1. "local": High speed is prioritized for social media feed loads, and reading transient posts that might roll back carries no business risk.
2. "majority": Ensures that the subscription data read by the app has been replicated across a majority of nodes and cannot be rolled back.
3. "linearizable": Prevents split-brain administrators from reading stale permission states, ensuring safety before executing destructive operations.
```

> [!check]- Answer
> - Determine the risk profile of reading data that might be rolled back.
> - Consider if the check directly precedes a destructive operation.

---



### Exercise 2: Configuring Majority Read Concern

**Problem:** Query `orders` collection with `readConcern: 'majority'` in Node.js driver.

**Expected output:**
```text
db.orders.find({}, { readConcern: { level: "majority" } });
```

> [!check]- Answer
> ```javascript
> db.orders.find({}, { readConcern: { level: "majority" } });
> ```
>
> **Explanation:** `readConcern: 'majority'` returns data acknowledged by a majority of replica set nodes.

### Exercise 3: Snapshot Read Concern in Transactions

**Problem:** What read concern level is used in multi-document transactions to provide point-in-time snapshot isolation? (`"snapshot"`).

**Expected output:**
```text
readConcern: { level: "snapshot" }
```

> [!check]- Answer
> ```text
> readConcern: { level: "snapshot" }
> ```
>
> **Explanation:** `snapshot` read concern guarantees point-in-time isolation across transaction statements.

## 7. Related Terms
- [Write Concern](write_concern.md) — The writing durability equivalent.
- [Read Preference](read_preference.md) — Query routing targets.

---

## 8. Key Takeaways
- Read Concern controls what data is visible to queries in replica sets.
- `"local"` (default) returns latest data, but carries rollback risks.
- `"majority"` returns durable data that is guaranteed to never be rolled back.
- `"linearizable"` checks cluster consensus before reading to prevent stale primary reads.
- Always use `"majority"` read concern for financial and inventory checks.
- High-durability read concerns (majority, linearizable) increase query latency.
- Pairs with Write Concern `"majority"` to establish strong database consistency.
