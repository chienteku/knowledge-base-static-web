# Index (Concept)

> **Level 7 — Indexes & Query Performance**
> A separate, auxiliary data structure maintained by the database engine alongside a table to speed up data retrieval operations at the cost of additional disk space and slower write operations.

---

## 1. Prerequisites
- [Table (Relation)](../level_01/table.md) — The data grid where rows are stored.
- [`SELECT`](../level_03/select.md) — The read statements optimized by indexes.

---

## 2. Term Category
- **Database Performance / Optimization**

---

## 3. Environment Context
- **Universal Standard** (Supported in all relational and non-relational database management systems. Saved as separate physical files on disk alongside the table heap files).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational database tables store millions of rows. 

If you write a query like:
`SELECT * FROM users WHERE email = 'alice@example.com';`

How does the database find Alice's row on disk?
-   **Without an Index:** The database engine has no idea where Alice is stored. It is forced to perform a **Sequential Scan** (or Full Table Scan): it reads every single row in the table from the first block to the last block, checking if the email matches. If the table has 10 million rows, this scan takes several seconds, freezing your web server.

We designed **Indexes** to solve this read-performance bottleneck. 

An index is a separate sorted list of values (like a phonebook) that links each value to its exact physical row location on the hard drive (using pointers called Tuple IDs or TIDs). 

Instead of reading the entire table, the database searches the small index, locates Alice's email in microseconds, extracts the pointer, and jumps directly to her exact storage sector on disk.

---

### (2) The Cost of Indexes (Nothing is Free)
While indexes speed up reads, they introduce two major costs:

1.  **Disk Storage Bloat:** Indexes are physical files. A table with multiple indexes can consume double or triple the disk space of the raw table data alone.
2.  **Slower Write Speeds (Write overhead):** Every time you run `INSERT`, `UPDATE`, or `DELETE`, the database must write the data to the table *and* update all corresponding indexes to keep them in sync. If a table has 5 indexes, every write triggers 6 disk updates, slowing down save speeds.

---

### (3) Reality Metaphor
Imagine a 1,000-page encyclopedia:
-   **No Index (Sequential Scan):** You want to find where the book mentions `'Julius Caesar'`. You start on page 1 and skim every word on every page until you find it on page 412. It takes you an hour.
-   **With Index:** You turn to the alphabetical **Index Appendix** at the back of the book. You look up `'Caesar'`, see it points to `'Page 412'`, and flip directly to that page. It takes you 5 seconds.

---

### (4) Conceptual Architecture Mapping

```text
Table Data (Heap)                   Index File (e.g. B-Tree)
[TID 1: Bob, bob@example.com]       [alice@example.com -> TID 2]
[TID 2: Alice, alice@example.com]   [bob@example.com   -> TID 1]
[TID 3: Charlie, charlie@...]       [charlie@example.com -> TID 3]
```

When you query `WHERE email = 'alice@example.com'`:
1.  The database searches the sorted **Index File**.
2.  Locates `alice@example.com` and retrieves pointer `TID 2`.
3.  Jumps directly to **Table Heap Row 2** without reading Row 1 or 3.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Indexing every single column in a table to "make all queries fast"

**The mistake:** Creating indexes on `first_name`, `last_name`, `created_at`, `status`, and `zip_code` in a single table, assuming it guarantees high-speed operations.

**Why it's wrong:** While it speeds up reads on those columns, it destroys write performance. Every user sign-up or profile update will choke because the database is forced to update 5 separate index structures on disk. Furthermore, it consumes massive amounts of expensive server RAM and storage.

**Fix: Only build indexes on columns that are frequently used in `WHERE` clauses, `JOIN` conditions, or `ORDER BY` sorting fields. Never index columns with low search frequency.**

---



### Mistake 2: Creating Un-Necessary Indexes on Small Static Tables (< 100 Rows)

**The mistake:** Creating 5 indexes on a static 20-row status lookup table.

**Why it's wrong:** For tiny tables, fetching data directly via a Sequential Scan (`Seq Scan`) in RAM is faster than navigating B-Tree index pointers. Do not over-index small static lookup tables.

*Incorrect:*
```sql
// Over-indexing tiny 20-row lookup table
```

*Fix:*
```sql
Keep small lookup tables un-indexed
```

### Mistake 3: Creating Too Many Indexes on High-Volume Write Tables

**The mistake:** Adding 20 indexes to an activity log table performing 10,000 writes/sec.

**Why it's wrong:** EVERY insert, update, or delete operation MUST update all associated table indexes on disk! Excessive indexes severely degrade write throughput.

*Incorrect:*
```sql
// 20 indexes on high-throughput insertion table
```

*Fix:*
```sql
Maintain targeted composite indexes using ESR rule
```

## 6. Practice Exercises

### Exercise 1: Read/Write Trade-off Audit

**Problem:** You are building an analytics logging table `click_events` that receives 5,000 write insertions per second, but is only queried once a week by administrators to compile reports. Should you build 5 separate indexes on this table? Explain why.

**Expected output:**
```text
No, you should not build multiple indexes!
Because the table is write-heavy (5,000 inserts/sec) and read-light (once a week), the performance cost of updating indexes on every write would cripple the database. 
It is better to have slow weekly queries than to freeze the database's ability to save incoming events.
```

> [!check]- Answer
> - Balance the frequency of write transactions vs the frequency of read transactions.
> - Consider which operation impacts live users more.

---



### Exercise 2: PostgreSQL Index Types List

**Problem:** List 5 index access types supported natively in PostgreSQL (`B-Tree`, `GIN`, `GiST`, `BRIN`, `Hash`).

**Expected output:**
```text
B-Tree, GIN, GiST, BRIN, Hash
```

> [!check]- Answer
> ```text
> B-Tree, GIN, GiST, BRIN, Hash
> ```
>
> **Explanation:** PostgreSQL provides specialized index types tailored for relational, text, geospatial, and array data.

### Exercise 3: Checking Unused Indexes in System Catalog

**Problem:** Query unused indexes with 0 scans from `pg_stat_user_indexes`.

**Expected output:**
```text
SELECT indexrelname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0;
```

> [!check]- Answer
> ```sql
> SELECT indexrelname, idx_scan
> FROM pg_stat_user_indexes
> WHERE idx_scan = 0;
> ```
>
> **Explanation:** `pg_stat_user_indexes` tracks index scan statistics to identify candidate indexes for cleanup.

## 7. Related Terms
- [`CREATE INDEX` / `DROP INDEX`](create_drop_index.md) — The SQL commands.
- [Sequential Scan vs. Index Scan](seq_scan_vs_index_scan.md) — Scenting read routes.

---

## 8. Key Takeaways
- An index is a helper data structure that speeds up database reads.
- Links search values directly to physical row pointers (TIDs) on disk.
- Prevents slow Sequential Scans that read entire tables off the hard drive.
- Wastes extra disk storage space and slows down write operations (`INSERT`/`DELETE`).
- **Rule of Thumb:** Only index columns used frequently in filters, joins, or sorts.
- Avoid over-indexing to protect database write transaction performance.
