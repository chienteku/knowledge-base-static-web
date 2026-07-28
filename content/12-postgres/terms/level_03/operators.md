# Comparison & Logical Operators

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The set of mathematical symbols (e.g. `=`, `<>`) and logical connectors (e.g. `AND`, `OR`, `LIKE`) used inside `WHERE` clauses to evaluate complex row filters.

---

## 1. Prerequisites
- [`WHERE` Clause](where.md) — The parent filter context.

---

## 2. Term Category
- **SQL Query Syntax**

---

## 3. Environment Context
- **Universal Standard** (Supported in all SQL engines. Operators evaluate values to `TRUE`, `FALSE`, or `UNKNOWN`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A `WHERE` clause needs to know how to filter data. 

Sometimes, you need simple math comparisons (e.g. "Find products where the price is greater than $10"). 

Other times, you need complex logical checks (e.g. "Find users who live in New York OR California, AND registered this year").

To support these varied business needs, SQL defines three classes of operators:

#### 1. Comparison Operators
-   **`=`**: Equal to.
-   **`<>`** (or **`!=`**): Not equal to.
-   **`<`**, **`>`**, **`<=`**, **`>=`**: Sizing inequalities.

#### 2. Logical Operators
-   **`AND`**: Both conditions must be true.
-   **`OR`**: At least one condition must be true.
-   **`NOT`**: Inverts a condition.

#### 3. Range & Set Operators
-   **`BETWEEN a AND b`**: Checks if a value falls within an inclusive range.
-   **`IN (x, y, z)`**: Checks if a value matches any item in a list.
-   **`LIKE`**: Performs basic text pattern matching using wildcards:
    -   **`%`** represents zero or more characters (e.g. `'A%'` matches 'Alice', 'Alex', 'A').
    -   **`_`** represents exactly one character (e.g. `'L_st'` matches 'Last', 'Lost').

---

### (2) Reality Metaphor
Imagine a mechanical coin sorting machine:
-   **`>` and `<`** are like physical sizing grates. Coins smaller than a dime fall through; coins larger than a quarter are pushed away.
-   **`IN`** is like a template tray with slots for pennies, nickels, and dimes. If a coin fits *any* of those slots, it is kept.
-   **`AND`** is like passing a coin through two separate checkpoints: it must weigh exactly 5 grams AND be made of copper before entering the vault.

---

### (3) Code Examples

#### Range and List Filters
```sql
CREATE TABLE inventory (
  id INT PRIMARY KEY,
  item_name VARCHAR(100),
  price NUMERIC(10,2),
  status VARCHAR(20)
);

-- Query: Price between $10 and $50, status is either 'active' or 'new'
SELECT item_name, price 
FROM inventory
WHERE price BETWEEN 10.00 AND 50.00 
  AND status IN ('active', 'new');
```

#### Wildcard Search
```sql
-- Find all items where the name starts with the letter 'S'
SELECT item_name 
FROM inventory
WHERE item_name LIKE 'S%';
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `=` with `LIKE` when using wildcard percentages

**The mistake:** Writing a search query like `WHERE name = 'Alex%'` and expecting it to return 'Alexander' and 'Alexia'.

**Why it's wrong:** The equal operator `=` checks for an exact, literal match. It searches for a user whose name is literally the five-character string `'Alex%'` (ending with a real percent sign). It does not treat `%` as a wildcard.

**Fix: Always use the `LIKE` operator when writing text wildcards.**

```sql
/* Correct approach */
WHERE name LIKE 'Alex%'
```

---



### Mistake 2: Confusing Case-Sensitive `LIKE` with Case-Insensitive `ILIKE`

**The mistake:** Writing `SELECT * FROM users WHERE name LIKE 'alice%';` expecting to match `'Alice'`. 

**Why it's wrong:** `LIKE` is case-sensitive in PostgreSQL! String `'alice%'` will NOT match `'Alice'`. Use PostgreSQL `ILIKE` for case-insensitive pattern matching.

*Incorrect:*
```sql
SELECT * FROM users WHERE name LIKE 'alice%'; -- ❌ Fails on uppercase 'Alice'!
```

*Fix:*
```sql
SELECT * FROM users WHERE name ILIKE 'alice%'; -- PostgreSQL case-insensitive ILIKE
```

### Mistake 3: Using `!= ALL` or `= ANY` Incorrectly on Empty Array Sets

**The mistake:** Comparing scalar values against un-initialized array fields.

**Why it's wrong:** Array operator predicates returning NULL or empty sets can evaluate unexpectedly. Use explicit array functions or `IN` / `NOT IN` clauses.

*Incorrect:*
```sql
SELECT * FROM t WHERE val = ANY(array_col);
```

*Fix:*
```sql
SELECT * FROM t WHERE val = ANY(COALESCE(array_col, ARRAY[]::INT[]));
```

## 6. Practice Exercises

### Exercise 1: Query Construction

**Problem:** You are building an e-commerce dashboard. Write a SQL query to select `item_name` from the `inventory` table for all items that meet **all** of the following conditions:
1.  The price is strictly greater than `100`.
2.  The item is NOT marked as `'discontinued'`.
3.  The item name starts with the word `'Smart'` (e.g. 'Smartphone', 'Smartwatch').

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT item_name 
> FROM inventory 
> WHERE price > 100 
>   AND status <> 'discontinued' 
>   AND item_name LIKE 'Smart%';
> ```
> - Combine the conditions using `AND` operators.
> - Use `<>` or `!=` for inequality and `LIKE 'Smart%'` for the prefix text match.

---



### Exercise 2: Case-Insensitive Substring Match with `ILIKE`

**Problem:** Query users whose `email` ends with `'@gmail.com'` case-insensitively using `ILIKE`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM users WHERE email ILIKE '%@gmail.com';
> ```
> ```sql
> SELECT * FROM users WHERE email ILIKE '%@gmail.com';
> ```
>
> **Explanation:** `ILIKE` performs case-insensitive wildcard string pattern matching.

---

### Exercise 3: Array Member Comparison with `ANY`

**Problem:** Query rows where `role` matches any array item in `ARRAY['admin', 'mod']` using `= ANY()`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM users WHERE role = ANY(ARRAY['admin', 'mod']);
> ```
> ```sql
> SELECT * FROM users WHERE role = ANY(ARRAY['admin', 'mod']);
> ```
>
> **Explanation:** `= ANY(array)` evaluates true if the LHS scalar equals any array element.

## 7. Related Terms
- [`WHERE` Clause](where.md) — The parent filter context.
- [`IS NULL` / `IS NOT NULL`](is_null.md) — The only way to compare missing values.

---

## 8. Key Takeaways
- Comparison operators compare values; logical operators combine filters.
- `BETWEEN` performs inclusive range filtering.
- `IN` checks for matching values inside a specified list.
- Use `LIKE` with `%` and `_` wildcards for basic text search pattern matches.
- Never use `=` for wildcard queries; `=` checks only literal matches.
