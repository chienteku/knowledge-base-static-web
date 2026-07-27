# `mongodump` / `mongorestore` (Backups)

> **Level 10 — Administration, Security & Advanced Features**
> The command-line database backup and recovery utilities that export collections into binary BSON and metadata JSON files (`mongodump`) or import them back to recreate collections and rebuild indexes (`mongorestore`), serving as the equivalent to PostgreSQL's `pg_dump` and `pg_restore`.

---

## 1. Prerequisites
- [Database Context (Running processes)](../level_01/database_context.md) — The target database process connection.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **Operating System Shell** (Standalone terminal executable commands run in the bash/linux console. They are **not** run inside the `mongosh` database shell).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Backup Command Construction

**Problem:** You need to backup your production database. 
-   Database name: `"analytics"`
-   Host: `"production-db.example.com"`
-   Port: `"27017"`
-   Output folder path: `"/data/backup"`
Write the terminal command to execute this, using gzip compression.

**Expected output:**
```bash
mongodump --host production-db.example.com --port 27017 --db analytics --out /data/backup --gzip
```

> [!check]- Answer
> - The host parameter is `--host`; the database parameter is `--db`.
> - Include the `--gzip` flag at the end to compress files.

---



### Exercise 2: Exporting Single Collection Dump

**Problem:** CLI command to dump `users` collection from database `app` to directory `backup`.

**Expected output:**
```text
mongodump --db app --collection users --out backup
```

> [!check]- Answer
> ```bash
> mongodump --db app --collection users --out backup
> ```
>
> **Explanation:** `mongodump` exports collection BSON documents and index metadata.

### Exercise 3: Restoring Database Dump

**Problem:** CLI command to restore database `app` from `backup/app` directory dropping existing collections.

**Expected output:**
```text
mongorestore --db app --drop backup/app
```

> [!check]- Answer
> ```bash
> mongorestore --db app --drop backup/app
> ```
>
> **Explanation:** `mongorestore` restores BSON data dumps into target database collections.

## 7. Related Terms
- [Database Context (Running processes)](../level_01/database_context.md) — The single `mongod` process.

---

## 8. Key Takeaways
- `mongodump` exports databases to disk; `mongorestore` restores them.
- Direct NoSQL equivalent to SQL's `pg_dump` and `pg_restore` utilities.
- Executed inside the operating system terminal, not inside the `mongosh` shell.
- Exports collections as binary `.bson` files and index mappings as `.metadata.json`.
- The `.metadata.json` file allows `mongorestore` to rebuild indexes automatically.
- Use the `--gzip` flag to save disk space and reduce network load.
- Essential for migrating database snapshots between local staging and cloud staging.
