# Point-in-Time Recovery (PITR)

> **Level 10 — Administration, Security & Production**
> The advanced database disaster recovery strategy that reconstructs the database to any specific millisecond in the past by replaying archived Write-Ahead Log (WAL) files over a physical base backup.

---

## 1. Prerequisites
- [WAL (Write-Ahead Log)](wal.md) — The transaction logs replayed during recovery.
- [`pg_dump` / `pg_restore` (Backups)](pg_dump_restore.md) — The baseline logical backup tools.

---

## 2. Term Category
- **Database Administration / Security**

---

## 3. Environment Context
- **PostgreSQL Core** (Requires configuring `archive_mode = on` and setting an `archive_command` in `postgresql.conf`. Recovery target directives are written inside the `postgresql.conf` or `recovery.signal` files depending on the Postgres version).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Logical backups (`pg_dump`) are excellent for small databases. 

However, they carry two severe limitations:
1.  **Size bottlenecks:** Running `pg_dump` on a 5 Terabyte database takes hours, consumes massive server resources, and is slow to restore.
2.  **Snapshot Gaps:** A dump only captures a single moment in time (e.g. midnight). If a developer accidentally runs an un-filtered `DELETE` query at `2:15 PM`, restoring the midnight backup means you **lose 14 hours of production data**.

We designed **Point-in-Time Recovery (PITR)** to solve this transaction-loss problem. 

Instead of exporting text representations, PITR uses physical data blocks:
1.  **Base Backup:** You take a raw file copy of the database data directory (using `pg_basebackup`) periodically (e.g. once a week on Sunday).
2.  **WAL Archiving:** You instruct PostgreSQL to continuously copy completed WAL segment files (which record every single write transaction!) to a secure offsite archive bucket (like AWS S3) as they are created.
3.  **Targeted Replay:** If a deletion disaster occurs on Tuesday at `2:15 PM`, you restore the Sunday base backup files. You then write a recovery configuration file setting:
    `recovery_target_time = '2026-07-21 14:14:59'`
    Upon boot, Postgres reads the WAL archives and **replays every committed query in sequence**, stopping at the exact second before the deletion occurred.

---

### (2) pg_dump vs. PITR

| Dimension | Logical Backup (`pg_dump`) | PITR (Physical Archive) |
| :--- | :--- | :--- |
| **Backup Speed** | Slow on large databases. | Fast (direct file copy). |
| **Granularity** | Single snapshot (e.g. daily). | Continuous (millisecond precision). |
| **Recovery Speed** | Slow (must parse SQL DDL/DML). | Very fast (binary block copies). |
| **Target Scale** | Small to medium databases. | Large, enterprise-scale databases. |

---

### (3) Reality Metaphor (Video Tape Slider)
-   **`pg_dump`:** Taking a single **Polaroid Photograph** of your living room at midnight. You see that exact frame, but have no record of what happened at noon.
-   **PITR:** Recording a continuous security **Videotape** (the WAL archives) alongside a reference photo (the base backup). If a thief steals a vase at `2:15 PM`, you rewind the videotape, hit play, and pause the recording at `2:14 PM`—restoring the living room state right before the theft.

---

### (4) Code Examples

#### 1. Configuring WAL Archiving in `postgresql.conf`
To enable continuous logging, you must set these parameters on your database server:

```text
# Enable archiving mode
archive_mode = on

# Command executed to copy WAL segments to safe storage (e.g., AWS S3 bucket)
archive_command = 'aws s3 cp %p s3://my-db-backups/wal/%f'

# %p is the path to the completed local WAL file
# %f is the filename of the segment
```

#### 2. Restoring to a Target Timestamp
To restore, copy the base backup files back to the server data folder. 

Create a file named **`recovery.signal`** in the data directory (which tells Postgres to start in recovery mode), and append the target time to `postgresql.conf`:

```text
# Target settings inside postgresql.conf during recovery
restore_command = 'aws s3 cp s3://my-db-backups/wal/%f %p'
recovery_target_time = '2026-07-21 14:14:59'
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Failing to regularly test your PITR restore configuration in a staging sandbox

**The mistake:** Configuring WAL archiving and assuming your company is safe, but never attempting to run a restore until an actual production server crash occurs.

**Why it's wrong:** PITR requires complex coordination: the base backup must match the WAL segment sequence. 

If your `archive_command` had a syntax error, or if your S3 write permissions failed, you will discover that your WAL archives are corrupted or missing only after you have lost your production data, resulting in company bankruptcy.

**Fix: Schedule monthly "disaster drills" where DBA scripts automate restoring a base backup and replaying WAL files to a staging server to verify recovery validity.**

---



### Mistake 2: Omitting Continuous Write-Ahead Log (WAL) Archiving When Configuring PITR

**The mistake:** Taking weekly base backups without enabling `archive_mode = on` and `archive_command`.

**Why it's wrong:** Point-in-Time Recovery (PITR) REQUIRES a base backup AND continuous WAL segment archives. Without WAL archiving, you can restore ONLY to the exact instant of the base backup.

*Incorrect:*
```sql
// Base backup without WAL archiving
```

*Fix:*
```sql
Enable archive_mode = on and configure WAL archiving command (e.g. pgBackRest / WAL-G)
```

### Mistake 3: Setting `recovery_target_time` Without Testing Restoration Scenarios

**The mistake:** Restoring production database to a target timestamp without verifying exact transaction commit times.

**Why it's wrong:** Restoring to an incorrect timestamp can recover data prior to an accidental drop or miss critical transactions. Verify target timestamps using WAL log inspection tools.

*Incorrect:*
```sql
// Restoring to target time without verifying WAL segment timestamps
```

*Fix:*
```sql
Inspect WAL logs or pgBackRest info before setting recovery_target_time
```

## 6. Practice Exercises

### Exercise 1: Recovery Decision Audit

**Problem:** You are the Lead Database Administrator. A junior developer runs an unauthorized database update at `10:30:15 AM`, corrupting client transaction rates. 
1.  Explain why `pg_dump` is insufficient to resolve this issue.
2.  Write the recovery target parameter value you would set to resolve this with PITR.

**Expected output:**
```text
1. pg_dump is insufficient because it only captures daily snapshots (e.g. at midnight). If we restored the midnight dump, we would lose all valid customer transactions that occurred between midnight and 10:30 AM.
```
```text
2. recovery_target_time = '2026-07-21 10:30:14' -- Replay stopped exactly one second before the corruption.
```

> [!check]- Answer
> - Evaluate the time gaps of data loss.
> - Target the timestamp immediately preceding the developer's update.

---



### Exercise 2: Configuring Recovery Target Time in postgresql.conf

**Problem:** Set PITR target recovery timestamp to `'2026-07-24 14:00:00 UTC'`.

**Expected output:**
```text
recovery_target_time = '2026-07-24 14:00:00 UTC'
```

> [!check]- Answer
> ```text
> recovery_target_time = '2026-07-24 14:00:00 UTC'
> ```
>
> **Explanation:** `recovery_target_time` specifies the exact point-in-time boundary for WAL replay.

### Exercise 3: Core Components of PITR

**Problem:** List 2 essential prerequisites for Point-in-Time Recovery (1. Physical Base Backup; 2. Continuous Write-Ahead Log WAL Archives).

**Expected output:**
```text
1. Physical Base Backup; 2. Continuous Write-Ahead Log (WAL) Archives
```

> [!check]- Answer
> ```text
> 1. Physical Base Backup; 2. Continuous Write-Ahead Log (WAL) Archives
> ```
>
> **Explanation:** Replaying archived WAL segments over a physical base backup restores databases to arbitrary historical seconds.

## 7. Related Terms
- [WAL (Write-Ahead Log)](wal.md) — The physical log files.
- [`pg_dump` / `pg_restore` (Backups)](pg_dump_restore.md) — Logical alternatives.

---

## 8. Key Takeaways
- PITR restores database states to any specific timestamp in the past.
- Combines a physical filesystem base backup with archived WAL logs.
- Prevents transaction data loss caused by mid-day deletions or corruptions.
- Requires enabling `archive_mode` and defining an `archive_command`.
- Controlled during recovery using `recovery_target_time` parameters.
- Restores are much faster than importing large logical SQL dump scripts.
- **Best Practice:** Automate sandbox recovery drills to verify WAL logs.
