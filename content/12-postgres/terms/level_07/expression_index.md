# Expression Index (Functional Index)

> **Level 7 — Indexes & Query Performance**
> A specialized index built on the output of an expression or function applied to one or more columns (e.g., `LOWER(email)`), allowing queries utilizing that exact calculation to bypass sequential scans.

---

## 1. Prerequisites
- [B-tree Index](btree_index.md) — The parent sorted tree structure.
- [String Functions (`CONCAT`, `LENGTH`, `UPPER`, `LOWER`, `TRIM`, `SUBSTRING`, `REPLACE`)](../level_04/string_functions.md) — The functions commonly indexed.

---

## 2. Term Category

**Performance / Optimization** (Functional Expression Index): Expression Indexes index the result of a function or expression (e.g. `LOWER(email)`) to accelerate queries over computed values.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Fully supported. Evaluating expression indexes adds write CPU overhead during inserts because Postgres must compute the function output before writing to the index nodes).

### (1) Design Motivation — "Why did we design this?"
As learned in Level 4 (`like_ilike.md`), standard databases are case-sensitive. 

To support case-insensitive lookups, developers write queries like:
`SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';`

However, if you have a standard index on `email`, **PostgreSQL cannot use it for this query.**

The index is sorted by the *raw* email values (`'Alice@...'`), but the query filters by the *lowercased* calculation output (`'alice@...'`). 

Because they do not match, the query planner is forced to run a slow Sequential Scan, computing `LOWER()` on all 10 million rows on disk.

We designed the **Expression Index** (also known as a Functional Index) to solve this. 

Instead of indexing the raw column data, the database runs the function once during `INSERT`, and indexes the **calculated result** directly inside the B-tree. 

When a query runs the same function, Postgres checks the expression index and retrieves the row instantly.

---

### (2) Crucial Use Case: JSONB Indexing
Because JSONB fields store nested documents, querying them requires drilling down (e.g. `WHERE specs ->> 'model' = 'Pro'`). 

Since `->>` is a function operator, you must use an Expression Index to index nested JSON keys:

```sql
CREATE INDEX idx_device_model ON devices ((specs ->> 'model'));
```

---

### (3) The Double Parentheses Rule in PostgreSQL
In PostgreSQL, if your index expression contains operators or multiple parameters, the SQL parser can get confused. 

To prevent syntax errors, **you must wrap the custom expression inside double parentheses:** `((expression))`.

---

### (4) Reality Metaphor
Imagine a postal sorting office:
-   **Standard Index:** Sorting envelopes alphabetically by their written addresses.
-   **Expression Index:** The office only cares about the **destination country** (which is extracted by reading the last word of the address line). 
-   Instead of sorting envelopes by the raw address, a clerk reads the address once, writes the country code on a **sticky note** on the envelope, and sorts the envelopes by the sticky note values directly. 
-   The sticky note is the expression index (`LOWER(address)`).

---

### (5) Code Examples

#### Case-Insensitive Expression Index
```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(100) NOT NULL
);

-- Build expression index (note the double parentheses)
CREATE INDEX idx_users_lower_email ON users (LOWER(email));
```

#### Query Matching
```sql
-- 1. Index Scan Triggered (Query uses the exact lower() function)
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';

-- 2. Sequential Scan Triggered (Bypasses index! Query uses raw column)
SELECT * FROM users WHERE email = 'Alice@example.com';
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Querying with a slightly different expression than the index definition

**The mistake:** Creating an index on `LOWER(email)` but writing a query that cleans spaces first: `WHERE LOWER(TRIM(email)) = '...'`.

**Why it's wrong:** The query planner checks if the exact expression `LOWER(TRIM(email))` matches any active index. Because your index only computed `LOWER(email)`, the planner does not know if they yield the same result, and falls back to a slow sequential scan.

**Fix: Ensure your application queries match the exact mathematical expression defined inside the index schema.**

---



### Mistake 2: Querying Expression Indexes with Syntax Variations That Mismatch Index Expressions

**The mistake:** Creating index `ON users (LOWER(email))` and querying `WHERE email = LOWER('alice@ex.com')`.

**Why it's wrong:** The query expression MUST match the index expression definition character-for-character! Querying `WHERE email = ...` mismatches `LOWER(email)`, causing a `Seq Scan`.

*Incorrect:*
```sql
CREATE INDEX idx_lower_email ON users (LOWER(email));
SELECT * FROM users WHERE email = LOWER('Alice@ex.com'); -- ❌ Mismatches index expression!
```

*Fix:*
```sql
SELECT * FROM users WHERE LOWER(email) = LOWER('Alice@ex.com'); -- Matches index expression
```

### Mistake 3: Creating Expression Indexes Using Non-Immutable Functions

**The mistake:** Attempting to create index `ON events (DATE(created_at))` where function depends on timezone settings.

**Why it's wrong:** Expression indexes require strictly IMMUTABLE functions. If a function output changes based on session settings or current time (`NOW()`), PostgreSQL rejects index creation with error `functions in index expression must be marked IMMUTABLE`.

*Incorrect:*
```sql
CREATE INDEX idx_date ON events (NOW()); -- ❌ Error: function must be IMMUTABLE!
```

*Fix:*
```sql
CREATE INDEX idx_date ON events ((created_at AT TIME ZONE 'UTC'));
```

## 5. Practice Exercises

### Exercise 1: Indexing Lowercase Case-Insensitive Expressions

**Scenario:**
Create an expression index on `users(LOWER(email))` to optimize case-insensitive email authentication lookups.

**Requirements:**
1. Execute `CREATE INDEX idx_users_lower_email ON users(LOWER(email))`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX idx_users_lower_email 
> ON users (LOWER(email));
> 
> SELECT id, username 
> FROM users 
> WHERE LOWER(email) = LOWER('ALICE@EXAMPLE.COM');
> ```
>
> #### Technical Explanation
>
> 1. Queries using `WHERE LOWER(email) = ...` cannot hit a standard B-tree index on `email`.
> 2. `CREATE INDEX ON users (LOWER(email))` evaluates and stores the result of `LOWER(email)` in the index.
> 3. Accelerates case-insensitive queries from sequential scans to fast $O(\log N)$ index lookups.
> 
---

### Exercise 2: Indexing Calculated Date Expressions

**Scenario:**
Create an expression index on `orders(EXTRACT(YEAR FROM created_at))` to optimize yearly sales reports.

**Requirements:**
1. Execute `CREATE INDEX idx_orders_created_year ON orders((EXTRACT(YEAR FROM created_at)))`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX idx_orders_created_year 
> ON orders ((EXTRACT(YEAR FROM created_at)));
> 
> SELECT COUNT(*) 
> FROM orders 
> WHERE EXTRACT(YEAR FROM created_at) = 2026;
> ```
>
> #### Technical Explanation
>
> 1. Double parentheses `((expression))` are required in DDL syntax when indexing complex SQL functions.
> 2. Pre-calculates and indexes yearly values.
> 3. Accelerates date function filtering.
> 
---

### Exercise 3: Indexing JSONB Fields via Expressions

**Scenario:**
Create an expression index targeting a specific nested JSONB key path (`(metadata->>'device')`).

**Requirements:**
1. Execute `CREATE INDEX idx_events_device ON events((metadata->>'device'))`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX idx_events_device 
> ON events ((metadata->>'device'));
> 
> SELECT id, event_name 
> FROM events 
> WHERE metadata->>'device' = 'mobile';
> ```
>
> #### Technical Explanation
>
> 1. Expression indexes allow indexing specific high-frequency JSONB key paths without indexing the entire JSON document.
> 2. Consumes significantly less RAM than full GIN indexes.
> 3. Targeted JSON indexing pattern.
> 
---



## 6. Related Terms
- [B-tree Index](btree_index.md) — The parent sorted tree structure.
- [`JSON` / `JSONB` Type](../level_06/json_jsonb.md) — Storing nested documents.
- [Full-Text Search (`tsvector`, `tsquery`)](../level_10/full_text_search.md) — Related concept: Full-Text Search (`tsvector`, `tsquery`).

---

## 7. Key Takeaways
- Expression indexes store the calculated results of functions applied to columns.
- Enables index optimization for functional queries (like `LOWER(email)`).
- Critical for indexing nested attributes inside `JSONB` columns.
- PostgreSQL requires wrapping complex expressions in double parentheses `((expr))`.
- Adds minor write CPU overhead because functions are evaluated during inserts.
- Query filters must use the exact function format of the index to trigger it.
