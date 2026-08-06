# `DO` Block (Anonymous Code Block)

> **Level 9 — Views, Functions & Advanced SQL**
> The SQL DML command used to execute one-off, anonymous blocks of procedural code (PL/pgSQL) on-the-fly without registering a persistent function or procedure in the database catalog.

---

## 1. Prerequisites
- [PL/pgSQL](plpgsql.md) — The procedural language code compiled inside the block.

---

## 2. Term Category

**Advanced Feature** (Anonymous Procedural Code Execution): `DO` blocks execute anonymous inline procedural PL/pgSQL code blocks without defining permanent schema functions.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Runs immediately inside the session connection memory. Discarded immediately after execution completes).

### (1) Design Motivation — "Why did we design this?"
As learned in `plpgsql.md`, procedural code is typically compiled inside a Stored Function or Stored Procedure.

However, database administrators (DBAs) and developers often need to run **one-off maintenance scripts** or data migrations:
-   Looping through all tables starting with `'temp_'` and dropping them.
-   Generating mock test data for a staging environment.
-   Running a quick loop to repair corrupted records.

Creating a stored function just to run it once and immediately delete it is tedious and pollutes the system catalog:
`CREATE FUNCTION temp_clean(); SELECT temp_clean(); DROP FUNCTION temp_clean();`

We designed the **`DO` Block** (Anonymous Code Block) to solve this scripting problem. 

It compiles and runs your PL/pgSQL code block immediately, executing the logic and discarding the compiler state without storing anything on disk.

---

### (2) The Dollar-Quoted Delimiter (`$$`)
Because PL/pgSQL blocks contain many single quotes (e.g. `'active'`), wrapping the code block inside standard SQL string quotes would force you to escape every single quote, leading to syntax errors. 

Postgres uses **dollar-quoting** (`$$`) to wrap the code block cleanly:

```sql
DO $$ 
BEGIN 
  -- Code here doesn't need single-quote escaping
END $$;
```

---

### (3) Reality Metaphor
Imagine performing math equations at your desk:
-   **Stored Function:** Programming a custom **macro function** into your Excel spreadsheet catalog. It is saved in the workbook, and you can reuse it next month.
-   **`DO` Block:** Grabbing a **scratch sticky note**, writing a quick math formula, reading the result, and throwing the sticky note in the trash. It leaves no permanent trace in your office files.

---

### (4) Code Examples

#### Run-Once Script with Loops
Let's write an anonymous block that generates mock records:

```sql
CREATE TABLE test_accounts (id INT, status VARCHAR(20));

-- Start anonymous block (PL/pgSQL is default language)
DO $$
DECLARE
  i INT;
BEGIN
  -- Run a loop to insert 5 test records
  FOR i IN 1..5 LOOP
    INSERT INTO test_accounts VALUES (i, 'active');
  END LOOP;
  
  -- Print log message to console
  RAISE NOTICE 'Seeded 5 test accounts successfully.';
END $$;

-- Verify changes
SELECT * FROM test_accounts;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to return query outputs or values from a DO block

**The mistake:** Writing a `RETURN` statement inside a `DO` block to output a calculated number to the query window:

```sql
-- BAD: Fails with a syntax error!
DO $$
BEGIN
  RETURN 42;
END $$;
-- ERROR: RETURN cannot have a parameter in function returning void
```

**Why it's wrong:** `DO` blocks are anonymous and always return `void` (nothing). 

Because they have no output pipeline interface, they cannot stream rows or return values back to the client.

**Fix: If you need to print output calculations to the console, use `RAISE NOTICE` commands inside the `DO` block. If you want the script to return actual tables or values to the caller, compile it as a Stored Function instead.**

---



### Mistake 2: Attempting to Return Table Result Sets from Anonymous `DO` Blocks

**The mistake:** Writing a `DO $$ BEGIN SELECT * FROM users; END; $$;` block expecting query rows output.

**Why it's wrong:** Anonymous `DO` blocks execute procedural PL/pgSQL code but CANNOT return result sets to the client! Use `RAISE NOTICE` for logging or write a `FUNCTION` returning a table.

*Incorrect:*
```sql
DO $$ BEGIN SELECT * FROM users; END; $$; -- ❌ Error: SELECT query has no destination!
```

*Fix:*
```sql
DO $$ BEGIN RAISE NOTICE 'Hello World'; END; $$;
```

### Mistake 3: Omitting Language Specification in `DO` Blocks

**The mistake:** Writing `DO $$ BEGIN ... END; $$;` on databases where PL/Python or PL/Perl are installed.

**Why it's wrong:** Although PL/pgSQL is default, explicitly specifying `LANGUAGE plpgsql` prevents language driver ambiguity.

*Incorrect:*
```sql
DO $$ BEGIN ... END; $$;
```

*Fix:*
```sql
DO $$ BEGIN ... END; $$ LANGUAGE plpgsql;
```

## 5. Practice Exercises

### Exercise 1: Executing Anonymous Procedural Scripts with `DO` Blocks

**Scenario:**
Execute an anonymous `DO` block to seed 100 test user rows in a loop for local development testing.

**Requirements:**
1. Execute `DO $$ BEGIN FOR i IN 1..100 LOOP ... END LOOP; END $$;`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> DO $$ 
> BEGIN 
>   FOR i IN 1..100 LOOP 
>     INSERT INTO users (username, email) 
>     VALUES ('user_' || i, 'user_' || i || '@example.com');
>   END LOOP;
> END $$;
> ```
>
> #### Technical Explanation
>
> 1. `DO $$ ... $$` executes anonymous inline PL/pgSQL procedural code blocks.
> 2. Supports `FOR` loops, `IF` conditionals, and local variable declarations.
> 3. Does NOT create permanent schema objects or return query result sets.
> 
---

### Exercise 2: Conditional Schema Migrations inside `DO` Blocks

**Scenario:**
Check if column `is_verified` exists on table `users`; if missing, execute `ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE`.

**Requirements:**
1. Inspect `information_schema.columns` inside a `DO` block conditional.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> DO $$ 
> BEGIN 
>   IF NOT EXISTS (
>     SELECT 1 
>     FROM information_schema.columns 
>     WHERE table_name = 'users' AND column_name = 'is_verified'
>   ) THEN 
>     ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE;
>   END IF;
> END $$;
> ```
>
> #### Technical Explanation
>
> 1. Executes dynamic DDL statements based on runtime schema conditions.
> 2. Prevents script errors during automated migration pipelines.
> 3. Idempotent schema migration pattern.
> 
---

### Exercise 3: Exception Handling in Anonymous Procedural Blocks

**Scenario:**
Catch unique violation exceptions inside a `DO` block loop using `EXCEPTION WHEN unique_violation THEN`.

**Requirements:**
1. Code `EXCEPTION` handler block inside PL/pgSQL loop.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> DO $$ 
> BEGIN 
>   INSERT INTO users (username, email) VALUES ('alice', 'alice@example.com');
> EXCEPTION 
>   WHEN unique_violation THEN 
>     RAISE NOTICE 'Skipping insert: User already exists!';
> END $$;
> ```
>
> #### Technical Explanation
>
> 1. `EXCEPTION WHEN ... THEN` intercepts PL/pgSQL runtime errors gracefully.
> 2. `RAISE NOTICE` outputs informative log messages to the client console without aborting the block.
> 3. Robust procedural scripting.
> 
---



## 6. Related Terms
- [PL/pgSQL](plpgsql.md) — The parent procedural language.

---

## 7. Key Takeaways
- A `DO` block executes anonymous procedural code blocks on-the-fly.
- Excellent for data migrations, test seeding, and DBA maintenance tasks.
- Discarded from memory immediately after execution; leaves no system catalog footprint.
- Wrapped inside dollar-quoted delimiters (`$$`) to prevent quote escaping conflicts.
- Always returns `void`; cannot return variables or rows to the client query window.
- Defaults to the `plpgsql` compilation engine.
