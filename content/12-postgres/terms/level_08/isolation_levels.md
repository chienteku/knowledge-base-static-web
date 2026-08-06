# Transaction Isolation Levels

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The database connection settings that control how isolated a transaction is from data modifications made by other concurrent transactions, balancing integrity against read speed.

---

## 1. Prerequisites
- [Concurrency Anomalies (Dirty, Non-Repeatable, Phantom Reads)](concurrency_anomalies.md) — The read errors blocked by isolation levels.

---

## 2. Term Category

**Core Concept** (Transaction Isolation Specifications): Isolation Levels (`Read Committed`, `Repeatable Read`, `Serializable`) control how concurrent transactions view and isolate uncommitted data modifications.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Can be set globally, per database session, or for a single transaction block. Serializable isolation relies on SSI (Serializable Snapshot Isolation) locks inside the database engine).

### (1) Design Motivation — "Why did we design this?"
In relational database systems, there is a fundamental conflict between **performance** and **correctness**:
-   **Perfect Isolation:** If you want zero data inconsistencies, you should lock the entire database and execute transactions one-by-one. This is perfectly safe, but halts your server speed.
-   **No Isolation:** If you run queries without isolation, database throughput is fast, but calculations corrupt each other (concurrency anomalies).

We designed **Transaction Isolation Levels** to give developers a dial to tune this performance-integrity balance.

---

### (2) The Four Levels (SQL Standard vs. PostgreSQL)

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
| :--- | :--- | :--- | :--- |
| **Read Uncommitted** | Standard SQL: Allowed <br> **Postgres: Prevented** | Allowed | Allowed |
| **Read Committed** *(Default)* | Prevented | Allowed | Allowed |
| **Repeatable Read** | Prevented | Prevented | Standard SQL: Allowed <br> **Postgres: Prevented** |
| **Serializable** | Prevented | Prevented | Prevented |

---

### (3) Detailed Level Breakdown

#### 1. Read Committed (PostgreSQL Default)
A query inside a transaction only sees data committed *before the query started* (not before the transaction started). 
-   If you run Query 1, and another user commits a change, Query 2 inside your same transaction block **will** see those new values. (Allows non-repeatable/phantom reads).

#### 2. Repeatable Read
A query inside a transaction only sees data committed *before the transaction started*. 
-   No matter how many times you run a query inside the transaction block, the values are frozen.
-   *Postgres Benefit:* Unlike other databases, PostgreSQL's `REPEATABLE READ` also **prevents Phantom Reads** natively.

#### 3. Serializable
The absolute strictest isolation. 
-   The database runs algorithms to ensure the concurrent transaction results are identical to running them sequentially (one after another).
-   If Postgres detects a concurrent write overlap that could cause a serialization conflict, it aborts the query and throws a **`40001` Serialization Failure** error.
-   *Strictest Rule:* **Serializable transactions will fail on purpose under load.** Your application backend must capture these failures and retry the transaction.

---

### (4) Reality Metaphor (Office Notice Board)
-   **Read Committed:** Every time you look up from your desk and read the notice board (each query), you see the latest notes. If a coworker pins a new note, you see it instantly.
-   **Repeatable Read:** When you start your workday (transaction), you take a polaroid photo of the notice board. For the rest of the day, you look only at your photo.
-   **Serializable:** You lock the office door. No coworker can edit the board until you finish your work. If they try, a buzzer rings, and they are forced to wait and rewrite their note later.

---

### (5) Code Examples

#### Setting Isolation Level for a Single Transaction
```sql
BEGIN;
-- Set isolation level before executing DML queries
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

SELECT balance FROM accounts WHERE name = 'Alice'; -- balance is frozen now
-- Even if another connection updates Alice, subsequent queries here see the same balance

COMMIT;
```

#### Setting Session Defaults (e.g. in config files)
```sql
SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Setting isolation to SERIALIZABLE without writing transaction retry logic in your backend application code

**The mistake:** Thinking "I want the safest database, so I'll set all connections to SERIALIZABLE" and expecting it to work like other levels.

**Why it's wrong:** Under heavy traffic, concurrent writes to the same tables will conflict. 

Postgres will abort those transactions and throw error code `40001`. 

If your backend code (e.g. Node.js or Python) does not catch this specific error and **retry** the database call, your users will see random crash screens.

**Fix: Default to `READ COMMITTED` (which is highly concurrent and handles 95% of use cases). Only use `SERIALIZABLE` for critical financial sections, and always wrap those calls in retry loops.**

---



### Mistake 2: Assuming PostgreSQL Supports `READ UNCOMMITTED` Dirty Reads

**The mistake:** Setting `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;` expecting dirty reads.

**Why it's wrong:** In PostgreSQL, `READ UNCOMMITTED` is treated as `READ COMMITTED`! PostgreSQL's MVCC architecture NEVER permits Dirty Reads under any isolation level.

*Incorrect:*
```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; -- Treated as READ COMMITTED in Postgres
```

*Fix:*
```sql
PostgreSQL never permits dirty reads; READ COMMITTED is default
```

### Mistake 3: Failing to Implement Retry Loops for `SERIALIZABLE` Isolation Level Transactions

**The mistake:** Using `SERIALIZABLE` isolation level without wrapping database calls in application retry loops.

**Why it's wrong:** When PostgreSQL detects a serialization failure under `SERIALIZABLE`, it aborts the transaction with error `40001 (serialization_failure)`. Applications MUST catch 40001 and retry.

*Incorrect:*
```sql
// Running SERIALIZABLE transaction without retry loop
```

*Fix:*
```sql
Wrap SERIALIZABLE transactions in retry loops catching error code 40001
```

## 5. Practice Exercises

### Exercise 1: Setting Transaction Isolation Levels

**Scenario:**
Set transaction isolation level to `REPEATABLE READ` for a multi-statement financial report query.

**Requirements:**
1. Execute `BEGIN; SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> BEGIN;
> SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
> 
> SELECT SUM(balance_cents) AS total_assets FROM accounts;
> SELECT COUNT(*) AS account_count FROM accounts;
> 
> COMMIT;
> ```
>
> #### Technical Explanation
>
> 1. `REPEATABLE READ` freezes the transaction snapshot at the first query statement inside `BEGIN`.
> 2. Subsequent queries in the same transaction read from the exact same snapshot, ignoring modifications committed by concurrent transactions.
> 3. Guarantees repeatable reads across all reporting queries.

---

### Exercise 2: Handling Serialization Failures (Error 40001)

**Scenario:**
Catch PostgreSQL Error Code `40001` (`serialization_failure`) in Node.js retry loops when using `REPEATABLE READ` or `SERIALIZABLE`.

**Requirements:**
1. Code Node.js transaction retry wrapper for Error `40001`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> export async function executeSerializableTx<T>(fn: (client: any) => Promise<T>): Promise<T> {
>   let retries = 5;
>   while (retries > 0) {
>     const client = await pool.connect();
>     try {
>       await client.query("BEGIN; SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;");
>       const result = await fn(client);
>       await client.query("COMMIT");
>       return result;
>     } catch (err: any) {
>       await client.query("ROLLBACK");
>       if (err.code === "40001" && retries > 1) {
>         retries--;
>         await new Promise(r => setTimeout(r, 100 * (5 - retries))); // Exponential backoff
>         continue;
>       }
>       throw err;
>     } finally {
>       client.release();
>     }
>   }
>   throw new Error("Transaction retries exhausted!");
> }
> ```
>
> #### Technical Explanation
>
> 1. High isolation levels (`Repeatable Read`, `Serializable`) abort concurrent conflicting transactions with Error `40001`.
> 2. Applications using these isolation levels MUST implement automatic retry loops.
> 3. Guarantees transactional correctness under heavy concurrency.

---

### Exercise 3: Comparing Isolation Level Trade-Offs

**Scenario:**
Formulate a technical selection matrix comparing `Read Committed`, `Repeatable Read`, and `Serializable`.

**Requirements:**
1. Contrast consistency guarantees vs transaction retry requirements.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Isolation Level Selection Matrix:
> - Read Committed (Default): High throughput, zero retries, subject to non-repeatable reads. Ideal for 95% of OLTP APIs!
> - Repeatable Read: Freeze snapshot, prevents phantom reads, requires retry logic for Error 40001 on concurrent updates.
> - Serializable: 100% strict sequential execution guarantees, highest retry frequency under update contention.
> ```
>
> #### Technical Explanation
>
> 1. Higher isolation levels trade concurrency throughput for strict snapshot consistency.
> 2. Default `Read Committed` minimizes transaction aborts.
> 3. Select isolation levels based on transactional domain requirements.

---



## 6. Related Terms
- [Concurrency Anomalies (Dirty, Non-Repeatable, Phantom Reads)](concurrency_anomalies.md) — The target consistency errors.
- [Locking (Row-level, Table-level)](locking.md) — The physical blocking mechanisms.
- [MVCC (Multi-Version Concurrency Control)](mvcc.md) — Related concept: MVCC (Multi-Version Concurrency Control).

---

## 7. Key Takeaways
- Isolation levels control transaction visibility and protect against anomalies.
- `READ COMMITTED` is the PostgreSQL default (each query sees a fresh committed snapshot).
- `REPEATABLE READ` freezes the snapshot at the transaction's beginning.
- `REPEATABLE READ` in PostgreSQL prevents both Non-Repeatable and Phantom Reads.
- `SERIALIZABLE` enforces sequential execution equivalence but triggers aborts under load.
- Serializable transactions require backend retry code loops to capture error `40001`.
- Keep isolation levels low (`READ COMMITTED`) to optimize overall query throughput.
