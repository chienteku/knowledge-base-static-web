# Stored Procedure (`CREATE PROCEDURE` / `CALL`)

> **Level 9 — Views, Functions & Advanced SQL**
> A reusable block of server-side database logic (introduced in PostgreSQL 11) that can accept inputs, execute DML queries, manage its own transactions (`COMMIT`/`ROLLBACK`), and is executed using the `CALL` statement.

---

## 1. Prerequisites
- [Stored Function (`CREATE FUNCTION`)](stored_function.md) — The transaction-locked inline alternative.

---

## 2. Term Category
- **Database Object / Abstraction Layer**

---

## 3. Environment Context
- **PostgreSQL Core** (Introduced in PostgreSQL 11. Unlike stored functions, procedures do not return values and cannot be executed inside standard `SELECT` query lists).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In `stored_function.md`, we learned that custom functions cannot control transactions. 

They cannot run `COMMIT` or `ROLLBACK` commands.

This makes them unusable for heavy, multi-step batch background jobs:
-   **Reconciliation script:** You want to loop through 100,000 transaction logs, process them, and **commit every batch of 100** to prevent locking rows for hours.
-   **Graceful error logging:** You want to attempt a credit card checkout. If it fails, you want to rollback the inventory update, but **commit** the error log to a history table.

Because functions cannot commit or roll back, running these scripts as functions forces all modifications to stay uncommitted in RAM, locking tables and risking connection drops.

We designed **Stored Procedures** (using the **`CREATE PROCEDURE`** command) to solve this transaction-control problem. 

Procedures run on the database server, but they own their transaction lifecycle. 

They can open and close transactions on-the-fly inside their code body.

---

### (2) The Invocation Difference
Because stored procedures manage their own transactions, they cannot be called inside queries (e.g. `SELECT name, my_proc() FROM users;` is illegal). 

Instead, you execute them explicitly using the **`CALL`** statement:

`CALL process_billing_queue();`

---

### (3) Reality Metaphor
-   **Stored Function (Inline Scanner):** A checkout scanner. You scan a barcode, and it returns a number (the price) instantly. It cannot decide to close the checkout counter or sign bank deposits (no transactions).
-   **Stored Procedure (Store Manager):** You hire a manager. You call them: *"Reorganize the storage lockers"* (`CALL organize_lockers()`). The manager goes to the lockers, moves items, locks drawers, commits locks, rolls back errors, and reports when done.

---

### (4) Code Examples

#### Creating and Calling a Stored Procedure
Let's build a procedure that performs a bank transfer and handles transaction boundaries:

```sql
CREATE TABLE accounts (id INT PRIMARY KEY, balance NUMERIC(10,2));
INSERT INTO accounts VALUES (1, 100.00), (2, 50.00);

-- Create the procedure
CREATE PROCEDURE transfer_funds(
  sender_id INT,
  receiver_id INT,
  amount NUMERIC
)
LANGUAGE plpgsql AS $$
BEGIN
  -- Perform debit
  UPDATE accounts SET balance = balance - amount WHERE id = sender_id;
  
  -- Perform credit
  UPDATE accounts SET balance = balance + amount WHERE id = receiver_id;
  
  -- Commit the transaction directly inside the procedure!
  COMMIT;
  
  -- Optional: Log success
  RAISE NOTICE 'Transfer of % completed successfully.', amount;
END;
$$;

-- Invoke the procedure using the CALL keyword
CALL transfer_funds(1, 2, 20.00);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to call a stored procedure inside a SELECT query

**The mistake:** Executing `SELECT name, run_batch_cleanup(id) FROM users;` inside an application script.

**Why it's wrong:** Procedures do not return values and are not designed to be evaluated inside query columns. 

Because they manage transactions, allowing them inside queries would mean a SELECT query could commit updates mid-row-read, violating read isolation rules. Postgres will block the query with a syntax error.

**Fix: Always execute stored procedures using the `CALL` keyword. If you need to transform or calculate a value inside a query list, rewrite the logic as a Stored Function.**

---



### Mistake 2: Confusing Stored Procedures (`PROCEDURE`) with Stored Functions (`FUNCTION`)

**The mistake:** Attempting to execute transactions (`COMMIT` / `ROLLBACK`) inside a `FUNCTION`.

**Why it's wrong:** In PostgreSQL, `FUNCTION`s CANNOT manage transaction boundaries (cannot execute `COMMIT`/`ROLLBACK`). Only `PROCEDURE`s created via `CREATE PROCEDURE` can manage transaction control inside procedure bodies.

*Incorrect:*
```sql
CREATE FUNCTION process() ... BEGIN COMMIT; END; -- ❌ Error: cannot commit inside a function!
```

*Fix:*
```sql
CREATE PROCEDURE process() ... BEGIN COMMIT; END; -- Procedures permit transaction control
```

### Mistake 3: Invoking Stored Procedures with `SELECT` Instead of `CALL`

**The mistake:** Executing `SELECT my_procedure();`.

**Why it's wrong:** Stored procedures MUST be invoked using the `CALL` statement (`CALL my_procedure();`), NOT `SELECT`.

*Incorrect:*
```sql
SELECT my_procedure(); -- ❌ Error: procedure cannot be called with SELECT!
```

*Fix:*
```sql
CALL my_procedure(); -- Correct procedure invocation
```

## 6. Practice Exercises

### Exercise 1: Bulk Status Update Procedure

**Problem:** You have a `tasks` table with a `status` column. Write the SQL queries to:
1.  Create a stored procedure named `archive_tasks` that updates the `status` of all tasks where `created_at < '2026-01-01'` to `'archived'`, and commits the transaction immediately.
2.  Write the SQL command to execute this procedure.

**Expected output:**
```sql
CREATE PROCEDURE archive_tasks()
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE tasks 
  SET status = 'archived' 
  WHERE created_at < '2026-01-01';
  
  COMMIT;
END;
$$;

CALL archive_tasks();
```

> [!check]- Answer
> - Define the procedure using `CREATE PROCEDURE` (no returns parameter is required).
> - Use the `CALL` statement to run the procedure.

---



### Exercise 2: Creating Stored Procedure with Internal Transaction Control

**Problem:** Create stored procedure `batch_cleanup()` executing transaction commit inside procedure body.

**Expected output:**
```text
CREATE OR REPLACE PROCEDURE batch_cleanup() AS $$ BEGIN DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days'; COMMIT; END; $$ LANGUAGE plpgsql;
```

> [!check]- Answer
> ```sql
> CREATE OR REPLACE PROCEDURE batch_cleanup() AS $$
> BEGIN
>   DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days';
>   COMMIT;
> END;
> $$ LANGUAGE plpgsql;
> ```
>
> **Explanation:** `CREATE PROCEDURE` allows issuing `COMMIT` and `ROLLBACK` commands mid-execution.

### Exercise 3: Calling Stored Procedure

**Problem:** Execute stored procedure `batch_cleanup()` using `CALL`.

**Expected output:**
```text
CALL batch_cleanup();
```

> [!check]- Answer
> ```sql
> CALL batch_cleanup();
> ```
>
> **Explanation:** `CALL procedure_name()` invokes stored procedures in PostgreSQL.

## 7. Related Terms
- [Stored Function (`CREATE FUNCTION`)](stored_function.md) — The transaction-locked inline alternative.
- [PL/pgSQL](plpgsql.md) — The programming language block wrapper.

---

## 8. Key Takeaways
- Stored procedures are server-side database code blocks that manage transactions.
- Supports running `COMMIT` and `ROLLBACK` commands inside the logic body.
- Invoked explicitly using the `CALL` keyword.
- Cannot be evaluated or executed inside standard SQL `SELECT` queries.
- Do not define return types (unlike stored functions).
- Best for batch background updates, data migrations, and reconciliation cron jobs.
