# `LAG()` / `LEAD()`

> **Level 9 — Views, Functions & Advanced SQL**
> The SQL window offset functions used to access data from a previous row (`LAG`) or a subsequent row (`LEAD`) within the same partition, without running self-joins.

---

## 1. Prerequisites
- [Window Function](window_function.md) — The parent calculation engine.

---

## 2. Term Category

**Advanced Feature** (Window Positional Navigation Functions): `LAG()` and `LEAD()` window functions access column values from preceding or following rows relative to the current row without issuing self-joins.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all modern SQL engines. Highly optimized for sequential timeseries scans).

### (1) Design Motivation — "Why did we design this?"
In data analytics, you frequently need to compare current values against past or future trends:
-   Compare this month's revenue against **last month's** revenue to calculate growth percentage.
-   Calculate the time elapsed between a user's login click and their next logout click.

Without offset functions, you would have to write complex self-joins joining a table on itself using date math (e.g., `JOIN t ON t1.month = t2.month - 1`). 

This is slow and prone to errors if months are missing.

We designed **`LAG()`** and **`LEAD()`** to solve this. 

They act as row pointers that let you reach back or forward to read values from neighboring rows in memory, making trend comparisons fast and simple.

---

### (2) Function Parameters
Both functions accept three parameters:
`LAG(column_to_read, offset_steps, default_fallback)`

-   **`column_to_read`:** The target field you want to grab.
-   **`offset_steps`:** How many rows back or forward to look (defaults to `1`).
-   **`default_fallback`:** The value returned if no row exists (e.g., at the first row of a partition). Defaults to `NULL`.

---

### (3) Reality Metaphor
Imagine a queue of people waiting in line at a movie ticket booth:
-   The queue is sorted by arrival time.
-   **`LAG(name, 1)`** is like looking over your shoulder to see the name of the person standing directly **behind** you in line.
-   **`LEAD(name, 1)`** is like looking forward to see the name of the person standing directly **in front** of you in line.

---

### (4) Code Examples

#### Calculating Monthly Growth Rate
Let's compare monthly revenue figures:

```sql
CREATE TABLE monthly_revenue (
  year_month VARCHAR(7),
  revenue NUMERIC(10,2)
);

INSERT INTO monthly_revenue VALUES 
  ('2026-01', 10000.00),
  ('2026-02', 12000.00), -- +2000 growth
  ('2026-03', 15000.00); -- +3000 growth

SELECT 
  year_month,
  revenue,
  -- Look 1 row back, return 0.00 if first row
  LAG(revenue, 1, 0.00) OVER (ORDER BY year_month) AS previous_month_revenue,
  -- Calculate growth directly
  revenue - LAG(revenue, 1, 0.00) OVER (ORDER BY year_month) AS growth
FROM monthly_revenue;
```

**Output:**
| year_month | revenue | previous_month_revenue | growth |
| :--- | :--- | :--- | :--- |
| 2026-01 | 10000.00 | **0.00** *(fallback)* | **10000.00** |
| 2026-02 | 12000.00 | **10000.00** | **2000.00** |
| 2026-03 | 15000.00 | **12000.00** | **3000.00** |

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting the ORDER BY clause inside the window definition of a LAG/LEAD function

**The mistake:** Writing `LAG(revenue) OVER ()` without specifying an ordering condition.

**Why it's wrong:** SQL tables have no default sequence on disk. Without an explicit `ORDER BY` inside `OVER()`, the database reads rows in random physical page offset order. 

The "previous" value returned will be garbage data, corrupting your analytics.

**Fix: Always explicitly define the sorting sequence (like timestamps or IDs) inside the window clause for offset functions.**

```sql
/* Correct approach */
LAG(revenue) OVER (ORDER BY year_month)
```

---



### Mistake 2: Omitting the `OVER (ORDER BY ...)` Clause in `LAG()` / `LEAD()` Functions

**The mistake:** Calling `LAG(price)` without an `OVER (ORDER BY date)` clause.

**Why it's wrong:** `LAG()` and `LEAD()` strictly REQUIRE an explicit window ordering clause (`OVER (ORDER BY ...)`). Omitting `ORDER BY` throws error `window function lag requires an OVER clause`.

*Incorrect:*
```sql
SELECT price, LAG(price) FROM daily_prices; -- ❌ Missing OVER clause!
```

*Fix:*
```sql
SELECT price, LAG(price) OVER (ORDER BY price_date ASC) FROM daily_prices;
```

### Mistake 3: Confusing `LAG()` (Previous Row) with `LEAD()` (Next Row) Offset Direction

**The mistake:** Using `LEAD(val)` expecting to access historical previous row values.

**Why it's wrong:** `LAG(col, offset)` accesses PREVIOUS rows (past values). `LEAD(col, offset)` accesses SUBSEQUENT rows (future values).

*Incorrect:*
```sql
SELECT price, LEAD(price) OVER (ORDER BY date ASC) FROM prices; -- Accesses NEXT row price!
```

*Fix:*
```sql
SELECT price, LAG(price) OVER (ORDER BY date ASC) FROM prices; -- Accesses PREVIOUS row price
```

## 5. Practice Exercises

### Exercise 1: Comparing Consecutive Row Values with `LAG()`

**Scenario:**
Calculate the difference in sales revenue between the current month and the previous month (`revenue - LAG(revenue)`).

**Requirements:**
1. Execute `SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) FROM monthly_sales`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   sales_month, 
>   revenue_cents, 
>   LAG(revenue_cents, 1, 0) OVER (ORDER BY sales_month ASC) AS prev_month_revenue,
>   revenue_cents - LAG(revenue_cents, 1, 0) OVER (ORDER BY sales_month ASC) AS month_over_month_diff 
> FROM monthly_sales;
> ```
>
> #### Technical Explanation
>
> 1. `LAG(column, offset, default)` fetches column values from `offset` rows preceding the current row within the window partition.
> 2. `offset=1` looks at the previous row; `default=0` provides a fallback when no preceding row exists.
> 3. Eliminates issuing expensive self-joins for month-over-month comparisons.

---

### Exercise 2: Looking Ahead to Next Rows with `LEAD()`

**Scenario:**
Calculate the time interval between a user's current audit log event and their NEXT event using `LEAD(created_at)`.

**Requirements:**
1. Use `LEAD(created_at) OVER (PARTITION BY user_id ORDER BY created_at)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   user_id, 
>   event_name, 
>   created_at AS event_time,
>   LEAD(created_at) OVER (PARTITION BY user_id ORDER BY created_at ASC) AS next_event_time,
>   LEAD(created_at) OVER (PARTITION BY user_id ORDER BY created_at ASC) - created_at AS time_to_next_event 
> FROM audit_logs;
> ```
>
> #### Technical Explanation
>
> 1. `LEAD(column, offset)` accesses values from future rows following the current row.
> 2. `PARTITION BY user_id` isolates calculation boundaries per user.
> 3. Calculates time intervals between consecutive user actions.

---

### Exercise 3: Detecting Trend Changes across Ordered Sequences

**Scenario:**
Identify instances where a stock price dropped compared to the previous day's closing price.

**Requirements:**
1. Compare `price` against `LAG(price)`.

> [!check]- Answer
>
> #### Implementation
>
> SELECT 
>   trade_date, 
>   closing_price,
>   CASE 
>     WHEN closing_price > LAG(closing_price) OVER (ORDER BY trade_date ASC) THEN 'UP'
>     WHEN closing_price < LAG(closing_price) OVER (ORDER BY trade_date ASC) THEN 'DOWN'
>     ELSE 'SAME'
>   END AS trend 
> FROM stock_prices;
> ```
>
> #### Technical Explanation
>
> 1. Combines `LAG()` positional window functions with `CASE` expressions.
> 2. Classifies sequential row trends.
> 3. Financial analytics pattern.

---



## 6. Related Terms
- [Window Function](window_function.md) — The parent calculation engine.
- [`ROW_NUMBER()` / `RANK()` / `DENSE_RANK()`](row_number_rank.md) — Positional window functions.

---

## 7. Key Takeaways
- `LAG()` reads data from a previous row in a partition sequence.
- `LEAD()` reads data from a subsequent row in a partition sequence.
- Prevents expensive, complex self-joins for neighboring row calculations.
- Accepts parameter overrides for step offsets (defaults to 1) and default fallbacks.
- Requires a strict `ORDER BY` inside `OVER()` to guarantee correct sequence mapping.
- Essential for timeseries reports, growth metrics, and event duration calculations.
