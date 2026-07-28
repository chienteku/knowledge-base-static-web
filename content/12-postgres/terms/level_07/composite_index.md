# Composite Index (Multi-column)

> **Level 7 — Indexes & Query Performance**
> An index built on two or more columns of a table, sorted hierarchically from left to right, optimized for queries that filter or sort by those columns together.

---

## 1. Prerequisites
- [B-tree Index](btree_index.md) — The parent sorted tree structure.
- [Composite Key](../level_06/composite_key.md) — Managing multi-column constraints.

---

## 2. Term Category
- **PostgreSQL Index Type**

---

## 3. Environment Context
- **PostgreSQL Core** (Supported up to 32 columns per index. Under the hood, Postgres concatenates column values into single search keys sorted by index position).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In real-world applications, search filters are rarely simple. Users filter catalogs by multiple categories at once:
-   Find all products where `category_id = 5` AND `status = 'in_stock'`.
-   Find all users where `country = 'US'` AND `status = 'active'`.

If you build two separate indexes on `country` and `status`:
1.  Postgres must search the first index.
2.  Postgres must search the second index.
3.  Postgres must merge the pointer results in memory.

This process (called a Bitmap Index Scan) is slow under high traffic.

We designed the **Composite Index** (also known as a Multi-Column Index) to solve this. 

By indexing both columns in a single index file, the database engine can find rows matching both criteria in a single search pass, significantly reducing disk reads.

---

### (2) The Absolute Rule: Column Order and the Prefix Rule
Because B-tree composite indexes sort data hierarchically, **the order in which you define the columns in the index is critical.**

Assume you create an index on `(last_name, first_name)`:
-   **Prefix Rule:** The index is sorted by `last_name` first. If last names are identical, it sorts them by `first_name`.

This index can optimize:
-   Queries filtering by both: `WHERE last_name = 'Smith' AND first_name = 'John'`
-   Queries filtering by the left prefix alone: `WHERE last_name = 'Smith'`

This index **CANNOT** optimize:
-   Queries filtering by the right column alone: `WHERE first_name = 'John'`

---

### (3) Reality Metaphor
Imagine a printed city phonebook directory:
-   The book is organized alphabetically by: **`(Last_Name, First_Name)`**.
-   **Both Keys:** If you search for `'Smith, John'`, you flip to the 'S' section, find Smith, and locate John instantly. (Index Scan).
-   **Left Prefix Key:** If you search for `'Smith'`, you flip to the 'S' section and read the grouped block of all Smiths. (Index Scan).
-   **Right Key Only:** If you search for `'John'` (without a last name), the alphabetical phonebook is useless. You are forced to read every name on every page of the book from page 1 to the end (Sequential Scan) because 'John' is scattered across different last names.

---

### (4) Code Examples

#### Creating a Composite Index
```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  status VARCHAR(20),
  country VARCHAR(5)
);

-- Build a composite index on status AND country
CREATE INDEX idx_users_status_country ON users(status, country);
```

#### Query Optimizations Analysis
```sql
-- 1. Index Scan Triggered (Leverages both columns)
SELECT * FROM users WHERE status = 'active' AND country = 'US';

-- 2. Index Scan Triggered (Leverages the left prefix column 'status')
SELECT * FROM users WHERE status = 'active';

-- 3. Sequential Scan Triggered (Bypasses index! 'country' is not a left prefix)
SELECT * FROM users WHERE country = 'US';
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Reversing column order during index declaration

**The mistake:** Creating an index on `(country, status)` when 90% of your queries only filter by `status`.

**Why it's wrong:** Under the prefix rule, an index on `(country, status)` cannot optimize queries filtering by `status` alone. Because you reversed the order, the index sits idle, and your queries run slow sequential scans.

**Fix: When designing composite indexes, place the columns that you filter by most frequently (or columns that appear alone in queries) as the leftmost columns in your index declaration.**

---



### Mistake 2: Violating Leading Index Prefix Rules in Compound B-Tree Index Queries

**The mistake:** Creating compound index `{ status, age }` and querying `WHERE age = 25`.

**Why it's wrong:** Compound B-Tree indexes support queries filtering leading prefix columns (`status` or `status + age`). Queries filtering `age` alone skip the leading prefix, causing a `Seq Scan`.

*Incorrect:*
```sql
CREATE INDEX idx_status_age ON users (status, age);
SELECT * FROM users WHERE age = 25; -- ❌ Skips leading status prefix!
```

*Fix:*
```sql
SELECT * FROM users WHERE status = 'active' AND age = 25; -- Uses compound index
```

### Mistake 3: Placing Range Columns Before Sort or Equality Columns in Compound Indexes

**The mistake:** Creating compound index `{ created_at, status }` for query `WHERE status = 'active' ORDER BY created_at DESC`.

**Why it's wrong:** Range columns placed before equality or sort columns prevent full index utilization. Place Equality columns first, followed by Sort/Range columns (ESR Rule).

*Incorrect:*
```sql
CREATE INDEX idx_created_status ON orders (created_at, status);
```

*Fix:*
```sql
CREATE INDEX idx_status_created ON orders (status, created_at DESC);
```

## 6. Practice Exercises

### Exercise 1: Index Match Analysis

**Problem:** You have a composite B-tree index defined as:
`CREATE INDEX idx_logs ON system_logs (priority, logged_at);`
Which of the following queries will **successfully leverage** the index?
1.  `SELECT * FROM system_logs WHERE priority = 5 AND logged_at > '2026-01-01';`
2.  `SELECT * FROM system_logs WHERE logged_at > '2026-01-01';`
3.  `SELECT * FROM system_logs WHERE priority = 2;`

**Expected output:**
> [!check]- Answer
> ```text
> Queries 1 and 3 will leverage the index!
> 1. Query 1 filters by both columns, matching the index structure.
> 2. Query 2 will bypass the index because it filters only by `logged_at`, which is not the leftmost prefix of the index.
> 3. Query 3 will leverage the index because `priority` is the leftmost prefix.
> ```
> - Check if the leftmost column (`priority`) is present in the `WHERE` filter.

---



### Exercise 2: Creating Compound B-Tree Index

**Problem:** Create compound index `idx_orders_user_date` on `user_id` ascending and `created_at` descending.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE INDEX idx_orders_user_date ON orders (user_id ASC, created_at DESC);
> ```
> ```sql
> CREATE INDEX idx_orders_user_date ON orders (user_id ASC, created_at DESC);
> ```
>
> **Explanation:** Compound indexes support multi-column filtering and multi-column sort orders.

---

### Exercise 3: Compound Index Prefix Matching Rules

**Problem:** Given index `(a, b, c)`, list supported column query filters (`(a)`, `(a, b)`, `(a, b, c)`).

**Expected output:**
> [!check]- Answer
> ```text
> (a), (a, b), (a, b, c)
> ```
> ```text
> (a), (a, b), (a, b, c)
> ```
>
> **Explanation:** Compound indexes accelerate queries matching leading column prefix subsets.

## 7. Related Terms
- [B-tree Index](btree_index.md) — The parent sorted tree structure.
- [Composite Key](../level_06/composite_key.md) — Slicing multi-column constraints.

---

## 8. Key Takeaways
- A composite index is built across two or more columns in a single table.
- Significantly speeds up queries containing multi-column logical filters.
- Follows the strict **Prefix Rule** (leftmost columns must be present in query filters).
- If the leftmost column is omitted in a query, the composite index is bypassed.
- Order columns from left-to-right based on query usage frequency.
- Limit composite indexes to 2 or 3 columns to prevent index size bloat.
