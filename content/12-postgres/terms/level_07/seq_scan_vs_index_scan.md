# Sequential Scan vs. Index Scan

> **Level 7 — Indexes & Query Performance**
> The comparison between the two primary table read strategies in SQL: scanning all rows sequentially from start to finish (`Seq Scan`) versus using a search index to jump directly to target row pointers (`Index Scan`).

---

## 1. Prerequisites
- [`EXPLAIN` / `EXPLAIN ANALYZE`](explain_analyze.md) — The commands used to inspect table scan choices.

---

## 2. Term Category
- **PostgreSQL Performance Concept**

---

## 3. Environment Context
- **PostgreSQL Core** (Decided dynamically for every query by the query planner based on estimated disk I/O costs and table statistical distributions).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When executing a query, the database engine must choose how to read table blocks from the hard drive. 

Postgres has two primary strategies:

#### 1. Sequential Scan (`Seq Scan`)
Also known as a Full Table Scan. 

The database engine reads every single page block of the table sequentially on disk, checking every row from the first to the last against your query filters.
-   *When it's good:* Excellent for small tables (e.g. less than 500 rows) because loading an index file from disk takes more time than reading the tiny table directly. It is also preferred if your query returns a large percentage of the table (e.g., retrieving 90% of rows).
-   *When it's bad:* Extremely slow on large tables (millions of rows), causing high disk read latencies.

#### 2. Index Scan
The database engine searches the B-tree index file first, retrieves the pointers (TIDs) of matching rows, and then fetches only those specific blocks from the table heap file on disk.
-   *When it's good:* Extremely fast for retrieving a small number of rows from large tables.
-   *When it's bad (The Double Read Penalty):* An index scan requires reading **two separate files** (the index file, and then the table heap file). If your query returns 50% of the table rows, jumping back-and-forth between the index and the heap files on disk is slower than simply reading the table file sequentially. 

Because of this "double read penalty," the query planner will sometimes intentionally ignore your indexes and run a `Seq Scan` instead.

---

### (2) Reality Metaphor
Imagine searching for a specific toy inside a massive cardboard shipping box:
-   **Sequential Scan:** Dumping the entire box onto the carpet and looking at every single toy one-by-one until you find the red car. (If the box only has 3 toys, this is faster than looking for a catalog list).
-   **Index Scan:** Reading a label sticker taped to the side of the box: *"Red Car: Section 3, Box A"*. You reach your hand directly into Section 3 and grab the car. You don't dump the box.

---

### (3) Code Examples

#### 1. Index Scan on Large Table (Specific Filter)
```sql
-- Assume users has 10 million rows. id is indexed.
EXPLAIN SELECT * FROM users WHERE id = 105;
-- Output:
-- Index Scan using users_pkey on users  (cost=0.29..8.30 rows=1 width=56)
```

#### 2. Seq Scan on Large Table (Broad Filter)
```sql
-- Query returns 95% of the table. Postgres ignores index on purpose!
EXPLAIN SELECT * FROM users WHERE status = 'active';
-- Output:
-- Seq Scan on users  (cost=0.00..18000.00 rows=9500000 width=56)
```

#### 3. Seq Scan on Small Table
```sql
-- Assume categories has only 5 rows. Postgres scans sequentially because it is faster!
EXPLAIN SELECT * FROM categories WHERE id = 2;
-- Output:
-- Seq Scan on categories  (cost=0.00..1.06 rows=1 width=32)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing a Sequential Scan is always an error that must be fixed with an index

**The mistake:** Panic-indexing tiny configuration tables because `EXPLAIN` showed a `Seq Scan` instead of an `Index Scan`.

**Why it's wrong:** The query planner is smart. For small tables, the entire data set fits inside a single disk page. Reading that one page takes one disk operation. Using an index would require reading the index page, finding the pointer, and then reading the data page (two disk operations). The planner chooses `Seq Scan` because it is mathematically faster.

**Fix: Trust the query planner on small tables. Only create indexes to resolve `Seq Scans` that are causing measured latency delays on large tables.**

---



### Mistake 2: Assuming `Seq Scan` Is Always Slower Than `Index Scan` on Small Tables

**The mistake:** Worrying when `EXPLAIN` shows a `Seq Scan` on a 50-row table.

**Why it's wrong:** For small tables (< 100 rows), reading table pages directly via `Seq Scan` in RAM is faster than navigating B-Tree index pointers and fetching heap pages. `Seq Scan` is optimal for small tables.

*Incorrect:*
```sql
// Forcing Index Scan on 50-row table
```

*Fix:*
```sql
Allow query planner to choose Seq Scan on small tables
```

### Mistake 3: Allowing `Seq Scan` on Large Multi-Million Row Tables for Selective Queries

**The mistake:** Allowing selective queries (`WHERE email = 'a@ex.com'`) to execute `Seq Scan` on 50M rows.

**Why it's wrong:** `Seq Scan` on large tables reads millions of disk blocks sequentially, pinning CPU and creating latency spikes. Build B-Tree indexes on search fields.

*Incorrect:*
```sql
SELECT * FROM users WHERE email = 'a@ex.com'; -- ❌ Seq Scan on 50M rows!
```

*Fix:*
```sql
CREATE INDEX idx_users_email ON users (email);
```

## 6. Practice Exercises

### Exercise 1: Scan Choice Diagnosis

**Problem:** You have a `logs` table with 10 million rows and an index on the `logged_at` timestamp.
1.  Explain why a query filtering `WHERE logged_at > '2026-07-20'` (yesterday's logs, returning 500 rows) runs an **Index Scan**.
2.  Explain why a query filtering `WHERE logged_at > '2020-01-01'` (all logs, returning 9.9 million rows) runs a **Seq Scan**, completely ignoring the index.

**Expected output:**
```text
1. The first query returns a tiny fraction of the table (500 rows). An Index Scan is highly efficient because it jumps directly to those 500 records.
2. The second query returns almost the entire table (99%). If Postgres used the index, it would have to read 9.9 million index entries, and then jump 9.9 million times to read the table heap. The "double read penalty" would make this extremely slow. A sequential scan reads the table file once from start to finish, which is much faster.
```

> [!check]- Answer
> - Evaluate the percentage of matching rows returned by each filter.
> - Consider the disk read overhead of jumping between index and heap files.

---



### Exercise 2: Seq Scan vs Index Scan Comparison

**Problem:** Compare: `Seq Scan` (Scans all table pages sequentially); `Index Scan` (Navigates B-Tree index pointers to fetch matching heap pages).

**Expected output:**
```text
Seq Scan: reads all table pages sequentially; Index Scan: navigates B-Tree pointers to fetch target heap pages
```

> [!check]- Answer
> ```text
> Seq Scan: reads all table pages sequentially; Index Scan: navigates B-Tree pointers to fetch target heap pages
> ```
>
> **Explanation:** `Index Scan` accelerates selective queries matching small fractions of table rows.

### Exercise 3: Selectivity Threshold for Index Scans

**Problem:** At what result set threshold percentage does the query planner switch from `Index Scan` to `Seq Scan`? (When query matches > ~5-15% of table rows).

**Expected output:**
```text
When matching > ~5-15% of total table rows
```

> [!check]- Answer
> ```text
> When matching > ~5-15% of total table rows
> ```
>
> **Explanation:** Scanning random disk heap pages via Index Scan becomes slower than sequential reads when matching large row fractions.

## 7. Related Terms
- [`EXPLAIN` / `EXPLAIN ANALYZE`](explain_analyze.md) — Measuring scan plans.
- [Index-Only Scan (Covering Index)](index_only_scan.md) — The fastest possible read path.

---

## 8. Key Takeaways
- Sequential Scan reads the entire table file on disk; Index Scan uses index pointers.
- Seq Scan is faster for small tables and queries returning a large percentage of rows.
- Index Scan is faster for locating small numbers of rows in large tables.
- Index Scans suffer from a "double read penalty" (index file + table heap file).
- The query planner chooses the scan strategy based on estimated disk I/O costs.
- Do not force index scans on small tables; trust the planner's cost arithmetic.
