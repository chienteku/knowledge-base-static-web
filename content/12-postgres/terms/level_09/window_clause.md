# `OVER()` / `PARTITION BY` / `ORDER BY` (Window Clause)

> **Level 9 — Views, Functions & Advanced SQL**
> The SQL syntax used to define a "window" of rows (partitions, ordering, and boundaries) that a window function operates on relative to the current query row.

---

## 1. Prerequisites
- [`ORDER BY`](../level_03/order_by.md) — Sorting sequence inside windows.
- [`GROUP BY`](../level_04/group_by.md) — Understanding grouping boundaries.

---

## 2. Term Category

**Advanced Feature** (Window Specification Definition): The `WINDOW` clause defines reusable named window specifications (`WINDOW w AS (PARTITION BY ... ORDER BY ...)`) for multiple window functions.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all modern SQL engines. Evaluated late in the query execution pipeline, after `WHERE`, `GROUP BY`, and `HAVING` filters have processed).

### (1) Design Motivation — "Why did we design this?"
Before you can run advanced analytical calculations (like calculating a cumulative running total of bank deposits, or ranking products inside their category):
-   You cannot use standard `GROUP BY`. Grouping collapses your rows, which means you lose the details of individual deposits.
-   You need a way to keep every row separate on screen, but define a "sliding bracket" (a window) of rows to calculate averages or ranks across.

We designed the **Window Clause** syntax, powered by the **`OVER()`** keyword, to define these brackets.

---

### (2) The Window Clause Breakdown

#### 1. `OVER()` (Activate Window)
The trigger keyword. 

It instructs the SQL parser: *"Run the preceding calculation across a window of rows, but do not collapse the rows into a group."*

#### 2. `PARTITION BY` (Window Groups)
Divides the query result set into partitions (categories). 

The window calculation runs independently inside each partition, resetting to zero when a new category starts. 

If omitted, the entire table is treated as one large partition.

#### 3. `ORDER BY` (Window Sorting & Frames)
Defines the sorting order of rows inside each partition. 

*Critical Rule:* **If `ORDER BY` is present inside `OVER()`, it implicitly defines a "sliding frame" starting from the beginning of the partition up to the current row.** This enables cumulative running totals.

---

### (3) The `WINDOW` Alias (Dry Code)
If you reuse the same window definition across multiple columns in a `SELECT` statement, your code becomes repetitive:
`SUM(x) OVER (PARTITION BY y ORDER BY z), AVG(x) OVER (PARTITION BY y ORDER BY z)`

You can define the window once at the bottom of your query using the **`WINDOW`** keyword:

```sql
SELECT SUM(x) OVER w, AVG(x) OVER w 
FROM t 
WINDOW w AS (PARTITION BY y ORDER BY z);
```

---

### (4) Reality Metaphor
Imagine a long film strip (the query output rows):
-   **`PARTITION BY`** is like cutting the film strip into separate scenes (e.g. Action scenes, Comedy scenes).
-   **`ORDER BY`** is like sorting the frames inside each scene chronologically.
-   **`OVER()`** is like sliding a small physical **Picture Frame** (the window) along the film strip. 
-   As you look at each individual frame, you look through the window at its surrounding frames to calculate some statistic (like average brightness), but you never cut or damage the film strip.

---

### (5) Code Examples

#### Window Clause in Action (Running Total)
Let's see how `PARTITION BY` and `ORDER BY` behave together:

```sql
CREATE TABLE sales (
  employee VARCHAR(50),
  sale_date DATE,
  amount NUMERIC(10,2)
);

INSERT INTO sales VALUES 
  ('Alice', '2026-01-01', 100.00),
  ('Alice', '2026-01-02', 150.00),
  ('Bob',   '2026-01-01', 200.00);

SELECT 
  employee,
  sale_date,
  amount,
  -- Define the running total window
  SUM(amount) OVER (
    PARTITION BY employee 
    ORDER BY sale_date
  ) AS running_total
FROM sales;
```

**Output:**
| employee | sale_date | amount | running_total |
| :--- | :--- | :--- | :--- |
| Alice | 2026-01-01 | 100.00 | **100.00** |
| Alice | 2026-01-02 | 150.00 | **250.00** (100 + 150) |
| Bob | 2026-01-01 | 200.00 | **200.00** (Reset for new employee!) |

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing PARTITION BY with GROUP BY

**The mistake:** Writing `PARTITION BY` and expecting the query to collapse 10 matching rows into 1 single category row.

**Why it's wrong:** `GROUP BY` collapses rows (losing row detail). `PARTITION BY` never collapses rows. If your table has 1 million rows, a window query will output exactly 1 million rows. It only computes partition calculations *on the side* of each row.

**Fix: If you want to list every individual transaction on screen alongside its category running average, use `PARTITION BY`. If you only want to see a summary list of category totals, use `GROUP BY`.**

---



### Mistake 2: Repeating Identical `OVER (...)` Specifications Across Multiple Window Functions

**The mistake:** Writing `SELECT ROW_NUMBER() OVER (PARTITION BY region ORDER BY total DESC), SUM(total) OVER (PARTITION BY region ORDER BY total DESC) FROM sales;`.

**Why it's wrong:** Repeating identical `OVER (...)` clauses duplicates code. Use named `WINDOW` clauses (`WINDOW w AS (PARTITION BY region ORDER BY total DESC)`).

*Incorrect:*
```sql
SELECT ROW_NUMBER() OVER (PARTITION BY r ORDER BY t DESC), AVG(t) OVER (PARTITION BY r ORDER BY t DESC) FROM s;
```

*Fix:*
```sql
SELECT ROW_NUMBER() OVER w, AVG(t) OVER w FROM s WINDOW w AS (PARTITION BY r ORDER BY t DESC);
```

### Mistake 3: Placing `WINDOW` Clause Specifications in Wrong SQL Query Order

**The mistake:** Placing `WINDOW` clause before `GROUP BY` or `HAVING`.

**Why it's wrong:** In SQL syntax order, `WINDOW` clauses MUST be placed immediately after `HAVING` (or `WHERE` if no `GROUP BY`) and before `ORDER BY`.

*Incorrect:*
```sql
// Placing WINDOW clause before GROUP BY
```

*Fix:*
```sql
SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... WINDOW w AS (...) ORDER BY ...
```

## 5. Practice Exercises

### Exercise 1: Defining Reusable Named Windows with the `WINDOW` Clause

**Scenario:**
Refactor a query using multiple window functions over the exact same window specification using a named `WINDOW` clause.

**Requirements:**
1. Use `WINDOW w AS (PARTITION BY department_id ORDER BY salary DESC)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   name, 
>   department_id, 
>   salary, 
>   ROW_NUMBER() OVER w AS row_num,
>   RANK() OVER w AS rank_num,
>   AVG(salary) OVER w AS dept_avg 
> FROM employees 
> WINDOW w AS (PARTITION BY department_id ORDER BY salary DESC);
> ```
>
> #### Technical Explanation
>
> 1. The `WINDOW` clause defines a reusable named window specification at the end of the query.
> 2. Eliminates repeating identical `OVER (PARTITION BY ... ORDER BY ...)` clauses across multiple window functions.
> 3. Improves query readability and maintainability.

---

### Exercise 2: Extending Named Windows with Additional Ordering

**Scenario:**
Extend a base named window specification inside individual `OVER` clauses.

**Requirements:**
1. Code named window extension `OVER (w ORDER BY created_at DESC)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   customer_id, 
>   total_cents, 
>   created_at, 
>   ROW_NUMBER() OVER (w ORDER BY created_at DESC) AS seq_num 
> FROM orders 
> WINDOW w AS (PARTITION BY customer_id);
> ```
>
> #### Technical Explanation
>
> 1. Named windows defined in `WINDOW` can specify base partitioning (`PARTITION BY customer_id`).
> 2. Individual `OVER (w ORDER BY ...)` clauses extend the base window by adding specific sort ordering rules.
> 3. Reusable SQL window architecture.

---

### Exercise 3: Performance Optimization of Named Windows

**Scenario:**
Explain why using a single `WINDOW` specification reduces sorting passes compared to multiple distinct window definitions.

**Requirements:**
1. Contrast window sort execution passes in `EXPLAIN ANALYZE`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Named Window Performance Analysis:
> - Multiple different window definitions require PostgreSQL to perform separate sort passes for each distinct OVER clause.
> - Reusing a single named WINDOW specification allows the query planner to sort the input dataset ONCE in RAM.
> Result: Significantly reduced execution time and RAM consumption.
> ```
>
> #### Technical Explanation
>
> 1. The query planner sorts partition data for each unique window ordering rule.
> 2. Consolidating window definitions into a single `WINDOW` clause minimizes sort buffer operations.
> 3. High performance window query pattern.

---



## 6. Related Terms
- [Window Function](window_function.md) — The calculations applied.
- [`ROW_NUMBER()` / `RANK()` / `DENSE_RANK()`](row_number_rank.md) — Window position calculations.

---

## 7. Key Takeaways
- The Window Clause defines the subset of rows a window function calculates across.
- Activated using the `OVER()` keyword.
- Keeps row details intact; never collapses rows like `GROUP BY`.
- `PARTITION BY` groups calculation scopes (resets on category shifts).
- `ORDER BY` defines sorting and implicitly creates a running cumulative frame.
- Use `WINDOW w AS (...)` at the bottom of queries to keep repetitive windows DRY.
