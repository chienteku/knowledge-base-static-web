# `UPDATE`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The fundamental SQL DML command used to modify existing data values in one or more columns for rows matching a specified `WHERE` condition.

---

## 1. Prerequisites
- [`WHERE` Clause](where.md) — The query filter used to target specific records.
- [Table (Relation)](../level_01/table.md) — Updating table column values.

---

## 2. Term Category

**SQL Command / Clause** (Row Modification Command): `UPDATE` modifies existing column values across matching table rows.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DML** (Postgres uses a storage architecture called MVCC (Multi-Version Concurrency Control). An update does not overwrite the old bytes on disk. Instead, Postgres marks the old row as deleted, writes a new version of the row elsewhere on disk, and relies on the Vacuum cleaner to purge the dead bytes later).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Target Row Value Modification

**Scenario:**
Update user status to `'active'` and update `last_login` timestamp for user `id = 15`.

**Requirements:**
1. Execute `UPDATE users SET status = ..., last_login = ... WHERE id = 15`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> UPDATE users 
> SET status = 'active',
>     last_login = CURRENT_TIMESTAMP 
> WHERE id = 15 
> RETURNING id, username, status, last_login;
> ```
>
> #### Technical Explanation
>
> 1. `UPDATE` sets new column values across rows matching the `WHERE` clause.
> 2. `WHERE id = 15` restricts modification to a single target row.
> 3. `RETURNING` verifies updated column state.
> 
---

### Exercise 2: Multi-Row Conditional Batch Updates

**Scenario:**
Increase prices by 10% (`price_cents * 1.10`) for all products in category `'electronics'`.

**Requirements:**
1. Execute `UPDATE products SET price_cents = price_cents * 1.10 WHERE category = 'electronics'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> UPDATE products 
> SET price_cents = ROUND(price_cents * 1.10) 
> WHERE category = 'electronics' 
> RETURNING id, name, price_cents;
> ```
>
> #### Technical Explanation
>
> 1. Modifies all rows satisfying the `WHERE` filter.
> 2. `ROUND()` ensures price integer cents remain whole numbers.
> 3. Executes atomically as a single transaction.
> 
---

### Exercise 3: Preventing Unbounded Table Wipes

**Scenario:**
Audit a buggy `UPDATE` query that accidentally omitted the `WHERE` clause.

**Requirements:**
1. Explain the consequences of `UPDATE table SET col = val` without `WHERE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- ❌ DANGEROUS: Omitting WHERE updates EVERY row in the table!
> -- UPDATE users SET is_active = FALSE;
> 
> -- ✅ SAFE: Always specify target row filters
> UPDATE users SET is_active = FALSE WHERE id = 100;
> ```
>
> #### Technical Explanation
>
> 1. Omitting `WHERE` applies modifications to EVERY row in the table.
> 2. Under MVCC, writes new versions for all rows, causing severe table bloat.
> 3. Always write `WHERE` clauses first when authoring `UPDATE` queries.
> 
---



## 6. Related Terms
- [`WHERE` Clause](where.md) — The update filter anchor.
- [`RETURNING` Clause](returning.md) — Returning updated values instantly.

---

## 7. Key Takeaways
- `UPDATE` modifies column values inside existing table rows.
- Use the `SET` keyword to assign new values to columns (separated by commas).
- Always include a `WHERE` filter to target specific records for modification.
- Omitting `WHERE` applies the update to every single row in the table.
- Updates use current column values inside equations (e.g. `stock = stock + 10`).
- Postgres updates write new row versions on disk, leaving dead bytes for the Vacuum cleaner.
