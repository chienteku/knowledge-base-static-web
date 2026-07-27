# Transaction

> **Level 8 — Transactions, Concurrency & Data Integrity**
> A sequence of one or more SQL operations treated as a single, indivisible unit of work that either succeeds completely (commits) or fails completely (rolls back), guaranteeing database safety.

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The language statements grouped in transactions.

---

## 2. Term Category
- **Core Database Concept**

---

## 3. Environment Context
- **Universal Standard** (Supported in all relational databases. Managed by the transaction manager block using Write-Ahead Logging (WAL) files to support rollbacks).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In real-world applications, business operations require running multiple SQL queries in sequence. 

Consider a bank transfer where Alice transfers `$100` to Bob:
1.  **Query 1:** Subtract `$100` from Alice's account balance.
2.  **Query 2:** Add `$100` to Bob's account balance.

What happens if the database server experiences a power failure or a network crash *after* executing Query 1, but *before* executing Query 2?
-   Alice's money is gone, but Bob never receives it. The money has vanished, corrupting your business ledger.

We designed **Transactions** to solve this consistency problem. 

A transaction acts as a protective bubble around your queries. It guarantees that the sequence of queries behaves as a single, indivisible block (All-or-Nothing):
-   **If all queries succeed:** The database **Commits** the changes, saving them permanently to the hard drive.
-   **If any query fails** (or the server crashes mid-way): The database **Rolls back** the transaction. It undoes every single change made by the preceding queries, returning the database to the exact state it was in before the transaction began.

---

### (2) Read-Write Safety
While a transaction is active, its changes are "temporary" and invisible to other users. 

This prevents other users from reading partially complete, invalid data (like seeing Alice's balance drop before Bob's balance has increased).

---

### (3) Reality Metaphor
Imagine mailing a birthday present at the post office:
-   You hand the clerk the gift box. (Step 1).
-   You hand the clerk the shipping fee cash. (Step 2).
-   **Rollback:** If you realize you forgot to write the destination address, or you don't have enough cash, you call off the shipment. The clerk hands you back both the gift box and your money. You exit as if nothing happened.
-   **Commit:** If everything is correct, the clerk stamps the box and slides it down the mail chute. The transfer is locked in; you cannot get your money back.

---

### (4) Code Examples

#### The Bank Transfer Transaction Blueprint
Transactions are written using wrapper keywords:

```sql
BEGIN; -- Start the transaction bubble

-- Step 1: Debit Alice
UPDATE accounts SET balance = balance - 100.00 WHERE name = 'Alice';

-- Step 2: Credit Bob
UPDATE accounts SET balance = balance + 100.00 WHERE name = 'Bob';

COMMIT; -- Save both writes permanently to disk
```

*(Note: How to use these commands, and how to trigger rollbacks, is covered in detail in the next term: [BEGIN / COMMIT / ROLLBACK](begin_commit_rollback.md)).*

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Bundling unrelated, long-running processes inside a single transaction block

**The mistake:** Wrapping a database write, a heavy image processing script, and a third-party email API call inside a single SQL transaction block.

**Why it's wrong:** While the transaction is waiting for the slow email API to respond, the database keeps lock holds active on the table rows. 

No other user can update or read those rows, causing your website to freeze. 

If the email API fails, the database rolls back, which is good, but the slow locks degrade database throughput.

**Fix: Only include critical database queries inside transaction blocks. Perform heavy file processing or API network calls outside transaction blocks.**

---



### Mistake 2: Executing External HTTP Network Calls inside Active Database Transaction Blocks

**The mistake:** Calling third-party Stripe API inside an open `BEGIN...COMMIT` database transaction.

**Why it's wrong:** If Stripe API takes 5 seconds to respond, the database transaction remains open for 5 seconds holding table locks, causing connection pool exhaustion! Perform network calls BEFORE opening transactions.

*Incorrect:*
```sql
BEGIN;
UPDATE orders SET status = 'processing' WHERE id = 1;
await callStripeAPI(); -- ❌ Holds DB lock for 5 seconds network latency!
COMMIT;
```

*Fix:*
```sql
await callStripeAPI();
BEGIN;
UPDATE orders SET status = 'paid' WHERE id = 1;
COMMIT;
```

### Mistake 3: Nesting `BEGIN` Statements inside Active Transactions

**The mistake:** Issuing `BEGIN;` when a transaction is already active.

**Why it's wrong:** PostgreSQL does NOT support nested `BEGIN` statements! Issuing `BEGIN` inside an active transaction raises warning `WARNING: there is already a transaction in progress`. Use `SAVEPOINT` for nested sub-transactions.

*Incorrect:*
```sql
BEGIN; BEGIN; -- ❌ Nested BEGIN unsupported!
```

*Fix:*
```sql
BEGIN; SAVEPOINT sp1; -- Use SAVEPOINT for sub-transactions
```

## 6. Practice Exercises

### Exercise 1: Boundary Assessment

**Problem:** You run a transaction containing three queries:
-   Query 1: Inserts a new user. (Succeeds)
-   Query 2: Updates a setting. (Succeeds)
-   Query 3: Tries to write a duplicate value to a unique column. (Crashes)

Describe the state of the database after Query 3 fails, assuming no savepoints are used.

**Expected output:**
```text
The database will roll back the entire transaction! 
Even though Queries 1 and 2 completed successfully, the failure of Query 3 aborts the transaction. 
The new user insert and the setting update are completely undone, leaving the database exactly as it was before the `BEGIN` command was run.
```

> [!check]- Answer
> - Transactions enforce an "all-or-nothing" rule.
> - Consider whether partial commits are allowed in standard transactions.

---



### Exercise 2: Transaction Control Flow Best Practice

**Problem:** State golden rule regarding network calls and transactions (Perform external HTTP network calls OUTSIDE active database transaction blocks).

**Expected output:**
```text
Perform external HTTP network calls OUTSIDE active database transaction blocks
```

> [!check]- Answer
> ```text
> Perform external HTTP network calls OUTSIDE active database transaction blocks
> ```
>
> **Explanation:** Keeping transaction duration minimal prevents lock contention and connection pool exhaustion.

### Exercise 3: Transaction Idle Timeout Configuration

**Problem:** Configure `idle_in_transaction_session_timeout` to 5 seconds to automatically terminate abandoned transactions.

**Expected output:**
```text
SET idle_in_transaction_session_timeout = '5s';
```

> [!check]- Answer
> ```sql
> SET idle_in_transaction_session_timeout = '5s';
> ```
>
> **Explanation:** `idle_in_transaction_session_timeout` aborts abandoned transactions holding database connections.

## 7. Related Terms
- [`BEGIN` / `COMMIT` / `ROLLBACK`](begin_commit_rollback.md) — The control statements.
- [ACID Properties](acid.md) -- The transactional guarantees.

---

## 8. Key Takeaways
- A transaction groups multiple SQL operations into a single indivisible block.
- Enforces the "All-or-Nothing" rule to prevent data corruption.
- Committing saves all changes; Rolling back undoes all modifications.
- Uncommitted transaction writes are hidden from other concurrent users.
- Keep transaction blocks short to prevent table rows lock contention.
- Never mix slow external API calls inside database transaction blocks.
