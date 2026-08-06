# `LEFT JOIN` (`LEFT OUTER JOIN`)

> **Level 5 — Table Relationships & JOINs**
> A join type that returns all rows from the left table (listed in the `FROM` clause) and matching rows from the right table, padding unmatched right-side fields with `NULL`.

---

## 1. Prerequisites
- [`INNER JOIN`](inner_join.md) — The default matching join behavior.

---

## 2. Term Category

**SQL Command / Clause** (Preserved Left Table Join): `LEFT JOIN` (or `LEFT OUTER JOIN`) returns all rows from the left table alongside matching rows from the right table, populating `NULL` for un-matched right rows.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DML** (The standard outer join method. `LEFT OUTER JOIN` is the verbose ANSI standard; PostgreSQL treats `LEFT JOIN` as identical).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Preserving Un-Matched Left Rows with LEFT JOIN

**Scenario:**
Query all `users` alongside their `orders`, preserving users who have 0 orders.

**Requirements:**
1. Execute `SELECT u.username, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   u.id AS user_id, 
>   u.username, 
>   o.id AS order_id, 
>   o.total_cents 
> FROM users AS u 
> LEFT JOIN orders AS o ON u.id = o.user_id 
> ORDER BY u.id ASC;
> ```
>
> #### Technical Explanation
>
> 1. `LEFT JOIN` returns ALL rows from the left table (`users`).
> 2. If a user has no matching orders, `o.id` and `o.total_cents` populate as `NULL`.
> 3. Prevents dropping users without purchase history.

---

### Exercise 2: Finding Orphan/Un-Associated Rows with IS NULL Filtering

**Scenario:**
Find all users who have NEVER placed an order using `LEFT JOIN ... WHERE o.id IS NULL`.

**Requirements:**
1. Execute `WHERE o.id IS NULL`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   u.id, 
>   u.username, 
>   u.email 
> FROM users AS u 
> LEFT JOIN orders AS o ON u.id = o.user_id 
> WHERE o.id IS NULL;
> ```
>
> #### Technical Explanation
>
> 1. `LEFT JOIN` populates right table columns as `NULL` when no match exists.
> 2. `WHERE o.id IS NULL` filters for ONLY un-matched left rows.
> 3. Idiomatic anti-join pattern.

---

### Exercise 3: Aggregating Over LEFT JOIN Result Sets

**Scenario:**
Calculate order count per user including users with 0 orders using `COUNT(o.id)`.

**Requirements:**
1. Execute `SELECT u.username, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.username`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   u.id, 
>   u.username, 
>   COUNT(o.id) AS total_orders 
> FROM users AS u 
> LEFT JOIN orders AS o ON u.id = o.user_id 
> GROUP BY u.id, u.username;
> ```
>
> #### Technical Explanation
>
> 1. `COUNT(o.id)` counts non-null order IDs (returns `0` for users with no orders).
> 2. Using `COUNT(*)` would incorrectly return `1` for un-matched users because a row with `NULL` right columns was returned.
> 3. Crucial distinction when aggregating outer joins.

---



## 6. Related Terms
- [`INNER JOIN`](inner_join.md) — The matching-only join.
- [`RIGHT JOIN` / `FULL OUTER JOIN`](right_full_join.md) — Reversing sides or joining everything.
- [`JOIN` (Concept)](join_concept.md) — Related concept: `JOIN` (Concept).

---

## 7. Key Takeaways
- `LEFT JOIN` guarantees that every row from the left table remains in the output.
- Unmatched right-side column values are populated with `NULL` pads.
- The `LEFT OUTER JOIN` keyword is syntactically identical to `LEFT JOIN`.
- Do not filter right-side columns inside the `WHERE` clause to avoid inner-join conversions.
- Place right-side table filters inside the `ON` clause to keep the left join stable.
- Essential for user directories, audit logs, and catalog item coverage tests.
