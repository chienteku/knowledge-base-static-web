# `pg_dump` / `pg_restore` (Backups)

> **Level 10 — Administration, Security & Production**
> The PostgreSQL command-line utilities used to create logical backup archive files of a database (`pg_dump`) and rebuild databases from those archives during disaster recovery (`pg_restore`).

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The DDL/DML written inside dump files.

---

## 2. Term Category

**Administration / Operations** (Backup & Restore Utilities): `pg_dump` and `pg_restore` generate logical SQL or compressed custom binary backups for database restoration.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Executed in the operating system shell (bash/cmd), not inside the PostgreSQL SQL query terminal. Connects to PostgreSQL over standard network sockets).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Exporting Compressed Logical Database Backups with `pg_dump`

**Scenario:**
Export a compressed custom-format backup of database `store_db` to `/backups/store_db.dump` using `pg_dump`.

**Requirements:**
1. Execute `pg_dump -Fc -d store_db -f /backups/store_db.dump`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> pg_dump -h localhost -U postgres -Fc -d store_db -f /backups/store_db_20260805.dump
> ```
>
> #### Technical Explanation
>
> 1. `pg_dump` extracts a logical schema and data backup from a running PostgreSQL database.
> 2. `-Fc` selects PostgreSQL custom binary archive format (supports compression and parallel restoration).
> 3. Logical backup utility standard.

---

### Exercise 2: Restoring Databases with `pg_restore`

**Scenario:**
Restore compressed backup file `/backups/store_db.dump` into target database `store_db_staging` in parallel using 4 CPU jobs (`-j 4`).

**Requirements:**
1. Execute `pg_restore -d store_db_staging -j 4 /backups/store_db.dump`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> createdb -h localhost -U postgres store_db_staging
> 
> pg_restore -h localhost -U postgres -d store_db_staging -j 4 /backups/store_db_20260805.dump
> ```
>
> #### Technical Explanation
>
> 1. `pg_restore` restores database schemas, tables, indexes, and data from custom `-Fc` dump archives.
> 2. `-j 4` runs restoration tasks across 4 parallel worker threads, speeding up index builds and data loading.
> 3. Standard disaster recovery restoration utility.

---

### Exercise 3: Dumping Single Tables with Data-Only Flags

**Scenario:**
Export ONLY data rows from table `users` as plain text SQL `INSERT` statements using `pg_dump --table --data-only`.

**Requirements:**
1. Execute `pg_dump --table=users --data-only --inserts`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> pg_dump -h localhost -U postgres -d store_db --table=users --data-only --inserts -f /backups/users_data.sql
> ```
>
> #### Technical Explanation
>
> 1. `--table=tablename` restricts logical export to a specific target table.
> 2. `--data-only` omits DDL `CREATE TABLE` statements.
> 3. `--inserts` formats data rows as standard `INSERT INTO` statements.

---



## 6. Related Terms
- [WAL (Write-Ahead Log)](wal.md) — The physical log alternative.
- [Point-in-Time Recovery (PITR)](pitr.md) — Advanced transaction-level recovery.

---

## 7. Key Takeaways
- `pg_dump` creates a logical backup file of a single PostgreSQL database.
- `pg_restore` rebuilds a database from a custom binary `pg_dump` file.
- Non-blocking: Backups run on active databases without interrupting write traffic.
- Custom binary format (`-Fc`) is the standard production choice for compression.
- Plain text SQL formats (`-Fp`) are restored using the `psql -f` command.
- **Security Rule:** Always store backup files offsite in separate network locations.
