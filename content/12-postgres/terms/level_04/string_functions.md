# String Functions (`CONCAT`, `LENGTH`, `UPPER`, `LOWER`, `TRIM`, `SUBSTRING`, `REPLACE`)

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The set of built-in SQL functions used to manipulate, combine, slice, and clean text data directly within database queries.

---

## 1. Prerequisites
- [Data Types (Overview)](../level_02/data_types.md) — Understanding text columns.

---

## 2. Term Category

**SQL Command / Clause** (Text Transformation Functions): String functions (`CONCAT()`, `SUBSTRING()`, `TRIM()`, `REPLACE()`, `LENGTH()`) transform text values in SQL queries.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all SQL databases. Evaluated on-the-fly row-by-row as the database engine streams records through memory).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: String Concatenation and Formatting

**Scenario:**
Concatenate `first_name` and `last_name` into `full_name` using `CONCAT_WS()`.

**Requirements:**
1. Execute `SELECT CONCAT_WS(' ', first_name, last_name) AS full_name`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id, 
>   CONCAT_WS(' ', first_name, last_name) AS full_name 
> FROM users;
> ```
>
> #### Technical Explanation
>
> 1. `CONCAT_WS(separator, str1, str2, ...)` concatenates strings with a specified separator.
> 2. Automatically skips `NULL` arguments without returning `NULL`.
> 3. Superior to raw `||` operator when fields may contain `NULL`.

---

### Exercise 2: Substring Extraction and Trimming

**Scenario:**
Extract the domain name from an email address (`"alice@example.com"` -> `"example.com"`).

**Requirements:**
1. Use `SUBSTRING(email FROM POSITION('@' IN email) + 1)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   email, 
>   SUBSTRING(email FROM POSITION('@' IN email) + 1) AS email_domain 
> FROM users;
> ```
>
> #### Technical Explanation
>
> 1. `POSITION('@' IN email)` finds the 1-based character index of `'@'`.
> 2. `SUBSTRING(string FROM start)` extracts remaining text.
> 3. Server-side text parsing.

---

### Exercise 3: Text Replacement and Case Normalization

**Scenario:**
Sanitize user bio text by converting to lowercase (`LOWER()`) and replacing forbidden words (`REPLACE()`).

**Requirements:**
1. Combine `REPLACE(LOWER(bio), 'badword', '***')`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id, 
>   REPLACE(LOWER(bio), 'spam', '[redacted]') AS clean_bio 
> FROM user_profiles;
> ```
>
> #### Technical Explanation
>
> 1. `LOWER()` normalizes character casing.
> 2. `REPLACE(text, target, replacement)` substitutes matching text patterns.
> 3. Executes text transformation in SQL.

---



## 6. Related Terms
- [`LIKE` / `ILIKE` Pattern Matching](like_ilike.md) — Wildcard text searches.

---

## 7. Key Takeaways
- String functions manipulate and format text dynamically inside queries.
- Use `LOWER` and `TRIM` to clean user inputs (e.g. email checks).
- `CONCAT()` is safer than the `||` operator because it ignores `NULL` inputs.
- `SUBSTRING` slices text segments starting from defined character indexes.
- `REPLACE` swaps target substring characters globally inside text blocks.
- Perform formatting on the database server to minimize application network lag.
