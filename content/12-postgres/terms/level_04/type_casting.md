# Type Casting (`CAST` / `::`)

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL syntax used to temporarily convert a value or column from one data type to another during query execution.

---

## 1. Prerequisites
- [Data Types (Overview)](../level_02/data_types.md) — The database typing system.

---

## 2. Term Category
- **SQL Query Syntax**

---

## 3. Environment Context
- **PostgreSQL Core** (Postgres supports the standard `CAST` syntax and provides the highly popular `::` double-colon shorthand for brevity).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational databases enforce strict typing. But sometimes, queries require you to treat a value as a different type:

1.  **Integer Division:** In Postgres, dividing two integers yields an integer: `5 / 2` returns `2`. To get the decimal result `2.5`, you must convert at least one number to a float.
2.  **Schema Mismatches:** You import data from a legacy CSV file where the `user_id` is stored as text (`VARCHAR`). You need to link it to your `users` table where `id` is an `INTEGER`.
3.  **Function Constraints:** A database function requires a date type, but your column holds a timestamp.

We designed **Type Casting** to solve this. It allows you to convert values on-the-fly. The database engine re-reads the binary bytes of the value and maps them to the new type context.

---

### (2) The Two Syntaxes in PostgreSQL

#### 1. ANSI-SQL Standard: `CAST(x AS type)`
This is the standard SQL syntax. It is portable across MySQL, Oracle, and SQL Server:

```sql
SELECT CAST(age AS VARCHAR) FROM users;
```

#### 2. PostgreSQL Shorthand: `x::type`
This is a PostgreSQL-specific shorthand. Developers prefer it because it is much shorter and easier to read:

```sql
SELECT age::VARCHAR FROM users;
```

---

### (3) Reality Metaphor
Imagine traveling abroad:
-   Your hairdryer has a **flat US plug** (data type A).
-   The hotel wall has a **circular European outlet** (data type B).
-   You cannot force the flat plug into the round hole.
-   Instead of buying a new hairdryer, you attach a small **adapter plug** (the type cast `::`). For the duration of your trip, the plug fits.

---

### (4) Code Examples

#### Fixing Integer Division
```sql
-- 1. Default Integer Division
SELECT 5 / 2;
-- Returns: 2 (Integer)

-- 2. Fixed with Type Casting
SELECT 5::FLOAT / 2;
-- Returns: 2.5 (Float)
```

#### Casting Text to Integer
```sql
CREATE TABLE legacy_data (
  user_code VARCHAR(20) -- Stores numeric codes as text (e.g. '105')
);

-- Cast to integer to perform math comparisons
SELECT user_code
FROM legacy_data
WHERE user_code::INTEGER > 100;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to cast unparsable strings to numbers

**The mistake:** Running a query that casts a text column containing mixed letters and numbers to an integer:

```sql
-- BAD: If any row contains letters (like 'N/A' or 'B3'), the query crashes!
SELECT user_code::INTEGER FROM legacy_data;
-- ERROR: invalid input syntax for type integer: "N/A"
```

**Why it's wrong:** Type casting is not magic; the database must be able to logically parse the string. If Postgres encounters non-numeric characters while converting to an integer, it aborts the entire transaction.

**Fix: Before casting, filter out invalid rows using a `WHERE` clause, or ensure your data is clean.**

---



### Mistake 2: Attempting Implicit String to Number Comparisons in Strict PostgreSQL Type Checking

**The mistake:** Executing `SELECT * FROM users WHERE id = '100';` when `id` is an integer.

**Why it's wrong:** Unlike MySQL or PHP, PostgreSQL enforces strict type checking. Comparing mismatched types without casting can prevent index usage or throw type errors. Cast explicitly (`id = 100` or `'100'::INT`).

*Incorrect:*
```sql
SELECT * FROM users WHERE age = '30'; -- Implicit string casting
```

*Fix:*
```sql
SELECT * FROM users WHERE age = 30; -- Matching integer literal
```

### Mistake 3: Confusing Postfix `::type` Casting Syntax with Standard `CAST(val AS type)`

**The mistake:** Failing to recognize PostgreSQL double colon `::` casting shorthand.

**Why it's wrong:** `val::type` is PostgreSQL's concise shorthand for standard SQL `CAST(val AS type)` syntax.

*Incorrect:*
```sql
-- Thinking val::text is non-standard invalid SQL syntax
```

*Fix:*
```sql
Use val::text for concise Postgres casting or CAST(val AS text) for ANSI SQL compliance
```

## 6. Practice Exercises

### Exercise 1: Percentage Calculation

**Problem:** You have a table `clicks_log` with columns `clicks` and `views` (both are `INTEGER` columns). Write a SQL query that calculates the click-through rate as `clicks / views`. Multiply by 100 to get a percentage. Ensure the calculation uses decimal division (so you don't get `0` returned!). Label the output column as `ctr_percent`.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT (clicks::FLOAT / views) * 100 AS ctr_percent 
> FROM clicks_log;
> ```
> - Cast the `clicks` column to `FLOAT` (using `::FLOAT`) before performing the division.
> - Wrap the division in parenthesis before multiplying by 100.

---



### Exercise 2: Casting String to Integer and Timestamp

**Problem:** Cast string `'123'` to integer and string `'2026-01-01'` to `TIMESTAMPTZ` using `::` syntax.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT '123'::INT AS num, '2026-01-01'::TIMESTAMPTZ AS ts;
> ```
> ```sql
> SELECT '123'::INT AS num, '2026-01-01'::TIMESTAMPTZ AS ts;
> ```
>
> **Explanation:** `expression::type` performs explicit data type casting in PostgreSQL.

---

### Exercise 3: Safe Casting with `pg_input_is_valid()`

**Problem:** Check if string `'abc'` is a valid integer before casting using `pg_input_is_valid()` in Postgres 16+.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT pg_input_is_valid('abc', 'integer');
> ```
> ```sql
> SELECT pg_input_is_valid('abc', 'integer');
> ```
>
> **Explanation:** `pg_input_is_valid(string, type)` tests whether strings can be cast safely without throwing errors.

## 7. Related Terms
- [Data Types (Overview)](../level_02/data_types.md) — The parent typing framework.

---

## 8. Key Takeaways
- Type casting temporarily converts a value's data type inside a query.
- Standard syntax is `CAST(expression AS type)`.
- PostgreSQL shorthand is `expression::type` (e.g. `price::INTEGER`).
- Cast integers to floats to prevent truncated integer division.
- Casting invalid strings (e.g. `'N/A'::INT`) immediately crashes the transaction.
