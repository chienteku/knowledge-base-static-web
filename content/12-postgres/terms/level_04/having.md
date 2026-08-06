# `HAVING`

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL query clause used to filter aggregated groups (created by `GROUP BY`) based on aggregate conditions (e.g. `HAVING COUNT(*) > 5`).

---

## 1. Prerequisites
- [`WHERE` Clause](../level_03/where.md) — The individual row filtering clause.
- [`GROUP BY`](group_by.md) — The clause that builds categories.

---

## 2. Term Category

**SQL Command / Clause** (Group Predicate Filter): `HAVING` filters aggregated group rows after `GROUP BY` reduction.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DML** (Evaluated late in the query execution plan. Runs after table scans, join merges, row filters, and group aggregations have completed).

### (1) Design Motivation — "Why did we design this?"
A common challenge in data reporting is filtering categories by aggregate metrics:
-   Find all departments with a total payroll budget exceeding `$100,000`.
-   Find all products categories that contain more than `5` items in inventory.
-   Find all users who have logged in more than `10` times this week.

If you try to write this using a standard `WHERE` filter:

```sql
-- DANGER: This query crashes immediately!
SELECT department, COUNT(*) 
FROM employees
WHERE COUNT(*) > 10; -- WRONG: Aggregates are not allowed in WHERE!
```

This crashes because **the `WHERE` clause is evaluated before rows are grouped**. At the moment the query engine filters rows, no groups exist, and `COUNT(*)` has not been calculated yet.

We designed the **`HAVING`** clause to solve this. 

It acts as a secondary filter:
-   **`WHERE`** runs first, filtering individual rows *before* they are grouped.
-   **`GROUP BY`** runs second, combining the surviving rows into categories.
-   **`HAVING`** runs third, filtering the aggregated categories *after* they are grouped.

---

### (2) WHERE vs. HAVING (When to use what)
-   **Use `WHERE`** for filtering based on static raw columns values (e.g. `WHERE status = 'active'`).
-   **Use `HAVING`** for filtering based on aggregate functions (e.g. `HAVING SUM(sales) > 1000`).

---

### (3) Reality Metaphor
Imagine a fruit sorting factory:
-   **The Sieve (`WHERE`):** Before sorting, the fruit passes over a grate. Any fruit that is rotten or too small falls through and is discarded. This happens to individual fruits before category sorting.
-   **The Crates (`GROUP BY`):** The clean fruit is sorted into boxes by type: `Apples`, `Oranges`, `Bananas`.
-   **The Scale (`HAVING`):** Finally, a supervisor weighs the completed boxes. Any box weighing less than 50 pounds (`HAVING SUM(weight) < 50`) is sent back, while the heavy boxes are loaded onto the shipping truck.

---

### (4) Code Examples

#### Combining WHERE and HAVING
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT,
  product_name VARCHAR(100),
  price NUMERIC(10,2)
);

-- Find customers who spent a total of over $500, 
-- but only count products costing more than $20
SELECT customer_id, SUM(price) AS total_spent
FROM orders
WHERE price > 20.00 -- 1. Filter out cheap items before grouping
GROUP BY customer_id
HAVING SUM(price) > 500.00; -- 2. Filter out low-spending customers after grouping
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using HAVING to filter static columns that could be filtered in WHERE

**The mistake:** Placing non-aggregated filters inside the `HAVING` clause:

```sql
-- BAD: Highly inefficient!
SELECT department, AVG(salary)
FROM employees
GROUP BY department
HAVING department = 'Engineering'; -- WRONG: Should be in WHERE
```

**Why it's wrong:** The database is forced to load all departments, group every employee, calculate averages for every category, and then throw away all groups except Engineering. 

**Fix: Always filter static columns inside the `WHERE` clause. This allows the database to discard unrelated rows immediately, avoiding useless grouping computations.**

```sql
-- CORRECT: Fast and optimized
SELECT department, AVG(salary)
FROM employees
WHERE department = 'Engineering'
GROUP BY department;
```

---



### Mistake 2: Using `WHERE` Clauses for Filtering Aggregate Accumulator Metrics

**The mistake:** Writing `SELECT category FROM products WHERE AVG(price) > 50 GROUP BY category;`.

**Why it's wrong:** `WHERE` filters individual rows BEFORE grouping. Aggregate functions must be evaluated in the `HAVING` clause AFTER `GROUP BY`.

*Incorrect:*
```sql
SELECT category FROM products WHERE AVG(price) > 50 GROUP BY category; -- ❌ Error: aggregate in WHERE!
```

*Fix:*
```sql
SELECT category FROM products GROUP BY category HAVING AVG(price) > 50;
```

### Mistake 3: Putting Non-Aggregate Row Filters inside `HAVING` Instead of `WHERE`

**The mistake:** Writing `SELECT category, COUNT(*) FROM products GROUP BY category HAVING status = 'active';`.

**Why it's wrong:** Filtering rows before grouping in `WHERE (status = 'active')` reduces the number of rows that must be grouped, drastically speeding up aggregation performance.

*Incorrect:*
```sql
SELECT category, COUNT(*) FROM products GROUP BY category HAVING status = 'active'; -- Slow post-group filter
```

*Fix:*
```sql
SELECT category, COUNT(*) FROM products WHERE status = 'active' GROUP BY category;
```

## 5. Practice Exercises

### Exercise 1: Filtering Aggregated Groups with `HAVING`

**Scenario:**
Find all customers who have placed MORE than 5 total orders.

**Requirements:**
1. Execute `SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id HAVING COUNT(*) > 5`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   customer_id, 
>   COUNT(*) AS total_orders 
> FROM orders 
> GROUP BY customer_id 
> HAVING COUNT(*) > 5;
> ```
>
> #### Technical Explanation
>
> 1. `HAVING` filters aggregated group rows AFTER `GROUP BY` reduction occurs.
> 2. `WHERE` cannot filter on aggregate results (`WHERE COUNT(*) > 5` throws a syntax error).
> 3. Filters output groups based on metric thresholds.
> 
---

### Exercise 2: Combining WHERE Row Filters with HAVING Group Filters

**Scenario:**
Find categories with average price over $50, considering ONLY active products (`is_active = TRUE`).

**Requirements:**
1. Combine `WHERE is_active = TRUE` and `HAVING AVG(price_cents) > 5000`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   category, 
>   AVG(price_cents) / 100.0 AS avg_price 
> FROM products 
> WHERE is_active = TRUE 
> GROUP BY category 
> HAVING AVG(price_cents) > 5000;
> ```
>
> #### Technical Explanation
>
> 1. `WHERE` filters individual rows BEFORE `GROUP BY` aggregation.
> 2. `GROUP BY` collapses surviving rows into category groups.
> 3. `HAVING` filters category groups based on the calculated `AVG()` metric.
> 
---

### Exercise 3: Filtering Groups on Multiple Aggregate Thresholds

**Scenario:**
Find high-value customer groups where `COUNT(*) >= 3` AND `SUM(total_cents) >= 50000`.

**Requirements:**
1. Use `HAVING COUNT(*) >= 3 AND SUM(total_cents) >= 50000`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   customer_id, 
>   COUNT(*) AS order_count,
>   SUM(total_cents) / 100.0 AS total_spent 
> FROM orders 
> GROUP BY customer_id 
> HAVING COUNT(*) >= 3 
>    AND SUM(total_cents) >= 50000;
> ```
>
> #### Technical Explanation
>
> 1. `HAVING` evaluates complex boolean expressions combining multiple aggregate functions.
> 2. Identifies VIP customer segments meeting multiple threshold criteria.
> 3. Analytics pipeline pattern.
> 
---



## 6. Related Terms
- [`WHERE` Clause](../level_03/where.md) — The pre-grouping filter.
- [`GROUP BY`](group_by.md) — The grouping engine.

---

## 7. Key Takeaways
- `HAVING` filters aggregated groups; `WHERE` filters individual source rows.
- Evaluated late in the query engine pipeline (after `GROUP BY` execution).
- Use `HAVING` exclusively for conditions containing aggregate functions (e.g. `SUM`, `COUNT`).
- Do not place static column filters inside `HAVING`; use `WHERE` for raw columns.
- Combining `WHERE` and `HAVING` enables clean, multi-layered data analysis.
