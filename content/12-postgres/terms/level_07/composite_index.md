# Composite Index (Multi-column)

> **Level 7 — Indexes & Query Performance**
> An index built on two or more columns of a table, sorted hierarchically from left to right, optimized for queries that filter or sort by those columns together.

---

## 1. Prerequisites
- [B-tree Index](btree_index.md) — The parent sorted tree structure.
- [Composite Key](../level_06/composite_key.md) — Managing multi-column constraints.

---

## 2. Term Category

**Performance / Optimization** (Multi-Column B-Tree Index): Composite Indexes store multi-column key tuples in a single B-tree index, optimizing multi-attribute filtering and left-prefix matching.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Supported up to 32 columns per index. Under the hood, Postgres concatenates column values into single search keys sorted by index position).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Creating Multi-Column Composite Indexes

**Scenario:**
Create a composite index on `orders(customer_id, status)` to optimize queries filtering both fields.

**Requirements:**
1. Execute `CREATE INDEX idx_orders_customer_status ON orders(customer_id, status)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX idx_orders_customer_status 
> ON orders (customer_id, status);
> 
> SELECT id, total_cents 
> FROM orders 
> WHERE customer_id = 100 AND status = 'pending';
> ```
>
> #### Technical Explanation
>
> 1. Composite indexes store multi-column key pairs in a single B-tree index.
> 2. Optimizes queries filtering both `customer_id` and `status` simultaneously.
> 3. Superior to creating 2 separate single-column indexes.

---

### Exercise 2: Applying the Left-Prefix Rule

**Scenario:**
Demonstrate why `idx_orders_customer_status` accelerates `WHERE customer_id = 100` but NOT `WHERE status = 'pending'`.

**Requirements:**
1. Explain composite index left-prefix matching behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Composite Left-Prefix Rule:
> - Composite Index: (customer_id, status)
> - Query 1: WHERE customer_id = 100 -> HITS INDEX (Matches leading column!).
> - Query 2: WHERE customer_id = 100 AND status = 'pending' -> HITS INDEX (Matches both!).
> - Query 3: WHERE status = 'pending' -> MISSES INDEX (Omits leading column 'customer_id'!).
> ```
>
> #### Technical Explanation
>
> 1. Composite B-trees sort data by the first column first, then by the second column.
> 2. Queries MUST include the leading column to hit the index.
> 3. Always place the most frequently queried column as the leading key.

---

### Exercise 3: Include Columns in Indexes for Index-Only Scans

**Scenario:**
Create a composite index incorporating `INCLUDE (total_cents)` to enable Index-Only Scans without indexing `total_cents` for sorting.

**Requirements:**
1. Execute `CREATE INDEX ... ON orders(customer_id) INCLUDE (total_cents)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX idx_orders_customer_include_total 
> ON orders (customer_id) 
> INCLUDE (total_cents);
> 
> SELECT total_cents 
> FROM orders 
> WHERE customer_id = 100;
> ```
>
> #### Technical Explanation
>
> 1. `INCLUDE (col)` appends non-key payload attributes to the leaf pages of a B-tree index.
> 2. Enables Index-Only Scans for `SELECT total_cents` without increasing key comparison overhead.
> 3. Modern PostgreSQL (PG 11+) covering index feature.

---



## 6. Related Terms
- [B-tree Index](btree_index.md) — The parent sorted tree structure.
- [Composite Key](../level_06/composite_key.md) — Slicing multi-column constraints.
- [Index (Concept)](index_concept.md) — Related concept: Index (Concept).

---

## 7. Key Takeaways
- A composite index is built across two or more columns in a single table.
- Significantly speeds up queries containing multi-column logical filters.
- Follows the strict **Prefix Rule** (leftmost columns must be present in query filters).
- If the leftmost column is omitted in a query, the composite index is bypassed.
- Order columns from left-to-right based on query usage frequency.
- Limit composite indexes to 2 or 3 columns to prevent index size bloat.
