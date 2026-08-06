# `ORDER BY`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The SQL query clause used to sort retrieved rows by one or more columns in ascending (smallest to largest) or descending (largest to smallest) order.

---

## 1. Prerequisites
- [`SELECT`](select.md) — The baseline query command.

---

## 2. Term Category

**SQL Command / Clause** (Result Sorting Clause): `ORDER BY` sorts returned query rows in ascending (`ASC`) or descending (`DESC`) order.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DML** (Evaluated late in the execution pipeline. If sorting by a non-indexed column, the database engine must buffer rows in memory (using `work_mem`) to run a Sort execution pass).

### (1) Design Motivation — "Why did we design this?"
Under relational database theory, tables are treated as unsorted mathematical sets. 

As learned in Level 1 (`row.md`), the physical order of rows on disk is not guaranteed. 

If you query a table, Postgres will return rows in whatever sequence is fastest to read from the disk drive.

However, application users expect data to be presented in logical sequences:
-   A list of search results sorted by relevance.
-   A product page showing items from lowest to highest price.
-   A social media feed displaying posts from newest to oldest.

We designed the **`ORDER BY`** clause to solve this. It instructs the database engine to sort the output array before returning it to the client.

---

### (2) Sorting Directions
You can configure sorting directions using two keywords:
-   **`ASC` (Ascending):** Smallest to largest (e.g. `1` to `100`, `'A'` to `'Z'`, oldest date to newest date). This is the default setting.
-   **`DESC` (Descending):** Largest to smallest (e.g. `100` to `1`, `'Z'` to `'A'`, newest date to oldest date).

---

### (3) Resolving Ties (Multi-Column Sort)
You can specify multiple columns to sort by, separated by commas. 

The database sorts by the first column list first. 

If two rows have the same value (a tie), the database resolves the tie by sorting those specific rows by the second column.

---

### (4) PostgreSQL NULL Sorting
By default, PostgreSQL treats `NULL` as larger than any other value.
-   In an `ASC` query, `NULL` values will appear at the **end** of the list.
-   In a `DESC` query, `NULL` values will appear at the **beginning** of the list.

You can override this default behavior using **`NULLS FIRST`** or **`NULLS LAST`** clauses:

```sql
SELECT name, price FROM products ORDER BY price DESC NULLS LAST;
-- Sorts prices high-to-low, but pushes items with no price (NULL) to the bottom.
```

---

### (5) Reality Metaphor
Imagine a school graduation queue:
-   The principal says: *"Line up by height, shortest to tallest (`ORDER BY height ASC`)."*
-   *"If two students are the exact same height, resolve the tie by alphabetical order of their last name (`ORDER BY height ASC, last_name ASC`)."*

---

### (6) Code Examples

#### Single Column Sort
```sql
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  department VARCHAR(50),
  salary NUMERIC(10,2)
);

-- Show employees from highest salary to lowest
SELECT name, salary 
FROM employees 
ORDER BY salary DESC;
```

#### Multi-Column Sort
```sql
-- Sort alphabetically by department, then by salary high-to-low
SELECT department, name, salary 
FROM employees 
ORDER BY department ASC, salary DESC;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Sorting massive tables by non-indexed columns in production

**The mistake:** Running queries like `SELECT * FROM log_entries ORDER BY created_at DESC;` on a table with 10 million rows, when `created_at` does not have an index.

**Why it's wrong:** If a column has no index, the database must copy all 10 million rows into temporary memory buffers (or write temporary files to disk) and run a sorting algorithm on-the-fly. This halts the database, spikes CPU usage to 100%, and slows down the entire website.

**Fix: Always build a database index on columns that your application frequently uses inside `ORDER BY` clauses.**

---



### Mistake 2: Omitting `NULLS FIRST` or `NULLS LAST` on Nullable Sort Columns

**The mistake:** Sorting `ORDER BY score DESC` expecting `NULL` values to sort at the bottom.

**Why it's wrong:** In PostgreSQL, `DESC` sorts `NULL` values FIRST by default (`NULLS FIRST`)! Specify `ORDER BY score DESC NULLS LAST` to place nulls at the end.

*Incorrect:*
```sql
SELECT * FROM users ORDER BY score DESC; -- NULL scores appear at top!
```

*Fix:*
```sql
SELECT * FROM users ORDER BY score DESC NULLS LAST; -- Explicit NULL position
```

### Mistake 3: Sorting Large Multi-Million Row Tables Without Index Support (In-Memory Sort Overhead)

**The mistake:** Running `SELECT * FROM logs ORDER BY created_at DESC LIMIT 20;` on an un-indexed `created_at` column.

**Why it's wrong:** Sorting un-indexed columns forces an in-memory `SORT` stage over all table rows. Build an index on `{ created_at DESC }` for instant index scans.

*Incorrect:*
```sql
-- Sorting 50M rows without index on created_at
```

*Fix:*
```sql
CREATE INDEX idx_logs_created_at ON logs (created_at DESC);
```

## 5. Practice Exercises

### Exercise 1: Multi-Column Sorting Rules

**Scenario:**
Query `orders` sorted by `status` ascending, then by `created_at` descending.

**Requirements:**
1. Execute `ORDER BY status ASC, created_at DESC`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, customer_id, status, created_at 
> FROM orders 
> ORDER BY status ASC, created_at DESC;
> ```
>
> #### Technical Explanation
>
> 1. `ORDER BY` sorts rows by first specified column, breaking ties using subsequent columns.
> 2. `ASC` specifies ascending order; `DESC` specifies descending order.
> 3. Utilizes compound index `{ status: 1, created_at: -1 }` for zero-RAM sort execution.
> 
---

### Exercise 2: Null Position Control with NULLS FIRST and NULLS LAST

**Scenario:**
Query products sorted by `discount_price` ascending, placing products with `NULL` discount at the end.

**Requirements:**
1. Use `ORDER BY discount_price ASC NULLS LAST`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, name, discount_price 
> FROM products 
> ORDER BY discount_price ASC NULLS LAST;
> ```
>
> #### Technical Explanation
>
> 1. By default, PostgreSQL sorts `NULL` as larger than non-null values (`ASC` puts NULLs last, `DESC` puts NULLs first).
> 2. `NULLS LAST` explicitly places rows with `NULL` at the bottom of the result set regardless of sort direction.
> 3. Explicit UI display control.
> 
---

### Exercise 3: Sorting by Calculated Expressions

**Scenario:**
Sort users by total full name length descending using `length(first_name || last_name)`.

**Requirements:**
1. Use `ORDER BY length(first_name || last_name) DESC`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, first_name, last_name 
> FROM users 
> ORDER BY length(first_name || ' ' || last_name) DESC;
> ```
>
> #### Technical Explanation
>
> 1. `ORDER BY` can sort by calculated SQL expressions.
> 2. Evaluates the expression for candidate rows before sorting.
> 3. Dynamic output ordering.
> 
---



## 6. Related Terms
- [`SELECT`](select.md) — The query starter.
- [`LIMIT` / `OFFSET`](limit_offset.md) — Restricting sorted output counts.

---

## 7. Key Takeaways
- `ORDER BY` sorts database query outputs.
- `ASC` sorts smallest-to-largest (default); `DESC` sorts largest-to-smallest.
- You can sort by multiple columns to resolve ties (separated by commas).
- Postgres treats `NULL` values as larger than any other number during sorting.
- Use `NULLS LAST` or `NULLS FIRST` to override default null sorting behaviors.
- Always index columns that are sorted frequently to protect database performance.
