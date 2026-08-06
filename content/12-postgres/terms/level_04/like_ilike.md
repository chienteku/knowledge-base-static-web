# `LIKE` / `ILIKE` Pattern Matching

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL text operators used inside `WHERE` clauses to search for substring patterns using wildcards, with `LIKE` being case-sensitive and PostgreSQL's `ILIKE` being case-insensitive.

---

## 1. Prerequisites
- [Comparison & Logical Operators](../level_03/operators.md) — The baseline query comparison symbols.
- [`WHERE` Clause](../level_03/where.md) — Pattern matching text filtering with LIKE and ILIKE.

---

## 2. Term Category

**SQL Command / Clause** (Pattern Matching Predicates): `LIKE` and `ILIKE` perform case-sensitive and case-insensitive string pattern matching using `%` and `_` wildcards.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (`ILIKE` is a PostgreSQL-specific extension. Standard SQL requires using `LOWER(column) LIKE LOWER(pattern)` for case-insensitive matches).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Case-Insensitive Prefix Searching with `ILIKE`

**Scenario:**
Search for users whose `username` starts with `'alex'` (case-insensitive) using `ILIKE 'alex%'`.

**Requirements:**
1. Execute `WHERE username ILIKE 'alex%'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, username, email 
> FROM users 
> WHERE username ILIKE 'alex%';
> ```
>
> #### Technical Explanation
>
> 1. `ILIKE` is PostgreSQL's case-insensitive pattern matching operator.
> 2. `'alex%'` matches `"Alex"`, `"alexander"`, `"ALEXIS"`.
> 3. Prefix patterns (`'text%'`) can hit B-tree indexes using `varchar_pattern_ops`.

---

### Exercise 2: Single Character Wildcards with `_`

**Scenario:**
Find product codes matching pattern `'SKU-___-2026'` (exactly 3 variable characters in middle).

**Requirements:**
1. Use `WHERE sku LIKE 'SKU-___-2026'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, sku, name 
> FROM products 
> WHERE sku LIKE 'SKU-___-2026';
> ```
>
> #### Technical Explanation
>
> 1. `_` matches exactly one character; `%` matches zero or more characters.
> 2. Enforces exact character string length boundaries in pattern matching.
> 3. Precise string pattern filtering.

---

### Exercise 3: Accelerating Wildcard Searches with Trigram Indexes (`pg_trgm`)

**Scenario:**
Enable `pg_trgm` extension and create a GIN trigram index to accelerate substring searches (`ILIKE '%search%'`).

**Requirements:**
1. Execute `CREATE EXTENSION pg_trgm` and `CREATE INDEX ... USING GIN (name gin_trgm_ops)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE EXTENSION IF NOT EXISTS pg_trgm;
> 
> CREATE INDEX idx_products_name_trgm 
> ON products 
> USING GIN (name gin_trgm_ops);
> 
> SELECT id, name 
> FROM products 
> WHERE name ILIKE '%phone%';
> ```
>
> #### Technical Explanation
>
> 1. Standard B-tree indexes cannot accelerate leading wildcard patterns (`'%text%'`).
> 2. `pg_trgm` breaks text into 3-character trigrams and indexes them in a GIN index.
> 3. Enables sub-millisecond wildcard searching across millions of text rows.

---



## 6. Related Terms
- [Comparison & Logical Operators](../level_03/operators.md) — The parent comparison standard.
- [String Functions (`CONCAT`, `LENGTH`, `UPPER`, `LOWER`, `TRIM`, `SUBSTRING`, `REPLACE`)](string_functions.md) — Text manipulation utilities.

---

## 7. Key Takeaways
- `LIKE` performs case-sensitive text pattern matching with wildcards.
- `ILIKE` is a PostgreSQL extension that performs case-insensitive matching.
- Use `%` to match zero or more characters; use `_` to match exactly one character.
- Leading wildcards (e.g. `'%search%'`) bypass standard B-Tree indexes.
- Default to `ILIKE` in web application search filters to match user expectations.
