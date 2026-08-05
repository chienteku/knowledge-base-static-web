# `INTEGER` / `BIGINT` / `SMALLINT`

> **Level 2 — Core Data Types & Constraints**
> The three primary whole-number data types in PostgreSQL, scaling in size and range to balance storage space with number capacity.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.
---

## 2. Term Category
- **PostgreSQL Data Type**

---

## 3. Environment Context
- **PostgreSQL Core** (Standard SQL types mapped to C binary signed integers under the hood).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Sizing Assessment

**Problem:** You are designing a table for a library database. Select the best integer type (`SMALLINT`, `INTEGER`, or `BIGINT`) for each of the following properties to optimize space:
1.  The year a book was published (e.g. `2026`).
2.  The global international book index barcode number (ISBN) (e.g. `9780123456789`).
3.  The quantity of a book copy currently in stock (typically ranges from `0` to `500`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Publication Year: SMALLINT (Year numbers are around 2000, easily fitting inside 32,767).
> 2. ISBN Barcode: BIGINT (ISBN codes are 13 digits long, which far exceeds the 2.14 billion limit of a standard INTEGER).
> 3. Stock Quantity: SMALLINT (Stock numbers easily fit inside 32,767).
> ```
> - Match maximum possible value numbers with range tables.
> - Barcodes are long number strings; verify if they fit in 2 billion limits.

---



### Exercise 2: Integer Type Size Breakdown

**Problem:** List 3 integer types in PostgreSQL and byte sizes (`SMALLINT`: 2 bytes, `INTEGER`: 4 bytes, `BIGINT`: 8 bytes).

**Expected output:**
> [!check]- Answer
> ```text
> SMALLINT (2 bytes), INTEGER (4 bytes), BIGINT (8 bytes)
> ```
> ```text
> SMALLINT (2 bytes), INTEGER (4 bytes), BIGINT (8 bytes)
> ```
>
> **Explanation:** Integer types provide 16-bit, 32-bit, and 64-bit signed integer storage.

---

### Exercise 3: Maximum Value of 32-Bit Integer

**Problem:** What is the maximum positive signed value for a 32-bit `INTEGER` in PostgreSQL? (`2,147,483,647`).

**Expected output:**
> [!check]- Answer
> ```text
> 2,147,483,647 (2.14 billion)
> ```
> ```text
> 2,147,483,647 (2.14 billion)
> ```
>
> **Explanation:** Exceeding $2^{31}-1$ causes integer overflow errors.

## 7. Related Terms
- [Data Types (Overview)](data_types.md) — The parent typing framework.
- [`SERIAL` / `GENERATED ALWAYS AS IDENTITY`](serial_identity.md) — Auto-incrementing integers.
- [`TEXT` / `VARCHAR` / `CHAR`](text_types.md) — Related concept: `TEXT` / `VARCHAR` / `CHAR`.
---

## 8. Key Takeaways
- PostgreSQL provides three primary integer sizes: `SMALLINT`, `INTEGER`, and `BIGINT`.
- `SMALLINT` uses 2 bytes (up to 32k); `INTEGER` uses 4 bytes (up to 2.1 billion).
- `BIGINT` uses 8 bytes and is essential for high-volume logs and IDs.
- Exceeding the maximum value of a type triggers a database crash (Integer Overflow).
- Choose the smallest type that safely covers the range of expected values.
