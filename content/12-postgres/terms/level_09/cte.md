# Common Table Expression (CTE / `WITH`)

> **Level 9 — Views, Functions & Advanced SQL**
> A temporary, named result set defined at the beginning of a single SQL query execution using the `WITH` keyword, improving query readability and modularity.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The query syntax encapsulated.

---

## 2. Term Category

**Advanced Feature** (Common Table Expressions): Common Table Expressions (`WITH ... AS`) define transient named query result sets that simplify complex nested queries and subqueries.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all modern SQL databases. Modern PostgreSQL (12+) automatically inline-merges standard CTEs to optimize physical plans, unless overridden by the `NOT MATERIALIZED` clause).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Modularizing Complex Queries with CTEs

**Scenario:**
Refactor a nested query using a CTE (`WITH high_value_users AS (...)`) to isolate active users spending over $500.

**Requirements:**
1. Execute `WITH ... AS (SELECT ...) SELECT ...`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> WITH high_value_users AS (
>   SELECT customer_id, SUM(total_cents) AS total_spent 
>   FROM orders 
>   GROUP BY customer_id 
>   HAVING SUM(total_cents) >= 50000
> )
> SELECT 
>   c.id, 
>   c.company_name, 
>   h.total_spent / 100.0 AS total_spent_dollars 
> FROM customers AS c 
> JOIN high_value_users AS h ON c.id = h.customer_id 
> ORDER BY h.total_spent DESC;
> ```
>
> #### Technical Explanation
>
> 1. `WITH cte_name AS (...)` defines a temporary named query result set.
> 2. Improves SQL readability by breaking complex subqueries into modular named blocks.
> 3. Modern PostgreSQL (PG 12+) automatically inlines non-recursive CTEs for query optimization.
> 
---

### Exercise 2: Multi-Stage Data Pipelines using Chained CTEs

**Scenario:**
Chain two CTEs (`WITH monthly_sales AS (...), top_stores AS (...)`) to compute regional store performance metrics.

**Requirements:**
1. Code chained CTE statements.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> WITH monthly_sales AS (
>   SELECT store_id, DATE_TRUNC('month', created_at) AS sales_month, SUM(total_cents) AS revenue 
>   FROM orders 
>   GROUP BY store_id, sales_month
> ),
> top_stores AS (
>   SELECT store_id, SUM(revenue) AS annual_revenue 
>   FROM monthly_sales 
>   GROUP BY store_id 
>   HAVING SUM(revenue) >= 10000000
> )
> SELECT s.id, s.name, ts.annual_revenue / 100.0 AS annual_revenue_dollars 
> FROM stores AS s 
> JOIN top_stores AS ts ON s.id = ts.store_id;
> ```
>
> #### Technical Explanation
>
> 1. Chained CTEs pass intermediate query result sets to subsequent CTE blocks sequentially.
> 2. Simplifies multi-stage analytical queries.
> 3. Clean pipeline architecture.
> 
---

### Exercise 3: Data Mutation CTEs with `RETURNING`

**Scenario:**
Archive soft-deleted users in a single atomic SQL statement using `WITH deleted_users AS (DELETE ... RETURNING *) INSERT INTO archived_users SELECT * FROM deleted_users`.

**Requirements:**
1. Code mutation CTE using `DELETE` with `RETURNING`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> WITH moved_users AS (
>   DELETE FROM users 
>   WHERE is_active = FALSE 
>   RETURNING id, username, email, created_at
> )
> INSERT INTO archived_users (id, username, email, archived_at) 
> SELECT id, username, email, CURRENT_TIMESTAMP 
> FROM moved_users;
> ```
>
> #### Technical Explanation
>
> 1. Data-modifying CTEs (`INSERT`, `UPDATE`, `DELETE` with `RETURNING`) perform writes inside CTE blocks.
> 2. Moves deleted rows directly into archive tables in a single atomic SQL statement.
> 3. Advanced PostgreSQL feature.
> 
---



## 6. Related Terms
- [Recursive CTE](recursive_cte.md) — Self-referencing loops.
- [View](view.md) — Persistent saved database queries.
- [`LATERAL` Join](lateral_join.md) — Related concept: `LATERAL` Join.

---

## 7. Key Takeaways
- CTEs define temporary named query result sets using the `WITH` keyword.
- Exists strictly during the execution scope of a single query.
- Eliminates hard-to-read "inside-out" nested subqueries.
- Allows chaining multiple CTE blocks sequentially using commas.
- Modern PostgreSQL merges standard CTEs directly into plans for efficiency.
- Best reserved for complex aggregations, joins, or multi-step query calculations.
