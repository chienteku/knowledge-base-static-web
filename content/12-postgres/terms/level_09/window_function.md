# Window Function

> **Level 9 — Views, Functions & Advanced SQL**
> The mathematical calculations (such as running sums, moving averages, rankings, or relative offsets) performed across a defined window of rows, returning a result for every row in the output.

---

## 1. Prerequisites
- [`OVER()` / `PARTITION BY` / `ORDER BY` (Window Clause)](window_clause.md) — The prerequisite window definition syntax.

---

## 2. Term Category
- **SQL Query Syntax**

---

## 3. Environment Context
- **Universal Standard** (Supported by all relational SQL engines. Processed after the `HAVING` clause, meaning they cannot be used directly inside `WHERE` or `HAVING` filters).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard SQL aggregation functions collapse your rows:
-   If you ask: *"What is the average salary in the company?"* using `AVG()`, you collapse the entire table into a single row containing a single number.
-   You lose the ability to see who earns that salary.

But what if you want to display a list of all employees, their salaries, and the average salary of their department **next to each name**, so you can calculate how far above or below average they are?

We designed **Window Functions** to solve this. 

By applying standard aggregates (like `SUM`, `AVG`, `COUNT`) or specialized functions (like `RANK` or `LAG`) over a Window Clause, you perform group-like calculations while keeping every row separate on screen.

---

### (2) Aggregates as Window Functions
Any standard aggregate function can be converted into a window function simply by appending the `OVER()` clause to it:

-   `AVG(salary)` $\rightarrow$ Collapses table.
-   `AVG(salary) OVER()` $\rightarrow$ Appends the average salary of the entire table next to every row.
-   `AVG(salary) OVER(PARTITION BY department)` $\rightarrow$ Appends the department's average salary next to every row.

---

### (3) Reality Metaphor (Marathon Stats)
Imagine compiling statistics for a marathon race:
-   **Standard Aggregate (`GROUP BY`):** A summary card displaying: *"Average pace of all runners: 8 mins/mile."* (You only see one summary row; individual runner names are lost).
-   **Window Function:** A complete leaderboard listing every runner's name, their personal finishing times, and a column showing the average pace of runners in their specific age category (e.g. `AVG(pace) OVER (PARTITION BY age_group)`). You see every runner, but with group context on the side.

---

### (4) Code Examples

#### Calculating Department Averages
Let's see how to check who earns above their department average:

```sql
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  dept VARCHAR(50),
  salary INT
);

INSERT INTO employees VALUES
  (1, 'Alice',   'Engineering', 90000),
  (2, 'Bob',     'Engineering', 80000),
  (3, 'Charlie', 'Sales',       70000),
  (4, 'David',   'Sales',       50000);

SELECT 
  name,
  dept,
  salary,
  -- Attach the department average to each row
  AVG(salary) OVER (PARTITION BY dept) AS dept_avg,
  -- Calculate the difference directly
  salary - AVG(salary) OVER (PARTITION BY dept) AS diff_from_avg
FROM employees;
```

**Output:**
| name | dept | salary | dept_avg | diff_from_avg |
| :--- | :--- | :--- | :--- | :--- |
| Alice | Engineering | 90000 | **85000** | **+5000** |
| Bob | Engineering | 80000 | **85000** | **-5000** |
| Charlie | Sales | 70000 | **60000** | **+10000** |
| David | Sales | 50000 | **60000** | **-10000** |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to filter window function results inside the query's WHERE clause

**The mistake:** Writing a query to find employees earning above average, by placing the window function directly in the `WHERE` clause:

```sql
-- BAD: Fails with a syntax error!
SELECT name, salary
FROM employees
WHERE salary > AVG(salary) OVER(PARTITION BY dept);
-- ERROR: window functions are not allowed in WHERE
```

**Why it's wrong:** The SQL execution order matters. The database runs the `WHERE` clause first to filter rows, and only calculates window functions *after* filtering. Because window functions haven't been calculated yet when `WHERE` runs, Postgres throws a syntax error.

**Fix: Wrap the window function query inside a [Common Table Expression (CTE)](cte.md) or subquery first, and then filter by the computed column in the outer query.**

```sql
-- CORRECT (Using CTE)
WITH salary_report AS (
  SELECT name, salary,
         AVG(salary) OVER (PARTITION BY dept) AS dept_avg
  FROM employees
)
SELECT name, salary, dept_avg
FROM salary_report
WHERE salary > dept_avg; -- Works!
```

---



### Mistake 2: Attempting to Reference Window Functions directly in `WHERE` Clauses

**The mistake:** Writing `SELECT name FROM users WHERE ROW_NUMBER() OVER (ORDER BY points DESC) <= 5;`.

**Why it's wrong:** Window functions execute AFTER `WHERE` filtering in SQL query execution order! Filtering window results requires wrapping the query in a CTE or Subquery.

*Incorrect:*
```sql
SELECT name FROM users WHERE ROW_NUMBER() OVER (ORDER BY points DESC) <= 5; -- ❌ Error!
```

*Fix:*
```sql
WITH ranked AS (SELECT name, ROW_NUMBER() OVER (ORDER BY points DESC) AS rn FROM users) SELECT name FROM ranked WHERE rn <= 5;
```

### Mistake 3: Confusing Window Function Processing with `GROUP BY` Row Collapsing

**The mistake:** Expecting window functions like `SUM(amount) OVER (PARTITION BY user_id)` to collapse rows.

**Why it's wrong:** `GROUP BY` collapses output rows into a single summary row per group. Window functions calculate summary metrics while PRESERVING individual row identity.

*Incorrect:*
```sql
// Expecting OVER (PARTITION BY user_id) to return 1 row per user
```

*Fix:*
```sql
Use GROUP BY if collapsing rows is desired; use OVER (PARTITION BY) to retain individual rows
```

## 6. Practice Exercises

### Exercise 1: Cumulative Sales Percentage

**Problem:** You have a `sales` table (columns: `id`, `amount`). Write the SQL query to select:
1.  Every sale amount.
2.  The total sum of all sales in the table, displayed next to every row (use the alias `grand_total`).

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT 
>   amount,
>   SUM(amount) OVER() AS grand_total
> FROM sales;
> ```
> - Run the `SUM` aggregate function as a window function.
> - Since we want the total for the entire table, leave the `OVER()` clause empty.

---



### Exercise 2: Calculating Running Total with Window Function

**Problem:** Calculate running total of `amount` ordered by `created_at` using `SUM(amount) OVER (ORDER BY created_at ASC)`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT created_at, amount, SUM(amount) OVER (ORDER BY created_at ASC) AS running_total FROM transactions;
> ```
> ```sql
> SELECT created_at, amount,
>   SUM(amount) OVER (ORDER BY created_at ASC) AS running_total
> FROM transactions;
> ```
>
> **Explanation:** `SUM(col) OVER (ORDER BY ...)` calculates cumulative running totals.

---

### Exercise 3: Window Frame Specification (ROWS BETWEEN)

**Problem:** Specify 3-row moving average window frame: `ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING`.

**Expected output:**
> [!check]- Answer
> ```text
> AVG(price) OVER (ORDER BY date ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING)
> ```
> ```sql
> SELECT date, price,
>   AVG(price) OVER (ORDER BY date ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS moving_avg
> FROM daily_prices;
> ```
>
> **Explanation:** Window frame clauses (`ROWS BETWEEN ...`) restrict calculation bounds around target rows.

## 7. Related Terms
- [`OVER()` / `PARTITION BY` / `ORDER BY` (Window Clause)](window_clause.md) — The parent window definition syntax.
- [`ROW_NUMBER()` / `RANK()` / `DENSE_RANK()`](row_number_rank.md) — Positional window functions.
- [`LAG()` / `LEAD()`](lag_lead.md) — Related concept: `LAG()` / `LEAD()`.

---

## 8. Key Takeaways
- Window functions perform calculations across rows while preserving individual row detail.
- Returns a calculated result value for every row in the output set.
- Converts standard aggregates (`SUM`, `AVG`, `COUNT`) into windows using `OVER()`.
- Processed late in SQL execution, after `WHERE` and `GROUP BY` have completed.
- Cannot be used directly in `WHERE` filters; wrap in CTEs to filter results.
- Essential for computing comparative metrics (like differences from averages).
