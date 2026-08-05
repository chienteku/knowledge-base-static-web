# Transaction Isolation Levels

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The database connection settings that control how isolated a transaction is from data modifications made by other concurrent transactions, balancing integrity against read speed.

---

## 1. Prerequisites
- [Concurrency Anomalies (Dirty, Non-Repeatable, Phantom Reads)](concurrency_anomalies.md) — The read errors blocked by isolation levels.

---

## 2. Term Category
- **PostgreSQL Performance Concept / Configuration**

---

## 3. Environment Context
- **PostgreSQL Core** (Can be set globally, per database session, or for a single transaction block. Serializable isolation relies on SSI (Serializable Snapshot Isolation) locks inside the database engine).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Isolation Level Matching

**Problem:** You are building an inventory stock count query. The script queries stock counts, waits 5 seconds, and queries them again to verify. You want to guarantee that other users' committed database edits during those 5 seconds do **not** change the numbers you see. 
What is the lowest PostgreSQL isolation level that guarantees this?

**Expected output:**
> [!check]- Answer
> ```text
> REPEATABLE READ!
> Under REPEATABLE READ, the database snapshot is frozen at the start of the transaction block, preventing any subsequent updates committed by other concurrent transactions from appearing.
> ```
> - Read the Anomaly Matrix to see which levels block Non-Repeatable Reads.
> - Recall that PostgreSQL's default is Read Committed, which allows values to change mid-transaction.

---



### Exercise 2: Setting Transaction Isolation Level

**Problem:** Set isolation level to `SERIALIZABLE` for active transaction.

**Expected output:**
> [!check]- Answer
> ```text
> BEGIN ISOLATION LEVEL SERIALIZABLE;
> ```
> ```sql
> BEGIN ISOLATION LEVEL SERIALIZABLE;
> ```
>
> **Explanation:** `BEGIN ISOLATION LEVEL` configures transaction isolation semantics.

---

### Exercise 3: Default Isolation Level in PostgreSQL

**Problem:** What is the default isolation level in PostgreSQL? (`READ COMMITTED`).

**Expected output:**
> [!check]- Answer
> ```text
> READ COMMITTED
> ```
> ```text
> READ COMMITTED
> ```
>
> **Explanation:** `READ COMMITTED` is the standard default isolation level in PostgreSQL.

## 7. Related Terms
- [Concurrency Anomalies (Dirty, Non-Repeatable, Phantom Reads)](concurrency_anomalies.md) — The target consistency errors.
- [Locking (Row-level, Table-level)](locking.md) — The physical blocking mechanisms.
- [MVCC (Multi-Version Concurrency Control)](mvcc.md) — Related concept: MVCC (Multi-Version Concurrency Control).

---

## 8. Key Takeaways
- Isolation levels control transaction visibility and protect against anomalies.
- `READ COMMITTED` is the PostgreSQL default (each query sees a fresh committed snapshot).
- `REPEATABLE READ` freezes the snapshot at the transaction's beginning.
- `REPEATABLE READ` in PostgreSQL prevents both Non-Repeatable and Phantom Reads.
- `SERIALIZABLE` enforces sequential execution equivalence but triggers aborts under load.
- Serializable transactions require backend retry code loops to capture error `40001`.
- Keep isolation levels low (`READ COMMITTED`) to optimize overall query throughput.
