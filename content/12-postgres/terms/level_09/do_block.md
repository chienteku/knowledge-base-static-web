# `DO` Block (Anonymous Code Block)

> **Level 9 — Views, Functions & Advanced SQL**
> The SQL DML command used to execute one-off, anonymous blocks of procedural code (PL/pgSQL) on-the-fly without registering a persistent function or procedure in the database catalog.

---

## 1. Prerequisites
- [PL/pgSQL](plpgsql.md) — The procedural language code compiled inside the block.

---

## 2. Term Category
- **SQL DDL / DML Statement**

---

## 3. Environment Context
- **PostgreSQL Core** (Runs immediately inside the session connection memory. Discarded immediately after execution completes).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: One-Off Data Migration

**Problem:** You have a `test_accounts` table. You want to write a one-off anonymous script using a `DO` block. 

The script should check if the table `test_accounts` contains more than 10 rows. If it does, truncate the table; otherwise, print a warning notice saying `'No action required.'`.

**Expected output:**
> [!check]- Answer
> ```sql
> DO $$
> DECLARE
>   row_count INT;
> BEGIN
>   SELECT COUNT(*) INTO row_count FROM test_accounts;
>   
>   IF row_count > 10 THEN
>     TRUNCATE TABLE test_accounts;
>     RAISE NOTICE 'Table truncated.';
>   ELSE
>     RAISE WARNING 'No action required.';
>   END IF;
> END $$;
> ```
> - Declare a variable to hold the counts.
> - Run the select count statement and save the output using `INTO row_count`.
> - Wrap the if-else branch inside the `BEGIN/END` block.

---



### Exercise 2: Anonymous DO Block Logging with RAISE NOTICE

**Problem:** Write `DO` block counting rows in `users` and printing result with `RAISE NOTICE`.

**Expected output:**
> [!check]- Answer
> ```text
> DO $$ DECLARE cnt INT; BEGIN SELECT COUNT(*) INTO cnt FROM users; RAISE NOTICE 'Total Users: %', cnt; END; $$ LANGUAGE plpgsql;
> ```
> ```sql
> DO $$
> DECLARE
>   cnt INT;
> BEGIN
>   SELECT COUNT(*) INTO cnt FROM users;
>   RAISE NOTICE 'Total Users: %', cnt;
> END;
> $$ LANGUAGE plpgsql;
> ```
>
> **Explanation:** `DO` blocks execute one-off procedural scripts using `RAISE NOTICE` logging.

---

### Exercise 3: Conditional DDL Execution inside DO Block

**Problem:** Write `DO` block checking if index `idx_custom` exists in `pg_indexes`, creating it if missing.

**Expected output:**
> [!check]- Answer
> ```text
> DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_custom') THEN CREATE INDEX idx_custom ON users (email); END IF; END; $$ LANGUAGE plpgsql;
> ```
> ```sql
> DO $$
> BEGIN
>   IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_custom') THEN
>     CREATE INDEX idx_custom ON users (email);
>   END IF;
> END;
> $$ LANGUAGE plpgsql;
> ```
>
> **Explanation:** `DO` blocks permit procedural dynamic DDL execution inside database migration scripts.

## 7. Related Terms
- [PL/pgSQL](plpgsql.md) — The parent procedural language.

---

## 8. Key Takeaways
- A `DO` block executes anonymous procedural code blocks on-the-fly.
- Excellent for data migrations, test seeding, and DBA maintenance tasks.
- Discarded from memory immediately after execution; leaves no system catalog footprint.
- Wrapped inside dollar-quoted delimiters (`$$`) to prevent quote escaping conflicts.
- Always returns `void`; cannot return variables or rows to the client query window.
- Defaults to the `plpgsql` compilation engine.
