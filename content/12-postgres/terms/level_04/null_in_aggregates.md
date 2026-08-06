# `NULL` Behavior in Expressions & Aggregates

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The architectural rules governing how missing data (`NULL`) propagation affects standard mathematical expressions and SQL aggregate functions.

---

## 1. Prerequisites
- [`NULL`](../level_02/null.md) — Understanding the absent state.
- [Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)](aggregate_functions.md) — Standard summary calculations.

---

## 2. Term Category

**Core Concept** (Null Handling in Aggregations): Null in Aggregates explains how PostgreSQL aggregate functions ignore `NULL` values during calculation.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Enforced in all relational SQL query engines. Standardized by the ANSI-SQL spec).

### (1) Design Motivation — "Why did we design this?"
In real-world databases, tables contain missing data (`NULL`). 

If you write a query to calculate summaries (like average department salaries or active user counts), you must understand exactly how the database handles these empty cells.

If the database treated `NULL` as a number (like `0`), it would corrupt calculations:
-   If 2 employees earn `$5,000` and `$7,000`, and a 3rd employee's salary is unknown (`NULL`), treating the unknown salary as `0` would drag the calculated average salary down to `$4,000`, which is incorrect.

To prevent this, SQL designed strict rules for how `NULL` behaves:

#### 1. In Mathematical Expressions (Propagation)
Any basic math operation containing `NULL` yields `NULL` because performing calculations on unknown values yields an unknown result:
-   `1000 + NULL = NULL`
-   `salary * 1.1 = NULL` (if salary is NULL)

#### 2. In Aggregates (Ignore & Skip)
Aggregate math functions like `SUM()`, `AVG()`, `MIN()`, and `MAX()` **ignore `NULL` values completely**, calculating summaries only across the remaining active rows.

#### 3. In COUNT() (Selective Counting)
-   **`COUNT(*)`**: Counts **all rows**, regardless of whether they contain NULLs.
-   **`COUNT(column)`**: Counts only rows where the specified column is **not null**.

---

### (2) Reality Metaphor
Imagine a school grading sheet:
-   Student A scored `90`.
-   Student B scored `70`.
-   Student C was absent and did not take the test (score is `NULL`).

If you calculate the class average:
-   **Ignore Absent (Standard `AVG`):** You add `90 + 70 = 160`, and divide by **2** students who actually took the test. The class average is `80`. This is the default SQL aggregate behavior.
-   **Treat as Zero (`AVG(COALESCE)`):** You write a `0` for the absent student. You add `90 + 70 + 0 = 160`, and divide by **3** students. The class average drops to `53.3`.

---

### (3) Code Examples

#### Aggregating Nullable Data
Assume we have the following table:

```sql
CREATE TABLE employees (
  name VARCHAR(50),
  salary NUMERIC(10,2) -- Can be NULL
);

INSERT INTO employees (name, salary) VALUES 
  ('Alice', 1000.00),
  ('Bob', 2000.00),
  ('Charlie', NULL);
```

Let's run aggregate queries:

```sql
SELECT 
  COUNT(*) AS count_all,          -- Returns 3 (Charlie's row is counted)
  COUNT(salary) AS count_salary,  -- Returns 2 (Charlie's NULL is ignored)
  SUM(salary) AS total_salaries,  -- Returns 3000.00 (Charlie is ignored)
  AVG(salary) AS average_salary   -- Returns 1500.00 (3000 / 2 active employees!)
FROM employees;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming `AVG(column)` treats NULL values as zero

**The mistake:** Calculating average user points by writing `AVG(points)` and assuming the average is calculated across all users, even those with `NULL` points.

**Why it's wrong:** As shown in the code examples, `AVG()` ignores `NULL` rows. If you have 10 users, but 8 of them have `NULL` points, `AVG()` will sum the points of the 2 active users and divide by **2**, not 10. This makes the point average look artificially high.

**Fix: If your business logic requires you to treat missing values as zero, you must use the `COALESCE` function to convert `NULL` to `0` inside the aggregate function.**

```sql
/* Correct approach: Average across ALL 10 users, treating NULL as 0 */
SELECT AVG(COALESCE(points, 0)) AS real_average FROM users;
```

---



### Mistake 2: Expecting `AVG(column)` to Include NULL Rows in the Average Denominator Calculation

**The mistake:** Calculating `AVG(bonus)` across 10 employees where 5 have bonus $100 and 5 have NULL bonus.

**Why it's wrong:** Aggregate functions (`AVG`, `SUM`, `MIN`, `MAX`) IGNORE NULL values entirely! `AVG(bonus)` computes $500 / 5 = 100$, NOT $500 / 10 = 50$. Use `AVG(COALESCE(bonus, 0))` to include NULL rows.

*Incorrect:*
```sql
SELECT AVG(bonus) FROM employees; -- Evaluates 500 / 5 = 100 (ignores NULLs)
```

*Fix:*
```sql
SELECT AVG(COALESCE(bonus, 0)) FROM employees; -- Evaluates 500 / 10 = 50
```

### Mistake 3: Expecting `COUNT(*)` and `COUNT(col)` to Produce Identical Results

**The mistake:** Assuming `COUNT(col)` equals `COUNT(*)` when `col` contains NULL values.

**Why it's wrong:** `COUNT(*)` counts total tuple rows regardless of NULLs. `COUNT(col)` counts ONLY non-null values of `col`.

*Incorrect:*
```sql
// Assuming COUNT(phone) equals COUNT(*)
```

*Fix:*
```sql
Use COUNT(*) for total rows; use COUNT(col) for non-null column counts
```

## 5. Practice Exercises

### Exercise 1: Verifying Null Exclusion in Aggregate Functions

**Scenario:**
Demonstrate how `AVG()` and `SUM()` ignore `NULL` values when computing averages over column `discount_cents`.

**Requirements:**
1. Compare `AVG(discount_cents)` on dataset `(100, 200, NULL)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- Dataset: (100, 200, NULL)
> SELECT 
>   AVG(discount_cents) AS avg_discount, -- Returns 150 (300 / 2 valid rows)
>   SUM(discount_cents) AS sum_discount, -- Returns 300
>   COUNT(discount_cents) AS count_non_null, -- Returns 2
>   COUNT(*) AS count_all_rows -- Returns 3
> FROM test_discounts;
> ```
>
> #### Technical Explanation
>
> 1. Aggregate functions (`AVG`, `SUM`, `MIN`, `MAX`) automatically ignore `NULL` values during calculation.
> 2. `AVG()` divides total sum (300) by non-null row count (2), yielding `150` (NOT 100).
> 3. `COUNT(col)` counts non-null rows; `COUNT(*)` counts all rows regardless of nulls.

---

### Exercise 2: Forcing Null Substitution in Aggregations with `COALESCE`

**Scenario:**
Calculate average discount treating `NULL` values as `0` discount (`AVG(COALESCE(discount_cents, 0))`).

**Requirements:**
1. Use `AVG(COALESCE(discount_cents, 0))`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   AVG(COALESCE(discount_cents, 0)) AS avg_discount_including_zeroes 
> FROM test_discounts;
> ```
>
> #### Technical Explanation
>
> 1. Wrapping columns in `COALESCE(col, 0)` converts `NULL` to `0` before aggregation occurs.
> 2. Forces `AVG()` to divide by total row count (3), yielding `100` (300 / 3).
> 3. Business logic choice based on domain requirements.

---

### Exercise 3: Handling Empty Aggregation Results

**Scenario:**
Handle empty `SUM()` query results when 0 matching rows exist using `COALESCE(SUM(amount), 0)`.

**Requirements:**
1. Execute `SELECT COALESCE(SUM(total_cents), 0) FROM orders WHERE customer_id = 999`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   COALESCE(SUM(total_cents), 0) AS total_spent 
> FROM orders 
> WHERE customer_id = 999;
> ```
>
> #### Technical Explanation
>
> 1. `SUM()` over an empty result set (0 rows) returns `NULL` (NOT 0).
> 2. `COALESCE(SUM(...), 0)` converts empty aggregation `NULL` output into `0`.
> 3. Prevents returning `null` to financial calculations.

---



## 6. Related Terms
- [`NULL`](../level_02/null.md) — The parent absent state.
- [Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)](aggregate_functions.md) — Standard calculations.
- [`COALESCE` / `NULLIF`](coalesce_nullif.md) — Swapping NULLs for safe defaults.

---

## 7. Key Takeaways
- Mathematical operations involving `NULL` immediately result in `NULL`.
- Aggregate functions (`SUM`, `AVG`, `MIN`, `MAX`) skip `NULL` rows entirely.
- `AVG` calculates averages by dividing by the count of non-null rows only.
- `COUNT(*)` counts all rows; `COUNT(column)` counts only non-null cells.
- Use `COALESCE(column, 0)` inside aggregates to treat `NULL` values as zero.
