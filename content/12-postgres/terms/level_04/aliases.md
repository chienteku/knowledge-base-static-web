# Aliases (`AS`)

> **Level 4 — Querying & Data Retrieval (Intermediate SQL)**
> The SQL keyword used to assign temporary, readable nicknames to columns or tables inside a query to simplify naming conventions and enable table self-joins.

---

## 1. Prerequisites
- [`SELECT`](../level_03/select.md) — The baseline data retrieval statement.

---

## 2. Term Category
- **SQL Query Keyword**

---

## 3. Environment Context
- **Universal Standard** (Supported natively by all SQL database engines. Aliases exist only for the duration of the query execution and do not alter database schemas on disk).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In database design, column names are optimized for storage standards, which can make them long or confusing (e.g., `cust_first_name_str`). 

Furthermore, queries often perform mathematical calculations or combinations (e.g., `price * 1.08`).

If you query a calculation:
`SELECT price * 1.08 FROM products;`
The database returns the calculation expression as the column header. 

In your application code (like Node.js), referencing a variable named `row['price * 1.08']` is messy, hard to read, and error-prone.

We designed **Aliases** to solve this. 

Using the **`AS`** keyword, you can rename column output headers on-the-fly. 

Additionally, you can assign short nicknames to **tables** (e.g. `FROM very_long_table_name AS t`) to keep complex SQL joins readable and enable a table to join to itself (a self-join).

---

### (2) Column Aliases vs. Table Aliases

#### 1. Column Aliases (Clean Outputs)
Renames output headers. Highly useful for renaming calculations or mapping keys directly to frontend application requirements:

```sql
SELECT price * 0.9 AS discounted_price 
FROM products;
```

#### 2. Table Aliases (Shorthand References)
Assigns a shorthand letter to a table, reducing typing when referencing tables inside joins:

```sql
SELECT p.name, o.order_date
FROM orders AS o
JOIN products AS p ON o.product_id = p.id;
-- 'o' represents orders, 'p' represents products
```

---

### (3) The Optional `AS` Danger
In SQL, the `AS` keyword is technically **optional**. You can write:
`SELECT username name FROM users;`
This returns the `username` column renamed as `name`.

However, omitting the `AS` keyword is a bad practice. If you make a typo and omit a comma in your selection list, Postgres will silently treat the second column as an alias of the first, leading to bugs!

---

### (4) Reality Metaphor
Imagine a legal contract:
-   The contract has to reference a person with a long legal name: *"Alexander Bartholomew Cunningham III"* (the database table name).
-   To avoid repeating this 50-character name on every line of the document, the contract declares at the top:
    *"...hereinafter referred to as 'C' (the alias)."*
-   For the rest of the document, the contract simply writes `C` instead of the full legal name, saving ink and paper.

---

### (5) Code Examples

#### Calculation Alias
```sql
CREATE TABLE employees (
  id INT PRIMARY KEY,
  first_name VARCHAR(50),
  salary NUMERIC(10,2)
);

-- Calculate monthly wage and rename output
SELECT first_name, salary / 12 AS monthly_salary 
FROM employees;
```

#### Missing Comma Bug (Omitting AS)
```sql
-- Developer intended to fetch id AND first_name, but forgot the comma!
SELECT id first_name FROM employees;
-- Output returns ONLY ONE column: the id values, but labeled as 'first_name'!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting commas between columns, triggering accidental aliasing

**The mistake:** Writing `SELECT user_id email FROM users;` when you meant to select both the ID and email columns.

**Why it's wrong:** Because the `AS` keyword is optional, omitting the comma tells the SQL parser to treat the second column name (`email`) as a custom alias for the first column (`user_id`). The query runs without error, but the email data is lost from the output.

**Fix: Always write explicit commas between columns, and always include the `AS` keyword when creating aliases to make your intentions clear to the parser.**

---



### Mistake 2: Attempting to Reference Column Aliases inside the `WHERE` Clause of the Same Query

**The mistake:** Writing `SELECT price * 1.1 AS taxed_price FROM products WHERE taxed_price > 100;`.

**Why it's wrong:** In SQL logical query execution order, `WHERE` evaluates BEFORE `SELECT` projection! Column aliases created in `SELECT` do NOT exist when `WHERE` executes. Repeat the expression or use CTE/Subquery.

*Incorrect:*
```sql
SELECT price * 1.1 AS taxed_price FROM products WHERE taxed_price > 100; -- ❌ Error: column does not exist!
```

*Fix:*
```sql
SELECT price * 1.1 AS taxed_price FROM products WHERE price * 1.1 > 100;
```

### Mistake 3: Using Single Quotes for Identifier Aliases Instead of Double Quotes or As Identifiers

**The mistake:** Writing `SELECT name AS 'User Name' FROM users;`.

**Why it's wrong:** Single quotes `'text'` denote string text literals, NOT identifier column names! Use double quotes `"User Name"` or snake_case `user_name` for column aliases.

*Incorrect:*
```sql
SELECT name AS 'User Name' FROM users; -- ❌ Single quotes used for identifier alias!
```

*Fix:*
```sql
SELECT name AS "User Name" FROM users; -- Double quotes for spaces in aliases
```

## 6. Practice Exercises

### Exercise 1: Clean Invoice Query

**Problem:** You have a table `invoices` with columns `id`, `unit_price`, `quantity`, and `shipping_fee`. Write a SQL query that calculates the total invoice cost as `(unit_price * quantity) + shipping_fee` and returns it as a column named `total_invoice_cost`.

**Expected output:**
> [!check]- Answer
> ```sql
> SELECT (unit_price * quantity) + shipping_fee AS total_invoice_cost 
> FROM invoices;
> ```
> - Construct the mathematical formula inside the `SELECT` projection.
> - Append the `AS` keyword followed by the requested target column label.

---



### Exercise 2: Table and Column Aliases in JOIN

**Problem:** Join `users` (alias `u`) and `orders` (alias `o`) selecting `u.name` and `o.total` as `order_total`.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT u.name, o.total AS order_total FROM users u JOIN orders o ON u.id = o.user_id;
> ```
> ```sql
> SELECT u.name, o.total AS order_total
> FROM users u
> JOIN orders o ON u.id = o.user_id;
> ```
>
> **Explanation:** Table aliases (`users u`) simplify qualified column references in JOIN queries.

---

### Exercise 3: Referencing Aliases in `ORDER BY`

**Problem:** Can column aliases created in `SELECT` be referenced in `ORDER BY`? (Yes, ORDER BY evaluates after SELECT).

**Expected output:**
> [!check]- Answer
> ```text
> Yes, ORDER BY evaluates after SELECT in SQL logical execution order
> ```
> ```text
> Yes, ORDER BY evaluates after SELECT in SQL logical execution order
> ```
>
> **Explanation:** `ORDER BY` executes after `SELECT` projection, making column aliases available for sorting.

## 7. Related Terms
- [`SELECT`](../level_03/select.md) — The parent query command.
- [Self-Join](../level_05/self_join.md) — Related concept: Self-Join.

---

## 8. Key Takeaways
- Aliases temporarily rename columns or tables inside a SQL query.
- Assigned using the `AS` keyword (e.g. `SELECT name AS user_name`).
- Column aliases simplify output keys for application client libraries.
- Table aliases shorten table references, keeping complex join statements readable.
- The `AS` keyword is optional, but omitting it can trigger silent missing-comma bugs.
