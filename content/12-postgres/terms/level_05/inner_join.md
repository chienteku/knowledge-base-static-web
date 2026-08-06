# `INNER JOIN`

> **Level 5 — Table Relationships & JOINs**
> The most common type of SQL join, which returns records only when there is a matching value in both the left and right tables, omitting unmatched rows.

---

## 1. Prerequisites
- [`JOIN` (Concept)](join_concept.md) — The parent table combination mechanics.

---

## 2. Term Category

**SQL Command / Clause** (Matching Intersection Join): `INNER JOIN` returns only rows that have matching values in both joined tables based on the join predicate.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DML** (The default join type. If you write the `JOIN` keyword without prefixing it with a type, Postgres evaluates it as an `INNER JOIN` automatically).

### (1) Design Motivation — "Why did we design this?"
When combining tables, you often want to see only complete relationships. 

For example, in a database containing a `customers` table and an `orders` table:
-   Some customers are new and have never purchased anything (no matching rows in `orders`).
-   Some orders might be legacy guest checkouts where the customer record was deleted or not recorded (no matching user ID).

If you want to compile a shipping list of active order receipts, you only care about records where you have **both** a customer name AND a purchase amount. 

Showing a customer with no purchases, or a purchase with no customer name is useless.

We designed the **`INNER JOIN`** to solve this. 

It acts as an **intersection filter**: the database engine scans both tables, matches them using your `ON` key criteria, and returns a combined row **only if a match exists on both sides**. 

If a customer row cannot find an order, or an order cannot find a customer, those rows are completely skipped from the query output.

---

### (2) The Optional Keyword
In SQL, writing `INNER JOIN` is identical to writing `JOIN`. The `INNER` keyword is optional shorthand:

```sql
-- These two queries compile to the exact same execution plan!
SELECT * FROM users JOIN profiles ON users.id = profiles.user_id;
SELECT * FROM users INNER JOIN profiles ON users.id = profiles.user_id;
```

---

### (3) Reality Metaphor
Imagine a couples dance matching event:
-   You have a line of **Leads** (Left Table) and a line of **Follows** (Right Table).
-   The coordinator matches partners based on height compatibility (the `ON` condition).
-   If a Lead is too tall and cannot find a compatible Follow partner, they are asked to stand on the sidelines (filtered out).
-   If a Follow is too short and cannot find a matching Lead, they are also asked to stand on the sidelines (filtered out).
-   Only matching **pairs** are allowed onto the dance floor (the output grid).

---

### (4) Code Examples

#### Omission of Unmatched Rows
Assume we have these tables:

```sql
CREATE TABLE authors (id INT PRIMARY KEY, name VARCHAR(50));
CREATE TABLE books (id INT PRIMARY KEY, title VARCHAR(50), author_id INT);

INSERT INTO authors VALUES (1, 'Alice'), (2, 'Bob'); -- Bob has no books!
INSERT INTO books VALUES (101, 'Book A', 1), (102, 'Book B', 99); -- Book B has no matching author!
```

Let's run an `INNER JOIN`:

```sql
SELECT authors.name, books.title
FROM authors
INNER JOIN books ON authors.id = books.author_id;
-- Output returns ONLY ONE ROW:
-- name  |  title  
-- ------+---------
-- Alice | Book A

-- Bob is ignored because he has no books.
-- Book B is ignored because author_id 99 does not exist.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using INNER JOIN when you need to retain unmatched records

**The mistake:** Writing an `INNER JOIN` to display a user profile page, and wondering why users who haven't filled out their profile details are completely missing from the directory list.

**Why it's wrong:** Because `INNER JOIN` requires a match on both sides, any user row that lacks a matching entry in the `user_profiles` table is completely wiped from the output. The directory makes it look like those users do not exist.

**Fix: If you want to return all records from one table, regardless of whether a match exists in the second table, you must use a `LEFT JOIN` instead of an `INNER JOIN`.**

---





### Mistake 2: Omitting Join ON Predicates Creating Accidental Cartesian Products

**The mistake:** Writing `SELECT * FROM users INNER JOIN orders;` without `ON` condition.

**Why it's wrong:** In SQL, an `INNER JOIN` requires an explicit `ON` join predicate (e.g. `ON users.id = orders.user_id`). Omitting `ON` causes syntax error.

*Incorrect:*
```sql
SELECT * FROM users INNER JOIN orders; -- ❌ Syntax error: missing ON predicate!
```

*Fix:*
```sql
SELECT * FROM users u INNER JOIN orders o ON u.id = o.user_id;
```



### Mistake 3: Using Low Selectivity Non-Indexed Columns in JOIN Predicates

**The mistake:** Joining `SELECT * FROM users u JOIN orders o ON u.status = o.status;` on low-cardinality status string columns.

**Why it's wrong:** Joining on non-primary/foreign key fields without indexes forces expensive `Hash Join` or `Nested Loop` full table scans.

*Incorrect:*
```sql
// Joining on un-indexed low cardinality text columns
```

*Fix:*
```sql
Join on indexed primary and foreign key columns: ON u.id = o.user_id
```



## 5. Practice Exercises

### Exercise 1: Joining Two Tables with INNER JOIN

**Scenario:**
Query `orders` joined with `users` returning order `id`, `created_at`, `username`, and `email`.

**Requirements:**
1. Execute `SELECT o.id, u.username FROM orders o INNER JOIN users u ON o.user_id = u.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   o.id AS order_id, 
>   o.total_cents, 
>   u.username, 
>   u.email 
> FROM orders AS o 
> INNER JOIN users AS u ON o.user_id = u.id 
> ORDER BY o.id DESC;
> ```
>
> #### Technical Explanation
>
> 1. `INNER JOIN` matches rows where `o.user_id = u.id` evaluates to `TRUE`.
> 2. Excludes orders with no matching user and users with no matching orders.
> 3. Standard relational join statement.
> 
---

### Exercise 2: Multi-Table INNER JOIN Across 3 Tables

**Scenario:**
Query order line items joining `orders`, `order_items`, and `products`.

**Requirements:**
1. Execute 2 `INNER JOIN` clauses linking `orders` -> `order_items` -> `products`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   o.id AS order_id, 
>   p.name AS product_name, 
>   oi.quantity, 
>   oi.unit_price_cents 
> FROM orders AS o 
> INNER JOIN order_items AS oi ON o.id = oi.order_id 
> INNER JOIN products AS p ON oi.product_id = p.id 
> WHERE o.id = 101;
> ```
>
> #### Technical Explanation
>
> 1. Chains multiple `INNER JOIN` clauses sequentially.
> 2. Resolves relationships across 3 normalized tables.
> 3. Relational data assembly.
> 
---

### Exercise 3: Join Execution Plan Inspection with `EXPLAIN`

**Scenario:**
Inspect whether PostgreSQL executes a `Hash Join`, `Nested Loop`, or `Merge Join` for an `INNER JOIN`.

**Requirements:**
1. Execute `EXPLAIN ANALYZE SELECT * FROM orders JOIN users ON orders.user_id = users.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> EXPLAIN ANALYZE 
> SELECT o.id, u.username 
> FROM orders AS o 
> JOIN users AS u ON o.user_id = u.id;
> ```
>
> #### Technical Explanation
>
> 1. PostgreSQL query planner chooses between `Hash Join` (large un-sorted sets), `Nested Loop` (small indexed lookups), or `Merge Join` (pre-sorted sets).
> 2. Utilizes indexes on foreign keys (`orders.user_id`).
> 3. Diagnostic tool for join performance tuning.
> 
---



## 6. Related Terms
- [`JOIN` (Concept)](join_concept.md) — The parent operation.
- [`LEFT JOIN` (`LEFT OUTER JOIN`)](left_join.md) — Sourcing unmatched left-side elements.
- [`RIGHT JOIN` / `FULL OUTER JOIN`](right_full_join.md) — Related concept: `RIGHT JOIN` / `FULL OUTER JOIN`.
- [`FOREIGN KEY`](foreign_key.md) — Joining on foreign key columns.

---

## 7. Key Takeaways
- `INNER JOIN` returns combined rows only when a key matches in both tables.
- Unmatched rows from either the left or right table are silently excluded.
- The `INNER` keyword is optional; `JOIN` defaults to `INNER JOIN` in SQL.
- Serves as the mathematical intersection ($\cap$) of two data sets.
- Do not use `INNER JOIN` if you need to keep unmatched parent rows in the output.
