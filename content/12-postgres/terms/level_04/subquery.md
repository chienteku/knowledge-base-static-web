# Subquery (Nested Query)

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> A `SELECT` query nested inside another parent SQL query, evaluated dynamically to supply values or intermediate tables for parent processing.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The baseline query command.
- [`WHERE` Clause](../level_03/where.md) — The parent filter context where subqueries are commonly nested.

---

## 2. Term Category
- **Core SQL Concept**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL databases. Evaluated by the query planner, which often optimizes subqueries into standard JOIN operations under the hood).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In SQL, you often need to filter records based on calculations that require checking the entire table:
-   Find all products that cost **more than the average** product price.
-   Find all users who registered on the **most recent** registration day.

If you try to write this using a simple query:

```sql
-- DANGER: This query crashes immediately!
SELECT name, price 
FROM products 
WHERE price > AVG(price); -- WRONG: Aggregates are not allowed in WHERE!
```

This crashes because `WHERE` runs *before* the average is calculated.

To solve this, you would have to run two separate queries in your backend application:
1.  Run `SELECT AVG(price) FROM products;` -> returns `$15.00`.
2.  Run `SELECT name, price FROM products WHERE price > 15.00;`.

This requires two network trips to the database.

We designed **Subqueries** to solve this. 

You can nest the first query inside parentheses directly inside the second query. The database engine calculates the inner query first, feeds the output directly to the outer query, and returns the result in one single step.

---

### (2) Placement Contexts
Subqueries can live in three primary locations inside a query:

1.  **In the `WHERE` clause (Scalar / List Filtering):** Returns values to filter on (most common).
    -   `WHERE price > (SELECT AVG(price) FROM products)`
2.  **In the `FROM` clause (Derived Tables):** Acts as a temporary, on-the-fly table. **Note:** In Postgres, you must always assign an alias to a subquery inside a `FROM` clause!
    -   `FROM (SELECT * FROM log) AS temp_log`
3.  **In the `SELECT` list (Correlated projection):** Returns a single calculated value for every row in the output.

---

### (3) Reality Metaphor
Imagine a math expression containing parentheses:
`x = 10 * (3 + 5)`

You cannot multiply `10` until you know the value inside the parentheses. 

You execute the **inner expression** first (`3 + 5 = 8`), substitute it back into the main equation (`10 * 8`), and calculate the final result (`80`). 

A subquery is the SQL equivalent of the parenthesis expression.

---

### (4) Code Examples

#### Subquery in WHERE
Find products cheaper than the average price:

```sql
CREATE TABLE product_catalog (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  price NUMERIC(10,2)
);

-- Nested subquery calculates average price, outer query uses it to filter
SELECT name, price 
FROM product_catalog
WHERE price < (SELECT AVG(price) FROM product_catalog);
```

#### Subquery in FROM (Derived Table)
You must assign an alias to the subquery:

```sql
-- Treat the subquery results as an inline table named 'sub_table'
SELECT sub_table.name 
FROM (
  SELECT name, price FROM product_catalog WHERE price > 50.00
) AS sub_table;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Comparing a scalar operator (=, >, <) with a subquery returning multiple rows

**The mistake:** Writing a query that expects a single value, but the nested query returns a list:

```sql
-- BAD: This query crashes if multiple products cost exactly $10.00!
SELECT name FROM users 
WHERE balance = (SELECT price FROM product_catalog WHERE price = 10.00);
-- ERROR: more than one row returned by a subquery used as an expression
```

**Why it's wrong:** The equal operator `=` is a scalar operator; it expects exactly one number. If the subquery returns three rows, the equation `balance = (10, 10, 10)` is invalid, causing Postgres to abort.

**Fix: If your subquery can return multiple rows, replace the scalar operator (`=`) with the set operator (`IN`).**

```sql
/* Correct approach */
SELECT name FROM users 
WHERE balance IN (SELECT price FROM product_catalog WHERE price = 10.00);
```

---



### Mistake 2: Using Subqueries in `IN (...)` Predicates When Subquery Returns NULL Values

**The mistake:** Writing `WHERE id NOT IN (SELECT parent_id FROM t)` when `parent_id` contains `NULL` values.

**Why it's wrong:** If a `NOT IN (SELECT col ...)` subquery returns even a single `NULL` value, `NOT IN` evaluates to `NULL` (Unknown) for ALL outer rows, returning ZERO rows! Use `NOT EXISTS`.

*Incorrect:*
```sql
SELECT * FROM users WHERE id NOT IN (SELECT manager_id FROM users); -- ❌ Fails if manager_id has NULL!
```

*Fix:*
```sql
SELECT * FROM users u WHERE NOT EXISTS (SELECT 1 FROM users m WHERE m.manager_id = u.id);
```

### Mistake 3: Expecting Scalar Subqueries to Return Multiple Rows

**The mistake:** Writing `SELECT name, (SELECT total FROM orders WHERE user_id = u.id) FROM users u;`.

**Why it's wrong:** A scalar subquery in a `SELECT` projection list MUST return at most ONE row and ONE column. Returning multiple rows throws error `more than one row returned by a subquery`.

*Incorrect:*
```sql
SELECT name, (SELECT total FROM orders WHERE user_id = u.id) FROM users u; -- ❌ Subquery returns multiple rows!
```

*Fix:*
```sql
Use JOIN: SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id;
```

## 6. Practice Exercises

### Exercise 1: High Earners

**Problem:** You have an `employees` table with columns `name`, `department`, and `salary`. Write a SQL query to find the names of all employees who earn strictly more than the salary of the employee named `'Bob'`. Assume there is only one employee named Bob.

**Expected output:**
```sql
SELECT name 
FROM employees 
WHERE salary > (SELECT salary FROM employees WHERE name = 'Bob');
```

> [!check]- Answer
> - Write the inner query to fetch Bob's salary first.
> - Nest it inside the outer query's `WHERE` clause comparing salaries.

---



### Exercise 2: Scalar Subquery in WHERE Clause

**Problem:** Query products whose `price` exceeds the overall average product price using a scalar subquery.

**Expected output:**
```text
SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);
```

> [!check]- Answer
> ```sql
> SELECT * FROM products
> WHERE price > (SELECT AVG(price) FROM products);
> ```
>
> **Explanation:** Scalar subqueries evaluate to a single value usable in comparison predicates.

### Exercise 3: Derived Table Subquery in FROM Clause

**Problem:** Select max category total from derived summary table `SELECT category, SUM(price) AS cat_total FROM products GROUP BY category`.

**Expected output:**
```text
SELECT MAX(cat_total) FROM (SELECT category, SUM(price) AS cat_total FROM products GROUP BY category) AS sub;
```

> [!check]- Answer
> ```sql
> SELECT MAX(cat_total)
> FROM (
>   SELECT category, SUM(price) AS cat_total
>   FROM products
>   GROUP BY category
> ) AS sub;
> ```
>
> **Explanation:** Derived table subqueries in `FROM` clauses require alias names (`AS sub`).

## 7. Related Terms
- [`SELECT`](../level_03/select.md) — The query starter.
- [`EXISTS` / `NOT EXISTS`](exists.md) — Testing subquery row matching.

---

## 8. Key Takeaways
- A subquery is a `SELECT` statement nested inside another SQL parent query.
- Evaluated first (inner query) before the results are fed to the parent (outer query).
- Can be placed inside `WHERE` (filters), `FROM` (tables), or `SELECT` (projections).
- Subqueries in `FROM` clauses must always be assigned a custom alias.
- Scalar comparisons (`=`, `>`) crash if the subquery returns multiple rows; use `IN`.
