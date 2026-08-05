# `LIKE` / `ILIKE` Pattern Matching

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL text operators used inside `WHERE` clauses to search for substring patterns using wildcards, with `LIKE` being case-sensitive and PostgreSQL's `ILIKE` being case-insensitive.

---

## 1. Prerequisites
- [Comparison & Logical Operators](../level_03/operators.md) — The baseline query comparison symbols.
---

## 2. Term Category
- **SQL Operator**

---

## 3. Environment Context
- **PostgreSQL Core** (`ILIKE` is a PostgreSQL-specific extension. Standard SQL requires using `LOWER(column) LIKE LOWER(pattern)` for case-insensitive matches).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard database equal comparison (`=`) checks for character-for-character exact matches. 

But users expect websites to support basic text search queries:
-   A search bar on a blog finding articles containing the word `'database'`.
-   Filtering user accounts whose emails end with `'@gmail.com'`.

Standard SQL provides the **`LIKE`** operator to search with wildcards. 

However, `LIKE` is strictly **case-sensitive**:
-   `'Apple Laptop' LIKE '%apple%'` evaluates to **`FALSE`** (capital 'A' does not match lowercase 'a').

If a user searches for `'apple'`, they will miss `'Apple'` or `'APPLE'`, which ruins search usability. 

While you *could* write `LOWER(name) LIKE '%apple%'`, it is verbose and slows query speeds because it forces function evaluations on every row.

PostgreSQL designed the native **`ILIKE`** (Insensitive LIKE) operator to solve this. It behaves exactly like `LIKE` but ignores character capitalization.

---

### (2) The Wildcard Keys
Both operators parse two special symbols:
-   **`%` (Percent):** Matches **zero or more** characters.
    -   `'Smart%'` matches: `'Smartphone'`, `'Smartwatch'`, `'Smart'`.
-   **`_` (Underscore):** Matches **exactly one** character.
    -   `'b_t'` matches: `'bat'`, `'bit'`, `'but'`. (It does not match `'boat'`).

---

### (3) Reality Metaphor
Imagine grading spelling tests:
-   **`LIKE`** is like a **strict teacher**. If the workbook says the answer is `'Apple'`, and a student writes `'apple'`, the teacher marks it wrong because the capital letter is missing.
-   **`ILIKE`** is a **lenient teacher**. They check the spelling of the letters but ignore capitalization. They accept `'apple'`, `'APPLE'`, or `'aPpLe'` as correct.

---

### (4) Code Examples

#### Case Sensitivity Demonstration
```sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  title VARCHAR(100)
);

INSERT INTO products (id, title) VALUES 
  (1, 'Apple MacBook'),
  (2, 'pineapple juice'),
  (3, 'Green Apple');
```

Running case-sensitive `LIKE`:
```sql
SELECT title FROM products WHERE title LIKE '%apple%';
-- Returns: 'pineapple juice' (Matches lowercase 'apple' in pineapple)
-- 'Apple MacBook' and 'Green Apple' are ignored because they start with capital 'A'!
```

Running case-insensitive `ILIKE`:
```sql
SELECT title FROM products WHERE title ILIKE '%apple%';
-- Returns: 'Apple MacBook', 'pineapple juice', 'Green Apple' (Matches all!)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing standard B-Tree indexes speed up leading wildcard searches (`%search%`)

**The mistake:** Creating an index on the `title` column, and assuming a query like `WHERE title ILIKE '%apple%'` will run instantly on large tables.

**Why it's wrong:** Standard B-Tree indexes search like a phone book, alphabetically from left to right. If your search pattern has a leading wildcard (`%apple`), the database has no starting point to search index keys. It is forced to scan every single row on disk (Full Table Scan), making the index useless.

**Fix: Avoid leading wildcards (`%search`) if performance is critical on large tables. If you must support leading wildcard searches, look up PostgreSQL Trigram Indexes (`CREATE INDEX ... USING gin (column gin_trgm_ops)`).**

---



### Mistake 2: Using Case-Sensitive `LIKE` Expecting Case-Insensitive Matching

**The mistake:** Writing `SELECT * FROM users WHERE username LIKE 'alice%';` expecting to match `'Alice'`. 

**Why it's wrong:** `LIKE` is case-sensitive! String `'alice%'` will NOT match `'Alice'`. Use PostgreSQL `ILIKE` for case-insensitive matching.

*Incorrect:*
```sql
SELECT * FROM users WHERE username LIKE 'alice%'; -- ❌ Fails on 'Alice'!
```

*Fix:*
```sql
SELECT * FROM users WHERE username ILIKE 'alice%'; -- Case-insensitive match
```

### Mistake 3: Executing Un-Anchored Wildcard Queries (`'%search%'`) on Large Tables (Seq Scan)

**The mistake:** Running `SELECT * FROM posts WHERE title ILIKE '%postgres%';` on 10M rows.

**Why it's wrong:** Leading wildcard patterns (`'%text'`) cannot utilize standard B-Tree index prefix scans. Use `pg_trgm` GIN trigram indexes or Full-Text Search.

*Incorrect:*
```sql
SELECT * FROM posts WHERE title ILIKE '%postgres%'; -- ❌ Seq Scan on 10M rows!
```

*Fix:*
```sql
CREATE INDEX idx_trgm_title ON posts USING GIN (title gin_trgm_ops);
```

## 6. Practice Exercises

### Exercise 1: User Directory Search

**Problem:** You are building a search endpoint for a company directory. The user searches for a name keyword. The query must return employees whose `full_name` contains the search keyword, ignoring capitalization. Write the SQL statement to locate employees matching keyword `'smith'`.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT full_name 
> FROM employees 
> WHERE full_name ILIKE '%smith%';
> ```
> - Add wildcard percentages on both sides of the search parameter to find the substring anywhere in the text.
> - Use the PostgreSQL-specific case-insensitive operator.

---



### Exercise 2: Anchored Wildcard Prefix Match

**Problem:** Query users whose `username` starts with `'admin'` case-insensitively using `ILIKE`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM users WHERE username ILIKE 'admin%';
> ```
> ```sql
> SELECT * FROM users WHERE username ILIKE 'admin%';
> ```
>
> **Explanation:** `ILIKE 'prefix%'` performs case-insensitive prefix pattern matching.

---

### Exercise 3: Trigram Index for Wildcard Searching

**Problem:** Create GIN trigram index on `title` to accelerate `ILIKE '%query%'` substring searches.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE INDEX idx_posts_title_trgm ON posts USING GIN (title gin_trgm_ops);
> ```
> ```sql
> CREATE INDEX idx_posts_title_trgm ON posts USING GIN (title gin_trgm_ops);
> ```
>
> **Explanation:** `pg_trgm` GIN indexes accelerate un-anchored `%substring%` wildcard searches.

## 7. Related Terms
- [Comparison & Logical Operators](../level_03/operators.md) — The parent comparison standard.
- [String Functions (`CONCAT`, `LENGTH`, `UPPER`, `LOWER`, `TRIM`, `SUBSTRING`, `REPLACE`)](string_functions.md) — Text manipulation utilities.
---

## 8. Key Takeaways
- `LIKE` performs case-sensitive text pattern matching with wildcards.
- `ILIKE` is a PostgreSQL extension that performs case-insensitive matching.
- Use `%` to match zero or more characters; use `_` to match exactly one character.
- Leading wildcards (e.g. `'%search%'`) bypass standard B-Tree indexes.
- Default to `ILIKE` in web application search filters to match user expectations.
