# Comparison & Logical Operators

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The set of mathematical symbols (e.g. `=`, `<>`) and logical connectors (e.g. `AND`, `OR`, `LIKE`) used inside `WHERE` clauses to evaluate complex row filters.

---

## 1. Prerequisites
- [`WHERE` Clause](where.md) — The parent filter context.

---

## 2. Term Category

**SQL Command / Clause** (Comparison & Logical Operators): SQL Operators (`=`, `<>`, `>`, `<`, `AND`, `OR`, `LIKE`, `IN`) evaluate filtering logic within `WHERE` clauses.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported in all SQL engines. Operators evaluate values to `TRUE`, `FALSE`, or `UNKNOWN`).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Value Comparison Filtering with Range Operators

**Scenario:**
Query products with price between 1000 and 5000 cents (`price_cents BETWEEN 1000 AND 5000`).

**Requirements:**
1. Execute `SELECT` with `BETWEEN ... AND ...`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, name, price_cents 
> FROM products 
> WHERE price_cents BETWEEN 1000 AND 5000;
> ```
>
> #### Technical Explanation
>
> 1. `BETWEEN a AND b` is inclusive (`price >= a AND price <= b`).
> 2. Hits B-tree indexes efficiently.
> 3. Clean range filtering syntax.

---

### Exercise 2: Discrete Value Set Matching with `IN`

**Scenario:**
Query orders where `status` is in set `('pending', 'processing', 'shipped')`.

**Requirements:**
1. Execute `WHERE status IN ('pending', 'processing', 'shipped')`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, customer_id, status 
> FROM orders 
> WHERE status IN ('pending', 'processing', 'shipped');
> ```
>
> #### Technical Explanation
>
> 1. `IN (...)` checks if a column value matches any element in a list.
> 2. Replaces multiple `OR` conditions.
> 3. Utilizes indexes on `status`.

---

### Exercise 3: Pattern Matching with LIKE and ILIKE

**Scenario:**
Find all users whose email ends with `@example.com` (case-insensitive).

**Requirements:**
1. Use `WHERE email ILIKE '%@example.com'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, username, email 
> FROM users 
> WHERE email ILIKE '%@example.com';
> ```
>
> #### Technical Explanation
>
> 1. `%` matches zero or more characters; `_` matches a single character.
> 2. `ILIKE` performs case-insensitive pattern matching (PostgreSQL extension).
> 3. Note: Leading wildcards (`'%text'`) force sequential table scans unless trigram indexes exist.

---



## 6. Related Terms
- [`WHERE` Clause](where.md) — The parent filter context.
- [`IS NULL` / `IS NOT NULL`](is_null.md) — The only way to compare missing values.
- [`LIKE` / `ILIKE` Pattern Matching](../level_04/like_ilike.md) — Related concept: `LIKE` / `ILIKE` Pattern Matching.

---

## 7. Key Takeaways
- Comparison operators compare values; logical operators combine filters.
- `BETWEEN` performs inclusive range filtering.
- `IN` checks for matching values inside a specified list.
- Use `LIKE` with `%` and `_` wildcards for basic text search pattern matches.
- Never use `=` for wildcard queries; `=` checks only literal matches.
