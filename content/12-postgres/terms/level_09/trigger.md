# Trigger

> **Level 9 — Views, Functions & Advanced SQL**
> A database object bound to a table that automatically executes a custom trigger function in response to specific write events (`INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE`).

---

## 1. Prerequisites
- [PL/pgSQL](plpgsql.md) — The language used to write trigger handlers.
- [Stored Function (`CREATE FUNCTION`)](stored_function.md) — The wrapper compiling the trigger logic.

---

## 2. Term Category

**Advanced Feature** (Automated Event Interceptors): Triggers (`CREATE TRIGGER`) execute PL/pgSQL functions automatically before or after DML events (`INSERT`, `UPDATE`, `DELETE`) on target tables.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Requires two SQL statements: `CREATE FUNCTION ... RETURNS TRIGGER` to define the logic, followed by `CREATE TRIGGER` to bind the function to a target table).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Automated Audit Trail Triggers with `BEFORE UPDATE`

**Scenario:**
Create a trigger function that automatically updates the `updated_at` column to `CURRENT_TIMESTAMP` on every row update.

**Requirements:**
1. Create trigger function returning `TRIGGER`.
2. Create `BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION ...`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE OR REPLACE FUNCTION update_timestamp_column() 
> RETURNS TRIGGER AS $$
> BEGIN
>   NEW.updated_at = CURRENT_TIMESTAMP;
>   RETURN NEW;
> END;
> $$ LANGUAGE plpgsql;
> 
> CREATE TRIGGER trg_users_updated_at 
> BEFORE UPDATE ON users 
> FOR EACH ROW 
> EXECUTE FUNCTION update_timestamp_column();
> ```
>
> #### Technical Explanation
>
> 1. `BEFORE UPDATE` triggers intercept row update commands before bytes are written to disk heap.
> 2. `NEW.updated_at` modifies the pending row tuple payload.
> 3. Automates system audit timestamps seamlessly.
> 
---

### Exercise 2: Statement-Level Audit Logging Triggers

**Scenario:**
Create a statement-level `AFTER DELETE` trigger logging table deletion events to an `audit_log` table once per SQL command.

**Requirements:**
1. Create `AFTER DELETE ON orders FOR EACH STATEMENT EXECUTE FUNCTION ...`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE OR REPLACE FUNCTION log_order_deletions() 
> RETURNS TRIGGER AS $$
> BEGIN
>   INSERT INTO audit_logs (event) VALUES ('Bulk deletion executed on orders table');
>   RETURN NULL;
> END;
> $$ LANGUAGE plpgsql;
> 
> CREATE TRIGGER trg_log_deletions 
> AFTER DELETE ON orders 
> FOR EACH STATEMENT 
> EXECUTE FUNCTION log_order_deletions();
> ```
>
> #### Technical Explanation
>
> 1. `FOR EACH STATEMENT` triggers execute ONCE per SQL statement regardless of how many rows were affected.
> 2. Reduces logging overhead for bulk DML operations.
> 3. Statement-level event logging pattern.
> 
---

### Exercise 3: Preventing Updates via Triggers

**Scenario:**
Create a `BEFORE UPDATE` trigger on `invoices` that raises an exception if an application attempts to modify a paid invoice (`status = 'paid'`).

**Requirements:**
1. Use `IF OLD.status = 'paid' THEN RAISE EXCEPTION ...`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE OR REPLACE FUNCTION protect_paid_invoices() 
> RETURNS TRIGGER AS $$
> BEGIN
>   IF OLD.status = 'paid' THEN
>     RAISE EXCEPTION 'Immutability Error: Paid invoices cannot be modified!';
>   END IF;
>   RETURN NEW;
> END;
> $$ LANGUAGE plpgsql;
> 
> CREATE TRIGGER trg_protect_paid_invoices 
> BEFORE UPDATE ON invoices 
> FOR EACH ROW 
> EXECUTE FUNCTION protect_paid_invoices();
> ```
>
> #### Technical Explanation
>
> 1. `OLD` pseudo-table accesses pre-update row state attributes.
> 2. `RAISE EXCEPTION` aborts the transaction immediately.
> 3. Enforces business immutability constraints at the database tier.
> 
---



## 6. Related Terms
- [PL/pgSQL](plpgsql.md) — The parent procedural language.
- [Stored Function (`CREATE FUNCTION`)](stored_function.md) — The compiling wrapper.
- [`LISTEN` / `NOTIFY`](../level_10/listen_notify.md) — Related concept: `LISTEN` / `NOTIFY`.

---

## 7. Key Takeaways
- A Trigger automatically executes functions in response to table modifications.
- Guarantees audit compliance by locking automated logic inside the database.
- Enforces validations on `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` actions.
- Triggers are defined in two steps: create trigger function, then bind to table.
- Special variables `NEW` and `OLD` hold row data states.
- `BEFORE` triggers validate/modify inputs; `AFTER` triggers log transactions.
- Avoid recursive self-updates inside triggers to prevent infinite crash loops.
