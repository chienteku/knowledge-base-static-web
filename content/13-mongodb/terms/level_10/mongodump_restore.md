# `mongodump` / `mongorestore` (Backups)

> **Level 10 — Administration, Security & Advanced Features**
> The command-line database backup and recovery utilities that export collections into binary BSON and metadata JSON files (`mongodump`) or import them back to recreate collections and rebuild indexes (`mongorestore`), serving as the equivalent to PostgreSQL's `pg_dump` and `pg_restore`.

---

## 1. Prerequisites

- [Database (MongoDB Context)](../level_01/database_context.md) — The target database process connection.

---

## 2. Term Category

**Administration / Operations** (BSON Backup & Restore Utilities): mongodump and mongorestore are CLI utilities for creating compressed BSON binary database backups and restoring collection snapshots.



---

## 3. Explanation

### Environment Context
- **Operating System Shell** (Standalone terminal executable commands run in the bash/linux console. They are **not** run inside the `mongosh` database shell).

### (1) Design Motivation — "Why did we design this?"
To protect against system crashes, administrator errors, or ransom attacks, you must maintain backups of your database.

In PostgreSQL, you export tables using:
`pg_dump -U username dbname > backup.sql`

We designed **`mongodump`** and **`mongorestore`** to perform this task in MongoDB. 

They are high-performance utility tools. 

Instead of exporting data to slow, human-readable JSON files (which lose BSON data type information like specific Int vs. Double bounds), `mongodump` streams the raw binary BSON blocks from the database directly onto your disk files. 

This guarantees that data types, binary files, and indexes are preserved exactly.

---

### (2) The Export Formats
When you run `mongodump`, it creates a directory containing two file types per collection:
1.  **`.bson` Files:** The raw binary BSON document bytes.
2.  **`.metadata.json` Files:** The index definitions and collection settings.

When `mongorestore` reads this directory, it uses the `.bson` files to populate the documents and automatically reads the `.metadata.json` files to rebuild all collection indexes, saving you from having to recreate indexes manually.

---

### (3) Reality Metaphor (Office Photocopying)
Imagine backing up a paper medical files archive room:
-   **`mongodump`:** You make photocopies of all client folders, bind the sheets into cardboard boxes (the BSON files), and write down the shelf names and index sorting rules in a notebook (the metadata JSON).
-   **`mongorestore`:** You take those cardboard boxes to an empty room. 
    -   You read the notebook to install matching shelves and index dividers (index rebuild).
    -   You place the sheets back into the drawers. 
    -   The filing system is restored.

---

### (4) Code Examples

#### Running Backups in the Linux Terminal
These commands are run in your standard shell, not inside `mongosh`:

```bash
# 1. Back up the 'shop' database, compressing the output with gzip
mongodump --db shop --out /backups/july-2026 --gzip

# This creates a folder: /backups/july-2026/shop/
# containing user.bson.gz, user.metadata.json.gz, etc.

# 2. Restore the backup to a local database, rebuilding all indexes
mongorestore --db shop_restore /backups/july-2026/shop --gzip
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to execute the 'mongodump' or 'mongorestore' commands inside the 'mongosh' javascript shell prompt

**The mistake:** Connecting to the database via `mongosh` and typing `mongodump --db shop` inside the database prompt, resulting in syntax and reference errors.

**Why it's wrong:** `mongodump` and `mongorestore` are standalone, compiled binary executables managed by the operating system shell. 

They are not JavaScript functions, so the `mongosh` interpreter does not understand them.

**Fix: Exit the `mongosh` shell (or open a new terminal tab) and run `mongodump` directly in your operating system command line prompt.**

---



### Mistake 2: Using `mongodump` for Multi-Terabyte Live Production Database Backups

**The mistake:** Running `mongodump` against a 5TB production cluster during business hours.

**Why it's wrong:** `mongodump` executes query scans across all collections, causing heavy CPU and WiredTiger cache pressure. For large databases, use Atlas Continuous Backups or LVM/EBS Volume Snapshots.

*Incorrect:*
```javascript
$ mongodump --uri "mongodb://prod:27017" # ❌ Scans 5TB live database!
```

*Fix:*
```javascript
Use Cloud Storage Volume Snapshots (AWS EBS / GCP Persistent Disk) or Atlas Backups
```

### Mistake 3: Restoring Dumps with `mongorestore` Without Specifying `--drop` Flag on Existing Collections

**The mistake:** Restoring a dump file into a database containing partial legacy data without `--drop`.

**Why it's wrong:** Without `--drop`, `mongorestore` merges dump records into existing collections, causing `E11000` duplicate key collisions.

*Incorrect:*
```javascript
$ mongorestore --db app dump/app # Merges into existing dirty collection
```

*Fix:*
```javascript
$ mongorestore --db app --drop dump/app # Drops existing collection before restore
```

## 5. Practice Exercises

### Exercise 1: Exporting Database Backups with `mongodump`

**Scenario:**
Export a compressed BSON backup of database `store_db` to directory `/backups/2026-08-05` using `mongodump`.

**Requirements:**
1. Execute `mongodump --db=store_db --out=/backups/2026-08-05 --gzip`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> mongodump --uri="mongodb+srv://user:pass@cluster0.abc.mongodb.net/store_db" >   --out=/backups/2026-08-05 >   --gzip
> ```
>
> #### Technical Explanation
>
> 1. `mongodump` exports collection data as raw binary BSON files alongside JSON metadata definitions.
> 2. `--gzip` compresses output files to minimize backup disk storage.
> 3. Standard CLI utility for logical database backups.

---

### Exercise 2: Restoring Database Backups with `mongorestore`

**Scenario:**
Restore compressed database backup `/backups/2026-08-05/store_db` into target database `store_db_restored` using `mongorestore`.

**Requirements:**
1. Execute `mongorestore --db=store_db_restored --gzip`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> mongorestore --uri="mongodb://localhost:27017" >   --db=store_db_restored >   --gzip >   /backups/2026-08-05/store_db
> ```
>
> #### Technical Explanation
>
> 1. `mongorestore` parses BSON backup files and inserts documents and secondary indexes into target collections.
> 2. `--nsInclude` or `--db` allows restoring backups under new database namespace names.
> 3. Core command for disaster recovery and staging environment populating.

---

### Exercise 3: Point-in-Time Oplog Backup Restoration

**Scenario:**
Perform a point-in-time backup restoration using `mongodump --oplog` and `mongorestore --oplogReplay`.

**Requirements:**
1. Explain `--oplog` capture during logical dumps.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # 1. Capture dump with active oplog
> mongodump --uri="..." --oplog --out=/backups/pit_dump
> 
> # 2. Restore with oplog replay to capture writes that occurred during dump execution
> mongorestore --uri="..." --oplogReplay /backups/pit_dump
> ```
>
> #### Technical Explanation
>
> 1. `--oplog` captures oplog entries generated while `mongodump` was running.
> 2. `--oplogReplay` replays those oplog entries after restoring BSON files, ensuring point-in-time transactional consistency.
> 3. Prevents dirty backup state in high-write production databases.

---



## 6. Related Terms

- [Database (MongoDB Context)](../level_01/database_context.md) — The single `mongod` process.

---

## 7. Key Takeaways
- `mongodump` exports databases to disk; `mongorestore` restores them.
- Direct NoSQL equivalent to SQL's `pg_dump` and `pg_restore` utilities.
- Executed inside the operating system terminal, not inside the `mongosh` shell.
- Exports collections as binary `.bson` files and index mappings as `.metadata.json`.
- The `.metadata.json` file allows `mongorestore` to rebuild indexes automatically.
- Use the `--gzip` flag to save disk space and reduce network load.
- Essential for migrating database snapshots between local staging and cloud staging.
