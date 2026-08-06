# `CREATE INDEX` / `DROP INDEX`

> **Level 7 — Indexes & Query Performance**
> The SQL DDL commands used to build new search index files (`CREATE INDEX`) or remove obsolete index structures (`DROP INDEX`) from database storage.

---

## 1. Prerequisites
- [Index (Concept)](index_concept.md) — The auxiliary search data structure.

---

## 2. Term Category

**SQL Command / Clause** (Index DDL Statements): `CREATE INDEX` and `DROP INDEX` construct or remove index access structures over table columns.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DDL** (Building a standard index locks the table against writes. PostgreSQL supports the **`CONCURRENTLY`** parameter to build indexes in the background without blocking application queries).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Zero-Downtime Concurrent Index Creation

**Scenario:**
Create an index on a 20,000,000 row production table `users` without locking concurrent table writes (`CONCURRENTLY`).

**Requirements:**
1. Execute `CREATE INDEX CONCURRENTLY idx_users_email ON users(email)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE INDEX CONCURRENTLY idx_users_email 
> ON users (email);
> ```
>
> #### Technical Explanation
>
> 1. Standard `CREATE INDEX` acquires a `ShareLock` that blocks concurrent `INSERT`, `UPDATE`, and `DELETE` writes during index builds.
> 2. `CONCURRENTLY` builds the index in two passes without blocking write operations.
> 3. Essential zero-downtime production database administration command.
> 
---

### Exercise 2: Safely Dropping Obsolete Indexes

**Scenario:**
Safely drop an unused legacy index `idx_users_old_phone` without blocking concurrent queries (`CONCURRENTLY`).

**Requirements:**
1. Execute `DROP INDEX CONCURRENTLY IF EXISTS idx_users_old_phone`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> DROP INDEX CONCURRENTLY IF EXISTS idx_users_old_phone;
> ```
>
> #### Technical Explanation
>
> 1. `DROP INDEX` removes index access structures and reclaims disk storage.
> 2. `CONCURRENTLY` drops the index without holding exclusive locks that block active queries.
> 3. Safe production maintenance pattern.
> 
---

### Exercise 3: Handling Invalid Concurrent Indexes

**Scenario:**
Identify and resolve an `INVALID` index status caused by a failed `CREATE INDEX CONCURRENTLY` build.

**Requirements:**
1. Query `pg_index` for `indisvalid = false` and re-build with `REINDEX`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- 1. Identify invalid indexes
> SELECT indexrelid::regclass AS index_name 
> FROM pg_index 
> WHERE indisvalid = FALSE;
> 
> -- 2. Fix invalid index safely
> REINDEX INDEX CONCURRENTLY idx_users_email;
> ```
>
> #### Technical Explanation
>
> 1. If a `CREATE INDEX CONCURRENTLY` build encounters a transaction error or deadlock, PostgreSQL leaves behind an `INVALID` index entry.
> 2. Invalid indexes consume disk space but are ignored by the query planner.
> 3. Rebuilding with `REINDEX INDEX CONCURRENTLY` restores valid index state.
> 
---



## 6. Related Terms
- [Index (Concept)](index_concept.md) — The parent performance concept.
- [`REINDEX`](reindex.md) — Rebuilding corrupted index files.
- [B-tree Index](btree_index.md) — Related concept: B-tree Index.

---

## 7. Key Takeaways
- `CREATE INDEX` compiles helper index files to speed up column lookups.
- `DROP INDEX` deletes index files, freeing disk space and speeding up writes.
- Default index creation locks tables, blocking concurrent write transactions.
- Use `CREATE INDEX CONCURRENTLY` in production to build indexes in the background.
- Concurrent indexes require more execution time but prevent application downtime.
- Never run concurrent index creation queries inside `BEGIN/COMMIT` blocks.
