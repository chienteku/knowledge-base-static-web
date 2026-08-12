# Database Transactions

> **Level 8 — Database Integration**
> All-or-nothing operations (ACID) — the reliability primitive behind money/orders.

---

## 1. Prerequisites
- [SQL vs NoSQL](sql_vs_nosql.md) — The storage formats supporting transactions.
- [Connection Pooling](connection_pools.md) — The connection channels used to execute transaction queries.

---

## 2. Term Category

**Database / Computer Science Concept (Database Engine Layer .)**: Database Transactions is a fundamental concept in this technology stack. **Level 8 — Database Integration**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In web development, many workflows consist of multiple related database updates that must either succeed together or fail completely.

Consider transferring $100 from Account A to Account B. This requires two steps:
1.  **Deduct $100** from Account A.
2.  **Add $100** to Account B.

If step 1 succeeds, but step 2 fails (due to a database constraint, network error, or server crash), the money disappears.

To ensure data integrity, databases support **Transactions**:
-   **Database Transaction:** A sequence of operations executed as a single logical unit of work.
-   **ACID Compliance:**
    -   **Atomicity:** The "all-or-nothing" rule. If any statement inside the transaction fails, the entire transaction is aborted, and any changes already made are undone (**Rollback**). If all statements succeed, the changes are permanently saved (**Commit**).
    -   **Consistency:** The transaction transitions the database from one valid state to another, preserving all schemas, indexes, and constraints.
    -   **Isolation:** Multiple concurrent transactions execute without interfering with each other.
    -   **Durability:** Once a transaction commits, the changes are written to persistent storage and will survive subsequent server crashes.

---

### (2) Reality Metaphor
Imagine buying a train ticket at a physical ticket window.
- **Non-Transactional:** You hand the cashier a $20 bill. The cashier puts the cash in the register (**Step 1 succeeds**). Suddenly, the power cuts out and the ticketing computer crashes (**Step 2 fails**). The cashier cannot print the ticket, and you have lost your $20.
- **Transactional:** You hold the $20 bill, and the cashier holds the ticket. You exchange them simultaneously in a single, unified handoff. If the power cuts out mid-exchange, the trade is aborted: you keep your $20, and the cashier keeps the ticket. No partial transaction occurs.

---

### (3) Prisma Transaction Code Example

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function transferFunds(senderId, receiverId, amount) {
  try {
    // Execute multiple operations inside a single transaction wrapper
    await prisma.$transaction(async (tx) => {
      // 1. Check sender balance
      const sender = await tx.account.findUnique({ where: { id: senderId } });
      if (sender.balance < amount) {
        throw new Error("Insufficient funds"); // Triggers rollback automatically
      }

      // 2. Deduct amount from sender
      await tx.account.update({
        where: { id: senderId },
        data: { balance: { decrement: amount } }
      });

      // 3. Add amount to receiver
      await tx.account.update({
        where: { id: receiverId },
        data: { balance: { increment: amount } }
      });
    });
    
    console.log("Transaction committed successfully!");
  } catch (err) {
    // If any error is thrown inside the transaction function, Prisma rollbacks all queries
    console.error("Transaction aborted. Rolled back changes:", err.message);
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Executing slow, non-database operations inside a transaction block

**The mistake:** Awaiting external API calls, sending emails, or doing heavy file reads inside a database transaction block:

```javascript
// BAD: Holds database locks active while waiting for a slow external API!
await prisma.$transaction(async (tx) => {
  await tx.user.update({ where: { id: 1 }, data: { status: 'PREMIUM' } });
  
  // Slow external API call takes 3 seconds!
  const response = await fetch('https://payment-provider.com/verify'); 
  
  await tx.invoice.create({ data: { amount: 99, status: response.ok } });
});
```

**Why it's wrong:** To guarantee **Isolation**, databases lock the target rows or tables during a transaction, preventing other requests from writing to them. If your Node.js application pauses mid-transaction to await a slow external API call, these database locks remain active, blocking other users and quickly exhausting your server's connection pool.

*Fix:* Perform all external API queries, email dispatches, and CPU-intensive file operations *before* or *after* opening the database transaction. Keep transactions as short as possible:

```javascript
// GOOD: Perform external API call first, then run database queries in a quick transaction
const response = await fetch('https://payment-provider.com/verify'); 

await prisma.$transaction(async (tx) => {
  await tx.user.update({ where: { id: 1 }, data: { status: 'PREMIUM' } });
  await tx.invoice.create({ data: { amount: 99, status: response.ok } });
});
```

---



### Mistake 2: Forgetting to Issue `ROLLBACK` on Error in Database Transactions

**The mistake:** Executing `BEGIN` and `COMMIT` in a transaction without calling `ROLLBACK` when errors occur.

**Why it's wrong:** If an error occurs mid-transaction, omitting `ROLLBACK` leaves locks open and changes un-rolled back, corrupting database isolation states.

*Incorrect:*
```javascript
await client.query('BEGIN');
await client.query('UPDATE accounts SET balance = balance - 100 WHERE id = 1');
await client.query('UPDATE accounts SET balance = balance + 100 WHERE id = 2');
await client.query('COMMIT'); // ❌ If 2nd query throws, transaction is never rolled back!
```

*Fix:*
```javascript
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts SET balance = balance - 100 WHERE id = 1');
  await client.query('UPDATE accounts SET balance = balance + 100 WHERE id = 2');
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
}
```

### Mistake 3: Performing Non-Transactional External API Calls Inside Active Database Transactions

**The mistake:** Sending an external Stripe payment HTTP request inside an active database SQL transaction block.

**Why it's wrong:** External network HTTP requests can take seconds or fail. Holding SQL transaction locks open during external HTTP calls causes lock contention, deadlocks, and slow performance.

*Incorrect:*
```javascript
await db.transaction(async (tx) => {
  await tx.user.update(...);
  await stripe.charges.create(...); // ❌ Holds SQL transaction locks open during external HTTP call!
});
```

*Fix:*
```javascript
await stripe.charges.create(...); // Perform external HTTP call first
await db.transaction(async (tx) => {
  await tx.user.update(...); // SQL transaction runs fast
});
```

## 5. Practice Exercises

### Exercise 1: ACID Database Transaction Wrapper

**Scenario:** A financial transfer service executes a multi-statement database transaction with `BEGIN`, `COMMIT`, and `ROLLBACK` error handling.

**Requirements:**
1. Write executeTransaction(clientMock, transactionFn).
2. Issue `BEGIN` statement.
3. Execute transactionFn.
4. Issue `COMMIT` on success, `ROLLBACK` on error.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeTransaction(clientMock, transactionFn) {
>   try {
>     await clientMock.query("BEGIN");
>     const result = await transactionFn(clientMock);
>     await clientMock.query("COMMIT");
>     return { success: true, result };
>   } catch (err) {
>     try {
>       await clientMock.query("ROLLBACK");
>     } catch (_) {}
>     return { success: false, error: err.message, rolledBack: true };
>   }
> }
>
> // Verification tests
> const queries = [];
> const mockClient = {
>   query: async (sql) => { queries.push(sql); }
> };
>
> const happyTx = async (client) => {
>   await client.query("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
>   await client.query("UPDATE accounts SET balance = balance + 100 WHERE id = 2");
> };
>
> executeTransaction(mockClient, happyTx).then(res => {
>   console.assert(res.success === true, "Test 1 Failed");
>   console.assert(queries[0] === "BEGIN", "Test 2 Failed: Issued BEGIN first");
>   console.assert(queries[queries.length - 1] === "COMMIT", "Test 3 Failed: Issued COMMIT last");
> });
> ```
>
> #### Technical Explanation
>
> 1. **ACID Guarantees**: Atomicity (all or nothing), Consistency (valid schema rules), Isolation (concurrency control), Durability (persisted on disk).
> 2. **`BEGIN` and `COMMIT` Statements**: `BEGIN` starts transaction block; `COMMIT` persists all modifications atomically.
> 3. **`ROLLBACK` on Failure**: If any SQL statement throws an error inside the transaction block, `ROLLBACK` reverts all previous mutations.
> 
---

### Exercise 2: E-Commerce Order Placement with Rollback Guard

**Scenario:** Processes an order by deducting inventory stock and inserting an order record; rolls back if stock is insufficient.

**Requirements:**
1. Write processOrderTransaction(clientMock, orderData).
2. Check stock level.
3. If stock insufficient, throw Error to trigger rollback.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function processOrderTransaction(clientMock, orderData) {
>   return executeTransaction(clientMock, async (client) => {
>     const stockRes = await client.query(
>       "UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock",
>       [orderData.quantity, orderData.productId]
>     );
>
>     if (!stockRes.rows || stockRes.rows.length === 0) {
>       throw new Error("INSUFFICIENT_STOCK");
>     }
>
>     const orderRes = await client.query(
>       "INSERT INTO orders(product_id, quantity, user_id) VALUES($1, $2, $3) RETURNING id",
>       [orderData.productId, orderData.quantity, orderData.userId]
>     );
>
>     return { orderId: orderRes.rows[0].id, remainingStock: stockRes.rows[0].stock };
>   });
> }
>
> // Verification tests
> const mockClientFail = {
>   queries: [],
>   query: async (sql, params) => {
>     mockClientFail.queries.push(sql);
>     if (sql.includes("UPDATE products")) return { rows: [] };
>     return { rows: [{ id: 99 }] };
>   }
> };
>
> processOrderTransaction(mockClientFail, { productId: 10, quantity: 5, userId: 1 }).then(res => {
>   console.assert(res.success === false, "Test 1 Failed: Transaction failed on out of stock");
>   console.assert(mockClientFail.queries.includes("ROLLBACK"), "Test 2 Failed: Issued ROLLBACK");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Atomicity in Business Logic**: Guarantees payment, inventory deduction, and order placement succeed together or revert completely.
> 2. **Atomic UPDATE Guards**: `UPDATE ... WHERE stock >= quantity` prevents race condition negative stock quantities without manual locks.
> 3. **Single Connection Rule**: All statements within a transaction MUST execute on the EXACT SAME database connection client.
> 
---

### Exercise 3: Nested Savepoint Transaction Manager

**Scenario:** Implements transaction savepoints (`SAVEPOINT my_savepoint`, `ROLLBACK TO SAVEPOINT`) for nested transaction steps.

**Requirements:**
1. Write executeSavepointStep(clientMock, savepointName, stepFn).
2. Issue SAVEPOINT.
3. Rollback to savepoint if stepFn fails.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeSavepointStep(clientMock, savepointName = "sp_1", stepFn) {
>   try {
>     await clientMock.query(`SAVEPOINT ${savepointName}`);
>     const result = await stepFn(clientMock);
>     await clientMock.query(`RELEASE SAVEPOINT ${savepointName}`);
>     return { stepSuccess: true, result };
>   } catch (err) {
>     await clientMock.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
>     return { stepSuccess: false, error: err.message };
>   }
> }
>
> // Verification tests
> const queries = [];
> const mockClient = { query: async (sql) => { queries.push(sql); } };
>
> executeSavepointStep(mockClient, "sp_audit", async () => { throw new Error("Audit log failed"); }).then(res => {
>   console.assert(res.stepSuccess === false, "Test 1 Failed");
>   console.assert(queries.includes("ROLLBACK TO SAVEPOINT sp_audit"), "Test 2 Failed: Rolled back to savepoint");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Database Savepoints**: Allows creating nested checkpoints inside a transaction to roll back partial steps without aborting the entire transaction.
> 2. **RELEASE SAVEPOINT**: Frees resources used by named savepoint while keeping modifications made inside it.
> 3. **Use Case**: Useful for optional side-effect steps like inserting audit logs or sending notifications inside complex transactions.
## 6. Related Terms
- [Connection Pooling](connection_pools.md) — The network channels used to manage transaction streams.
- [Migrations](migrations.md) — Schema updates executed within transactions to prevent partial updates.

---

## 7. Key Takeaways
- Database transactions group multiple queries into a single atomic unit of work.
- Transactions adhere to ACID: Atomicity, Consistency, Isolation, and Durability.
- **Atomicity** ensures all queries succeed (Commit) or all changes are undone (Rollback).
- Row and table locks are held active during a transaction to enforce isolation.
- Never execute external network calls or slow CPU tasks inside a transaction block.
- Keep transaction query spans as short as possible to prevent connection pool exhaustion.
