# `ORDER BY` / `LIMIT` / `START`

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL clauses used to sort query outputs (`ORDER BY`), restrict maximum result quantities (`LIMIT`), and define skipping offsets (`START`—equivalent to SQL `OFFSET` or MongoDB `skip`) to build pagination queries.

---

## 1. Prerequisites

- [`SELECT`](select.md) — The parent query statement.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed at the post-filtering pipeline stage. Relies on indexed fields inside `ORDER BY` to bypass sorting in-memory buffers).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building frontend web interfaces, you cannot retrieve and display the entire database at once:
-   A search query might return 100,000 matches.
-   Transmitting this entire list over network sockets wastes bandwidth and freezes the user's browser.
-   You need a way to slice the data into manageable chunks (e.g. showing "page 1" with items 1 to 10, then "page 2" with items 11 to 20).

We designed the **`ORDER BY`**, **`LIMIT`**, and **`START`** clauses in SurrealQL to support this data slicing (Pagination) natively. 

`ORDER BY` sorts the list. 

`LIMIT` cuts the list count. 

`START` specifies how many rows to skip. 

Using them together allows your application to query exactly the slice of data required for a specific page view, keeping your app fast.

---

### (2) Clause Syntax Definitions

#### 1. `ORDER BY <field> [ASC | DESC]`
Sorts the records. You can sort by multiple properties, and you can sort using nested object keys:
`ORDER BY address.zip_code DESC, age ASC`

#### 2. `LIMIT <number>`
Defines the maximum rows returned in the result set array.

#### 3. `START <number>`
Specifies the offset index (how many rows to skip before starting output). 
-   *Note:* SurrealQL uses the keyword **`START`**, which corresponds directly to standard SQL's `OFFSET` and MongoDB's `skip()`.

---

### (3) Reality Metaphor (Card Templates)
Imagine viewing a long ledger sheet:
-   **`ORDER BY`:** Rearranging the sheets on the desk so they are sorted alphabetically by last name.
-   **`LIMIT` and `START` (Pagination):** A **Viewport Cardboard Template**. 
    -   The cardboard has a cutout window that is exactly 10 rows high (LIMIT). 
    -   You place the cardboard on the desk. 
    -   To see page 3, you slide the cardboard template down, skipping the first 20 rows (START).

---

### (4) Code Examples

#### Paginating Records in SurrealQL
Observe how queries slice tables:

```sql
-- 1. Sort posts by views descending
SELECT title, views FROM post ORDER BY views DESC;

-- 2. Fetch page 1 (Items 1 to 10)
SELECT title FROM post ORDER BY title ASC LIMIT 10;

-- 3. Fetch page 2 (Items 11 to 20, skipping the first 10!)
-- Uses LIMIT and START!
SELECT title FROM post ORDER BY title ASC LIMIT 10 START 10;

-- 4. Sorting using nested properties
SELECT name FROM user ORDER BY name.last ASC, name.first ASC;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use the SQL keyword 'OFFSET' instead of 'START' to skip records, leading to syntax errors

**The mistake:** Writing a pagination query like `SELECT * FROM post LIMIT 10 OFFSET 20;` based on PostgreSQL habits.

**Why it's wrong:** SurrealQL does not support the `OFFSET` keyword. 

Executing it will trigger a query compiler parsing exception.

**Fix: Replace `OFFSET` with the correct SurrealQL keyword `START`:**

```sql
-- BAD
SELECT * FROM post LIMIT 10 OFFSET 20;

-- GOOD
SELECT * FROM post LIMIT 10 START 20;
```

---



### Mistake 2: Using Pagination `START` and `LIMIT` Without `ORDER BY`

**The mistake:** Writing `SELECT * FROM user LIMIT 10 START 20;` without `ORDER BY`.

**Why it's wrong:** Without an explicit `ORDER BY` clause, table scan ordering is non-deterministic. Consecutive paginated queries may return duplicate or missing rows.

*Incorrect:*
```surrealql
-- Non-deterministic pagination
SELECT * FROM user LIMIT 10 START 20; // ❌ Unstable ordering!
```

*Fix:*
```surrealql
SELECT * FROM user ORDER BY created_at DESC LIMIT 10 START 20; // Stable pagination
```

### Mistake 3: Confusing SQL `OFFSET` Keyword with SurrealQL `START` Keyword

**The mistake:** Writing `SELECT * FROM user LIMIT 10 OFFSET 20;` (SyntaxError).

**Why it's wrong:** SurrealQL uses `START 20` (or `START AT 20`), NOT SQL `OFFSET`.

*Incorrect:*
```surrealql
SELECT * FROM user LIMIT 10 OFFSET 20; // ❌ Parse error!
```

*Fix:*
```surrealql
SELECT * FROM user ORDER BY id LIMIT 10 START 20;
```

## 6. Practice Exercises

### Exercise 1: Pagination Math Formulation

**Problem:** You are writing an API in Node.js to fetch paginated products. 
Your server receives two variables:
-   `pageNumber` (1-indexed: Page 1, Page 2, Page 3, etc.)
-   `pageSize` (number of items per page)
Write the math formulas to calculate the values for the SurrealQL query parameters:
1.  `$limit = ?`
2.  `$start = ?`

**Expected output:**
> [!check]- Answer
> ```javascript
> 1. $limit = pageSize;
> 2. $start = (pageNumber - 1) * pageSize;
> ```
> - The limit value matches the page size directly.
> - For Page 1, start offset must evaluate to `0`. For Page 2, start offset skips the first page's worth of items.

---



### Exercise 2: Stable Paginated Query

**Problem:** Query page 2 (items 11-20) from `product` table ordered by `price` ascending.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM product ORDER BY price ASC LIMIT 10 START 10;
> ```
> ```surrealql
> SELECT * FROM product ORDER BY price ASC LIMIT 10 START 10;
> ```
>
> **Explanation:** `ORDER BY` + `LIMIT` + `START` provides deterministic paginated query results.

---

### Exercise 3: Multi-Column Ordering

**Problem:** Order users by `role` ascending, then `created_at` descending.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM user ORDER BY role ASC, created_at DESC;
> ```
> ```surrealql
> SELECT * FROM user ORDER BY role ASC, created_at DESC;
> ```
>
> **Explanation:** `ORDER BY col1 ASC, col2 DESC` sorts results across multiple field criteria.

## 7. Related Terms

- [`SELECT`](select.md) — The parent query statement.

---

## 8. Key Takeaways
- `ORDER BY` sorts queries; `LIMIT` defines size; `START` defines offset.
- Directly equivalent to SQL's `ORDER BY`/`LIMIT`/`OFFSET` and NoSQL equivalents.
- SurrealQL uses the keyword `START` instead of SQL's standard `OFFSET`.
- Using `OFFSET` in SurrealQL queries triggers a query compiler error.
- Supports sorting by nested dot-notation object fields.
- Combine `LIMIT` and `START` parameters to construct database-tier pagination.
- Pair sorting clauses with database indexes to prevent slow in-memory sorting.
