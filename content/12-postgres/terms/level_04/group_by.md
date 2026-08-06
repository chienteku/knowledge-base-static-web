# `GROUP BY`

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL query clause used to group rows sharing identical values in specified columns, allowing aggregate functions to compute summaries for each category.

---

## 1. Prerequisites
- [Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)](aggregate_functions.md) — The summaries calculated per group.

---

## 2. Term Category

**SQL Command / Clause** (Result Grouping Clause): `GROUP BY` collapses rows sharing the same values into summary group rows for aggregation.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DML** (Evaluated after `FROM` and `WHERE` filters. Postgres uses either Hash Aggregation (building a hash table in memory) or Group Aggregation (sorting data first) to build group categories).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Single Column Grouping with Aggregations

**Scenario:**
Group orders by `status` and calculate total order count and revenue per status.

**Requirements:**
1. Execute `SELECT status, COUNT(*), SUM(total_cents) FROM orders GROUP BY status`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   status, 
>   COUNT(*) AS order_count,
>   SUM(total_cents) / 100.0 AS total_revenue 
> FROM orders 
> GROUP BY status;
> ```
>
> #### Technical Explanation
>
> 1. `GROUP BY status` collapses all rows sharing the same status value into a single summary row.
> 2. Aggregate functions (`COUNT`, `SUM`) calculate metrics for each distinct group.
> 3. Un-aggregated columns in `SELECT` MUST appear in the `GROUP BY` clause.
> 
---

### Exercise 2: Multi-Column Hierarchical Grouping

**Scenario:**
Group sales by `year` and `category` to calculate yearly sales metrics per product category.

**Requirements:**
1. Execute `GROUP BY sales_year, category`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   EXTRACT(YEAR FROM o.created_at) AS sales_year,
>   p.category,
>   SUM(oi.unit_price_cents * oi.quantity) / 100.0 AS category_revenue 
> FROM orders AS o 
> JOIN order_items AS oi ON o.id = oi.order_id 
> JOIN products AS p ON oi.product_id = p.id 
> GROUP BY sales_year, p.category 
> ORDER BY sales_year DESC, category_revenue DESC;
> ```
>
> #### Technical Explanation
>
> 1. Multi-column `GROUP BY` creates aggregate groups for each unique COMBINATION of column values.
> 2. Produces multi-dimensional analytics reports.
> 3. Sorts groups using `ORDER BY`.
> 
---

### Exercise 3: Resolving SQL `must appear in the GROUP BY clause` Errors

**Scenario:**
Fix a invalid SQL query attempting to select `username` without including it in `GROUP BY`.

**Requirements:**
1. Explain rule requiring non-aggregated select columns to be included in `GROUP BY`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- ❌ Invalid Query (throws Error 42803)
> -- SELECT user_id, username, COUNT(*) FROM orders GROUP BY user_id;
> 
> -- ✅ Valid Query (includes username in GROUP BY or primary key functional dependency)
> SELECT user_id, username, COUNT(*) AS total_orders 
> FROM orders AS o 
> JOIN users AS u ON o.user_id = u.id 
> GROUP BY user_id, username;
> ```
>
> #### Technical Explanation
>
> 1. SQL standards require all non-aggregated `SELECT` columns to be specified in `GROUP BY`.
> 2. Prevents ambiguous row values when multiple rows in a group contain different column values.
> 3. Core SQL grouping rule.
> 
---



## 6. Related Terms
- [Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)](aggregate_functions.md) — The math engines inside groups.
- [`HAVING`](having.md) — Filtering grouped outputs.
- [`DISTINCT`](distinct.md) — Related concept: `DISTINCT`.

---

## 7. Key Takeaways
- `GROUP BY` partitions table rows into categories based on column values.
- Runs aggregate functions inside each group bucket independently.
- Every selected column must be aggregated or declared in the `GROUP BY` clause.
- You can group by multiple columns to create nested sub-categories.
- Speeds up category reporting by crunching values entirely on the database server.
