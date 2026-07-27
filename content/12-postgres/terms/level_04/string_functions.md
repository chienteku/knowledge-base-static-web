# String Functions (`CONCAT`, `LENGTH`, `UPPER`, `LOWER`, `TRIM`, `SUBSTRING`, `REPLACE`)

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The set of built-in SQL functions used to manipulate, combine, slice, and clean text data directly within database queries.

---

## 1. Prerequisites
- [Data Types (Overview)](../level_02/data_types.md) — Understanding text columns.

---

## 2. Term Category
- **PostgreSQL Function**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL databases. Evaluated on-the-fly row-by-row as the database engine streams records through memory).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Data stored in database text columns is often messy or structured in separate chunks:
-   A user's name is split into `first_name` and `last_name` columns, but the frontend dashboard needs a single `full_name` display.
-   Users register emails with mixed case (e.g. `John@Example.com`), and you need to convert them to lowercase before comparing credentials.
-   Users copy-paste text inputs containing accidental leading or trailing spaces (e.g. `'  my_username '`), which breaks login validation.

If you don't have text tools in SQL, your application code has to download the raw text, run string methods in JavaScript, and pass them back, adding network latency.

We designed **String Functions** to solve this. They execute string manipulation directly on the database server during the query phase.

---

### (2) The Key String Utilities

1.  **`CONCAT(a, b, ...)`** (or **`||`**): Joins multiple strings together.
    -   *Crucial Difference:* The standard SQL `||` operator returns `NULL` if *any* argument is `NULL`. The `CONCAT()` function is safer because it silently skips `NULL` arguments.
2.  **`LENGTH(str)`**: Returns the character count of a string.
3.  **`UPPER(str)`** / **`LOWER(str)`**: Converts text to uppercase or lowercase.
4.  **`TRIM(str)`**: Strips leading and trailing spaces off a string.
5.  **`SUBSTRING(str FROM start FOR length)`**: Extracts a portion of a string.
6.  **`REPLACE(str, old, new)`**: Swaps all occurrences of a substring.

---

### (3) Reality Metaphor
Imagine a printing press editing line:
-   Envelopes are moving down a track.
-   Instead of workers grabbing each envelope, erasing text, and retyping manually:
    -   A **stamp tool (`UPPER`)** capitalizes zip codes automatically.
    -   A **glue tool (`CONCAT`)** sticks first-name and last-name slips onto a single address box.
    -   A **scissor tool (`TRIM`)** clips off trailing frayed paper edges.

---

### (4) Code Examples

#### Cleaning and Combining User Data
```sql
CREATE TABLE subscribers (
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  raw_email VARCHAR(100) -- Can contain spaces and uppercase letters
);

-- Query: Clean emails, merge names, and calculate title lengths
SELECT 
  LOWER(TRIM(raw_email)) AS clean_email,
  CONCAT(first_name, ' ', last_name) AS full_name,
  LENGTH(last_name) AS surname_length
FROM subscribers;
```

#### Replacing Substrings
```sql
-- Swap legacy URL prefixes
SELECT REPLACE(profile_url, 'http://', 'https://') AS secure_url 
FROM user_links;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using the concatenation operator (||) on columns that can contain NULL values

**The mistake:** Merging name parts using `first_name || ' ' || middle_name || ' ' || last_name` when the middle name column is optional:

```sql
-- DANGER: If middle_name is NULL, this query returns NULL for the ENTIRE name!
SELECT first_name || ' ' || middle_name || ' ' || last_name AS full_name FROM subscribers;
```

**Why it's wrong:** Under SQL rules, any value combined with `NULL` yields `NULL`. A single empty middle name destroys the entire first and last name calculation.

**Fix: Use the `CONCAT()` function or wrap nullable strings in `COALESCE` to provide a blank fallback.**

```sql
-- CORRECT (CONCAT automatically ignores NULL values)
SELECT CONCAT(first_name, ' ', middle_name, ' ', last_name) AS full_name FROM subscribers;
```

---



### Mistake 2: Using `+` Operator for String Concatenation Instead of `||` or `CONCAT()`

**The mistake:** Writing `SELECT first_name + ' ' + last_name FROM users;`.

**Why it's wrong:** In SQL standards and PostgreSQL, `+` is an addition operator for numbers! String concatenation MUST use `||` operator or `CONCAT()` function.

*Incorrect:*
```sql
SELECT first_name + ' ' + last_name FROM users; -- ❌ Error: invalid input for type numeric!
```

*Fix:*
```sql
SELECT first_name || ' ' || last_name FROM users; -- String concatenation operator
```

### Mistake 3: Confusing `SUBSTRING()` 1-Based Character Indexing with 0-Based Array Indexing

**The mistake:** Writing `SUBSTRING(text FROM 0 FOR 3)` expecting the first 3 characters.

**Why it's wrong:** SQL string functions use 1-based indexing! Character position 1 is the first character. `SUBSTRING(text FROM 1 FOR 3)` extracts the first 3 characters.

*Incorrect:*
```sql
SELECT SUBSTRING('Postgres' FROM 0 FOR 3); -- Extracts 2 chars ('Po')!
```

*Fix:*
```sql
SELECT SUBSTRING('Postgres' FROM 1 FOR 3); -- Extracts 3 chars ('Pos')
```

## 6. Practice Exercises

### Exercise 1: Username Generator

**Problem:** You are building an email signup table. You want to generate a unique username from a user's `email` column. The username should be:
1.  All lowercase.
2.  Cleaned of spaces.
3.  Extracted to show only the first 8 characters of their email.
Write the SQL query.

**Expected output:**
```sql
SELECT SUBSTRING(LOWER(TRIM(email)) FROM 1 FOR 8) AS system_username 
FROM subscribers;
```

> [!check]- Answer
> - Nest string functions inside each other (e.g. `FUNCTION_A(FUNCTION_B(col))`).
> - Apply `TRIM`, then `LOWER`, and finally `SUBSTRING` from index `1` for length `8`.

---



### Exercise 2: Formatting Full Name and Lowercase Email

**Problem:** Select concatenated `UPPER(last_name) || ', ' || first_name` as `formal_name` and `LOWER(email)`.

**Expected output:**
```text
SELECT UPPER(last_name) || ', ' || first_name AS formal_name, LOWER(email) FROM users;
```

> [!check]- Answer
> ```sql
> SELECT UPPER(last_name) || ', ' || first_name AS formal_name, LOWER(email)
> FROM users;
> ```
>
> **Explanation:** `UPPER()`, `LOWER()`, and `||` transform and concatenate string expressions.

### Exercise 3: Trimming Whitespace with `TRIM()`

**Problem:** Trim leading and trailing whitespace from input string `input_str` using `TRIM()`.

**Expected output:**
```text
SELECT TRIM(input_str) FROM t;
```

> [!check]- Answer
> ```sql
> SELECT TRIM(input_str) FROM t;
> ```
>
> **Explanation:** `TRIM(str)` strips whitespace padding from string boundaries.

## 7. Related Terms
- [`LIKE` / `ILIKE` Pattern Matching](like_ilike.md) — Wildcard text searches.

---

## 8. Key Takeaways
- String functions manipulate and format text dynamically inside queries.
- Use `LOWER` and `TRIM` to clean user inputs (e.g. email checks).
- `CONCAT()` is safer than the `||` operator because it ignores `NULL` inputs.
- `SUBSTRING` slices text segments starting from defined character indexes.
- `REPLACE` swaps target substring characters globally inside text blocks.
- Perform formatting on the database server to minimize application network lag.
