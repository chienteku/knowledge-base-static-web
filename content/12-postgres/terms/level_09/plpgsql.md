# PL/pgSQL

> **Level 9 — Views, Functions & Advanced SQL**
> PostgreSQL's native procedural programming language that extends SQL with variables, conditional loops (`IF`/`FOR`), exception blocks, and error handling, compiled directly on the database server.

---

## 1. Prerequisites
- [Stored Function (`CREATE FUNCTION`)](stored_function.md) — The wrapper objects compiling PL/pgSQL.

---

## 2. Term Category

**Advanced Feature** (Procedural Language Extension): PL/pgSQL is PostgreSQL's native procedural programming language adding control structures (`IF`, `LOOP`, `EXCEPTION`) and variable bindings to SQL.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Specific** (PostgreSQL's built-in PL compiler. Competes with Oracle's PL/SQL and SQL Server's Transact-SQL (T-SQL)).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Authoring Procedural Control Logic in PL/pgSQL

**Scenario:**
Write a PL/pgSQL function `get_user_discount(user_id INT)` returning `0.20` for VIPs, `0.10` for active users, and `0.00` for default users.

**Requirements:**
1. Use `IF ... ELSIF ... ELSE ... END IF;` inside PL/pgSQL block.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE OR REPLACE FUNCTION get_user_discount(p_user_id INTEGER) 
> RETURNS NUMERIC AS $$
> DECLARE
>   v_total_spent NUMERIC;
> BEGIN
>   SELECT COALESCE(SUM(total_cents) / 100.0, 0) INTO v_total_spent 
>   FROM orders 
>   WHERE customer_id = p_user_id;
>   
>   IF v_total_spent >= 1000 THEN
>     RETURN 0.20;
>   ELSIF v_total_spent >= 500 THEN
>     RETURN 0.10;
>   ELSE
>     RETURN 0.00;
>   END IF;
> END;
> $$ LANGUAGE plpgsql;
> ```
>
> #### Technical Explanation
>
> 1. PL/pgSQL adds procedural language capabilities (`DECLARE`, `IF/ELSIF/ELSE`, `INTO variable`).
> 2. `SELECT ... INTO v_total_spent` assigns query scalar outputs to local variables.
> 3. Encapsulates business logic directly inside the database server.
> 
---

### Exercise 2: Looping over Query Cursor Record Sets

**Scenario:**
Write a PL/pgSQL loop iterating over inactive users (`FOR r IN SELECT ... LOOP`) to output audit log notices.

**Requirements:**
1. Execute `FOR r IN SELECT ... LOOP ... END LOOP;`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE OR REPLACE FUNCTION audit_inactive_users() 
> RETURNS VOID AS $$
> DECLARE
>   r RECORD;
> BEGIN
>   FOR r IN SELECT id, username FROM users WHERE is_active = FALSE LOOP
>     RAISE NOTICE 'Inactive User Found: ID = %, Name = %', r.id, r.username;
>   END LOOP;
> END;
> $$ LANGUAGE plpgsql;
> ```
>
> #### Technical Explanation
>
> 1. `FOR record_var IN query LOOP` iterates over result set rows sequentially.
> 2. `record_var.field` accesses individual column values of the current iteration row.
> 3. Procedural batch processing.
> 
---

### Exercise 3: Trapping Errors with Exception Blocks

**Scenario:**
Catch `division_by_zero` exceptions inside a PL/pgSQL function, returning `NULL` on error.

**Requirements:**
1. Use `EXCEPTION WHEN division_by_zero THEN RETURN NULL;`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE OR REPLACE FUNCTION safe_ratio(val1 NUMERIC, val2 NUMERIC) 
> RETURNS NUMERIC AS $$
> BEGIN
>   RETURN val1 / val2;
> EXCEPTION 
>   WHEN division_by_zero THEN 
>     RETURN NULL;
> END;
> $$ LANGUAGE plpgsql;
> ```
>
> #### Technical Explanation
>
> 1. `EXCEPTION WHEN error_condition THEN` intercepts runtime errors.
> 2. Prevents unexpected exceptions from aborting the parent transaction.
> 3. Robust procedural error handling.
> 
---



## 6. Related Terms
- [Stored Function (`CREATE FUNCTION`)](stored_function.md) — The compiling wrapper.
- [`DO` Block (Anonymous Code Block)](do_block.md) — Running script loops on-the-fly.
- [Stored Procedure (`CREATE PROCEDURE` / `CALL`)](stored_procedure.md) — Related concept: Stored Procedure (`CREATE PROCEDURE` / `CALL`).
- [Trigger](trigger.md) — Related concept: Trigger.

---

## 7. Key Takeaways
- PL/pgSQL extends SQL with variables, loops, conditionals, and catch blocks.
- Compiles and executes entirely on the database server to save network lag.
- Follows a structured layout: `DECLARE` (variables), `BEGIN/END` (execution).
- Supports error handling using the `EXCEPTION WHEN` block.
- Avoid using PL/pgSQL loops to update tables; default to faster SQL set queries.
- Used to program stored functions, procedures, and trigger handlers.
