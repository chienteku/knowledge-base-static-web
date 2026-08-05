# Partial Index

> **Level 7 — Indexes & Query Performance**
> A specialized index built over a subset of rows in a table defined by a `WHERE` filtering condition, saving disk space and speeding up index compilation.

---

## 1. Prerequisites
- [B-tree Index](btree_index.md) — The default search tree structure.
- [`WHERE` Clause](../level_03/where.md) — The filter clause used to define index subsets.
---

## 2. Term Category
- **PostgreSQL Index Type**

---

## 3. Environment Context
- **PostgreSQL Core** (Fully supported. The query planner matches the query's `WHERE` clauses against the index's `WHERE` definition to verify if the index can safely resolve the query).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, creating an index on a column builds an index entry for **every single row** in the table.

However, in many applications, queries only target a small subset of rows:
-   **Active records:** You have 10 million users, but only query active users. Deactivated user records are kept only for legal audits.
-   **Unresolved states:** You have 5 million orders, but your staff dashboard only queries unresolved orders (`WHERE status = 'pending'`). Once an order is completed, it is never searched again.

If you create a standard index on `status`, you index all 5 million rows. 

The index file grows massive, consumes expensive server RAM, and slows down write operations for completed orders.

We designed the **Partial Index** to solve this. 

By appending a `WHERE` clause to the index definition, you instruct the database: *"Only index rows that match this condition."* 

This keeps the index file tiny, speeds up searches because the B-tree is shallower, and prevents write slowdowns for rows that lie outside the index condition.

---

### (2) Triggering the Partial Index
For the query planner to use a partial index, **your query's `WHERE` clause must match or be a strict subset of the index's `WHERE` clause.**

If you create an index `WHERE status = 'pending'`, and your query is `WHERE status = 'shipped'`, Postgres cannot use the index because the index does not contain shipped rows.

---

### (3) Reality Metaphor
Imagine a massive music festival with 50,000 attendees:
-   **Standard Index:** The security guard prints a massive, heavy 500-page book listing all 50,000 attendees alphabetically. It takes minutes to flip through pages.
-   **Partial Index:** Only 100 people bought **VIP tickets** (the active subset). The VIP gate guard prints a small 2-page pamphlet containing *only* the names of the 100 VIP guests (the partial index). It fits in their pocket, and checking names takes seconds.

---

### (4) Code Examples

#### Creating a Partial Index
Assume a logs table where we only care about errors:

```sql
CREATE TABLE server_logs (
  id INT PRIMARY KEY,
  level VARCHAR(10), -- 'info', 'warning', 'error'
  message TEXT,
  logged_at TIMESTAMPTZ
);

-- Build a partial index only on 'error' rows
CREATE INDEX idx_logs_error_date 
ON server_logs(logged_at) 
WHERE level = 'error';
```

#### Query Matching
```sql
-- 1. Index Scan Triggered (Query matches the partial index condition)
SELECT * FROM server_logs 
WHERE level = 'error' AND logged_at > '2026-01-01';

-- 2. Sequential Scan Triggered (Query bypasses index! 'info' is not in the index)
SELECT * FROM server_logs 
WHERE level = 'info' AND logged_at > '2026-01-01';
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Writing queries that omit the partial index filter condition

**The mistake:** Creating an index `WHERE active = TRUE`, but writing a query that doesn't mention the `active` status:

```sql
-- Index Definition
CREATE INDEX idx_active_users ON users(email) WHERE active = TRUE;

-- BAD: This query runs a slow Sequential Scan, ignoring the index!
SELECT * FROM users WHERE email = 'alice@example.com';
```

**Why it's wrong:** The query engine does not know if Alice's account is active or deactivated. Because the partial index *only* contains active users, the engine cannot safely assume Alice is in there. It is forced to scan the entire table heap.

**Fix: Always explicitly include the partial index condition in your query's `WHERE` clause.**

```sql
-- CORRECT (Index Scan Triggered)
SELECT * FROM users WHERE email = 'alice@example.com' AND active = TRUE;
```

---



### Mistake 2: Querying Partial Indexes Without Including the Partial Filter Predicate in SQL Queries

**The mistake:** Creating partial index `ON users (email) WHERE active IS TRUE` and querying `SELECT * FROM users WHERE email = 'a@ex.com';`.

**Why it's wrong:** To utilize a partial index, query filters MUST explicitly include the partial filter predicate (`active IS TRUE`). Querying `email` alone forces a `Seq Scan`.

*Incorrect:*
```sql
CREATE INDEX idx_active_email ON users (email) WHERE active IS TRUE;
SELECT * FROM users WHERE email = 'a@ex.com'; -- ❌ Missing active IS TRUE in query!
```

*Fix:*
```sql
SELECT * FROM users WHERE email = 'a@ex.com' AND active IS TRUE; -- Utilizes partial index
```

### Mistake 3: Creating Full Indexes for Soft-Deleted Tables Instead of Partial Indexes

**The mistake:** Creating full indexes on 50M row tables where 90% of rows are soft-deleted (`deleted_at IS NOT NULL`).

**Why it's wrong:** Indexing active rows only (`WHERE deleted_at IS NULL`) saves 90% of index storage RAM. Use partial indexes.

*Incorrect:*
```sql
CREATE INDEX idx_all ON orders (user_id); -- Indexes soft-deleted rows unnecessarily
```

*Fix:*
```sql
CREATE INDEX idx_active_orders ON orders (user_id) WHERE deleted_at IS NULL;
```

## 6. Practice Exercises

### Exercise 1: Unpaid Invoice Index

**Problem:** You have an `invoices` table with columns `id`, `customer_name`, `amount`, and `paid_at` (timestamp, `NULL` if unpaid). 95% of invoices are paid. Write the SQL query to create an optimized partial index named `idx_unpaid_invoices` on the `amount` column that only indexes unpaid invoices.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE INDEX idx_unpaid_invoices 
> ON invoices(amount) 
> WHERE paid_at IS NULL;
> ```
> - The condition for unpaid invoices checks for `IS NULL` status.
> - Append the `WHERE` condition at the end of the `CREATE INDEX` query.

---



### Exercise 2: Creating Partial Index for Active Records

**Problem:** Create partial index `idx_unprocessed_jobs` on `jobs(id)` where `status = 'pending'`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE INDEX idx_unprocessed_jobs ON jobs (id) WHERE status = 'pending';
> ```
> ```sql
> CREATE INDEX idx_unprocessed_jobs ON jobs (id) WHERE status = 'pending';
> ```
>
> **Explanation:** Partial indexes index only rows matching `WHERE` filter predicates.

---

### Exercise 3: Partial Unique Index for Nullable Columns

**Problem:** Create partial unique index on `passport_num` where `passport_num IS NOT NULL`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE UNIQUE INDEX idx_passport ON users (passport_num) WHERE passport_num IS NOT NULL;
> ```
> ```sql
> CREATE UNIQUE INDEX idx_passport ON users (passport_num) WHERE passport_num IS NOT NULL;
> ```
>
> **Explanation:** Partial unique indexes enforce uniqueness on non-null values while ignoring NULLs.

## 7. Related Terms
- [B-tree Index](btree_index.md) — The parent sorted tree structure.
- [Unique Index](unique_index.md) — Customizing partial unique indexes.
---

## 8. Key Takeaways
- A partial index indexes only a subset of table rows defined by a `WHERE` clause.
- Dramatically reduces index file sizes on disk, saving server RAM.
- Speeds up search scans by shrinking B-tree depths.
- Bypasses index write overhead for inserts/updates that do not match the filter.
- Query filters must explicitly match the index's `WHERE` condition to activate it.
- Highly useful for active records, flags, and unresolved status indicators.
