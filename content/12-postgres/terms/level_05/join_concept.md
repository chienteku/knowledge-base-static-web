# `JOIN` (Concept)

> **Level 5 — Table Relationships & JOINs**
> The fundamental SQL operation that dynamically combines rows from two or more tables inside server memory based on a related column, enabling queries across table relationships.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The baseline query command.
- [`FOREIGN KEY`](foreign_key.md) — The column relationships enabling joins.
---

## 2. Term Category
- **Core SQL Concept**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL databases. The query compiler evaluates joins by building execution plans (like Nested Loops, Hash Joins, or Merge Joins) to scan and combine records).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database design, we normalize data by splitting it across separate tables to prevent duplication:
-   `users` table stores user login details.
-   `user_profiles` table stores avatar and bio details.
-   `orders` table stores purchases.

Splitting tables makes writing data clean. 

But when displaying data on a webpage, users expect to see a **combined view**:
-   A profile page showing both the username AND avatar photo.
-   An order history receipt showing the user's name, the order date, and the item title.

If you don't have joins, your application has to query each table separately, download all records, and loop through them in JavaScript to pair them up, which is slow and memory-heavy.

We designed the **`JOIN`** operation to handle this on the server. 

It tells the database to read two tables, find rows that share matching key values, and merge them on-the-fly into a temporary, combined virtual table for the duration of the query.

---

### (2) Column Qualification (Avoiding Ambiguity)
When joining tables, they often contain columns with the same name (like `id` or `created_at`). 

To prevent the database from getting confused (which triggers an "ambiguous column" error), you must **qualify** columns by prefixing them with the table name (or a table alias):

-   `users.id` vs. `orders.id`
-   `u.created_at` vs. `o.created_at` (using aliases `users AS u` and `orders AS o`)

---

### (3) Reality Metaphor
Imagine a puzzle-matching game:
-   You have a box of **Customer Cards** and a box of **Order Receipt Slips**.
-   The customer card has a tab shaped like a specific ID number (`101`).
-   The order receipt slip has a matching slot labeled `customer_id = 101`.
-   **A JOIN** is the act of snapping the customer card and the order receipt together by matching the tab and the slot, creating a single, wide card containing both sets of details.

---

### (4) Code Examples

#### The Conceptual Join Query
We join tables using the `JOIN` keyword and specify the key match using the `ON` clause:

```sql
SELECT 
  customers.name AS customer_name, 
  orders.amount AS order_amount
FROM orders
JOIN customers ON orders.customer_id = customers.id;
-- ON tells the engine to align rows where the keys match exactly
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to qualify ambiguous columns in the SELECT projection list

**The mistake:** Writing a query that selects `id` or `name` without specifying which table it belongs to:

```sql
-- BAD: Both tables have an 'id' column, causing a crash!
SELECT id, name, amount 
FROM orders
JOIN customers ON orders.customer_id = customers.id;
-- ERROR: column reference "id" is ambiguous
```

**Why it's wrong:** The SQL parser does not know if you want to display the order's ID or the customer's ID. Because it cannot make assumptions, it aborts the query.

**Fix: Always prefix column names with their source table name (or table alias) when joining tables.**

```sql
/* Correct approach */
SELECT orders.id AS order_id, customers.name, orders.amount 
FROM orders
JOIN customers ON orders.customer_id = customers.id;
```

---



### Mistake 2: Confusing `INNER JOIN` (Matches Both) with `LEFT JOIN` (Preserves Left Table Rows)

**The mistake:** Using `INNER JOIN` when querying all users including those with 0 orders.

**Why it's wrong:** `INNER JOIN` drops users who have placed 0 orders! Use `LEFT JOIN` to preserve all rows from the left `users` table.

*Incorrect:*
```sql
SELECT u.name, o.id FROM users u JOIN orders o ON u.id = o.user_id; -- Drops users with 0 orders!
```

*Fix:*
```sql
SELECT u.name, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id; -- Preserves all users
```

### Mistake 3: Converting `LEFT JOIN` to `INNER JOIN` Accidental Invalidation via `WHERE` Clause Filter

**The mistake:** Writing `SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed';`.

**Why it's wrong:** Filtering `o.status = 'completed'` in `WHERE` eliminates rows where `o.status` is NULL, silently converting the `LEFT JOIN` back into an `INNER JOIN`! Place filter in `ON` clause.

*Incorrect:*
```sql
SELECT * FROM u LEFT JOIN o ON u.id = o.user_id WHERE o.status = 'completed'; -- Converts to INNER JOIN!
```

*Fix:*
```sql
SELECT * FROM u LEFT JOIN o ON u.id = o.user_id AND o.status = 'completed';
```



### Mistake 4: Confusing `INNER JOIN` (Matches Both) with `LEFT JOIN` (Preserves Left Table Rows)

**The mistake:** Using `INNER JOIN` when querying all users including those with 0 orders.

**Why it's wrong:** `INNER JOIN` drops users who have placed 0 orders! Use `LEFT JOIN` to preserve all rows from the left `users` table.

*Incorrect:*
```sql
SELECT u.name, o.id FROM users u JOIN orders o ON u.id = o.user_id; -- Drops users with 0 orders!
```

*Fix:*
```sql
SELECT u.name, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id; -- Preserves all users
```

### Mistake 5: Converting `LEFT JOIN` to `INNER JOIN` Accidental Invalidation via `WHERE` Clause Filter

**The mistake:** Writing `SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed';`.

**Why it's wrong:** Filtering `o.status = 'completed'` in `WHERE` eliminates rows where `o.status` is NULL, silently converting the `LEFT JOIN` back into an `INNER JOIN`! Place filter in `ON` clause.

*Incorrect:*
```sql
SELECT * FROM u LEFT JOIN o ON u.id = o.user_id WHERE o.status = 'completed'; -- Converts to INNER JOIN!
```

*Fix:*
```sql
SELECT * FROM u LEFT JOIN o ON u.id = o.user_id AND o.status = 'completed';
```

## 6. Practice Exercises

### Exercise 1: Schema Blueprint Concept

**Problem:** You have a `posts` table (columns: `id`, `title`, `author_id`) and a `users` table (columns: `id`, `username`). Write the SQL query structure to fetch the post `title` and the author's `username`. Qualify all columns.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT posts.title, users.username 
> FROM posts
> JOIN users ON posts.author_id = users.id;
> ```
> - The join matching condition must align the child's foreign key (`posts.author_id`) to the parent's primary key (`users.id`).
> - Qualify columns using dot notation `table_name.column_name`.

---



### Exercise 2: Selecting JOIN Type Based on Requirement

**Problem:** Select JOIN type: 1. Match rows present in both tables (`INNER JOIN`), 2. Keep all left rows (`LEFT JOIN`), 3. All combinations (`CROSS JOIN`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. INNER JOIN, 2. LEFT JOIN, 3. CROSS JOIN
> ```
> ```text
> 1. INNER JOIN, 2. LEFT JOIN, 3. CROSS JOIN
> ```
>
> **Explanation:** JOIN types dictate row preservation and matching semantics.

---

### Exercise 3: Join Execution Strategy Types in Explain

**Problem:** List 3 internal physical join strategies used by PostgreSQL query planner (`Nested Loop`, `Hash Join`, `Merge Join`).

**Expected output:**
> [!check]- Answer
> ```text
> Nested Loop, Hash Join, Merge Join
> ```
> ```text
> Nested Loop, Hash Join, Merge Join
> ```
>
> **Explanation:** The PostgreSQL query planner selects physical join algorithms based on data size and indexes.

## 7. Related Terms
- [`INNER JOIN`](inner_join.md) — The default matching join.
- [`LEFT JOIN` (`LEFT OUTER JOIN`)](left_join.md) — Sourcing unmatched left-side rows.
- [`CROSS JOIN`](cross_join.md) — Related concept: `CROSS JOIN`.
- [Self-Join](self_join.md) — Related concept: Self-Join.
- [`LATERAL` Join](../level_09/lateral_join.md) — Related concept: `LATERAL` Join.
---

## 8. Key Takeaways
- `JOIN` operations combine rows from different tables into a single virtual result.
- Tables are linked by matching foreign keys to primary keys using the `ON` clause.
- Joins do not modify tables on disk; they build temporary records in memory.
- Qualify columns (e.g. `table.column`) to avoid ambiguous column errors.
- Performing joins on the server minimizes network and application overhead.
