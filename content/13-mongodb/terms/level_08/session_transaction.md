# `startSession()` / `session.withTransaction()`

> **Level 8 — Transactions, Consistency & Durability**
> The MongoDB driver API methods used to initialize database sessions (`startSession()`) and execute transaction blocks with built-in, automatic retry logic for transient network errors and write conflicts (`withTransaction()`).

---

## 1. Prerequisites

- [Multi-Document Transaction](multi_document_transaction.md) — The parent transaction concept.
- [Snapshot Isolation](snapshot_isolation.md) — The concurrency conflict context.

---

## 2. Term Category

**Driver / Integration** (Client Session Lifetime & Transaction Management): Client Sessions (`ClientSession`) track client state, causal consistency sequences, and multi-document transaction lifecycles in MongoDB drivers.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Managed by the client driver. Coordinates session state tracking IDs with the database cluster nodes on every command payload).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Session Lifecycle Management with `ClientSession`

**Scenario:**
Create, use, and explicitly close a MongoDB driver `ClientSession` using try-finally.

**Requirements:**
1. Start session, execute operation with `{ session }`, end session in `finally`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const session = client.startSession();
> try {
>   const users = db.collection("users");
>   await users.updateOne(
>     { _id: userId },
>     { $set: { lastLogin: new Date() } },
>     { session }
>   );
> } finally {
>   await session.endSession();
> }
> ```
>
> #### Technical Explanation
>
> 1. `startSession()` creates a stateful client session tracking cluster time and transaction context.
> 2. Passing `{ session }` in options associates the write command with the session lifecycle.
> 3. `session.endSession()` in `finally` frees server-side session resources.

---

### Exercise 2: Session-Scoped Transaction Commitment

**Scenario:**
Execute `withTransaction()` on a session to execute 2 updates atomically.

**Requirements:**
1. Use `session.withTransaction()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const session = client.startSession();
> try {
>   await session.withTransaction(async () => {
>     await db.collection("accounts").updateOne({ _id: "A" }, { $inc: { balance: -50 } }, { session });
>     await db.collection("accounts").updateOne({ _id: "B" }, { $inc: { balance: 50 } }, { session });
>   });
> } finally {
>   await session.endSession();
> }
> ```
>
> #### Technical Explanation
>
> 1. `withTransaction()` binds transactional operations to the active `ClientSession`.
> 2. Handles commit, abort, and transient error retries automatically.
> 3. Prevents orphaned transactions.

---

### Exercise 3: Handling Session Timeout Expirations

**Scenario:**
Explain what happens when an idle session exceeds the server `localLogicalSessionTimeoutMinutes` (default 30 mins).

**Requirements:**
1. Describe server session cleanup after 30 minutes of inactivity.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Session Expiration Rules:
> Server purges idle sessions after 30 minutes of inactivity (localLogicalSessionTimeoutMinutes).
> Any active transaction bound to an expired session is aborted automatically by mongod.
> ```
>
> #### Technical Explanation
>
> 1. MongoDB background thread purges inactive sessions after 30 minutes.
> 2. Aborts uncommitted transactions to free server memory.
> 3. Do not leave sessions idle for prolonged periods in application code.

---



## 6. Related Terms

- [Multi-Document Transaction](multi_document_transaction.md) — The parent transaction concept.
- [Causal Consistency](causal_consistency.md) — Session-level read guarantees.

---

## 7. Key Takeaways
- `startSession()` creates a client session context for queries.
- `session.withTransaction()` executes transactions with automatic retry logic.
- Automatically retries transient network errors and write conflicts.
- Reduces application boilerplate code for transaction management.
- Every query inside the transaction must pass the `{ session }` parameter object.
- Omitting the session parameter bypasses the transaction, causing data corruption.
- Always close the session using `session.endSession()` in a `finally` block.
