# `CREATE DATABASE` / `DROP DATABASE`

> **Level 1 — What Is a Database?**
> SQL DDL commands used to initialize a new, isolated database container on the server, or to permanently destroy an existing database along with all its schemas, tables, and records.

---

## 1. Prerequisites
- [PostgreSQL (Postgres)](postgresql.md) — The host server where databases are created.
- [SQL (Structured Query Language)](sql.md) — The language schema query syntax.

---

## 2. Term Category

**SQL Command / Clause** (Database DDL Commands): `CREATE DATABASE` and `DROP DATABASE` allocate or destroy isolated PostgreSQL database clusters.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DDL** (Standard commands. In Postgres, you cannot execute these statements inside active transaction blocks).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Allocating Isolated Application Databases

**Scenario:**
Create a new isolated PostgreSQL database `ecommerce_prod` owned by database role `app_admin`.

**Requirements:**
1. Execute `CREATE DATABASE ecommerce_prod OWNER app_admin`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE DATABASE ecommerce_prod 
> WITH 
>   OWNER = app_admin
>   ENCODING = 'UTF8';
> ```
>
> #### Technical Explanation
>
> 1. `CREATE DATABASE` allocates a new isolated database namespace inside the PostgreSQL cluster.
> 2. `OWNER = app_admin` sets primary administrative ownership.
> 3. `ENCODING = 'UTF8'` ensures full multi-byte character encoding support.
> 
---

### Exercise 2: Safely Destroying Development Databases

**Scenario:**
Safely drop test database `ecommerce_test` using `IF EXISTS` to prevent script execution errors.

**Requirements:**
1. Execute `DROP DATABASE IF EXISTS ecommerce_test`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> DROP DATABASE IF EXISTS ecommerce_test;
> ```
>
> #### Technical Explanation
>
> 1. `DROP DATABASE` completely deletes target database files from disk storage.
> 2. `IF EXISTS` prevents SQL errors if the database does not exist.
> 3. Cannot be executed while active client connections are connected to the target database.
> 
---

### Exercise 3: Force Disconnecting Active Sessions Before Drop

**Scenario:**
Terminate all active client sessions connected to `ecommerce_staging` prior to dropping the database.

**Requirements:**
1. Query `pg_terminate_backend` on `pg_stat_activity`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT pg_terminate_backend(pid) 
> FROM pg_stat_activity 
> WHERE datname = 'ecommerce_staging' 
>   AND pid <> pg_backend_pid();
> 
> DROP DATABASE ecommerce_staging;
> ```
>
> #### Technical Explanation
>
> 1. PostgreSQL blocks `DROP DATABASE` if any active client session is connected.
> 2. `pg_terminate_backend(pid)` forcefully closes connected client sockets.
> 3. `pid <> pg_backend_pid()` avoids terminating the current admin session.
> 
---



## 6. Related Terms
- [Database](database.md) — The target logical container.
- [`CREATE TABLE` / `DROP TABLE`](create_drop_table.md) — Managing structures inside the database.

---

## 7. Key Takeaways
- `CREATE DATABASE` builds a new isolated database container on the Postgres server.
- `DROP DATABASE` permanently destroys a database and all its contents.
- Dropping a database is **irreversible**; there is no trash recovery box.
- You cannot drop a database if any client application is actively connected to it.
- Use `DROP DATABASE IF EXISTS` inside scripts to prevent syntax execution crashes.
