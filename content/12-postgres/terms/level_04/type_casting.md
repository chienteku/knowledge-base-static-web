# Type Casting (`CAST` / `::`)

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL syntax used to temporarily convert a value or column from one data type to another during query execution.

---

## 1. Prerequisites
- [Data Types (Overview)](../level_02/data_types.md) — The database typing system.

---

## 2. Term Category

**SQL Command / Clause** (Explicit Type Conversion): Type Casting (`CAST(val AS type)` or `val::type`) converts data values between compatible PostgreSQL data types.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Postgres supports the standard `CAST` syntax and provides the highly popular `::` double-colon shorthand for brevity).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Casting Strings to Integer and Decimal Types

**Scenario:**
Cast a string numeric value `'1299'` to `INTEGER` and `'99.95'` to `NUMERIC(10, 2)`.

**Requirements:**
1. Use `'1299'::INTEGER` and `CAST('99.95' AS NUMERIC(10, 2))`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   '1299'::INTEGER AS price_cents,
>   CAST('99.95' AS NUMERIC(10, 2)) AS price_dollars;
> ```
>
> #### Technical Explanation
>
> 1. `::type` is PostgreSQL shorthand cast syntax; `CAST(val AS type)` is ANSI SQL standard.
> 2. Converts binary representations into target data types.
> 3. Throws error 22P02 (`invalid_text_representation`) if string contains unparseable values.
> 
---

### Exercise 2: Casting JSON Strings to JSONB Objects

**Scenario:**
Cast a text JSON string into a binary `JSONB` data type to execute JSON key extraction.

**Requirements:**
1. Use `'{"theme": "dark"}'::JSONB`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   ('{"theme": "dark", "notifications": true}'::JSONB)->>'theme' AS user_theme;
> ```
>
> #### Technical Explanation
>
> 1. Casting string text to `JSONB` parses and validates JSON syntax.
> 2. Enables PostgreSQL `JSONB` operators (`->`, `->>`).
> 3. Crucial for handling un-parsed JSON payloads.
> 
---

### Exercise 3: Integer to Text Array Casting for Dynamic Queries

**Scenario:**
Cast integer `id` to `TEXT` for string concatenation in report formatting.

**Requirements:**
1. Use `id::TEXT`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   'USR-' || LPAD(id::TEXT, 6, '0') AS formatted_user_code 
> FROM users;
> ```
>
> #### Technical Explanation
>
> 1. String concatenation (`||`) requires compatible text types.
> 2. `id::TEXT` converts integer keys into text strings for `LPAD()` formatting.
> 3. Produces zero-padded codes (`"USR-000042"`).
> 
---



## 6. Related Terms
- [Data Types (Overview)](../level_02/data_types.md) — The parent typing framework.
- [`CASE` Expression](case_expression.md) — Related concept: `CASE` Expression.
- [`COALESCE` / `NULLIF`](coalesce_nullif.md) — Related concept: `COALESCE` / `NULLIF`.

---

## 7. Key Takeaways
- Type casting temporarily converts a value's data type inside a query.
- Standard syntax is `CAST(expression AS type)`.
- PostgreSQL shorthand is `expression::type` (e.g. `price::INTEGER`).
- Cast integers to floats to prevent truncated integer division.
- Casting invalid strings (e.g. `'N/A'::INT`) immediately crashes the transaction.
