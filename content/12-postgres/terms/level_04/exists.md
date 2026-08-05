# `EXISTS` / `NOT EXISTS`

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL logical operators used inside `WHERE` clauses to test whether a nested subquery returns at least one row (`EXISTS`) or zero rows (`NOT EXISTS`).

---

## 1. Prerequisites
- [Subquery (Nested Query)](subquery.md) — The query format evaluated by the operator.
---

## 2. Term Category
- **SQL Query Operator**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL databases. Highly optimized via **Short-Circuit Evaluation** inside query execution engines).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Inactive Author Audit

**Problem:** You have an `authors` table (columns: `id`, `name`) and an `articles` table (columns: `id`, `author_id`, `title`). Write a SQL query to list the names of all authors who have **never** published an article. Use the `NOT EXISTS` operator.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT name 
> FROM authors a
> WHERE NOT EXISTS (
>   SELECT 1 
>   FROM articles ar 
>   WHERE ar.author_id = a.id
> );
> ```
> - Correlate the subquery by matching `ar.author_id` to the parent `a.id`.
> - Use the `SELECT 1` convention inside the `NOT EXISTS` block.

---



### Exercise 2: Correlated `EXISTS` Subquery Filter

**Problem:** Query users who have placed at least one completed order using `EXISTS`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'completed');
> ```
> ```sql
> SELECT * FROM users u
> WHERE EXISTS (
>   SELECT 1 FROM orders o
>   WHERE o.user_id = u.id AND o.status = 'completed'
> );
> ```
>
> **Explanation:** `EXISTS` evaluates true if the correlated subquery returns 1 or more rows.

---

### Exercise 3: Negated `NOT EXISTS` Subquery Filter

**Problem:** Query users who have NEVER placed an order using `NOT EXISTS`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM users u WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
> ```
> ```sql
> SELECT * FROM users u
> WHERE NOT EXISTS (
>   SELECT 1 FROM orders o WHERE o.user_id = u.id
> );
> ```
>
> **Explanation:** `NOT EXISTS` filters rows where no corresponding subquery tuple exists.

## 7. Related Terms
- [Subquery (Nested Query)](subquery.md) — The query container.
- [`WHERE` Clause](../level_03/where.md) — The parent filter wrapper.
---

## 8. Key Takeaways
- `EXISTS` tests if a nested subquery returns at least one row (returns `TRUE` or `FALSE`).
- `NOT EXISTS` returns `TRUE` if the subquery returns zero rows.
- Highly optimized because it short-circuits the scan the moment a match is found.
- The standard convention is to write `SELECT 1` inside the `EXISTS` subquery.
- Much more performant than `IN` subqueries when checking large tables.
