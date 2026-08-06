# Column (Field / Attribute)

> **Level 1 — What Is a Database?**
> A vertical category in a database table that defines the name, data type, and validation rules for a specific property that every row in the table must have.

---

## 1. Prerequisites
- [Table (Relation)](table.md) — The parent container grid where columns are defined.

---

## 2. Term Category

**Core Concept** (Table Attribute Specification): A Column defines a named attribute with a specified data type and constraints within a relational database table.



---

## 3. Explanation

### Environment Context
- **Universal standard** (Commonly called a **Field** in software engineering and an **Attribute** in mathematical database theory).

### (1) Design Motivation — "Why did we design this?"
If tables organize datasets and rows store individual records, we need a way to dictate the **structure** of those records. 

Without structure, a database would be a loose bucket of values where one user profile has a name and email, and another has a phone number and a profile picture, making it impossible to query data reliably.

The **Column** is designed to enforce this structure.

When you design a table, you declare a fixed list of columns. Each column acts as a strict category wrapper defining:
1.  **A Name:** (e.g., `created_at`).
2.  **A Data Type:** (e.g., every entry in this column must be a date).
3.  **Constraints:** (e.g., this value cannot be empty).

This enforces consistency: every single row inserted into the table is guaranteed to follow the exact same structural blueprint.

---

### (2) Reality Metaphor
Imagine a printed paper form:
-   The blank form template is your **Table** definition.
-   Each printed blank line on the form is a **Column**.
    -   Line 1: "First Name" (expects text).
    -   Line 2: "Date of Birth" (expects a date).
    -   Line 3: "Phone Number" (expects numbers).

When a patient fills out the form, their completed sheet is a **Row**. 

The patient cannot write their name in the phone number line; the form template dictates what goes where.

---

### (3) Code Examples

#### Declaring Columns
In SQL, columns are defined when the table is created:

```sql
CREATE TABLE products (
  -- Column 1: name is id, type is integer, must be unique
  id INTEGER PRIMARY KEY,
  -- Column 2: name is title, type is text
  title VARCHAR(100) NOT NULL,
  -- Column 3: name is price, type is decimal
  price NUMERIC(8,2) DEFAULT 0.00
);
```

#### Viewing Column Definitions (psql)
You can inspect the column structure of a table in the terminal:

```text
\d products

              Table "public.products"
 Column |          Type          | Collation | Nullable | Default 
--------+------------------------+-----------+----------+---------
 id     | integer                |           | not null | 
 title  | character varying(100) |           | not null | 
 price  | numeric(8,2)           |           |          | 0.00
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to store mismatched data types in a column

**The mistake:** Trying to insert the text string `'Pending'` or `'N/A'` inside a column defined as `INTEGER` or `DATE`.

**Why it's wrong:** Relational databases enforce **strict typing**. The database engine checks the data type of every incoming value. If it doesn't match the column's defined type, Postgres halts the query and returns a type mismatch error.

**Fix: Use `NULL` to represent missing or not-applicable values, or set the column type to `VARCHAR` if you must store text strings.**

---



### Mistake 2: Using Double Quotes for String Literals Instead of Single Quotes

**The mistake:** Writing `SELECT * FROM users WHERE username = "alice";`.

**Why it's wrong:** In SQL standards and PostgreSQL, double quotes `"field"` denote identifier names (tables, columns), while single quotes `'text'` denote text string literals. Using double quotes looks up column `alice`.

*Incorrect:*
```sql
SELECT * FROM users WHERE username = "alice"; -- ❌ Error: column "alice" does not exist!
```

*Fix:*
```sql
SELECT * FROM users WHERE username = 'alice'; -- Single quotes for string literals
```

### Mistake 3: Defining Mixed Case Column Names Without Quotes Causing Case-Insensitive Downcasing

**The mistake:** Creating column `firstName` without quotes expecting it to retain camelCase casing.

**Why it's wrong:** PostgreSQL automatically folds unquoted column identifiers to lower case (`firstname`). Quoting identifiers preserves casing (`"firstName"`), but forces quoting in all future queries.

*Incorrect:*
```sql
CREATE TABLE users ( firstName VARCHAR(50) ); -- Column created as lowercase 'firstname'!
```

*Fix:*
```sql
CREATE TABLE users ( first_name VARCHAR(50) ); -- Idiomatic snake_case column names
```

## 5. Practice Exercises

### Exercise 1: Defining Columns with Data Types and Integrity Constraints

**Scenario:**
Create a `products` table specifying strict column data types, default values, and `NOT NULL` constraints.

**Requirements:**
1. Use `CREATE TABLE products`.
2. Include `id`, `sku`, `name`, `price_cents`, and `created_at`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE products (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   sku TEXT NOT NULL UNIQUE,
>   name TEXT NOT NULL,
>   price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
>   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
> );
> ```
>
> #### Technical Explanation
>
> 1. Each column definition combines a name, data type (`INTEGER`, `TEXT`, `TIMESTAMPTZ`), and column constraints.
> 2. `NOT NULL` prevents unassigned NULL values in mandatory fields.
> 3. `CHECK (price_cents >= 0)` enforces domain business rules directly at the database tier.

---

### Exercise 2: Adding New Columns with Default Values

**Scenario:**
Add a new column `is_published` (`BOOLEAN`) to an existing `posts` table defaulting to `FALSE`.

**Requirements:**
1. Execute `ALTER TABLE posts ADD COLUMN`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE posts 
> ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT FALSE;
> ```
>
> #### Technical Explanation
>
> 1. `ALTER TABLE ... ADD COLUMN` modifies existing table structural definitions.
> 2. `DEFAULT FALSE` populates existing rows with `FALSE` during column creation.
> 3. Avoids table locks on modern PostgreSQL (PG 11+ handles non-volatile defaults instantly).

---

### Exercise 3: Dropping Obsolete Columns Safely

**Scenario:**
Remove an obsolete legacy column `temp_token` from table `users`.

**Requirements:**
1. Execute `ALTER TABLE users DROP COLUMN`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE users 
> DROP COLUMN temp_token;
> ```
>
> #### Technical Explanation
>
> 1. `DROP COLUMN` removes column definitions from table metadata.
> 2. Data in dropped columns is marked invalid and reclaimed during future `VACUUM` runs.
> 3. Verify application code no longer queries dropped columns prior to execution.

---



## 6. Related Terms
- [Table (Relation)](table.md) — The parent container.
- [Row (Record / Tuple)](row.md) — The horizontal record unit.
- [Relational Database](relational_database.md) — Related concept: Relational Database.

---

## 7. Key Takeaways
- A column is a vertical category that enforces structure across all rows in a table.
- Also called a "Field" in coding or an "Attribute" in formal relational database theory.
- Every column has a unique name and a strict data type (integer, text, date, etc.).
- Column data types are validated by the database engine, preventing type mismatches.
- Empty values inside columns are represented by the special marker `NULL`.
