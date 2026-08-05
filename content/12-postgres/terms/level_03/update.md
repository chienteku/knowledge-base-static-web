# `UPDATE`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The fundamental SQL DML command used to modify existing data values in one or more columns for rows matching a specified `WHERE` condition.

---

## 1. Prerequisites
- [`WHERE` Clause](where.md) — The query filter used to target specific records.
- [Table (Relation)](../level_01/table.md) — Updating table column values.

---

## 2. Term Category
- **SQL DML Statement**

---

## 3. Environment Context
- **PostgreSQL Core DML** (Postgres uses a storage architecture called MVCC (Multi-Version Concurrency Control). An update does not overwrite the old bytes on disk. Instead, Postgres marks the old row as deleted, writes a new version of the row elsewhere on disk, and relies on the Vacuum cleaner to purge the dead bytes later).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Data stored in a database is rarely static. Users edit their profiles, product stock quantities fluctuate as orders are placed, and invoice statuses shift from `'pending'` to `'paid'`.

The **`UPDATE`** statement is the SQL tool for modifying existing records. 

Unlike `INSERT` (which writes new rows), `UPDATE` scans existing rows, identifies target records using a `WHERE` clause, and changes specified cell values using the `SET` command.

---

### (2) The Universal Update Danger
A critical rule of SQL is: **`UPDATE` statements without a `WHERE` clause will modify every single row in the table.**

If you run:

```sql
-- DANGER: Every single user's email becomes 'support@company.com'!
UPDATE users SET email = 'support@company.com';
```

There is no "undo" command. Unless you have a database backup or run the query inside a transaction block that you can rollback, you have permanently corrupted your data.

---

### (3) Reality Metaphor
Imagine a paper student folder cabinet:
-   **`UPDATE ... WHERE`** is like going to the folder cabinet, pulling out Alice's folder specifically (using the `WHERE name = 'Alice'` filter), and erasing her home phone number to write her new number (the `SET phone = '...'` command).
-   **`UPDATE` (no filter)** is like walking up to the cabinet with a stamp and printing `'paid'` on the front of every single folder in the building, regardless of who has actually paid.

---

### (4) Code Examples

#### Updating Single Column
```sql
CREATE TABLE client_balances (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  balance NUMERIC(10,2)
);

-- Update ONLY Bob's balance
UPDATE client_balances 
SET balance = 150.00 
WHERE name = 'Bob';
```

#### Updating Multiple Columns
You can update multiple columns in a single statement by separating assignments with commas:

```sql
-- Update balance and name in one round-trip
UPDATE client_balances 
SET balance = 200.00, name = 'Robert'
WHERE id = 101;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting the WHERE clause when writing update statements in production scripts

**The mistake:** Forgetting to write the `WHERE` clause at the bottom of your update query, resulting in a global table overwrite.

**Why it's wrong:** SQL is a set-based language. If you do not specify a filter subset, the SQL engine assumes the instruction applies to the entire set (the table). This is one of the most common ways junior developers corrupt database data.

**Fix: When writing an `UPDATE` statement, always write the `WHERE` clause FIRST, and then fill in the `SET` variables.**

---



### Mistake 2: Executing `UPDATE table SET column = val` Without a `WHERE` Clause

**The mistake:** Running `UPDATE users SET status = 'inactive';`.

**Why it's wrong:** Executing `UPDATE` without a `WHERE` clause mutates EVERY row in the target table!

*Incorrect:*
```sql
UPDATE users SET status = 'inactive'; -- 💥 Mutates all table rows!
```

*Fix:*
```sql
UPDATE users SET status = 'inactive' WHERE id = 123; -- Target specific row
```

### Mistake 3: Executing Multiple `UPDATE` Statements in Application Code instead of Single Batch Updates

**The mistake:** Running a loop executing `UPDATE users SET score = score + 1 WHERE id = x;` 5,000 times.

**Why it's wrong:** 5,000 separate `UPDATE` calls create heavy network roundtrips and WAL commit latencies. Use `UPDATE ... FROM (VALUES ...)` batch updates.

*Incorrect:*
```sql
-- Executing 5,000 separate UPDATE queries in loop
```

*Fix:*
```sql
UPDATE users SET score = v.score FROM (VALUES (1, 10), (2, 20)) AS v(id, score) WHERE users.id = v.id;
```

## 6. Practice Exercises

### Exercise 1: Inventory Update

**Problem:** You are building a store management system. A shipment of 50 new keyboards arrives. You need to update the `stock_count` of item `'SKU-KEYBOARD'` in the `products` table. The new stock count should add 50 to the current stock. Write the SQL update statement.

**Expected output:**
> [!check]- Answer
> ```sql
> UPDATE products 
> SET stock_count = stock_count + 50 
> WHERE sku = 'SKU-KEYBOARD';
> ```
> - You can reference a column's current value inside the `SET` equation (e.g. `SET col = col + 1`).
> - Target the product specifically using the unique SKU code in the `WHERE` clause.

---



### Exercise 2: Updating Rows with RETURNING Clause

**Problem:** Update user `status` to `'active'` for `id = 1` returning updated `updated_at` timestamp.

**Expected output:**
> [!check]- Answer
> ```text
> UPDATE users SET status = 'active', updated_at = NOW() WHERE id = 1 RETURNING updated_at;
> ```
> ```sql
> UPDATE users
> SET status = 'active', updated_at = NOW()
> WHERE id = 1
> RETURNING updated_at;
> ```
>
> **Explanation:** `UPDATE ... RETURNING` returns updated column attributes directly.

---

### Exercise 3: Batch UPDATE FROM Values Pattern

**Problem:** Update scores for `id = 1` (score 50) and `id = 2` (score 80) in a single batch update using `UPDATE ... FROM (VALUES ...)`.

**Expected output:**
> [!check]- Answer
> ```text
> UPDATE users SET score = v.score FROM (VALUES (1, 50), (2, 80)) AS v(id, score) WHERE users.id = v.id;
> ```
> ```sql
> UPDATE users
> SET score = v.score
> FROM (VALUES (1, 50), (2, 80)) AS v(id, score)
> WHERE users.id = v.id;
> ```
>
> **Explanation:** `UPDATE ... FROM (VALUES ...)` executes high-speed batch row mutations.

## 7. Related Terms
- [`WHERE` Clause](where.md) — The update filter anchor.
- [`RETURNING` Clause](returning.md) — Returning updated values instantly.

---

## 8. Key Takeaways
- `UPDATE` modifies column values inside existing table rows.
- Use the `SET` keyword to assign new values to columns (separated by commas).
- Always include a `WHERE` filter to target specific records for modification.
- Omitting `WHERE` applies the update to every single row in the table.
- Updates use current column values inside equations (e.g. `stock = stock + 10`).
- Postgres updates write new row versions on disk, leaving dead bytes for the Vacuum cleaner.
