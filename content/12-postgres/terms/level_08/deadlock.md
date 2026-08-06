# Deadlock

> **Level 8 — Transactions, Concurrency & Data Integrity**
> A circular dependency gridlock where two or more concurrent transactions are frozen indefinitely because each is waiting to acquire a lock held by the other.

---

## 1. Prerequisites
- [Locking (Row-level, Table-level)](locking.md) — The blocking locks that cause deadlocks.

---

## 2. Term Category

**Core Concept** (Mutual Lock Dependency Resolution): A Deadlock occurs when two or more transactions hold locks while waiting for locks held by each other, resolved by PostgreSQL aborting one transaction with a deadlock detection error.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Managed by the background Deadlock Detector thread. Checks lock dependency queues periodically based on the **`deadlock_timeout`** parameter (default: 1 second)).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Reproducing a Deadlock Scenario

**Scenario:**
Reproduce a Deadlock by having Session 1 lock Row A then Row B, while Session 2 locks Row B then Row A.

**Requirements:**
1. Code Session 1 and Session 2 update ordering causing a Deadlock error (`40P01`).

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- Session 1:
> BEGIN;
> UPDATE accounts SET balance_cents = balance_cents - 100 WHERE id = 1; -- Locks Row 1
> 
> -- Session 2 (Concurrent):
> BEGIN;
> UPDATE accounts SET balance_cents = balance_cents - 100 WHERE id = 2; -- Locks Row 2
> 
> -- Session 1:
> UPDATE accounts SET balance_cents = balance_cents + 100 WHERE id = 2; -- Waits for Row 2...
> 
> -- Session 2:
> UPDATE accounts SET balance_cents = balance_cents + 100 WHERE id = 1; -- Deadlock Detected! Session 2 aborts!
> ```
>
> #### Technical Explanation
>
> 1. A Deadlock occurs when two transactions wait for locks held by each other.
> 2. PostgreSQL background daemon detects cyclic wait dependency graphs and aborts one transaction with Error `40P01` (`deadlock_detected`).
> 3. The aborted transaction must roll back and retry.
> 
---

### Exercise 2: Preventing Deadlocks via Consistent Lock Ordering

**Scenario:**
Eliminate deadlocks by enforcing consistent primary key lock ordering (`id ASC`) across all application write transactions.

**Requirements:**
1. Sort update IDs in code before acquiring locks.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // Sort target account IDs ascending before acquiring row locks!
> const [firstId, secondId] = [fromId, toId].sort((a, b) => a - b);
> 
> await client.query("UPDATE accounts SET balance_cents = balance_cents - $1 WHERE id = $2", [amount, firstId]);
> await client.query("UPDATE accounts SET balance_cents = balance_cents + $1 WHERE id = $2", [amount, secondId]);
> ```
> 
> #### Technical Explanation
>
> 1. Enforcing consistent lock acquisition order (e.g. always updating smaller `id` before larger `id`) eliminates cyclic wait graph dependencies.
> 2. Eliminates deadlock errors mathematically.
> 3. Essential pattern for high-concurrency financial transactions.
> 
---

### Exercise 3: Tuning Deadlock Detection Timeout (`deadlock_timeout`)

**Scenario:**
Inspect `deadlock_timeout` parameter controlling how long PostgreSQL waits before checking for deadlocks.

**Requirements:**
1. Execute `SHOW deadlock_timeout`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SHOW deadlock_timeout;
> ```
>
> #### Technical Explanation
>
> 1. `deadlock_timeout` (default `1s`) sets the wait time before the deadlock detector checks the lock dependency graph.
> 2. Checking for deadlocks requires acquiring expensive global lock manager locks.
> 3. Keep at default `1s` for balanced performance and deadlock resolution speed.
> 
---



## 6. Related Terms
- [Locking (Row-level, Table-level)](locking.md) — The locking basics.
- [`SELECT ... FOR UPDATE`](select_for_update.md) — Query locks.

---

## 7. Key Takeaways
- A deadlock occurs when transactions wait for each other's locks in a circle.
- The PostgreSQL Deadlock Detector scans active queues for circular blocks.
- Clears deadlocks by aborting one transaction, throwing error `40P01`.
- Checked automatically based on the `deadlock_timeout` variable (default 1s).
- Prevent deadlocks by always locking rows/tables in a consistent order.
- Do not reboot servers to resolve deadlocks; trust the engine's auto-clean.
