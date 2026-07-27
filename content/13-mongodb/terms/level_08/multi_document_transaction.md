# Multi-Document Transaction

> **Level 8 — Transactions, Consistency & Durability**
> The database feature that provides ACID transactional guarantees across multiple documents, collections, and databases, serving as the direct equivalent of PostgreSQL's `BEGIN`/`COMMIT`/`ROLLBACK` statement blocks.

---

## 1. Prerequisites
- [Atomicity in MongoDB](atomicity.md) — The parent write guarantee.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Supported on Replica Sets since MongoDB 4.0 and Sharded Clusters since 4.2. Uses active document locks to manage concurrency, causing write operations to queue).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: SQL to Mongo Transaction Translation

**Problem:** You have a Postgres transaction:
```sql
BEGIN;
INSERT INTO logs (msg) VALUES ('Transfer Started');
UPDATE balances SET usd = usd - 50 WHERE user_id = 5;
COMMIT;
```
Write the corresponding MongoDB transaction pseudocode using the `session` object variables.

**Expected output:**
```javascript
const session = db.getMongo().startSession();
session.startTransaction();
try {
  db.logs.insertOne({ msg: "Transfer Started" }, { session });
  db.balances.updateOne({ user_id: 5 }, { $inc: { usd: -50 } }, { session });
  session.commitTransaction();
} catch (error) {
  session.abortTransaction();
} finally {
  session.endSession();
}
```

> [!check]- Answer
> - Initialize a session using `startSession()`.
> - Pass the `{ session }` parameter object to every write query inside the try block.

---



### Exercise 2: Executing Money Transfer Transaction

**Problem:** Write `withTransaction()` block transferring $100 from `acc1` to `acc2` atomically.

**Expected output:**
```text
await session.withTransaction(async () => { await accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session }); await accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } }, { session }); });
```

> [!check]- Answer
> ```javascript
> const session = client.startSession();
> try {
>   await session.withTransaction(async () => {
>     await accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session });
>     await accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } }, { session });
>   });
> } finally {
>   await session.endSession();
> }
> ```
>
> **Explanation:** `withTransaction()` handles automatic transaction start, commit, and retry logic.

### Exercise 3: Transaction Execution Limit

**Problem:** What is MongoDB's default maximum transaction runtime limit? (60 seconds).

**Expected output:**
```text
60 seconds
```

> [!check]- Answer
> ```text
> 60 seconds
> ```
>
> **Explanation:** Transactions exceeding 60 seconds are automatically aborted by the server.

## 7. Related Terms
- [Atomicity in MongoDB](atomicity.md) — The parent write guarantee.
- [`startSession()` / `session.withTransaction()`](session_transaction.md) — The driver implementation.

---

## 8. Key Takeaways
- Multi-document transactions guarantee ACID compliance across collections.
- Direct NoSQL equivalent to SQL's `BEGIN`/`COMMIT`/`ROLLBACK` blocks.
- Staged writes are written to disk only when `commitTransaction()` is called.
- Any query failures or `abortTransaction()` calls roll back all modifications.
- High database lock overhead; blocks concurrent write queries.
- Do not use transactions as a replacement for proper document schema embedding.
- Requires passing the active `session` parameter to every query in the block.
