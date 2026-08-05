# `CREATE TABLE` / `DROP TABLE`

> **Level 1 — What Is a Database?**
> SQL DDL commands used to define a new table's columns, data types, and constraint rules, or to permanently delete a table structure along with all its stored rows.

---

## 1. Prerequisites
- [Table (Relation)](table.md) — The logical data grid being managed.
- [SQL (Structured Query Language)](sql.md) — The declarative syntax standard.
---

## 2. Term Category
- **SQL DDL Statement**

---

## 3. Environment Context
- **PostgreSQL Core DDL** (Standard commands. Interacts with the system catalog to write schema updates to internal tables like `pg_class`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Inside an isolated database, you need to set up individual structures to hold your data records (like profiles, invoices, or comments). 

To do this, you must declare a blueprint defining what fields your data must have.

SQL provides two commands to manage the table structural lifecycle:
-   **`CREATE TABLE`**: Declares a new table name, outlines its columns, sets their data types (integer, text, date, etc.), and enforces data validation constraints (like making a column unique or required).
-   **`DROP TABLE`**: Instantly and permanently deletes the table's structural definition and wipes out every row of data stored inside it from the disk drive.

---

### (2) Cascading Deletes (Referential Integrity)
Because relational databases link tables together (e.g. an `orders` table contains a foreign key pointing to a row in a `users` table), deleting a table is not always straightforward.

If you try to run `DROP TABLE users;` while the `orders` table still references it, Postgres will block the command. 

This is a safety feature called **Referential Integrity** — it prevents you from creating "orphaned" records (orders pointing to users that no longer exist).

---

### (3) Reality Metaphor
Imagine managing a project folder:
-   **`CREATE TABLE`** is like taking a blank piece of grid graph paper, drawing vertical column dividers, writing header names at the top (like `ID`, `Name`, `Price`), and placing it in a folder.
-   **`DROP TABLE`** is like taking that single sheet of paper, running it through a paper shredder, and throwing it away. All grid lines and every hand-written entry row written on the sheet are gone forever.

---

### (4) Code Examples

#### Creating a Table with Constraints
```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,           -- Uniquely identifies each employee
  full_name VARCHAR(100) NOT NULL,  -- Text field, cannot be empty
  salary NUMERIC(10,2) DEFAULT 0.00 -- Decimal cash value with default
);
```

#### Deleting a Table Safely
If the table is missing, running `DROP TABLE` causes an error. We add `IF EXISTS` to make scripts run cleanly:

```sql
-- Safely delete only if the table is present
DROP TABLE IF EXISTS employees;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accidentally dropping a table containing critical data

**The mistake:** Running `DROP TABLE users;` on a staging or production database when you only meant to delete the test data *inside* the table.

**Why it's wrong:** `DROP TABLE` deletes the data **and** the structure. If you just wanted to empty the table but keep the columns for future inserts, you should use the `TRUNCATE TABLE` or `DELETE FROM` commands instead. Once a table is dropped, rebuilding the table structures and restoring rows is difficult without backups.

**Fix: If you only want to wipe the data rows but preserve the table's column definitions, use the `TRUNCATE` command.**

```sql
-- Wipes data rows but keeps the table structure intact!
TRUNCATE TABLE employees;
```

---



### Mistake 2: Running `DROP TABLE` Without `CASCADE` When Dependent Foreign Keys Exist

**The mistake:** Executing `DROP TABLE users;` when child table `orders` references `users._id` with a foreign key.

**Why it's wrong:** PostgreSQL blocks table deletion if other tables depend on it, throwing error `cannot drop table users because other objects depend on it`. Use `DROP TABLE users CASCADE;`.

*Incorrect:*
```sql
DROP TABLE users; -- ❌ Error: dependent foreign keys exist!
```

*Fix:*
```sql
DROP TABLE users CASCADE; -- Drops dependent foreign key constraints automatically
```

### Mistake 3: Creating Tables Without `IF NOT EXISTS` Guards in Deployment Migration Scripts

**The mistake:** Executing `CREATE TABLE users (...);` in container deployment hooks.

**Why it's wrong:** Running non-idempotent DDL scripts on re-deployments throws error `relation "users" already exists`. Add `IF NOT EXISTS`.

*Incorrect:*
```sql
CREATE TABLE users ( id INT PRIMARY KEY ); -- Fails on second deployment run
```

*Fix:*
```sql
CREATE TABLE IF NOT EXISTS users ( id INT PRIMARY KEY ); -- Safe idempotent creation
```

## 6. Practice Exercises

### Exercise 1: Table Blueprint Lifecycle

**Problem:** You are building a blog database. Write the SQL DDL statements to:
1.  Safely drop a table named `comments` if it already exists.
2.  Create the `comments` table with three columns: `id` (integer primary key), `author_name` (text, cannot be empty), and `body_text` (text).

**Expected output:**
> [!check]- Answer
> ```sql
> DROP TABLE IF EXISTS comments;
> 
> CREATE TABLE comments (
>   id INTEGER PRIMARY KEY,
>   author_name VARCHAR(100) NOT NULL,
>   body_text TEXT
> );
> ```
> - Execute the safe drop operation first to clean any leftovers.
> - Declare columns with their matching type mappings and constraint rules.

---



### Exercise 2: Creating Table with Primary Key and Default Timestamp

**Problem:** Create table `logs` with auto-incrementing `id`, string `message`, and `created_at` defaulting to `NOW()`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE TABLE IF NOT EXISTS logs ( id SERIAL PRIMARY KEY, message TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() );
> ```
> ```sql
> CREATE TABLE IF NOT EXISTS logs (
>   id SERIAL PRIMARY KEY,
>   message TEXT NOT NULL,
>   created_at TIMESTAMPTZ DEFAULT NOW()
> );
> ```
>
> **Explanation:** `CREATE TABLE IF NOT EXISTS` defines primary key constraints and column defaults safely.

---

### Exercise 3: Dropping Table Safely

**Problem:** Drop table `temp_records` if it exists.

**Expected output:**
> [!check]- Answer
> ```text
> DROP TABLE IF EXISTS temp_records;
> ```
> ```sql
> DROP TABLE IF EXISTS temp_records;
> ```
>
> **Explanation:** `DROP TABLE IF EXISTS` avoids syntax errors if target tables do not exist.

## 7. Related Terms
- [Table (Relation)](table.md) — The resulting storage structure.
- [`CREATE DATABASE` / `DROP DATABASE`](create_drop_database.md) — Managing the parent database containers.
- [SQL (Structured Query Language)](sql.md) — Related concept: SQL (Structured Query Language).
- [`TRUNCATE`](../level_03/truncate.md) — Related concept: `TRUNCATE`.
- [`ALTER TABLE`](../level_06/alter_table.md) — Related concept: `ALTER TABLE`.
---

## 8. Key Takeaways
- `CREATE TABLE` defines columns, data types, and validation rules for new tables.
- `DROP TABLE` permanently destroys the table structure and all stored rows of data.
- Dropping tables is blocked by the engine if other tables depend on them (foreign keys).
- To empty data rows but keep the column blueprint, use `TRUNCATE TABLE` instead of `DROP`.
- Use `DROP TABLE IF EXISTS` inside automated testing and migration scripts to prevent crashes.
