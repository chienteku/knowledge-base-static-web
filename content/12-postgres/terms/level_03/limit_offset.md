# `LIMIT` / `OFFSET`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The SQL query clauses used to restrict the number of rows returned (`LIMIT`) and skip a specified number of rows (`OFFSET`), forming the foundation of data pagination.

---

## 1. Prerequisites
- [`ORDER BY`](order_by.md) — The sorting clause required for stable pagination.

---

## 2. Term Category
- **SQL Query Clause**

---

## 3. Environment Context
- **PostgreSQL Core DML** (Postgres-specific limit shorthand. Limits help the query optimizer stop disk scanning loops early once the target row count threshold is reached).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If your website has 1 million products, and a user clicks on the "Browse Products" page, you cannot fetch all 1 million items in one query:
-   It will freeze the user's web browser trying to render 1 million HTML blocks.
-   It will consume gigabytes of database server RAM and network band width.
-   It will slow down your server response times to a crawl.

Instead, websites use **Pagination** — showing a small batch of items (like 10 or 20 per page) with "Next Page" controls.

To support pagination, SQL designed **`LIMIT`** and **`OFFSET`**:
-   **`LIMIT`**: Restricts the output size. It tells the database: *"Stop fetching rows as soon as you have collected this many records."*
-   **`OFFSET`**: Sets the starting line. It tells the database: *"Skip this many matching rows before you start returning them to the client."*

---

### (2) The Pagination Math
To implement page-based navigation, you map your current Page number (`page`) and items-per-page limit (`page_size`) using this equation:

-   `LIMIT` = `page_size`
-   `OFFSET` = `(page - 1) * page_size`

| Navigation Target | SQL Query Clauses | Action |
| :--- | :--- | :--- |
| **Page 1** (10 items) | `LIMIT 10 OFFSET 0` | Fetch first 10, skip none. |
| **Page 2** (10 items) | `LIMIT 10 OFFSET 10` | Skip first 10, fetch next 10. |
| **Page 3** (10 items) | `LIMIT 10 OFFSET 20` | Skip first 20, fetch next 10. |

---

### (3) The Absolute Rule: Always Use `ORDER BY`
`LIMIT` and `OFFSET` are useless without an `ORDER BY` clause. 

Because row order on disk is not guaranteed, running a query without sorting can return different row sequences every time. 

If the database reorders rows between clicks, a user on Page 2 might see duplicate items they already saw on Page 1, or miss items entirely.

---

### (4) Reality Metaphor
Imagine reading a thick dictionary:
-   You want to read exactly 2 pages (this is your **`LIMIT`**).
-   To read Page 5 and 6, you must skip past the first 4 pages of the dictionary (this is your **`OFFSET`**).
-   If someone constantly shuffles the dictionary pages between your reads (omitting `ORDER BY`), you will end up reading the same words over and over.

---

### (5) Code Examples

#### Standard Pagination Query
```sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  price NUMERIC(10,2)
);

-- Fetch Page 3 of products, ordered by price lowest-to-highest (10 items per page)
-- Skip 20 items, return 10 items
SELECT name, price 
FROM products 
ORDER BY price ASC 
LIMIT 10 OFFSET 20;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using massive OFFSET values for deep pagination in production databases

**The mistake:** Running queries like `LIMIT 10 OFFSET 1000000;` to display Page 100,000 on high-volume tables.

**Why it's wrong:** To skip 1 million rows, PostgreSQL cannot simply jump to row 1,000,001 on disk. It must physically load, parse, and count the first 1 million rows from disk, and then discard them. As the offset increases, the query becomes slower and slower, eventually crashing the database.

**Fix: For deep pagination, use "Keyset Pagination" (or Cursor-based pagination). Instead of offsetting, query by comparing keys (e.g. `WHERE id > last_seen_id LIMIT 10`), which leverages indexes for instant lookups.**

---



### Mistake 2: Using High `OFFSET` Values for Large Page Pagination (Deep Pagination Bottleneck)

**The mistake:** Executing `SELECT * FROM posts ORDER BY id ASC LIMIT 20 OFFSET 100000;` for page 5,000.

**Why it's wrong:** `OFFSET 100000` forces the query engine to scan and discard 100,000 rows sequentially on disk before returning 20 items. Use Keyset / Cursor-Based Pagination (`WHERE id > last_id LIMIT 20`).

*Incorrect:*
```sql
SELECT * FROM posts ORDER BY id ASC LIMIT 20 OFFSET 100000; -- ❌ Severe CPU scan overhead!
```

*Fix:*
```sql
SELECT * FROM posts WHERE id > 100000 ORDER BY id ASC LIMIT 20; -- Fast keyset pagination
```

### Mistake 3: Using `LIMIT` Without an `ORDER BY` Clause (Non-Deterministic Pagination)

**The mistake:** Executing `SELECT * FROM users LIMIT 10;` for pagination.

**Why it's wrong:** Without `ORDER BY`, row selection is non-deterministic. Consecutive page requests can return duplicate or missing rows across requests.

*Incorrect:*
```sql
SELECT * FROM users LIMIT 10; -- ❌ Non-deterministic row selection!
```

*Fix:*
```sql
SELECT * FROM users ORDER BY id ASC LIMIT 10;
```

## 6. Practice Exercises

### Exercise 1: Pagination Parameters Calculation

**Problem:** You are building a blog feed showing 5 articles per page. The user clicks on **Page 4**.
Calculate the correct SQL `LIMIT` and `OFFSET` parameters to query the database.

**Expected output:**
```text
LIMIT = 5
OFFSET = 15
Calculation: (4 - 1) * 5 = 15. The query skips the first 15 articles and returns the next 5 (articles 16 through 20).
```

> [!check]- Answer
> - Apply the standard pagination equation using page count 4 and size 5.
> - Calculate skipped row count first.

---



### Exercise 2: Basic Sorting and Pagination

**Problem:** Query top 5 highest priced products sorted by `price` descending using `ORDER BY` and `LIMIT`.

**Expected output:**
```text
SELECT * FROM products ORDER BY price DESC LIMIT 5;
```

> [!check]- Answer
> ```sql
> SELECT * FROM products ORDER BY price DESC LIMIT 5;
> ```
>
> **Explanation:** `ORDER BY col DESC LIMIT N` returns the top N largest values.

### Exercise 3: Keyset (Cursor-Based) Pagination Pattern

**Problem:** Query next 10 posts created after `last_created_at` timestamp using keyset pagination.

**Expected output:**
```text
SELECT * FROM posts WHERE created_at > '2026-01-01 00:00:00+00' ORDER BY created_at ASC LIMIT 10;
```

> [!check]- Answer
> ```sql
> SELECT * FROM posts
> WHERE created_at > '2026-01-01 00:00:00+00'
> ORDER BY created_at ASC LIMIT 10;
> ```
>
> **Explanation:** Keyset pagination uses index range predicates instead of high OFFSET scans.

## 7. Related Terms
- [`ORDER BY`](order_by.md) — The sorting anchor for pagination stability.

---

## 8. Key Takeaways
- `LIMIT` restricts the maximum count of returned rows.
- `OFFSET` skips a specified number of rows before returning results.
- `LIMIT` and `OFFSET` form the foundation of website page navigation (pagination).
- Always pair limit/offset queries with `ORDER BY` to prevent page data shifts.
- Large offset values slow down the database; use keyset cursors for deep pages.
