# `CASE` Expression

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL expression used to implement conditional branching logic (similar to `if/else` or `switch` statements in programming) directly inside a query.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The baseline query projection statement.

---

## 2. Term Category
- **SQL Query Expression**

---

## 3. Environment Context
- **Universal Standard** (Supported natively in all SQL databases. Evaluated on-the-fly for every row during the projection or filtering stage).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When displaying data in an application dashboard, you often need to translate raw database values into human-readable text labels:
-   If `price > 100.00`, display the label `'Premium'`.
-   If `status_code = 1`, display `'Active'`, and if `status_code = 2`, display `'Suspended'`.

In procedural programming languages, you write `if/else` or `switch` statements to branch logic.

If you don't have a way to branch logic inside SQL, you have to write heavy translation loops in your JavaScript backend code.

We designed the **`CASE`** expression to solve this. It allows you to evaluate multiple boolean conditions row-by-row directly inside the database query, returning a single dynamically calculated value for each row.

---

### (2) Simple CASE vs. Searched CASE

#### 1. Simple CASE (Exact matches)
Compares a single column or expression to specific values (like a `switch` statement):

```sql
SELECT username,
  CASE status_code
    WHEN 1 THEN 'Active'
    WHEN 2 THEN 'Pending'
    ELSE 'Inactive'
  END AS status_name
FROM users;
```

#### 2. Searched CASE (Range / Logic checks)
Evaluates custom boolean expressions in each `WHEN` clause (like `if / else if / else` blocks):

```sql
SELECT name, price,
  CASE
    WHEN price >= 100.00 THEN 'Expensive'
    WHEN price BETWEEN 20.00 AND 99.99 THEN 'Moderate'
    ELSE 'Cheap'
  END AS price_tier
FROM products;
```

---

### (3) Reality Metaphor
Imagine a cargo package sorting depot:
-   Packages slide down a conveyor belt.
-   A scanner checks the weight of each package:
    -   **`WHEN`** weight > 50kg **`THEN`** route to Heavy Cargo.
    -   **`WHEN`** weight > 10kg **`THEN`** route to Standard Delivery.
    -   **`ELSE`** route to Envelope Mail.
-   Every package gets exactly one routing stamp before leaving the belt.

---

### (4) Code Examples

#### Price Tier Classification
```sql
CREATE TABLE inventory (
  id INT PRIMARY KEY,
  item_name VARCHAR(100),
  stock_count INT
);

-- Label stock levels visually
SELECT item_name, stock_count,
  CASE 
    WHEN stock_count = 0 THEN 'Out of Stock'
    WHEN stock_count < 5 THEN 'Low Stock'
    ELSE 'In Stock'
  END AS stock_status
FROM inventory;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to return mismatched data types across different THEN branches

**The mistake:** Returning a text string in the first branch, but returning an integer in the second branch:

```sql
-- BAD: This query crashes during execution!
SELECT item_name,
  CASE
    WHEN stock_count = 0 THEN 'None' -- Returns TEXT
    ELSE stock_count                -- Returns INTEGER (Type mismatch!)
  END AS inventory_log
FROM inventory;
-- ERROR: invalid input syntax for type integer: "None"
```

**Why it's wrong:** SQL columns must have a strict data type. A `CASE` expression acts as a virtual column, meaning all possible output branches (including the `ELSE` branch) must return the **exact same data type** (or types that Postgres can cast automatically).

**Fix: Cast the integer column to a string using type casting, so all output branches return text.**

```sql
/* Correct approach */
SELECT item_name,
  CASE
    WHEN stock_count = 0 THEN 'None'
    ELSE stock_count::VARCHAR -- Cast integer to text
  END AS inventory_log
FROM inventory;
```

---



### Mistake 2: Forgetting the `END` Keyword to Terminate `CASE` Expressions

**The mistake:** Writing `SELECT CASE WHEN age >= 18 THEN 'Adult' ELSE 'Minor' FROM users;`.

**Why it's wrong:** `CASE` expressions strictly require an ending `END` keyword (e.g. `CASE WHEN ... THEN ... ELSE ... END`).

*Incorrect:*
```sql
SELECT CASE WHEN age >= 18 THEN 'Adult' ELSE 'Minor' FROM users; -- ❌ Missing END keyword!
```

*Fix:*
```sql
SELECT CASE WHEN age >= 18 THEN 'Adult' ELSE 'Minor' END AS status FROM users;
```

### Mistake 3: Expecting `ELSE` Clause Defaults When `ELSE` Is Omitted

**The mistake:** Omitting `ELSE` expecting un-matched conditions to retain original column values.

**Why it's wrong:** If `ELSE` is omitted and no `WHEN` condition matches, `CASE` returns `NULL`! Always specify `ELSE` when fallback values are required.

*Incorrect:*
```sql
CASE WHEN status = 'active' THEN 1 END -- Returns NULL if status is 'pending'!
```

*Fix:*
```sql
CASE WHEN status = 'active' THEN 1 ELSE 0 END -- Fallback 0
```

## 6. Practice Exercises

### Exercise 1: Score Translator

**Problem:** You have a `students` table with columns `name` and `exam_score` (integers from 0 to 100). Write a SQL query that retrieves the student's name, their score, and a third column named `grade` that evaluates:
-   `A` if score is 90 or above.
-   `B` if score is 80 or above.
-   `Pass` if score is 50 or above.
-   `Fail` if score is below 50.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT name, exam_score,
>   CASE
>     WHEN exam_score >= 90 THEN 'A'
>     WHEN exam_score >= 80 THEN 'B'
>     WHEN exam_score >= 50 THEN 'Pass'
>     ELSE 'Fail'
>   END AS grade
> FROM students;
> ```
> - Order your `WHEN` conditions from highest to lowest. SQL evaluates conditions from top to bottom and exits at the first match.
> - Append the `END AS grade` clause to close the block and alias the column.

---



### Exercise 2: Conditional Category Labeling with `CASE`

**Problem:** Label product prices: price < 20 -> `'Budget'`, price BETWEEN 20 AND 100 -> `'Standard'`, else -> `'Premium'`. 

**Expected output:**
> [!check]- Answer
> ```text
> SELECT name, CASE WHEN price < 20 THEN 'Budget' WHEN price BETWEEN 20 AND 100 THEN 'Standard' ELSE 'Premium' END AS price_category FROM products;
> ```
> ```sql
> SELECT name,
>   CASE
>     WHEN price < 20 THEN 'Budget'
>     WHEN price BETWEEN 20 AND 100 THEN 'Standard'
>     ELSE 'Premium'
>   END AS price_category
> FROM products;
> ```
>
> **Explanation:** `CASE WHEN ... THEN ... ELSE ... END` evaluates conditional branches in SQL queries.

---

### Exercise 3: Conditional Aggregation with `CASE`

**Problem:** Sum `total` amount for `'completed'` orders vs `'pending'` orders in a single row using `SUM(CASE WHEN ...)`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) AS completed_sum FROM orders;
> ```
> ```sql
> SELECT
>   SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) AS completed_sum,
>   SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END) AS pending_sum
> FROM orders;
> ```
>
> **Explanation:** Embedding `CASE` inside aggregate functions provides conditional summary metrics.

## 7. Related Terms
- [`SELECT`](../level_03/select.md) — The parent query command.
- [Type Casting (`CAST` / `::`)](type_casting.md) — Converting data types in branches.

---

## 8. Key Takeaways
- `CASE` expressions execute conditional logic (if/else) row-by-row inside queries.
- Simple `CASE` matches exact values; Searched `CASE` evaluates custom boolean expressions.
- Every `CASE` block must end with the `END` keyword.
- All branches of a `CASE` statement must return the exact same data type.
- Use `ELSE` to set a default fallback value if no conditions are met.
