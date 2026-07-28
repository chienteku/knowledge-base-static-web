# Table Partitioning

> **Level 10 — Administration, Security & Production**
> The database design pattern where a single logical table (parent) is physically split into smaller, independent sub-tables (partitions) on disk based on a partition key column, improving query speed and maintenance.

---

## 1. Prerequisites
- [Table (Relation)](../level_01/table.md) — The data grids partitioned.
- [`ALTER TABLE`](../level_06/alter_table.md) — Attaching or detaching partitions.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **PostgreSQL Core** (Postgres supports Declarative Partitioning natively. Partition bounds are evaluated during parsing, allowing the query planner to bypass irrelevant files).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Partition Pruning Diagnosis

**Problem:** You have a `sales_history` table partitioned by year ranges: `sales_2024`, `sales_2025`, `sales_2026`. You run this query:
`SELECT * FROM sales_history WHERE amount > 1000.00;`
1.  Explain why **Partition Pruning** fails for this query.
2.  How would you rewrite the query to enable pruning?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Partition Pruning fails because the query filter (`WHERE amount > 1000.00`) does not include the partitioning key column (`logged_date` / year). Because the planner doesn't know what years are requested, it is forced to scan every single partition on disk, losing all pruning benefits.
> ```
> - The database must know which partition boundaries contain the target rows.
> - Always include the partition key in your query filters.

---



### Exercise 2: Declarative Range Partitioning Setup

**Problem:** Create range-partitioned table `metrics` partitioned by `created_at` and create partition `metrics_2026_01` for Jan 2026.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE TABLE metrics ( id INT, created_at TIMESTAMPTZ NOT NULL, val NUMERIC, PRIMARY KEY (id, created_at) ) PARTITION BY RANGE (created_at); CREATE TABLE metrics_2026_01 PARTITION OF metrics FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
> ```
> ```sql
> CREATE TABLE metrics (
>   id INT,
>   created_at TIMESTAMPTZ NOT NULL,
>   val NUMERIC,
>   PRIMARY KEY (id, created_at)
> ) PARTITION BY RANGE (created_at);
>
> CREATE TABLE metrics_2026_01 PARTITION OF metrics
>   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
> ```
>
> **Explanation:** Declarative Range Partitioning splits large tables into manageable time-based child partitions.

---

### Exercise 3: Partition Pruning Verification

**Problem:** What query planner optimization skips un-needed child partitions during query execution? (`Partition Pruning`).

**Expected output:**
> [!check]- Answer
> ```text
> Partition Pruning
> ```
> ```text
> Partition Pruning
> ```
>
> **Explanation:** Partition Pruning eliminates un-matched child partition tables from execution scan plans.

## 7. Related Terms
- [`ALTER TABLE`](../level_06/alter_table.md) — Managing table states.
- [Index (Concept)](../level_07/index_concept.md) — Balancing indexing scales.

---

## 8. Key Takeaways
- Table Partitioning splits a logical table into separate physical files on disk.
- Optimizes query speed and database maintenance on massive tables.
- Range, List, and Hash partitioning are the three primary methods.
- **Partition Pruning** bypasses scanning irrelevant files based on query filters.
- Dropping physical partitions is instant and bypasses MVCC dead tuple bloat.
- Avoid partitioning small tables (under 10 million rows) to prevent plan lag.
- Always include the partition key in query `WHERE` clauses to trigger pruning.
