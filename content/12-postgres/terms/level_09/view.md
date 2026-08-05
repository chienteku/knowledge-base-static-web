# View

> **Level 9 — Views, Functions & Advanced SQL**
> A virtual, logical table defined by a saved SQL `SELECT` query that does not store physical data itself but allows developers to query it as if it were a standard table.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The query statement saved inside the view.
- [Table (Relation)](../level_01/table.md) — The underlying base tables.
---

## 2. Term Category
- **Database Object / Abstraction Layer**

---

## 3. Environment Context
- **Universal Standard** (Supported by all relational SQL engines. Standard views are evaluated dynamically at execution time by merging the view's query with the parent query).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In production systems, schemas grow complex. 

To compile a simple report (like a list of active orders with customer names and total amounts), developers must write a 30-line query joining `orders`, `users`, and `order_items` with calculations and filters.

If multiple developers write this query inside separate application files:
-   **DRY Violation:** You duplicate complex query logic across your codebase.
-   **High Maintenance:** If you rename a column or split a table, you must search and replace that query in 20 different files, risking syntax errors.

We designed the **View** to solve this duplication problem. 

A view allows you to save a query under a name directly in the database catalog:
`CREATE VIEW active_order_summaries AS SELECT ...`

Once created, it behaves exactly like a read-only table. 

Developers can write simple queries against it:
`SELECT * FROM active_order_summaries WHERE amount > 100;`

If the database structure changes, you only update the single view query, keeping the application code intact.

---

### (2) Security Portal (Data Masking)
Views act as security shields. 

If your `employees` table contains sensitive columns (`salary`, `ssn`), you can create a view that selects only public details:

```sql
CREATE VIEW public_staff AS 
SELECT id, name, department FROM employees;
```

You can then grant read permissions for `public_staff` to developers, while blocking access to the raw `employees` table entirely.

---

### (3) Reality Metaphor
Imagine a house window:
-   When you look through a **Window** to see the backyard garden, the window glass itself doesn't contain any dirt, flowers, or grass (no stored data). 
-   It is a portal that displays a filtered view of the physical yard outside. 
-   If you walk into the yard and paint the garden fence, the view through the window updates immediately.

---

### (4) Code Examples

#### Creating and Querying a View
```sql
CREATE TABLE authors (id INT PRIMARY KEY, name VARCHAR(100));
CREATE TABLE books (id INT PRIMARY KEY, author_id INT REFERENCES authors(id), title VARCHAR(100));

INSERT INTO authors VALUES (1, 'Jane Austen');
INSERT INTO books VALUES (10, 1, 'Pride and Prejudice');

-- Create the view
CREATE VIEW author_catalog AS
SELECT authors.name AS author_name, books.title AS book_title
FROM authors
JOIN books ON authors.id = books.author_id;

-- Query the view like a table
SELECT * FROM author_catalog WHERE author_name LIKE 'Jane%';
```

#### Verification of Dynamic Updates
Because standard views evaluate on-the-fly, updates to base tables are visible immediately:

```sql
INSERT INTO books VALUES (11, 1, 'Emma');

-- Querying the view now automatically shows the new row!
SELECT * FROM author_catalog;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing standard views cache query results to speed up database performance

**The mistake:** Creating a view over a slow, 5-table join query that takes 10 seconds to execute, expecting that querying the view will make the page load instantly.

**Why it's wrong:** Standard views are **virtual**. They do not store data or cache results on disk. 

When you query the view, Postgres merges the queries and executes the underlying 5-table join on-the-fly. 

If the underlying join takes 10 seconds, querying the view will still take 10 seconds.

**Fix: To cache query results physically on disk for high-speed reads, use a [Materialized View](materialized_view.md) instead of a standard view.**

---



### Mistake 2: Expecting Standard Views (`CREATE VIEW`) to Cache Computed Query Data on Disk

**The mistake:** Creating a complex 10-table `VIEW` expecting it to accelerate read performance.

**Why it's wrong:** Standard relational `VIEW`s store ONLY the SQL query text in system catalogs! Every time a `VIEW` is queried, PostgreSQL re-evaluates the entire underlying SQL statement. Use `MATERIALIZED VIEW` for cached disk storage.

*Incorrect:*
```sql
// Expecting CREATE VIEW to cache computed query data
```

*Fix:*
```sql
Use CREATE MATERIALIZED VIEW if cached disk data is required
```

### Mistake 3: Attempting to Execute Complex Multi-Table `UPDATE`s on Non-Updatable Views

**The mistake:** Executing `UPDATE my_aggregate_view SET total = 100;` on a view containing `GROUP BY`.

**Why it's wrong:** Views containing aggregations (`GROUP BY`), `DISTINCT`, or multiple table joins are not automatically updatable. Create `INSTEAD OF` triggers on the view.

*Incorrect:*
```sql
UPDATE view_with_group_by SET count = 5; -- ❌ Error: view is not updatable!
```

*Fix:*
```sql
Create INSTEAD OF UPDATE trigger on view to route updates to base tables
```

## 6. Practice Exercises

### Exercise 1: Safe User View

**Problem:** You have a `users` table containing columns `id`, `username`, `email`, `hashed_password`, and `is_active` (boolean). Write the SQL query to create a view named `active_users_public` that only exposes the `username` and `email` columns of users who are active (`is_active = TRUE`).

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE VIEW active_users_public AS
> SELECT username, email
> FROM users
> WHERE is_active = TRUE;
> ```
> - Specify only the non-sensitive columns in the `SELECT` list.
> - Apply the filter condition inside the `WHERE` clause of the view query.

---



### Exercise 2: Creating View for Active Users

**Problem:** Create view `active_users` selecting `id`, `name`, `email` from `users` where `active IS TRUE`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE VIEW active_users AS SELECT id, name, email FROM users WHERE active IS TRUE;
> ```
> ```sql
> CREATE VIEW active_users AS
> SELECT id, name, email FROM users WHERE active IS TRUE;
> ```
>
> **Explanation:** Relational views provide virtual query abstractions over base table schemas.

---

### Exercise 3: Creating View WITH CHECK OPTION

**Problem:** Create view `vip_customers` `WITH CHECK OPTION` enforcing `tier = 'vip'` on view insertions.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE VIEW vip_customers AS SELECT * FROM customers WHERE tier = 'vip' WITH CHECK OPTION;
> ```
> ```sql
> CREATE VIEW vip_customers AS
> SELECT * FROM customers WHERE tier = 'vip'
> WITH CHECK OPTION;
> ```
>
> **Explanation:** `WITH CHECK OPTION` prevents inserting rows through views that fail view `WHERE` predicates.

## 7. Related Terms
- [Materialized View](materialized_view.md) — The cached database view.
- [Common Table Expression (CTE / `WITH`)](cte.md) — Temporary query abstractions.
- [Row-Level Security (RLS)](../level_10/row_level_security.md) — Related concept: Row-Level Security (RLS).
---

## 8. Key Takeaways
- A View is a virtual table defined by a saved SQL query.
- Standard views do not store physical data; they evaluate on-the-fly.
- Simplifies complex joins, calculations, and aliases into reusable tables.
- Encapsulates schema changes, keeping application SQL queries dry.
- Acts as a security shield by masking sensitive columns from users.
- Does not cache results or improve query speed; use Materialized Views for performance.
