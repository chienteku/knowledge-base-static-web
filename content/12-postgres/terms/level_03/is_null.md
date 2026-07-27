# `IS NULL` / `IS NOT NULL`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The specialized SQL comparison operators used to filter query results based on the presence (`IS NOT NULL`) or absence (`IS NULL`) of data.

---

## 1. Prerequisites
- [NULL](../level_02/null.md) — Understanding the absent state.
- [Comparison & Logical Operators](operators.md) — How basic SQL comparisons work.

---

## 2. Term Category
- **SQL Query Operator**

---

## 3. Environment Context
- **Universal Standard** (Enforced in all relational SQL query engines. Standardized by the ANSI-SQL spec).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When filtering data rows, you frequently need to check for missing information:
-   Find all orders that have not shipped yet (where `shipped_at` is empty).
-   Find all users who haven't completed email verification.
-   Find all transactions that do not have a discount applied.

In programming languages, you compare values directly to null (e.g. `if (value == null)`). 

However, as learned in Level 2 (`null.md`), **`NULL` in SQL is a special marker, not a value**. 

If you try to write standard comparisons:
-   `shipped_at = NULL`
-   `shipped_at != NULL`

The database engine returns `UNKNOWN` for every single row. Because `WHERE` clauses only return rows where the filter evaluates strictly to `TRUE`, these queries fail silently, returning **zero rows**.

To solve this, SQL introduced the dedicated operators **`IS NULL`** and **`IS NOT NULL`**. 

They check the *state* of the column cell directly, bypassing standard math value comparisons.

---

### (2) Reality Metaphor
Imagine sorting mailboxes:
-   **`WHERE letters = NULL`** is like walking up to a mailbox, opening a blank piece of paper, and asking: *"Is the text printed on this paper equal to the concept of absolute vacancy?"* The paper has no text, so you get no answer.
-   **`WHERE letters IS NULL`** is like looking at the mailbox door from the outside and asking: *"Is this mailbox physically empty?"* You can answer that with a clear "Yes" or "No."

---

### (3) Code Examples

#### Locating Missing Data
```sql
CREATE TABLE support_tickets (
  id INT PRIMARY KEY,
  subject VARCHAR(100),
  resolved_at TIMESTAMPTZ -- NULL if ticket is open
);

-- Find all unresolved (open) tickets
SELECT subject 
FROM support_tickets 
WHERE resolved_at IS NULL;
```

#### Locating Completed Data
```sql
-- Find all resolved (closed) tickets
SELECT subject 
FROM support_tickets 
WHERE resolved_at IS NOT NULL;
```

#### The Silent Failure Demo
```sql
-- WRONG: This query executes successfully but returns ZERO rows, 
-- even if you have hundreds of open tickets!
SELECT subject FROM support_tickets WHERE resolved_at = NULL;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `= NULL` or `!= NULL` inside query scripts

**The mistake:** Writing queries like `WHERE status = NULL` or `WHERE discount_percent != NULL` inside your backend application queries.

**Why it's wrong:** SQL engines process `= NULL` as an unknown equation. It will never return a row, making your application behave as if the database is completely empty.

**Fix: Train yourself to replace `= NULL` with `IS NULL`, and `!= NULL` (or `<> NULL`) with `IS NOT NULL`.**

---



### Mistake 2: Using Equality Operators (`= NULL`) to Filter Null Values

**The mistake:** Writing `SELECT * FROM users WHERE phone = NULL;`.

**Why it's wrong:** In SQL 3-valued logic, `anything = NULL` evaluates to `NULL` (Unknown), returning 0 rows! Always use `IS NULL` or `IS NOT NULL`.

*Incorrect:*
```sql
SELECT * FROM users WHERE phone = NULL; -- ❌ Always returns 0 rows!
```

*Fix:*
```sql
SELECT * FROM users WHERE phone IS NULL; -- Correct NULL predicate
```

### Mistake 3: Using `!= NULL` or `<> NULL` to Check Non-Null Values

**The mistake:** Writing `SELECT * FROM users WHERE phone != NULL;`.

**Why it's wrong:** `anything != NULL` evaluates to `NULL` (Unknown). Use `IS NOT NULL`.

*Incorrect:*
```sql
SELECT * FROM users WHERE phone != NULL; -- ❌ Returns 0 rows!
```

*Fix:*
```sql
SELECT * FROM users WHERE phone IS NOT NULL;
```

## 6. Practice Exercises

### Exercise 1: Query Bug Repair

**Problem:** You are building a billing portal. You write the following query to find the names of all customers who have **not** paid their invoices yet (where `payment_date` is blank):

```sql
-- Table columns: customer_name, payment_date
SELECT customer_name 
FROM invoices 
WHERE payment_date = NULL;
```

However, the dashboard displays an empty list. Fix the query so that it successfully locates unpaid customers.

**Expected output:**
```sql
SELECT customer_name 
FROM invoices 
WHERE payment_date IS NULL;
```

> [!check]- Answer
> - Identify the comparison operator in the `WHERE` clause.
> - Swap the equal operator for the dedicated missing state checker.

---



### Exercise 2: Filtering Missing Optional Fields

**Problem:** Query users missing both `phone` and `address` using `IS NULL`.

**Expected output:**
```text
SELECT * FROM users WHERE phone IS NULL AND address IS NULL;
```

> [!check]- Answer
> ```sql
> SELECT * FROM users WHERE phone IS NULL AND address IS NULL;
> ```
>
> **Explanation:** `IS NULL` filters rows lacking optional column values.

### Exercise 3: IS DISTINCT FROM Null-Safe Comparison

**Problem:** Compare column `status` to `'active'` safely when `status` can be NULL using `IS DISTINCT FROM`.

**Expected output:**
```text
SELECT * FROM users WHERE status IS DISTINCT FROM 'active';
```

> [!check]- Answer
> ```sql
> SELECT * FROM users WHERE status IS DISTINCT FROM 'active';
> ```
>
> **Explanation:** `IS DISTINCT FROM` treats NULL as a distinct value without returning Unknown.

## 7. Related Terms
- [NULL](../level_02/null.md) — The parent absent state.
- [`WHERE` Clause](where.md) — The query filter wrapper.

---

## 8. Key Takeaways
- You cannot use `=` or `!=` to compare columns to `NULL`.
- Direct comparisons with `NULL` yield `UNKNOWN`, which filters out the rows.
- Use `IS NULL` to query rows where a column contains missing or blank states.
- Use `IS NOT NULL` to query rows where a column has valid data.
- Ensure all nullable column filters in scripts use correct check syntax to avoid empty outputs.
