# Multi-row `INSERT` / `INSERT ... SELECT`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> Techniques in SQL used to insert multiple rows of data into a table in a single query execution, either by chaining values with commas or copying records directly from another query.

---

## 1. Prerequisites
- [`INSERT INTO`](insert_into.md) — The baseline insert statement.

---

## 2. Term Category

**SQL Command / Clause** (Batch Insertion Command): Multi-row `INSERT` adds multiple tuple rows in a single atomic SQL statement for high write throughput.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DML** (Significantly reduces network overhead and transaction logging costs. Postgres executes bulk inserts inside a single database transaction block by default).

### (1) Design Motivation — "Why did we design this?"
If you need to add 1,000 new records to a database (for example, importing an inventory list), you could write a loop in your application that runs 1,000 individual `INSERT INTO` statements.

However, this is extremely slow and resource-heavy:
1.  **Network Overhead:** Your app must make 1,000 separate network trips to talk to the database server.
2.  **Parsing Overhead:** The database server must parse, analyze, and optimize 1,000 separate SQL queries.
3.  **Transaction Locks:** Each individual write commits data to the disk platter separately, clogging physical disk writes.

To optimize this, SQL provides two bulk-insert patterns: **Multi-row Values** and **`INSERT ... SELECT`**.

---

### (2) Pattern 1: Multi-row Values
Instead of repeating the `INSERT INTO` clause, you chain multiple tuples inside the `VALUES` block, separated by commas:

```sql
INSERT INTO colors (name, hex_code) 
VALUES 
  ('Red', '#FF0000'),
  ('Green', '#00FF00'),
  ('Blue', '#0000FF');
-- Inserts all 3 rows in a single network round-trip!
```

---

### (3) Pattern 2: `INSERT ... SELECT` (Data Copying)
If the data already exists in another table (for example, archiving old records or cloning table templates), you can pipe the output of a `SELECT` query directly into an `INSERT` statement without writing any hardcoded values:

```sql
-- Copy inactive users into an archive table
INSERT INTO archived_users (username, email)
SELECT username, email 
FROM users 
WHERE last_login < '2025-01-01';
```

---

### (4) Reality Metaphor
Imagine stocking shelves at a grocery store:
-   **Single Inserts:** Carrying one single can of soup from the warehouse to the shelf, placing it down, and walking back to the warehouse. Repeating this 100 times (100 trips).
-   **Multi-row Inserts:** Stacking 100 cans of soup onto a **utility cart**, wheeling it out in one trip, and placing them on the shelf together.

---

### (5) Code Examples

#### Bulk inserting products
```sql
CREATE TABLE inventory_list (
  sku VARCHAR(20) PRIMARY KEY,
  stock INT
);

-- Bulk insert
INSERT INTO inventory_list (sku, stock)
VALUES 
  ('SKU-A', 10),
  ('SKU-B', 25),
  ('SKU-C', 5);
```

#### Archiving data with Explicit Columns
Always list columns explicitly when copying to prevent structural failures:

```sql
CREATE TABLE inventory_archives (
  sku VARCHAR(20) PRIMARY KEY,
  stock INT
);

-- Copy all items with zero stock to archive
INSERT INTO inventory_archives (sku, stock)
SELECT sku, stock 
FROM inventory_list 
WHERE stock = 0;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on SELECT * in INSERT ... SELECT statements

**The mistake:** Writing a copy query like `INSERT INTO archive SELECT * FROM source;` without writing out columns:

```sql
-- BAD: Fragile, prone to breaks!
INSERT INTO archived_users SELECT * FROM users;
```

**Why it's wrong:** If a developer alters the `users` table in the future (for example, adding a new `phone` column), but forgets to update the `archived_users` table structure, the query will crash immediately due to mismatched column counts. 

**Fix: Always write out explicit column lists on both the `INSERT` and `SELECT` sides to decouple your query from table schema changes.**

```sql
-- CORRECT
INSERT INTO archived_users (username, email)
SELECT username, email FROM users;
```

---



### Mistake 2: Exceeding Driver Parameter Limits in Mass Multi-Row Insert Statements

**The mistake:** Constructing a single SQL statement inserting 100,000 rows with 5 columns (500,000 bind parameters).

**Why it's wrong:** PostgreSQL drivers have parameter count limits (e.g. 65,535 parameters in `pg`). Chunk mass insertions into batches of 1,000 to 5,000 rows.

*Incorrect:*
```sql
// Constructing 500,000 bind parameter INSERT statement
```

*Fix:*
```sql
Chunk insertions into 1,000 row batches or use COPY FROM
```

### Mistake 3: Forgetting Semicolon Separation or Syntax Commas in Multi-Row Tuple Values

**The mistake:** Writing `INSERT INTO t (a) VALUES (1) (2);` omitting commas between tuple sets.

**Why it's wrong:** Multi-row insert syntax requires comma-separated tuple sets: `VALUES (1), (2), (3)`.

*Incorrect:*
```sql
INSERT INTO t (a) VALUES (1) (2); -- ❌ Missing syntax comma!
```

*Fix:*
```sql
INSERT INTO t (a) VALUES (1), (2);
```

## 5. Practice Exercises

### Exercise 1: Batch Inserting Multiple Tuple Rows

**Scenario:**
Insert 3 new category rows into `categories` table in a single atomic SQL statement.

**Requirements:**
1. Execute `INSERT INTO categories (name) VALUES ('Tech'), ('Books'), ('Home')`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> INSERT INTO categories (name, slug) 
> VALUES 
>   ('Electronics', 'electronics'),
>   ('Books', 'books'),
>   ('Home & Garden', 'home-garden')
> RETURNING id, name;
> ```
>
> #### Technical Explanation
>
> 1. Multi-row `INSERT` bundles multiple row value tuples into a single statement.
> 2. Reduces network roundtrip latency significantly compared to multiple single-row inserts.
> 3. Executes atomically as a single transaction block.
> 
---

### Exercise 2: Batch Inserting Rows in Node.js Applications

**Scenario:**
Construct a batch `INSERT` statement in Node.js using `pg-format` or unrolled parameter markers (`$1`, `$2`, `$3`, `$4`).

**Requirements:**
1. Use parameterized multi-row insert.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { pool } from "./db";
> 
> export async function insertBatchLogs(logs: { event: string; userId: number }[]) {
>   const valueClauses = logs.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ");
>   const values = logs.flatMap(l => [l.event, l.userId]);
>   
>   const queryText = `INSERT INTO audit_logs (event, user_id) VALUES ${valueClauses} RETURNING id`;
>   return pool.query(queryText, values);
> }
> ```
> 
> #### Technical Explanation
>
> 1. Dynamically constructs `$1`, `$2` parameter placeholders for batch values.
> 2. Prevents SQL Injection while maintaining single-statement batch performance.
> 3. High throughput ingestion pattern.
> 
---

### Exercise 3: Inserting Results from SELECT Queries

**Scenario:**
Copy all high-value customers from `customers` into `vip_customers` using `INSERT INTO ... SELECT`.

**Requirements:**
1. Execute `INSERT INTO vip_customers (customer_id) SELECT id FROM customers WHERE total_spent > 10000`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> INSERT INTO vip_customers (customer_id, assigned_at)
> SELECT id, CURRENT_TIMESTAMP 
> FROM customers 
> WHERE total_spent >= 1000000;
> ```
>
> #### Technical Explanation
>
> 1. `INSERT INTO ... SELECT` bulk-inserts query output rows into a target table entirely on the database server.
> 2. Eliminates client-side data streaming overhead.
> 3. Fast server-side data migration.
> 
---



## 6. Related Terms
- [`INSERT INTO`](insert_into.md) — The parent write statement.
- [`SELECT`](select.md) — The query statement sourcing copy operations.

---

## 7. Key Takeaways
- Chaining values with commas executes bulk writes in a single statement.
- `INSERT ... SELECT` copies data rows between tables directly in the database server.
- Bulk operations reduce network latency, query parsing overhead, and log writing costs.
- Always use explicit column lists in copy queries to prevent schema structure breaks.
- Ensure column order and data types match exactly between target and source lists.
