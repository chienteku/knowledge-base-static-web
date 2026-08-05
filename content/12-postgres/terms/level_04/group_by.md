# `GROUP BY`

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL query clause used to group rows sharing identical values in specified columns, allowing aggregate functions to compute summaries for each category.

---

## 1. Prerequisites
- [Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)](aggregate_functions.md) — The summaries calculated per group.
---

## 2. Term Category
- **SQL Query Clause**

---

## 3. Environment Context
- **PostgreSQL Core DML** (Evaluated after `FROM` and `WHERE` filters. Postgres uses either Hash Aggregation (building a hash table in memory) or Group Aggregation (sorting data first) to build group categories).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Aggregate functions calculate summaries across rows. 

If you want to find the average price of *all* products in your store, you write:
`SELECT AVG(price) FROM products;`

But what if you want to see the average price **for each category** of products (e.g. electronics, apparel, groceries)?

Without a grouping mechanism, you would have to write separate queries for every single category:
-   `SELECT AVG(price) FROM products WHERE category = 'Electronics';`
-   `SELECT AVG(price) FROM products WHERE category = 'Apparel';`

If your store adds a new category, your application code will break until you write a new query.

We designed the **`GROUP BY`** clause to solve this. 

It instructs the database engine to partition your table rows into separate buckets based on matching values in the specified columns. 

The database then runs the aggregate calculation inside each bucket separately, returning one summary row for each unique group.

---

### (2) The Golden Rule of Grouping
When writing queries with `GROUP BY`, you must obey a strict SQL parser rule:

**Every column in your `SELECT` list must either be wrapped in an aggregate function OR appear in the `GROUP BY` clause.**

If you violate this rule, Postgres will immediately crash your query.

---

### (3) Reality Metaphor
Imagine sorting post mail in an office mailroom:
-   You have a giant bag of incoming letters (the table rows).
-   Each letter is addressed to a specific department (the category column).
-   **Without Grouping:** You count the total envelopes (100).
-   **With Grouping (`GROUP BY department`):** You place separate mail bins on the table labeled `Sales`, `Engineering`, and `HR`. You sort every letter into its matching bin. You then count the envelopes in each bin separately. You report: *"Sales: 45 letters, Engineering: 35 letters, HR: 20 letters."*

---

### (4) Code Examples

#### Grouping by Category
```sql
CREATE TABLE inventory (
  id INT PRIMARY KEY,
  item_name VARCHAR(100),
  category VARCHAR(50),
  price NUMERIC(10,2)
);

-- Calculate average price per category
SELECT category, AVG(price) AS avg_price
FROM inventory
GROUP BY category;
```

#### Grouping by Multiple Columns
You can slice groups into nested sub-categories:

```sql
-- Count items grouped by category AND manufacturer
SELECT category, manufacturer, COUNT(*) AS items_count
FROM inventory
GROUP BY category, manufacturer;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving a selected attribute out of the GROUP BY clause

**The mistake:** Writing a query that selects `category`, `item_name`, and `AVG(price)` but only grouping by `category`:

```sql
-- BAD: This query crashes immediately!
SELECT category, item_name, AVG(price) 
FROM inventory 
GROUP BY category;
-- ERROR: column "inventory.item_name" must appear in the GROUP BY clause
```

**Why it's wrong:** The query engine groups rows by category, compressing all electronics into one summary row. However, `item_name` contains multiple different names (e.g. 'Keyboard', 'Mouse'). Postgres does not know which name to display next to the single average price, so it halts execution.

**Fix: Include `item_name` in the `GROUP BY` list (creating sub-groups for each product name), or wrap it in an aggregate function like `MIN(item_name)`.**

---



### Mistake 2: Selecting Non-Aggregated Columns Omitted from `GROUP BY` Clause

**The mistake:** Writing `SELECT category, name, AVG(price) FROM products GROUP BY category;`.

**Why it's wrong:** In standard SQL, every column in the `SELECT` list MUST be either included in the `GROUP BY` clause OR wrapped in an aggregate function (e.g. `AVG`, `MAX`). Selecting un-grouped `name` throws error `column "products.name" must appear in the GROUP BY clause`.

*Incorrect:*
```sql
SELECT category, name, AVG(price) FROM products GROUP BY category; -- ❌ Un-grouped column error!
```

*Fix:*
```sql
SELECT category, AVG(price) FROM products GROUP BY category;
```

### Mistake 3: Grouping by High-Cardinality Un-Indexed Primary Key Columns

**The mistake:** Executing `SELECT id, COUNT(*) FROM logs GROUP BY id;` on 10M rows.

**Why it's wrong:** Grouping by unique primary key IDs yields groups of size 1, consuming massive memory for `HashAggregate` without meaningful aggregation summary.

*Incorrect:*
```sql
SELECT id, COUNT(*) FROM logs GROUP BY id; -- ❌ 10M distinct groups!
```

*Fix:*
```sql
Group by category or dimensional status columns
```

## 6. Practice Exercises

### Exercise 1: Department Payroll Analysis

**Problem:** You have an `employees` table with columns `department`, `name`, and `salary`. Write a SQL query that returns the name of each `department` along with the sum of all salaries paid in that department. Label the sum as `total_payroll`.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT department, SUM(salary) AS total_payroll 
> FROM employees 
> GROUP BY department;
> ```
> - The output needs to show values per department; make `department` your grouping column.
> - Apply the `SUM()` aggregate to the salary column.

---



### Exercise 2: Multi-Column Grouping and Aggregation

**Problem:** Group sales by `year` and `region` selecting total sales `SUM(amount)` and count `COUNT(*)`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT year, region, SUM(amount) AS total_sales, COUNT(*) AS order_cnt FROM sales GROUP BY year, region;
> ```
> ```sql
> SELECT year, region, SUM(amount) AS total_sales, COUNT(*)
> FROM sales
> GROUP BY year, region;
> ```
>
> **Explanation:** `GROUP BY col1, col2` aggregates metrics across multi-dimensional group keys.

---

### Exercise 3: Grouping Expression Columns

**Problem:** Group users by signup year extracted using `EXTRACT(YEAR FROM created_at)`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT EXTRACT(YEAR FROM created_at)::INT AS signup_year, COUNT(*) FROM users GROUP BY EXTRACT(YEAR FROM created_at);
> ```
> ```sql
> SELECT EXTRACT(YEAR FROM created_at)::INT AS signup_year, COUNT(*)
> FROM users
> GROUP BY EXTRACT(YEAR FROM created_at);
> ```
>
> **Explanation:** Expressions used in `SELECT` must be specified identically in `GROUP BY`.

## 7. Related Terms
- [Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)](aggregate_functions.md) — The math engines inside groups.
- [`HAVING`](having.md) — Filtering grouped outputs.
- [`DISTINCT`](distinct.md) — Related concept: `DISTINCT`.
---

## 8. Key Takeaways
- `GROUP BY` partitions table rows into categories based on column values.
- Runs aggregate functions inside each group bucket independently.
- Every selected column must be aggregated or declared in the `GROUP BY` clause.
- You can group by multiple columns to create nested sub-categories.
- Speeds up category reporting by crunching values entirely on the database server.
