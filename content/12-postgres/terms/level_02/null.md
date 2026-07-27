# `NULL`

> **Level 2 — Core Data Types & Constraints**
> A special database marker indicating the absence of a value (missing, unknown, or not applicable data), governed by unique comparison and propagation rules.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding table columns setup.

---

## 2. Term Category
- **Core Architecture Concept**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL databases. Implements ANSI-SQL three-valued logic).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In real-world data collection, information is often missing:
-   A customer signs up but refuses to fill in their middle name.
-   An invoice is created but has not been paid yet (so the `payment_date` is empty).
-   A sensor fails to log the temperature for 1 hour.

In programming languages, we represent this using `null`, `undefined`, or empty strings `""`.

In SQL databases, we use the special marker **`NULL`**.

It is critical to understand: **`NULL` is not a value.** It is a marker indicating the *complete absence* of a value. Because of this, `NULL` behaves differently than zero, false, or an empty string.

---

### (2) Three-Valued Logic (3VL)
In standard logic, things are either `TRUE` or `FALSE`. SQL implements a third logic state: **`UNKNOWN`** (represented by `NULL`).

If you ask: *"Does Bob's age equal Alice's age?"* and Alice's age is `NULL` (unknown), the database cannot answer `TRUE` or `FALSE`. It answers `UNKNOWN`.

---

### (3) The Comparison Rule (Is it Equal?)
Because `NULL` is not a value, you **cannot** compare it using standard operators like `=` or `<>`. 
-   `NULL = NULL` does not evaluate to `TRUE`. It evaluates to `UNKNOWN` (NULL).
-   To check for null states, you must use the specialized SQL operators **`IS NULL`** and **`IS NOT NULL`**.

---

### (4) Mathematical Propagation
Any arithmetic calculation containing a `NULL` immediately collapses and returns `NULL`:

-   `5 + NULL = NULL`
-   `'Hello' || NULL = NULL`

If you try to sum numbers and one of them is missing (unknown), the sum becomes mathematically unknown.

---

### (5) Reality Metaphor
Imagine a paper envelope:
-   An envelope containing the number `0` is a box containing data.
-   An envelope containing a blank sheet of paper is an empty text string `""`.
-   **`NULL`** is when the envelope itself does not exist. There is nothing to open, measure, or read. 

If you place two missing envelopes next to each other, you cannot say: "These two items have the same content." The contents are completely absent.

---

### (6) Code Examples

#### Inserting NULLs
```sql
CREATE TABLE staff (
  id INTEGER PRIMARY KEY,
  name VARCHAR(50),
  phone VARCHAR(20) -- Allows NULL by default
);

-- Phone is left blank (NULL)
INSERT INTO staff (id, name, phone) 
VALUES (1, 'Alice', NULL);
```

#### Comparison Failures vs. Successes
```sql
-- WRONG: Returns ZERO rows! Bob's record is ignored because phone = NULL is UNKNOWN.
SELECT * FROM staff WHERE phone = NULL;

-- CORRECT: Returns Alice's row
SELECT * FROM staff WHERE phone IS NULL;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using arithmetic operations on nullable columns without fallbacks

**The mistake:** Calculating total salaries using `basic_salary + monthly_bonus` when the bonus column contains `NULL` for some employees:

```sql
-- If monthly_bonus is NULL, the result is NULL (employee gets $0 calculated!)
SELECT name, basic_salary + monthly_bonus AS total FROM staff;
```

**Why it's wrong:** As explained in the mathematical propagation rule, any number plus `NULL` yields `NULL`. You end up rendering empty wages.

**Fix: Use functions like `COALESCE(column, fallback)` to swap `NULL` with a safe default (like `0`) during calculations.**

```sql
/* Correct approach */
SELECT name, basic_salary + COALESCE(monthly_bonus, 0) AS total FROM staff;
```

---



### Mistake 2: Using Direct Equality (`= NULL`) Instead of `IS NULL` for NULL Comparisons

**The mistake:** Writing `SELECT * FROM users WHERE middle_name = NULL;`.

**Why it's wrong:** In SQL 3-valued logic, `anything = NULL` evaluates to `NULL` (Unknown), returning ZERO rows! Always use `IS NULL` or `IS NOT NULL`.

*Incorrect:*
```sql
SELECT * FROM users WHERE middle_name = NULL; -- ❌ Always returns 0 rows!
```

*Fix:*
```sql
SELECT * FROM users WHERE middle_name IS NULL; -- Correct NULL check
```

### Mistake 3: Expecting `NULL` Values to Be Ignored in Unique Constraints

**The mistake:** Creating a unique index on `email` and assuming inserting multiple `NULL` values will fail.

**Why it's wrong:** By default in SQL, `NULL != NULL`. Standard unique constraints allow MULTIPLE rows with `NULL` values unless `NULLS NOT DISTINCT` (Postgres 15+) is specified.

*Incorrect:*
```sql
-- Expecting unique constraint to reject 2nd NULL row
```

*Fix:*
```sql
CREATE UNIQUE INDEX idx_email ON users (email); -- Allows multiple NULL rows
```

## 6. Practice Exercises

### Exercise 1: Query Debugging

**Problem:** You run the following query to find all staff members who do *not* have the phone number `'555-0199'`:
`SELECT * FROM staff WHERE phone <> '555-0199';`
However, you notice that Alice (whose phone is `NULL`) is missing from the output list. Why was she excluded, and how do you write the query to include her?

**Expected output:**
```text
Alice was excluded because `NULL <> '555-0199'` evaluates to `UNKNOWN`. SQL query WHERE clauses only return rows where the condition evaluates strictly to `TRUE`. 
To fix this, you must explicitly include NULLs using `OR IS NULL`:
`SELECT * FROM staff WHERE phone <> '555-0199' OR phone IS NULL;`
```

> [!check]- Answer
> - Check how comparative evaluation filters rows.
> - Ensure the query logic explicitly checks for missing phone markers.

---



### Exercise 2: Correct NULL Comparison Predicate

**Problem:** Query users whose `deleted_at` timestamp is NOT NULL.

**Expected output:**
```text
SELECT * FROM users WHERE deleted_at IS NOT NULL;
```

> [!check]- Answer
> ```sql
> SELECT * FROM users WHERE deleted_at IS NOT NULL;
> ```
>
> **Explanation:** `IS NOT NULL` correctly checks for non-null field presence in SQL.

### Exercise 3: Handling NULLs with `COALESCE`

**Problem:** Replace NULL `nickname` values with `'Guest'` using `COALESCE()`.

**Expected output:**
```text
SELECT COALESCE(nickname, 'Guest') FROM users;
```

> [!check]- Answer
> ```sql
> SELECT COALESCE(nickname, 'Guest') FROM users;
> ```
>
> **Explanation:** `COALESCE(val, fallback)` returns the first non-null argument expression.

## 7. Related Terms
- [Data Types (Overview)](data_types.md) — The typing foundation.
- [`NOT NULL` Constraint](not_null.md) — Blocking NULL values.

---

## 8. Key Takeaways
- `NULL` represents the absence of a value, not a zero or an empty string.
- SQL uses three-valued logic: `TRUE`, `FALSE`, and `UNKNOWN`.
- You must use `IS NULL` and `IS NOT NULL` to compare null states; `=` will fail.
- Any mathematical calculation involving `NULL` immediately yields `NULL`.
- Use the `COALESCE` function to convert `NULL` to a safe default value during operations.
