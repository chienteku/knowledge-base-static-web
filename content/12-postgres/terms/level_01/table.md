# Table (Relation)

> **Level 1 — What Is a Database?**
> The fundamental storage unit of a relational database, organizing a collection of related records into a structured grid of horizontal rows and vertical columns.

---

## 1. Prerequisites
- [Relational Database](relational_database.md) — The parent database model.

---

## 2. Term Category
- **Core Storage Unit**

---

## 3. Environment Context
- **Universal standard** (Called a "Relation" in formal relational database theory. Physical disk engines write tables as structured heap files on disk).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Table Design Blueprint

**Problem:** You are building an inventory system for a car dealership. You need to store cars. Create a SQL table named `cars` that stores a unique ID, the car's model name, make, manufacture year, and price.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE TABLE cars (
>   id INTEGER PRIMARY KEY,
>   make VARCHAR(50),
>   model VARCHAR(50),
>   manufacture_year INTEGER,
>   price NUMERIC(10,2)
> );
> ```
> - Define clean, descriptive names for all columns.
> - Think about what data type fits price numbers (decimals are best handled by `NUMERIC`).

---



### Exercise 2: Creating Table with Constraints

**Problem:** Create table `products` with `id` primary key, `name` (NOT NULL), and `price` (CHECK price > 0).

**Expected output:**
> [!check]- Answer
> ```text
> CREATE TABLE products ( id SERIAL PRIMARY KEY, name TEXT NOT NULL, price NUMERIC CHECK (price > 0) );
> ```
> ```sql
> CREATE TABLE products (
>   id SERIAL PRIMARY KEY,
>   name TEXT NOT NULL,
>   price NUMERIC CHECK (price > 0)
> );
> ```
>
> **Explanation:** DDL column constraints enforce data integrity at table creation.

---

### Exercise 3: Inspecting Table Schema in `psql`

**Problem:** Command in `psql` to inspect schema definition of table `products` (`\d products`).

**Expected output:**
> [!check]- Answer
> ```text
> \d products
> ```
> ```text
> \d products
> ```
>
> **Explanation:** `\d table_name` displays column types, defaults, and index definitions in `psql`.

## 7. Related Terms
- [Row (Record / Tuple)](row.md) — The horizontal table entries.
- [Column (Field / Attribute)](column.md) — The vertical table columns.
- [`CREATE TABLE` / `DROP TABLE`](create_drop_table.md) — The table lifecycle SQL commands.
- [Relational Database](relational_database.md) — Related concept: Relational Database.
- [Schema](schema.md) — Related concept: Schema.
- [`INSERT INTO`](../level_03/insert_into.md) — Related concept: `INSERT INTO`.
- [Foreign Data Wrappers (`postgres_fdw`)](../level_10/foreign_data_wrappers.md) — Related concept: Foreign Data Wrappers (`postgres_fdw`).

---

## 8. Key Takeaways
- A table is a structured grid of rows and columns representing a single entity type.
- Every table has a unique name (e.g., `users`, `products`) inside the database.
- It is the relational database equivalent of a single sheet tab in a spreadsheet.
- Never mix different concepts in one table; follow the "One Entity per Table" rule.
- Physical storage engines write tables to disk in binary blocks for fast access.
