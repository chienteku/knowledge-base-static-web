# `TRUNCATE`

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> A high-speed SQL DDL command used to instantly empty a table by bypassing row-by-row deletion logging and allocating a fresh physical file on disk.

---

## 1. Prerequisites
- [`DELETE`](delete.md) — The standard row deletion command.

---

## 2. Term Category

**SQL Command / Clause** (Fast Table De-Allocation Command): `TRUNCATE` de-allocates all table data pages instantly without scanning individual rows under MVCC.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core DDL** (Requires an `ACCESS EXCLUSIVE` lock on the table. Immediately reclaims physical disk storage space by bypassing write-ahead logging (WAL) for individual rows).

### (1) Design Motivation — "Why did we design this?"
If you have a log table containing 20 million entries, and you want to empty it completely, you might run:

```sql
DELETE FROM system_logs;
```

However, because `DELETE` is a row-by-row operation, this query will choke your database:
1.  **Row Scans:** Postgres must scan 20 million rows, checking indexes and running delete triggers.
2.  **Log Bloat:** Postgres must write 20 million individual "delete flags" into the transaction logs (WAL) on disk so that you can rollback the transaction if you change your mind.
3.  **Locks:** The table remains locked for minutes, preventing other parts of your app from writing.

We designed the **`TRUNCATE`** command to solve this bulk-deletion problem. 

Instead of deleting rows one-by-one, `TRUNCATE` operates on the table storage file itself. It bypasses individual row scanning. 

Under the hood, Postgres simply tells the operating system: *"Delete the binary file containing this table's data on the hard drive, and create a brand new, empty file in its place."*

Because of this, `TRUNCATE` completes in **milliseconds**, regardless of whether the table contains 10 rows or 10 billion rows.

---

### (2) Critical Differences: DELETE vs. TRUNCATE

| Feature | `DELETE` | `TRUNCATE` |
| :--- | :--- | :--- |
| **SQL Class** | DML (Data Manipulation) | DDL (Data Definition) |
| **Speed** | Slow (scales with row count) | Instant (completes in milliseconds) |
| **WHERE filters** | Yes (can delete specific rows) | No (all-or-nothing) |
| **Disk Space** | Kept on disk (reclaimed later by Vacuum) | Reclaimed immediately |
| **Triggers** | Fires `BEFORE/AFTER DELETE` triggers | Bypasses individual row triggers |

---

### (3) Reality Metaphor
Imagine cleaning a school whiteboard:
-   **`DELETE`** is like taking a tiny hand eraser and rubbing out every single letter, word, and diagram one-by-one. It takes time and leaves a pile of eraser dust on the floor (bloated disk space).
-   **`TRUNCATE`** is like taking a screwdriver, unscrewing the dirty whiteboard, throwing it into the dumpster, and hanging a brand-new, clean whiteboard in its place.

---

### (4) Code Examples

#### Truncating a Table
```sql
CREATE TABLE import_buffer (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  raw_text TEXT
);

-- Fast wipe before starting a new import batch
TRUNCATE TABLE import_buffer;
```

#### Resetting Identity Sequences
By default, `TRUNCATE` keeps your identity counter going (the next insert will continue counting from where it left off). 

You can force the sequence to reset back to `1` using the `RESTART IDENTITY` clause:

```sql
TRUNCATE TABLE import_buffer RESTART IDENTITY;
-- Next insert is guaranteed to start at ID 1!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use a WHERE clause with TRUNCATE

**The mistake:** Writing `TRUNCATE TABLE users WHERE status = 'expired';`.

**Why it's wrong:** `TRUNCATE` is a Data Definition Language (DDL) command that drops the physical table file. It does not look inside the file or scan individual rows, so it cannot filter rows. 

**Fix: If you need to filter which rows to delete, you must use the standard `DELETE` command.**

---



### Mistake 2: Executing `TRUNCATE TABLE` Without `CASCADE` When Dependent Foreign Keys Exist

**The mistake:** Executing `TRUNCATE TABLE users;` when child table `orders` references `users.id` with a foreign key.

**Why it's wrong:** PostgreSQL blocks `TRUNCATE` if other tables reference target tables with foreign keys, throwing error `cannot truncate a table referenced in a foreign key constraint`. Use `TRUNCATE TABLE users CASCADE;`.

*Incorrect:*
```sql
TRUNCATE TABLE users; -- ❌ Error: foreign key dependencies exist!
```

*Fix:*
```sql
TRUNCATE TABLE users CASCADE; -- Truncates target and dependent child tables
```

### Mistake 3: Confusing `TRUNCATE` (DDL Operation) with `DELETE` (DML Operation) inside Transactions

**The mistake:** Assuming `TRUNCATE` cannot be rolled back inside a transaction.

**Why it's wrong:** Unlike some database engines, PostgreSQL SUPPORTS rolling back `TRUNCATE` statements inside transaction blocks (`BEGIN; TRUNCATE t; ROLLBACK;`).

*Incorrect:*
```sql
// Assuming TRUNCATE cannot be rolled back
```

*Fix:*
```sql
TRUNCATE is fully transactional in PostgreSQL and can be rolled back inside BEGIN...ROLLBACK
```

## 5. Practice Exercises

### Exercise 1: Fast Table De-Allocation with TRUNCATE

**Scenario:**
Clear all data rows from a 10,000,000 row log table `temp_logs` instantly.

**Requirements:**
1. Execute `TRUNCATE TABLE temp_logs`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> TRUNCATE TABLE temp_logs;
> ```
>
> #### Technical Explanation
>
> 1. `TRUNCATE` de-allocates underlying table data files instantly without scanning individual rows under MVCC.
> 2. Orders of magnitude faster than `DELETE FROM` on large tables.
> 3. Requires `TRUNCATE` table privileges.

---

### Exercise 2: Resetting Identity Sequences During Truncation

**Scenario:**
Truncate a staging table `test_items` and reset its auto-incrementing identity sequence back to 1.

**Requirements:**
1. Execute `TRUNCATE TABLE test_items RESTART IDENTITY`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> TRUNCATE TABLE test_items RESTART IDENTITY;
> ```
>
> #### Technical Explanation
>
> 1. `RESTART IDENTITY` resets identity sequence generators back to their initial starting value (1).
> 2. `CONTINUE IDENTITY` (default) preserves sequence counters.
> 3. Essential for resetting test databases between test runs.

---

### Exercise 3: Truncating Cascading Dependent Tables

**Scenario:**
Truncate parent table `categories` and all child tables referencing it using `CASCADE`.

**Requirements:**
1. Execute `TRUNCATE TABLE categories CASCADE`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> TRUNCATE TABLE categories CASCADE;
> ```
>
> #### Technical Explanation
>
> 1. `CASCADE` automatically truncates all tables holding foreign key references to the target table.
> 2. Operates quickly across whole table structures.
> 3. Use with caution.

---



## 6. Related Terms
- [`DELETE`](delete.md) — The DML row-filtering deletion command.
- [`CREATE TABLE` / `DROP TABLE`](../level_01/create_drop_table.md) — Managing table lifecycles.

---

## 7. Key Takeaways
- `TRUNCATE` is a high-speed DDL command used to completely empty a table.
- Operates on the physical file system, deleting table files and creating fresh ones.
- Runs in milliseconds, regardless of table row size.
- Reclaims physical hard drive space immediately.
- Does not support `WHERE` filters or fire individual row delete triggers.
- Append `RESTART IDENTITY` to reset auto-increment counters back to 1.
