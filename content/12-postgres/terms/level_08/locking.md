# Locking (Row-level, Table-level)

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The physical database lock mechanisms that prevent multiple concurrent transactions from colliding when writing to or reading the same data blocks.

---

## 1. Prerequisites
- [Transaction Isolation Levels](isolation_levels.md) — The settings controlling read visibility.
---

## 2. Term Category
- **PostgreSQL Core Architecture**

---

## 3. Environment Context
- **PostgreSQL Core** (Managed by the Lock Manager in RAM. Active locks can be queried in real-time by administrators via the **`pg_locks`** system catalog view).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational databases protect data integrity. 

While MVCC snapshot rules ensure readers and writers can operate simultaneously without blocking:
-   **Writers must still block other writers.**
-   If Client A and Client B both try to run `UPDATE accounts SET balance = balance - 10` on the exact same row at the exact same millisecond, the database cannot allow both updates to write simultaneously. Doing so would overwrite one of the subtractions (causing a lost update anomaly).

We designed **Locking** systems to serialize write operations on shared data, forcing conflicting transactions to queue up orderly.

---

### (2) Locking Scopes (Granularity)

#### 1. Row-Level Locks
Locks only the specific individual rows being modified.
-   *Postgres Default:* Running an `UPDATE` or `DELETE` automatically locks **only** the rows matching the filter condition. 
-   *Benefit:* Extremely high concurrency. If Client A is updating user `5`, and Client B is updating user `6`, they operate simultaneously without delay.

#### 2. Table-Level Locks
Locks the entire table file.
-   *Trigger:* DDL commands (like `ALTER TABLE`, `DROP TABLE`, or `VACUUM FULL`) require exclusive table-level locks.
-   *Drawback:* High block overhead. All other reads and writes to that table are blocked until the lock releases.

---

### (3) Basic Lock Modes

-   **Shared Lock (Read Lock):** Acquired automatically during reads. Multiple transactions can hold shared locks on the same row or table at the same time (multiple users can read).
-   **Exclusive Lock (Write Lock):** Acquired automatically during writes. Only one transaction can hold an exclusive lock. It blocks all other locks—shared or exclusive.

---

### (4) Reality Metaphor
Imagine an office building restroom:
-   **Row-Level Lock:** The restroom contains 10 toilet stalls. When an employee enters a stall and slides the bolt closed, the indicator turns red (Row lock on Stall 3). Other employees can still enter and use Stalls 1, 2, and 4 normally.
-   **Table-Level Lock:** A janitor blocks the main restroom entrance with a cleaning cart (Table lock). No employee can use any stall in the restroom block until the janitor finishes sweeping.

---

### (5) Code Examples

#### 1. Implicit Row Locking (PostgreSQL default)
Row locks are managed automatically by the SQL engine. You do not need to call lock queries:

```sql
-- Transaction A
BEGIN;
UPDATE products SET stock = stock - 1 WHERE id = 12; 
-- Transaction A holds an EXCLUSIVE ROW LOCK on product 12.

-- Transaction B (runs in a separate session at the same time)
BEGIN;
UPDATE products SET stock = stock - 2 WHERE id = 12;
-- Transaction B freezes! It waits for Transaction A's lock to release.
```

-   If Transaction A runs `COMMIT;` $\rightarrow$ Transaction B's query unfreezes and executes.
-   If Transaction A runs `ROLLBACK;` $\rightarrow$ Transaction B's query unfreezes and executes.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Acquiring manual table locks inside web application transaction loops

**The mistake:** Writing manual lock commands like `LOCK TABLE users IN EXCLUSIVE MODE;` inside normal user registration scripts.

**Why it's wrong:** An exclusive table lock blocks **all** user registrations globally. 

Only one user can sign up at a time. 

Under moderate web traffic, this serializes your app writes, causing massive request queues, gateway timeout errors, and slow page loads.

**Fix: Trust PostgreSQL's default automatic row-level locks. Never write manual `LOCK TABLE` commands unless performing off-peak batch maintenance updates.**

---



### Mistake 2: Acquiring Table-Level `ACCESS EXCLUSIVE` Locks During Peak Hours

**The mistake:** Running DDL operations like `ALTER TABLE` or `VACUUM FULL` during peak traffic hours.

**Why it's wrong:** `ACCESS EXCLUSIVE` locks block ALL concurrent SELECT, INSERT, UPDATE, and DELETE queries, taking the database offline for that table. Run DDL with `lock_timeout` during maintenance windows.

*Incorrect:*
```sql
ALTER TABLE heavy_table ADD COLUMN c INT; -- ❌ Blocks all reads and writes!
```

*Fix:*
```sql
SET lock_timeout = '2s'; ALTER TABLE heavy_table ADD COLUMN c INT;
```

### Mistake 3: Executing Un-Indexed `UPDATE` Statements Locking Excess Rows

**The mistake:** Executing `UPDATE users SET status = 'active' WHERE category = 'tech';` on an un-indexed `category` column.

**Why it's wrong:** Un-indexed `UPDATE` queries execute a `Seq Scan`, evaluating exclusive row locks sequentially across millions of disk tuples. Build indexes on `WHERE` predicate columns.

*Incorrect:*
```sql
// Un-indexed UPDATE scanning and locking millions of rows
```

*Fix:*
```sql
CREATE INDEX idx_users_category ON users (category);
```

## 6. Practice Exercises

### Exercise 1: Lock Compatibility Test

**Problem:** Transaction A holds an **Exclusive Lock** on Row 5. Transaction B tries to run a query on Row 5. Determine whether Transaction B is **Blocked** or **Allowed to proceed** for these two queries:
1.  `SELECT * FROM accounts WHERE id = 5;` (under default Read Committed isolation).
2.  `UPDATE accounts SET balance = 100 WHERE id = 5;`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Proceed. Under MVCC, readers do not block writers, and writers do not block readers. Transaction B's read query will read the old snapshot version of Row 5 without waiting.
> 2. Blocked. Transaction B is attempting to acquire an Exclusive Write Lock on the same row. It must wait until Transaction A commits or rolls back to release its lock.
> ```
> - Differentiate read queries (shared/snapshot) from write queries (exclusive).
> - Recall the MVCC rule: "readers never block writers, writers never block readers".

---



### Exercise 2: Inspecting Active Locks in System Catalog

**Problem:** Query active granted and waiting locks from `pg_locks` and `pg_stat_activity`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT pid, locktype, mode, granted FROM pg_locks;
> ```
> ```sql
> SELECT pid, locktype, mode, granted FROM pg_locks;
> ```
>
> **Explanation:** `pg_locks` details active lock types, modes, and process wait statuses.

---

### Exercise 3: Lock Compatibility Matrix Rule

**Problem:** Do `SELECT` queries (`ACCESS SHARE` locks) block concurrent `UPDATE` queries (`ROW EXCLUSIVE` locks)? (No, reads do not block writes in PostgreSQL).

**Expected output:**
> [!check]- Answer
> ```text
> No, reads do not block writes in PostgreSQL MVCC
> ```
> ```text
> No, reads do not block writes in PostgreSQL MVCC
> ```
>
> **Explanation:** PostgreSQL MVCC architecture guarantees that readers never block writers and writers never block readers.

## 7. Related Terms
- [Transaction Isolation Levels](isolation_levels.md) — The settings controlling read visibility.
- [Deadlock](deadlock.md) — Gridlocks caused by lock loops.
- [`SELECT ... FOR UPDATE`](select_for_update.md) — Manually locking rows during reads.
- [Advisory Locks](advisory_locks.md) — Related concept: Advisory Locks.
- [Optimistic vs. Pessimistic Locking](optimistic_pessimistic.md) — Related concept: Optimistic vs. Pessimistic Locking.
---

## 8. Key Takeaways
- Locks prevent concurrent transactions from corrupting shared data blocks.
- Row-level locks lock individual rows, enabling high concurrent write speeds.
- Table-level locks lock the entire table, blocking all other write actions.
- Shared locks permit concurrent reads; Exclusive locks block both reads and writes.
- PostgreSQL manages row-level locks automatically for updates and deletes.
- Avoid manual table locks (`LOCK TABLE`) to protect API concurrency throughput.
