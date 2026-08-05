# `BEGIN` / `COMMIT` / `ROLLBACK`

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The SQL command statements used to start a transaction block (`BEGIN`), permanently save its changes to disk (`COMMIT`), or undo all its operations (`ROLLBACK`).

---

## 1. Prerequisites
- [Transaction](transaction.md) — The logical unit of work wrapper.
---

## 2. Term Category
- **SQL DML Statement / Control**

---

## 3. Environment Context
- **PostgreSQL Core** (By default, PostgreSQL operates in **Autocommit Mode**, automatically wrapping every single individual SQL query inside an implicit transaction. You must explicitly run `BEGIN` to start a multi-step transaction block).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in `transaction.md`, transactions require a way to be controlled programmatically. 

We need keywords that tell the database parser:
1.  *"Open the transaction bubble now."*
2.  *"All queries are good, commit them to disk."*
3.  *"An error occurred, wipe out all temporary changes."*

SQL defines **`BEGIN`**, **`COMMIT`**, and **`ROLLBACK`** to serve as these control valves.

---

### (2) The Autocommit Default
If you write a simple update query:
`UPDATE users SET active = TRUE WHERE id = 5;`

Without any wrappers, PostgreSQL runs in **Autocommit** mode. 

It starts a mini-transaction, runs the update, and commits it automatically. 

You only need to write transaction commands if you are grouping **multiple queries** that must succeed or fail together.

---

### (3) Reality Metaphor (Version Control / Git)
Imagine managing software code:
-   **`BEGIN`** is like running `git checkout -b temp-branch`. You create a separate sandbox branch to make edits (queries) without affecting the main production code.
-   **`ROLLBACK`** is like running `git restore .` (or deleting the branch). You discard all your draft edits, leaving the code exactly as it was.
-   **`COMMIT`** is like running `git merge main` and pushing to GitHub. You merge your edits permanently into the main branch.

---

### (4) Code Examples

#### 1. The Success Path (COMMIT)
```sql
CREATE TABLE accounts (name VARCHAR(50), balance NUMERIC(10,2));
INSERT INTO accounts VALUES ('Alice', 500.00), ('Bob', 200.00);

-- Start transaction
BEGIN;

UPDATE accounts SET balance = balance - 100.00 WHERE name = 'Alice';
UPDATE accounts SET balance = balance + 100.00 WHERE name = 'Bob';

-- Save permanently
COMMIT;

-- Both balances are updated!
```

#### 2. The Abort Path (ROLLBACK)
```sql
-- Start transaction
BEGIN;

UPDATE accounts SET balance = balance - 100.00 WHERE name = 'Alice';

-- We realize we made an error (or a query crashed)
ROLLBACK;

-- Alice's balance remains 500.00! The subtraction is undone.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving a transaction block open ("Idle in Transaction")

**The mistake:** Executing `BEGIN;` and running updates, but forgetting to send a `COMMIT` or `ROLLBACK` command at the end of your application script.

**Why it's wrong:** The database connection is marked in the system catalogs as **"Idle in Transaction."** 

Postgres keeps the database session active and maintains all row locks. 

As other users log in, their queries queue up waiting for the locks to release. 

Eventually, the database reaches its max connection limit (`max_connections`) and crashes, locking out all users.

**Fix: Always ensure your application code contains `try/catch` blocks that guarantee a `COMMIT` on success and a `ROLLBACK` on failure.**

```javascript
// Node.js safe transaction template
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts ...');
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK'); // Guarantees cleanup!
  throw e;
} finally {
  client.release(); // Releases connection slot
}
```

---



### Mistake 2: Ignoring Statements Errors inside Transaction Blocks (In-Failed-Transaction State Trap)

**The mistake:** Continuing to execute SQL queries after a syntax or constraint error inside `BEGIN...COMMIT` block.

**Why it's wrong:** Once an error occurs inside a PostgreSQL transaction block, ALL subsequent queries fail with error `current transaction is aborted, commands ignored until end of transaction block`. Issue `ROLLBACK`.

*Incorrect:*
```sql
BEGIN;
SELECT * FROM non_existent_table; -- ❌ Error!
SELECT * FROM users; -- ❌ Error: current transaction is aborted!
COMMIT;
```

*Fix:*
```sql
Catch errors in client code and issue ROLLBACK immediately
```

### Mistake 3: Forgetting `COMMIT` Leaving Long-Lived Transactions Open (Idle in Transaction)

**The mistake:** Opening a transaction with `BEGIN` in client code and omitting `COMMIT` or `ROLLBACK`.

**Why it's wrong:** Open transactions hold table locks and prevent `VACUUM` from cleaning dead tuples, causing `Idle in Transaction` server resource leaks. Set `idle_in_transaction_session_timeout`.

*Incorrect:*
```sql
// Opening BEGIN transaction without issuing COMMIT or ROLLBACK in catch block
```

*Fix:*
```sql
Always execute client pool transactions inside try...finally { client.query('COMMIT / ROLLBACK') }
```

## 6. Practice Exercises

### Exercise 1: State Inspection

**Problem:** You execute the following SQL script:
```sql
INSERT INTO accounts VALUES ('Charlie', 10.00);
BEGIN;
INSERT INTO accounts VALUES ('Diana', 20.00);
ROLLBACK;
INSERT INTO accounts VALUES ('Evan', 30.00);
```
Query the `accounts` table. Which names will exist in the database?

**Expected output:**
> [!check]- Answer
> ```text
> 'Charlie' and 'Evan' will exist in the database!
> - 'Charlie' is inserted outside the transaction (autocommitted).
> - 'Diana' is inserted inside the transaction block, but the ROLLBACK command undoes the insert.
> - 'Evan' is inserted after the transaction block has closed (autocommitted).
> ```
> - Identify the transaction boundary wrapper brackets (`BEGIN` and `ROLLBACK`).
> - Focus on which statements are bypassed during rollbacks.

---



### Exercise 2: Node.js Transaction Control Pattern

**Problem:** Write Node.js try-catch-finally block managing PostgreSQL transaction lifecycle cleanly.

**Expected output:**
> [!check]- Answer
> ```text
> const client = await pool.connect(); try { await client.query('BEGIN'); /* queries */ await client.query('COMMIT'); } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
> ```
> ```javascript
> const client = await pool.connect();
> try {
>   await client.query('BEGIN');
>   // ... queries ...
>   await client.query('COMMIT');
> } catch (e) {
>   await client.query('ROLLBACK');
>   throw e;
> } finally {
>   client.release();
> }
> ```
>
> **Explanation:** Standard transaction lifecycle control guarantees `ROLLBACK` on errors and socket release in `finally`.

---

### Exercise 3: Transaction Rollback Verification

**Problem:** If a transaction executes `INSERT` followed by `ROLLBACK`, do inserted rows remain in the database? (No, all mutations are undone).

**Expected output:**
> [!check]- Answer
> ```text
> No, ROLLBACK reverts all transaction data mutations completely
> ```
> ```text
> No, ROLLBACK reverts all transaction data mutations completely
> ```
>
> **Explanation:** `ROLLBACK` restores database state to the transaction start point.

## 7. Related Terms
- [Transaction](transaction.md) — - The parent unit of work.
- [`SAVEPOINT` / `ROLLBACK TO`](savepoint.md) — Partial rollbacks.
---

## 8. Key Takeaways
- `BEGIN` opens a temporary transaction sandbox bubble.
- `COMMIT` saves all transaction modifications permanently to the hard drive.
- `ROLLBACK` discards all modifications, returning data to the pre-transaction state.
- Postgres operates in Autocommit mode by default for single queries.
- Forgetting to close transactions leaves connections "Idle in Transaction," causing crashes.
- Always wrap application query scripts in try-catch-rollback structures to protect locks.
