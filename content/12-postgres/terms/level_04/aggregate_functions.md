# Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> Built-in SQL functions that perform calculations across multiple rows of data and collapse them to return a single, summarized output value.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The baseline data retrieval statement.

---

## 2. Term Category
- **PostgreSQL Function**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL databases. Evaluated on-the-fly. Database engines scan index nodes or table heap blocks to accumulate calculations in-memory).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Sales Analysis

**Problem:** You have a table `sales_receipts` with columns `id`, `amount`, and `cashier_name`. Write a SQL query to calculate:
1.  The total number of sales transactions.
2.  The maximum transaction amount.
3.  The minimum transaction amount.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT 
>   COUNT(*) AS total_transactions,
>   MAX(amount) AS highest_sale,
>   MIN(amount) AS lowest_sale
> FROM sales_receipts;
> ```
> - Select the correct aggregate function names.
> - Map them to the target amount column and use aliases to make the output headers clean.

---



### Exercise 2: Calculating Group Averages with `AVG()`

**Problem:** Calculate average product price per `category` rounded to 2 decimal places using `ROUND(AVG(price), 2)`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT category, ROUND(AVG(price), 2) AS avg_price FROM products GROUP BY category;
> ```
> ```sql
> SELECT category, ROUND(AVG(price), 2) AS avg_price
> FROM products
> GROUP BY category;
> ```
>
> **Explanation:** `AVG()` accumulates average numeric values across grouped row sets.

---

### Exercise 3: Combining Aggregates with `FILTER` Clause

**Problem:** Count total active users vs inactive users in a single query using `COUNT(*) FILTER (WHERE active IS TRUE)`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT COUNT(*) FILTER (WHERE active IS TRUE) AS active_cnt, COUNT(*) FILTER (WHERE active IS FALSE) AS inactive_cnt FROM users;
> ```
> ```sql
> SELECT
>   COUNT(*) FILTER (WHERE active IS TRUE) AS active_cnt,
>   COUNT(*) FILTER (WHERE active IS FALSE) AS inactive_cnt
> FROM users;
> ```
>
> **Explanation:** `FILTER (WHERE ...)` applies conditional filtering directly to aggregate functions.

## 7. Related Terms
- [`SELECT`](../level_03/select.md) — The parent query command.
- [`NULL` Behavior in Expressions & Aggregates](null_in_aggregates.md) — How missing values affect summaries.
- [`GROUP BY`](group_by.md) — Slicing aggregates into categories.

---

## 8. Key Takeaways
- Aggregate functions perform math calculations across rows to return a single summary.
- Standard functions are `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX`.
- `COUNT(*)` counts all rows; `COUNT(column)` ignores `NULL` rows.
- They optimize network and memory footprint by calculating on the server.
- You cannot mix aggregates with regular columns unless you use `GROUP BY`.
