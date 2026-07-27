# `NOT NULL` Constraint

> **Level 2 — Core Data Types & Constraints**
> A column-level validation rule that prevents a column from ever containing `NULL`, guaranteeing that every row has a valid value for that field.

---

## 1. Prerequisites
- [NULL](null.md) — Understanding the missing state we are trying to block.

---

## 2. Term Category
- **PostgreSQL Constraint**

---

## 3. Environment Context
- **PostgreSQL Core** (Checked natively at the transaction barrier. Prevents data storage files from committing blank byte records).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Table Constraints Mapping

**Problem:** You are building a table `products`. Every product must have an ID, a title, and a price. The description field is optional. Write the complete `CREATE TABLE` SQL query enforcing these rules.

**Expected output:**
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT
);
```

> [!check]- Answer
> - The `PRIMARY KEY` constraint inherently includes `NOT NULL` properties, so you don't need to specify both on the ID column.
> - Apply `NOT NULL` to required fields.

---



### Exercise 2: Setting Column NOT NULL in DDL

**Problem:** Create table `accounts` requiring `username` and `password_hash` to be NOT NULL.

**Expected output:**
```text
CREATE TABLE accounts ( id SERIAL PRIMARY KEY, username TEXT NOT NULL, password_hash TEXT NOT NULL );
```

> [!check]- Answer
> ```sql
> CREATE TABLE accounts (
>   id SERIAL PRIMARY KEY,
>   username TEXT NOT NULL,
>   password_hash TEXT NOT NULL
> );
> ```
>
> **Explanation:** `NOT NULL` constraints guarantee columns cannot store NULL missing values.

### Exercise 3: Removing NOT NULL Constraint

**Problem:** Remove `NOT NULL` constraint from `phone` column on `users` table.

**Expected output:**
```text
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
```

> [!check]- Answer
> ```sql
> ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
> ```
>
> **Explanation:** `DROP NOT NULL` allows target columns to store NULL values.

## 7. Related Terms
- [NULL](null.md) — The unset state.
- [`DEFAULT` Value](default_value.md) — Providing fallbacks for required columns.

---

## 8. Key Takeaways
- `NOT NULL` makes a column mandatory, preventing it from storing `NULL` markers.
- Helps avoid backend runtime crashes caused by missing parameter values.
- Rejects inserts and updates if required fields are omitted or set to `NULL`.
- Primary Key columns are automatically treated as `NOT NULL` by the engine.
- You must clean existing `NULL` records in a column before applying `NOT NULL` via `ALTER`.
