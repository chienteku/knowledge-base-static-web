# Index-Only Scan (Covering Index)

> **Level 7 — Indexes & Query Performance**
> The fastest possible SQL read path where the database retrieves all requested query columns directly from the index file in memory, completely bypassing disk reads to the table heap.

---

## 1. Prerequisites
- [Sequential Scan vs. Index Scan](seq_scan_vs_index_scan.md) — Scenting read routes.
---

## 2. Term Category
- **PostgreSQL Performance Concept**

---

## 3. Environment Context
- **PostgreSQL Core** (Visible inside `EXPLAIN` outputs. Relies on the database's **Visibility Map** page status checks to ensure transaction visibility without reading physical heap pages).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In `seq_scan_vs_index_scan.md`, we learned that standard Index Scans suffer from a **Double Read Penalty**:
1.  Read the B-tree index to find the pointer (TID).
2.  Read the table heap on disk to fetch the actual row values.

But what if the columns your query wants to select are **already stored inside the index itself**?

For example:
-   You have a B-tree index on the `email` column.
-   You run: `SELECT email FROM users WHERE email = 'alice@example.com';`

Since the index file already contains the sorted email strings, why make a second disk trip to read the table heap? We don't need to! 

The database engine can read the email string directly out of the index block in memory and stream it straight back to the client.

This optimized operation is called an **Index-Only Scan**. 

An index that contains all columns required to resolve a specific query is called a **Covering Index**.

---

### (2) The Visibility Map Check
Because PostgreSQL uses MVCC (Multi-Version Concurrency Control), index files do not store transaction visibility details. 

To ensure that the row you are reading from the index is actually committed and hasn't been deleted by another user, Postgres must check its status.

To do this without checking the table heap on disk, Postgres checks a small helper file in memory called the **Visibility Map**:
-   **If Page is All-Visible:** The map confirms that no active transactions have modified this page. Postgres returns the index value instantly. (Fast Index-Only Scan).
-   **If Page is Dirty:** The map shows recent updates. Postgres is forced to fall back and read the table heap disk page to confirm the row's visibility, turning the query back into a standard Index Scan.

*Key Takeaway:* **To keep Index-Only Scans fast, you must run `VACUUM` regularly to keep the Visibility Map clean.**

---

### (3) The `INCLUDE` Clause (Creating Covering Indexes)
In PostgreSQL, you can attach extra "payload" columns to an index without including them in the B-tree sorting logic. 

This is done using the **`INCLUDE`** clause. 

These columns are only stored in the leaf nodes at the bottom of the tree, specifically to enable Index-Only Scans:

```sql
CREATE UNIQUE INDEX idx_users_email_include 
ON users(email) 
INCLUDE (username);
-- Now, SELECT email, username WHERE email = ... runs as an Index-Only Scan!
```

---

### (4) Reality Metaphor
Imagine a classroom roll call check:
-   **Standard Index Scan:** The teacher reads the class roster (index), sees Alice's locker number is `105`, walks down the hallway to locker `105` (the table heap), and checks if Alice is standing there.
-   **Index-Only Scan:** The class roster list already contains a green checkmark next to Alice's name saying: *"Present in class today"* (the Visibility Map check is clean). The teacher reads the roster, marks Alice present, and never leaves her desk.

---

### (5) Code Examples

#### Triggering an Index-Only Scan
```sql
CREATE TABLE staff (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL
);

-- Query selects ONLY the indexed email column
EXPLAIN SELECT email FROM staff WHERE email = 'bob@company.com';
-- Output:
-- Index Only Scan using staff_email_key on staff  (cost=0.15..8.17 rows=1 width=18)
```

#### Creating a Covering Index with INCLUDE
```sql
-- Create an index that covers both email AND username
CREATE UNIQUE INDEX idx_staff_covering 
ON staff(email) 
INCLUDE (username);

-- Query selects email and username, triggering an Index-Only Scan!
EXPLAIN SELECT email, username FROM staff WHERE email = 'bob@company.com';
-- Output:
-- Index Only Scan using idx_staff_covering on staff  (cost=0.15..8.17 rows=1 width=32)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing Index-Only Scans will stay fast on tables with high write traffic without maintenance

**The mistake:** Building covering indexes with `INCLUDE` clauses on a table that receives thousands of updates per minute, but never running `VACUUM`.

**Why it's wrong:** High write volume creates dead rows and marks memory pages as "dirty" in the database catalog. The Visibility Map becomes obsolete. Postgres is forced to fall back and read the table heap for almost every index lookup, turning your Index-Only Scans back into standard Index Scans and losing all performance gains.

**Fix: Pair covering indexes with an aggressive autovacuum configuration to keep the Visibility Map updated.**

---



### Mistake 2: Failing to Maintain Visibility Maps Leading to `Index Scan` Instead of `Index Only Scan`

**The mistake:** Expecting an `Index Only Scan` on a table with heavy un-vacuumed dead tuples.

**Why it's wrong:** PostgreSQL `Index Only Scans` check the Visibility Map to verify if heap pages contain dead tuples. If the Visibility Map is stale, PostgreSQL must fetch the heap page on disk. Run `VACUUM` to update Visibility Maps.

*Incorrect:*
```sql
// Expecting Index Only Scan on dirty un-vacuumed table
```

*Fix:*
```sql
Run VACUUM ANALYZE to update table Visibility Maps
```

### Mistake 3: Selecting Extra Non-Indexed Columns in `SELECT` Disabling Index Only Scans

**The mistake:** Querying `SELECT id, email, bio FROM users WHERE email = 'a@ex.com'` when index covers `{ email, id }`.

**Why it's wrong:** Selecting column `bio` (which is not in the index) forces the query engine to fetch the table heap page on disk, falling back to a standard `Index Scan`.

*Incorrect:*
```sql
SELECT id, email, bio FROM users WHERE email = 'a@ex.com'; -- ❌ Requires heap read for bio!
```

*Fix:*
```sql
SELECT id, email FROM users WHERE email = 'a@ex.com'; -- Covered Index Only Scan
```

## 6. Practice Exercises

### Exercise 1: Covering Index Design

**Problem:** You have a `products` table (columns: `id` PRIMARY KEY, `sku_code` UNIQUE, `price` NUMERIC, `description` TEXT). Your homepage runs this query millions of times a day:
`SELECT sku_code, price FROM products WHERE sku_code = 'XYZ-123';`
Write the SQL query to build an optimized covering index that allows this search to run as an Index-Only Scan.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE UNIQUE INDEX idx_products_sku_covering 
> ON products(sku_code) 
> INCLUDE (price);
> ```
> - The search column in the `WHERE` clause is `sku_code`. Put it in the primary index parameter.
> - Use the `INCLUDE` clause to append the extra select column `price`.

---



### Exercise 2: Creating Covered Index with INCLUDE Clause

**Problem:** Create covered index on `email` including `name` payload column using `INCLUDE (name)` in Postgres 11+.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE INDEX idx_users_email_inc ON users (email) INCLUDE (name);
> ```
> ```sql
> CREATE INDEX idx_users_email_inc ON users (email) INCLUDE (name);
> ```
>
> **Explanation:** `INCLUDE (payload)` stores non-search payload attributes in index leaf nodes to enable Index Only Scans.

---

### Exercise 3: Verifying Index Only Scan in Explain

**Problem:** What node name in `EXPLAIN` indicates a fully covered index query? (`Index Only Scan`).

**Expected output:**
> [!check]- Answer
> ```text
> Index Only Scan
> ```
> ```text
> Index Only Scan
> ```
>
> **Explanation:** `Index Only Scan` proves that zero table heap pages were read from disk.

## 7. Related Terms
- [Sequential Scan vs. Index Scan](seq_scan_vs_index_scan.md) — The baseline scan options.
- [`VACUUM` / `ANALYZE`](vacuum_analyze.md) — The maintenance tasks that clean visibility maps.
---

## 8. Key Takeaways
- Index-Only Scan retrieves all selected data directly from the index file.
- Bypasses disk read loops to the table heap, offering the fastest read speeds.
- An index that contains all columns queried is called a Covering Index.
- Relies on the **Visibility Map** check to ensure transaction consistency.
- High write volume dirties pages, forcing fallbacks to standard Index Scans.
- Use the `INCLUDE` clause to attach payload columns to indexes for covering scans.
