# `INTEGER` / `BIGINT` / `SMALLINT`

> **Level 2 — Core Data Types & Constraints**
> The three primary whole-number data types in PostgreSQL, scaling in size and range to balance storage space with number capacity.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.

---

## 2. Term Category

**Data Type** (Exact Whole-Number Types): Integer data types (`SMALLINT`, `INTEGER`, `BIGINT`) store 2-byte, 4-byte, and 8-byte signed whole numbers.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Standard SQL types mapped to C binary signed integers under the hood).

### (1) Design Motivation — "Why did we design this?"
In database design, every byte counts. If you are storing whole numbers, you must choose a type that can fit your maximum expected value without wasting disk storage. 

If you store 1 billion rows of data, wasting just 4 bytes per row translates to 4 gigabytes of wasted hard drive space and slower search caches.

To balance storage capacity with numbers range limits, PostgreSQL provides three sizes of integers:

| Type | Storage Size | Range (Min to Max) | Best For |
| :--- | :--- | :--- | :--- |
| **`SMALLINT`** | 2 Bytes | `-32,768` to `32,767` | User age, calendar year, status enums, 1-5 ratings. |
| **`INTEGER`** | 4 Bytes | `-2,147,483,648` to `2,147,483,647` | Standard counts, product inventory, default primary IDs. |
| **`BIGINT`** | 8 Bytes | `-9.22 Quintillion` to `9.22 Quintillion` | Web analytics click logs, global transactions, massive tables. |

---

### (2) Reality Metaphor
Imagine choosing packaging boxes for shipping:
-   **`SMALLINT`** is a small padded letter envelope. It is cheap and takes up almost no space in the delivery truck, but it can only fit flat items (small numbers).
-   **`INTEGER`** is a standard shoebox. It fits most everyday items.
-   **`BIGINT`** is a massive wooden shipping crate. It takes up a huge amount of space in the truck, but it can hold large heavy engines (huge numbers) without breaking.

If you only ship house keys (numbers like `25`), putting them inside massive shipping crates is a waste of cargo space.

---

### (3) Code Examples

#### Creating a Table with Integer Scales
```sql
CREATE TABLE game_stats (
  user_id BIGINT,              -- Expecting billions of players globally
  current_level SMALLINT,      -- Levels will never exceed 100
  total_score INTEGER          -- Score can reach millions
);
```

#### Overflow Failure Example
If you try to save a value outside the type range, Postgres returns a strict overflow error:

```sql
CREATE TABLE rating_log (
  stars SMALLINT
);

-- This query crashes because 99999 exceeds SMALLINT's maximum limit of 32,767!
INSERT INTO rating_log (stars) VALUES (99999);
-- ERROR: value "99999" is out of range for type smallint
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using standard INTEGER for auto-incrementing IDs on high-traffic log tables

**The mistake:** Defining a table for tracking web analytics clicks or API audit logs, and setting the auto-increment ID column type to `INTEGER`.

**Why it's wrong:** An `INTEGER` maxes out at 2.14 billion. For high-traffic applications logging millions of actions daily, you can hit 2.14 billion rows within months. When the counter reaches `2,147,483,647` and tries to insert the next row, it overflows, crashes, and shuts down all write functions.

**Fix: Always use `BIGINT` for primary key IDs on high-volume tables that will hold log data, click trackers, or chat histories.**

---



### Mistake 2: Using 32-Bit `INTEGER` for Primary Keys on High-Growth Tables (Integer Overflow)

**The mistake:** Defining auto-increment primary keys as 32-bit `INT` / `SERIAL` on high-volume activity tables.

**Why it's wrong:** 32-bit integers cap out at 2,147,483,647 ($2.1$ billion). Exceeding 2.1B rows throws integer overflow error `integer out of range`. Use 64-bit `BIGINT` / `BIGSERIAL`.

*Incorrect:*
```sql
id SERIAL PRIMARY KEY -- ❌ Limited to 2.1 billion rows!
```

*Fix:*
```sql
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY -- Supports up to 9 quintillion rows
```

### Mistake 3: Using `SMALLINT` for Primary Key ID Columns

**The mistake:** Using `SMALLINT` for primary key IDs on entity tables.

**Why it's wrong:** `SMALLINT` is 16-bit, capping out at 32,767 values. Use `SMALLINT` only for fixed status codes or small domain enumerations.

*Incorrect:*
```sql
id SMALLINT PRIMARY KEY -- ❌ Max 32,767 records!
```

*Fix:*
```sql
id INT PRIMARY KEY or BIGINT PRIMARY KEY
```

## 5. Practice Exercises

### Exercise 1: Sizing Integer Types Based on Expected Bounds

**Scenario:**
Create an `inventory_items` table selecting `SMALLINT` for status codes, `INTEGER` for quantity, and `BIGINT` for total serial numbers.

**Requirements:**
1. Execute `CREATE TABLE inventory_items (...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE inventory_items (
>   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   status_code SMALLINT NOT NULL,
>   quantity INTEGER NOT NULL CHECK (quantity >= 0),
>   serial_number BIGINT NOT NULL UNIQUE
> );
> ```
>
> #### Technical Explanation
>
> 1. `SMALLINT` (2 bytes) handles values -32,768 to 32,767 (ideal for status codes).
> 2. `INTEGER` (4 bytes) handles values up to 2.1 billion.
> 3. `BIGINT` (8 bytes) handles values up to 9 quintillion (essential for high-volume primary keys and serial numbers).
> 
---

### Exercise 2: Preventing Integer Overflow Exceptions

**Scenario:**
Audit a table storing transaction counters to upgrade `INTEGER` to `BIGINT` before overflow errors occur.

**Requirements:**
1. Execute `ALTER TABLE metrics ALTER COLUMN counter TYPE BIGINT`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE metrics 
> ALTER COLUMN counter TYPE BIGINT;
> ```
>
> #### Technical Explanation
>
> 1. Exceeding 2,147,483,647 on an `INTEGER` column throws `integer out of range` error (Code 22003).
> 2. Altering type to `BIGINT` expands capacity to 9.22 × 10^18.
> 3. Protects production databases from counter exhaustion.
> 
---

### Exercise 3: Atomic Integer Incrementing

**Scenario:**
Atomically increment a page view counter by 1 and decrement stock quantity by 1.

**Requirements:**
1. Execute `UPDATE` with `stock = stock - 1`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> UPDATE products 
> SET stock = stock - 1,
>     views = views + 1 
> WHERE id = 10 
>   AND stock > 0 
> RETURNING stock, views;
> ```
>
> #### Technical Explanation
>
> 1. Arithmetic operators (`+`, `-`) operate over integer data types atomically.
> 2. `WHERE stock > 0` prevents stock count from dropping below zero during concurrent writes.
> 3. Safe thread-safe integer updating.
> 
---



## 6. Related Terms
- [Data Types (Overview)](data_types.md) — The parent typing framework.
- [`SERIAL` / `GENERATED ALWAYS AS IDENTITY`](serial_identity.md) — Auto-incrementing integers.
- [`TEXT` / `VARCHAR` / `CHAR`](text_types.md) — Related concept: `TEXT` / `VARCHAR` / `CHAR`.

---

## 7. Key Takeaways
- PostgreSQL provides three primary integer sizes: `SMALLINT`, `INTEGER`, and `BIGINT`.
- `SMALLINT` uses 2 bytes (up to 32k); `INTEGER` uses 4 bytes (up to 2.1 billion).
- `BIGINT` uses 8 bytes and is essential for high-volume logs and IDs.
- Exceeding the maximum value of a type triggers a database crash (Integer Overflow).
- Choose the smallest type that safely covers the range of expected values.
