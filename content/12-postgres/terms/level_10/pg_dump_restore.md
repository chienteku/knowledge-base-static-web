# `pg_dump` / `pg_restore` (Backups)

> **Level 10 — Administration, Security & Production**
> The PostgreSQL command-line utilities used to create logical backup archive files of a database (`pg_dump`) and rebuild databases from those archives during disaster recovery (`pg_restore`).

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The DDL/DML written inside dump files.
---

## 2. Term Category
- **Database Command-Line Tool**

---

## 3. Environment Context
- **PostgreSQL Core** (Executed in the operating system shell (bash/cmd), not inside the PostgreSQL SQL query terminal. Connects to PostgreSQL over standard network sockets).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
The first rule of database administration is: **always have backups.**

If a database server experiences a hardware failure, an accidental `DROP TABLE` command, or a ransomware attack, your company will lose its entire history. 

We need a tool to export the database structure (DDL) and rows (DML) into a portable file that can be saved offsite.

PostgreSQL designed **`pg_dump`** and **`pg_restore`** to handle this.

`pg_dump` is **logical backup** tool. 

It reads a stable MVCC snapshot of your database in the background and writes the data to a file. 

Because it uses snapshots, **`pg_dump` does not block users from reading or writing to the database while the backup is running.** 

You can back up a live production database at noon without impacting active clients.

---

### (2) Backup Formats
-   **SQL Script (Plain text):** Outputs a file containing raw SQL text commands (`CREATE TABLE`, `INSERT`). (Easy to inspect, but slow to restore on large databases).
-   **Custom Archive (Binary `-Fc`):** Outputs a compressed binary file. (Smaller file size, supports parallel multi-threaded restoring, the standard choice for production).

---

### (3) Reality Metaphor
Imagine rebuilding a wooden house:
-   **`pg_dump`** is like hiring an architect to catalog your house. The architect measures the walls, counts the windows, lists the furniture, and writes it all down inside a **Blueprint Schematic Folder** (the dump file).
-   **`pg_restore`** is like handing the Blueprint Schematic Folder to a construction crew on a new vacant lot. The crew reads the blueprints and rebuilds an exact replica of the original house.

---

### (4) Code Examples

*Note: These commands are executed in your terminal shell, not inside the SQL client.*

#### 1. Creating a Compressed Binary Backup (pg_dump)
```bash
# Dump the 'production_db' database to a compressed binary archive file
pg_dump -h localhost -U postgres -F c -b -v -f production_backup.dump production_db
```
-   `-F c`: Output as custom binary archive format.
-   `-b`: Include large binary objects.
-   `-v`: Verbose output (show logs).
-   `-f`: Target filename.

#### 2. Restoring a Database from the Archive (pg_restore)
```bash
# Rebuild the backup file into a blank database named 'recovery_db'
pg_restore -h localhost -U postgres -d recovery_db -v production_backup.dump
```
-   `-d`: Target database to write into.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Saving backup dump files on the database server's local hard drive without offsite replication

**The mistake:** Running daily cron jobs that run `pg_dump` and save the files to `/var/lib/postgresql/backups/` on the same physical server.

**Why it's wrong:** If the server's hard drive experiences a physical failure, the drive is completely dead. 

You lose the active database files *and* all your backup files at the same time, making recovery impossible.

**Fix: Always transfer backup files offsite immediately after creation. Upload them to secure cloud buckets (like AWS S3 or Google Cloud Storage) or separate backup servers located in different geographical regions.**

---



### Mistake 2: Using Plain Text Format (`-Fp`) for Heavy Multi-Gigabyte Backups

**The mistake:** Running `pg_dump dbname > backup.sql` for a 200GB production database.

**Why it's wrong:** Plain text `.sql` dumps cannot be restored in parallel! Custom directory format (`-Fd`) allows parallel restore (`pg_restore -j 8`) using 8 CPU cores.

*Incorrect:*
```sql
pg_dump dbname > backup.sql -- ❌ Single-threaded slow restore!
```

*Fix:*
```sql
pg_dump -Fd -j 8 -f /backup_dir dbname -- Parallel custom directory dump
```

### Mistake 3: Attempting to Use `pg_restore` on Plain Text SQL Dumps

**The mistake:** Running `pg_restore -d dbname backup.sql` on a plain text SQL file.

**Why it's wrong:** `pg_restore` works ONLY on Custom (`-Fc`) or Directory (`-Fd`) archive formats! Plain text `.sql` files must be restored using `psql -d dbname -f backup.sql`.

*Incorrect:*
```sql
pg_restore -d dbname backup.sql -- ❌ Error: input file does not appear to be a valid archive!
```

*Fix:*
```sql
psql -d dbname -f backup.sql -- Use psql for plain text SQL dumps
```

## 6. Practice Exercises

### Exercise 1: Backup Script Shell Commands

**Problem:** You are writing a deployment script. Write the operating system terminal command to:
1.  Back up a database named `ecom_store` to a file named `store.sql` in plain SQL text format (hint: use the format flag `-F p` for plain text).
2.  Write the restore command to execute that SQL script backup file against a database named `ecom_restore` (hint: plain text SQL dumps are executed using standard client terminals like `psql -f`, not `pg_restore`!).

**Expected output:**
> [!check]- Answer
> ```bash
> # 1. Backup to SQL script
> pg_dump -h localhost -U postgres -F p -f store.sql ecom_store
> 
> # 2. Restore plain text SQL script
> psql -h localhost -U postgres -d ecom_restore -f store.sql
> ```
> - Differentiate plain text SQL files (restored via `psql -f`) from binary custom archives (restored via `pg_restore`).
> - Specify host `-h` and user `-U` flags.

---



### Exercise 2: Parallel Directory Dump Command

**Problem:** CLI command running parallel `pg_dump` with 4 jobs in directory format (`-Fd`).

**Expected output:**
> [!check]- Answer
> ```text
> pg_dump -Fd -j 4 -f /backups/db_dump prod_db
> ```
> ```bash
> pg_dump -Fd -j 4 -f /backups/db_dump prod_db
> ```
>
> **Explanation:** `pg_dump -Fd -j N` performs high-speed multi-threaded directory backups.

---

### Exercise 3: Parallel Restore Command

**Problem:** CLI command restoring custom format dump `/backups/db.dump` using `pg_restore` with 4 jobs.

**Expected output:**
> [!check]- Answer
> ```text
> pg_restore -d target_db -j 4 /backups/db.dump
> ```
> ```bash
> pg_restore -d target_db -j 4 /backups/db.dump
> ```
>
> **Explanation:** `pg_restore -j N` restores database schemas and data in parallel across N CPU threads.

## 7. Related Terms
- [WAL (Write-Ahead Log)](wal.md) — The physical log alternative.
- [Point-in-Time Recovery (PITR)](pitr.md) — Advanced transaction-level recovery.
---

## 8. Key Takeaways
- `pg_dump` creates a logical backup file of a single PostgreSQL database.
- `pg_restore` rebuilds a database from a custom binary `pg_dump` file.
- Non-blocking: Backups run on active databases without interrupting write traffic.
- Custom binary format (`-Fc`) is the standard production choice for compression.
- Plain text SQL formats (`-Fp`) are restored using the `psql -f` command.
- **Security Rule:** Always store backup files offsite in separate network locations.
