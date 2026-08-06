# Index-Only Scan (Covering Index)

> **Level 7 — Indexes & Query Performance**
> The fastest possible SQL read path where the database retrieves all requested query columns directly from the index file in memory, completely bypassing disk reads to the table heap.

---

## 1. Prerequisites
- [Sequential Scan vs. Index Scan](seq_scan_vs_index_scan.md) — Scenting read routes.

---

## 2. Term Category

**Performance / Optimization** (Covered Index Scan): Index-Only Scan occurs when a query projects ONLY columns present in the index, retrieving data directly from the index without reading table heap pages.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Visible inside `EXPLAIN` outputs. Relies on the database's **Visibility Map** page status checks to ensure transaction visibility without reading physical heap pages).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Writing Queries Eligible for Index-Only Scans

**Scenario:**
Create a composite index on `users(email, username)` and verify that selecting `username` where `email = 'alice@example.com'` executes an `Index-Only Scan`.

**Requirements:**
1. Execute `CREATE INDEX ON users(email, username)` and verify `EXPLAIN ANALYZE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX idx_users_email_username 
> ON users (email, username);
> 
> EXPLAIN ANALYZE 
> SELECT username 
> FROM users 
> WHERE email = 'alice@example.com';
> ```
>
> #### Technical Explanation
>
> 1. `Index-Only Scan` occurs when all projected columns in `SELECT` and filtered columns in `WHERE` exist within the index.
> 2. PostgreSQL retrieves data directly from the B-tree index without reading table heap pages.
> 3. Achieves maximum query execution speed and zero disk heap I/O.

---

### Exercise 2: Covering Queries with the INCLUDE Clause

**Scenario:**
Create a covering index on `orders(customer_id) INCLUDE (total_cents, status)` to support order summary dashboards via Index-Only Scans.

**Requirements:**
1. Execute `CREATE INDEX ON orders(customer_id) INCLUDE (total_cents, status)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX idx_orders_covering_customer 
> ON orders (customer_id) 
> INCLUDE (total_cents, status);
> 
> EXPLAIN ANALYZE 
> SELECT total_cents, status 
> FROM orders 
> WHERE customer_id = 100;
> ```
>
> #### Technical Explanation
>
> 1. `INCLUDE` appends non-key payload attributes to the leaf nodes of the B-tree index.
> 2. Enables Index-Only Scans without indexing payload columns for sorting or search boundaries.
> 3. Modern covering index pattern.

---

### Exercise 3: Visibility Map Impact on Heap Fetches

**Scenario:**
Explain why `Index-Only Scan` output shows `Heap Fetches: 0` after running `VACUUM` on the table.

**Requirements:**
1. Explain PostgreSQL Visibility Map (VM) and MVCC row visibility checks.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Visibility Map & Index-Only Scan Relationship:
> - PostgreSQL B-tree indexes do NOT store MVCC row visibility timestamps (xmin/xmax).
> - To confirm a tuple is visible to the current transaction without checking the heap, PostgreSQL checks the Visibility Map (VM).
> - If VM marks the table page as 'all-visible' (cleaned by VACUUM), Heap Fetches = 0!
> - If VM page is not all-visible, PostgreSQL MUST fetch the heap page (Heap Fetches > 0).
> ```
>
> #### Technical Explanation
>
> 1. Visibility Map tracks whether all tuples on a table page are visible to all current and future transactions.
> 2. Regular `VACUUM` maintenance keeps the Visibility Map updated, guaranteeing 0 heap fetches for Index-Only Scans.
> 3. Core PostgreSQL architecture concept.

---



## 6. Related Terms
- [Sequential Scan vs. Index Scan](seq_scan_vs_index_scan.md) — The baseline scan options.
- [`VACUUM` / `ANALYZE`](vacuum_analyze.md) — The maintenance tasks that clean visibility maps.

---

## 7. Key Takeaways
- Index-Only Scan retrieves all selected data directly from the index file.
- Bypasses disk read loops to the table heap, offering the fastest read speeds.
- An index that contains all columns queried is called a Covering Index.
- Relies on the **Visibility Map** check to ensure transaction consistency.
- High write volume dirties pages, forcing fallbacks to standard Index Scans.
- Use the `INCLUDE` clause to attach payload columns to indexes for covering scans.
