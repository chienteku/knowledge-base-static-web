# `CREATE DATABASE` / `DROP DATABASE`

> **Level 1 — What Is a Database?**
> SQL DDL commands used to initialize a new, isolated database container on the server, or to permanently destroy an existing database along with all its schemas, tables, and records.

---

## 1. Prerequisites
- [PostgreSQL (Postgres)](postgresql.md) — The host server where databases are created.
- [SQL (Structured Query Language)](sql.md) — The language schema query syntax.

---

## 2. Term Category
- **SQL DDL Statement**

---

## 3. Environment Context
- **PostgreSQL Core DDL** (Standard commands. In Postgres, you cannot execute these statements inside active transaction blocks).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When you start a new software project (like a blogging app, or a billing service), you need a completely fresh, isolated sandbox to store all your data tables. 

You do not want your billing tables mixing with your blog tables.

To manage the lifecycle of these isolated environments, SQL provides two primary administrative commands:
-   **`CREATE DATABASE`**: Tells the Postgres server to build a fresh, separate database container. It copies a default system template (usually `template1`) to allocate a new physical directory on the disk drive.
-   **`DROP DATABASE`**: Tells the server to permanently delete the database container, immediately wiping all physical directories, tables, and rows of data off the hard drive.

---

### (2) Crucial Safety Warnings
In database systems, **`DROP` commands are irreversible**. 

Unlike deleting a file on your computer, there is no "Trash Can" or "Recycle Bin" for databases. 

Once you hit Enter on a `DROP DATABASE` command, the data is instantly deleted from disk. 

The only way to recover it is if you already have an external backup file (a database dump).

---

### (3) Reality Metaphor
Imagine a records department office room:
-   **`CREATE DATABASE`** is like buying a brand new, empty **filing cabinet** and placing it in the corner of the office, labeling it `Company Receipts`.
-   **`DROP DATABASE`** is like taking that entire filing cabinet, carrying it to an incinerator, and burning it to ash. Every folder, paper, and receipt inside is destroyed instantly.

---

### (4) Code Examples

#### Creating a Database
```sql
-- Create a database for storing user data
CREATE DATABASE user_dashboard;
```

#### Deleting a Database
```sql
-- Permanently delete the database
DROP DATABASE user_dashboard;
```

#### Safe Operations (Avoid Errors if Database exists/missing)
In scripts, you can prevent crashes by checking existence checks (supported in modern SQL engines):

```sql
-- Safely drop only if the database exists
DROP DATABASE IF EXISTS test_sandbox;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to drop a database while you are actively connected to it

**The mistake:** Connecting to a database named `temp_db` in `psql`, and typing `DROP DATABASE temp_db;`, resulting in an error.

```text
ERROR: cannot drop the currently open database
```

**Why it's wrong:** The database engine cannot delete physical files that are actively being read or written to by connected client sockets. You cannot saw off the tree branch you are currently sitting on.

**Fix: Connect to a different database first (like the default `postgres` database), terminate any active client connections, and then run the drop command.**

```sql
-- 1. Connect to default database
\c postgres

-- 2. Drop the target database
DROP DATABASE temp_db;
```

---



### Mistake 2: Executing `CREATE DATABASE` inside Active Transaction Blocks

**The mistake:** Executing `BEGIN; CREATE DATABASE app; COMMIT;`.

**Why it's wrong:** `CREATE DATABASE` and `DROP DATABASE` CANNOT be executed inside a transaction block in PostgreSQL, throwing error `CREATE DATABASE cannot run inside a transaction block`.

*Incorrect:*
```sql
BEGIN;
CREATE DATABASE app; -- ❌ Error: cannot run inside a transaction block!
COMMIT;
```

*Fix:*
```sql
CREATE DATABASE app; -- Execute outside transaction blocks
```

### Mistake 3: Running Non-Idempotent `CREATE DATABASE` Scripts Without Existence Guards

**The mistake:** Running database setup scripts executing `CREATE DATABASE app;` against existing databases.

**Why it's wrong:** Executing `CREATE DATABASE app;` when database `app` already exists throws fatal error `database "app" already exists`.

*Incorrect:*
```sql
CREATE DATABASE app; -- Fails if app exists
```

*Fix:*
```sql
SELECT 'CREATE DATABASE app' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'app');
```

## 6. Practice Exercises

### Exercise 1: Sandbox Lifecycle Script

**Problem:** You are writing an automated testing script. Before running tests, the script must ensure a clean database named `test_db` is created. If `test_db` already exists from a previous failed run, it should be wiped first. Write the sequence of SQL commands to achieve this.

**Expected output:**
> [!check]- Answer
> ```sql
> DROP DATABASE IF EXISTS test_db;
> CREATE DATABASE test_db;
> ```
> - Use the `IF EXISTS` clause to prevent the script from crashing if it is the first time running.
> - Execute the create command after the drop command.

---



### Exercise 2: Idempotent Database Creation Check

**Problem:** Check if database `analytics` exists in `pg_database` catalog table.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = 'analytics');
> ```
> ```sql
> SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = 'analytics');
> ```
>
> **Explanation:** Querying `pg_database` system catalog verifies database existence safely.

---

### Exercise 3: Dropping Database Forcefully

**Problem:** Drop database `temp_db` with `WITH (FORCE)` in PostgreSQL 13+ to terminate active connections.

**Expected output:**
> [!check]- Answer
> ```text
> DROP DATABASE IF EXISTS temp_db WITH (FORCE);
> ```
> ```sql
> DROP DATABASE IF EXISTS temp_db WITH (FORCE);
> ```
>
> **Explanation:** `WITH (FORCE)` terminates active client connections before dropping target databases.

## 7. Related Terms
- [Database](database.md) — The target logical container.
- [`CREATE TABLE` / `DROP TABLE`](create_drop_table.md) — Managing structures inside the database.

---

## 8. Key Takeaways
- `CREATE DATABASE` builds a new isolated database container on the Postgres server.
- `DROP DATABASE` permanently destroys a database and all its contents.
- Dropping a database is **irreversible**; there is no trash recovery box.
- You cannot drop a database if any client application is actively connected to it.
- Use `DROP DATABASE IF EXISTS` inside scripts to prevent syntax execution crashes.
