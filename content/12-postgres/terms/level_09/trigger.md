# Trigger

> **Level 9 — Views, Functions & Advanced SQL**
> A database object bound to a table that automatically executes a custom trigger function in response to specific write events (`INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE`).

---

## 1. Prerequisites
- [PL/pgSQL](plpgsql.md) — The language used to write trigger handlers.
- [Stored Function (`CREATE FUNCTION`)](stored_function.md) — The wrapper compiling the trigger logic.

---

## 2. Term Category
- **Database Object / Automations**

---

## 3. Environment Context
- **PostgreSQL Core** (Requires two SQL statements: `CREATE FUNCTION ... RETURNS TRIGGER` to define the logic, followed by `CREATE TRIGGER` to bind the function to a target table).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Data integrity must be protected at all times. 

Often, you need to execute code automatically when rows change:
-   **Auditing:** Logging who changed a client's status, when, and what the old value was.
-   **Validation:** Ensuring a start date is always earlier than an end date, rejecting the insert if it's invalid.
-   **Data Sync:** Automatically updating a cached column in another table.

If you write this logic inside your web application backend code (e.g. in your Node.js server):
-   It works fine for web requests.
-   However, if a database administrator logs in directly via a SQL terminal client to run updates, the application logic is bypassed. 

The audit logs are not written, creating security and compliance gaps.

We designed **Triggers** to solve this. 

A trigger is locked directly inside the database engine. 

Whenever a write query modifies the table (whether from a web app, a cron job, or a DBA terminal), the trigger executes automatically, guaranteeing compliance.

---

### (2) Trigger Timings and Special Variables

-   **`BEFORE` Timings:** Executed *before* the write is committed to the database. Allows you to modify values on-the-fly or cancel the insert by raising an exception.
-   **`AFTER` Timings:** Executed *after* the write completes. Ideal for updating other tables or writing audit logs.

Inside the PL/pgSQL trigger function, Postgres injects two special record variables:
-   **`NEW`:** Holds the new data row being inserted or updated.
-   **`OLD`:** Holds the old data row before it was updated or deleted.

---

### (3) Reality Metaphor
Imagine a physical building security door:
-   **Table:** The physical front entrance door.
-   **Write Event:** Opening the door to enter (an `INSERT`).
-   **Trigger:** A magnetic sensor switch glued to the door frame.
-   **Trigger Function:** A security alarm script.
-   Whenever a person opens the door, the magnetic sensor trips, automatically triggering the alarm bell or logging the timestamp in a guard's binder. The person entering doesn't need to write in the binder manually; the door sensor enforces the action.

---

### (4) Code Examples

#### Creating an Audit Log Trigger
Let's track price changes on a product table:

```sql
CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(50), price NUMERIC);
CREATE TABLE price_audit_logs (product_id INT, old_price NUMERIC, new_price NUMERIC, changed_at TIMESTAMP);

-- Step 1: Create the Trigger Function (Must return trigger type!)
CREATE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the price column actually changed
  IF NEW.price <> OLD.price THEN
    INSERT INTO price_audit_logs 
    VALUES (OLD.id, OLD.price, NEW.price, NOW());
  END IF;
  
  RETURN NEW; -- Returns the row to commit
END;
$$ LANGUAGE plpgsql;

-- Step 2: Bind the trigger function to the table
CREATE TRIGGER trg_on_price_update
AFTER UPDATE ON products -- Triggers on updates
FOR EACH ROW -- Executes for every row updated
EXECUTE FUNCTION log_price_change();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating infinite recursive trigger loop cascades

**The mistake:** Writing an `AFTER UPDATE ON products` trigger that runs an `UPDATE products ...` query inside its own trigger function body.

**Why it's wrong:** When the table is updated, the trigger fires. 

The trigger function updates the table again, which immediately fires the trigger a second time. 

The transaction enters an infinite loop. 

Postgres will consume memory stack allocations until it reaches its nesting limit and halts with a stack depth error.

**Fix: Avoid running DML modifications on the target table inside its own AFTER trigger. If you want to modify values on the active row before saving, use a `BEFORE` trigger and assign values directly to the `NEW` record (e.g. `NEW.price := 10;`) rather than running `UPDATE` queries.**

---



### Mistake 2: Forgetting to Return `NEW` in `BEFORE` Row Triggers (Returning NULL Cancels Mutation)

**The mistake:** Writing a `BEFORE INSERT` trigger function returning `NULL` without intending to abort insertion.

**Why it's wrong:** In `BEFORE` row triggers, returning `NEW` allows the row mutation to proceed. Returning `NULL` silently CANCELS the `INSERT` or `UPDATE` operation!

*Incorrect:*
```sql
CREATE FUNCTION my_trig() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); END; $$ LANGUAGE plpgsql; -- ❌ Returns NULL, canceling INSERT!
```

*Fix:*
```sql
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
```

### Mistake 3: Creating Recursive Infinite Trigger Loops

**The mistake:** Executing `UPDATE users SET score = score + 1` inside an `AFTER UPDATE ON users` trigger function.

**Why it's wrong:** Updating table `users` inside an `AFTER UPDATE ON users` trigger triggers the same trigger recursively until hitting stack depth overflow errors! Use `BEFORE` triggers to modify `NEW` attributes.

*Incorrect:*
```sql
// UPDATE users inside AFTER UPDATE ON users trigger -- ❌ Infinite recursion!
```

*Fix:*
```sql
Modify NEW.score directly inside BEFORE UPDATE trigger
```

## 6. Practice Exercises

### Exercise 1: Lowercase Username Trigger

**Problem:** You have a `users` table with a `username` text column. You want to ensure that usernames are always saved in clean, lower-case format to prevent duplicate login handles. 

Write the SQL queries to:
1.  Create a trigger function named `clean_username` returning a trigger that sets `NEW.username := LOWER(NEW.username);`.
2.  Create a `BEFORE INSERT OR UPDATE` trigger named `trg_clean_username` on the `users` table to enforce this logic.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE FUNCTION clean_username()
> RETURNS TRIGGER AS $$
> BEGIN
>   NEW.username := LOWER(NEW.username);
>   RETURN NEW;
> END;
> $$ LANGUAGE plpgsql;
> 
> CREATE TRIGGER trg_clean_username
> BEFORE INSERT OR UPDATE ON users
> FOR EACH ROW
> EXECUTE FUNCTION clean_username();
> ```
> - In BEFORE triggers, returning `NEW` is required to proceed with the insert.
> - Chain the trigger events using `INSERT OR UPDATE` in the trigger binding statement.

---



### Exercise 2: Auto-Updating `updated_at` Timestamp Trigger

**Problem:** Create `BEFORE UPDATE` trigger function `set_updated_at()` assigning `NEW.updated_at = NOW()` and attach to `users` table.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql; CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
> ```
> ```sql
> CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
> BEGIN
>   NEW.updated_at = NOW();
>   RETURN NEW;
> END;
> $$ LANGUAGE plpgsql;
>
> CREATE TRIGGER trg_users_updated_at
> BEFORE UPDATE ON users
> FOR EACH ROW EXECUTE FUNCTION set_updated_at();
> ```
>
> **Explanation:** `BEFORE UPDATE` triggers modify row attributes on `NEW` before disk write.

---

### Exercise 3: Trigger Timing Types

**Problem:** List 3 trigger execution timing modes in PostgreSQL (`BEFORE`, `AFTER`, `INSTEAD OF`).

**Expected output:**
> [!check]- Answer
> ```text
> BEFORE, AFTER, INSTEAD OF
> ```
> ```text
> BEFORE, AFTER, INSTEAD OF
> ```
>
> **Explanation:** Timing modes determine whether trigger logic executes before, after, or in place of row operations.

## 7. Related Terms
- [PL/pgSQL](plpgsql.md) — The parent procedural language.
- [Stored Function (`CREATE FUNCTION`)](stored_function.md) — The compiling wrapper.

---

## 8. Key Takeaways
- A Trigger automatically executes functions in response to table modifications.
- Guarantees audit compliance by locking automated logic inside the database.
- Enforces validations on `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` actions.
- Triggers are defined in two steps: create trigger function, then bind to table.
- Special variables `NEW` and `OLD` hold row data states.
- `BEFORE` triggers validate/modify inputs; `AFTER` triggers log transactions.
- Avoid recursive self-updates inside triggers to prevent infinite crash loops.
