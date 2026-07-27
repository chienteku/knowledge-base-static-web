# Advisory Locks

> **Level 8 — Transactions, Concurrency & Data Integrity**
> Application-level locks managed in PostgreSQL's memory using arbitrary 64-bit integer keys, allowing application code to coordinate concurrent tasks without locking actual table rows or schemas.

---

## 1. Prerequisites
- [Locking (Row-level, Table-level)](locking.md) — The parent lock concept.

---

## 2. Term Category
- **PostgreSQL Performance Concept**

---

## 3. Environment Context
- **PostgreSQL Core** (Managed in database server RAM. Advisory locks do not write to transaction logs (WAL) or generate dead tuples, making them extremely fast).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard database locks are bound to physical data: rows, tables, or indexes.

But sometimes, applications need to lock an **abstract business concept** or a **server task** that doesn't map to a specific row on disk:
-   **Preventing overlapping cron jobs:** A script runs every 5 minutes to generate client PDFs. If the task takes 7 minutes under high load, the next cron job starts, resulting in duplicate PDF generation and high CPU usage.
-   **Serializing external API calls:** Ensuring only one background worker talks to the Stripe payment API at any given moment.

You could create a dummy database table `locks` and insert rows like `'pdf_generator_active'`, but writing rows creates disk I/O, generates dead tuples, and if the script crashes, the lock remains stuck in the table forever.

PostgreSQL designed **Advisory Locks** to solve this. 

They are logical lock tokens stored in memory, identified by arbitrary numbers you choose (e.g. key `12345`). 

They lock no physical data. 

Instead, your application scripts check the key status: if key `12345` is active, the script knows to wait or abort.

---

### (2) Lock Scopes and Non-Blocking Checks

1.  **Transaction-Level (`pg_advisory_xact_lock`):** Automatically released when the active transaction commits or rolls back. Safe and easy to manage.
2.  **Session-Level (`pg_advisory_lock`):** Tied to the TCP connection. Remains active until you explicitly unlock it or the database connection drops.
3.  **Non-Blocking Check (`pg_try_advisory_lock`):** Instead of freezing your script to wait, this function returns `TRUE` if the lock was acquired, or `FALSE` immediately if another session holds it.

---

### (3) Reality Metaphor
Imagine a corporate meeting room:
-   **Row Lock:** Sitting in a chair and locking the armrest. No one else can sit in that chair.
-   **Advisory Lock:** The facilitator holds up a **Wooden Speaking Baton** (Key `42`). Holding the baton does not lock the chairs, the table, or the door. However, the attendees agree on a rule: *"Only the person holding the baton is allowed to speak."* If you want to speak, you look at the baton. If someone else has it, you wait.

---

### (4) Code Examples

#### 1. Non-Blocking Cron Job Guard (Session-Level)
Use this inside your background cron scripts to prevent concurrent executions:

```sql
-- Try to acquire lock key 88888. Returns true/false instantly.
SELECT pg_try_advisory_lock(88888); 

-- If output is TRUE: Run your heavy PDF generation report script.
-- Once the script finishes, release the lock key:
SELECT pg_advisory_unlock(88888);

-- If output is FALSE: Abort immediately! Another worker is already running it.
```

#### 2. Transaction-Level Lock (Auto-Release)
```sql
BEGIN;

-- Lock is held for the duration of this transaction
SELECT pg_advisory_xact_lock(99999);

-- Perform operations...

COMMIT; -- Lock 99999 is automatically released by Postgres here!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to unlock session-level advisory locks in connection pools

**The mistake:** Running `pg_advisory_lock(12345)` in a Node.js API, finishing the task, but failing to run `pg_advisory_unlock(12345)` before releasing the database client back to the connection pool.

**Why it's wrong:** Session-level locks remain active as long as the TCP connection is open. 

Because connection pools keep connections open to reuse them, that lock key `12345` will remain locked indefinitely. 

Any other worker trying to acquire lock `12345` will block and freeze, causing server stalls.

**Fix: Prefer transaction-level advisory locks (`pg_advisory_xact_lock`) because they release automatically. If you must use session locks, wrap them in `finally` code blocks that guarantee unlocking.**

---



### Mistake 2: Using Session-Level Advisory Locks (`pg_advisory_lock`) Without Explicit Unlocks

**The mistake:** Acquiring session lock `SELECT pg_advisory_lock(123)` and failing to call `pg_advisory_unlock(123)`.

**Why it's wrong:** Session-level advisory locks remain held for the entire TCP connection lifespan! If connection pooling reuses the connection, subsequent requests remain blocked. Use transaction-level locks (`pg_advisory_xact_lock`).

*Incorrect:*
```sql
SELECT pg_advisory_lock(123); -- Session lock remains held across pooled connection!
```

*Fix:*
```sql
SELECT pg_advisory_xact_lock(123); -- Lock automatically releases at COMMIT/ROLLBACK
```

### Mistake 3: Using Hardcoded Low 32-Bit Integers as Lock Keys Causing Global Advisory Lock Collisions

**The mistake:** Using `pg_advisory_xact_lock(1)` across different application domain features.

**Why it's wrong:** Advisory locks operate across a single global 64-bit key namespace! Using low integers like `1` or `2` causes lock collisions across un-related features. Use hashed feature strings `hashtext('billing_job')`.

*Incorrect:*
```sql
SELECT pg_advisory_xact_lock(1); -- ❌ Collides with other features using key 1!
```

*Fix:*
```sql
SELECT pg_advisory_xact_lock(hashtext('billing_job_123'));
```

## 6. Practice Exercises

### Exercise 1: Cron Lock Selection

**Problem:** You are writing a database cleanup script that runs once an hour. You want to ensure that if a previous run is still active, the new run aborts immediately instead of waiting in line. Write the SQL query to accomplish this using lock key `77777`.

**Expected output:**
```sql
SELECT pg_try_advisory_lock(77777);
```

> [!check]- Answer
> - The term "abort immediately instead of waiting" indicates a non-blocking check is required.
> - Look for the prefix `try` in the advisory lock functions.

---



### Exercise 2: Transaction-Level Advisory Lock with Hash

**Problem:** Acquire transaction-level advisory lock using `hashtext('cron_job')`.

**Expected output:**
```text
SELECT pg_advisory_xact_lock(hashtext('cron_job'));
```

> [!check]- Answer
> ```sql
> SELECT pg_advisory_xact_lock(hashtext('cron_job'));
> ```
>
> **Explanation:** `pg_advisory_xact_lock` acquires application locks released automatically upon transaction commit.

### Exercise 3: Try Advisory Lock Non-Blocking Check

**Problem:** Attempt non-blocking lock acquisition using `pg_try_advisory_xact_lock(key)` returning boolean success.

**Expected output:**
```text
SELECT pg_try_advisory_xact_lock(100);
```

> [!check]- Answer
> ```sql
> SELECT pg_try_advisory_xact_lock(100);
> ```
>
> **Explanation:** `pg_try_advisory_xact_lock` returns `FALSE` immediately if the lock is held by another process.

## 7. Related Terms
- [Locking (Row-level, Table-level)](locking.md) — The parent lock concept.
- [`SELECT ... FOR UPDATE`](select_for_update.md) — Row-level read locks.

---

## 8. Key Takeaways
- Advisory locks are application-level logical locks managed in server RAM.
- Identified using arbitrary 64-bit integer keys chosen by the developer.
- Lock no physical rows or tables, generating zero disk writes or dead tuples.
- Transaction-level locks release automatically upon commit or rollback.
- Session-level locks persist until explicitly unlocked or connections drop.
- Use `pg_try_advisory_lock` for non-blocking task guards (like cron jobs).
- Release session locks before returning database connections to connection pools.
