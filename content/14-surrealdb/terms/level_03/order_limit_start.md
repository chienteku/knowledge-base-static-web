# `ORDER BY` / `LIMIT` / `START`

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL clauses used to sort query outputs (`ORDER BY`), restrict maximum result quantities (`LIMIT`), and define skipping offsets (`START`—equivalent to SQL `OFFSET` or MongoDB `skip`) to build pagination queries.

---

## 1. Prerequisites

- [`SELECT`](select.md) — The parent query statement.

---

## 2. Term Category


**Query Feature (sorting and pagination clauses)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Multi-Column Sorting with `ORDER BY`

**Scenario:**
A product listing page sorts products primarily by `category` ascending, and secondarily by `price` descending.

**Requirements:**
1. Create product records across multiple categories and prices.
2. Write a `SELECT` query applying `ORDER BY category ASC, price DESC`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE product:p1 SET category = "books", price = 15.00dec;
> CREATE product:p2 SET category = "books", price = 45.00dec;
> CREATE product:p3 SET category = "electronics", price = 299.00dec;
> 
> -- Multi-column ordering query
> SELECT * FROM product ORDER BY category ASC, price DESC;
> ```
>
> #### Technical Explanation
>
> 1. `ORDER BY` sorts query result records by one or more field criteria.
> 2. `ASC` sorts low-to-high; `DESC` sorts high-to-low.
> 3. Multi-column ordering evaluates secondary sort fields when primary sort values match.

---

### Exercise 2: Pagination with `LIMIT` and `START`

**Scenario:**
An API endpoint implements page-based pagination returning 10 items per page. Query page 2 (skipping the first 10 items).

**Requirements:**
1. Formulate a `SELECT` query targeting table `article`.
2. Apply `LIMIT 10` and `START 10` for page 2 offset pagination.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Page 2 offset pagination query (items 11 through 20)
> SELECT * FROM article 
> ORDER BY created_at DESC 
> LIMIT 10 
> START 10;
> ```
>
> #### Technical Explanation
>
> 1. `LIMIT n` restricts the maximum number of records returned in the result set payload.
> 2. `START n` (SurrealDB's equivalent of SQL `OFFSET`) skips the first `n` matching records.
> 3. Always pair pagination queries with explicit `ORDER BY` clauses to guarantee stable page sorting.

---

### Exercise 3: Top-N Leaderboard Retrieval

**Scenario:**
A gaming leaderboard query retrieves the top 3 highest-scoring players from table `player_score`.

**Requirements:**
1. Order scores by `score DESC`.
2. Restrict output to the top 3 records using `LIMIT 3`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE player_score:1 SET player = "Alice", score = 9500;
> CREATE player_score:2 SET player = "Bob", score = 12000;
> CREATE player_score:3 SET player = "Carol", score = 8100;
> CREATE player_score:4 SET player = "Dave", score = 10500;
> 
> -- Query Top 3 leaderboard
> SELECT player, score FROM player_score 
> ORDER BY score DESC 
> LIMIT 3;
> ```
>
> #### Technical Explanation
>
> 1. Combining `ORDER BY score DESC` with `LIMIT 3` constructs efficient Top-N leaderboard queries.
> 2. Stops query evaluation early once the top `N` records are collected.
> 3. Optimizes memory usage by avoiding full result set buffers.

---



## 6. Related Terms

- [`SELECT`](select.md) — The parent query statement.

---

## 7. Key Takeaways
- `ORDER BY` sorts queries; `LIMIT` defines size; `START` defines offset.
- Directly equivalent to SQL's `ORDER BY`/`LIMIT`/`OFFSET` and NoSQL equivalents.
- SurrealQL uses the keyword `START` instead of SQL's standard `OFFSET`.
- Using `OFFSET` in SurrealQL queries triggers a query compiler error.
- Supports sorting by nested dot-notation object fields.
- Combine `LIMIT` and `START` parameters to construct database-tier pagination.
- Pair sorting clauses with database indexes to prevent slow in-memory sorting.
