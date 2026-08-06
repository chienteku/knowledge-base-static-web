# `BOOLEAN`

> **Level 2 — Core Data Types & Constraints**
> The native PostgreSQL data type that stores logical truth states: `TRUE`, `FALSE`, or the unknown/unset state `NULL`.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.

---

## 2. Term Category

**Data Type** (Logical Truth Type): The `BOOLEAN` data type stores 1-byte logical state values (`TRUE`, `FALSE`, or `NULL`).



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Occupies exactly 1 byte of disk storage. Implements true SQL boolean logic, unlike databases that convert boolean states to numeric integers).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Filtering Rows with Boolean Flags

**Scenario:**
Query table `users` for active verified user accounts where `is_active = TRUE` and `is_verified = TRUE`.

**Requirements:**
1. Execute `SELECT` with boolean equality conditions.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, username, email 
> FROM users 
> WHERE is_active IS TRUE 
>   AND is_verified IS TRUE;
> ```
>
> #### Technical Explanation
>
> 1. `BOOLEAN` columns consume 1 byte of storage per row.
> 2. `WHERE is_active IS TRUE` evaluates 3-valued logic, correctly handling `NULL` boolean states.
> 3. Can be indexed with partial indexes for filtering active flags.

---

### Exercise 2: Toggling Boolean State Flags

**Scenario:**
Toggle a user's `is_active` status flag to `FALSE` upon account suspension.

**Requirements:**
1. Execute `UPDATE users SET is_active = FALSE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> UPDATE users 
> SET is_active = FALSE 
> WHERE id = 42 
> RETURNING id, username, is_active;
> ```
>
> #### Technical Explanation
>
> 1. `UPDATE` sets the boolean column value to `FALSE` atomically.
> 2. `RETURNING` confirms the updated row state.
> 3. Triggers audit events or downstream notification cascades.

---

### Exercise 3: Handling 3-Valued Logic in Boolean Expressions

**Scenario:**
Query documents where `is_archived` is `FALSE` OR `NULL` using `IS NOT TRUE`.

**Requirements:**
1. Use `WHERE is_archived IS NOT TRUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, title 
> FROM documents 
> WHERE is_archived IS NOT TRUE;
> ```
>
> #### Technical Explanation
>
> 1. In SQL 3-valued logic, `NULL = FALSE` evaluates to `UNKNOWN` (not `TRUE`).
> 2. `IS NOT TRUE` evaluates to true for both `FALSE` and `NULL` values.
> 3. Prevents accidental row exclusion when boolean columns permit `NULL`.

---



## 6. Related Terms
- [Data Types (Overview)](data_types.md) — The parent typing framework.
- [`NULL`](null.md) — The unset boolean state.

---

## 7. Key Takeaways
- PostgreSQL `BOOLEAN` stores logical truth values: `TRUE`, `FALSE`, or `NULL`.
- Takes up exactly 1 byte of disk storage.
- Accepts standard text synonyms (like `'yes'`, `'no'`, `'1'`, `'0'`) on insert.
- Write query filters directly (e.g. `WHERE is_verified`) instead of comparing to `TRUE`.
- Use the `NOT` keyword to check for `FALSE` states.
