# `NULL` Behavior in Expressions & Aggregates

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The architectural rules governing how missing data (`NULL`) propagation affects standard mathematical expressions and SQL aggregate functions.

---

## 1. Prerequisites
- [NULL](../level_02/null.md) — Understanding the absent state.
- [Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)](aggregate_functions.md) — Standard summary calculations.

---

## 2. Term Category
- **Core Architecture Concept**

---

## 3. Environment Context
- **Universal Standard** (Enforced in all relational SQL query engines. Standardized by the ANSI-SQL spec).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Aggregate Analysis

**Problem:** You have a table `survey_responses` containing 100 rows. The column `rating` contains:
-   80 rows with integer ratings (1 to 5).
-   20 rows with `NULL` (skipped questions).

Calculate the output numbers of the following two queries:
1.  `SELECT COUNT(*) FROM survey_responses;`
2.  `SELECT COUNT(rating) FROM survey_responses;`

**Expected output:**
```text
1. Query 1 returns: 100 (COUNT(*) counts all rows in the dataset).
2. Query 2 returns: 80 (COUNT(column) skips the 20 rows containing NULL ratings).
```

> [!check]- Answer
> - Differentiate between counting grid cards vs counting specific non-empty cells.

---



### Exercise 2: Null-Safe Average Calculation

**Problem:** Calculate average score treating NULL scores as 0 using `AVG(COALESCE(score, 0))`.

**Expected output:**
```text
SELECT AVG(COALESCE(score, 0)) AS avg_score FROM tests;
```

> [!check]- Answer
> ```sql
> SELECT AVG(COALESCE(score, 0)) AS avg_score FROM tests;
> ```
>
> **Explanation:** `COALESCE(score, 0)` replaces NULLs with 0 so all rows contribute to the average.

### Exercise 3: Null Handling in `SUM()` Function

**Problem:** What does `SUM(val)` return if all rows in a group are NULL? (`NULL`).

**Expected output:**
```text
NULL
```

> [!check]- Answer
> ```text
> NULL
> ```
>
> **Explanation:** `SUM()` on all-null groups returns NULL; use `COALESCE(SUM(val), 0)` to default to 0.

## 7. Related Terms
- [NULL](../level_02/null.md) — The parent absent state.
- [Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)](aggregate_functions.md) — Standard calculations.
- [`COALESCE` / `NULLIF`](coalesce_nullif.md) — Swapping NULLs for safe defaults.

---

## 8. Key Takeaways
- Mathematical operations involving `NULL` immediately result in `NULL`.
- Aggregate functions (`SUM`, `AVG`, `MIN`, `MAX`) skip `NULL` rows entirely.
- `AVG` calculates averages by dividing by the count of non-null rows only.
- `COUNT(*)` counts all rows; `COUNT(column)` counts only non-null cells.
- Use `COALESCE(column, 0)` inside aggregates to treat `NULL` values as zero.
