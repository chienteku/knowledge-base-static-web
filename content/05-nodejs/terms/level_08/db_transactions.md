# Database Transactions

> **Level 8 — Database Integration**
> All-or-nothing operations (ACID) — the reliability primitive behind money/orders.

---

## 1. Prerequisites
- [SQL vs NoSQL](sql_vs_nosql.md) — The storage formats supporting transactions.
- [Connection Pooling](connection_pools.md) — The connection channels used to execute transaction queries.
---

## 2. Term Category
- **Database / Computer Science Concept**

---

## 3. Environment Context
- **Database Engine Layer** (Operations managed natively by the database server's transaction logs).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Rollback Verification

**Problem:** You are writing an order creation script. If the product inventory decrement fails, the order entry must not be saved. Write a transaction block using Prisma to handle this:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function placeOrder(userId, productId, price) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create order record
      await tx.order.create({
        data: { userId, productId, amount: price }
      });

      // 2. Decrement inventory
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (product.stock <= 0) {
        throw new Error('Product out of stock'); // Force rollback!
      }

      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: 1 } }
      });
    });
  } catch (err) {
    console.error("Order failed:", err.message);
  }
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Prisma Interactive Transaction Pattern

**Problem:** Write a Prisma interactive transaction `$transaction` transferring funds between two user accounts.

**Expected output:**
> [!check]- Answer
> ```text
> await prisma.$transaction(async (tx) => { await tx.user.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } }); await tx.user.update({ where: { id: 2 }, data: { balance: { increment: 100 } } }); });
> ```
> ```javascript
> await prisma.$transaction(async (tx) => {
>   await tx.user.update({
>     where: { id: senderId },
>     data: { balance: { decrement: amount } }
>   });
>   await tx.user.update({
>     where: { id: receiverId },
>     data: { balance: { increment: amount } }
>   });
> });
> ```
>
> **Explanation:** Prisma `$transaction` handles `BEGIN`, `COMMIT`, and `ROLLBACK` automatically.

---

### Exercise 3: ACID Properties Definition

**Problem:** Name the 4 ACID properties of database transactions.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Atomicity
> 2. Consistency
> 3. Isolation
> 4. Durability
> ```
> ```text
> Atomicity, Consistency, Isolation, Durability
> ```
>
> **Explanation:** ACID properties guarantee reliable execution of database transactions.

## 7. Related Terms
- [Connection Pooling](connection_pools.md) — The network channels used to manage transaction streams.
- [Migrations](migrations.md) — Schema updates executed within transactions to prevent partial updates.
---

## 8. Key Takeaways
- Database transactions group multiple queries into a single atomic unit of work.
- Transactions adhere to ACID: Atomicity, Consistency, Isolation, and Durability.
- **Atomicity** ensures all queries succeed (Commit) or all changes are undone (Rollback).
- Row and table locks are held active during a transaction to enforce isolation.
- Never execute external network calls or slow CPU tasks inside a transaction block.
- Keep transaction query spans as short as possible to prevent connection pool exhaustion.
