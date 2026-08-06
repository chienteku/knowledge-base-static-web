# `SELECT`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The fundamental SQL DML command used to query and retrieve data rows from one or more database tables.

---

## 1. Prerequisites
- [Relational Database](../level_01/relational_database.md) — The storage philosophy.
- [SQL (Structured Query Language)](../level_01/sql.md) — Declarative query syntax standards.

---

## 2. Term Category

**SQL Command / Clause** (Data Query Statement): `SELECT` retrieves data rows from one or more database tables.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DML** (The most frequently executed SQL statement. Generates read-only locks, allowing multiple clients to run selections concurrently without blocking writes).

### (1) Design Motivation — "Why did we design this?"
Writing data into a database is only half the battle. The ultimate value of any database lies in your ability to search, filter, and retrieve that data later.

In software applications, **reading** data is by far the most common operation:
-   Loading a list of products on an e-commerce page.
-   Displaying a user's profile dashboard.
-   Rendering historical analytical charts.

The **`SELECT`** statement is the entry point for all read operations. 

It is declarative: you specify which columns you want to see (e.g. `SELECT name, price`) and which table to read from (e.g. `FROM products`). 

The database engine parses the request, locates the physical rows on disk, extracts only the requested columns, and formats the output into a grid structure.

---

### (2) Selecting Expressions without Tables
In PostgreSQL, `SELECT` is highly flexible. Unlike some databases that force you to name a dummy table, Postgres allows you to use `SELECT` to evaluate math, system variables, or run functions directly:

```sql
SELECT 5 + 10;
-- Returns 15

SELECT NOW();
-- Returns the current timestamp
```

---

### (3) Reality Metaphor
Imagine a massive library archives:
-   The library contains a card index drawer labeled `Books`.
-   You do not need to read every page of every book in the building.
-   You write a slip saying: *"Show me the **Title** and **Author** of all records inside the **Books** drawer."*
-   The archivist fetches the drawer, reads the cards, and hands you a clean list containing only those two details.

---

### (4) Code Examples

#### Querying Specific Columns
```sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  category VARCHAR(50),
  price NUMERIC(10,2)
);

-- Select only the name and price columns
SELECT name, price 
FROM products;
```

#### Renaming Output Columns (Aliases)
You can rename output columns on-the-fly using the `AS` keyword to make results match your application's variable names:

```sql
SELECT name AS product_name, price AS cost 
FROM products;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Swapping the SELECT and FROM clauses sequence

**The mistake:** Writing queries by stating the source table first:

```sql
-- BAD: This is a syntax error!
FROM products SELECT name, price;
```

**Why it's wrong:** While human brains think "look in products, then get name and price," SQL parser grammar dictates that the projection list (`SELECT`) must always precede the source list (`FROM`). 

**Fix: Always start your query with `SELECT [columns]` followed by `FROM [table]`.**

---



### Mistake 2: Using `SELECT *` in Production Microservices and High-Throughput APIs

**The mistake:** Executing `SELECT * FROM users;` when only `id` and `email` are needed.

**Why it's wrong:** `SELECT *` fetches un-needed columns (like large binary buffers or text fields), increasing network payload size and disabling covered index scans. Explicitly list required columns.

*Incorrect:*
```sql
SELECT * FROM users; -- Wastes network bandwidth fetching all columns
```

*Fix:*
```sql
SELECT id, email FROM users; -- Explicit column selection
```

### Mistake 3: Writing Complex Expressions in `SELECT` Without Aliases (`AS`)

**The mistake:** Executing `SELECT first_name || ' ' || last_name FROM users;` without column aliases.

**Why it's wrong:** Un-aliased expressions return auto-generated column names like `?column?`, complicating client driver field access. Add explicit aliases `AS full_name`.

*Incorrect:*
```sql
SELECT first_name || ' ' || last_name FROM users; -- Column name is ?column?
```

*Fix:*
```sql
SELECT first_name || ' ' || last_name AS full_name FROM users;
```

## 5. Practice Exercises

### Exercise 1: Basic Column Projection and Filtering

**Scenario:**
Query `users` table returning `username` and `email` for active users.

**Requirements:**
1. Execute `SELECT username, email FROM users WHERE is_active = TRUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT username, email 
> FROM users 
> WHERE is_active = TRUE;
> ```
>
> #### Technical Explanation
>
> 1. `SELECT` specifies output column projections.
> 2. `FROM` identifies source table.
> 3. `WHERE` filters row results.
> 
---

### Exercise 2: Aliasing Column Names in Select Projections

**Scenario:**
Select `price_cents` divided by 100.0, aliasing output column as `price_dollars`.

**Requirements:**
1. Use `price_cents / 100.0 AS price_dollars`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   name, 
>   price_cents / 100.0 AS price_dollars 
> FROM products;
> ```
>
> #### Technical Explanation
>
> 1. `AS alias_name` renames output columns in returned query result sets.
> 2. Formats calculated expressions cleanly.
> 3. Developer ergonomics.
> 
---

### Exercise 3: Deduplicating Result Rows with `DISTINCT`

**Scenario:**
Select all unique customer states from `addresses` table using `DISTINCT`.

**Requirements:**
1. Execute `SELECT DISTINCT state FROM addresses`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT DISTINCT state 
> FROM addresses 
> WHERE state IS NOT NULL 
> ORDER BY state ASC;
> ```
>
> #### Technical Explanation
>
> 1. `DISTINCT` eliminates duplicate rows from the query output.
> 2. Sorts or hashes rows in memory to find unique values.
> 3. Returns unique state lists.
> 
---



## 6. Related Terms
- [`SELECT *` vs. Column List](select_star_vs_columns.md) — Sizing selection scopes.
- [`WHERE` Clause](where.md) — Filtering query results.
- [Multi-row `INSERT` / `INSERT ... SELECT`](multi_row_insert.md) — Related concept: Multi-row `INSERT` / `INSERT ... SELECT`.
- [`ORDER BY`](order_by.md) — Related concept: `ORDER BY`.
- [Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)](../level_04/aggregate_functions.md) — Related concept: Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`).
- [Aliases (`AS`)](../level_04/aliases.md) — Related concept: Aliases (`AS`).
- [`CASE` Expression](../level_04/case_expression.md) — Related concept: `CASE` Expression.
- [`DISTINCT`](../level_04/distinct.md) — Related concept: `DISTINCT`.
- [Subquery (Nested Query)](../level_04/subquery.md) — Related concept: Subquery (Nested Query).
- [`UNION` / `UNION ALL` / `INTERSECT` / `EXCEPT`](../level_09/set_operations.md) — Related concept: `UNION` / `UNION ALL` / `INTERSECT` / `EXCEPT`.

---

## 7. Key Takeaways
- `SELECT` is the primary SQL command used to retrieve data rows.
- Basic syntax structure: `SELECT columns FROM table;`.
- Use the `AS` keyword to rename output columns dynamically.
- Postgres can evaluate functions and math inside `SELECT` without a `FROM` clause.
- Query projection lists must always precede the `FROM` table clause.
