# WAL (Write-Ahead Log)

> **Level 10 — Administration, Security & Production**
> PostgreSQL's transactional logging system that records every data modification sequentially to append-only disk log files before writing changes to the actual table data files, guaranteeing crash safety.

---

## 1. Prerequisites
- [ACID Properties](../level_08/acid.md) — The Durability guarantee powered by WAL.
- [`pg_dump` / `pg_restore` (Backups)](pg_dump_restore.md) — Understanding the differences between logical and write-ahead backups.

---

## 2. Term Category
- **PostgreSQL Core Architecture**

---

## 3. Environment Context
- **PostgreSQL Core** (Stored physically as 16MB segment files inside the `pg_wal/` directory. Critical for crash recovery, streaming replication, and Point-in-Time Recovery).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational database tables are split into standard `8KB` blocks (pages) containing row values. 

When you run an `UPDATE` query:
-   The database must update the target row.
-   These rows are scattered randomly across different database files on the hard drive.
-   Writing randomly to different sectors of a hard drive is extremely slow (disk seek latency).

If PostgreSQL was forced to write these random table blocks to disk for every single transaction, the database would choke, and write speeds would drop to a trickle.

We designed the **Write-Ahead Log (WAL)** to solve this performance bottleneck while still protecting Durability (the "D" in ACID).

---

### (2) The WAL Process Flow
Instead of modifying table files directly on disk, Postgres follows a strict pipeline:

1.  **Memory Write:** Postgres modifies the table blocks in volatile RAM (the shared buffers cache).
2.  **Sequential Log:** Postgres appends a binary description of the change to the **WAL file** on disk. Appending to a sequential file is extremely fast (zero disk seek overhead).
3.  **Commit Guarantee:** The transaction is declared committed once the WAL entry is flushed to disk.
4.  **Checkpointing:** At regular intervals (e.g. every 5 minutes), a background process called the **Checkpointer** sweeps RAM and flushes all modified table blocks to the actual table files on disk. This is called a **Checkpoint**.

---

### (3) Crash Recovery
If the database server loses power:
-   All modifications in RAM are lost.
-   The table files on disk are out-of-date or half-written.
-   Upon reboot, PostgreSQL checks the WAL. It finds the last successful Checkpoint, reads the subsequent WAL records, and **replays** the committed modifications sequentially. This restores the database to a perfect state, ensuring zero data loss.

---

### (4) Reality Metaphor
Imagine a busy auto parts warehouse:
-   **No WAL:** Every time a customer buys a spark plug, the clerk runs into the warehouse, finds the shelf, updates the stock count sticker on the box, and runs back. (Slow, exhausting).
-   **With WAL:** The clerk keeps a **Sequential Sales Ledger** notebook on the counter. When a customer buys parts, the clerk quickly scribbles: *"10:05 AM: Sold 2 spark plugs"* (write-ahead log entry) and completes the sale. 
-   At night, when the store is closed, the manager takes the ledger into the warehouse and updates all the shelf stickers at once (the Checkpoint). If the warehouse experiences a power outage mid-day, the ledger notebook preserved the records.

---

### (5) Architecture Pipeline Diagram

```mermaid
graph TD
    A[DML Write Query] --> B[Modify Block in RAM Shared Buffers]
    B --> C[Write Log record to WAL File on disk]
    C --> D[Flushed to Disk: COMMIT returned to Client]
    B -. Checkpointer background sweep .-> E[Flush modified table blocks to disk]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Setting 'synchronous_commit = off' globally without understanding the durability risk

**The mistake:** Disabling synchronous commits in `postgresql.conf` to achieve 5x faster insert speeds, assuming it is a risk-free configuration.

**Why it's wrong:** Setting `synchronous_commit = off` instructs PostgreSQL to return success to the client immediately after updating RAM, *before* flushing the WAL record to disk. 

If the database server crashes or loses power, the last few seconds of committed transactions (orders, payments, registrations) vanish from disk, corrupting user ledgers.

**Fix: Keep `synchronous_commit = on` active for all critical transactions. Only disable it for temporary, non-critical logging tables where losing 2 seconds of history during a power failure is acceptable.**

---



### Mistake 2: Setting `fsync = off` in Production PostgreSQL Server Configurations

**The mistake:** Setting `fsync = off` in `postgresql.conf` to improve write performance.

**Why it's wrong:** `fsync = off` stops PostgreSQL from flushing WAL records to physical disk hardware. A power failure or server crash WILL cause un-recoverable database file corruption!

*Incorrect:*
```sql
fsync = off -- 💥 Causes severe database file corruption on crashes!
```

*Fix:*
```sql
Keep fsync = on enabled in production; use fast NVMe SSD storage instead
```

### Mistake 3: Exhausting Disk Storage Space Due to Un-Consumed WAL Replication Slots

**The mistake:** Creating a replication slot `pg_create_physical_replication_slot('replica1')` and abandoning the replica.

**Why it's wrong:** Active replication slots prevent PostgreSQL from deleting old WAL files until the replica consumes them. An abandoned replication slot accumulates gigabytes of WAL files until the disk is 100% full!

*Incorrect:*
```sql
// Leaving abandoned replication slot active on primary node
```

*Fix:*
```sql
Drop unused replication slots: SELECT pg_drop_replication_slot('replica1');
```

## 6. Practice Exercises

### Exercise 1: Recovery Path Mapping

**Problem:** A database crashes at `12:04 PM`. 
-   The last successful **Checkpoint** completed at `12:00 PM`.
-   Between `12:00 PM` and `12:04 PM`, 500 purchase transactions were committed.
Explain the step-by-step actions the database engine takes upon rebooting to recover the data.

**Expected output:**
> [!check]- Answer
> ```text
> PostgreSQL Recovery Steps:
> 1. The engine reboots and identifies the last valid Checkpoint record at 12:00 PM.
> 2. It scans the WAL files starting from the 12:00 PM log offset forward to the end of the file (12:04 PM).
> 3. It replays (applies) the modifications from the 500 committed purchases to the table files on disk.
> 4. Any uncommitted transaction writes active during the crash are rolled back.
> 5. The database opens for connections, restored to a consistent state.
> ```
> - The database restarts at the last saved checkpoint.
> - Relate the log entries back to the tables on disk.

---



### Exercise 2: WAL System Role Summary

**Problem:** What is the primary role of the Write-Ahead Log (WAL)? (Guarantees Atomicity and Durability by logging data changes to disk BEFORE modifying data heap pages).

**Expected output:**
> [!check]- Answer
> ```text
> Guarantees Atomicity and Durability by logging data changes to disk BEFORE modifying data heap pages
> ```
> ```text
> Guarantees Atomicity and Durability by logging data changes to disk BEFORE modifying data heap pages
> ```
>
> **Explanation:** WAL protocol ensures transaction durability and enables crash recovery.

---

### Exercise 3: Inspecting Replication Slots

**Problem:** Query active replication slots from `pg_replication_slots` to identify abandoned WAL retainers.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT slot_name, active, wal_status FROM pg_replication_slots;
> ```
> ```sql
> SELECT slot_name, active, wal_status FROM pg_replication_slots;
> ```
>
> **Explanation:** `pg_replication_slots` monitors replication slot statuses and WAL retention boundaries.

## 7. Related Terms
- [ACID Properties](../level_08/acid.md) — The Durability guarantee powered by WAL.
- [Point-in-Time Recovery (PITR)](pitr.md) -- Restoring database state using WAL archives.
- [Replication (Streaming / Logical)](replication.md) — Using WAL to sync replica databases.

---

## 8. Key Takeaways
- WAL records data modifications sequentially to disk before writing to table files.
- Protects Durability (ACID) while optimizing database write speeds.
- Writes to WAL are fast, sequential appends; writes to tables are slow, random page I/Os.
- Checkpoints write cached RAM updates to table files, truncating old WAL logs.
- Replays committed WAL logs upon server reboot to repair crash states.
- **Rule of Thumb:** Never turn off `synchronous_commit` for financial or user data.
- Essential engine component for replication sync and Point-in-Time Recovery.
