# Locking (Row-level, Table-level)

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The physical database lock mechanisms that prevent multiple concurrent transactions from colliding when writing to or reading the same data blocks.

---

## 1. Prerequisites
- [Transaction Isolation Levels](isolation_levels.md) — The settings controlling read visibility.

---

## 2. Term Category

**Core Concept** (Table & Row Lock Modes): Locking mechanisms (`RowShare`, `RowExclusive`, `AccessExclusive`, `FOR UPDATE`) coordinate concurrent row and table modifications without data corruption.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Managed by the Lock Manager in RAM. Active locks can be queried in real-time by administrators via the **`pg_locks`** system catalog view).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Acquiring Table-Level Locks with `LOCK TABLE`

**Scenario:**
Acquire an `EXCLUSIVE` table lock on table `inventory` during bulk data maintenance to block concurrent writes.

**Requirements:**
1. Execute `LOCK TABLE inventory IN EXCLUSIVE MODE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> BEGIN;
> 
> LOCK TABLE inventory IN EXCLUSIVE MODE;
> 
> -- Perform maintenance batch updates...
> 
> COMMIT;
> ```
>
> #### Technical Explanation
>
> 1. `LOCK TABLE` acquires explicit table-level lock modes.
> 2. `EXCLUSIVE` mode blocks concurrent `UPDATE`, `DELETE`, and `INSERT` statements, while permitting concurrent `SELECT` reads.
> 3. Lock is released automatically at `COMMIT` or `ROLLBACK`.

---

### Exercise 2: Non-Blocking Lock Attempts with `NOWAIT`

**Scenario:**
Attempt to lock table `accounts` using `NOWAIT`, raising an error immediately if another transaction holds a conflicting lock.

**Requirements:**
1. Execute `LOCK TABLE accounts IN EXCLUSIVE MODE NOWAIT`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> BEGIN;
> 
> LOCK TABLE accounts IN EXCLUSIVE MODE NOWAIT;
> 
> COMMIT;
> ```
>
> #### Technical Explanation
>
> 1. `NOWAIT` instructs PostgreSQL not to wait for conflicting locks to be released.
> 2. Raises Error `55P03` (`lock_not_available`) immediately if locked.
> 3. Prevents application threads from blocking during high contention.

---

### Exercise 3: Inspecting Active Locks in System Views

**Scenario:**
Query `pg_locks` joined with `pg_stat_activity` to locate active lock contention and blocked sessions.

**Requirements:**
1. Query `pg_locks` filtering `granted = false`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   blocked_locks.pid AS blocked_pid,
>   blocked_activity.usename AS blocked_user,
>   blocking_locks.pid AS blocking_pid,
>   blocking_activity.usename AS blocking_user,
>   blocked_activity.query AS blocked_statement 
> FROM pg_catalog.pg_locks AS blocked_locks 
> JOIN pg_catalog.pg_stat_activity AS blocked_activity ON blocked_activity.pid = blocked_locks.pid 
> JOIN pg_catalog.pg_locks AS blocking_locks 
>   ON blocking_locks.locktype = blocked_locks.locktype 
>  AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE 
>  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation 
>  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page 
>  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple 
>  AND blocking_locks.pid != blocked_locks.pid 
> JOIN pg_catalog.pg_stat_activity AS blocking_activity ON blocking_activity.pid = blocking_locks.pid 
> WHERE NOT blocked_locks.granted;
> ```
>
> #### Technical Explanation
>
> 1. `pg_locks` exposes real-time lock allocation tables across all PostgreSQL processes.
> 2. `NOT granted` identifies sessions currently blocked waiting for locks.
> 3. Essential DBA diagnostic query for resolving lock contention.

---



## 6. Related Terms
- [Transaction Isolation Levels](isolation_levels.md) — The settings controlling read visibility.
- [Deadlock](deadlock.md) — Gridlocks caused by lock loops.
- [`SELECT ... FOR UPDATE`](select_for_update.md) — Manually locking rows during reads.
- [Advisory Locks](advisory_locks.md) — Related concept: Advisory Locks.
- [Optimistic vs. Pessimistic Locking](optimistic_pessimistic.md) — Related concept: Optimistic vs. Pessimistic Locking.

---

## 7. Key Takeaways
- Locks prevent concurrent transactions from corrupting shared data blocks.
- Row-level locks lock individual rows, enabling high concurrent write speeds.
- Table-level locks lock the entire table, blocking all other write actions.
- Shared locks permit concurrent reads; Exclusive locks block both reads and writes.
- PostgreSQL manages row-level locks automatically for updates and deletes.
- Avoid manual table locks (`LOCK TABLE`) to protect API concurrency throughput.
