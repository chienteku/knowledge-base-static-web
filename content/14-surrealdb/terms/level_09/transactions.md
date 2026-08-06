# Transactions (`BEGIN` / `COMMIT` / `CANCEL`)

> **Level 9 — Real-Time Features, Events & Functions**
> The SurrealQL statements used to group multiple database write operations into an atomic unit that either succeeds completely (`COMMIT`) or rolls back completely (`CANCEL`).

---

## 1. Prerequisites

- [`CREATE`](../level_03/create.md) — Record creation syntax.
- [`UPDATE`](../level_03/update.md) — Record modification syntax.

---

## 2. Term Category


**SurrealQL Command (BEGIN and COMMIT transaction block control)**: - **Transactions & Concurrency**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In multi-step business operations (e.g. transferring money from Account A to Account B, or checking out an e-commerce shopping cart), multiple records across multiple tables must be modified together. If the system crashes midway after deducting money from Account A but before crediting Account B, the data becomes corrupt.

SurrealDB provides **ACID-compliant transactions** via `BEGIN TRANSACTION`, `COMMIT TRANSACTION`, and `CANCEL TRANSACTION`:
- `BEGIN TRANSACTION;` (or `BEGIN;`): Starts an isolated transaction block.
- `COMMIT TRANSACTION;` (or `COMMIT;`): Applies all changes in the block atomically to the database disk.
- `CANCEL TRANSACTION;` (or `CANCEL;`): Aborts the block and rolls back all modified records to their pre-transaction state.

### (2) Reality Metaphor
Think of an escrow service in real estate:
- The buyer deposits funds into escrow, and the seller signs over the deed into escrow (`BEGIN`).
- If both conditions are satisfied, the escrow officer releases money to the seller and deed to the buyer simultaneously (`COMMIT`).
- If either party fails a check, escrow refunds the money to the buyer and returns the deed to the seller as if nothing happened (`CANCEL`).

### (3) Code Examples

#### Short Snippet
```surrealql
-- Atomic money transfer between two account records
BEGIN TRANSACTION;
    UPDATE account:alice SET balance -= 100.00;
    UPDATE account:bob SET balance += 100.00;
COMMIT TRANSACTION;
```

#### Fuller Example
```surrealql
-- Transaction block with conditional validation and rollback
BEGIN TRANSACTION;

    LET $sender = (SELECT * FROM account:alice)[0];

    IF $sender.balance < 500.00 {
        -- Abort transaction if sender has insufficient funds
        CANCEL TRANSACTION;
    } ELSE {
        UPDATE account:alice SET balance -= 500.00;
        UPDATE account:bob SET balance += 500.00;
        CREATE transfer_log SET from = account:alice, to = account:bob, amount = 500.00;
        COMMIT TRANSACTION;
    };
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Leaving Uncommitted Transactions Open in Interactive Sessions

**The mistake:** Executing `BEGIN TRANSACTION;` and sending write operations, but forgetting to send `COMMIT TRANSACTION;` or `CANCEL TRANSACTION;`.

**Why it's wrong:** Open transactions hold locks and isolated snapshots. Leaving transactions open indefinitely can cause memory consumption or transaction timeout errors.

*Incorrect:*
```surrealql
BEGIN TRANSACTION;
UPDATE user:tobie SET active = false;
-- (Forgetting COMMIT TRANSACTION; - changes remain uncommitted!)
```

*Fix:*
```surrealql
BEGIN TRANSACTION;
UPDATE user:tobie SET active = false;
COMMIT TRANSACTION; -- Always commit or cancel!
```

---



### Mistake 2: Forgetting `COMMIT TRANSACTION` or `CANCEL TRANSACTION` at the End of Transaction Blocks

**The mistake:** Writing `BEGIN TRANSACTION; UPDATE user:1 ...;` without `COMMIT TRANSACTION;`.

**Why it's wrong:** Un-committed transaction blocks roll back automatically or leave pending state un-persisted.

*Incorrect:*
```surrealql
BEGIN TRANSACTION;
UPDATE user:1 SET balance += 100; // ❌ Un-committed transaction!
```

*Fix:*
```surrealql
BEGIN TRANSACTION;
UPDATE user:1 SET balance += 100;
COMMIT TRANSACTION; // Persists mutations atomically
```

### Mistake 3: Nesting `BEGIN TRANSACTION` Blocks inside Active Transactions

**The mistake:** Writing nested `BEGIN TRANSACTION;` inside an already open transaction block.

**Why it's wrong:** SurrealDB does not support nested `BEGIN TRANSACTION` blocks within a single connection session.

*Incorrect:*
```surrealql
BEGIN TRANSACTION;
  BEGIN TRANSACTION; // ❌ Nested transaction error!
COMMIT TRANSACTION;
```

*Fix:*
```surrealql
BEGIN TRANSACTION;
  UPDATE user:1 SET a = 1;
  UPDATE account:1 SET b = 2;
COMMIT TRANSACTION;
```





## 5. Practice Exercises

### Exercise 1: Multi-Statement Atomic Bank Transfer

**Scenario:**
Perform an atomic fund transfer of `$50.00dec` from `account:alice` to `account:bob` inside a transaction block.

**Requirements:**
1. Begin transaction using `BEGIN TRANSACTION;`.
2. Deduct `$50.00dec` from `account:alice`.
3. Add `$50.00dec` to `account:bob`.
4. Commit using `COMMIT TRANSACTION;`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> BEGIN TRANSACTION;
> 
> UPDATE account:alice SET balance -= 50.00dec;
> UPDATE account:bob SET balance += 50.00dec;
> 
> COMMIT TRANSACTION;
> ```
>
> #### Technical Explanation
>
> 1. Encloses multiple DML statements in an atomic transaction block.
> 2. `COMMIT TRANSACTION` writes all changes to persistent storage atomically.
> 3. Protects multi-account transfers against system crashes.

---

### Exercise 2: Explicit Transaction Cancellation with `CANCEL TRANSACTION`

**Scenario:**
Cancel a transaction block explicitly using `CANCEL TRANSACTION` when a validation check fails.

**Requirements:**
1. Begin transaction, perform an update, and execute `CANCEL TRANSACTION;`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> BEGIN TRANSACTION;
> 
> UPDATE product:p1 SET stock -= 10;
> CANCEL TRANSACTION;
> ```
>
> #### Technical Explanation
>
> 1. `CANCEL TRANSACTION` (or `ABORT TRANSACTION`) discards all uncommitted mutations in the active block.
> 2. Restores database state to pre-transaction values.
> 3. Allows programmatic transaction aborts.

---

### Exercise 3: Nesting DDL and DML in Single Transactions

**Scenario:**
Demonstrate defining a table schema and creating initial records inside a single transaction block.

**Requirements:**
1. Begin transaction.
2. Define table `category` as `SCHEMAFULL`.
3. Create category records.
4. Commit transaction.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> BEGIN TRANSACTION;
> 
> DEFINE TABLE category SCHEMAFULL;
> DEFINE FIELD name ON TABLE category TYPE string;
> 
> CREATE category:c1 SET name = "Electronics";
> CREATE category:c2 SET name = "Books";
> 
> COMMIT TRANSACTION;
> ```
>
> #### Technical Explanation
>
> 1. SurrealDB permits mixing DDL statements (`DEFINE TABLE`, `DEFINE FIELD`) and DML statements (`CREATE`) inside single transaction blocks.
> 2. Applies schema definitions and initial records atomically.
> 3. Essential for transactional database migration scripts.

---





## 6. Related Terms

- [Transaction Isolation & Atomicity Semantics](transaction_isolation.md) — Snapshot isolation & concurrency.
- [`THROW` Expression](../level_06/throw_expression.md) — Raising errors in transactions.
- [`IF` / `ELSE` Expressions](../level_06/if_else.md) — Conditional logic inside transactions.
- [`SLEEP` Statement](../level_10/sleep.md) — Related concept: `SLEEP` Statement.

---

## 7. Key Takeaways
- Transactions group multiple operations into an atomic unit (`BEGIN` ... `COMMIT`).
- `CANCEL TRANSACTION` rolls back all changes made within the transaction block.
- Ensures ACID compliance across multi-table writes.
