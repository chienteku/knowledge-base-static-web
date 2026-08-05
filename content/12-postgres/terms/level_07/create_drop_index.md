# `CREATE INDEX` / `DROP INDEX`

> **Level 7 — Indexes & Query Performance**
> The SQL DDL commands used to build new search index files (`CREATE INDEX`) or remove obsolete index structures (`DROP INDEX`) from database storage.

---

## 1. Prerequisites
- [Index (Concept)](index_concept.md) — The auxiliary search data structure.
---

## 2. Term Category
- **SQL DDL Statement**

---

## 3. Environment Context
- **PostgreSQL Core DDL** (Building a standard index locks the table against writes. PostgreSQL supports the **`CONCURRENTLY`** parameter to build indexes in the background without blocking application queries).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational database engines automatically build search indexes on columns defined as a `PRIMARY KEY` or carrying a `UNIQUE` constraint. 

However, you often need to speed up searches on other non-key columns:
-   An `email` column in a `users` table that isn't the primary key.
-   A `created_at` timestamp used to sort news feeds.
-   A `category_id` used in joins.

We designed **`CREATE INDEX`** to allow developers to manually create custom search indexes on these fields.

Similarly, if an index is no longer used (for example, you removed a search feature from your app), leaving it on disk wastes storage space and slows down every write operation. 

We designed **`DROP INDEX`** to delete the index file and reclaim disk space.

---

### (2) Production Safety: `CREATE INDEX CONCURRENTLY`
By default, running `CREATE INDEX` locks the table. 

Other client connections trying to run `INSERT` or `UPDATE` queries are blocked until the index finishes compiling. 

On a table with 50 million rows, building an index can take an hour, resulting in server timeouts and website downtime.

PostgreSQL designed the **`CONCURRENTLY`** modifier to solve this. 

It instructs the database engine to build the index in the background:
-   It performs two passes over the table instead of one.
-   It allows other applications to continue reading and writing to the table normally during compilation.
-   *Note:* Concurrent builds take longer to complete and cannot be run inside transaction blocks (`BEGIN/COMMIT`).

---

### (3) Reality Metaphor
Imagine building a highway bypass road:
-   **Standard Build (`CREATE INDEX`):** Closing the old city highway completely. Construction crews lay asphalt quickly because no cars are in the way, but commuters (query requests) are gridlocked for hours.
-   **Concurrent Build (`CONCURRENTLY`):** Building the new bypass lanes in the adjacent field while cars continue to drive on the old highway. It takes longer to coordinate and build, but commuters never experience traffic delays.

---

### (4) Code Examples

#### Creating a Standard Index
```sql
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  city VARCHAR(50)
);

-- Build a standard search index on the 'city' column
CREATE INDEX idx_customers_city ON customers(city);
```

#### Creating an Index Concurrently (Production Safe)
```sql
-- Safe for high-traffic tables. Runs in background.
CREATE INDEX CONCURRENTLY idx_customers_name ON customers(name);
```

#### Removing an Index
```sql
-- Delete the index file and free disk space
DROP INDEX idx_customers_city;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running standard CREATE INDEX queries on massive production tables during peak traffic hours

**The mistake:** Executing `CREATE INDEX idx_logs_date ON transaction_logs(created_at);` on a live database containing millions of rows during peak business hours.

**Why it's wrong:** The query locks the `transaction_logs` table. Every incoming purchase script trying to write a log entry is forced to queue. 

Within minutes, connection slots fill up, the web server runs out of memory, and the entire website crashes.

**Fix: Always append the `CONCURRENTLY` keyword when creating indexes on active, production databases.**

```sql
/* Correct approach */
CREATE INDEX CONCURRENTLY idx_logs_date ON transaction_logs(created_at);
```

---



### Mistake 2: Building Production Indexes Without `CONCURRENTLY` Blocking Writes

**The mistake:** Running `CREATE INDEX idx_email ON users (email);` on a 50M row production table during peak hours.

**Why it's wrong:** Standard `CREATE INDEX` acquires a `SHARE` lock blocking all table writes until completed! Always build production indexes using `CREATE INDEX CONCURRENTLY`.

*Incorrect:*
```sql
CREATE INDEX idx_email ON users (email); -- ❌ Blocks all table writes during build!
```

*Fix:*
```sql
CREATE INDEX CONCURRENTLY idx_email ON users (email); -- Non-blocking concurrent build
```

### Mistake 3: Executing `CREATE INDEX CONCURRENTLY` inside Transaction Blocks

**The mistake:** Running `BEGIN; CREATE INDEX CONCURRENTLY idx ON t (a); COMMIT;`.

**Why it's wrong:** `CREATE INDEX CONCURRENTLY` CANNOT run inside transaction blocks in PostgreSQL, throwing error `CREATE INDEX CONCURRENTLY cannot run inside a transaction block`.

*Incorrect:*
```sql
BEGIN; CREATE INDEX CONCURRENTLY idx ON t (a); COMMIT; -- ❌ Error!
```

*Fix:*
```sql
CREATE INDEX CONCURRENTLY idx ON t (a); -- Run outside transaction blocks
```

## 6. Practice Exercises

### Exercise 1: Migration Script Design

**Problem:** You are deploying a database migration. The `articles` table has a column `published_date` that is slowing down homepage news sorting queries. Write the SQL statements to:
1.  Create a production-safe, background index named `idx_articles_pub_date` on the `published_date` column.
2.  Write the query to delete a legacy, unused index named `idx_articles_old_tags`.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE INDEX CONCURRENTLY idx_articles_pub_date ON articles(published_date);
> 
> DROP INDEX idx_articles_old_tags;
> ```
> - Remember that concurrent indexing cannot run inside transaction blocks.
> - Ensure index names are correctly spelled in the drop clause.

---



### Exercise 2: Non-Blocking Concurrent Index Creation

**Problem:** Create index `idx_logs_date` on `logs(created_at)` concurrently without blocking table writes.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE INDEX CONCURRENTLY idx_logs_date ON logs (created_at);
> ```
> ```sql
> CREATE INDEX CONCURRENTLY idx_logs_date ON logs (created_at);
> ```
>
> **Explanation:** `CONCURRENTLY` builds indexes without acquiring write-blocking locks.

---

### Exercise 3: Dropping Invalid Index Concurrently

**Problem:** Drop failed index `idx_failed` concurrently using `DROP INDEX CONCURRENTLY`.

**Expected output:**
> [!check]- Answer
> ```text
> DROP INDEX CONCURRENTLY IF EXISTS idx_failed;
> ```
> ```sql
> DROP INDEX CONCURRENTLY IF EXISTS idx_failed;
> ```
>
> **Explanation:** `DROP INDEX CONCURRENTLY` removes indexes without blocking concurrent queries.

## 7. Related Terms
- [Index (Concept)](index_concept.md) — The parent performance concept.
- [`REINDEX`](reindex.md) — Rebuilding corrupted index files.
- [B-tree Index](btree_index.md) — Related concept: B-tree Index.
---

## 8. Key Takeaways
- `CREATE INDEX` compiles helper index files to speed up column lookups.
- `DROP INDEX` deletes index files, freeing disk space and speeding up writes.
- Default index creation locks tables, blocking concurrent write transactions.
- Use `CREATE INDEX CONCURRENTLY` in production to build indexes in the background.
- Concurrent indexes require more execution time but prevent application downtime.
- Never run concurrent index creation queries inside `BEGIN/COMMIT` blocks.
