# `BOOLEAN`

> **Level 2 — Core Data Types & Constraints**
> The native PostgreSQL data type that stores logical truth states: `TRUE`, `FALSE`, or the unknown/unset state `NULL`.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.

---

## 2. Term Category
- **PostgreSQL Data Type**

---

## 3. Environment Context
- **PostgreSQL Core** (Occupies exactly 1 byte of disk storage. Implements true SQL boolean logic, unlike databases that convert boolean states to numeric integers).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Applications are filled with binary flags:
-   Is this user an admin? (`is_admin`)
-   Has this invoice been paid? (`is_paid`)
-   Is a product currently in stock? (`in_stock`)

In legacy databases (like MySQL), there is no true boolean type. Developers must use integer numbers like `1` for true and `0` for false. This can lead to bugs where a developer accidentally writes `is_admin = 2`, which the database accepts.

PostgreSQL designed a native **`BOOLEAN`** data type to enforce logical data integrity. 

It only accepts true/false inputs, rejects invalid numbers, and supports a third logical state: **`NULL`** (which represents an "unknown" or "unset" flag).

---

### (2) Input Flexibility
Postgres is highly intelligent when parsing boolean values. You can insert any of these formats, and Postgres automatically converts them to `TRUE` or `FALSE`:

-   **True values:** `TRUE`, `'true'`, `'t'`, `'yes'`, `'y'`, `'1'`
-   **False values:** `FALSE`, `'false'`, `'f'`, `'no'`, `'n'`, `'0'`

---

### (3) Reality Metaphor
Imagine a light switch on the wall:
-   **`TRUE`** is when the switch is flipped **UP** (light is on).
-   **`FALSE`** is when the switch is flipped **DOWN** (light is off).
-   **`NULL`** is when the switch is completely missing from the wall, leaving only exposed wires. You cannot say the light is off or on; the state is **unknown** or **unset**.

---

### (4) Code Examples

#### Creating a Table with Boolean Columns
```sql
CREATE TABLE user_accounts (
  id INTEGER PRIMARY KEY,
  username VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN -- Defaults to NULL (unset)
);
```

#### Inserting Various Boolean Formats
Postgres parses text synonyms seamlessly:

```sql
INSERT INTO user_accounts (id, username, is_verified, marketing_consent)
VALUES 
  (1, 'alice', 'yes', '1'),   -- Automatically converts to TRUE, TRUE
  (2, 'bob', 'false', 'n');   -- Automatically converts to FALSE, FALSE
```

#### Querying Boolean Columns
Do not write redundant checks (like `is_verified = TRUE`):

```sql
-- GOOD: Clean, idiomatic SQL
SELECT * FROM user_accounts WHERE is_verified;

-- Querying false states:
SELECT * FROM user_accounts WHERE NOT is_verified;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Writing redundant comparison checks in WHERE clauses

**The mistake:** Writing queries like `WHERE is_verified = TRUE` or `WHERE is_verified = 't'`.

**Why it's wrong:** The boolean column itself evaluates directly to a truth value. Adding `= TRUE` is redundant and slows down query readability. It is the equivalent of writing `if (user.isVerified === true)` in JavaScript instead of `if (user.isVerified)`.

**Fix: Reference the boolean column name directly: `WHERE is_verified` or `WHERE NOT is_verified`.**

---



### Mistake 2: Quoting Booleans as String Literals in Comparison Predicates

**The mistake:** Writing `WHERE active = 'true'` expecting string coercion.

**Why it's wrong:** Although PostgreSQL parses `'true'` string literals into booleans, unquoted `TRUE` or `FALSE` primitives are cleaner and avoid string parsing overhead.

*Incorrect:*
```sql
SELECT * FROM users WHERE active = 'true'; -- String literal parsing
```

*Fix:*
```sql
SELECT * FROM users WHERE active IS TRUE; -- Native boolean predicate
```

### Mistake 3: Expecting Boolean Columns to Exclude NULL Values Without NOT NULL Constraints

**The mistake:** Defining `active BOOLEAN` expecting fields to contain strictly `TRUE` or `FALSE`.

**Why it's wrong:** In SQL, boolean columns can hold THREE truth values: `TRUE`, `FALSE`, and `NULL`! Add `NOT NULL DEFAULT FALSE` to enforce 2-value booleans.

*Incorrect:*
```sql
CREATE TABLE users ( active BOOLEAN ); -- Allows NULL values!
```

*Fix:*
```sql
CREATE TABLE users ( active BOOLEAN NOT NULL DEFAULT FALSE );
```

## 6. Practice Exercises

### Exercise 1: Boolean Logic Clean-up

**Problem:** Clean up the following redundant SQL query to make it clean and idiomatic.

```sql
SELECT username 
FROM user_accounts 
WHERE is_verified = TRUE AND marketing_consent = FALSE;
```

**Expected output:**
```sql
SELECT username 
FROM user_accounts 
WHERE is_verified AND NOT marketing_consent;
```

> [!check]- Answer
> - A boolean column is already a logical expression; it does not need `= TRUE`.
> - Use the `NOT` operator to invert the truth check.

---



### Exercise 2: Querying Boolean Predicates

**Problem:** Query active users using `IS TRUE` syntax.

**Expected output:**
```text
SELECT * FROM users WHERE is_active IS TRUE;
```

> [!check]- Answer
> ```sql
> SELECT * FROM users WHERE is_active IS TRUE;
> ```
>
> **Explanation:** `IS TRUE` matches boolean true values while explicitly excluding NULLs.

### Exercise 3: Boolean 3-Valued Logic Comparison

**Problem:** List 3 possible states for unconstrained boolean columns (`TRUE`, `FALSE`, `NULL`).

**Expected output:**
```text
TRUE, FALSE, NULL
```

> [!check]- Answer
> ```text
> TRUE, FALSE, NULL
> ```
>
> **Explanation:** SQL boolean logic supports 3-valued logic: True, False, and Unknown (NULL).

## 7. Related Terms
- [Data Types (Overview)](data_types.md) — The parent typing framework.
- [NULL](null.md) — The unset boolean state.

---

## 8. Key Takeaways
- PostgreSQL `BOOLEAN` stores logical truth values: `TRUE`, `FALSE`, or `NULL`.
- Takes up exactly 1 byte of disk storage.
- Accepts standard text synonyms (like `'yes'`, `'no'`, `'1'`, `'0'`) on insert.
- Write query filters directly (e.g. `WHERE is_verified`) instead of comparing to `TRUE`.
- Use the `NOT` keyword to check for `FALSE` states.
