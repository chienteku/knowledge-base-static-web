# `REINDEX`

> **Level 7 — Indexes & Query Performance**
> The PostgreSQL maintenance command used to rebuild index files from scratch using current table data to reclaim bloated disk space, repair index corruption, and restore search performance.

---

## 1. Prerequisites
- [`CREATE INDEX` / `DROP INDEX`](create_drop_index.md) — The lifecycle index DDL.
- [`VACUUM` / `ANALYZE`](vacuum_analyze.md) — The parent table cleaning concepts.

---

## 2. Term Category
- **PostgreSQL Command**

---

## 3. Environment Context
- **PostgreSQL Core** (Requires exclusive locks by default. PostgreSQL supports **`REINDEX CONCURRENTLY`** to rebuild indexes in the background without blocking database traffic).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Just like tables suffer from table bloat (dead tuples), **index files suffer from index bloat**.

When you run thousands of updates or deletes on a table:
-   Postgres deletes row pointers inside the B-tree index.
-   However, the physical B-tree nodes on disk do not automatically shrink.
-   Instead, the index file keeps its large size, containing empty spaces.

Over time, this index bloat causes:
-   The index file to consume excessive disk space.
-   Index pages to fill up database RAM buffers, leaving less memory for query results.
-   Index scans to slow down because the engine has to search through empty, dead nodes.

In rare scenarios (like server power failures or hard drive write errors), index files can also become physically **corrupted**, returning wrong query results or crashing transactions.

We designed the **`REINDEX`** command to solve this. 

It reads the table, discards the old bloated or corrupted index file on disk, and builds a brand new, packed index from scratch.

---

### (2) Production Safety: `REINDEX CONCURRENTLY`
Just like index creation, standard `REINDEX` locks the table against writes. 

To prevent website downtime, PostgreSQL (v12+) supports **`REINDEX CONCURRENTLY`**. 

This rebuilds the index in the background:
-   It keeps the old index active for queries while compiling the new index.
-   It swaps them once the new index is fully built, preventing lockouts.

---

### (3) Reality Metaphor
Imagine a library index card cabinet:
-   **Index Bloat:** Over the years, the librarian throws away hundreds of books. They cross out titles on the index cards, but leave the cards in the drawer. The cabinet is stuffed with dirty cards, making it hard to search.
-   **`REINDEX`:** The librarian takes the drawer, dumps all crossed-out cards in the trash, prints brand-new, clean index cards for only the active books, and files them tightly back in the drawer.

---

### (4) Code Examples

#### Reindexing a Specific Index
```sql
CREATE TABLE staff (
  id INT PRIMARY KEY,
  email VARCHAR(100) UNIQUE
);

-- Rebuild a specific index file
REINDEX INDEX staff_email_key;
```

#### Reindexing an Entire Table Concurrently (Production Safe)
Rebuilds all indexes on the table (including unique and primary key indexes) in the background:

```sql
-- Safe for live databases (PostgreSQL 12+)
REINDEX TABLE CONCURRENTLY staff;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running standard REINDEX queries on massive production databases during peak hours

**The mistake:** Executing `REINDEX TABLE customers;` on a table with 20 million rows during a busy business day.

**Why it's wrong:** The command locks the `customers` table. Every user trying to check out or edit their profile is blocked, crashing your website.

**Fix: Always append the `CONCURRENTLY` keyword when reindexing active production tables.**

```sql
/* Correct approach */
REINDEX TABLE CONCURRENTLY customers;
```

---



### Mistake 2: Running Non-Concurrent `REINDEX TABLE` on Production High-Traffic Tables

**The mistake:** Executing `REINDEX TABLE heavy_table;` during peak traffic hours.

**Why it's wrong:** Standard `REINDEX` acquires an `ACCESS EXCLUSIVE` lock on the target table, blocking ALL reads and writes until index re-building completes! Use `REINDEX TABLE CONCURRENTLY`.

*Incorrect:*
```sql
REINDEX TABLE heavy_table; -- ❌ Blocks all table reads and writes!
```

*Fix:*
```sql
REINDEX TABLE CONCURRENTLY heavy_table; -- Non-blocking concurrent reindex
```

### Mistake 3: Re-Indexing Healthy Tables Regularly Without Bloat Verification

**The mistake:** Running automated nightly `REINDEX` cron jobs on all database tables.

**Why it's wrong:** In modern PostgreSQL (12+), B-Tree index bloat is self-managed by B-Tree space recycling. Indiscriminate re-indexing wastes CPU and disk IOPS. Verify index bloat before re-indexing.

*Incorrect:*
```sql
// Nightly indiscriminate REINDEX on all healthy tables
```

*Fix:*
```sql
Monitor index bloat via pgstatindex before executing REINDEX CONCURRENTLY
```

## 6. Practice Exercises

### Exercise 1: Bloat Recovery Script

**Problem:** You have a high-volume database table `session_store` containing indexes `idx_sessions_token` and `idx_sessions_expiry`. The indexes have become bloated from daily session deletes. Write the SQL query to rebuild all indexes on the `session_store` table in the background without locking database traffic.

**Expected output:**
```sql
REINDEX TABLE CONCURRENTLY session_store;
```

> [!check]- Answer
> - Specify the table target rather than individual index files.
> - Append the concurrency modifier.

---



### Exercise 2: Concurrent Re-Indexing Command

**Problem:** Reindex table `users` concurrently without blocking queries in Postgres 12+.

**Expected output:**
```text
REINDEX TABLE CONCURRENTLY users;
```

> [!check]- Answer
> ```sql
> REINDEX TABLE CONCURRENTLY users;
> ```
>
> **Explanation:** `REINDEX TABLE CONCURRENTLY` rebuilds bloated indexes without acquiring write locks.

### Exercise 3: Re-Indexing Specific Index

**Problem:** Reindex specific bloated index `idx_orders_user_id` concurrently.

**Expected output:**
```text
REINDEX INDEX CONCURRENTLY idx_orders_user_id;
```

> [!check]- Answer
> ```sql
> REINDEX INDEX CONCURRENTLY idx_orders_user_id;
> ```
>
> **Explanation:** `REINDEX INDEX` targets individual index objects for bloat repair.

## 7. Related Terms
- [`CREATE INDEX` / `DROP INDEX`](create_drop_index.md) — Sourcing indexes.
- [`VACUUM` / `ANALYZE`](vacuum_analyze.md) — Table slot cleanup.

---

## 8. Key Takeaways
- `REINDEX` rebuilds index files from scratch using current table data.
- Reclaims disk storage space from bloated B-tree index nodes.
- Repairs index corruption caused by system crashes or write failures.
- Standard `REINDEX` locks tables; use `REINDEX CONCURRENTLY` in production.
- Reindexing tables also rebuilds primary and unique constraint indexes.
- Reindexing should be run periodically on high-update tables to keep queries fast.
