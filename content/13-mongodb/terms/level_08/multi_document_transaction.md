# Multi-Document Transaction

> **Level 8 — Transactions, Consistency & Durability**
> The database feature that provides ACID transactional guarantees across multiple documents, collections, and databases, serving as the direct equivalent of PostgreSQL's `BEGIN`/`COMMIT`/`ROLLBACK` statement blocks.

---

## 1. Prerequisites

- [Atomicity in MongoDB](atomicity.md) — The parent write guarantee.

---

## 2. Term Category

**Advanced Feature** (ACID Cross-Collection Transactions): Multi-Document Transactions provide full multi-collection ACID transactional semantics across replica sets and sharded clusters using client sessions.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Supported on Replica Sets since MongoDB 4.0 and Sharded Clusters since 4.2. Uses active document locks to manage concurrency, causing write operations to queue).

### (1) Design Motivation — "Why did we design this?"
While single-document atomicity handles 90% of write operations in MongoDB, some business actions must modify multiple documents:
-   **Bank Transfers:** Deducting $100 from Account A (in the `accounts` collection) and adding $100 to Account B (in the same collection).
-   **Order Checkouts:** Creating an order record in `orders`, deducting stock in `inventory`, and writing a payment log in `billing`.

If the database crashes mid-way during these workflows, your data becomes corrupt (e.g. money disappears or stock levels drift).

In PostgreSQL, you guarantee consistency by wrapping writes in transactions:
`BEGIN; UPDATE accounts SET bal = bal - 100 ...; UPDATE accounts SET bal = bal + 100 ...; COMMIT;`

We designed **Multi-Document Transactions** to bring these identical ACID (Atomicity, Consistency, Isolation, Durability) guarantees to MongoDB. 

All modifications inside a transaction are staged in a temporary session buffer. 

If you commit, all writes are applied together. 

If a step fails or you abort, the entire sequence is discarded, leaving your database clean.

---

### (2) The Performance Rule of NoSQL Transactions
Transactions in NoSQL databases carry a high performance cost:
-   **Concurrency Locks:** MongoDB must lock the documents being updated, blocking other write operations.
-   **Replica Pressure:** Stages all writes in the replica set Oplog, increasing replication lag.
-   **Rule of Thumb:** **Do not use transactions as a crutch for bad schema design.** Default to embedding fields inside a single document to utilize fast, native single-document atomicity. Reserve transactions strictly for multi-document workflows.

---

### (3) Reality Metaphor (Shopping Checkout Baskets)
Imagine buying groceries:
-   **Without Transactions:** Walking to the counter and paying for each grocery item one-by-one. 
    -   You pay for the milk. 
    -   Then the credit card machine crashes before you can pay for the bread. 
    -   You walk home with milk but no bread. (Inconsistent state).
-   **With Transactions:** Placing the milk and bread in a **Shopping Basket** (the transaction). 
    -   You walk to the cashier. 
    -   They scan everything. 
    -   You swipe your card. 
    -   Either the purchase completes and you walk away with all items, or the card is declined and all items stay at the counter. (All-or-nothing).

---

### (4) Code Examples

#### SQL vs. MongoDB Transaction API (Node.js)

```javascript
// SQL:
// BEGIN;
// UPDATE accounts SET balance = balance - 100 WHERE id = 1;
// UPDATE accounts SET balance = balance + 100 WHERE id = 2;
// COMMIT;

// MongoDB Driver API:
const session = db.getMongo().startSession(); // Start session wrapper
session.startTransaction(); // Begin transaction block
try {
  // Update Account A (must pass the session object!)
  db.accounts.updateOne(
    { _id: 1 },
    { $inc: { balance: -100 } },
    { session }
  );

  // Update Account B
  db.accounts.updateOne(
    { _id: 2 },
    { $inc: { balance: 100 } },
    { session }
  );

  session.commitTransaction(); // Commit: all writes saved!
} catch (error) {
  session.abortTransaction(); // Rollback: all writes discarded!
} finally {
  session.endSession(); // Clean up session
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Overusing multi-document transactions for simple document updates, causing severe database throughput issues

**The mistake:** Wrapping every simple user update or blog post insertion inside transaction blocks, assuming "it's always safer."

**Why it's wrong:** Holding locks inside transaction blocks prevents other writes from executing, slowing down database operations. 

This eliminates NoSQL's concurrency advantages, causing database request queues to spike.

**Fix: Embed related fields inside a single document to utilize fast, native single-document atomicity. Reserve transactions strictly for multi-document operations.**

---



### Mistake 2: Running Long-Running Processing Operations Inside Multi-Document Transactions

**The mistake:** Executing 30-second external HTTP API calls inside a `withTransaction()` block.

**Why it's wrong:** MongoDB transactions have a strict 60-second execution timeout. Holding open transactions locks storage resources and causes transaction conflict aborts.

*Incorrect:*
```javascript
await session.withTransaction(async () => {
  await db.account.updateOne(...);
  await fetch("http://external-api.com/pay"); // ❌ 30-second HTTP call inside transaction!
});
```

*Fix:*
```javascript
Execute external API calls outside transactions, keeping transactions under 1 second
```

### Mistake 3: Creating New Collections or DDL Indexes Inside Multi-Document Transactions

**The mistake:** Executing `db.createCollection()` or `createIndex()` inside a transaction block.

**Why it's wrong:** DDL schema operations (`createCollection`, `createIndex`, `drop`) are NOT supported inside multi-document transactions in MongoDB.

*Incorrect:*
```javascript
session.withTransaction(async () => { await db.createCollection("new_coll"); }); // ❌ DDL operation error!
```

*Fix:*
```javascript
Create collections and indexes before starting transaction blocks
```

## 5. Practice Exercises

### Exercise 1: Multi-Collection ACID Transaction with Snapshot Read Concern

**Scenario:**
Execute an ACID transaction transferring funds between `checking` and `savings` collections with `readConcern: "snapshot"` and `writeConcern: "majority"`.

**Requirements:**
1. Configure transaction options and execute inside session.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const session = client.startSession();
> 
> const txnOptions = {
>   readConcern: { level: "snapshot" },
>   writeConcern: { w: "majority" },
>   readPreference: "primary"
> };
> 
> try {
>   await session.withTransaction(async () => {
>     const checking = db.collection("checking");
>     const savings = db.collection("savings");
> 
>     await checking.updateOne({ userId }, { $inc: { balance: -200 } }, { session });
>     await savings.updateOne({ userId }, { $inc: { balance: 200 } }, { session });
>   }, txnOptions);
>   console.log("Transaction committed successfully.");
> } finally {
>   await session.endSession();
> }
> ```
>
> #### Technical Explanation
>
> 1. `withTransaction()` manages starting, committing, aborting, and retrying transactions automatically.
> 2. `readConcern: "snapshot"` provides consistent point-in-time isolation across both collections.
> 3. `writeConcern: "majority"` guarantees durable multi-node replication before transaction commit returns.

---

### Exercise 2: Transient Transaction Error Retry Handling

**Scenario:**
Handle `TransientTransactionError` labels automatically when network glitches disrupt an active transaction.

**Requirements:**
1. Catch errors containing `hasErrorLabel("TransientTransactionError")`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeTransactionWithRetry(txnFunc) {
>   const session = client.startSession();
>   while (true) {
>     try {
>       await session.withTransaction(txnFunc);
>       break;
>     } catch (err) {
>       if (err.hasErrorLabel("TransientTransactionError")) {
>         console.warn("Transient error encountered; retrying transaction...");
>         continue;
>       }
>       throw err;
>     } finally {
>       await session.endSession();
>     }
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. `TransientTransactionError` indicates a temporary network failure or primary election where retrying the transaction will succeed.
> 2. Drivers automatically retry transient errors when using `withTransaction()`.
> 3. Resilient transaction architecture.

---

### Exercise 3: Transaction Execution Time and Lock Bounding

**Scenario:**
Explain why multi-document transactions in MongoDB should execute in under 60 seconds.

**Requirements:**
1. Describe `transactionLifetimeLimitSeconds` (default 60s).

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Transaction Bounds & Limits:
> - Default max lifetime: 60 seconds (transactionLifetimeLimitSeconds).
> - Prolonged transactions hold WiredTiger cache locks and pin the oplog timestamp window.
> Best Practice: Keep transactions short, focused, and limited to essential writes.
> ```
>
> #### Technical Explanation
>
> 1. Long-running transactions hold WiredTiger MVCC snapshot locks, increasing RAM cache pressure.
> 2. Exceeding 60 seconds causes `mongod` to abort the transaction automatically.
> 3. Keep transactional logic lightweight.

---



## 6. Related Terms

- [Atomicity in MongoDB](atomicity.md) — The parent write guarantee.
- [`startSession()` / `session.withTransaction()`](session_transaction.md) — The driver implementation.
- [ACID vs BASE](acid_vs_base.md) — Related concept: ACID vs BASE.
- [Snapshot Isolation](snapshot_isolation.md) — Related concept: Snapshot Isolation.

---

## 7. Key Takeaways
- Multi-document transactions guarantee ACID compliance across collections.
- Direct NoSQL equivalent to SQL's `BEGIN`/`COMMIT`/`ROLLBACK` blocks.
- Staged writes are written to disk only when `commitTransaction()` is called.
- Any query failures or `abortTransaction()` calls roll back all modifications.
- High database lock overhead; blocks concurrent write queries.
- Do not use transactions as a replacement for proper document schema embedding.
- Requires passing the active `session` parameter to every query in the block.
