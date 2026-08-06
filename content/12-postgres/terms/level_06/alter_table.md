# `ALTER TABLE`

> **Level 6 — Schema Design & Normalization**
> The SQL DDL command used to modify the structural definition of an existing table (e.g. adding columns, dropping fields, or changing constraints) without losing stored data.

---

## 1. Prerequisites
- [Table (Relation)](../level_01/table.md) — The target structural grid we are modifying.

---

## 2. Term Category

**SQL Command / Clause** (Table Schema Modification DDL): `ALTER TABLE` modifies existing table structure definitions, including adding columns, dropping constraints, and altering column data types.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DDL** (Requires an `ACCESS EXCLUSIVE` lock on the table. On large tables, some type conversion operations force the engine to physically rewrite every row on disk, locking out reads and writes).

### (1) Design Motivation — "Why did we design this?"
Software applications are constantly changing:
-   A new feature requires adding a `profile_picture_url` column to the `users` table.
-   An integer `score` column needs to be upgraded to a `NUMERIC` type to support decimal grading.
-   A legacy `fax_number` column is obsolete and should be deleted to save disk space.

If you did not have a modification command, the only way to change a table structure would be to drop the table and recreate it:

```sql
DROP TABLE users; -- DANGER: Wipes out all production user data!
CREATE TABLE users (...);
```

This is impossible in production because it destroys active user records.

We designed the **`ALTER TABLE`** command to solve this. 

It allows you to modify the metadata catalog of a table on-the-fly, keeping the existing rows intact while updating the column layout.

---

### (2) Common Alterations

-   **`ADD COLUMN`**: Appends a new column to the table.
-   **`DROP COLUMN`**: Wipes an existing column and its data.
-   **`ALTER COLUMN ... TYPE`**: Changes a column's data type (e.g. integer to bigint).
-   **`RENAME COLUMN`**: Renames a header.
-   **`ADD CONSTRAINT`**: Attaches rules like `UNIQUE` or `CHECK`.

---

### (3) Reality Metaphor
Imagine renovating an occupied office building:
-   **Tear down & Rebuild (`DROP` & `CREATE`):** Demolishing the building with a wrecking ball and building a new office. The employees are displaced, and all documents are lost.
-   **Renovating (`ALTER TABLE`):** Hiring contractors to knock down a wall (dropping a column), partition a room (adding a column), or upgrade the wiring (changing a type) while employees continue to work in the building.

---

### (4) Code Examples

#### 1. Adding a Column (with Default Fallback)
When adding a required column to a table that already has data, you must provide a default value so Postgres can populate the existing rows:

```sql
CREATE TABLE staff (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Alter table to add a required status column
ALTER TABLE staff 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
```

#### 2. Modifying Data Type
Convert a small integer to a large decimal, utilizing type casting:

```sql
ALTER TABLE staff 
ALTER COLUMN salary TYPE NUMERIC(10,2) USING salary::NUMERIC(10,2);
-- USING tells Postgres how to convert the old binary bytes to the new type
```

#### 3. Dropping a Column
```sql
ALTER TABLE staff 
DROP COLUMN old_legacy_field;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Adding a NOT NULL constraint to an existing column without verifying it contains NULL rows

**The mistake:** Running `ALTER TABLE staff ALTER COLUMN email SET NOT NULL;` on a table that has empty cells in the email column.

**Why it's wrong:** Relational databases enforce strict consistency. You cannot create a rule saying "this column can never have NULLs" if there are active rows breaking that exact rule right now. The query will fail and roll back.

**Fix: Before applying `SET NOT NULL`, write an `UPDATE` query to clean up existing `NULL` values to a valid fallback, and then alter the column.**

```sql
-- Step 1: Clean
UPDATE staff SET email = 'unknown@company.com' WHERE email IS NULL;

-- Step 2: Alter
ALTER TABLE staff ALTER COLUMN email SET NOT NULL;
```

---



### Mistake 2: Executing `ALTER TABLE` DDL Statements on High-Traffic Tables Without `lock_timeout`

**The mistake:** Running `ALTER TABLE heavy_table ADD COLUMN new_col INT DEFAULT 0;` on a 50M row production table during peak hours.

**Why it's wrong:** `ALTER TABLE` acquires an `ACCESS EXCLUSIVE` lock on the target table, blocking ALL concurrent read and write queries until the lock is acquired. Set `lock_timeout = '2s'` before running DDL.

*Incorrect:*
```sql
ALTER TABLE heavy_table ADD COLUMN new_col INT DEFAULT 0; -- ❌ Blocks all reads/writes!
```

*Fix:*
```sql
SET lock_timeout = '2s';
ALTER TABLE heavy_table ADD COLUMN new_col INT DEFAULT 0;
```

### Mistake 3: Adding Column Defaults with Volatile Functions on Legacy Postgres Versions (< 11)

**The mistake:** Adding a column with a default value on large tables on legacy Postgres versions.

**Why it's wrong:** On Postgres 11+, adding a column with a constant default is instantaneous (metadata-only update). On legacy versions, it rewrites the entire table on disk.

*Incorrect:*
```sql
// Rewriting 50M row table on disk on legacy Postgres versions
```

*Fix:*
```sql
Upgrade to PostgreSQL 11+ or add column without default first, then populate in batches
```

## 5. Practice Exercises

### Exercise 1: Adding Columns with Non-Volatile Defaults

**Scenario:**
Add a new column `status` (`TEXT NOT NULL DEFAULT 'active'`) to a 10,000,000 row table `users`.

**Requirements:**
1. Execute `ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE users 
> ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
> ```
>
> #### Technical Explanation
>
> 1. In PostgreSQL 11+, adding columns with non-volatile default expressions (`DEFAULT 'active'`) executes instantly without rewriting the table heap pages.
> 2. Updates catalog metadata only.
> 3. Zero-downtime schema evolution.

---

### Exercise 2: Altering Column Data Types with Explicit Conversion

**Scenario:**
Alter column `zip_code` from `INTEGER` to `TEXT` on table `addresses`.

**Requirements:**
1. Execute `ALTER TABLE addresses ALTER COLUMN zip_code TYPE TEXT USING zip_code::TEXT`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE addresses 
> ALTER COLUMN zip_code TYPE TEXT 
> USING zip_code::TEXT;
> ```
>
> #### Technical Explanation
>
> 1. `ALTER COLUMN ... TYPE` converts stored column values to target data types.
> 2. `USING` clause specifies explicit conversion logic when automatic cast rules do not exist.
> 3. Re-writes table rows under an AccessExclusive lock.

---

### Exercise 3: Adding Constraints Non-Destructively with NOT VALID

**Scenario:**
Add a `CHECK` constraint to table `orders` non-destructively using `NOT VALID` and `VALIDATE CONSTRAINT`.

**Requirements:**
1. Execute `ALTER TABLE orders ADD CONSTRAINT ... NOT VALID` followed by `VALIDATE CONSTRAINT`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE orders 
> ADD CONSTRAINT chk_orders_total_positive 
> CHECK (total_cents >= 0) NOT VALID;
> 
> ALTER TABLE orders 
> VALIDATE CONSTRAINT chk_orders_total_positive;
> ```
>
> #### Technical Explanation
>
> 1. `NOT VALID` enforces the constraint for new writes immediately without holding a table-lock to scan existing rows.
> 2. `VALIDATE CONSTRAINT` scans existing rows concurrently without blocking concurrent table writes.
> 3. Safe zero-downtime migration strategy for large tables.

---



## 6. Related Terms
- [`CREATE TABLE` / `DROP TABLE`](../level_01/create_drop_table.md) — Managing table lifecycles.
- [`ENUM` Type](enum_type.md) — Related concept: `ENUM` Type.
- [Database Migrations](../level_10/database_migrations.md) — Related concept: Database Migrations.
- [Table Partitioning](../level_10/table_partitioning.md) — Related concept: Table Partitioning.

---

## 7. Key Takeaways
- `ALTER TABLE` modifies existing table structures without destroying stored data.
- Supports adding/dropping columns, changing data types, and attaching constraints.
- Requires exclusive table locks, which can block traffic on large database tables.
- Adding `NOT NULL` to populated tables requires clean data or default fallbacks first.
- Use the `USING` clause to tell Postgres how to cast data during type changes.
