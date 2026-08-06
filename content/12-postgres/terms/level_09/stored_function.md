# Stored Function (`CREATE FUNCTION`)

> **Level 9 — Views, Functions & Advanced SQL**
> A reusable block of database logic stored in the system catalog that accepts inputs, executes queries or calculations, and returns a value or row set, runnable directly inside SQL queries.

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The query language inside the function.

---

## 2. Term Category

**Advanced Feature** (Schema Stored Scalar/Table Functions): Stored Functions (`CREATE FUNCTION`) encapsulate reusable SQL or PL/pgSQL logic returning scalar values or table record sets.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Fully supported. Stored functions run inside the caller's active transaction block and **cannot** manage transactions natively (no `COMMIT` or `ROLLBACK` allowed inside the body)).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Creating Scalar Stored Functions (`CREATE FUNCTION`)

**Scenario:**
Create a SQL stored function `calculate_tax(amount_cents NUMERIC)` returning 8% sales tax.

**Requirements:**
1. Execute `CREATE OR REPLACE FUNCTION calculate_tax ...`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE OR REPLACE FUNCTION calculate_tax(p_amount_cents NUMERIC) 
> RETURNS NUMERIC 
> LANGUAGE SQL 
> IMMUTABLE 
> AS $$
>   SELECT ROUND(p_amount_cents * 0.08, 2);
> $$;
> 
> SELECT calculate_tax(1000); -- Returns 80.00
> ```
>
> #### Technical Explanation
>
> 1. `CREATE FUNCTION` encapsulates SQL calculations into a reusable schema function.
> 2. `IMMUTABLE` informs the query planner that the function always returns the exact same result for given input arguments.
> 3. Allows inline query optimization.

---

### Exercise 2: Creating Table-Valued Functions (`RETURNS TABLE`)

**Scenario:**
Create a stored function `get_active_orders_by_customer(cust_id INT)` returning a set of order records.

**Requirements:**
1. Use `RETURNS TABLE (order_id INT, total NUMERIC)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE OR REPLACE FUNCTION get_active_orders_by_customer(p_cust_id INTEGER) 
> RETURNS TABLE (
>   order_id INTEGER, 
>   total_cents INTEGER, 
>   created_at TIMESTAMPTZ
> ) 
> LANGUAGE SQL 
> STABLE 
> AS $$
>   SELECT id, total_cents, created_at 
>   FROM orders 
>   WHERE customer_id = p_cust_id AND status = 'pending';
> $$;
> 
> SELECT * FROM get_active_orders_by_customer(10);
> ```
>
> #### Technical Explanation
>
> 1. `RETURNS TABLE (...)` defines a table-valued function returning multiple rows and columns.
> 2. Invoked in SQL `FROM` clauses like a standard table relation.
> 3. Encapsulates parameterized data retrieval.

---

### Exercise 3: Function Volatility Categories (`IMMUTABLE`, `STABLE`, `VOLATILE`)

**Scenario:**
Formulate a selection matrix explaining when to mark stored functions as `IMMUTABLE`, `STABLE`, or `VOLATILE`.

**Requirements:**
1. Contrast function volatility optimization impact.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Function Volatility Selection Matrix:
> - IMMUTABLE: Pure math functions (e.g. 2 + 2, tax calculation). Never touches database tables! Can be used in Expression Indexes.
> - STABLE: Reads database tables or configuration, but returns identical output within the SAME query (e.g. NOW(), table lookup).
> - VOLATILE (Default): Modifies data (INSERT/UPDATE), uses random values (gen_random_uuid()), or side-effects. Cannot be in Expression Indexes!
> ```
>
> #### Technical Explanation
>
> 1. Correct volatility markings allow PostgreSQL to cache function evaluations within queries.
> 2. `IMMUTABLE` functions can be used inside Expression Indexes.
> 3. Crucial for function optimization.

---



## 6. Related Terms
- [Stored Procedure (`CREATE PROCEDURE` / `CALL`)](stored_procedure.md) — The transaction-managing alternative.
- [PL/pgSQL](plpgsql.md) — The procedural language layout.
- [Trigger](trigger.md) — Related concept: Trigger.

---

## 7. Key Takeaways
- Stored functions are reusable code blocks registered directly in the database.
- Executable inline inside standard SELECT statements.
- Can accept parameters and return single scalar values or tables.
- Written using standard `sql` syntax or procedural `plpgsql` engines.
- Strictly forbidden from executing transaction controls (`COMMIT`/`ROLLBACK`).
- Speeds up application queries by keeping calculations on the database server.
