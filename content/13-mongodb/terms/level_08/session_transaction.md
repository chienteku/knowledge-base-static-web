# `startSession()` / `session.withTransaction()`

> **Level 8 — Transactions, Consistency & Durability**
> The MongoDB driver API methods used to initialize database sessions (`startSession()`) and execute transaction blocks with built-in, automatic retry logic for transient network errors and write conflicts (`withTransaction()`).

---

## 1. Prerequisites

- [Multi-Document Transaction](multi_document_transaction.md) — The parent transaction concept.
- [Snapshot Isolation](snapshot_isolation.md) — The concurrency conflict context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Managed by the client driver. Coordinates session state tracking IDs with the database cluster nodes on every command payload).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Writing multi-document transaction code manually is hard:
-   If a query fails due to a network glitch (a transient error), you must write code to retry the transaction.
-   If a write conflict occurs (a concurrent transaction updated the same document), you must write code to retry.
-   If the commit itself fails due to replication delays, you must retry the commit.

Hand-coding this error-handling logic results in verbose, bug-prone code.

We designed the **`session.withTransaction()`** helper method to solve this. 

It wraps your database operations in a transaction block. 

It automatically monitors executions. 

If a transient network error or a `WriteConflict` occurs, the driver **automatically retries the entire function** without your application throwing errors, providing a clean, production-ready transaction execution API.

---

### (2) The Session Requirement
To run a transaction, you must first create a **Session** using `client.startSession()`. 
-   The session tracks the logical ordering of commands.
-   **CRITICAL RULE:** Inside the transaction block, **every database query must explicitly receive the `{ session }` parameter object.** 
-   If you omit the `{ session }` parameter on a query, that query executes immediately outside the transaction, violating isolation rules and causing data corruption.

---

### (3) Reality Metaphor (Smart Courier Insurance)
Imagine shipping a fragile package:
-   **Manual Transaction Code:** You hire a courier. If the truck gets a flat tire (transient network error) or hits a road block (write conflict), the courier calls you, and you must manually re-purchase the items, pack another box, and schedule a new pickup.
-   **`withTransaction()` Wrapper:** You hire a **Smart Courier with Automatic Redelivery Insurance**. 
    -   If the truck gets a flat tire, the company handles it: they return to the warehouse, pack a new box, and retry the delivery automatically. 
    -   You only get notified if they fail after multiple attempts.

---

### (4) Code Examples

#### Node.js Production Transaction Pattern
Here is how to execute a transaction safely in Node.js using `withTransaction()`:

```javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');

async function executeTransfer() {
  await client.connect();
  const db = client.db('bank');
  
  // 1. Start the session wrapper
  const session = client.startSession();
  
  try {
    // 2. Execute transaction with automatic retries!
    await session.withTransaction(async () => {
      
      // Update Account A (MUST pass the session!)
      await db.collection('accounts').updateOne(
        { _id: "A" },
        { $inc: { balance: -100 } },
        { session } 
      );
      
      // Update Account B (MUST pass the session!)
      await db.collection('accounts').updateOne(
        { _id: "B" },
        { $inc: { balance: 100 } },
        { session } 
      );
      
    });
    console.log("Transaction committed successfully!");
  } catch (error) {
    console.error("Transaction failed permanently:", error);
  } finally {
    await session.endSession(); // Close session
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omit the '{ session }' option parameter in one of the queries inside a 'withTransaction' block

**The mistake:** Forgetting to pass `{ session }` to the second update in the block:

```javascript
// BAD CODE
await session.withTransaction(async () => {
  await db.collection('accounts').updateOne({ _id: "A" }, { $inc: { balance: -100 } }, { session });
  await db.collection('accounts').updateOne({ _id: "B" }, { $inc: { balance: 100 } }); // OMITTED SESSION!
});
```

**Why it's wrong:** The second update executes immediately on the database outside the transaction. 

It does not wait for the commit. 

If the transaction is aborted because the first update fails, the second update stays written, corrupting your balances.

**Fix: Verify that every single database read or write command inside the transaction block receives the `{ session }` parameter object.**

---



### Mistake 2: Forgetting to End Client Sessions in `finally` Cleanup Blocks

**The mistake:** Creating `const session = client.startSession()` and failing to call `session.endSession()`.

**Why it's wrong:** Un-closed sessions leak server session resources and pinned memory allocations on `mongod` servers.

*Incorrect:*
```javascript
const session = client.startSession();
await session.withTransaction(...);
// ❌ Missing session.endSession()!
```

*Fix:*
```javascript
const session = client.startSession(); try { await session.withTransaction(...); } finally { await session.endSession(); }
```

### Mistake 3: Executing Queries Inside Transactions Without Passing the `{ session }` Option

**The mistake:** Starting a transaction and calling `db.users.updateOne({ _id: id }, { $set: { a: 1 } })` without passing `{ session }`.

**Why it's wrong:** Operations executed without `{ session }` option execute OUTSIDE the transaction context, bypassing transactional isolation!

*Incorrect:*
```javascript
session.startTransaction();
await db.users.updateOne({ _id: id }, { $set: { a: 1 } }); // ❌ Executed OUTSIDE transaction!
```

*Fix:*
```javascript
await db.users.updateOne({ _id: id }, { $set: { a: 1 } }, { session }); // Pass session option
```

## 6. Practice Exercises

### Exercise 1: Session Parameter Audit

**Problem:** You are reviewing a transaction code block. Identify why the following code is broken:
```javascript
await session.withTransaction(async () => {
  const user = await db.collection('users').findOne({ _id: 10 });
  if (user.status === "active") {
    await db.collection('logs').insertOne({ msg: "User checked" }, { session });
  }
});
```
State how to fix the code.

**Expected output:**
> [!check]- Answer
> ```text
> The code is broken because the `findOne` query does not receive the `{ session }` parameter. 
> This means it reads the user outside the transaction snapshot, risking a dirty read of stale user data. 
> To fix it, add the session parameter to `findOne`:
> `const user = await db.collection('users').findOne({ _id: 10 }, { session });`
> ```
> - Check all database read and write commands in the block.
> - Look for the presence of the `{ session }` parameter.

---



### Exercise 2: Idiomatic Transaction Session Pattern

**Problem:** Write safe session creation pattern using `try ... finally` and `session.endSession()`.

**Expected output:**
> [!check]- Answer
> ```text
> const session = client.startSession(); try { await session.withTransaction(fn); } finally { await session.endSession(); }
> ```
> ```javascript
> const session = client.startSession();
> try {
>   await session.withTransaction(async () => {
>     // Transactional operations ...
>   });
> } finally {
>   await session.endSession();
> }
> ```
>
> **Explanation:** `finally { session.endSession(); }` guarantees session resource cleanup.

---

### Exercise 3: Passing Session Option to Driver Operations

**Problem:** Pass `session` option to `insertOne` call inside transaction.

**Expected output:**
> [!check]- Answer
> ```text
> await db.users.insertOne({ name: "Alice" }, { session });
> ```
> ```javascript
> await db.users.insertOne({ name: "Alice" }, { session });
> ```
>
> **Explanation:** Operations MUST pass `{ session }` to be bound within transaction boundaries.

## 7. Related Terms

- [Multi-Document Transaction](multi_document_transaction.md) — The parent transaction concept.
- [Causal Consistency](causal_consistency.md) — Session-level read guarantees.

---

## 8. Key Takeaways
- `startSession()` creates a client session context for queries.
- `session.withTransaction()` executes transactions with automatic retry logic.
- Automatically retries transient network errors and write conflicts.
- Reduces application boilerplate code for transaction management.
- Every query inside the transaction must pass the `{ session }` parameter object.
- Omitting the session parameter bypasses the transaction, causing data corruption.
- Always close the session using `session.endSession()` in a `finally` block.
