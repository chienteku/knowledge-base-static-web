# Data Types (Overview)

> **Level 2 — Core Data Types & Constraints**
> The system of categories (e.g. integers, strings, timestamps) that dictates what kind of values a column can store, how they are represented on disk, and what operations can be performed on them.

---

## 1. Prerequisites
- [Column (Field / Attribute)](../level_01/column.md) — Understanding table structures.

---

## 2. Term Category

**Core Concept** (Type System Specification): Data Types define the binary storage layout, operations, and validation rules for table columns in PostgreSQL.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Every relational database enforces a strict typing system. PostgreSQL translates SQL types to native C data types under the hood).

### (1) Design Motivation — "Why did we design this?"
In dynamic programming languages like JavaScript, variables can hold anything:

```javascript
let data = 42;
data = "Hello"; // Perfectly valid in JS
```

However, databases are designed for long-term storage, high-speed queries, and absolute integrity. If we let database columns hold anything:
1.  **Data Corruption:** One row might store `2026` for a year, while another stores `'N/A'`, and a third stores `'two thousand and twelve'`. If you try to run math on this column (like sorting or averaging), the database will crash.
2.  **Storage Inefficiency:** Storing numbers as text strings takes up to 4x more disk space than storing them as raw binary integers.
3.  **No Optimizations:** The database cannot create specialized indexes (like geographical map grids or date range logs) if it doesn't know the exact nature of the values.

We designed **Data Types** to solve these issues. 

By declaring a data type for each column (e.g., "This is an integer"), you force Postgres to validate every incoming write, guarantee consistent disk usage, and enable fast indexing.

---

### (2) Reality Metaphor
Imagine a kitchen sorting drawer:
-   You have specialized slots: an **egg carton** (only fits eggs), a **knife block** (only fits knives), and a **spice rack** (only fits small jars).
-   If you try to put a knife inside the egg carton, it doesn't fit, and you risk breaking things.
-   By using specialized slots, you know exactly what is inside each slot (organization), and you can retrieve tools instantly without sorting (efficiency).

---

### (3) Code Examples

#### Creating a Typed Table
In SQL, you must specify a data type for every single column you create:

```sql
CREATE TABLE users (
  id INTEGER,                  -- Numeric type
  username VARCHAR(50),        -- Text/Character type
  is_active BOOLEAN,           -- Logical true/false type
  registered_at TIMESTAMPTZ    -- Date & Time with timezone
);
```

#### The Type Mismatch Failure
If you try to insert mismatched data, the database rejects it at the gate:

```sql
-- This query fails immediately because 'invalid_date_string' cannot be parsed as a timestamp!
INSERT INTO users (id, username, is_active, registered_at) 
VALUES (1, 'john_doe', TRUE, 'invalid_date_string');
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing all data as VARCHAR or TEXT to "simplify design"

**The mistake:** Defining every column as a text string (like storing dates, prices, and status flags as text) so you don't have to worry about database validation errors.

**Why it's wrong:** While it makes initial writes easy, it ruins your database. You cannot perform mathematical sums on text prices, you cannot calculate ages using text dates, and you waste significant disk space because text requires more storage bytes than raw numbers or booleans.

**Fix: Always select the most specific, matching data type for your columns (e.g., `NUMERIC` for cash, `TIMESTAMPTZ` for time, `BOOLEAN` for flags).**

---



### Mistake 2: Using `VARCHAR(255)` Out of Habit from MySQL Legacy Systems

**The mistake:** Defining all text fields as `VARCHAR(255)` in PostgreSQL schemas.

**Why it's wrong:** In PostgreSQL, `TEXT` and `VARCHAR(N)` have IDENTICAL performance and storage efficiency! Using `VARCHAR(255)` adds arbitrary length restrictions without performance gain.

*Incorrect:*
```sql
name VARCHAR(255) -- Arbitrary legacy 255 character limit
```

*Fix:*
```sql
name TEXT -- Unconstrained, performant text storage in Postgres
```

### Mistake 3: Using Float `REAL` or `DOUBLE PRECISION` for Financial Monetary Balances

**The mistake:** Defining financial balance columns as `FLOAT` or `DOUBLE PRECISION`.

**Why it's wrong:** Floating-point numbers suffer binary rounding errors (`0.1 + 0.2 != 0.3`). Use `NUMERIC(12, 2)` for exact monetary calculations.

*Incorrect:*
```sql
balance DOUBLE PRECISION -- ❌ Floating-point rounding errors!
```

*Fix:*
```sql
balance NUMERIC(12, 2) -- Exact fixed-point decimal precision
```

## 5. Practice Exercises

### Exercise 1: Selecting Appropriate Numeric Types

**Scenario:**
Design an e-commerce `orders` table selecting exact data types for IDs (`BIGINT`), status (`TEXT`), and price (`NUMERIC(10,2)`).

**Requirements:**
1. Execute `CREATE TABLE orders (...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE orders (
>   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   order_status TEXT NOT NULL,
>   total_amount NUMERIC(10, 2) NOT NULL,
>   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
> );
> ```
>
> #### Technical Explanation
>
> 1. `BIGINT` (8-byte integer) prevents ID sequence exhaustion on high-volume tables.
> 2. `NUMERIC(10, 2)` guarantees exact decimal financial calculations without binary float rounding errors.
> 3. `TIMESTAMPTZ` stores microsecond UTC timestamps.

---

### Exercise 2: Auditing Column Data Types in System Catalogs

**Scenario:**
Query PostgreSQL system catalog `information_schema.columns` to inspect data types for table `orders`.

**Requirements:**
1. Query `information_schema.columns` filtering `table_name = 'orders'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   column_name, 
>   data_type, 
>   is_nullable, 
>   column_default 
> FROM information_schema.columns 
> WHERE table_name = 'orders';
> ```
>
> #### Technical Explanation
>
> 1. `information_schema.columns` provides ANSI SQL compliant metadata telemetry on table structures.
> 2. Inspects target data types, nullability rules, and default expressions.
> 3. Useful for building automated schema generators and documentation tools.

---

### Exercise 3: Explicit Column Type Conversion with CAST

**Scenario:**
Cast a string numeric column `price_str` to `NUMERIC(10, 2)` in a data cleanup `SELECT` query.

**Requirements:**
1. Use `CAST(price_str AS NUMERIC(10, 2))` or `price_str::NUMERIC(10, 2)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id, 
>   price_str::NUMERIC(10, 2) AS price_numeric 
> FROM legacy_products;
> ```
>
> #### Technical Explanation
>
> 1. `::` is the PostgreSQL shorthand cast operator (equivalent to ANSI `CAST(x AS type)`).
> 2. Converts string representations into binary numeric data types.
> 3. Throws a SQL cast error if string contains unparseable non-numeric characters.

---



## 6. Related Terms
- [`INTEGER` / `BIGINT` / `SMALLINT`](integer_types.md) — Numeric integer types.
- [`TEXT` / `VARCHAR` / `CHAR`](text_types.md) — Character text types.
- [`BOOLEAN`](boolean.md) — Related concept: `BOOLEAN`.
- [`CHECK` Constraint](check_constraint.md) — Related concept: `CHECK` Constraint.
- [`DATE` / `TIME` / `TIMESTAMP` / `TIMESTAMPTZ`](date_time_types.md) — Related concept: `DATE` / `TIME` / `TIMESTAMP` / `TIMESTAMPTZ`.
- [`DEFAULT` Value](default_value.md) — Related concept: `DEFAULT` Value.
- [`NULL`](null.md) — Related concept: `NULL`.
- [`NUMERIC` / `DECIMAL` / `REAL` / `DOUBLE PRECISION`](numeric_types.md) — Related concept: `NUMERIC` / `DECIMAL` / `REAL` / `DOUBLE PRECISION`.
- [Type Casting (`CAST` / `::`)](../level_04/type_casting.md) — Related concept: Type Casting (`CAST` / `::`).
- [`ENUM` Type](../level_06/enum_type.md) — Related concept: `ENUM` Type.
- [`JSON` / `JSONB` Type](../level_06/json_jsonb.md) — Related concept: `JSON` / `JSONB` Type.
- [`UUID` Type](../level_06/uuid_type.md) — Related concept: `UUID` Type.

---

## 7. Key Takeaways
- Relational databases enforce strict typing on all table columns.
- Data types validate incoming data, optimize storage space, and enable indexing.
- Type errors cause the database server to immediately reject invalid query writes.
- Never store all parameters as text; always match columns with their specific type.
- Common categories include Numeric, Character/Text, Temporal, and Boolean.
