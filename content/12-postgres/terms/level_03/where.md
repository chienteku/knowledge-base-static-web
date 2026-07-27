# `WHERE` Clause

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The SQL filter clause used inside `SELECT`, `UPDATE`, and `DELETE` queries to restrict operations only to rows that meet specified conditions.

---

## 1. Prerequisites
- [`SELECT`](select.md) — The baseline query command.

---

## 2. Term Category
- **SQL Query Clause**

---

## 3. Environment Context
- **PostgreSQL Core DML** (Evaluated early in the query pipeline. The query engine uses indexes on columns referenced in `WHERE` filters to locate target rows on disk without scanning the entire table).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational tables store huge sets of data rows. 

But you rarely want to act on the entire dataset at once:
-   If you want to log in a user, you only want to fetch the row matching their specific email.
-   If a user updates their profile description, you only want to modify *their* row, not everyone's row.
-   If a user cancels their account, you only want to delete *their* record.

Without a filtering mechanism, every database query would return the entire table, forcing your application code to waste CPU sorting through millions of rows in memory. 

Even worse, updating or deleting would wipe out your entire dataset.

We designed the **`WHERE`** clause to solve this. It acts as a boolean filter: the database evaluates the condition for every row in the table, and only rows that return **`TRUE`** are passed to the next stage of the query.

---

### (2) The Order of Operations Gotcha
In SQL, the order in which you *write* queries is different from the order in which the database *executes* them:

```text
1. FROM / JOIN (Locates the tables)
2. WHERE       (Filters the rows first!)  <-- Evaluated HERE
3. SELECT      (Extracts columns and aliases)
```

Because the `WHERE` filter runs **before** the `SELECT` list, **you cannot reference a column alias created in the `SELECT` block inside the `WHERE` clause.**

---

### (3) Reality Metaphor
Imagine a massive file catalog drawer:
-   **No Filter (`SELECT *`):** The clerk dumps all 10,000 files onto your desk. You have to read through them one-by-one to find files from the year 2026.
-   **With Filter (`WHERE year = 2026`):** The clerk goes to the catalog index, pulls out only the folders marked `2026`, and hand-delivers just those files to your desk.

---

### (4) Code Examples

#### Filtering SELECT Queries
```sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  category VARCHAR(50),
  in_stock INT
);

-- Fetch only products that are out of stock
SELECT name, in_stock 
FROM products 
WHERE in_stock = 0;
```

#### Filtering UPDATE and DELETE Queries
Always use `WHERE` with write operations to target specific records:

```sql
-- Update ONLY the item with ID 105
UPDATE products 
SET in_stock = 10 
WHERE id = 105;

-- Delete ONLY the item with ID 110
DELETE FROM products 
WHERE id = 110;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to filter by SELECT aliases in the WHERE clause

**The mistake:** Creating an alias in the `SELECT` statement and using it inside the `WHERE` filter:

```sql
-- BAD: This fails with a column does not exist error!
SELECT name, price * 0.9 AS sale_price
FROM products
WHERE sale_price < 5.00; -- WRONG: sale_price is not visible yet!
```

**Why it's wrong:** As explained in the order of operations, Postgres evaluates the `WHERE` clause *before* it processes the `SELECT` list. At the moment Postgres evaluates the filter, the alias `sale_price` does not exist yet.

**Fix: Duplicate the mathematical expression inside the `WHERE` clause, or use nested subqueries.**

```sql
/* Correct approach */
SELECT name, price * 0.9 AS sale_price
FROM products
WHERE (price * 0.9) < 5.00;
```

---



### Mistake 2: Wrapping Indexed Columns in Functions in `WHERE` Clauses (Disabling Index Usage)

**The mistake:** Querying `SELECT * FROM users WHERE LOWER(email) = 'alice@ex.com';` when index exists on `{ email }`.

**Why it's wrong:** Wrapping column `email` inside function `LOWER(email)` prevents the query planner from using standard index `{ email }`, forcing a `Seq Scan`. Use expression index `CREATE INDEX ON users (LOWER(email))` or query `WHERE email = 'alice@ex.com'`.

*Incorrect:*
```sql
SELECT * FROM users WHERE LOWER(email) = 'alice@ex.com'; -- ❌ Disables standard email index!
```

*Fix:*
```sql
SELECT * FROM users WHERE email = 'alice@ex.com'; -- Utilizes index
```

### Mistake 3: Confusing `WHERE` Clause Filter Logic with `HAVING` Clause Group Filters

**The mistake:** Writing `SELECT category, COUNT(*) FROM products WHERE COUNT(*) > 5 GROUP BY category;`.

**Why it's wrong:** `WHERE` filters individual rows BEFORE aggregation! Aggregate accumulator functions (like `COUNT(*) > 5`) MUST be placed in the `HAVING` clause after `GROUP BY`.

*Incorrect:*
```sql
SELECT category, COUNT(*) FROM products WHERE COUNT(*) > 5 GROUP BY category; -- ❌ Error!
```

*Fix:*
```sql
SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 5;
```

## 6. Practice Exercises

### Exercise 1: Query Construction

**Problem:** You have a table `users` with columns `username`, `status`, and `registration_year`. Write a SQL query to select the `username` column for all users whose `status` is exactly `'inactive'` and who registered in the year `2024`.

**Expected output:**
```sql
SELECT username 
FROM users 
WHERE status = 'inactive' AND registration_year = 2024;
```

> [!check]- Answer
> - Combine filter criteria inside the `WHERE` clause using the logical `AND` operator.
> - Match string parameters using exact single quotes.

---



### Exercise 2: Filtering Range and In-Set Predicates

**Problem:** Query active users (`status = 'active'`) created in year 2026 (`created_at >= '2026-01-01'`).

**Expected output:**
```text
SELECT * FROM users WHERE status = 'active' AND created_at >= '2026-01-01';
```

> [!check]- Answer
> ```sql
> SELECT * FROM users
> WHERE status = 'active'
>   AND created_at >= '2026-01-01';
> ```
>
> **Explanation:** `WHERE` clauses filter individual row tuples before grouping or projection.

### Exercise 3: Pattern Matching Predicates with `ILIKE`

**Problem:** Query products where `name` starts with `'Pro'` case-insensitively using `ILIKE`.

**Expected output:**
```text
SELECT * FROM products WHERE name ILIKE 'Pro%';
```

> [!check]- Answer
> ```sql
> SELECT * FROM products WHERE name ILIKE 'Pro%';
> ```
>
> **Explanation:** `ILIKE 'pattern%'` filters text columns using case-insensitive wildcard matching.

## 7. Related Terms
- [`SELECT`](select.md) — Sourcing data.
- [Comparison & Logical Operators](operators.md) — The parameters used to write conditions.
- [`IS NULL` / `IS NOT NULL`](is_null.md) — Handling missing data filters.

---

## 8. Key Takeaways
- The `WHERE` clause filters rows based on a custom logical expression.
- Only rows that evaluate to `TRUE` are processed; `FALSE` or `NULL` states are skipped.
- Enforcing `WHERE` filters in `UPDATE` and `DELETE` prevents accidental global overrides.
- Database engines leverage indexes on `WHERE` columns to perform rapid row lookups.
- You cannot reference `SELECT` column aliases inside the `WHERE` clause.
