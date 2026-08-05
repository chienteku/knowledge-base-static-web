# Common Table Expression (CTE / `WITH`)

> **Level 9 — Views, Functions & Advanced SQL**
> A temporary, named result set defined at the beginning of a single SQL query execution using the `WITH` keyword, improving query readability and modularity.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The query syntax encapsulated.
---

## 2. Term Category
- **SQL Query Syntax / Abstraction**

---

## 3. Environment Context
- **Universal Standard** (Supported in all modern SQL databases. Modern PostgreSQL (12+) automatically inline-merges standard CTEs to optimize physical plans, unless overridden by the `NOT MATERIALIZED` clause).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing complex SQL reports, you often need to perform calculations on top of other calculations. 

Historically, developers solved this using **Subqueries** (nested queries inside parentheses):

```sql
-- Subquery approach (Difficult to read)
SELECT * FROM (
  SELECT user_id, SUM(amount) AS total_spent 
  FROM orders 
  GROUP BY user_id
) AS subquery
WHERE total_spent > 500.00;
```

While functional, subqueries are hard to read because they read "inside-out": you must find and read the inner query at the bottom first, and then wrap your eyes back to the top outer query to see what it filters. 

If you nest subqueries three levels deep, the SQL block becomes unmaintainable.

We designed the **Common Table Expression (CTE)**, written using the **`WITH`** keyword, to solve this readability problem. 

CTEs allow you to define temporary subqueries at the top of your script, naming them like variables, before running the main query. 

This lets you structure your SQL in a logical, top-to-bottom reading sequence.

---

### (2) CTE Scope
Unlike views, CTEs do not create persistent objects in the database. 

They exist **only** during the execution of that specific query block and vanish from memory immediately afterward.

---

### (3) Reality Metaphor
Imagine baking a birthday cake:
-   **Subquery Method:** You dump raw flour, sugar, eggs, and butter all into the same baking pan at once and try to stir them without making a mess. (Difficult to coordinate and read).
-   **CTE Method:** You measure and prep the dry ingredients in **Bowl A** (CTE A) and the wet ingredients in **Bowl B** (CTE B) on your kitchen counter. Finally, you combine Bowl A and Bowl B in your main baking pan (the outer query).

---

### (4) Code Examples

#### Refactoring Subqueries to CTEs
Let's convert a subquery join report into a clean CTE.

```sql
-- Define the temporary query blocks first
WITH user_totals AS (
  SELECT user_id, SUM(amount) AS total_spent
  FROM orders
  GROUP BY user_id
),
vip_thresholds AS (
  SELECT id, email 
  FROM users 
  WHERE tier = 'gold'
)

-- Execute the main query combining the CTE bowls
SELECT email, total_spent
FROM vip_thresholds
JOIN user_totals ON vip_thresholds.id = user_totals.user_id
WHERE total_spent > 500.00;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Overusing CTEs for basic filters that could be written as simple WHERE joins

**The mistake:** Wrapping every single simple query inside a CTE to "make it look modern," e.g.:

```sql
-- REDUNDANT CTE overhead
WITH active_users AS (
  SELECT * FROM users WHERE active = TRUE
)
SELECT * FROM active_users WHERE country = 'US';
```

**Why it's wrong:** While modern Postgres compilers inline CTEs efficiently, writing simple filters as CTEs adds visual noise to your code files without any performance or modularity benefit. 

**Fix: Reserve CTEs for queries that perform aggregates, window functions, or complex joins that are referenced multiple times in the outer statement. For simple queries, write standard joins and filters.**

---



### Mistake 2: Assuming CTEs (`WITH ... AS`) Are Optimization Fences in PostgreSQL 12+

**The mistake:** Worrying that writing CTEs prevents query planner index optimization in PostgreSQL 12+.

**Why it's wrong:** Before PostgreSQL 12, CTEs acted as optimization fences (always materialized). In PostgreSQL 12+, non-recursive CTEs are automatically inlined into the main query by default. Specify `AS MATERIALIZED` only if materialization is desired.

*Incorrect:*
```sql
// Worrying that CTEs add memory overhead in Postgres 12+
```

*Fix:*
```sql
CTEs are automatically inlined in Postgres 12+ unless AS MATERIALIZED is specified
```

### Mistake 3: Confusing Multi-CTE Statements Order Dependencies

**The mistake:** Writing CTE B referencing CTE A before defining CTE A.

**Why it's wrong:** CTEs in a comma-separated `WITH` block MUST be defined sequentially. CTE B can reference preceding CTE A, but CTE A cannot reference subsequent CTE B.

*Incorrect:*
```sql
WITH b AS (SELECT * FROM a), a AS (SELECT 1) SELECT * FROM b; -- ❌ Relation 'a' does not exist!
```

*Fix:*
```sql
WITH a AS (SELECT 1), b AS (SELECT * FROM a) SELECT * FROM b;
```

## 6. Practice Exercises

### Exercise 1: Subquery Refactor

**Problem:** You have a query containing a nested subquery:
```sql
SELECT product_id, avg_price 
FROM (
  SELECT product_id, AVG(unit_price) AS avg_price 
  FROM order_items 
  GROUP BY product_id
) AS prices 
WHERE avg_price > 100.00;
```
Rewrite this query using a clean `WITH` CTE block named `product_averages`.

**Expected output:**
> [!check]- Answer
> ```sql
> WITH product_averages AS (
>   SELECT product_id, AVG(unit_price) AS avg_price
>   FROM order_items
>   GROUP BY product_id
> )
> SELECT product_id, avg_price
> FROM product_averages
> WHERE avg_price > 100.00;
> ```
> - Start the script with the `WITH` keyword followed by the CTE name `product_averages`.
> - Write the inner aggregation query inside the parentheses.

---



### Exercise 2: Constructing Multi-Stage CTE

**Problem:** Write CTE `regional_sales` summarizing total sales per region, then main query selecting regions with `total > 10000`.

**Expected output:**
> [!check]- Answer
> ```text
> WITH regional_sales AS (SELECT region, SUM(amount) AS total FROM sales GROUP BY region) SELECT * FROM regional_sales WHERE total > 10000;
> ```
> ```sql
> WITH regional_sales AS (
>   SELECT region, SUM(amount) AS total
>   FROM sales
>   GROUP BY region
> )
> SELECT * FROM regional_sales WHERE total > 10000;
> ```
>
> **Explanation:** Common Table Expressions (CTEs) modularize complex SQL query pipelines.

---

### Exercise 3: Data-Modifying CTE with RETURNING

**Problem:** Move deleted inactive users into `archived_users` in a single query using data-modifying CTE.

**Expected output:**
> [!check]- Answer
> ```text
> WITH deleted AS (DELETE FROM users WHERE active IS FALSE RETURNING *) INSERT INTO archived_users SELECT * FROM deleted;
> ```
> ```sql
> WITH deleted AS (
>   DELETE FROM users WHERE active IS FALSE RETURNING *
> )
> INSERT INTO archived_users SELECT * FROM deleted;
> ```
>
> **Explanation:** PostgreSQL supports data-modifying CTEs (`DELETE ... RETURNING`) used inside `INSERT` statements.

## 7. Related Terms
- [Recursive CTE](recursive_cte.md) — Self-referencing loops.
- [View](view.md) — Persistent saved database queries.
- [`LATERAL` Join](lateral_join.md) — Related concept: `LATERAL` Join.
---

## 8. Key Takeaways
- CTEs define temporary named query result sets using the `WITH` keyword.
- Exists strictly during the execution scope of a single query.
- Eliminates hard-to-read "inside-out" nested subqueries.
- Allows chaining multiple CTE blocks sequentially using commas.
- Modern PostgreSQL merges standard CTEs directly into plans for efficiency.
- Best reserved for complex aggregations, joins, or multi-step query calculations.
