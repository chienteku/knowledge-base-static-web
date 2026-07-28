# `UNIQUE` Constraint

> **Level 2 — Core Data Types & Constraints**
> A validation constraint that guarantees all non-null values in a column (or combination of columns) are distinct across all rows, preventing duplicate entries.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Columns typing.
- [NULL](null.md) — Understanding the missing state representation.

---

## 2. Term Category
- **PostgreSQL Constraint**

---

## 3. Environment Context
- **PostgreSQL Core** (Postgres automatically builds a unique **B-Tree Index** on unique columns to quickly verify uniqueness during inserts).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In database design, you use a Primary Key to uniquely identify rows. 

But you often have **other** columns that also need to be unique:
-   An `email` address column in a `users` table. Two users cannot share the same email address.
-   A `license_plate` column in a `vehicles` table.
-   A `slug` string in a `blog_posts` table to create clean, unique URL links.

Since a table can only have **one** primary key, you need a way to enforce uniqueness on secondary columns.

We designed the **`UNIQUE`** constraint to solve this. 

It tells the database engine to inspect incoming values on every write. If a client attempts to write a value that already exists in that column, Postgres aborts the query, safeguarding your data from duplicates.

---

### (2) The UNIQUE NULL Exception
A critical difference between `PRIMARY KEY` and `UNIQUE` is how they handle `NULL` (missing) values:
-   A Primary Key **forbids** `NULL` values.
-   A `UNIQUE` constraint **allows** `NULL` values.

Under the SQL standard, `NULL` represents an "unknown" value. Because one unknown value does not equal another unknown value (`NULL <> NULL`), **you can insert multiple rows containing `NULL` in a unique column.**

---

### (3) Reality Metaphor
Imagine a corporate directory system:
-   Each employee gets a unique **Employee ID Card** (Primary Key). It is mandatory and unique.
-   Each employee also registers their personal **Car License Plate** (Unique Constraint) for parking access.
    -   No two employees can register the same license plate.
    -   However, employees who do not drive can leave the plate field blank (NULL). Having multiple employees with blank fields is perfectly fine.

---

### (4) Code Examples

#### Enforcing Uniqueness
In SQL, you apply the constraint to the column definition:

```sql
CREATE TABLE staff_accounts (
  id INTEGER PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL, -- Unique and required
  work_email VARCHAR(100) UNIQUE,        -- Unique, but optional (allows NULLs)
  job_title VARCHAR(50)                  -- Not unique, not required
);
```

#### Duplicate Constraint Failure
```sql
INSERT INTO staff_accounts (id, username, work_email) VALUES (1, 'alice', 'alice@company.com');

-- This query crashes because 'alice@company.com' is already registered!
INSERT INTO staff_accounts (id, username, work_email) VALUES (2, 'bob', 'alice@company.com');
-- ERROR: duplicate key value violates unique constraint "staff_accounts_work_email_key"
-- DETAIL: Key (work_email)=(alice@company.com) already exists.
```

#### Multiple NULLs Demonstration
Because NULLs are not equal, this sequence is perfectly valid:

```sql
-- Both Bob and Charlie do not have emails (NULL)
INSERT INTO staff_accounts (id, username, work_email) VALUES (3, 'bob', NULL);
INSERT INTO staff_accounts (id, username, work_email) VALUES (4, 'charlie', NULL);

-- Postgres accepts both inserts without unique errors!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on UNIQUE alone to prevent empty/blank records

**The mistake:** Declaring a column as `email VARCHAR(100) UNIQUE`, and assuming that it prevents users from registering without an email.

**Why it's wrong:** As shown in the code examples, `UNIQUE` allows multiple `NULL` values. If a developer forgets to send the email parameter, Postgres will write multiple `NULL` entries without any errors, which might bypass your application's email verification loops.

**Fix: If a column must be unique AND required, you must always combine both constraints: `UNIQUE NOT NULL`.**

---



### Mistake 2: Assuming Unique Constraints Prevent Duplicate `NULL` Values by Default

**The mistake:** Adding a unique constraint to `phone` and expecting inserting 2 rows with `NULL` phone to fail.

**Why it's wrong:** In SQL standards, `NULL != NULL`. Standard unique constraints permit MULTIPLE rows with `NULL` values. In PostgreSQL 15+, use `UNIQUE NULLS NOT DISTINCT` to enforce single NULL uniqueness.

*Incorrect:*
```sql
ALTER TABLE users ADD CONSTRAINT uq_phone UNIQUE (phone); -- Allows multiple NULLs
```

*Fix:*
```sql
ALTER TABLE users ADD CONSTRAINT uq_phone UNIQUE NULLS NOT DISTINCT (phone); -- Postgres 15+ single NULL
```

### Mistake 3: Creating Case-Sensitive Unique Constraints on User Email Columns

**The mistake:** Adding `UNIQUE(email)` and inserting `Alice@ex.com` and `alice@ex.com`.

**Why it's wrong:** Standard unique constraints are case-sensitive! `Alice@ex.com` and `alice@ex.com` are treated as distinct values. Create a expression index `UNIQUE INDEX ON users (LOWER(email))`.

*Incorrect:*
```sql
CREATE TABLE users ( email TEXT UNIQUE ); -- Allows Alice@ex.com AND alice@ex.com!
```

*Fix:*
```sql
CREATE UNIQUE INDEX idx_users_lower_email ON users (LOWER(email));
```

## 6. Practice Exercises

### Exercise 1: Multi-column Uniqueness

**Problem:** You are building a movie rating database. You have a table `reviews` with columns `user_id`, `movie_id`, and `rating`. You want to allow users to write reviews, but you must prevent a user from writing **more than one review for the same movie**. How do you enforce this constraint in SQL?

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE TABLE reviews (
>   id INTEGER PRIMARY KEY,
>   user_id INTEGER,
>   movie_id INTEGER,
>   rating INTEGER,
>   -- Enforce unique combination
>   UNIQUE (user_id, movie_id)
> );
> ```
> - You can define a `UNIQUE` constraint at the bottom of the table definition that accepts a list of multiple columns.
> - This prevents duplicate pairs, while still allowing the same `user_id` or `movie_id` to appear individually on multiple rows.

---



### Exercise 2: Adding Multi-Column Compound Unique Constraint

**Problem:** Add UNIQUE constraint on `(user_id, project_id)` on `project_members` table.

**Expected output:**
> [!check]- Answer
> ```text
> ALTER TABLE project_members ADD CONSTRAINT uq_user_project UNIQUE (user_id, project_id);
> ```
> ```sql
> ALTER TABLE project_members ADD CONSTRAINT uq_user_project UNIQUE (user_id, project_id);
> ```
>
> **Explanation:** Multi-column UNIQUE constraints enforce uniqueness across column tuples.

---

### Exercise 3: Case-Insensitive Unique Expression Index

**Problem:** Create unique index enforcing case-insensitive email uniqueness using `LOWER(email)`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE UNIQUE INDEX idx_lower_email ON users (LOWER(email));
> ```
> ```sql
> CREATE UNIQUE INDEX idx_lower_email ON users (LOWER(email));
> ```
>
> **Explanation:** Expression unique indexes evaluate functions (`LOWER()`) before enforcing uniqueness.

## 7. Related Terms
- [Primary Key](primary_key.md) — The main unique and required column anchor.
- [NULL](null.md) — The values that escape uniqueness checks.

---

## 8. Key Takeaways
- `UNIQUE` constraints prevent duplicate entries in non-primary key columns.
- Like primary keys, they automatically generate a search index on disk.
- Unlike primary keys, `UNIQUE` columns allow multiple `NULL` entries.
- To prevent both duplicates and missing values, use `UNIQUE NOT NULL`.
- You can create multi-column unique constraints to prevent duplicate value pairs.
