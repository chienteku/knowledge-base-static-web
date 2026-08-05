# `SELECT ... FOR UPDATE`

> **Level 8 — Transactions, Concurrency & Data Integrity**
> A locking query modifier used to lock the selected rows during a read operation, preventing other concurrent transactions from modifying, deleting, or locking them until the current transaction completes.

---

## 1. Prerequisites
- [Locking (Row-level, Table-level)](locking.md) — The lock types utilized.

---

## 2. Term Category
- **SQL DML Statement**

---

## 3. Environment Context
- **PostgreSQL Core** (Must be executed inside an active transaction block (`BEGIN`/`COMMIT`). Supports advanced sub-clauses like **`NOWAIT`** and **`SKIP LOCKED`**).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Under default PostgreSQL MVCC rules, reads are non-blocking. 

This causes issues in "Read-Modify-Write" workflows.

Consider a ticket booking system checkout:
1.  **Read:** Query remaining seats: `SELECT seats FROM flights WHERE id = 5;` (returns `1`).
2.  **App Check:** The server validates that `1` seat is available.
3.  **Write:** Update the database: `UPDATE flights SET seats = seats - 1 WHERE id = 5;`

What happens if two users run this checkout flow at the exact same millisecond?
-   Both users read the seat count (`1`) simultaneously (since readers don't block).
-   Both checkout scripts see that `1` seat is available and approve the purchases.
-   Both scripts run updates. 
-   The seat count drops to `-1`, resulting in an **overbooking disaster**.

We designed the **`SELECT ... FOR UPDATE`** statement to solve this. 

It tells PostgreSQL: *"Read this row, but immediately lock it as if I just ran an UPDATE on it."* 

Any other client trying to write to that row, or trying to read it using `FOR UPDATE`, is blocked. 

They must wait in line until your transaction commits, preventing double-bookings.

---

### (2) Advanced Options

-   **`NOWAIT`:** If the row you want is locked by someone else, do not wait in queue. Throw an error immediately (`55P03 lock_not_available`) so the app can tell the user: *"System busy, try again."*
-   **`SKIP LOCKED`:** If a row is locked, skip it and select the next available unlocked row. (The industry standard for building high-speed concurrent task queues!).

---

### (3) Reality Metaphor (Trying on Clothes)
Imagine shopping at a clothing store:
-   You see a nice jacket on the rack. 
-   Instead of leaving the jacket on the open rack while you decide (allowing another customer to grab it), you carry the jacket into the **Dressing Room** and lock the door (`SELECT ... FOR UPDATE`).
-   No other customer can touch or try on that jacket until you unlock the dressing room door and either buy it (commit) or put it back (rollback).

---

### (4) Code Examples

#### 1. Safe Balance Withdrawal (Read-Modify-Write)
```sql
BEGIN;

-- Lock the row during the read phase
SELECT balance FROM bank_accounts 
WHERE id = 42 
FOR UPDATE; -- Holds the row lock!

-- Server checks balance in backend (e.g. balance is 100.00, wants 40.00)
-- Other concurrent transactions trying to withdraw from account 42 are blocked here!

UPDATE bank_accounts SET balance = balance - 40.00 WHERE id = 42;

COMMIT; -- Lock is released safely.
```

#### 2. Queue Processing with SKIP LOCKED
```sql
BEGIN;

-- Fetch the oldest pending task that isn't already being processed by another worker
SELECT id, task_name 
FROM job_queue 
WHERE status = 'pending' 
ORDER BY created_at ASC 
LIMIT 1 
FOR UPDATE SKIP LOCKED; -- Skips locked tasks!

-- Update status to 'processing'
UPDATE job_queue SET status = 'processing' WHERE id = 105;

COMMIT;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running SELECT ... FOR UPDATE outside an active transaction block

**The mistake:** Executing `SELECT * FROM flights WHERE id = 5 FOR UPDATE;` on a database connection without sending a `BEGIN` command first.

**Why it's wrong:** Under PostgreSQL's default autocommit mode, the query will lock the row, return the data, and then immediately commit and release the lock. The lock is gone before your application can perform its validation checks, rendering the lock useless.

**Fix: Always wrap `SELECT ... FOR UPDATE` inside explicit `BEGIN` and `COMMIT` transaction blocks.**

---



### Mistake 2: Executing `SELECT FOR UPDATE` Without `SKIP LOCKED` or `NOWAIT` in High-Throughput Worker Queues

**The mistake:** Multiple background job workers running `SELECT * FROM jobs WHERE status = 'pending' LIMIT 1 FOR UPDATE;`.

**Why it's wrong:** Without `SKIP LOCKED`, Worker 2 BLOCKS and waits for Worker 1 to finish processing, turning parallel job workers into a slow serial queue! Use `FOR UPDATE SKIP LOCKED`.

*Incorrect:*
```sql
SELECT * FROM jobs WHERE status = 'pending' LIMIT 1 FOR UPDATE; -- ❌ Blocks concurrent workers!
```

*Fix:*
```sql
SELECT * FROM jobs WHERE status = 'pending' LIMIT 1 FOR UPDATE SKIP LOCKED; -- Non-blocking job queue
```

### Mistake 3: Executing `SELECT FOR UPDATE` Outside Transaction Blocks

**The mistake:** Executing `SELECT * FROM users WHERE id = 1 FOR UPDATE;` in autocommit mode without `BEGIN`.

**Why it's wrong:** In autocommit mode, the statement completes and releases the row lock IMMEDIATELY upon query execution! Wrap `SELECT FOR UPDATE` inside `BEGIN...COMMIT`.

*Incorrect:*
```sql
SELECT * FROM users WHERE id = 1 FOR UPDATE; -- Lock releases immediately!
```

*Fix:*
```sql
BEGIN; SELECT * FROM users WHERE id = 1 FOR UPDATE; /* update work */ COMMIT;
```

## 6. Practice Exercises

### Exercise 1: Queue Task Selection

**Problem:** You are building a background worker script. Multiple worker servers run at the same time. You have a `tasks` table. Write the SQL transaction queries to select and lock the single oldest pending task (`status = 'queued'`) without letting workers wait for each other's locks.

**Expected output:**
> [!check]- Answer
> ```sql
> BEGIN;
> SELECT id FROM tasks 
> WHERE status = 'queued' 
> ORDER BY id ASC 
> LIMIT 1 
> FOR UPDATE SKIP LOCKED;
> -- Followed by UPDATE and COMMIT
> ```
> - Combine the `FOR UPDATE` query modifier with the `SKIP LOCKED` sub-clause.
> - Ensure you order tasks by ID or timestamp to find the oldest.

---



### Exercise 2: High-Throughput Job Queue Fetch Pattern

**Problem:** Write SQL statement for background workers fetching 1 pending job without blocking other workers using `FOR UPDATE SKIP LOCKED`.

**Expected output:**
> [!check]- Answer
> ```text
> BEGIN; SELECT * FROM jobs WHERE status = 'pending' ORDER BY id ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
> ```
> ```sql
> BEGIN;
> SELECT * FROM jobs
> WHERE status = 'pending'
> ORDER BY id ASC LIMIT 1
> FOR UPDATE SKIP LOCKED;
> ```
>
> **Explanation:** `FOR UPDATE SKIP LOCKED` skips rows locked by concurrent workers, enabling parallel queue processing.

---

### Exercise 3: FOR UPDATE vs FOR SHARE Comparison

**Problem:** Compare: `FOR UPDATE` (Exclusive row lock blocking reads/writes); `FOR SHARE` (Shared row lock permitting concurrent reads but blocking updates).

**Expected output:**
> [!check]- Answer
> ```text
> FOR UPDATE: exclusive row lock; FOR SHARE: shared row lock permitting concurrent reads
> ```
> ```text
> FOR UPDATE: exclusive row lock; FOR SHARE: shared row lock permitting concurrent reads
> ```
>
> **Explanation:** `FOR SHARE` prevents other transactions from modifying or deleting locked rows.

## 7. Related Terms
- [Locking (Row-level, Table-level)](locking.md) — The locking basics.
- [Deadlock](deadlock.md) — Gridlocks caused by locking conflicts.
- [Advisory Locks](advisory_locks.md) — Related concept: Advisory Locks.
- [Optimistic vs. Pessimistic Locking](optimistic_pessimistic.md) — Related concept: Optimistic vs. Pessimistic Locking.

---

## 8. Key Takeaways
- `SELECT ... FOR UPDATE` locks rows during read operations to protect writes.
- Essential for securing "Read-Modify-Write" workflows (like checkouts).
- Must be executed inside explicit `BEGIN`/`COMMIT` transaction blocks.
- Blocks other sessions from modifying, deleting, or locking the selected rows.
- Use `NOWAIT` to fail instantly if rows are already locked by other transactions.
- Use `SKIP LOCKED` to build high-concurrency background job queue systems.
