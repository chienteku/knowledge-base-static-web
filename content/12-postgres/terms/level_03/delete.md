# `DELETE`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> The fundamental SQL DML command used to remove rows of data from a table based on a specified `WHERE` condition.

---

## 1. Prerequisites
- [`WHERE` Clause](where.md) — The query filter used to target specific records.
- [Table (Relation)](../level_01/table.md) — Deleting table rows.

---

## 2. Term Category
- **SQL DML Statement**

---

## 3. Environment Context
- **PostgreSQL Core DML** (Postgres flags deleted rows as invisible (using MVCC visibility maps) rather than instantly erasing them from physical disk sectors. The physical storage space is only reclaimed for reuse when the database runs its background **Vacuum** process).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Data in a database cannot grow forever. To keep database drives clean, you must delete obsolete records:
-   A customer cancels their subscription.
-   A user deletes a message.
-   An administrative job clears test data rows.

The **`DELETE`** statement is the standard SQL DML command for removing rows from a table. 

It targets records using a `WHERE` clause, scans for matches, and deletes the rows.

---

### (2) The Universal Delete Danger
Just like `UPDATE`, **`DELETE` queries without a `WHERE` clause will delete every single row in the table.**

```sql
-- DANGER: Instantly empties the entire users table!
DELETE FROM users;
```

Running this command inside a production database by accident is a catastrophic mistake. 

While the table *structure* (columns, types) remains, every row of data is gone.

---

### (3) Reality Metaphor
Imagine a paper student folder cabinet:
-   **`DELETE ... WHERE`** is like walking to the cabinet, searching for Charlie's folder specifically (the `WHERE name = 'Charlie'` filter), pulling the folder out, and dropping it into the paper shredder.
-   **`DELETE` (no filter)** is like pulling every single folder out of the cabinet drawers and throwing them all into the paper shredder, leaving you with a cabinet of empty drawers.

---

### (4) Code Examples

#### Deleting a Single Row
```sql
CREATE TABLE support_tickets (
  id INT PRIMARY KEY,
  client_name VARCHAR(100),
  status VARCHAR(20)
);

-- Delete ONLY ticket ID 5
DELETE FROM support_tickets 
WHERE id = 5;
```

#### Deleting Multiple Rows with Filters
You can delete groups of rows matching conditional checks:

```sql
-- Delete all resolved tickets
DELETE FROM support_tickets 
WHERE status = 'resolved';
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting the WHERE clause when writing delete queries

**The mistake:** Forgetting to append the `WHERE` clause to your query, resulting in empty tables.

**Why it's wrong:** SQL operates on tables as whole mathematical sets. If you do not specify a filter subset, the SQL engine deletes the entire set. 

**Fix: Always write the `WHERE` clause first when drafting a delete statement, or test your filter logic using a safe `SELECT *` query first before swapping `SELECT *` for `DELETE`.**

```sql
-- Step 1: Verify the rows you want to delete
SELECT * FROM support_tickets WHERE status = 'expired';

-- Step 2: Swap the query starter once you confirm the targets are correct
DELETE FROM support_tickets WHERE status = 'expired';
```

---



### Mistake 2: Executing `DELETE FROM table` Without a `WHERE` Clause

**The mistake:** Running `DELETE FROM users;` expecting to delete a single test user.

**Why it's wrong:** Executing `DELETE FROM table` without a `WHERE` clause deletes EVERY row in the target table!

*Incorrect:*
```sql
DELETE FROM users; -- 💥 Deletes all table rows!
```

*Fix:*
```sql
DELETE FROM users WHERE id = 123; -- Explicit primary key filter
```

### Mistake 3: Using `DELETE FROM` for Wiping Large Multi-Million Row Tables Instead of `TRUNCATE`

**The mistake:** Executing `DELETE FROM logs;` on a 50-million row table.

**Why it's wrong:** `DELETE` writes individual delete tuples to the Write-Ahead Log (WAL) for every single row, taking minutes. Use `TRUNCATE logs;` for instantaneous table wiping.

*Incorrect:*
```sql
DELETE FROM logs; -- Slow row-by-row WAL logging
```

*Fix:*
```sql
TRUNCATE TABLE logs; -- Fast DDL table truncation
```

## 6. Practice Exercises

### Exercise 1: Session Expiry Cleanup

**Problem:** You are building a session cleanup daemon. The `user_sessions` table has columns `session_token`, `username`, and `expires_at`. Write the SQL query to delete all sessions that have expired (where the `expires_at` timestamp is strictly less than the current time `NOW()`).

**Expected output:**
> [!check]- Answer
> ```sql
> DELETE FROM user_sessions 
> WHERE expires_at < NOW();
> ```
> - Target the session table using the `DELETE FROM` clause.
> - Use the inequality operator `<` to compare expiration times to `NOW()`.

---



### Exercise 2: Deleting Rows with RETURNING Clause

**Problem:** Delete inactive users updated before 2026 returning deleted user IDs.

**Expected output:**
> [!check]- Answer
> ```text
> DELETE FROM users WHERE last_login < '2026-01-01' RETURNING id;
> ```
> ```sql
> DELETE FROM users
> WHERE last_login < '2026-01-01'
> RETURNING id;
> ```
>
> **Explanation:** `DELETE ... RETURNING` returns column attributes of deleted rows.

---

### Exercise 3: Deleting Rows with Subquery Predicate

**Problem:** Delete posts where `author_id` belongs to banned users in `banned_users` table.

**Expected output:**
> [!check]- Answer
> ```text
> DELETE FROM posts WHERE author_id IN (SELECT id FROM banned_users);
> ```
> ```sql
> DELETE FROM posts
> WHERE author_id IN (SELECT id FROM banned_users);
> ```
>
> **Explanation:** Subquery predicates filter rows targeted for deletion.

## 7. Related Terms
- [`WHERE` Clause](where.md) — The query target filter.
- [`TRUNCATE`](truncate.md) — The high-speed table emptying alternative.
- [`RETURNING` Clause](returning.md) — Related concept: `RETURNING` Clause.

---

## 8. Key Takeaways
- `DELETE` removes row records from a database table.
- Always append a `WHERE` clause to target specific rows for deletion.
- Omitting the `WHERE` clause deletes every single row in the table.
- Deletions are irreversible; verify filters using `SELECT` queries beforehand.
- Postgres flags deleted rows internally; space is reclaimed later by the Vacuum process.
