# Multi-row `INSERT` / `INSERT ... SELECT`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> Techniques in SQL used to insert multiple rows of data into a table in a single query execution, either by chaining values with commas or copying records directly from another query.

---

## 1. Prerequisites
- [`INSERT INTO`](insert_into.md) — The baseline insert statement.

---

## 2. Term Category
- **SQL DML Statement**

---

## 3. Environment Context
- **PostgreSQL Core DML** (Significantly reduces network overhead and transaction logging costs. Postgres executes bulk inserts inside a single database transaction block by default).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: User Copy Query

**Problem:** You have a table `registrations` and want to populate a new `newsletter_subscribers` table. The `newsletter_subscribers` table has columns `sub_email` and `subscribed_at`. Write the SQL query to copy the emails of all users who consented (`marketing_consent = TRUE`) from `registrations` into `newsletter_subscribers`. Set `subscribed_at` to the registration timestamp `registered_at`.

```sql
-- Source Table columns: id, name, email, marketing_consent, registered_at
```

**Expected output:**
> [!check]- Answer
> ```sql
> INSERT INTO newsletter_subscribers (sub_email, subscribed_at)
> SELECT email, registered_at 
> FROM registrations 
> WHERE marketing_consent;
> ```
> - Map source `email` to target `sub_email`.
> - Apply the boolean `WHERE` filter.

---



### Exercise 2: Multi-Row Insert with RETURNING Clause

**Problem:** Insert 3 tags (`'web'`, `'db'`, `'sql'`) in a single statement returning generated `id`s.

**Expected output:**
> [!check]- Answer
> ```text
> INSERT INTO tags (name) VALUES ('web'), ('db'), ('sql') RETURNING id;
> ```
> ```sql
> INSERT INTO tags (name)
> VALUES ('web'), ('db'), ('sql')
> RETURNING id;
> ```
>
> **Explanation:** Multi-row `INSERT ... RETURNING` returns generated primary keys for all inserted tuples.

---

### Exercise 3: Multi-Row Upsert Handling

**Problem:** Insert multi-row batch using `ON CONFLICT (email) DO NOTHING`.

**Expected output:**
> [!check]- Answer
> ```text
> INSERT INTO users (email) VALUES ('a@ex.com'), ('b@ex.com') ON CONFLICT (email) DO NOTHING;
> ```
> ```sql
> INSERT INTO users (email)
> VALUES ('a@ex.com'), ('b@ex.com')
> ON CONFLICT (email) DO NOTHING;
> ```
>
> **Explanation:** Multi-row upserts handle batch primary/unique key conflicts idempotently.

## 7. Related Terms
- [`INSERT INTO`](insert_into.md) — The parent write statement.
- [`SELECT`](select.md) — The query statement sourcing copy operations.

---

## 8. Key Takeaways
- Chaining values with commas executes bulk writes in a single statement.
- `INSERT ... SELECT` copies data rows between tables directly in the database server.
- Bulk operations reduce network latency, query parsing overhead, and log writing costs.
- Always use explicit column lists in copy queries to prevent schema structure breaks.
- Ensure column order and data types match exactly between target and source lists.
