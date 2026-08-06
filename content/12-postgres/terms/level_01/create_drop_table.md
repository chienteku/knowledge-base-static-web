# `CREATE TABLE` / `DROP TABLE`

> **Level 1 — What Is a Database?**
> SQL DDL commands used to define a new table's columns, data types, and constraint rules, or to permanently delete a table structure along with all its stored rows.

---

## 1. Prerequisites
- [Table (Relation)](table.md) — The logical data grid being managed.
- [SQL (Structured Query Language)](sql.md) — The declarative syntax standard.

---

## 2. Term Category

**SQL Command / Clause** (Table DDL Commands): `CREATE TABLE` and `DROP TABLE` define or remove relational table structures, column definitions, and integrity constraints.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DDL** (Standard commands. Interacts with the system catalog to write schema updates to internal tables like `pg_class`).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Creating Tables with Constraints and Identity Primary Keys

**Scenario:**
Create a `users` table with identity primary key `id`, unique `email`, and `created_at` default timestamp.

**Requirements:**
1. Execute `CREATE TABLE users (...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE users (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   username TEXT NOT NULL,
>   email TEXT NOT NULL CONSTRAINT uq_users_email UNIQUE,
>   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
> );
> ```
>
> #### Technical Explanation
>
> 1. `GENERATED ALWAYS AS IDENTITY` creates an auto-incrementing integer primary key compliant with SQL standards.
> 2. `CONSTRAINT uq_users_email UNIQUE` enforces unique email addresses across all rows.
> 3. `TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP` records row creation times in UTC.
> 
---

### Exercise 2: Creating Tables with Foreign Key Constraints

**Scenario:**
Create an `orders` table referencing `users(id)` with explicit foreign key constraint naming.

**Requirements:**
1. Include `CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE orders (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   user_id INTEGER NOT NULL,
>   total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
>   order_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
>   CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
> );
> ```
>
> #### Technical Explanation
>
> 1. Foreign key constraints enforce referential integrity between tables.
> 2. `ON DELETE CASCADE` automatically removes child order records if the parent user row is deleted.
> 3. Explicit constraint names simplify debugging and schema migration management.
> 
---

### Exercise 3: Dropping Tables with Cascade Dependencies

**Scenario:**
Drop table `users` and all dependent tables (such as `orders`) using `CASCADE`.

**Requirements:**
1. Execute `DROP TABLE IF EXISTS users CASCADE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> DROP TABLE IF EXISTS users CASCADE;
> ```
>
> #### Technical Explanation
>
> 1. `DROP TABLE` removes table structures and all contained data rows.
> 2. `CASCADE` automatically drops foreign key constraints and dependent objects in child tables.
> 3. Use caution when dropping tables in production.
> 
---



## 6. Related Terms
- [Table (Relation)](table.md) — The resulting storage structure.
- [`CREATE DATABASE` / `DROP DATABASE`](create_drop_database.md) — Managing the parent database containers.
- [SQL (Structured Query Language)](sql.md) — Related concept: SQL (Structured Query Language).
- [`TRUNCATE`](../level_03/truncate.md) — Related concept: `TRUNCATE`.
- [`ALTER TABLE`](../level_06/alter_table.md) — Related concept: `ALTER TABLE`.

---

## 7. Key Takeaways
- `CREATE TABLE` defines columns, data types, and validation rules for new tables.
- `DROP TABLE` permanently destroys the table structure and all stored rows of data.
- Dropping tables is blocked by the engine if other tables depend on them (foreign keys).
- To empty data rows but keep the column blueprint, use `TRUNCATE TABLE` instead of `DROP`.
- Use `DROP TABLE IF EXISTS` inside automated testing and migration scripts to prevent crashes.
