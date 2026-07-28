# `LEFT JOIN` (`LEFT OUTER JOIN`)

> **Level 5 — Table Relationships & JOINs**
> A join type that returns all rows from the left table (listed in the `FROM` clause) and matching rows from the right table, padding unmatched right-side fields with `NULL`.

---

## 1. Prerequisites
- [`INNER JOIN`](inner_join.md) — The default matching join behavior.

---

## 2. Term Category
- **SQL DML Statement**

---

## 3. Environment Context
- **PostgreSQL Core DML** (The standard outer join method. `LEFT OUTER JOIN` is the verbose ANSI standard; PostgreSQL treats `LEFT JOIN` as identical).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in `inner_join.md`, an inner join hides records that do not have a match in both tables.

However, in dashboard design, you often need to show a complete parent list regardless of connection history:
-   Show a list of **all users**, including those who haven't completed their profiles (so we can prompt them to fill it out).
-   Show a list of **all products**, including those that have never been ordered (so we know which items are unpopular).
-   Show a list of **all authors**, including those who haven't written any books yet.

If you used `INNER JOIN` to fetch these lists, your output would hide the empty elements, making them invisible.

We designed the **`LEFT JOIN`** to solve this. 

It designates the first table (written after `FROM`) as the **Master Table**. 

The database guarantees that **every single row from the Master Table remains in the output**. 

If a row finds a matching partner in the second table (written after `LEFT JOIN`), the columns are merged. 

If it does not find a match, the query still outputs the master row, but fills all columns belonging to the second table with **`NULL`**.

---

### (2) Left vs. Right: Which is which?
SQL maps tables left-to-right based on code reading order:

```sql
SELECT *
FROM table_left -- 1. LEFT (The Master Table)
LEFT JOIN table_right ON ... -- 2. RIGHT
```

---

### (3) Reality Metaphor
Imagine a school classroom registry check:
-   The teacher prints a sheet containing the names of **all students** in the class (the Left Table).
-   She walks down the hall checking **Locker Assignments** (the Right Table).
-   If Student Alice has locker `105`, the teacher writes `105` next to Alice's name.
-   If Student Bob does not have a locker, the teacher **does not erase Bob's name** from the student registry list. She simply leaves his locker column blank (writes `NULL`). Bob remains on the sheet.

---

### (4) Code Examples

#### Retaining Unmatched Left Rows
Let's reuse our authors and books database:

```sql
CREATE TABLE authors (id INT PRIMARY KEY, name VARCHAR(50));
CREATE TABLE books (id INT PRIMARY KEY, title VARCHAR(50), author_id INT);

INSERT INTO authors VALUES (1, 'Alice'), (2, 'Bob'); -- Bob has no books!
INSERT INTO books VALUES (101, 'Book A', 1);
```

Let's execute a `LEFT JOIN`:

```sql
SELECT authors.name, books.title
FROM authors
LEFT JOIN books ON authors.id = books.author_id;
-- Output:
-- name  |  title  
-- ------+---------
-- Alice | Book A
-- Bob   | NULL    <-- Bob is kept! His missing title is padded with NULL.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accidentally converting a LEFT JOIN into an INNER JOIN using WHERE filters

**The mistake:** Performing a `LEFT JOIN` to keep all users, but placing a filtering condition on the right table inside the `WHERE` clause:

```sql
-- BAD: This silently behaves as a strict INNER JOIN!
SELECT users.username, orders.order_date
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE orders.status = 'shipped'; -- WRONG: Filters out users without orders!
```

**Why it's wrong:** For users who have no orders, the `LEFT JOIN` correctly outputs their row and pads `orders.status` with `NULL`. 

However, the database then processes the `WHERE` clause: `WHERE NULL = 'shipped'`. 

Because this is `FALSE`, the database filters out the NULL row. 

All users without orders are thrown away, converting your left join back into a slow inner join.

**Fix: Place conditions targeting the right-side table directly inside the `ON` clause, not the `WHERE` clause.**

```sql
-- CORRECT: Preserves all users, showing order date only if shipped
SELECT users.username, orders.order_date
FROM users
LEFT JOIN orders ON users.id = orders.user_id AND orders.status = 'shipped';
```

---



### Mistake 2: Filtering Left Joined Table Attributes in `WHERE` Clauses (Silent Conversion to INNER JOIN)

**The mistake:** Writing `SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed';`.

**Why it's wrong:** Filtering `o.status = 'completed'` in `WHERE` discards rows where `o.status` is NULL (users with 0 orders), converting `LEFT JOIN` into `INNER JOIN`. Put conditions in `ON` clause.

*Incorrect:*
```sql
SELECT * FROM u LEFT JOIN o ON u.id = o.user_id WHERE o.status = 'completed'; -- ❌ Drops users without orders!
```

*Fix:*
```sql
SELECT * FROM u LEFT JOIN o ON u.id = o.user_id AND o.status = 'completed'; -- Preserves zero-order users
```

### Mistake 3: Confusing `LEFT JOIN` with `RIGHT JOIN` Query Table Positioning

**The mistake:** Swapping table positions expecting identical `LEFT JOIN` output.

**Why it's wrong:** `LEFT JOIN` preserves ALL rows from the FIRST (left) table. Swapping table positions alters which table's rows are fully preserved.

*Incorrect:*
```sql
// Swapping left and right tables expecting identical output
```

*Fix:*
```sql
Keep primary entity table on LHS of LEFT JOIN: FROM users u LEFT JOIN orders o
```



### Mistake 4: Filtering Left Joined Table Attributes in `WHERE` Clauses (Silent Conversion to INNER JOIN)

**The mistake:** Writing `SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed';`.

**Why it's wrong:** Filtering `o.status = 'completed'` in `WHERE` discards rows where `o.status` is NULL (users with 0 orders), converting `LEFT JOIN` into `INNER JOIN`. Put conditions in `ON` clause.

*Incorrect:*
```sql
SELECT * FROM u LEFT JOIN o ON u.id = o.user_id WHERE o.status = 'completed'; -- ❌ Drops users without orders!
```

*Fix:*
```sql
SELECT * FROM u LEFT JOIN o ON u.id = o.user_id AND o.status = 'completed'; -- Preserves zero-order users
```

### Mistake 5: Confusing `LEFT JOIN` with `RIGHT JOIN` Query Table Positioning

**The mistake:** Swapping table positions expecting identical `LEFT JOIN` output.

**Why it's wrong:** `LEFT JOIN` preserves ALL rows from the FIRST (left) table. Swapping table positions alters which table's rows are fully preserved.

*Incorrect:*
```sql
// Swapping left and right tables expecting identical output
```

*Fix:*
```sql
Keep primary entity table on LHS of LEFT JOIN: FROM users u LEFT JOIN orders o
```

## 6. Practice Exercises

### Exercise 1: Customer Activity Audit

**Problem:** You have a `customers` table (columns: `id`, `name`) and an `orders` table (columns: `id`, `customer_id`, `amount`). Write a SQL query to list the name of **every** customer in the system, along with the total `amount` they spent. If they have never made a purchase, display `NULL` (or handle it using aggregates).

**Expected output:**
```sql
SELECT customers.name, orders.amount 
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id;
```

> [!check]- Answer
> - The master table containing the complete registry is `customers`. Place it in the `FROM` clause.
> - Link `orders` using a `LEFT JOIN` on the matching customer ID keys.

---



### Exercise 2: Finding Orphaned Rows with LEFT JOIN and IS NULL

**Problem:** Query users who have placed 0 orders using `LEFT JOIN ... WHERE o.id IS NULL`.

**Expected output:**
```text
SELECT u.* FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.id IS NULL;
```

> [!check]- Answer
> ```sql
> SELECT u.*
> FROM users u
> LEFT JOIN orders o ON u.id = o.user_id
> WHERE o.id IS NULL;
> ```
>
> **Explanation:** `LEFT JOIN` paired with `WHERE right_id IS NULL` identifies unmatched left rows.

### Exercise 3: Preserving Unmatched Left Rows with Aggregation

**Problem:** Query user names and total order counts including users with 0 orders using `LEFT JOIN` and `COUNT(o.id)`.

**Expected output:**
```text
SELECT u.name, COUNT(o.id) AS order_cnt FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name;
```

> [!check]- Answer
> ```sql
> SELECT u.name, COUNT(o.id) AS order_cnt
> FROM users u
> LEFT JOIN orders o ON u.id = o.user_id
> GROUP BY u.id, u.name;
> ```
>
> **Explanation:** `COUNT(o.id)` evaluates to 0 for users with no matching order rows.

## 7. Related Terms
- [`INNER JOIN`](inner_join.md) — The matching-only join.
- [`RIGHT JOIN` / `FULL OUTER JOIN`](right_full_join.md) — Reversing sides or joining everything.

---

## 8. Key Takeaways
- `LEFT JOIN` guarantees that every row from the left table remains in the output.
- Unmatched right-side column values are populated with `NULL` pads.
- The `LEFT OUTER JOIN` keyword is syntactically identical to `LEFT JOIN`.
- Do not filter right-side columns inside the `WHERE` clause to avoid inner-join conversions.
- Place right-side table filters inside the `ON` clause to keep the left join stable.
- Essential for user directories, audit logs, and catalog item coverage tests.
