# `UNIQUE` Constraint

> **Level 2 — Core Data Types & Constraints**
> A validation constraint that guarantees all non-null values in a column (or combination of columns) are distinct across all rows, preventing duplicate entries.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Columns typing.
- [`NULL`](null.md) — Understanding the missing state representation.

---

## 2. Term Category

**Constraint** (Duplicate Exclusion Constraint): A `UNIQUE` constraint prevents duplicate non-null values across specified column combinations, ensuring distinct key values.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Postgres automatically builds a unique **B-Tree Index** on unique columns to quickly verify uniqueness during inserts).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Enforcing Unique Key Constraints on Single Columns

**Scenario:**
Add a `UNIQUE` constraint to column `email` on table `users`.

**Requirements:**
1. Execute `ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE users 
> ADD CONSTRAINT uq_users_email UNIQUE (email);
> ```
>
> #### Technical Explanation
>
> 1. `UNIQUE` constraints reject write attempts that introduce duplicate non-null values.
> 2. Automatically creates an underlying unique B-tree index (`uq_users_email`).
> 3. Enforces business uniqueness rules at the database engine level.
> 
---

### Exercise 2: Multi-Column Composite Unique Constraints

**Scenario:**
Enforce that a user can only submit ONE review per product by creating a composite unique constraint on `(user_id, product_id)`.

**Requirements:**
1. Define `CONSTRAINT uq_reviews_user_product UNIQUE (user_id, product_id)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE product_reviews (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   user_id INTEGER NOT NULL REFERENCES users(id),
>   product_id INTEGER NOT NULL REFERENCES products(id),
>   rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
>   CONSTRAINT uq_reviews_user_product UNIQUE (user_id, product_id)
> );
> ```
>
> #### Technical Explanation
>
> 1. Composite `UNIQUE` constraints enforce uniqueness across the COMBINATION of multiple columns.
> 2. Allows a user to review multiple different products, but rejects duplicate reviews for the same product.
> 3. Core pattern for relationship constraints.
> 
---

### Exercise 3: Handling Duplicate Key Violations in Application Code

**Scenario:**
Catch PostgreSQL `unique_violation` (Error Code 23505) in Node.js backend controllers.

**Requirements:**
1. Handle Error Code `23505`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> try {
>   await pool.query("INSERT INTO users (username, email) VALUES ($1, $2)", [username, email]);
> } catch (err: any) {
>   if (err.code === "23505") {
>     console.error("Conflict Error: Email or username already exists!", err.detail);
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. Unique constraint violations throw PostgreSQL Error Code `23505` (`unique_violation`).
> 2. `err.detail` exposes the conflicting key value pair.
> 3. Catching `23505` allows application servers to return HTTP 409 Conflict status codes cleanly.
> 
---



## 6. Related Terms
- [`PRIMARY KEY`](primary_key.md) — The main unique and required column anchor.
- [`NULL`](null.md) — The values that escape uniqueness checks.
- [`UPSERT` (`ON CONFLICT`)](../level_03/upsert.md) — Related concept: `UPSERT` (`ON CONFLICT`).
- [One-to-One Relationship](../level_05/one_to_one.md) — Related concept: One-to-One Relationship.
- [Unique Index](../level_07/unique_index.md) — Related concept: Unique Index.

---

## 7. Key Takeaways
- `UNIQUE` constraints prevent duplicate entries in non-primary key columns.
- Like primary keys, they automatically generate a search index on disk.
- Unlike primary keys, `UNIQUE` columns allow multiple `NULL` entries.
- To prevent both duplicates and missing values, use `UNIQUE NOT NULL`.
- You can create multi-column unique constraints to prevent duplicate value pairs.
