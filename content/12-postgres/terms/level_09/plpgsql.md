# PL/pgSQL

> **Level 9 — Views, Functions & Advanced SQL**
> PostgreSQL's native procedural programming language that extends SQL with variables, conditional loops (`IF`/`FOR`), exception blocks, and error handling, compiled directly on the database server.

---

## 1. Prerequisites
- [Stored Function (`CREATE FUNCTION`)](stored_function.md) — The wrapper objects compiling PL/pgSQL.
- [Stored Procedure (`CREATE PROCEDURE` / `CALL`)](stored_procedure.md) — The transaction wrappers compiling PL/pgSQL.

---

## 2. Term Category
- **PostgreSQL Programming Language**

---

## 3. Environment Context
- **PostgreSQL Specific** (PostgreSQL's built-in PL compiler. Competes with Oracle's PL/SQL and SQL Server's Transact-SQL (T-SQL)).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard SQL is **declarative**. 

It lacks basic programming structures:
-   You cannot declare temporary memory variables.
-   You cannot write `IF/ELSE` branches.
-   You cannot write loops (`FOR` or `WHILE`).
-   You cannot write `try/catch` exception blocks to capture errors.

If you wanted to write a complex script (like calculating a user's loyalty points by checking their history, looping through active coupons, and applying discount logic), you would have to write the loops in Node.js or Python, sending multiple queries back and forth.

PostgreSQL designed **PL/pgSQL** (Procedural Language/PostgreSQL) to solve this. 

It compiles directly inside the PostgreSQL engine, allowing you to write procedural logic on the database server. 

This lets you automate complex database tasks with programming controls, saving network overhead.

---

### (2) Basic PL/pgSQL Structure
PL/pgSQL code is organized into structured blocks:

```sql
DECLARE
  -- Variables are declared here
  my_counter INT := 0;
BEGIN
  -- Execution logic goes here
  IF my_counter = 0 THEN
    -- do something
  END IF;
EXCEPTION
  -- Error handling (like try/catch) goes here
  WHEN division_by_zero THEN
    -- handle error
END;
```

---

### (3) Reality Metaphor
Imagine a restaurant kitchen:
-   **Declarative SQL (takeout customer):** You hand the kitchen an order sheet: *"Give me Chicken Fried Rice."* (what you want). You have no control over how the chef chops the onions or Stirs the wok.
-   **PL/pgSQL (Head Chef):** You write a detailed **manual recipe guide** for the kitchen: *"Take 2 onions (Declare variables). If the pan is hot (IF check), stir-fry for 3 loops (FOR loop). If a grease fire occurs, use the fire extinguisher (Exception handler)."*

---

### (4) Code Examples

#### PL/pgSQL Block with Variables, Conditional, and Loop
Let's see variables, loops, and conditions working together inside a stored function:

```sql
CREATE FUNCTION compute_factorial(n INT)
RETURNS INT AS $$
DECLARE
  -- Declare variables and initialize values
  result INT := 1;
  i INT;
BEGIN
  -- Validation check (Conditional)
  IF n < 0 THEN
    RAISE EXCEPTION 'Input must be positive.';
  END IF;
  
  -- Iteration loop (FOR loop)
  FOR i IN 1..n LOOP
    result := result * i;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT compute_factorial(5); -- Returns 120
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using PL/pgSQL loops to process data that could be updated using simple SQL set-based queries

**The mistake:** Writing a PL/pgSQL `FOR` loop to iterate through every row of a table to add sales tax to prices one-by-one:

```sql
-- BAD: Slow row-by-row iteration loop!
FOR row_record IN SELECT * FROM products LOOP
  UPDATE products SET price = row_record.price * 1.08 WHERE id = row_record.id;
END LOOP;
```

**Why it's wrong:** Relational databases are optimized for **set-based mathematics**. 

Row-by-row loop updates (sometimes called "RBAR" or Row-By-Agonizing-Row processing) bypass compiler optimization, trigger massive I/O loops, and are hundreds of times slower than a simple, single SQL statement.

**Fix: Always try to write operations using standard, declarative SQL statements first. Only use PL/pgSQL loops if your logic cannot be solved using standard SQL joins and filters.**

```sql
-- CORRECT (Hundreds of times faster!)
UPDATE products SET price = price * 1.08;
```

---



### Mistake 2: Forgetting `INTO` Target Variable Assignments in PL/pgSQL `SELECT` Statements

**The mistake:** Writing `SELECT name FROM users WHERE id = user_id;` inside a PL/pgSQL function body.

**Why it's wrong:** In PL/pgSQL, `SELECT` statements MUST specify an assignment target using `INTO var_name` (or `PERFORM`). Executing un-assigned `SELECT` statements throws error `query has no destination for result data`.

*Incorrect:*
```sql
BEGIN SELECT name FROM users WHERE id = uid; END; -- ❌ Missing INTO destination!
```

*Fix:*
```sql
BEGIN SELECT name INTO u_name FROM users WHERE id = uid; END;
```

### Mistake 3: Using `SELECT` Instead of `PERFORM` When Calling Void Functions in PL/pgSQL

**The mistake:** Writing `SELECT pg_advisory_xact_lock(1);` inside a PL/pgSQL function.

**Why it's wrong:** When calling functions whose return output is discarded, PL/pgSQL requires the `PERFORM` keyword instead of `SELECT`.

*Incorrect:*
```sql
SELECT pg_advisory_xact_lock(1); -- ❌ Query has no destination!
```

*Fix:*
```sql
PERFORM pg_advisory_xact_lock(1); -- Correct PL/pgSQL void execution
```

## 6. Practice Exercises

### Exercise 1: Safe Division Function

**Problem:** Write a PL/pgSQL stored function named `safe_divide` that accepts two numeric parameters (`numerator` and `denominator`) and returns a numeric result. 

If the `denominator` is `0`, catch the exception using the PL/pgSQL `EXCEPTION WHEN division_by_zero` block, log a warning message, and return `0.00`.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE FUNCTION safe_divide(numerator NUMERIC, denominator NUMERIC)
> RETURNS NUMERIC AS $$
> BEGIN
>   RETURN numerator / denominator;
> EXCEPTION
>   WHEN division_by_zero THEN
>     RAISE WARNING 'Attempted to divide by zero.';
>     RETURN 0.00;
> END;
> $$ LANGUAGE plpgsql;
> ```
> - Write the division calculation inside the main `BEGIN/END` block.
> - Append the `EXCEPTION` block at the bottom before the closing `END;` statement.

---



### Exercise 2: Writing Basic PL/pgSQL Function

**Problem:** Create PL/pgSQL function `add_numbers(a INT, b INT)` returning integer sum `a + b`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE OR REPLACE FUNCTION add_numbers(a INT, b INT) RETURNS INT AS $$ BEGIN RETURN a + b; END; $$ LANGUAGE plpgsql;
> ```
> ```sql
> CREATE OR REPLACE FUNCTION add_numbers(a INT, b INT)
> RETURNS INT AS $$
> BEGIN
>   RETURN a + b;
> END;
> $$ LANGUAGE plpgsql;
> ```
>
> **Explanation:** PL/pgSQL functions define procedural logic executing inside the PostgreSQL engine.

---

### Exercise 3: SELECT INTO Variable Assignment

**Problem:** Assign user `email` to variable `v_email` inside PL/pgSQL block.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT email INTO v_email FROM users WHERE id = p_user_id;
> ```
> ```sql
> SELECT email INTO v_email FROM users WHERE id = p_user_id;
> ```
>
> **Explanation:** `SELECT col INTO var` assigns query result attributes to declared PL/pgSQL variables.

## 7. Related Terms
- [Stored Function (`CREATE FUNCTION`)](stored_function.md) — The compiling wrapper.
- [`DO` Block (Anonymous Code Block)](do_block.md) — Running script loops on-the-fly.

---

## 8. Key Takeaways
- PL/pgSQL extends SQL with variables, loops, conditionals, and catch blocks.
- Compiles and executes entirely on the database server to save network lag.
- Follows a structured layout: `DECLARE` (variables), `BEGIN/END` (execution).
- Supports error handling using the `EXCEPTION WHEN` block.
- Avoid using PL/pgSQL loops to update tables; default to faster SQL set queries.
- Used to program stored functions, procedures, and trigger handlers.
