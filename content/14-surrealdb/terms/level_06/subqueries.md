# Subqueries

> **Level 6 — Advanced Querying & Functions**
> The SurrealQL feature that allows embedding a `SELECT` query inside another query expression (in `WHERE`, `SELECT`, or `SET` clauses), enabling dynamic scalar values or multi-record lists to be computed inline.

---

## 1. Prerequisites
- [SELECT](../level_03/select.md) — The primary query statement.
- [WHERE Clause](../level_03/where.md) — Conditional filter contexts.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed inline by the query planner. Evaluates nested subqueries prior to passing results to outer projection or filter stages).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In complex data systems, filtering or updating records often depends on the state of other records:
- You want to find all users whose account balance exceeds the average balance across all users.
- You want to retrieve posts published by authors who belong to a specific organization.

In SQL (PostgreSQL), subqueries are widely used inside `IN`, `EXISTS`, or scalar expressions. In MongoDB, achieving similar logic requires multiple aggregation pipeline stages (`$lookup` with sub-pipelines).

We designed **Subqueries** in SurrealQL to provide a clean, SQL-compatible way to nest query expressions. Because SurrealQL treats query blocks as expressions that evaluate to values or arrays, you can place a subquery anywhere an expression is expected—such as inside a `WHERE` condition, a `LET` variable assignment, or a field `SET` calculation.

---

### (2) Subquery Contexts & Behavior

1. **Scalar Subqueries (Single Value):**
   When a subquery uses `SELECT VALUE` or targets a single field on a single record, it evaluates to a scalar value (like a number or string).
   - Example: `SELECT * FROM product WHERE price > (SELECT VALUE math::mean(price) FROM product);`

2. **Array Subqueries (List of Items):**
   When a subquery returns multiple records or values, it evaluates to an array.
   - Example: `SELECT * FROM post WHERE author IN (SELECT VALUE id FROM user WHERE role = 'admin');`

---

### (3) Reality Metaphor (The Nested Envelope)
Imagine processing an application form:
- **Direct Query:** Reading a form that lists a user's score directly on line 1.
- **Subquery:** Line 1 reads: *"Please open the small sealed envelope attached to the back of this form, read the number written inside, and use that number as your minimum threshold."* 
  - The clerk opens the inner envelope first (executes subquery), retrieves the number, and then evaluates the main form.

---

### (4) Code Examples

#### Using Subqueries in SurrealQL

```sql
-- 1. Scalar Subquery in WHERE: Find products priced above the average
SELECT title, price 
FROM product 
WHERE price > (SELECT VALUE math::mean(price) FROM product);

-- 2. List Subquery with IN operator: Find posts by active admins
SELECT title, author 
FROM post 
WHERE author IN (SELECT VALUE id FROM user WHERE role = 'admin' AND active = true);

-- 3. Subquery inside a SET clause during UPDATE
UPDATE summary:daily SET 
  total_users = (SELECT VALUE count() FROM user GROUP ALL)[0];
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that a standard SELECT subquery returns an array of objects rather than a flat list, causing 'IN' or comparison checks to fail

**The mistake:** Writing `WHERE author IN (SELECT id FROM user WHERE role = 'admin');` expecting a list of Record IDs.

**Why it's wrong:** A standard `SELECT id FROM user` returns an array of objects `[{ id: user:alice }, { id: user:bob }]`. Passing an array of objects into an `IN` check for a single Record ID field causes the comparison to fail.

**Fix: Use `SELECT VALUE` in subqueries when extracting a list of primitive values or Record IDs for comparison:**

```sql
-- BAD (returns array of objects)
WHERE author IN (SELECT id FROM user WHERE role = 'admin');

-- GOOD (returns flat array of Record IDs)
WHERE author IN (SELECT VALUE id FROM user WHERE role = 'admin');
```

---



### Mistake 2: Forgetting Parentheses Around Subqueries in Expressions

**The mistake:** Writing `LET $u = SELECT * FROM user;` without wrapping subquery in `(...)`.

**Why it's wrong:** Subqueries embedded inside expressions, statements, or assignments MUST be enclosed in parentheses `(...)`.

*Incorrect:*
```surrealql
LET $u = SELECT * FROM user; // ❌ Parse error: missing parentheses!
```

*Fix:*
```surrealql
LET $u = (SELECT * FROM user); // Correct parenthesized subquery
```

### Mistake 3: Expecting Scalar Values from Subqueries Returning Array Results

**The mistake:** Writing `WHERE author = (SELECT id FROM user)` expecting a single scalar ID.

**Why it's wrong:** Subqueries return array results `[{ id: user:1 }]` or `[user:1]`. Index the array `(SELECT VALUE id FROM user WHERE ...)[0]` or use `WHERE author IN (SELECT VALUE id FROM user)`.

*Incorrect:*
```surrealql
SELECT * FROM post WHERE author = (SELECT VALUE id FROM user WHERE role = 'admin'); // ❌ Array comparison mismatch!
```

*Fix:*
```surrealql
SELECT * FROM post WHERE author IN (SELECT VALUE id FROM user WHERE role = 'admin'); // Correct IN array comparison
```

## 6. Practice Exercises

### Exercise 1: Subquery Formulation

**Problem:** You have an `orders` table and a `customers` table.
Write a SurrealQL query to retrieve all `orders` where the `customer` field (a `record<customers>` link) belongs to a customer located in `"Tokyo"`.

**Expected output:**
```sql
SELECT * FROM orders 
WHERE customer IN (SELECT VALUE id FROM customers WHERE address.city = 'Tokyo');
```

> [!check]- Answer
> - The inner subquery should select `VALUE id` from `customers`.
> - Use the `IN` operator in the outer query's `WHERE` clause.

---



### Exercise 2: Correlated Subquery Projection

**Problem:** Select user name and total article count using correlated subquery in projection.

**Expected output:**
```text
SELECT name, (SELECT VALUE count() FROM article WHERE author = $parent.id GROUP ALL)[0] AS article_count FROM user;
```

> [!check]- Answer
> ```surrealql
> SELECT name, (SELECT VALUE count() FROM article WHERE author = $parent.id GROUP ALL)[0] AS article_count FROM user;
> ```
>
> **Explanation:** `$parent` accesses outer parent record fields from within nested subqueries.

### Exercise 3: Subquery Predicate Filtering

**Problem:** Select articles whose `author` is in active users list using `WHERE author IN (subquery)`.

**Expected output:**
```text
SELECT * FROM article WHERE author IN (SELECT VALUE id FROM user WHERE active = true);
```

> [!check]- Answer
> ```surrealql
> SELECT * FROM article WHERE author IN (SELECT VALUE id FROM user WHERE active = true);
> ```
>
> **Explanation:** `WHERE field IN (subquery)` filters records matching subquery value sets.

## 7. Related Terms
- [SELECT](../level_03/select.md) — The query statement.
- [SELECT VALUE](../level_03/select_value.md) — Extracting flat arrays.
- [Parameters (`$param`)](parameters.md) — Session variables.

---

## 8. Key Takeaways
- Subqueries embed a `SELECT` expression inside another statement.
- Use `SELECT VALUE` inside subqueries to return flat lists suitable for `IN` filters.
- Scalar subqueries can compute dynamic threshold numbers (e.g. average price).
- Subqueries evaluate inline before the parent query finishes filtering.
- Works across `WHERE`, `SET`, `LET`, and projection clauses.
