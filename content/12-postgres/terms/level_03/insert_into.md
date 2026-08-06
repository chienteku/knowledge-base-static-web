# `INSERT INTO`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The fundamental SQL DML command used to add a new row of data into a table by mapping values to specific columns.

---

## 1. Prerequisites
- [Table (Relation)](../level_01/table.md) — The target container grid where data is stored.
- [SQL (Structured Query Language)](../level_01/sql.md) — Declarative query syntax standards.

---

## 2. Term Category

**SQL Command / Clause** (Row Insertion Command): `INSERT INTO` adds new tuple rows into a database table.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DML** (Checked against table schema constraint rules at write-time. Successfully inserted rows are written to the table's heap files on disk).

### (1) Design Motivation — "Why did we design this?"
Once you define tables and columns inside a database, the tables start completely empty. To make the database useful, we need a command to write data into them.

The **`INSERT INTO`** statement is the primary tool for adding new records. 

It acts as a data mapper: you specify the target table, list the columns you want to fill, and provide the matching list of values. 

The database engine validates the values against data types and constraints, organizes them into a structured binary record, and appends it as a new row to the table.

---

### (2) Column-Value Mapping
The structure of an `INSERT` statement maps columns to values sequentially by position:

```sql
INSERT INTO users (username, age, email) -- Column list
VALUES ('alice', 28, 'alice@example.com'); -- Value list
```

-   `username` maps to `'alice'` (position 1)
-   `age` maps to `28` (position 2)
-   `email` maps to `'alice@example.com'` (position 3)

If you omit any column from the list (like `marketing_consent`), Postgres automatically checks your schema definitions and inserts either the column's `DEFAULT` value or `NULL`.

---

### (3) Reality Metaphor
Imagine a doctor's office filing system:
-   **`INSERT INTO`** is the physical act of filling out a new **patient folder card** and dropping it into the filing drawer.
-   You write the patient's name, age, and phone number in their respective boxes on the card.
-   If you swap the boxes (writing the phone number in the name field), the receptionist (the database engine) will stop you and force you to rewrite the card correctly.

---

### (4) Code Examples

#### Standard INSERT INTO
```sql
CREATE TABLE inventory (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,
  stock_count INT DEFAULT 0
);

-- Insert a single row mapping item_name and stock_count
INSERT INTO inventory (item_name, stock_count)
VALUES ('Wireless Headphones', 45);
```

#### Omitting Columns to Trigger Defaults
```sql
-- Omit stock_count. It will default to 0 automatically.
INSERT INTO inventory (item_name)
VALUES ('USB Charger');

SELECT * FROM inventory;
-- Output:
-- id |      item_name      | stock_count
-- ---+---------------------+-------------
-- 1  | Wireless Headphones | 45
-- 2  | USB Charger         | 0
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misaligning the columns list with the values list count or type sequence

**The mistake:** Writing a query where the number of parameters in the column list does not match the number of values, or ordering them incorrectly:

```sql
-- BAD: 2 columns listed, but 3 values provided! (Syntax Error)
INSERT INTO inventory (item_name, stock_count) VALUES ('Camera', 12, 'extra_value');

-- BAD: Columns are (name, count) but values are (count, name)! (Type Error)
INSERT INTO inventory (item_name, stock_count) VALUES (12, 'Camera');
```

**Why it's wrong:** SQL parsers map parameters strictly by index position. A mismatch in parameter counts causes a parser error. A mismatch in data types (like mapping `'Camera'` string to an integer `stock_count` column) triggers a strict type validation crash.

**Fix: Always visually double-check that your columns list and values list have the exact same count and order of types.**

---



### Mistake 2: Omitting Explicit Column Target Lists in `INSERT INTO` Statements

**The mistake:** Writing `INSERT INTO users VALUES ('Alice', 'alice@ex.com');`.

**Why it's wrong:** Omitting column target lists breaks queries if table columns are re-ordered or added in future schema migrations. Explicitly list columns.

*Incorrect:*
```sql
INSERT INTO users VALUES ('Alice', 'alice@ex.com'); -- Fragile column position dependency
```

*Fix:*
```sql
INSERT INTO users (name, email) VALUES ('Alice', 'alice@ex.com'); -- Explicit column targets
```

### Mistake 3: Executing Individual `INSERT` Statements in Loops Instead of Multi-Row Inserts

**The mistake:** Executing 1,000 separate `INSERT INTO` queries in application loops.

**Why it's wrong:** 1,000 separate `INSERT` statements generate 1,000 network RPCs and WAL flush commits. Use single multi-row inserts `INSERT INTO ... VALUES (...), (...)`.

*Incorrect:*
```sql
-- Executing 1,000 separate INSERT queries in loop
```

*Fix:*
```sql
INSERT INTO users (name, email) VALUES ('A', 'a@ex.com'), ('B', 'b@ex.com'); -- Single multi-row insert
```

## 5. Practice Exercises

### Exercise 1: Single Row Insertion with Generated Keys

**Scenario:**
Insert a new product row into `products` and retrieve its auto-generated `id`.

**Requirements:**
1. Execute `INSERT INTO products (name, price_cents) VALUES (...) RETURNING id`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> INSERT INTO products (sku, name, price_cents) 
> VALUES ('SKU-100', 'Wireless Mouse', 2999) 
> RETURNING id, created_at;
> ```
>
> #### Technical Explanation
>
> 1. `INSERT INTO` adds a new row to the table.
> 2. Omitting `id` triggers the identity sequence generator.
> 3. `RETURNING id` returns the newly generated primary key in a single database roundtrip.

---

### Exercise 2: Inserting Rows with Default Column Expressions

**Scenario:**
Insert a user row omitting `is_active` and `created_at` to rely on column default expressions.

**Requirements:**
1. Execute `INSERT INTO users (username, email) VALUES (...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> INSERT INTO users (username, email) 
> VALUES ('alice', 'alice@example.com');
> ```
>
> #### Technical Explanation
>
> 1. Columns omitted from the `INSERT` column list automatically receive their `DEFAULT` expressions.
> 2. Populates `is_active` as `TRUE` and `created_at` as `CURRENT_TIMESTAMP`.
> 3. Simplifies client insertion payloads.

---

### Exercise 3: Inserting Parameterized Data in Node.js

**Scenario:**
Execute a parameterized `INSERT` query from a Node.js Express route.

**Requirements:**
1. Use `pool.query('INSERT INTO ... VALUES ($1, $2)', [name, price])`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { pool } from "./db";

export async function createProduct(name: string, priceCents: number) {
  const text = `
    INSERT INTO products (name, price_cents) 
    VALUES ($1, $2) 
    RETURNING id, name, price_cents
  `;
  const res = await pool.query(text, [name, priceCents]);
  return res.rows[0];
}
```

> #### Technical Explanation
>
> 1. Parameterized queries (`$1`, `$2`) protect applications against SQL Injection.
> 2. Returns inserted row object cleanly.
> 3. Node.js backend integration.

---



## 6. Related Terms
- [Table (Relation)](../level_01/table.md) — The target data storage container.
- [Multi-row `INSERT` / `INSERT ... SELECT`](multi_row_insert.md) — Bulk insert optimizations.
- [`RETURNING` Clause](returning.md) — Returning data immediately after inserts.
- [`UPSERT` (`ON CONFLICT`)](upsert.md) — Related concept: `UPSERT` (`ON CONFLICT`).

---

## 7. Key Takeaways
- `INSERT INTO` is the SQL command used to write new rows of data into a table.
- Values are mapped to columns sequentially based on their index positions.
- Omitted columns are automatically populated with their default values or `NULL`.
- Attempting to write mismatched data types or violate constraints blocks the query.
- Always match columns and values counts exactly to avoid database parse errors.
