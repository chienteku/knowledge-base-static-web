# Table (Relation)

> **Level 1 — What Is a Database?**
> The fundamental storage unit of a relational database, organizing a collection of related records into a structured grid of horizontal rows and vertical columns.

---

## 1. Prerequisites
- [Relational Database](relational_database.md) — The parent database model.

---

## 2. Term Category

**Core Concept** (Relation Data Structure): A Table is a 2-dimensional relation comprising named columns and ordered tuple rows storing structured records.



---

## 3. Explanation

### Environment Context
- **Universal standard** (Called a "Relation" in formal relational database theory. Physical disk engines write tables as structured heap files on disk).

### (1) Design Motivation — "Why did we design this?"
A database can hold millions of pieces of information, but it cannot store them in a messy, unstructured pile. We need a way to categorize different concepts.

A **Table** is designed to store data about a single, specific **entity type** (like `users`, `products`, or `invoices`). 

By isolating different concepts into separate tables:
-   You enforce clear boundaries (you don't accidentally mix a user's address with a product's price).
-   You make it easy to write clean queries (e.g., "Find all users" vs "Find all products").
-   You allow the database engine to organize records on the physical hard drive in structured blocks, optimizing search speeds.

---

### (2) Reality Metaphor
Imagine a spreadsheet workbook:
-   The entire Excel file is your **Database**.
-   Each spreadsheet tab/sheet inside the workbook is a **Table**.
    -   Tab 1 is named `Customers`.
    -   Tab 2 is named `Inventory`.
    -   Tab 3 is named `Transactions`.

Each sheet has its own specific columns at the top and rows of data below, and you never write a customer's phone number inside the inventory page.

---

### (3) Code Examples

#### Creating a Table
We create tables by defining their name and the vertical columns they must contain:

```sql
-- Create a table specifically for storing books
CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  title VARCHAR(200),
  author VARCHAR(100),
  published_year INTEGER
);
```

#### Inserting Data Into a Table
```sql
INSERT INTO books (id, title, author, published_year) 
VALUES (1, 'The Hobbit', 'J.R.R. Tolkien', 1937);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating "catch-all" tables that store unrelated data

**The mistake:** Creating a table named `app_data` and putting user details, product prices, and system error logs into the same grid.

**Why it's wrong:** Mixing entities makes tables extremely wide, fills columns with empty values (`NULL`), and makes it impossible for the database to enforce structure. 

**Fix: Follow the rule of "One Entity per Table." If you have different concepts, create separate tables (e.g. `users`, `products`, `logs`) and link them together using keys.**

---



### Mistake 2: Creating Tables Without Primary Key Constraints

**The mistake:** Creating table `CREATE TABLE logs ( message TEXT );` without a primary key.

**Why it's wrong:** Tables lacking primary keys permit duplicate rows, breaking row uniqueness identity and complicating replication and updates.

*Incorrect:*
```sql
CREATE TABLE logs ( message TEXT ); -- ❌ Missing primary key!
```

*Fix:*
```sql
CREATE TABLE logs ( id SERIAL PRIMARY KEY, message TEXT );
```

### Mistake 3: Altering Table Schemas in Production Without Checking Active Locks

**The mistake:** Executing `ALTER TABLE heavy_table ADD COLUMN new_col INT;` on a high-traffic production table during peak hours.

**Why it's wrong:** `ALTER TABLE` requests an `ACCESS EXCLUSIVE` lock on the table, blocking ALL reads and writes until the lock is acquired. Set `lock_timeout` before running DDL.

*Incorrect:*
```sql
ALTER TABLE heavy_table ADD COLUMN new_col INT; -- ❌ Blocks all reads/writes!
```

*Fix:*
```sql
SET lock_timeout = '2s';
ALTER TABLE heavy_table ADD COLUMN new_col INT DEFAULT 0;
```

## 5. Practice Exercises

### Exercise 1: Table Creation with Data Integrity Constraints

**Scenario:**
Create an `inventory` table storing product stock, unit price, and reorder thresholds.

**Requirements:**
1. Execute `CREATE TABLE inventory (...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE inventory (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   product_name TEXT NOT NULL,
>   quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
>   unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
>   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
> );
> ```
>
> #### Technical Explanation
>
> 1. Tables are 2-dimensional grid relations where columns define schema types and rows store data records.
> 2. `CHECK (quantity_in_stock >= 0)` guarantees negative stock values can never be written.
> 3. `DEFAULT 0` populates omitted fields during new row inserts.

---

### Exercise 2: Truncating Table Records with `TRUNCATE`

**Scenario:**
Fast-delete all rows from a temporary staging table `staging_logs` using `TRUNCATE`.

**Requirements:**
1. Execute `TRUNCATE TABLE staging_logs`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> TRUNCATE TABLE staging_logs RESTART IDENTITY;
> ```
>
> #### Technical Explanation
>
> 1. `TRUNCATE` removes all rows from a table by deallocating underlying data pages instantly.
> 2. Orders of magnitude faster than `DELETE FROM` on large tables because it avoids individual row MVCC processing.
> 3. `RESTART IDENTITY` resets auto-increment sequence counters to 1.

---

### Exercise 3: Inspecting Table Disk Footprint Statistics

**Scenario:**
Query total disk space used by table `orders` including its indexes and toast tables using `pg_total_relation_size()`.

**Requirements:**
1. Execute `SELECT pg_size_pretty(pg_total_relation_size('orders'))`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   pg_size_pretty(pg_relation_size('orders')) AS table_data_size,
>   pg_size_pretty(pg_total_relation_size('orders')) AS total_size_with_indexes;
> ```
>
> #### Technical Explanation
>
> 1. `pg_relation_size('orders')` calculates raw table heap data file sizes.
> 2. `pg_total_relation_size('orders')` includes associated B-tree indexes and TOAST storage.
> 3. Essential command for monitoring table storage growth.

---



## 6. Related Terms
- [Row (Record / Tuple)](row.md) — The horizontal table entries.
- [Column (Field / Attribute)](column.md) — The vertical table columns.
- [`CREATE TABLE` / `DROP TABLE`](create_drop_table.md) — The table lifecycle SQL commands.
- [Relational Database](relational_database.md) — Related concept: Relational Database.
- [Schema](schema.md) — Related concept: Schema.
- [`INSERT INTO`](../level_03/insert_into.md) — Related concept: `INSERT INTO`.
- [Foreign Data Wrappers (`postgres_fdw`)](../level_10/foreign_data_wrappers.md) — Related concept: Foreign Data Wrappers (`postgres_fdw`).

---

## 7. Key Takeaways
- A table is a structured grid of rows and columns representing a single entity type.
- Every table has a unique name (e.g., `users`, `products`) inside the database.
- It is the relational database equivalent of a single sheet tab in a spreadsheet.
- Never mix different concepts in one table; follow the "One Entity per Table" rule.
- Physical storage engines write tables to disk in binary blocks for fast access.
