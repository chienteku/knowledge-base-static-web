# `TEXT` / `VARCHAR` / `CHAR`

> **Level 2 — Core Data Types & Constraints**
> The three primary string data types in PostgreSQL, differing in length constraint enforcement and trailing space padding behavior.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.

---

## 2. Term Category
- **PostgreSQL Data Type**

---

## 3. Environment Context
- **PostgreSQL Core** (Stored internally using the same storage format. Strings longer than 2KB are automatically compressed and moved out of main table memory via PostgreSQL TOAST storage).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: String Type Audit

**Problem:** You are defining columns for a weather station database. Choose the best string type (`CHAR(n)`, `VARCHAR(n)`, or `TEXT`) for the following fields:
1.  State wind direction abbreviation (e.g. `'N'`, `'S'`, `'NE'`, `'SW'`).
2.  Weather station name (e.g., `'Rocky Mountains Summit Station'`).
3.  Hourly weather summary comments (e.g., `'Clear sky, high humidity, temperature drops expected...'`).

**Expected output:**
```text
1. Wind Direction: VARCHAR(2) (Length varies between 1 and 2 characters. Using CHAR(2) would pad single character inputs like 'N' with an extra space, e.g. 'N ', which makes queries annoying).
2. Station Name: VARCHAR(100) (Names vary in length, but we want to cap it to prevent developers from accidentally dumping paragraphs in name boxes).
3. Summary Comments: TEXT (Comments can be long and have no strict business length limit).
```

> [!check]- Answer
> - Identify if the field has a variable length and if trailing spaces would complicate string comparisons.
> - Consider if a strict length constraint is required for validation.

---



### Exercise 2: Text Type Selection Rule

**Problem:** What is the idiomatic PostgreSQL text data type for unconstrained string fields? (`TEXT`).

**Expected output:**
```text
TEXT
```

> [!check]- Answer
> ```text
> TEXT
> ```
>
> **Explanation:** `TEXT` is the recommended, fully performant string data type in PostgreSQL.

### Exercise 3: Inspecting Character Length with `LENGTH()`

**Problem:** Query users where character length of `username` is less than 5 using `LENGTH()`.

**Expected output:**
```text
SELECT * FROM users WHERE LENGTH(username) < 5;
```

> [!check]- Answer
> ```sql
> SELECT * FROM users WHERE LENGTH(username) < 5;
> ```
>
> **Explanation:** `LENGTH(string)` returns character counts for text columns.

## 7. Related Terms
- [Data Types (Overview)](data_types.md) — The parent typing framework.
- [`INTEGER` / `BIGINT` / `SMALLINT`](integer_types.md) — Numeric integer types.

---

## 8. Key Takeaways
- PostgreSQL string types include `TEXT`, `VARCHAR(n)`, and `CHAR(n)`.
- `TEXT` and `VARCHAR` use the same underlying storage engine and perform identically.
- `VARCHAR(n)` enforces a maximum character limit check, rejecting longer strings.
- `CHAR(n)` pads values with trailing spaces, which can cause query string comparison bugs.
- Default to `TEXT` for free-form strings, and use `VARCHAR(n)` only for active validation.
