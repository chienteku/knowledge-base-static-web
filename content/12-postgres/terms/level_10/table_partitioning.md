# Table Partitioning

> **Level 10 — Administration, Security & Production**
> The database design pattern where a single logical table (parent) is physically split into smaller, independent sub-tables (partitions) on disk based on a partition key column, improving query speed and maintenance.

---

## 1. Prerequisites
- [Table (Relation)](../level_01/table.md) — The data grids partitioned.
- [`ALTER TABLE`](../level_06/alter_table.md) — Attaching or detaching partitions.

---

## 2. Term Category

**Performance / Optimization** (Declarative Table Partitioning): Declarative Partitioning (`PARTITION BY RANGE/LIST/HASH`) splits massive master tables into smaller physical partition tables.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Postgres supports Declarative Partitioning natively. Partition bounds are evaluated during parsing, allowing the query planner to bypass irrelevant files).

### (1) Design Motivation — "Why did we design this?"
When a table grows extremely large (e.g., a `logs` table containing 500 million rows or a `transactions` table storing 10 years of sales):
-   **Index Slowdowns:** Even with B-tree indexes, searching through a 50GB index requires massive server RAM, slowing down lookups.
-   **Purging Bottlenecks:** If you want to delete logs older than 1 year, running `DELETE FROM logs WHERE created_at < ...` locks the table, writes gigabytes to the WAL, generates millions of dead tuples, and triggers massive table bloat.

We designed **Table Partitioning** to solve these scale bottlenecks. 

It allows you to declare a single logical parent table, but instruct PostgreSQL to split the rows into separate physical files on disk based on a **Partition Key** (typically a date column).

---

### (2) Key Partitioning Methods
-   **Range Partitioning:** Splitting by value ranges. E.g. creating one partition per month: `logs_2026_01`, `logs_2026_02`.
-   **List Partitioning:** Splitting by an explicit list of values. E.g. partitioning by country: `users_us`, `users_uk`.
-   **Hash Partitioning:** Splitting using a modulus hash. Distributes rows evenly across a fixed number of partitions (e.g. modulus 4).

---

### (3) The Major Benefits

#### 1. Partition Pruning (High-Speed Queries)
If a user queries:
`SELECT * FROM logs WHERE created_at BETWEEN '2026-01-01' AND '2026-01-15';`

The query planner analyzes the query, identifies that only the `logs_2026_01` partition matches, and scans **only** that physical file. It completely ignores all other 11 monthly partitions on disk, speeding up reads.

#### 2. Instant Deletions
Instead of running a slow `DELETE` query, you can drop old data instantly by dropping its physical partition:
`DROP TABLE logs_2025_01;`

This takes microseconds, generates zero dead tuples, and instantly returns disk space to the operating system.

---

### (4) Reality Metaphor
Imagine sorting paper receipts:
-   **Unpartitioned Table:** Storing 1 million receipts inside a single, massive cardboard chest. To find a receipt from last January, you have to dig through the entire chest.
-   **Partitioned Table:** A file cabinet containing 12 drawers labeled by month: **`[January] [February] ... [December]`**. 
    -   When filing a receipt, you slide it into the matching drawer (partition key). 
    -   When searching for a January receipt, you open only the January drawer (partition pruning). 
    -   If you want to throw away January's receipts, you pull out the drawer and dump it in the trash instantly.

---

### (5) Code Examples

#### Creating a Range Partitioned Schema
First, create the logical parent table specifying the partitioning key:

```sql
CREATE TABLE transaction_logs (
  id INT,
  amount NUMERIC(10,2),
  logged_at DATE NOT NULL
) PARTITION BY RANGE (logged_at); -- Set Partition Key
```

Next, compile the physical child partition tables:

```sql
-- Create partition for January 2026 (Note boundaries: FROM is inclusive, TO is exclusive)
CREATE TABLE logs_2026_01 PARTITION OF transaction_logs
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Create partition for February 2026
CREATE TABLE logs_2026_02 PARTITION OF transaction_logs
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

When you insert rows, Postgres routes them automatically:

```sql
-- This row is automatically saved inside the 'logs_2026_01' physical file!
INSERT INTO transaction_logs VALUES (10, 50.00, '2026-01-15');
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Partitioning tables that are too small

**The mistake:** Partitioning a `products` table containing only 20,000 rows because it makes the schema "look advanced."

**Why it's wrong:** Partitioning introduces administrative overhead. The query planner has to analyze partitioning keys, route insert values, and coordinate files on every query. 

On small tables, this routing overhead actually makes queries slower than a simple B-tree index scan.

**Fix: Only partition tables when they grow beyond 10 million rows or multiple gigabytes on disk, or when you have a strict requirement to purge old data regularly.**

---



### Mistake 2: Omitting Partition Keys from Unique and Primary Key Constraints

**The mistake:** Creating a range-partitioned table on `created_at` and defining `PRIMARY KEY (id)`.

**Why it's wrong:** In PostgreSQL declarative partitioning, ALL UNIQUE and PRIMARY KEY constraints on partitioned tables MUST include the partition key (`created_at`)! Primary key MUST be `PRIMARY KEY (id, created_at)`.

*Incorrect:*
```sql
CREATE TABLE logs ( id INT PRIMARY KEY, created_at TIMESTAMPTZ ) PARTITION BY RANGE (created_at); -- ❌ Missing created_at in PK!
```

*Fix:*
```sql
CREATE TABLE logs ( id INT, created_at TIMESTAMPTZ, PRIMARY KEY (id, created_at) ) PARTITION BY RANGE (created_at);
```

### Mistake 3: Forgetting to Create a `DEFAULT` Partition (Data Insertion Failure)

**The mistake:** Inserting a row with timestamp `'2027-01-01'` when partitions exist ONLY for 2026.

**Why it's wrong:** Inserting data that does not fit into any existing range partition throws fatal error `no partition of relation ... found for row`. Create future partitions or a `DEFAULT` partition.

*Incorrect:*
```sql
INSERT INTO logs VALUES (1, '2027-01-01'); -- ❌ Error: no partition found!
```

*Fix:*
```sql
CREATE TABLE logs_default PARTITION OF logs DEFAULT;
```

## 5. Practice Exercises

### Exercise 1: Creating Range-Partitioned Tables

**Scenario:**
Create a master `audit_logs` table range-partitioned by `created_at` (`PARTITION BY RANGE (created_at)`), alongside monthly partition tables for 2026.

**Requirements:**
1. Create master table with `PARTITION BY RANGE (created_at)`.
2. Create partition tables `FOR VALUES FROM ('2026-01-01') TO ('2026-02-01')`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE audit_logs (
>   id BIGINT GENERATED ALWAYS AS IDENTITY,
>   event_name TEXT NOT NULL,
>   created_at TIMESTAMPTZ NOT NULL
> ) PARTITION BY RANGE (created_at);
> 
> CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs 
> FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-02-01 00:00:00+00');
> 
> CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs 
> FOR VALUES FROM ('2026-02-01 00:00:00+00') TO ('2026-03-01 00:00:00+00');
> ```
>
> #### Technical Explanation
>
> 1. Declarative Range Partitioning splits a massive logical table into distinct physical partition tables.
> 2. `PARTITION BY RANGE` routes inserts and queries automatically based on range boundaries.
> 3. Essential architecture for multi-terabyte log tables.
> 
---

### Exercise 2: Verifying Partition Pruning via EXPLAIN

**Scenario:**
Verify that querying `audit_logs` for January 2026 queries ONLY `audit_logs_2026_01` (Partition Pruning).

**Requirements:**
1. Execute `EXPLAIN ANALYZE SELECT * FROM audit_logs WHERE created_at = '2026-01-15'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> EXPLAIN ANALYZE 
> SELECT * FROM audit_logs 
> WHERE created_at = '2026-01-15 10:00:00+00';
> ```
>
> #### Technical Explanation
>
> 1. Partition Pruning allows the query planner to bypass scanning partition tables whose range bounds do not match the `WHERE` filter.
> 2. `EXPLAIN` shows query execution occurring ONLY on `audit_logs_2026_01`.
> 3. Dramatically reduces disk I/O scan costs on multi-billion row tables.
> 
---

### Exercise 3: Dropping Historical Partitions Instantly

**Scenario:**
Drop all audit logs for January 2026 instantly without executing individual row deletions.

**Requirements:**
1. Execute `DROP TABLE audit_logs_2026_01`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> DROP TABLE audit_logs_2026_01;
> ```
>
> #### Technical Explanation
>
> 1. `DROP TABLE partition_name` de-allocates millions of historical log rows instantly by dropping the physical partition file from disk.
> 2. Avoids issuing expensive `DELETE FROM` statements that generate heavy MVCC WAL bloat.
> 3. Instant data retention lifecycle management.
> 
---



## 6. Related Terms
- [`ALTER TABLE`](../level_06/alter_table.md) — Managing table states.
- [Index (Concept)](../level_07/index_concept.md) — Balancing indexing scales.

---

## 7. Key Takeaways
- Table Partitioning splits a logical table into separate physical files on disk.
- Optimizes query speed and database maintenance on massive tables.
- Range, List, and Hash partitioning are the three primary methods.
- **Partition Pruning** bypasses scanning irrelevant files based on query filters.
- Dropping physical partitions is instant and bypasses MVCC dead tuple bloat.
- Avoid partitioning small tables (under 10 million rows) to prevent plan lag.
- Always include the partition key in query `WHERE` clauses to trigger pruning.
