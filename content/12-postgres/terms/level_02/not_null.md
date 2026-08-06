# `NOT NULL` Constraint

> **Level 2 — Core Data Types & Constraints**
> A column-level validation rule that prevents a column from ever containing `NULL`, guaranteeing that every row has a valid value for that field.

---

## 1. Prerequisites
- [`NULL`](null.md) — Understanding the missing state we are trying to block.

---

## 2. Term Category

**Constraint** (Mandatory Presence Constraint): A `NOT NULL` constraint prevents a column from storing `NULL` values, ensuring mandatory field presence for all table rows.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Checked natively at the transaction barrier. Prevents data storage files from committing blank byte records).

### (1) Design Motivation — "Why did we design this?"
By default, columns in a SQL database are "nullable." This means that if you insert a row but omit a column, Postgres automatically inserts `NULL`.

However, some pieces of information are critical for the business:
-   A user must have a `username` to log in.
-   An employee must have an `email` address.
-   A transaction must have an `amount` value.

If your database allows these columns to be empty, your frontend or backend application code will eventually crash when trying to read these empty values (resulting in errors like `Cannot read properties of null` in JavaScript).

We designed the **`NOT NULL`** constraint to enforce data quality at the database level. 

It acts as a gatekeeper: if a developer writes code that tries to insert a row without a required field, the database immediately halts the request and returns an error, protecting the application from bad data.

---

### (2) Reality Metaphor
Imagine filling out a passport application form:
-   Most fields are required (Full Name, Date of Birth, Signature). If you leave any of these blank, the officer (the database engine) rejects the form immediately and hands it back.
-   Some fields are optional (Middle Name, Secondary Phone). You can leave these blank (NULL) and your application still goes through.

`NOT NULL` is the database equivalent of placing a **red asterisk `*` (Required)** next to a form input.

---

### (3) Code Examples

#### Enforcing NOT NULL
In SQL, you apply the constraint at the end of the column declaration:

```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  username VARCHAR(50) NOT NULL, -- Required
  email VARCHAR(100) NOT NULL,    -- Required
  nickname VARCHAR(50)            -- Optional (nullable)
);
```

#### The Insertion Test
Let's see what happens when we try to bypass the rule:

```sql
-- 1. Successful insert (omitting optional nickname is fine)
INSERT INTO accounts (id, username, email) 
VALUES (1, 'john_doe', 'john@example.com');

-- 2. Failed insert (trying to omit required username)
INSERT INTO accounts (id, email) 
VALUES (2, 'error@example.com');
-- ERROR: null value in column "username" of relation "accounts" violates not-null constraint
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Adding NOT NULL to an existing column that already contains NULL rows

**The mistake:** Running an `ALTER TABLE` query to add `NOT NULL` to a column that has empty values on disk:

```sql
-- This query crashes if any row already has a NULL email!
ALTER TABLE accounts ALTER COLUMN email SET NOT NULL;
-- ERROR: column "email" of relation "accounts" contains null values
```

**Why it's wrong:** Databases enforce strict consistency. You cannot create a rule that says "this column can never have NULLs" if there are active rows breaking that exact rule right now.

**Fix: Before applying the constraint, write a query to update all existing `NULL` values to a valid default value (like `'unknown@example.com'`), then apply the constraint.**

```sql
-- 1. Clean the data first
UPDATE accounts SET email = 'unknown@example.com' WHERE email IS NULL;

-- 2. Apply the constraint safely
ALTER TABLE accounts ALTER COLUMN email SET NOT NULL;
```

---



### Mistake 2: Adding `NOT NULL` Constraints to Existing Columns Containing Existing `NULL` Values

**The mistake:** Executing `ALTER TABLE users ALTER COLUMN email SET NOT NULL;` on a table with existing NULL emails.

**Why it's wrong:** PostgreSQL checks existing table rows. If any row contains `NULL`, altering the column fails with error `column "email" contains null values`.

*Incorrect:*
```sql
ALTER TABLE users ALTER COLUMN email SET NOT NULL; -- ❌ Fails if NULL rows exist!
```

*Fix:*
```sql
UPDATE users SET email = 'unknown@ex.com' WHERE email IS NULL;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

### Mistake 3: Omitting `NOT NULL` Constraints on Required Business Columns

**The mistake:** Creating table `users ( email TEXT )` without `NOT NULL` constraints.

**Why it's wrong:** Allowing unexpected `NULL` values forces application code to add conditional defensive checks everywhere.

*Incorrect:*
```sql
email TEXT -- Allows NULL email addresses
```

*Fix:*
```sql
email TEXT NOT NULL -- Guarantees presence of value
```

## 5. Practice Exercises

### Exercise 1: Enforcing Mandatory Field Presence

**Scenario:**
Create a `contacts` table requiring `first_name`, `last_name`, and `email` using `NOT NULL`.

**Requirements:**
1. Execute `CREATE TABLE contacts (...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE contacts (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   first_name TEXT NOT NULL,
>   last_name TEXT NOT NULL,
>   email TEXT NOT NULL,
>   phone TEXT -- Optional field allowing NULL
> );
> ```
>
> #### Technical Explanation
>
> 1. `NOT NULL` prevents writing rows with unassigned or missing values in target columns.
> 2. Attempting to insert `NULL` into a `NOT NULL` column throws a null value constraint violation.
> 3. Guarantees mandatory data presence at the database tier.
> 
---

### Exercise 2: Adding NOT NULL Constraints to Existing Columns

**Scenario:**
Add a `NOT NULL` constraint to column `status` on existing table `tasks` after backfilling missing values.

**Requirements:**
1. Update existing nulls with default value.
2. Execute `ALTER TABLE tasks ALTER COLUMN status SET NOT NULL`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- 1. Backfill existing NULL rows
> UPDATE tasks SET status = 'pending' WHERE status IS NULL;
> 
> -- 2. Apply NOT NULL constraint
> ALTER TABLE tasks 
> ALTER COLUMN status SET NOT NULL;
> ```
>
> #### Technical Explanation
>
> 1. Applying `SET NOT NULL` fails if existing table rows contain `NULL` values.
> 2. Backfilling missing values with `UPDATE` ensures constraint validation succeeds.
> 3. Hardens table integrity.
> 
---

### Exercise 3: Handling NOT NULL Constraint Exceptions

**Scenario:**
Catch `not_null_violation` (Error Code 23502) in PostgreSQL driver scripts.

**Requirements:**
1. Describe error code `23502` handling.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> try {
>   await pool.query("INSERT INTO contacts (first_name) VALUES ($1)", ["Alice"]);
> } catch (err: any) {
>   if (err.code === "23502") {
>     console.error("Constraint Error: Mandatory field missing!", err.column);
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. PostgreSQL returns Error Code `23502` (`not_null_violation`) when a `NOT NULL` constraint is violated.
> 2. Driver exposes `err.column` identifying the missing field name.
> 3. Maps to HTTP 400 Bad Request error responses in application APIs.
> 
---



## 6. Related Terms
- [`NULL`](null.md) — The unset state.
- [`DEFAULT` Value](default_value.md) — Providing fallbacks for required columns.
- [`CHECK` Constraint](check_constraint.md) — Related concept: `CHECK` Constraint.

---

## 7. Key Takeaways
- `NOT NULL` makes a column mandatory, preventing it from storing `NULL` markers.
- Helps avoid backend runtime crashes caused by missing parameter values.
- Rejects inserts and updates if required fields are omitted or set to `NULL`.
- Primary Key columns are automatically treated as `NOT NULL` by the engine.
- You must clean existing `NULL` records in a column before applying `NOT NULL` via `ALTER`.
