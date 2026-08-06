# Unique Index

> **Level 7 — Indexes & Query Performance**
> A specialized index that enforces a uniqueness constraint on its target columns, instantly blocking writes (inserts/updates) that contain duplicate values.

---

## 1. Prerequisites
- [B-tree Index](btree_index.md) — The default balancing structure type.
- [`UNIQUE` Constraint](../level_02/unique_constraint.md) — The logical uniqueness constraint.

---

## 2. Term Category

**Performance / Optimization** (Unique Constraint Index): Unique Indexes enforce column value uniqueness at the storage layer while optimizing equality lookups.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Postgres automatically builds a unique B-tree index under the hood whenever you declare a `PRIMARY KEY` or `UNIQUE` constraint).

### (1) Design Motivation — "Why did we design this?"
Relational databases enforce data integrity. 

As learned in Level 2 (`unique_constraint.md`), you use the `UNIQUE` constraint to prevent duplicate emails, license plates, or serial numbers.

But how does the database enforce this rule during an `INSERT`?
-   To guarantee that a new email `'bob@example.com'` is unique, the database must search the table to confirm that email doesn't exist yet.
-   If the table has 10 million rows, scanning the entire table on every single write to check for duplicates would slow down inserts to a crawl.

We designed the **Unique Index** to solve this. 

A unique index is a standard B-tree index that carries a strict rule: **duplicate keys are forbidden inside the tree nodes**. 

By searching the sorted index tree, Postgres can verify in microseconds if a value already exists, allowing it to enforce uniqueness without slowing down writes.

---

### (2) Unique Constraint vs. Unique Index
In PostgreSQL, these two concepts are functionally equivalent on disk, but carry design differences:

1.  **`UNIQUE` Constraint (Logical Rule):** Part of the table definition. It represents a business rule. It automatically creates a hidden unique index behind the scenes.
2.  **`UNIQUE INDEX` (Physical Index):** An explicit index file created using `CREATE UNIQUE INDEX`.
    -   *The major benefit:* You can apply filters (`WHERE`) to a unique index (creating a **Partial Unique Index**). This is impossible with a standard table constraint!

For example, you can enforce that an email address must be unique, but **only** for users who are active:

```sql
CREATE UNIQUE INDEX idx_unique_active_email 
ON users(email) 
WHERE status = 'active';
-- This allows deactivated users to share the same email address!
```

---

### (3) Reality Metaphor
Imagine a private club registration check:
-   **Unique Constraint:** The club owner makes a rule: *"No two guests can have the exact same entry ticket ID."*
-   **Unique Index:** To enforce this rule, the gate usher uses a **Digital Scanner** (the index). When a guest arrives, the scanner checks the ID against the checked-in list in microseconds. If the ID is already marked active, the scanner buzzes red (error) and locks the turnstile.

---

### (4) Code Examples

#### Creating a Unique Index
```sql
CREATE TABLE company_accounts (
  id INT PRIMARY KEY,
  subdomain VARCHAR(50) NOT NULL
);

-- Manually build a unique index on subdomain
CREATE UNIQUE INDEX idx_unique_subdomain ON company_accounts(subdomain);
```

#### Duplicate Rejection
```sql
INSERT INTO company_accounts VALUES (1, 'acme');

-- Fails: subdomain 'acme' is already indexed!
INSERT INTO company_accounts VALUES (2, 'acme');
-- ERROR: duplicate key value violates unique constraint "idx_unique_subdomain"
-- DETAIL: Key (subdomain)=(acme) already exists.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating both a UNIQUE constraint and a UNIQUE INDEX on the exact same column

**The mistake:** Declaring a column as unique in the table creation script, and then running a manual `CREATE UNIQUE INDEX` query on it:

```sql
-- Table declaration (automatically builds unique index 1)
CREATE TABLE members (
  email VARCHAR(100) UNIQUE
);

-- Redundant index creation (builds identical unique index 2)
CREATE UNIQUE INDEX idx_members_email ON members(email);
```

**Why it's wrong:** Because a `UNIQUE` constraint builds a unique index automatically, manually creating a second unique index is redundant. You end up storing two identical B-tree index files on disk, wasting storage space and doubling write latency overhead.

**Fix: Only use `CREATE UNIQUE INDEX` if you are applying partial filters (`WHERE`), or if you need to build the index concurrently in production. Otherwise, default to the standard table `UNIQUE` constraint.**

---



### Mistake 2: Creating Unique Indexes on Columns Containing Pre-Existing Duplicate Rows

**The mistake:** Executing `CREATE UNIQUE INDEX idx_email ON users (email);` when duplicate emails exist.

**Why it's wrong:** If duplicate values exist in the target column, index creation aborts with error `could not create unique index ... Key (email)=(...) is duplicated`.

*Incorrect:*
```sql
CREATE UNIQUE INDEX idx_email ON users (email); -- ❌ Fails if duplicate rows exist!
```

*Fix:*
```sql
Clean duplicate rows before building unique indexes
```

### Mistake 3: Expecting Unique Indexes to Prevent Multiple `NULL` Values by Default

**The mistake:** Creating `CREATE UNIQUE INDEX idx_phone ON users (phone);` expecting to reject multiple `NULL` insertions.

**Why it's wrong:** In SQL, `NULL != NULL`. Standard unique indexes permit MULTIPLE `NULL` entries. In Postgres 15+, use `NULLS NOT DISTINCT`.

*Incorrect:*
```sql
// Expecting unique index to reject 2nd NULL insertion
```

*Fix:*
```sql
CREATE UNIQUE INDEX idx_phone ON users (phone) NULLS NOT DISTINCT; -- Postgres 15+
```

## 5. Practice Exercises

### Exercise 1: Enforcing Unique Key Constraints via Unique Indexes

**Scenario:**
Create a unique index on `users(email)` to enforce email uniqueness and accelerate equality lookups.

**Requirements:**
1. Execute `CREATE UNIQUE INDEX idx_users_unique_email ON users(email)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE UNIQUE INDEX idx_users_unique_email 
> ON users (email);
> ```
>
> #### Technical Explanation
>
> 1. `CREATE UNIQUE INDEX` creates a B-tree index that rejects duplicate non-null entries.
> 2. Provides both unique data constraint enforcement and $O(\log N)$ index lookup acceleration.
> 3. Equivalent to `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE`.

---

### Exercise 2: Multi-Column Composite Unique Indexes

**Scenario:**
Create a composite unique index on `user_roles(user_id, role_name)` to prevent assigning duplicate roles to the same user.

**Requirements:**
1. Execute `CREATE UNIQUE INDEX uq_user_roles ON user_roles(user_id, role_name)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE UNIQUE INDEX uq_user_roles 
> ON user_roles (user_id, role_name);
> ```
>
> #### Technical Explanation
>
> 1. Composite unique indexes enforce uniqueness across the COMBINATION of multiple columns.
> 2. Allows a user to have multiple roles, but prevents assigning the same `role_name` twice to the same `user_id`.
> 3. Relationship uniqueness pattern.

---

### Exercise 3: Handling Null Values in Unique Indexes

**Scenario:**
Demonstrate how unique indexes handle multiple `NULL` values by default vs using `NULLS NOT DISTINCT` (PG 15+).

**Requirements:**
1. Contrast default `NULLS DISTINCT` vs `NULLS NOT DISTINCT`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- PostgreSQL 15+ NULLS NOT DISTINCT (Treats NULL as equal to NULL, allowing only 1 NULL!)
> CREATE UNIQUE INDEX uq_users_ssn 
> ON users (ssn) 
> NULLS NOT DISTINCT;
> ```
>
> #### Technical Explanation
>
> 1. By default (`NULLS DISTINCT`), SQL standards permit multiple `NULL` values in a unique index because `NULL <> NULL`.
> 2. PostgreSQL 15 introduced `NULLS NOT DISTINCT`, treating `NULL` values as duplicate matches (permitting at most ONE `NULL` entry).
> 3. Modern PostgreSQL constraint feature.

---



## 6. Related Terms
- [`UNIQUE` Constraint](../level_02/unique_constraint.md) — The logical database rule.
- [Partial Index](partial_index.md) — Indexes filtering subsets of rows.
- [B-tree Index](btree_index.md) — Related concept: B-tree Index.

---

## 7. Key Takeaways
- A Unique Index enforces column uniqueness at the physical database layer.
- Automatically compiled by Postgres to power `PRIMARY KEY` and `UNIQUE` constraints.
- Rejects inserts and updates containing duplicate values in microseconds.
- Can carry `WHERE` filters (Partial Unique Index) to support complex logic.
- Avoid redundant index creation on columns that already have unique constraints.
- Enhances database write integrity by catching duplicate inputs before commits.
