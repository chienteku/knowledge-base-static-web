# `TEXT` / `VARCHAR` / `CHAR`

> **Level 2 — Core Data Types & Constraints**
> The three primary string data types in PostgreSQL, differing in length constraint enforcement and trailing space padding behavior.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.

---

## 2. Term Category

**Data Type** (Character Sequence Types): Text data types (`TEXT`, `VARCHAR(n)`, `CHAR(n)`) store UTF-8 character string sequences within table columns.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Stored internally using the same storage format. Strings longer than 2KB are automatically compressed and moved out of main table memory via PostgreSQL TOAST storage).

### (1) Design Motivation — "Why did we design this?"
Relational databases must support text of varying lengths—from short country codes (`"US"`) to medium usernames (`"john_doe"`) to massive blog articles.

In old database engines (like early SQL Server or MySQL), choosing the wrong string type severely hurt performance:
-   `CHAR` was fast but wasted space.
-   `VARCHAR` was slower but saved space.

In modern **PostgreSQL**, this performance difference is gone. Under the hood, `TEXT` and `VARCHAR` use the exact same storage engine and are equally fast. 

The three types are used to enforce business constraints:

| Type | Character Limit | Storage Behavior | Best For |
| :--- | :--- | :--- | :--- |
| **`VARCHAR(n)`** | Variable up to `n` | Stores exactly what you write. Rejects strings longer than `n`. | Usernames (e.g. `VARCHAR(50)`), phone numbers. |
| **`TEXT`** | Unlimited (up to 1GB) | Stores exactly what you write. No length limit checks. | Comments, article bodies, email templates. |
| **`CHAR(n)`** | Fixed size `n` | Pads shorter strings with **trailing spaces** to fill `n` characters. | State abbreviations (e.g. `CHAR(2)`), currency codes (e.g. `CHAR(3)`). |

---

### (2) Reality Metaphor
Imagine packing suitcases:
-   **`TEXT` and `VARCHAR`** are like soft, expandable canvas bags. If you pack a single t-shirt, the bag compresses down to the size of the t-shirt. It only occupies as much space as the content requires.
-   **`CHAR(n)`** is a hard plastic suitcase. If you put a single t-shirt inside a 10-slot suitcase, it stays full-sized. To prevent items from rattling, the suitcase is filled with styrofoam spacers (trailing spaces). It always occupies the maximum space.

---

### (3) Code Examples

#### Creating a Table with Text Types
```sql
CREATE TABLE user_profiles (
  country_code CHAR(2),          -- Always exactly 2 characters (e.g. 'US', 'CA')
  username VARCHAR(50),          -- Limit username length
  bio TEXT                       -- Unlimited text description
);
```

#### The Space Padding Difference
Let's see what happens when we insert a short string into a fixed `CHAR` column:

```sql
INSERT INTO user_profiles (country_code, username, bio) 
VALUES ('US', 'alice', 'Hello world');

-- If you query length, country_code is returned padded:
-- A string inserted into CHAR(10) gets trailing spaces added to fill the slot.
```

#### Truncation Error Example
If you exceed a `VARCHAR` limit, Postgres blocks the write:

```sql
-- This crashes because 'this_is_an_extremely_long_username_that_exceeds_fifty' is 53 characters!
INSERT INTO user_profiles (country_code, username, bio) 
VALUES ('US', 'this_is_an_extremely_long_username_that_exceeds_fifty', 'Short bio');
-- ERROR: value too long for type character varying(50)
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Believing `VARCHAR(50)` is faster to query than `TEXT` in PostgreSQL

**The mistake:** Artificially capping text columns at `VARCHAR(255)` because you think it speeds up database indexes or consumes less RAM than `TEXT`.

**Why it's wrong:** In Postgres, `TEXT` and `VARCHAR` are stored using the exact same binary storage engine. Choosing `VARCHAR(255)` is NOT faster than `TEXT`. The only difference is that Postgres checks the character count of `VARCHAR` inputs on every insert, which adds a tiny CPU validation step.

**Fix: Default to `TEXT` for general string fields. Only use `VARCHAR(n)` if you want the database to actively enforce a validation constraint (e.g. preventing a username from being 10,000 characters).**

---



### Mistake 2: Using Fixed-Length `CHAR(N)` Type expecting Performance Advantages

**The mistake:** Defining `code CHAR(10)` expecting performance improvements over `VARCHAR` or `TEXT`.

**Why it's wrong:** `CHAR(N)` pads trailing whitespace to fill $N$ characters (e.g. `'abc       '`), consuming unnecessary byte space and requiring `RTRIM()` on queries.

*Incorrect:*
```sql
code CHAR(10) -- Pads trailing spaces: 'abc       '
```

*Fix:*
```sql
code VARCHAR(10) or code TEXT -- No space padding
```

### Mistake 3: Assuming `VARCHAR(255)` is Faster Than `TEXT` in PostgreSQL

**The mistake:** Restricting text columns to `VARCHAR(255)` out of performance habits from other SQL engines.

**Why it's wrong:** In PostgreSQL, `TEXT`, `VARCHAR`, and `VARCHAR(N)` share identical underlying storage engines and performance metrics. `VARCHAR(255)` adds arbitrary length validation checks.

*Incorrect:*
```sql
bio VARCHAR(255) -- Arbitrary length cap
```

*Fix:*
```sql
bio TEXT -- Unconstrained text storage
```

## 5. Practice Exercises

### Exercise 1: Evaluating `TEXT` vs `VARCHAR(n)` Performance

**Scenario:**
Create a `posts` table choosing between `TEXT` and `VARCHAR(255)`.

**Requirements:**
1. Contrast `TEXT` vs `VARCHAR(n)` storage and performance in PostgreSQL.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE posts (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   slug TEXT NOT NULL UNIQUE,
>   title TEXT NOT NULL,
>   body TEXT NOT NULL
> );
> ```
>
> #### Technical Explanation
>
> 1. In PostgreSQL, `TEXT` and `VARCHAR(n)` use the exact same underlying storage layout (`varlena`) and have zero performance difference.
> 2. `VARCHAR(n)` enforces an arbitrary character length check on every insert/update; `TEXT` allows unbounded text.
> 3. PostgreSQL best practice: Use `TEXT` by default, adding `CHECK (length(col) <= N)` if length validation is required.
> 
---

### Exercise 2: Case-Insensitive String Filtering with `LOWER()`

**Scenario:**
Query table `users` for email address `"ALICE@EXAMPLE.COM"` using case-insensitive matching.

**Requirements:**
1. Use `WHERE LOWER(email) = LOWER('ALICE@EXAMPLE.COM')` or `ILIKE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, username, email 
> FROM users 
> WHERE LOWER(email) = LOWER('ALICE@EXAMPLE.COM');
> ```
>
> #### Technical Explanation
>
> 1. `LOWER(string)` normalizes text characters to lowercase for case-insensitive comparison.
> 2. `ILIKE` is PostgreSQL's case-insensitive pattern matching operator (`email ILIKE 'alice@%'`).
> 3. Can be accelerated using functional expression indexes (`CREATE INDEX ON users (LOWER(email))`).
> 
---

### Exercise 3: String Trimming and Substring Extraction

**Scenario:**
Sanitize text input by removing whitespace (`TRIM()`) and extracting the first 50 characters (`LEFT()`).

**Requirements:**
1. Use `TRIM()` and `LEFT()`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id, 
>   TRIM(title) AS clean_title,
>   LEFT(TRIM(body), 50) || '...' AS excerpt 
> FROM articles;
> ```
>
> #### Technical Explanation
>
> 1. `TRIM(text)` removes leading and trailing space characters.
> 2. `LEFT(text, n)` extracts the first `n` characters from a string.
> 3. `||` is the standard SQL string concatenation operator.
> 
---



## 6. Related Terms
- [Data Types (Overview)](data_types.md) — The parent typing framework.
- [`INTEGER` / `BIGINT` / `SMALLINT`](integer_types.md) — Numeric integer types.

---

## 7. Key Takeaways
- PostgreSQL string types include `TEXT`, `VARCHAR(n)`, and `CHAR(n)`.
- `TEXT` and `VARCHAR` use the same underlying storage engine and perform identically.
- `VARCHAR(n)` enforces a maximum character limit check, rejecting longer strings.
- `CHAR(n)` pads values with trailing spaces, which can cause query string comparison bugs.
- Default to `TEXT` for free-form strings, and use `VARCHAR(n)` only for active validation.
