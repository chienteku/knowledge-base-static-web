# Stored Function (`CREATE FUNCTION`)

> **Level 9 — Views, Functions & Advanced SQL**
> A reusable block of database logic stored in the system catalog that accepts inputs, executes queries or calculations, and returns a value or row set, runnable directly inside SQL queries.

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The query language inside the function.
- [PL/pgSQL](plpgsql.md) — Forward reference: the procedural language blocks commonly used.

---

## 2. Term Category
- **Database Object / Abstraction Layer**

---

## 3. Environment Context
- **PostgreSQL Core** (Fully supported. Stored functions run inside the caller's active transaction block and **cannot** manage transactions natively (no `COMMIT` or `ROLLBACK` allowed inside the body)).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
SQL provides dozens of built-in functions like `LOWER()`, `ROUND()`, and `NOW()`.

However, applications often have custom business rules that are reused everywhere:
-   Calculating a product's final sale tax based on its category and state code.
-   Formatting an address block from street, city, and zip columns.

If you calculate these inside your application code (e.g. in JavaScript):
1.  You must select the raw fields from the database.
2.  Send them over the network to your server.
3.  Perform the calculation in JS.
4.  Send the results back if saving.

This causes unnecessary network roundtrips.

We designed **Stored Functions** to solve this. 

A stored function allows you to save custom calculation logic directly on the database server. 

Because it is registered in the database catalog, you can call it inline inside any standard SQL query:
`SELECT name, calculate_tax(price, 'CA') FROM products;`

---

### (2) Languages and Transaction Limits
Postgres allows writing stored functions in standard `SQL` or its native procedural language `PL/pgSQL`. 

However, stored functions carry a strict limitation: **they cannot manage transactions.** 

You cannot execute `COMMIT` or `ROLLBACK` commands inside the body of a stored function. 

If the function is executed, it runs inside the active transaction of the parent query that called it.

---

### (3) Reality Metaphor
Imagine a grocery checkout cash register:
-   The cash register has standard keys: `[+]`, `[-]`, `[Total]`.
-   **Stored Function:** The manager programs a custom **"California Tax Button"** onto the register dashboard. When a clerk scans a product and presses the button (providing the price as input), the register instantly computes the tax value on-the-fly. The clerk doesn't need to open a manual catalog or look up calculators under the desk.

---

### (4) Code Examples

#### 1. A Simple SQL-Language Function
For basic calculations, write standard SQL:

```sql
CREATE FUNCTION add_sales_tax(price NUMERIC)
RETURNS NUMERIC AS $$
  -- The function body simply runs a select math calculation
  SELECT price * 1.08;
$$ LANGUAGE sql;

-- Call the function inline in a query
SELECT id, price, add_sales_tax(price) AS price_with_tax 
FROM products;
```

#### 2. A PL/pgSQL-Language Function
For logic containing variables and conditional checks, use `plpgsql`:

```sql
CREATE FUNCTION get_discount_price(price NUMERIC, category VARCHAR)
RETURNS NUMERIC AS $$
DECLARE
  discount_rate NUMERIC := 0.0;
BEGIN
  IF category = 'electronics' THEN
    discount_rate := 0.10; -- 10% off
  ELSIF category = 'books' THEN
    discount_rate := 0.20; -- 20% off
  END IF;
  
  RETURN price * (1 - discount_rate);
END;
$$ LANGUAGE plpgsql;

-- Query utilizing the custom discount rules
SELECT name, get_discount_price(price, category) FROM products;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to run COMMIT or ROLLBACK statements inside a stored function

**The mistake:** Writing a stored function that updates accounts, and adding a `COMMIT` command inside the body to "make sure the data is saved."

**Why it's wrong:** PostgreSQL will throw a runtime error. Stored functions are evaluated inline inside SELECT statements (e.g. `SELECT func()`). 

Because SQL queries cannot commit transactions mid-flight, functions are forbidden from controlling transactions.

**Fix: If you need to write multi-step logic that controls transactions (commits/rollbacks) on-the-fly, use a [Stored Procedure](stored_procedure.md) instead of a stored function.**

---



### Mistake 2: Marking Volatile Database Query Functions as `IMMUTABLE`

**The mistake:** Creating a function executing `SELECT * FROM users` marked as `IMMUTABLE`.

**Why it's wrong:** Marking a function `IMMUTABLE` promises the query optimizer that function output NEVER changes for fixed inputs. If table rows mutate, the planner serves stale cached results! Mark as `VOLATILE` or `STABLE`.

*Incorrect:*
```sql
CREATE FUNCTION get_user(uid INT) RETURNS users AS $$ ... $$ LANGUAGE plpgsql IMMUTABLE; -- ❌ Stale data cache!
```

*Fix:*
```sql
CREATE FUNCTION get_user(uid INT) RETURNS users AS $$ ... $$ LANGUAGE plpgsql STABLE;
```

### Mistake 3: Overusing Stored Functions for Basic Business Logic That Belongs in Application Code

**The mistake:** Writing complex multi-thousand line PL/pgSQL functions for application UI business logic.

**Why it's wrong:** Stored functions are harder to version control, test, and step-debug than standard application code. Reserve stored functions for data-intensive engine operations.

*Incorrect:*
```sql
// Multi-thousand line PL/pgSQL stored function for app UI formatting
```

*Fix:*
```sql
Implement UI business logic in application code; use functions for heavy DB computations
```

## 6. Practice Exercises

### Exercise 1: Initials Formatter Function

**Problem:** Write the SQL query to create a stored function named `get_initials` that accepts two text parameters (`first_name` and `last_name`) and returns a text containing their upper-case initials combined (e.g., input `'john'`, `'doe'` returns `'J.D.'`). Use the standard `sql` language.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE FUNCTION get_initials(first_name TEXT, last_name TEXT)
> RETURNS TEXT AS $$
>   SELECT UPPER(SUBSTRING(first_name FROM 1 FOR 1)) || '.' || UPPER(SUBSTRING(last_name FROM 1 FOR 1)) || '.';
> $$ LANGUAGE sql;
> ```
> - Use the `SUBSTRING` function to grab the first letter of each text string.
> - Concatenate the strings using `||`.
> - Wrap the output in `UPPER()`.

---



### Exercise 2: Function Volatility Categories

**Problem:** List 3 function volatility categories in PostgreSQL (`VOLATILE`, `STABLE`, `IMMUTABLE`).

**Expected output:**
> [!check]- Answer
> ```text
> VOLATILE, STABLE, IMMUTABLE
> ```
> ```text
> VOLATILE, STABLE, IMMUTABLE
> ```
>
> **Explanation:** Volatility categories inform the PostgreSQL query planner when function outputs can be cached.

---

### Exercise 3: Table-Valued Stored Function

**Problem:** Create stored function `get_active_users()` returning `TABLE (id INT, name TEXT)`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE OR REPLACE FUNCTION get_active_users() RETURNS TABLE (id INT, name TEXT) AS $$ BEGIN RETURN QUERY SELECT u.id, u.name FROM users u WHERE u.active IS TRUE; END; $$ LANGUAGE plpgsql STABLE;
> ```
> ```sql
> CREATE OR REPLACE FUNCTION get_active_users()
> RETURNS TABLE (id INT, name TEXT) AS $$
> BEGIN
>   RETURN QUERY SELECT u.id, u.name FROM users u WHERE u.active IS TRUE;
> END;
> $$ LANGUAGE plpgsql STABLE;
> ```
>
> **Explanation:** `RETURNS TABLE (...)` defines stored functions returning tabular row sets.

## 7. Related Terms
- [Stored Procedure (`CREATE PROCEDURE` / `CALL`)](stored_procedure.md) — The transaction-managing alternative.
- [PL/pgSQL](plpgsql.md) — The procedural language layout.

---

## 8. Key Takeaways
- Stored functions are reusable code blocks registered directly in the database.
- Executable inline inside standard SELECT statements.
- Can accept parameters and return single scalar values or tables.
- Written using standard `sql` syntax or procedural `plpgsql` engines.
- Strictly forbidden from executing transaction controls (`COMMIT`/`ROLLBACK`).
- Speeds up application queries by keeping calculations on the database server.
