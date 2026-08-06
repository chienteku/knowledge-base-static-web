# View

> **Level 9 — Views, Functions & Advanced SQL**
> A virtual, logical table defined by a saved SQL `SELECT` query that does not store physical data itself but allows developers to query it as if it were a standard table.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The query statement saved inside the view.
- [Table (Relation)](../level_01/table.md) — The underlying base tables.

---

## 2. Term Category

**Advanced Feature** (Virtual Projection Views): Views (`CREATE VIEW`) encapsulate reusable SQL queries as virtual read-only tables computed dynamically upon execution.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported by all relational SQL engines. Standard views are evaluated dynamically at execution time by merging the view's query with the parent query).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Creating Reusable Virtual Views with `CREATE VIEW`

**Scenario:**
Create a virtual view `v_active_users` projecting non-sensitive fields for active users (`is_active = TRUE`).

**Requirements:**
1. Execute `CREATE VIEW v_active_users AS SELECT id, username, email FROM users WHERE is_active = TRUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE VIEW v_active_users AS 
> SELECT 
>   id, 
>   username, 
>   email, 
>   created_at 
> FROM users 
> WHERE is_active = TRUE;
> 
> SELECT * FROM v_active_users WHERE email LIKE '%@example.com';
> ```
>
> #### Technical Explanation
>
> 1. `CREATE VIEW` saves a named SQL query definition in the system catalog.
> 2. Queries against views execute the underlying query dynamically on the fly.
> 3. Encapsulates row filtering and hides sensitive columns (`password_hash`).
> 
---

### Exercise 2: Creating Multi-Table Abstraction Views

**Scenario:**
Create a view `v_order_summaries` joining `orders`, `customers`, and `order_items`.

**Requirements:**
1. Code multi-table join view.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE VIEW v_order_summaries AS 
> SELECT 
>   o.id AS order_id, 
>   c.company_name AS customer_name, 
>   o.total_cents / 100.0 AS total_dollars, 
>   o.created_at 
> FROM orders AS o 
> JOIN customers AS c ON o.customer_id = c.id;
> ```
>
> #### Technical Explanation
>
> 1. Simplifies complex multi-table join syntax for application developers.
> 2. Provides a clean relational interface layer for backend APIs.
> 3. Virtual projection encapsulation.
> 
---

### Exercise 3: Updatable Views with `WITH CHECK OPTION`

**Scenario:**
Create an updatable view `v_pending_orders` with `WITH CHECK OPTION` to ensure updates maintain `status = 'pending'`.

**Requirements:**
1. Create view with `WITH CHECK OPTION`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE VIEW v_pending_orders AS 
> SELECT id, customer_id, status, total_cents 
> FROM orders 
> WHERE status = 'pending' 
> WITH CHECK OPTION;
> ```
>
> #### Technical Explanation
>
> 1. Simple 1-to-1 views without aggregations support direct `UPDATE` and `INSERT` commands.
> 2. `WITH CHECK OPTION` rejects inserts or updates through the view that would cause the row to disappear from the view's filter condition.
> 3. Hardens updatable view integrity.
> 
---



## 6. Related Terms
- [Materialized View](materialized_view.md) — The cached database view.
- [Common Table Expression (CTE / `WITH`)](cte.md) — Temporary query abstractions.
- [Row-Level Security (RLS)](../level_10/row_level_security.md) — Related concept: Row-Level Security (RLS).

---

## 7. Key Takeaways
- A View is a virtual table defined by a saved SQL query.
- Standard views do not store physical data; they evaluate on-the-fly.
- Simplifies complex joins, calculations, and aliases into reusable tables.
- Encapsulates schema changes, keeping application SQL queries dry.
- Acts as a security shield by masking sensitive columns from users.
- Does not cache results or improve query speed; use Materialized Views for performance.
