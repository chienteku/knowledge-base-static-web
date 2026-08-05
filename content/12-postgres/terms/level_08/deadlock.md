# Deadlock

> **Level 8 — Transactions, Concurrency & Data Integrity**
> A circular dependency gridlock where two or more concurrent transactions are frozen indefinitely because each is waiting to acquire a lock held by the other.

---

## 1. Prerequisites
- [Locking (Row-level, Table-level)](locking.md) — The blocking locks that cause deadlocks.

---

## 2. Term Category
- **PostgreSQL Core Architecture**

---

## 3. Environment Context
- **PostgreSQL Core** (Managed by the background Deadlock Detector thread. Checks lock dependency queues periodically based on the **`deadlock_timeout`** parameter (default: 1 second)).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In `locking.md`, we learned that database transactions lock rows to prevent writing conflicts, forcing other transactions to queue and wait. 

However, if your application code isn't designed carefully, transactions can create circular wait states.

Consider this classic deadlock timeline:
1.  **Transaction A** locks Row `1`.
2.  **Transaction B** locks Row `2`.
3.  **Transaction A** tries to lock Row `2` (blocked; waits for Transaction B).
4.  **Transaction B** tries to lock Row `1` (blocked; waits for Transaction A).

Neither transaction can proceed, and neither can release its locks because they are waiting to commit. 

Left unchecked, they would freeze the database connection slots forever.

We designed the **Deadlock Detector** inside the PostgreSQL core engine to solve this. 

It runs in the background. 

If a circular lock dependency persists beyond `deadlock_timeout` (1 second), Postgres automatically selects one of the transactions (the "victim"), aborts it, rolls back its modifications, and throws a **`40P01` Deadlock Detected** error. 

This releases the victim's locks, allowing the remaining transaction to unfreeze and complete successfully.

---

### (2) Prevention: Consistent Lock Ordering
The most effective way to prevent deadlocks is to **always lock database resources in the exact same order** across all your backend application files.

If both Transaction A and Transaction B are written to lock Row `1` first, and then Row `2`:
-   Transaction A locks Row `1`.
-   Transaction B tries to lock Row `1` (blocked immediately; waits).
-   Transaction A locks Row `2` (no conflict, since B never reached it).
-   Transaction A commits, releasing all locks.
-   Transaction B unfreezes, locks Row `1`, then Row `2`, and completes.
-   *Result:* Zero deadlocks!

---

### (3) Reality Metaphor
Imagine a narrow, single-lane bridge:
-   Car A drives onto the bridge from the left.
-   Car B drives onto the bridge from the right.
-   They meet in the middle. Neither car can move forward because the other is blocking the lane. Neither driver is willing to back up (rollback).
-   **Deadlock:** They sit there staring at each other forever.
-   **Detector:** A police officer (PostgreSQL) arrives, forces Car B to back off the bridge (rollback), allowing Car A to cross (commit). Car B can try crossing again once the lane is clear.

---

### (4) Code Examples

#### The Deadlock Conflict Logs
This log is generated on the victim transaction's connection slot:

```sql
-- Transaction A Session
BEGIN;
UPDATE accounts SET balance = balance - 10 WHERE id = 1; -- (Succeeds)
UPDATE accounts SET balance = balance - 10 WHERE id = 2; -- (Waits...)

-- Transaction B Session (concurrent)
BEGIN;
UPDATE accounts SET balance = balance - 10 WHERE id = 2; -- (Succeeds)
UPDATE accounts SET balance = balance - 10 WHERE id = 1; -- (Triggers Deadlock!)

-- After 1 second, Transaction B crashes with:
-- ERROR: deadlock detected
-- DETAIL: Process 4125 waits for ShareLock on transaction; blocked by process 4124.
--         Process 4124 waits for ShareLock on transaction; blocked by process 4125.
-- HINT: See server log for query details.
-- CONTEXT: while updating relation "accounts"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming you have to reboot the database server to clear a deadlock

**The mistake:** Panic-restarting the PostgreSQL database service when deadlock error notifications appear in application alert systems.

**Why it's wrong:** PostgreSQL's deadlock detector identifies and resolves deadlocks automatically within one second. 

Restarting the server is unnecessary, disconnects all active users, and causes major website downtime.

**Fix: Write transaction retry logic in your backend application to catch error code `40P01` and run the queries again. More importantly, audit your SQL code to ensure rows are updated in a consistent order.**

---



### Mistake 2: Updating Multiple Tables/Rows in Mismatched Reverse Lock Orders Across Services

**The mistake:** Tx A updates `Account 1` then `Account 2`. Tx B updates `Account 2` then `Account 1` concurrently.

**Why it's wrong:** Acquiring locks in mismatched orders causes mutual deadlock wait dependencies! Tx A waits for Tx B, Tx B waits for Tx A, triggering a Deadlock error. ALWAYS acquire locks in deterministic sorted order (e.g. `ORDER BY id`).

*Incorrect:*
```sql
// Tx A: Locks 1 then 2; Tx B: Locks 2 then 1 -- ❌ Deadlock!
```

*Fix:*
```sql
Sort resource IDs before acquiring locks: Lock smaller ID first (id = 1, then id = 2)
```

### Mistake 3: Setting High `deadlock_timeout` Values Retaining Blocked Database Locks

**The mistake:** Setting `deadlock_timeout = 60s` in production postgresql.conf.

**Why it's wrong:** High deadlock timeouts force blocked client processes to wait 60 seconds before PostgreSQL detects and cancels deadlocks. Set `deadlock_timeout = '1s'`.

*Incorrect:*
```sql
deadlock_timeout = 60s -- ❌ Long client wait latencies during deadlocks
```

*Fix:*
```sql
deadlock_timeout = '1s' -- Fast deadlock detection
```

## 6. Practice Exercises

### Exercise 1: Lock Ordering Refactor

**Problem:** You have two concurrent transactions that deadlock:
-   **Transaction 1:** Updates `users` (id=5) first, then updates `profiles` (user_id=5).
-   **Transaction 2:** Updates `profiles` (user_id=5) first, then updates `users` (id=5).

Rewrite the steps of Transaction 2 to prevent deadlocks.

**Expected output:**
> [!check]- Answer
> ```text
> Refactored Transaction 2 Steps:
> 1. Update `users` (id=5) first.
> 2. Update `profiles` (user_id=5) second.
> 
> By ordering the locks consistently (always updating `users` before `profiles`), Transaction 2 will queue behind Transaction 1's lock on the users table, eliminating the circular wait state.
> ```
> - Match the exact order of the tables modified in Transaction 1.
> - Ensure no crossover locks can be acquired simultaneously.

---



### Exercise 2: Deterministic Lock Order Pattern

**Problem:** Write SQL pattern preventing deadlocks when transferring money between `account_a` and `account_b`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM accounts WHERE id IN (10, 20) ORDER BY id ASC FOR UPDATE;
> ```
> ```sql
> SELECT * FROM accounts WHERE id IN (10, 20) ORDER BY id ASC FOR UPDATE;
> ```
>
> **Explanation:** Acquiring locks in strict ascending primary key order (`ORDER BY id ASC`) eliminates deadlock circular dependencies.

---

### Exercise 3: Handling Deadlock Exceptions in Application Code

**Problem:** What PostgreSQL error code indicates a Deadlock detection? (`40P01`).

**Expected output:**
> [!check]- Answer
> ```text
> 40P01 (deadlock_detected)
> ```
> ```text
> 40P01 (deadlock_detected)
> ```
>
> **Explanation:** Catching error code `40P01` enables applications to retry failed transactions safely.

## 7. Related Terms
- [Locking (Row-level, Table-level)](locking.md) — The locking basics.
- [`SELECT ... FOR UPDATE`](select_for_update.md) — Query locks.

---

## 8. Key Takeaways
- A deadlock occurs when transactions wait for each other's locks in a circle.
- The PostgreSQL Deadlock Detector scans active queues for circular blocks.
- Clears deadlocks by aborting one transaction, throwing error `40P01`.
- Checked automatically based on the `deadlock_timeout` variable (default 1s).
- Prevent deadlocks by always locking rows/tables in a consistent order.
- Do not reboot servers to resolve deadlocks; trust the engine's auto-clean.
