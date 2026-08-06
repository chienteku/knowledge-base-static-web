# Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> Built-in SQL functions that perform calculations across multiple rows of data and collapse them to return a single, summarized output value.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The baseline data retrieval statement.

---

## 2. Term Category

**SQL Command / Clause** (Aggregation Functions): Aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) compute a single summary value over a set of input rows.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all SQL databases. Evaluated on-the-fly. Database engines scan index nodes or table heap blocks to accumulate calculations in-memory).

### (1) Design Motivation — "Why did we design this?"
In high-volume applications, you often need metadata summaries:
-   How many users registered today?
-   What was our total sales revenue this month?
-   What is the lowest price in our catalog?

If you have 10 million rows, you cannot run `SELECT price FROM sales;` and calculate the sum using a loop in JavaScript. 

Transferring millions of floats over the network would freeze your application and consume massive bandwidth.

We designed **Aggregate Functions** to perform calculations directly on the database server. 

The server processes the calculations on disk streams, collapses the rows, and returns a single, lightweight number (the summary) back to your application.

---

### (2) The Five Core Aggregates

1.  **`COUNT()`**: Counts the number of matching rows.
    -   `COUNT(*)`: Counts every row in the query target.
    -   `COUNT(column)`: Counts only rows where the specified column is **not null**.
2.  **`SUM()`**: Adds up all values in a numeric column.
3.  **`AVG()`**: Calculates the arithmetic mean of a numeric column.
4.  **`MIN()`**: Finds the smallest value (works on numbers, dates, and strings alphabetically).
5.  **`MAX()`**: Finds the largest value.

---

### (3) Reality Metaphor
Imagine a classroom of 30 students:
-   **Standard Query (`SELECT`):** Asking every student to stand up, say their age, and sit down. You write down 30 different numbers.
-   **Aggregate Query (`AVG`):** Asking the class monitor to sum everyone's age, divide by 30, and announce only the final result: *"The average age in this class is 12."* 

You do not hear from the individual students; you only receive the single, final summary number.

---

### (4) Code Examples

#### Calculating Catalog Summaries
```sql
CREATE TABLE product_catalog (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  price NUMERIC(10,2)
);

-- Query the aggregate stats of the entire store
SELECT 
  COUNT(*) AS total_items,
  SUM(price) AS inventory_value,
  AVG(price) AS average_price,
  MIN(price) AS cheapest_item,
  MAX(price) AS most_expensive
FROM product_catalog;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mixing aggregated and non-aggregated columns without a GROUP BY clause

**The mistake:** Trying to select individual column attributes next to an aggregate summary in a single query:

```sql
-- BAD: This query crashes immediately!
SELECT name, AVG(price) 
FROM product_catalog;
-- ERROR: column "product_catalog.name" must appear in the GROUP BY clause or be used in an aggregate function
```

**Why it's wrong:** An aggregate function collapses all rows into **one single row** containing the summary value. However, the `name` column contains multiple individual row strings. The database engine does not know how to pair a single average price box with 10,000 separate name blocks on screen.

**Fix: Do not mix single-row aggregates with multi-row attributes unless you use a `GROUP BY` clause to group them logically.**

---



### Mistake 2: Using Aggregate Functions Directly inside `WHERE` Clauses

**The mistake:** Writing `SELECT category FROM products WHERE COUNT(*) > 10 GROUP BY category;`.

**Why it's wrong:** Aggregate functions (`SUM`, `COUNT`, `AVG`) evaluate across row groups AFTER `WHERE` clause execution. Use the `HAVING` clause to filter aggregated groups.

*Incorrect:*
```sql
SELECT category FROM products WHERE COUNT(*) > 10 GROUP BY category; -- ❌ Error: aggregate in WHERE!
```

*Fix:*
```sql
SELECT category FROM products GROUP BY category HAVING COUNT(*) > 10;
```

### Mistake 3: Expecting `COUNT(column)` to Count Rows Containing NULL Values

**The mistake:** Calling `COUNT(phone)` expecting it to equal total row count when `phone` contains NULLs.

**Why it's wrong:** `COUNT(column)` counts ONLY non-null values! To count total rows regardless of nulls, use `COUNT(*)`.

*Incorrect:*
```sql
SELECT COUNT(phone) FROM users; -- Ignores rows where phone IS NULL
```

*Fix:*
```sql
SELECT COUNT(*) FROM users; -- Counts total rows including NULLs
```

## 5. Practice Exercises

### Exercise 1: Summarizing Metrics with Aggregate Functions

**Scenario:**
Calculate total sales revenue, average price, total order count, and highest single sale from `orders`.

**Requirements:**
1. Execute `SELECT COUNT(*), SUM(total_cents), AVG(total_cents), MAX(total_cents) FROM orders`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   COUNT(*) AS total_orders,
>   SUM(total_cents) / 100.0 AS total_revenue_dollars,
>   ROUND(AVG(total_cents) / 100.0, 2) AS avg_order_dollars,
>   MAX(total_cents) / 100.0 AS max_order_dollars 
> FROM orders;
> ```
>
> #### Technical Explanation
>
> 1. `COUNT(*)` counts total matching rows.
> 2. `SUM()` and `AVG()` aggregate numeric totals and averages.
> 3. `MAX()` finds the highest numeric value in the column.
> 
---

### Exercise 2: Counting Distinct Column Values

**Scenario:**
Count unique customers who placed orders in 2026 using `COUNT(DISTINCT customer_id)`.

**Requirements:**
1. Execute `SELECT COUNT(DISTINCT customer_id) FROM orders WHERE created_at >= '2026-01-01'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   COUNT(DISTINCT customer_id) AS unique_active_customers 
> FROM orders 
> WHERE created_at >= '2026-01-01';
> ```
>
> #### Technical Explanation
>
> 1. `COUNT(DISTINCT col)` deduplicates column values before counting.
> 2. Ignores `NULL` values.
> 3. Accurate metric calculation for distinct user counts.
> 
---

### Exercise 3: Aggregating Arrays with `ARRAY_AGG`

**Scenario:**
Aggregate user tags into an array per user using `ARRAY_AGG(tag_name)`.

**Requirements:**
1. Execute `SELECT user_id, ARRAY_AGG(tag_name) FROM user_tags GROUP BY user_id`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   user_id, 
>   ARRAY_AGG(tag_name ORDER BY tag_name ASC) AS user_tag_list 
> FROM user_tags 
> GROUP BY user_id;
> ```
>
> #### Technical Explanation
>
> 1. `ARRAY_AGG()` compiles multiple row string values into a PostgreSQL array (`TEXT[]`).
> 2. `ORDER BY tag_name` inside `ARRAY_AGG()` sorts elements within the array.
> 3. Powerful PostgreSQL aggregate array construction.
> 
---



## 6. Related Terms
- [`SELECT`](../level_03/select.md) — The parent query command.
- [`NULL` Behavior in Expressions & Aggregates](null_in_aggregates.md) — How missing values affect summaries.
- [`GROUP BY`](group_by.md) — Slicing aggregates into categories.

---

## 7. Key Takeaways
- Aggregate functions perform math calculations across rows to return a single summary.
- Standard functions are `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX`.
- `COUNT(*)` counts all rows; `COUNT(column)` ignores `NULL` rows.
- They optimize network and memory footprint by calculating on the server.
- You cannot mix aggregates with regular columns unless you use `GROUP BY`.
