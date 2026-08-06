# `DISTINCT`

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> A SQL keyword used immediately after `SELECT` to filter out duplicate rows from query results, returning only unique values or combinations of values.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The baseline data retrieval statement.

---

## 2. Term Category

**SQL Command / Clause** (Row Deduplication Modifier): `DISTINCT` eliminates duplicate rows from query output result sets.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all SQL databases. Instructs the query optimizer to perform a Unique Sort or Hash Aggregation pass before streaming results back to the client socket).

### (1) Design Motivation — "Why did we design this?"
In relational database tables, columns that do not carry unique constraints will naturally accumulate duplicate values. 

For example, in a `users` table containing 10,000 rows:
-   8,000 users live in the `'US'`.
-   1,500 users live in the `'CA'`.
-   500 users live in the `'GB'`.

If you write a standard query to fetch the countries:
`SELECT country FROM users;`
The database will return a list of 10,000 rows, repeating `'US'` and `'CA'` thousands of times.

If you are building a signup form and need a dropdown menu showing only the unique countries where active users reside, loading 10,000 rows into your application memory to filter out duplicates in JavaScript is extremely slow and inefficient.

We designed the **`DISTINCT`** keyword to solve this. 

It operates at the query projection stage: the database engine groups matching result rows, filters out duplicates, and returns only the unique values.

---

### (2) Multi-Column Uniqueness
If you specify multiple columns after the `DISTINCT` keyword, the database evaluates the **combination** of those columns. A row is only filtered out if all listed column values are identical to another row in the output.

```sql
-- Returns unique pairs (e.g., 'US' + 'New York', 'US' + 'Boston')
SELECT DISTINCT country, city FROM users;
```

---

### (3) PostgreSQL Special: `DISTINCT ON`
PostgreSQL provides a powerful, non-standard extension: **`DISTINCT ON (expression)`**. 

This allows you to filter duplicates based on a specific column, while still returning other non-unique columns from the same row:

```sql
-- Returns the single newest log entry for each unique user
SELECT DISTINCT ON (user_id) user_id, log_msg, created_at
FROM logs
ORDER BY user_id, created_at DESC;
```

---

### (4) Reality Metaphor
Imagine a coin collection jar:
-   The jar contains 500 pennies, 200 quarters, and 100 dimes.
-   **Standard Query (`SELECT`):** Dumping all 800 coins onto a table. You see hundreds of identical pennies.
-   **Distinct Query (`SELECT DISTINCT`):** Sorting the coins into a tray. The tray has exactly three slots: one slot containing a single penny, one containing a single quarter, and one containing a single dime. You see only the unique types of coins in the jar.

---

### (5) Code Examples

#### Filtering Duplicate Strings
```sql
CREATE TABLE product_catalog (
  id INT PRIMARY KEY,
  product_name VARCHAR(100),
  category VARCHAR(50)
);

-- Fetch only unique product categories
SELECT DISTINCT category 
FROM product_catalog;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming DISTINCT applies only to the first column listed in a query

**The mistake:** Writing `SELECT DISTINCT category, product_name FROM product_catalog;` and expecting the database to only return unique categories while dropping duplicate product names.

**Why it's wrong:** The `DISTINCT` keyword applies to the **entire row** list that follows it. It does not select distinct categories and random product names. It returns every unique *combination* of category and product name, which will still show duplicates in the category column if the product names are different.

**Fix: If you want to filter duplicates based on a single column while returning other fields, use PostgreSQL's specialized `DISTINCT ON (column)` syntax.**

---



### Mistake 2: Executing `SELECT DISTINCT` on Un-Indexed Large Multi-Million Row Datasets

**The mistake:** Executing `SELECT DISTINCT country FROM users;` on 50M rows without an index.

**Why it's wrong:** `DISTINCT` forces an in-memory or disk `HashAggregate` / `Unique` sort stage across all collection rows. Create an index or query a normalized lookup table.

*Incorrect:*
```sql
SELECT DISTINCT country FROM users; -- ❌ Full table scan and hash aggregate!
```

*Fix:*
```sql
CREATE INDEX idx_users_country ON users (country);
```

### Mistake 3: Confusing `SELECT DISTINCT` with `SELECT DISTINCT ON (columns)`

**The mistake:** Writing `SELECT DISTINCT ON (category) name, price FROM products;` without an `ORDER BY` matching `category`.

**Why it's wrong:** `DISTINCT ON (cols)` keeps ONLY the first row for each distinct column group. Without `ORDER BY category, ...`, which specific row is kept for each category is non-deterministic!

*Incorrect:*
```sql
SELECT DISTINCT ON (category) name, price FROM products; -- ❌ Non-deterministic row selection!
```

*Fix:*
```sql
SELECT DISTINCT ON (category) name, price FROM products ORDER BY category, price DESC;
```

## 5. Practice Exercises

### Exercise 1: Eliminating Duplicate Column Results

**Scenario:**
Select all unique customer countries from `addresses` table.

**Requirements:**
1. Execute `SELECT DISTINCT country FROM addresses`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT DISTINCT country 
> FROM addresses 
> WHERE country IS NOT NULL 
> ORDER BY country ASC;
> ```
>
> #### Technical Explanation
>
> 1. `DISTINCT` eliminates duplicate result rows from query output.
> 2. Sorts or hashes candidate rows in memory to find unique values.
> 3. Ignores null values when combined with `IS NOT NULL`.

---

### Exercise 2: Selecting Distinct Multi-Column Combinations

**Scenario:**
Select unique combinations of `city` and `state` from `addresses`.

**Requirements:**
1. Execute `SELECT DISTINCT city, state FROM addresses`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT DISTINCT city, state 
> FROM addresses 
> ORDER BY state ASC, city ASC;
> ```
>
> #### Technical Explanation
>
> 1. Multi-column `DISTINCT` deduplicates rows based on the COMBINATION of specified column values.
> 2. Returns distinct city/state pairs.
> 3. Useful for populating dropdown filter menus.

---

### Exercise 3: Deduplicating Rows using `DISTINCT ON`

**Scenario:**
Select the LATEST order (`ORDER BY created_at DESC`) for each customer using PostgreSQL's `DISTINCT ON`.

**Requirements:**
1. Use `SELECT DISTINCT ON (customer_id) ... ORDER BY customer_id, created_at DESC`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT DISTINCT ON (customer_id) 
>   id AS latest_order_id, 
>   customer_id, 
>   total_cents, 
>   created_at 
> FROM orders 
> ORDER BY customer_id, created_at DESC;
> ```
>
> #### Technical Explanation
>
> 1. `DISTINCT ON (expression)` keeps ONLY the first row returned for each distinct value group.
> 2. `ORDER BY customer_id, created_at DESC` ensures the first row per customer is their most recent order.
> 3. Powerful PostgreSQL extension for top-1 per group queries.

---



## 6. Related Terms
- [`SELECT`](../level_03/select.md) — The parent query command.
- [`GROUP BY`](group_by.md) — Another way to collapse duplicate rows.

---

## 7. Key Takeaways
- `DISTINCT` filters out duplicate rows from query results.
- Placed immediately after `SELECT` and evaluates all columns in the projection list.
- Multi-column `DISTINCT` evaluates the uniqueness of combined column values.
- Postgres offers `DISTINCT ON (column)` to filter by specific fields while returning others.
- Use `DISTINCT` to shrink payload sizes when building unique filter dropdown menus.
