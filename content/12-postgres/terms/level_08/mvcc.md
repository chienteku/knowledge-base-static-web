# MVCC (Multi-Version Concurrency Control)

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The core PostgreSQL concurrency model where every query sees a private snapshot of database records, allowing readers and writers to operate simultaneously without locking each other out.

---

## 1. Prerequisites
- [Transaction](transaction.md) — The transaction boundaries managing the snapshots.
- [`VACUUM` / `ANALYZE`](../level_07/vacuum_analyze.md) — The maintenance tasks that purge obsolete MVCC row versions.

---

## 2. Term Category

**Core Concept** (Multi-Version Concurrency Control): Multi-Version Concurrency Control (MVCC) maintains multiple version snapshots of table rows (`xmin`/`xmax`), guaranteeing that readers never block writers and writers never block readers.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (The foundational storage design of PostgreSQL. Defines how rows are physically written to data files on disk).

### (1) Design Motivation — "Why did we design this?"
In high-volume web applications, thousands of clients access the database at the same time. 

What happens when Client A is writing a heavy update to a table at the exact same millisecond that Client B is running a query to read data from that same table?

In early database engines (using locking-based concurrency):
-   Client A's write query locked the table.
-   Client B's read query was forced to wait (blocked) until Client A finished.
-   Under high traffic, this caused severe slow-downs.

We designed **MVCC (Multi-Version Concurrency Control)** to solve this read-write bottleneck. 

Under MVCC, the database follows a golden rule:
**"Readers never block writers, and writers never block readers."**

---

### (2) How it Works: Digital Snapshots
Instead of overwriting data "in-place" (which would corrupt what Client B is reading), **every update or delete in PostgreSQL creates a new version of the row on disk.**

Every row on disk has hidden system columns that record transaction timestamps:
-   **`xmin`:** The Transaction ID that created (inserted) the row.
-   **`xmax`:** The Transaction ID that deleted or updated (superseded) the row.

When Client B runs a query, Postgres grants it a private **Snapshot** of active transactions. 

When reading rows, Postgres compares the row's `xmin` and `xmax` metadata against the snapshot:
-   If Client A's write is still uncommitted, Client B's snapshot ignores the new row and reads the old, stable version of the row instead.
-   Once Client A commits, the old version becomes a **Dead Tuple** (obsolete version), which is cleaned up later by `VACUUM`.

---

### (3) Reality Metaphor
Imagine editing a document in Google Docs:
-   **Locking Concurrency:** You lock the file. No one else can open or read the file until you finish editing and close it.
-   **MVCC Concurrency:** Multiple people open the file. 
    -   While you are typing a new draft in a copy, other users see the **Last Saved Version** (the active snapshot).
    -   Once you click "Publish" (commit), your new version becomes the active display version.
    -   The old drafts are saved in the "Version History" (dead tuples).

---

### (4) Under the Hood: xmin / xmax Mapping

```text
Table Row State:

After INSERT by Tx 10:
[Data: 'Alice', xmin: 10, xmax: 0] -- xmax 0 means active

After UPDATE by Tx 20 (changing Alice to Alisha):
Row version 1: [Data: 'Alice',  xmin: 10, xmax: 20] -- Marked dead by Tx 20
Row version 2: [Data: 'Alisha', xmin: 20, xmax: 0]  -- Created by Tx 20
```

-   Active transactions with ID `< 20` will read Row Version 1 ('Alice').
-   Active transactions with ID `> 20` will read Row Version 2 ('Alisha').

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming MVCC prevents writers from blocking other writers

**The mistake:** Expecting two different clients to be able to run `UPDATE` statements on the exact same user profile row at the same time without blocking.

**Why it's wrong:** MVCC resolves conflicts between *readers* and *writers*. However, it does not allow two *writers* to modify the same row simultaneously. 

If Client A updates Alice's balance, Postgres locks that specific row. 

If Client B tries to update Alice's balance, Client B is forced to wait until Client A commits or rolls back.

**Fix: Rely on row locking mechanics to manage concurrent writes safely, and keep write transactions short to minimize blocking delays.**

---



### Mistake 2: Assuming `UPDATE` Mutates Row Data In-Place on Disk Pages

**The mistake:** Thinking PostgreSQL overwrites existing row data bytes when executing `UPDATE` statements.

**Why it's wrong:** In PostgreSQL MVCC, an `UPDATE` does NOT overwrite existing rows! It marks the old row tuple as dead (`xmin`/`xmax`) and inserts a BRAND NEW tuple on disk page. Dead tuples require `VACUUM` cleanup.

*Incorrect:*
```sql
// Assuming UPDATE modifies row bytes in-place
```

*Fix:*
```sql
Understand that UPDATE creates new tuple versions requiring autovacuum maintenance
```

### Mistake 3: Inspecting System Columns `xmin` and `xmax` for Application Business Logic

**The mistake:** Using hidden MVCC system columns `xmin` or `xmax` as business transaction timestamp fields.

**Why it's wrong:** `xmin` and `xmax` are internal 32-bit transaction IDs managed by the MVCC engine. They wrap around after 2 billion transactions! Use explicit application timestamp columns (`created_at`, `updated_at`).

*Incorrect:*
```sql
SELECT xmin, xmax FROM users WHERE xmin > 1000; -- ❌ MVCC system internal!
```

*Fix:*
```sql
SELECT created_at, updated_at FROM users;
```

## 5. Practice Exercises

### Exercise 1: Inspecting System Hidden Columns (`xmin`, `xmax`, `ctid`)

**Scenario:**
Inspect PostgreSQL MVCC hidden row header fields (`xmin`, `xmax`, `ctid`) on table `users`.

**Requirements:**
1. Execute `SELECT xmin, xmax, ctid, * FROM users`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   xmin, 
>   xmax, 
>   ctid, 
>   id, 
>   username 
> FROM users 
> LIMIT 5;
> ```
>
> #### Technical Explanation
>
> 1. `xmin`: The transaction ID (txid) that inserted this row version.
> 2. `xmax`: The transaction ID that deleted or updated (replaced) this row version (`0` if active).
> 3. `ctid`: The physical disk page slot location `(page_number, tuple_index)` of the row version.
> 
---

### Exercise 2: Observing MVCC Row Copy Behavior During UPDATE

**Scenario:**
Demonstrate that `UPDATE` creates a NEW row version with a new `ctid` and sets `xmax` on the old version.

**Requirements:**
1. Select `ctid`, `xmin`, `xmax` before and after updating a row.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- 1. Inspect before update
> SELECT ctid, xmin, xmax, username FROM users WHERE id = 1;
> 
> -- 2. Update row
> UPDATE users SET username = 'alice_updated' WHERE id = 1;
> 
> -- 3. Inspect after update
> SELECT ctid, xmin, xmax, username FROM users WHERE id = 1;
> ```
>
> #### Technical Explanation
>
> 1. PostgreSQL never modifies existing row tuple bytes in-place during an `UPDATE`.
> 2. Instead, `UPDATE` writes a brand new row tuple to disk with a new `ctid` and updates `xmax` on the old tuple.
> 3. Concurrent readers continue reading the old committed tuple snapshot without blocking.
> 
---

### Exercise 3: Dead Tuple Accumulation and VACUUM Cleanup

**Scenario:**
Explain how dead row versions accumulate after updates/deletes and why `VACUUM` is required to clean them.

**Requirements:**
1. Explain MVCC dead tuple lifecycle.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> MVCC Dead Tuple Cleanup Lifecycle:
> - Step 1: UPDATE/DELETE marks old tuple versions as "dead" by writing xmax = current_txid.
> - Step 2: Dead tuples remain on disk pages until all active transactions older than xmax complete.
> - Step 3: VACUUM scans table pages, marking dead tuple slots as free space for future INSERTS.
> ```
>
> #### Technical Explanation
>
> 1. MVCC enables non-blocking concurrent reads and writes ("readers never block writers, writers never block readers").
> 2. Un-cleaned dead tuples cause table bloat, slowing down sequential scans.
> 3. Requires background `autovacuum` maintenance.
> 
---



## 6. Related Terms
- [Transaction](transaction.md) — The snapshot boundaries.
- [`VACUUM` / `ANALYZE`](../level_07/vacuum_analyze.md) — Garbage collecting old row versions.
- [Transaction Isolation Levels](isolation_levels.md) — Fine-tuning snapshot rules.
- [ACID Properties](acid.md) — Related concept: ACID Properties.
- [Concurrency Anomalies (Dirty, Non-Repeatable, Phantom Reads)](concurrency_anomalies.md) — Related concept: Concurrency Anomalies (Dirty, Non-Repeatable, Phantom Reads).

---

## 7. Key Takeaways
- MVCC allows readers and writers to access the database concurrently.
- Readers do not block writers; writers do not block readers.
- Updates do not overwrite data in-place; they write new row versions.
- Uses hidden columns `xmin` and `xmax` to track transaction creators.
- Stale, deleted row versions are called dead tuples and are cleaned by `VACUUM`.
- Writers still block other writers modifying the same row.
