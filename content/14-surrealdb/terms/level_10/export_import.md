# `surreal export` / `surreal import` (Backups)

> **Level 10 — SDKs, Deployment & Production**
> The SurrealDB CLI commands for generating logical database backup files (`.surql`) and restoring schema definitions and record data into a database instance.

---

## 1. Prerequisites
- [SurrealDB CLI (`surreal sql`)](../level_01/surreal_cli.md) — CLI binary basics.
- [Namespace & Database](../level_01/namespace_database.md) — Database boundaries.

---

## 2. Term Category
- **CLI Commands & Backup**

---

## 3. Environment Context
- **Terminal CLI & CI/CD Pipelines** (Executed by administrators, cron backup jobs, or migration scripts).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Backing up database schemas and data is a fundamental production requirement. PostgreSQL relies on `pg_dump` and `pg_restore`; MongoDB relies on `mongodump` and `mongorestore`.

SurrealDB provides two CLI commands:
- **`surreal export`**: Connects to a target SurrealDB instance, reads all schema definitions (`DEFINE TABLE`, `DEFINE FIELD`, `DEFINE INDEX`, `DEFINE ACCESS`) and data records, and exports them into a single plain-text SurrealQL script file (`.surql`).
- **`surreal import`**: Reads a `.surql` script file and executes all contained statements in sequence to recreate tables, schema rules, and data records in the target database.

Because exported files are human-readable SurrealQL scripts, developers can inspect exports in text editors, track schema versions in Git, or seed local development databases from production exports.

### (2) Reality Metaphor
Think of audio recording:
- **`surreal export`**: Recording a live concert into a high-fidelity master audio file (`backup.surql`).
- **`surreal import`**: Inserting the audio file into a sound system to replay the concert performance note-for-note.

### (3) Code Examples

#### Short Snippet
```bash
# Export database schema and records to a .surql backup file
surreal export --conn http://localhost:8000 --user root --pass root \
  --ns production --db main backup.surql
```

#### Fuller Example
```bash
# 1. Export production database into a compressed SQL script
surreal export \
  --conn https://db.example.com \
  --user root \
  --pass "StrongSecretPass123" \
  --ns company_ns \
  --db production_db \
  production_backup_$(date +%Y%m%d).surql

# 2. Import backup file into local development database instance
surreal import \
  --conn http://localhost:8000 \
  --user root \
  --pass root \
  --ns dev_ns \
  --db dev_db \
  production_backup_20260722.surql
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Importing Exports into Databases with Conflicting Schema Definitions

**The mistake:** Running `surreal import` into a target database that already contains partial or conflicting `SCHEMAFULL` definitions.

**Why it's wrong:** If existing tables on the target database reject fields or have strict constraints that conflict with imported records, the import process encounters errors.

*Fix:*
```bash
# Ensure target database is clean or use migration scripts when seeding data
surreal import --conn http://localhost:8000 --user root --pass root --ns dev_ns --db dev_db backup.surql
```

---



### Mistake 2: Executing `surreal import` Against Production Without Specifying Active Namespace and Database

**The mistake:** Importing a SQL dump without `--ns` and `--db` flags.

**Why it's wrong:** Omitting `--ns` and `--db` flags imports data into un-intended default namespaces or fails with missing target scope errors.

*Incorrect:*
```surrealql
$ surreal import --endpoint http://localhost:8000 -u root -p root dump.surql # ❌ Missing NS/DB!
```

*Fix:*
```surrealql
$ surreal import --endpoint http://localhost:8000 -u root -p root --ns main --db app dump.surql
```

### Mistake 3: Confusing CLI Dump Files (`.surql`) with Raw Binary Disk Data Files

**The mistake:** Attempting to copy raw RocksDB data files between different OS architectures directly.

**Why it's wrong:** Raw binary database files may have OS-specific binary layouts. Use `surreal export` to generate portable text SQL dumps.

*Incorrect:*
```surrealql
-- Copying binary rocksdb data files across OS platforms
```

*Fix:*
```surrealql
Use surreal export dump.surql and surreal import dump.surql for cross-platform migrations
```



### Mistake 4: Executing `surreal import` Against Production Without Specifying Active Namespace and Database

**The mistake:** Importing a SQL dump without `--ns` and `--db` flags.

**Why it's wrong:** Omitting `--ns` and `--db` flags imports data into un-intended default namespaces or fails with missing target scope errors.

*Incorrect:*
```surrealql
$ surreal import --endpoint http://localhost:8000 -u root -p root dump.surql # ❌ Missing NS/DB!
```

*Fix:*
```surrealql
$ surreal import --endpoint http://localhost:8000 -u root -p root --ns main --db app dump.surql
```

### Mistake 5: Confusing CLI Dump Files (`.surql`) with Raw Binary Disk Data Files

**The mistake:** Attempting to copy raw RocksDB data files between different OS architectures directly.

**Why it's wrong:** Raw binary database files may have OS-specific binary layouts. Use `surreal export` to generate portable text SQL dumps.

*Incorrect:*
```surrealql
-- Copying binary rocksdb data files across OS platforms
```

*Fix:*
```surrealql
Use surreal export dump.surql and surreal import dump.surql for cross-platform migrations
```

## 6. Practice Exercises

### Exercise 1: Identify CLI Backup Commands
Match the action to the CLI command name:
1. Recreating database schema and data from a `.surql` file.
2. Generating a `.surql` backup script file from a running database.

a. `surreal export`
b. `surreal import`

> [!check]- Answer
> - 1 = b (`surreal import`).
> - 2 = a (`surreal export`).

---



### Exercise 2: Exporting Specific Database to SQL Dump

**Problem:** Write CLI command exporting NS `prod` DB `main` to `export.surql`.

**Expected output:**
```text
surreal export --endpoint http://localhost:8000 -u root -p root --ns prod --db main export.surql
```

> [!check]- Answer
> ```text
> surreal export --endpoint http://localhost:8000 -u root -p root --ns prod --db main export.surql
> ```
>
> **Explanation:** `surreal export` generates portable SQL schema and record text dumps.

### Exercise 3: Importing SQL Dump File

**Problem:** Write CLI command importing `export.surql` into NS `dev` DB `test`.

**Expected output:**
```text
surreal import --endpoint http://localhost:8000 -u root -p root --ns dev --db test export.surql
```

> [!check]- Answer
> ```text
> surreal import --endpoint http://localhost:8000 -u root -p root --ns dev --db test export.surql
> ```
>
> **Explanation:** `surreal import` restores database schemas and data records from SQL files.



### Exercise 4: Exporting Specific Database to SQL Dump

**Problem:** Write CLI command exporting NS `prod` DB `main` to `export.surql`.

**Expected output:**
```text
surreal export --endpoint http://localhost:8000 -u root -p root --ns prod --db main export.surql
```

> [!check]- Answer
> ```text
> surreal export --endpoint http://localhost:8000 -u root -p root --ns prod --db main export.surql
> ```
>
> **Explanation:** `surreal export` generates portable SQL schema and record text dumps.

### Exercise 5: Importing SQL Dump File

**Problem:** Write CLI command importing `export.surql` into NS `dev` DB `test`.

**Expected output:**
```text
surreal import --endpoint http://localhost:8000 -u root -p root --ns dev --db test export.surql
```

> [!check]- Answer
> ```text
> surreal import --endpoint http://localhost:8000 -u root -p root --ns dev --db test export.surql
> ```
>
> **Explanation:** `surreal import` restores database schemas and data records from SQL files.

## 7. Related Terms
- [SurrealDB CLI (`surreal sql`)](../level_01/surreal_cli.md) — Interactive CLI console.
- [`surreal validate` (Query Validation)](surreal_validate.md) — Pre-flight syntax validation.
- [Data Migrations in SurrealDB](data_migrations.md) — Schema evolution strategies.

---

## 8. Key Takeaways
- `surreal export` generates human-readable `.surql` backup scripts.
- `surreal import` executes `.surql` scripts to restore schema and data records.
- Plain-text `.surql` exports allow versioning database schemas in Git and seeding local development environments.
