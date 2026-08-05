# `INNER JOIN`

> **Level 5 — Table Relationships & JOINs**
> The most common type of SQL join, which returns records only when there is a matching value in both the left and right tables, omitting unmatched rows.

---

## 1. Prerequisites
- [`JOIN` (Concept)](join_concept.md) — The parent table combination mechanics.
---

## 2. Term Category
- **SQL DML Statement**

---

## 3. Environment Context
- **PostgreSQL Core DML** (The default join type. If you write the `JOIN` keyword without prefixing it with a type, Postgres evaluates it as an `INNER JOIN` automatically).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Omitting Join ON Predicates Creating Accidental Cartesian Products

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

### Mistake 5: Using Low Selectivity Non-Indexed Columns in JOIN Predicates

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

## 6. Practice Exercises

### Exercise 1: Active Product Catalog

**Problem:** You have a `products` table (columns: `product_name`, `manufacturer_id`) and a `manufacturers` table (columns: `id`, `company_name`). Write the SQL query to select the `product_name` and `company_name` columns. Only return records where the product has a matching manufacturer registered.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT products.product_name, manufacturers.company_name 
> FROM products
> INNER JOIN manufacturers ON products.manufacturer_id = manufacturers.id;
> ```
> - The default `JOIN` acts as an `INNER JOIN`.
> - Align the child's foreign key (`manufacturer_id`) to the parent's primary key (`id`).

---



### Exercise 2: Multi-Table INNER JOIN

**Problem:** Join `orders` (o), `users` (u), and `products` (p) selecting `u.name`, `p.title`, `o.created_at`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT u.name, p.title, o.created_at FROM orders o JOIN users u ON o.user_id = u.id JOIN products p ON o.product_id = p.id;
> ```
> ```sql
> SELECT u.name, p.title, o.created_at
> FROM orders o
> JOIN users u ON o.user_id = u.id
> JOIN products p ON o.product_id = p.id;
> ```
>
> **Explanation:** `INNER JOIN` matches rows present in both LHS and RHS tables.

---

### Exercise 3: USING Clause Join Shorthand

**Problem:** Rewrite `JOIN orders ON users.user_id = orders.user_id` using `USING (user_id)`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM users JOIN orders USING (user_id);
> ```
> ```sql
> SELECT * FROM users JOIN orders USING (user_id);
> ```
>
> **Explanation:** `USING (column_name)` simplifies join predicates when column names are identical in both tables.

## 7. Related Terms
- [`JOIN` (Concept)](join_concept.md) — The parent operation.
- [`LEFT JOIN` (`LEFT OUTER JOIN`)](left_join.md) — Sourcing unmatched left-side elements.
- [`RIGHT JOIN` / `FULL OUTER JOIN`](right_full_join.md) — Related concept: `RIGHT JOIN` / `FULL OUTER JOIN`.
- [`FOREIGN KEY`](foreign_key.md) — Joining on foreign key columns.
---

## 8. Key Takeaways
- `INNER JOIN` returns combined rows only when a key matches in both tables.
- Unmatched rows from either the left or right table are silently excluded.
- The `INNER` keyword is optional; `JOIN` defaults to `INNER JOIN` in SQL.
- Serves as the mathematical intersection ($\cap$) of two data sets.
- Do not use `INNER JOIN` if you need to keep unmatched parent rows in the output.
