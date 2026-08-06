# `CASE` Expression

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL expression used to implement conditional branching logic (similar to `if/else` or `switch` statements in programming) directly inside a query.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The baseline query projection statement.

---

## 2. Term Category

**SQL Command / Clause** (Conditional Evaluation): `CASE WHEN ... THEN ... ELSE ... END` evaluates conditional logic within SQL projection and filtering expressions.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported natively in all SQL databases. Evaluated on-the-fly for every row during the projection or filtering stage).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Categorizing Rows with Searched CASE Expressions

**Scenario:**
Categorize orders by total amount: `'High'` (>= $100), `'Medium'` (>= $50), `'Low'` (< $50).

**Requirements:**
1. Execute `CASE WHEN total_cents >= 10000 THEN 'High' ... END`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id, 
>   total_cents,
>   CASE 
>     WHEN total_cents >= 10000 THEN 'High Value'
>     WHEN total_cents >= 5000 THEN 'Medium Value'
>     ELSE 'Low Value'
>   END AS order_tier 
> FROM orders;
> ```
>
> #### Technical Explanation
>
> 1. `CASE` expressions evaluate conditions sequentially until a `WHEN` condition matches `TRUE`.
> 2. If no condition matches, returns the `ELSE` fallback value.
> 3. Performs server-side conditional logic.

---

### Exercise 2: Conditional Aggregations using CASE inside SUM/COUNT

**Scenario:**
Count total pending vs completed orders in a single aggregation pass using `SUM(CASE WHEN ...)`.

**Requirements:**
1. Use `COUNT(CASE WHEN status = 'pending' THEN 1 END)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count,
>   COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
>   COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_count 
> FROM orders;
> ```
>
> #### Technical Explanation
>
> 1. `COUNT()` ignores `NULL` results returned by `CASE` when conditions evaluate to false.
> 2. Computes pivot metrics in a single table scan pass.
> 3. High performance reporting pattern.

---

### Exercise 3: Dynamic Updates with CASE Expressions

**Scenario:**
Update employee salaries giving a 10% raise to role `'Engineer'` and 5% raise to role `'Support'`.

**Requirements:**
1. Execute `UPDATE employees SET salary = CASE WHEN role = 'Engineer' ... END`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> UPDATE employees 
> SET salary_cents = CASE 
>   WHEN role = 'Engineer' THEN ROUND(salary_cents * 1.10)
>   WHEN role = 'Support' THEN ROUND(salary_cents * 1.05)
>   ELSE salary_cents 
> END;
> ```
>
> #### Technical Explanation
>
> 1. Uses `CASE` inside `UPDATE` statements to apply different modification logic per row.
> 2. Executes conditional bulk updates in a single atomic SQL statement.
> 3. Efficient data manipulation.

---



## 6. Related Terms
- [`SELECT`](../level_03/select.md) — The parent query command.
- [Type Casting (`CAST` / `::`)](type_casting.md) — Converting data types in branches.

---

## 7. Key Takeaways
- `CASE` expressions execute conditional logic (if/else) row-by-row inside queries.
- Simple `CASE` matches exact values; Searched `CASE` evaluates custom boolean expressions.
- Every `CASE` block must end with the `END` keyword.
- All branches of a `CASE` statement must return the exact same data type.
- Use `ELSE` to set a default fallback value if no conditions are met.
