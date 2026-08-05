# `NUMERIC` Precision & Scale

> **Level 2 — Core Data Types & Constraints**
> The configuration parameters for the `NUMERIC` data type, written as `NUMERIC(precision, scale)`, that define the exact total number of digits and decimal places allowed in a column.

---

## 1. Prerequisites
- [`NUMERIC` / `DECIMAL` / `REAL` / `DOUBLE PRECISION`](numeric_types.md) — The parent exact numeric type.
---

## 2. Term Category
- **PostgreSQL Data Type Parameter**

---

## 3. Environment Context
- **PostgreSQL Core** (Enforced on insert. Values that exceed the scale are rounded to the defined limit; values that exceed the precision trigger an execution error).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When you declare a column as `NUMERIC` to store exact decimal numbers (like cash values or gold weights), you don't want to use the default unlimited settings. 

By default, an unconfigured `NUMERIC` column in Postgres allows up to 131,072 digits before the decimal and 16,383 digits after it, which wastes database storage and slows indexing down.

To constrain storage, you must define **Precision** and **Scale**:
-   **Precision:** The **total count of digits** allowed in the entire number, spanning both sides of the decimal point.
-   **Scale:** The count of digits allowed **to the right of the decimal point** (the fractional part).

For example, to store product prices, you want exactly 2 decimal places (cents) and up to 8 digits for the dollars. You would declare this as `NUMERIC(10, 2)` (10 total digits minus 2 decimal digits leaves 8 dollar digits).

---

### (2) How Postgres Handles Exceeded Values
If a client inserts a number:
-   **Exceeding the Scale (Decimal places):** Postgres will **automatically round** the fractional part to fit. (e.g. inserting `10.995` into a `NUMERIC(10,2)` column will round up to `11.00`).
-   **Exceeding the Precision (Total size):** Postgres **rejects** the insert and throws an out-of-range error.

---

### (3) Reality Metaphor
Imagine filling out a bank check:
-   The check has a series of printed boxes for you to write the amount: `[ ][ ][ ][ ][ ].[ ][ ]`.
-   There are a total of 7 boxes (this is the **Precision**).
-   There are exactly 2 boxes after the decimal point (this is the **Scale**).

This template allows you to write any amount up to `99,999.99`. 

If you try to write a number like `1,000,000` (which requires 9 total boxes), the check runs out of space, and the bank rejects it.

---

### (4) Code Examples

#### Creating a Financial Table
```sql
CREATE TABLE inventory_items (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  -- Max price: 99,999,999.99 (10 total digits, 2 decimals)
  price NUMERIC(10, 2),
  -- Max purity: 0.99999 (5 total digits, 5 decimals)
  gold_purity NUMERIC(5, 5)
);
```

#### The Automatic Rounding Behavior
```sql
INSERT INTO inventory_items (id, name, price)
VALUES (1, 'Silver Ring', 19.998); 

SELECT price FROM inventory_items WHERE id = 1;
-- Output: 20.00 (Postgres rounded 19.998 to 2 decimal places!)
```

#### Out-of-Range Failure Example
```sql
-- This crashes because 1234.56 has 6 total digits, but gold_purity has a precision cap of 5!
INSERT INTO inventory_items (id, name, gold_purity)
VALUES (2, 'Error Gold', 1234.56);
-- ERROR: numeric field overflow
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing Precision with the number of digits allowed BEFORE the decimal point

**The mistake:** Declaring `NUMERIC(10,2)` and assuming it allows you to store a number with 10 digits in the dollar amount (like `12,345,678,901.50`).

**Why it's wrong:** Precision is the **total** number of digits. If precision is 10 and scale is 2, the dollar amount can only hold up to 8 digits (`10 - 2 = 8`). The largest number you can write is `99,999,999.99`.

**Fix: Calculate precision as: `digits before decimal + digits after decimal`. To store up to 10 digits before the decimal with 2 decimal places, define it as `NUMERIC(12, 2)`.**

---



### Mistake 2: Confusing Precision and Scale Parameters in `NUMERIC(precision, scale)`

**The mistake:** Defining `NUMERIC(2, 10)` expecting to store large numbers with 10 decimal digits.

**Why it's wrong:** In `NUMERIC(P, S)`, `precision` (P) is the TOTAL count of digits (before + after decimal point), while `scale` (S) is the count of digits AFTER the decimal point. P MUST be greater than or equal to S ($P \ge S$).

*Incorrect:*
```sql
balance NUMERIC(2, 10) -- ❌ Error: scale cannot be greater than precision!
```

*Fix:*
```sql
balance NUMERIC(12, 2) -- 12 total digits, 2 decimal places (up to 999,999,999.99)
```

### Mistake 3: Exceeding Declared Precision Limits on Numeric Insertion

**The mistake:** Inserting `12345.67` into a `NUMERIC(5, 2)` column.

**Why it's wrong:** `NUMERIC(5, 2)` allows at most $5 - 2 = 3$ digits before the decimal point (max `999.99`). Inserting `12345.67` throws numeric overflow error `numeric field overflow`.

*Incorrect:*
```sql
INSERT INTO t (val) VALUES (12345.67); -- ❌ Numeric overflow error!
```

*Fix:*
```sql
val NUMERIC(10, 2) -- Allows up to 8 digits before decimal point
```

## 6. Practice Exercises

### Exercise 1: Range Mathematics

**Problem:** You are creating a column to store percentages (e.g. `98.75%`). The values can range from `0.000%` to `100.000%`. What is the optimal `NUMERIC(precision, scale)` setting for this column, and what is the maximum number it can store?

**Expected output:**
> [!check]- Answer
> ```text
> Setting: `NUMERIC(6, 3)`
> Reason: The maximum value `100.000` has 6 total digits (precision of 6) with exactly 3 digits after the decimal point (scale of 3).
> Maximum Number: `999.999` (Though your application logic would limit it to 100.000, the database column structure allows up to 999.999).
> ```
> - Count the total digits in `100.000`.
> - Count the digits to the right of the decimal point.

---



### Exercise 2: Defining Financial Currency Numeric Column

**Problem:** Define `price` column using `NUMERIC` holding up to $99,999,999.99$ (10 total digits, 2 scale).

**Expected output:**
> [!check]- Answer
> ```text
> price NUMERIC(10, 2)
> ```
> ```sql
> price NUMERIC(10, 2)
> ```
>
> **Explanation:** `NUMERIC(10, 2)` stores up to 8 digits before and 2 digits after the decimal.

---

### Exercise 3: Precision and Scale Definition

**Problem:** Define Precision vs Scale in `NUMERIC(P, S)` (Precision: total number of digits; Scale: number of decimal digits after point).

**Expected output:**
> [!check]- Answer
> ```text
> Precision: total number of digits; Scale: number of decimal digits after point
> ```
> ```text
> Precision: total number of digits; Scale: number of decimal digits after point
> ```
>
> **Explanation:** Precision and scale enforce exact fixed-point decimal boundaries.

## 7. Related Terms
- [`NUMERIC` / `DECIMAL` / `REAL` / `DOUBLE PRECISION`](numeric_types.md) — The parent exact numeric type.
---

## 8. Key Takeaways
- Precision is the total number of digits; Scale is the number of decimal digits.
- Syntax format: `NUMERIC(precision, scale)`.
- If an input exceeds the scale, Postgres automatically rounds the value.
- If an input exceeds the precision boundaries, Postgres returns a numeric overflow error.
- Calculate precision as `dollar digits + cent digits` (e.g., `10,2` allows 8 dollar digits).
