# `EXISTS` / `NOT EXISTS`

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL logical operators used inside `WHERE` clauses to test whether a nested subquery returns at least one row (`EXISTS`) or zero rows (`NOT EXISTS`).

---

## 1. Prerequisites
- [Subquery (Nested Query)](subquery.md) — The query format evaluated by the operator.
- [`SELECT`](../level_03/select.md) — Testing subquery row existence using EXISTS.

---

## 2. Term Category

**SQL Command / Clause** (Subquery Existence Predicate): `EXISTS` tests whether a correlated subquery returns at least one row, evaluating as a fast boolean predicate.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all SQL databases. Highly optimized via **Short-Circuit Evaluation** inside query execution engines).

### (1) Design Motivation — "Why did we design this?"
In relational databases, you frequently need to check for the presence of related data in another table before returning a row:
-   Find all customers who have placed **at least one order**.
-   Find all users who have **never** posted a comment.

You could solve this using a `JOIN` statement or an `IN` subquery:
`WHERE customer_id IN (SELECT customer_id FROM orders)`

However, if the `orders` table has 10 million rows, using `IN` forces the database to load and build a massive list of 10 million IDs in memory to check your user ID against, which is slow and memory-heavy.

We designed the **`EXISTS`** operator to solve this. 

It does not retrieve or build list arrays. 

It evaluates a subquery for every parent row and returns `TRUE` the absolute millisecond it finds **the first matching record** inside the subquery table. 

This is called **Short-Circuit Evaluation**: it stops looking further, saving massive amounts of disk and CPU processing.

---

### (2) The `SELECT 1` Convention
Because `EXISTS` only cares *if* a row is returned (completely ignoring what values are inside that row), the columns you list in the subquery do not matter.

The industry standard is to write **`SELECT 1`** inside the subquery:

```sql
-- Checks if any row matches, returning the static number 1
WHERE EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.id)
```

---

### (3) Reality Metaphor
Imagine checking room occupancies:
-   **`IN` check:** Forcing every single person in a theater to walk out, tell you their name, and checking if their name is on your list.
-   **`EXISTS` check:** Walking up to a closed door, knocking once, and calling out: *"Is anyone in there?"* The moment you hear one person reply *"Yes,"* you stop knocking and walk away. You don't care who they are or how many people are in the room; you only care that the room is not empty.

---

### (4) Code Examples

#### 1. EXISTS (Has orders)
```sql
CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(50));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount NUMERIC(10,2));

-- Find customers who have made purchases
SELECT name 
FROM customers c
WHERE EXISTS (
  SELECT 1 
  FROM orders o 
  WHERE o.customer_id = c.id
);
```

#### 2. NOT EXISTS (Active inactive check)
Find customers who have never made a purchase:

```sql
SELECT name 
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 
  FROM orders o 
  WHERE o.customer_id = c.id
);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Writing columns or SELECT * inside EXISTS subqueries because you think they are required

**The mistake:** Writing queries like `WHERE EXISTS (SELECT * FROM orders WHERE ...)` or `SELECT order_date`.

**Why it's wrong:** It is not syntactically incorrect, but it is confusing. Writing `SELECT *` makes it look like the query is pulling data columns out of the subquery, which it is not. 

**Fix: Always use the standard `SELECT 1` convention inside `EXISTS` blocks. It makes it clear to other developers that the query is a pure existence check.**

---



### Mistake 2: Using `COUNT(*) > 0` in Subqueries Instead of `EXISTS`

**The mistake:** Writing `WHERE (SELECT COUNT(*) FROM orders WHERE user_id = u.id) > 0`.

**Why it's wrong:** `COUNT(*)` scans and counts ALL matching rows in the subquery before evaluating. `EXISTS` short-circuits instantly on finding the FIRST matching tuple.

*Incorrect:*
```sql
SELECT * FROM users u WHERE (SELECT COUNT(*) FROM orders WHERE user_id = u.id) > 0; -- ❌ Scans all orders!
```

*Fix:*
```sql
SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders WHERE user_id = u.id); -- Short-circuits on first match
```

### Mistake 3: Thinking `SELECT *` inside `EXISTS (SELECT * FROM ...)` Causes Performance Overhead

**The mistake:** Replacing `EXISTS (SELECT * ...)` with `EXISTS (SELECT 1 ...)` thinking `SELECT 1` is faster.

**Why it's wrong:** Inside `EXISTS(...)`, PostgreSQL ignores the projection list entirely! `EXISTS (SELECT *)` and `EXISTS (SELECT 1)` produce IDENTICAL execution plans.

*Incorrect:*
```sql
-- Worrying that SELECT * inside EXISTS degrades performance
```

*Fix:*
```sql
EXISTS (SELECT 1 FROM ...) is idiomatic, but SELECT * has zero performance penalty inside EXISTS
```

## 5. Practice Exercises

### Exercise 1: Correlated Subquery Filtering with `EXISTS`

**Scenario:**
Find all customers who have placed at least one order in table `orders`.

**Requirements:**
1. Execute `WHERE EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, company_name 
> FROM customers AS c 
> WHERE EXISTS (
>   SELECT 1 
>   FROM orders AS o 
>   WHERE o.customer_id = c.id
> );
> ```
>
> #### Technical Explanation
>
> 1. `EXISTS` evaluates to `TRUE` as soon as the inner subquery returns a single matching row.
> 2. Stops subquery execution immediately upon finding the first match ($O(1)$ short-circuiting).
> 3. Outperforms `IN (SELECT customer_id FROM orders)` when subqueries return large result sets.
> 
---

### Exercise 2: Finding Inactive Entities with `NOT EXISTS`

**Scenario:**
Find all customers who have NEVER placed an order.

**Requirements:**
1. Use `WHERE NOT EXISTS (...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, company_name 
> FROM customers AS c 
> WHERE NOT EXISTS (
>   SELECT 1 
>   FROM orders AS o 
>   WHERE o.customer_id = c.id
> );
> ```
>
> #### Technical Explanation
>
> 1. `NOT EXISTS` checks if the inner subquery returns zero rows.
> 2. Safely handles `NULL` values in foreign keys without unexpected 3-valued logic pitfalls.
> 3. Standard anti-join pattern.
> 
---

### Exercise 3: Performance Comparison: EXISTS vs IN vs LEFT JOIN

**Scenario:**
Evaluate why `EXISTS` is preferred over `IN` for subqueries containing potential `NULL` values.

**Requirements:**
1. Contrast `NOT EXISTS` vs `NOT IN`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Subquery Security Comparison:
> - NOT IN (SELECT nullable_col FROM ...): Returns ZERO rows if ANY subquery row returns NULL! (3-valued logic trap).
> - NOT EXISTS (SELECT 1 FROM ...): Handles NULL values safely and short-circuits execution.
> Recommendation: Always use NOT EXISTS over NOT IN for subquery filtering.
> ```
>
> #### Technical Explanation
>
> 1. `NOT IN` fails when subquery results contain `NULL` because `val NOT IN (1, 2, NULL)` evaluates to `UNKNOWN`.
> 2. `NOT EXISTS` relies on boolean row counts, bypassing `NULL` value bugs.
> 3. Production SQL safety rule.
> 
---



## 6. Related Terms
- [Subquery (Nested Query)](subquery.md) — The query container.
- [`WHERE` Clause](../level_03/where.md) — The parent filter wrapper.

---

## 7. Key Takeaways
- `EXISTS` tests if a nested subquery returns at least one row (returns `TRUE` or `FALSE`).
- `NOT EXISTS` returns `TRUE` if the subquery returns zero rows.
- Highly optimized because it short-circuits the scan the moment a match is found.
- The standard convention is to write `SELECT 1` inside the `EXISTS` subquery.
- Much more performant than `IN` subqueries when checking large tables.
