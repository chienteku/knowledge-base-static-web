# `LATERAL` Join

> **Level 9 — Views, Functions & Advanced SQL**
> A specialized join modifier that allows a right-side subquery to reference columns from left-side tables in the `FROM` list, executing the subquery row-by-row like a programming loop.

---

## 1. Prerequisites
- [`JOIN` (Concept)](../level_05/join_concept.md) — Standard non-correlated joins.
- [Common Table Expression (CTE / `WITH`)](cte.md) — Subquery structures.

---

## 2. Term Category

**Advanced Feature** (Correlated Subquery Joins): `JOIN LATERAL` allows a subquery in the `FROM` clause to reference columns exposed by preceding tables in the join order.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in modern SQL engines. Extremely popular in PostgreSQL for parsing JSONB objects, expanding arrays, and executing Top-N category reports).

### (1) Design Motivation — "Why did we design this?"
In standard SQL, you cannot pass variables between tables in a join. 

The right-side subquery is evaluated independently of the left-side rows.

For example, suppose you want to query:
*"For every category, find the top 2 cheapest products."*

If you try to write a standard subquery join:
```sql
-- BAD: Fails with a syntax error!
SELECT * 
FROM categories c
JOIN (
  SELECT * FROM products p 
  WHERE p.category_id = c.id -- DANGER: Cannot reference parent table 'c' here!
  ORDER BY price ASC
  LIMIT 2
) AS sub ON TRUE;
-- ERROR: invalid reference to FROM-clause entry for table "categories"
```

The database compiler blocks this because of a **Scope Barrier**: the inner subquery cannot see the parent `categories c` columns. 

Without loop controls, you would have to write complex window functions and partition filters to solve this.

We designed the **`LATERAL` Join** to solve this scope limitation. 

By adding the `LATERAL` keyword to the subquery, you break the scope barrier. 

It instructs PostgreSQL to act like a programming `foreach` loop: for every single category row on the left, pass its `c.id` as a parameter into the right subquery, execute the subquery, and merge the results.

---

### (2) Key Use Cases
-   **Top-N Queries:** Finding the top 3 orders per customer, or cheapest 2 products per category.
-   **Inline Calculations:** Passing a row's values into a Stored Function that returns a table.
-   **JSONB Unnesting:** Expanding nested JSON arrays or objects next to their parent rows.

---

### (3) Reality Metaphor
Imagine a teacher checking student homework folders:
-   **Standard Join:** The teacher downloads a list of all students, and a separate list of all grades. She merges them on the desk.
-   **Lateral Join:** The teacher looks at the first student name on her list: **Alice** (left row). She then flips specifically to Alice's folder and reads the top 2 grades (right subquery lookup). She writes them down. She moves to the next student **Bob** and repeats the loop.

---

### (4) Code Examples

#### Top-2 Products Per Category
Let's see how `LATERAL` solves the search:

```sql
CREATE TABLE categories (id INT PRIMARY KEY, name VARCHAR(50));
CREATE TABLE products (id INT PRIMARY KEY, category_id INT, name VARCHAR(50), price NUMERIC);

INSERT INTO categories VALUES (1, 'Books'), (2, 'Electronics');
INSERT INTO products VALUES 
  (10, 1, 'Novel A', 10.00), (11, 1, 'Novel B', 12.00), (12, 1, 'Novel C', 15.00),
  (20, 2, 'Phone', 800.00), (21, 2, 'Cable', 15.00);

-- Query using LATERAL join to find cheapest 2 items per category
SELECT c.name AS category_name, p.name AS product_name, p.price
FROM categories c
CROSS JOIN LATERAL (
  SELECT name, price 
  FROM products 
  WHERE category_id = c.id -- SAFE: c.id is visible inside the lateral block!
  ORDER BY price ASC
  LIMIT 2
) p;
```

**Output:**
| category_name | product_name | price |
| :--- | :--- | :--- |
| Books | Novel A | 10.00 |
| Books | Novel B | 12.00 | *(Novel C skipped, since limit is 2)* |
| Electronics | Cable | 15.00 |
| Electronics | Phone | 800.00 |

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using LATERAL joins when standard joins are possible and faster

**The mistake:** Writing a `LATERAL` join to perform a simple user-to-profile link: `FROM users u CROSS JOIN LATERAL (SELECT * FROM profiles WHERE user_id = u.id)`.

**Why it's wrong:** Under the hood, lateral joins behave like row-by-row loops. 

If the `products` table lacks an index on `category_id`, Postgres is forced to scan the entire products table sequentially for *every single category* row, slowing down performance. 

For simple column links, standard joins are much faster because the database compiler optimizes them using Hash Joins or Merge Joins.

**Fix: Only use `LATERAL` joins when you need to reference left-side columns in right-side `LIMIT`, `OFFSET`, or custom table functions. For standard relational links, always use standard `JOIN` statements.**

---



### Mistake 2: Attempting to Reference LHS Table Columns inside Standard Subqueries Without `LATERAL`

**The mistake:** Writing `SELECT * FROM users u JOIN (SELECT * FROM orders WHERE user_id = u.id LIMIT 3) o ON true;`.

**Why it's wrong:** Standard SQL subqueries in `FROM` CANNOT reference columns from preceding tables (`u.id`). Adding `LATERAL` enables subqueries to reference preceding table fields.

*Incorrect:*
```sql
SELECT * FROM users u JOIN (SELECT * FROM orders WHERE user_id = u.id) o ON true; -- ❌ Invalid reference u.id!
```

*Fix:*
```sql
SELECT * FROM users u JOIN LATERAL (SELECT * FROM orders WHERE user_id = u.id LIMIT 3) o ON true;
```

### Mistake 3: Using `LATERAL JOIN` When Standard Window Functions (`ROW_NUMBER()`) Are Faster

**The mistake:** Using `LATERAL JOIN` over 10M rows when `ROW_NUMBER() OVER (PARTITION BY ...)` executes faster.

**Why it's wrong:** `LATERAL JOIN` executes a subquery evaluation per left row tuple. Test against `ROW_NUMBER()` window functions for top-N per group queries.

*Incorrect:*
```sql
// Using LATERAL JOIN on millions of rows without testing window functions
```

*Fix:*
```sql
Compare execution plans of LATERAL JOIN vs ROW_NUMBER() PARTITION BY
```

## 5. Practice Exercises

### Exercise 1: Correlated Subquery Joins with `JOIN LATERAL`

**Scenario:**
Query each customer alongside their top 2 highest value orders using `JOIN LATERAL`.

**Requirements:**
1. Execute `JOIN LATERAL (SELECT * FROM orders WHERE customer_id = c.id ORDER BY total_cents DESC LIMIT 2) AS top_orders ON TRUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   c.id AS customer_id, 
>   c.company_name, 
>   o.id AS order_id, 
>   o.total_cents 
> FROM customers AS c 
> CROSS JOIN LATERAL (
>   SELECT id, total_cents 
>   FROM orders 
>   WHERE customer_id = c.id 
>   ORDER BY total_cents DESC 
>   LIMIT 2
> ) AS o;
> ```
>
> #### Technical Explanation
>
> 1. Standard subqueries in `FROM` clauses cannot reference outer table columns.
> 2. `LATERAL` allows subqueries to reference columns exposed by preceding tables (`c.id`).
> 3. Fetches top-N child items per parent row efficiently.

---

### Exercise 2: Unnesting Arrays alongside Table Attributes

**Scenario:**
Unnest a `tags` array column on `posts` using `JOIN LATERAL unnest(tags)`.

**Requirements:**
1. Execute `JOIN LATERAL unnest(p.tags) AS t(tag_name) ON TRUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   p.id AS post_id, 
>   p.title, 
>   t.tag_name 
> FROM posts AS p 
> CROSS JOIN LATERAL UNNEST(p.tags) AS t(tag_name);
> ```
>
> #### Technical Explanation
>
> 1. `LATERAL` allows set-returning functions like `UNNEST()` to reference array columns from the current row.
> 2. Expands array elements into paired output rows.
> 3. Idiomatic array expansion pattern.

---

### Exercise 3: Preserving Parents with Zero Matching Lateral Rows using `LEFT JOIN LATERAL`

**Scenario:**
Use `LEFT JOIN LATERAL ... ON TRUE` to preserve customers who have 0 orders.

**Requirements:**
1. Execute `LEFT JOIN LATERAL (...) AS o ON TRUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   c.id AS customer_id, 
>   c.company_name, 
>   o.total_cents AS top_order_cents 
> FROM customers AS c 
> LEFT JOIN LATERAL (
>   SELECT total_cents 
>   FROM orders 
>   WHERE customer_id = c.id 
>   ORDER BY total_cents DESC 
>   LIMIT 1
> ) AS o ON TRUE;
> ```
>
> #### Technical Explanation
>
> 1. `CROSS JOIN LATERAL` drops parent rows if the lateral subquery returns zero rows.
> 2. `LEFT JOIN LATERAL ... ON TRUE` preserves parent rows, populating subquery columns as `NULL` if 0 rows match.
> 3. Complete outer lateral join coverage.

---



## 6. Related Terms
- [`JOIN` (Concept)](../level_05/join_concept.md) — Standard non-correlated joins.
- [Common Table Expression (CTE / `WITH`)](cte.md) — Subquery structures.

---

## 7. Key Takeaways
- `LATERAL` joins break scope barriers, allowing subqueries to reference parent columns.
- Behaves like a procedural `foreach` loop (evaluates right subquery per left row).
- Crucial for resolving "Top-N" categories queries (e.g. top 3 orders per user).
- Essential for unpacking dynamic JSONB arrays or calling table-returning functions.
- Highly dependent on indexes on the correlation columns (`WHERE category_id = c.id`).
- Avoid using lateral joins for basic links where standard joins are faster.
