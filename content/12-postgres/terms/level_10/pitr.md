# Point-in-Time Recovery (PITR)

> **Level 10 — Administration, Security & Production**
> The advanced database disaster recovery strategy that reconstructs the database to any specific millisecond in the past by replaying archived Write-Ahead Log (WAL) files over a physical base backup.

---

## 1. Prerequisites
- [WAL (Write-Ahead Log)](wal.md) — The transaction logs replayed during recovery.
- [`pg_dump` / `pg_restore` (Backups)](pg_dump_restore.md) — The baseline logical backup tools.

---

## 2. Term Category

**Administration / Operations** (Point-In-Time Disaster Recovery): Point-In-Time Recovery (PITR) combines base physical backups with archived WAL files to restore databases to an exact past timestamp.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Requires configuring `archive_mode = on` and setting an `archive_command` in `postgresql.conf`. Recovery target directives are written inside the `postgresql.conf` or `recovery.signal` files depending on the Postgres version).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Configuring Continuous WAL Archiving for PITR

**Scenario:**
Configure `postgresql.conf` parameters `wal_level = replica`, `archive_mode = on`, and `archive_command` for WAL disaster recovery.

**Requirements:**
1. Code `postgresql.conf` WAL archiving parameters.

> [!check]- Answer
>
> #### Implementation
>
> ```ini
> # postgresql.conf
> wal_level = replica
> archive_mode = on
> archive_command = 'cp %p /var/lib/pg_archive/%f'
> ```
>
> #### Technical Explanation
>
> 1. `wal_level = replica` writes full transaction log information to WAL files.
> 2. `archive_mode = on` activates automatic continuous WAL archiving.
> 3. `archive_command` copies completed 16MB WAL segment files to secure backup storage.

---

### Exercise 2: Restoring Databases to an Exact Past Timestamp

**Scenario:**
Configure `recovery.signal` and `restore_command` to perform Point-In-Time Recovery to `2026-08-05 14:30:00 UTC`.

**Requirements:**
1. Code `recovery.signal` and `recovery_target_time` parameters.

> [!check]- Answer
>
> #### Implementation
>
> ```ini
> # postgresql.conf (Recovery Settings)
> restore_command = 'cp /var/lib/pg_archive/%f %p'
> recovery_target_time = '2026-08-05 14:30:00 UTC'
> recovery_target_action = 'promote'
> ```
>
> #### Technical Explanation
>
> 1. Touch file `recovery.signal` puts PostgreSQL into recovery mode upon startup.
> 2. `restore_command` fetches archived WAL files sequentially.
> 3. `recovery_target_time` stops WAL replay at the exact target timestamp, restoring database state right before a disaster occurred.

---

### Exercise 3: Validating Disaster Recovery Timelines

**Scenario:**
Explain how PostgreSQL recovery timelines prevent overwriting archived WAL files during recovery promotion.

**Requirements:**
1. Explain PostgreSQL timeline IDs and recovery history files.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Recovery Timeline Architecture:
> - Initial Timeline (Timeline 1): Standard database production operation line.
> - Promotion Event (PITR Recovery): Upon reaching target recovery time, PostgreSQL increments timeline ID to Timeline 2!
> - Benefit: Prevents new post-recovery WAL writes from overwriting historical Timeline 1 WAL archives.
> ```
>
> #### Technical Explanation
>
> 1. Timelines branch WAL history whenever a database is promoted out of recovery mode.
> 2. Guarantees historical WAL archives remain immutable.
> 3. Advanced disaster recovery architecture.

---



## 6. Related Terms
- [WAL (Write-Ahead Log)](wal.md) — The physical log files.
- [`pg_dump` / `pg_restore` (Backups)](pg_dump_restore.md) — Logical alternatives.
- [Replication (Streaming / Logical)](replication.md) — Related concept: Replication (Streaming / Logical).

---

## 7. Key Takeaways
- PITR restores database states to any specific timestamp in the past.
- Combines a physical filesystem base backup with archived WAL logs.
- Prevents transaction data loss caused by mid-day deletions or corruptions.
- Requires enabling `archive_mode` and defining an `archive_command`.
- Controlled during recovery using `recovery_target_time` parameters.
- Restores are much faster than importing large logical SQL dump scripts.
- **Best Practice:** Automate sandbox recovery drills to verify WAL logs.
