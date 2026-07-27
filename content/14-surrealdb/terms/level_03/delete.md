# `DELETE`

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL statement used to permanently remove records from the database, supporting target table purges, constant-time Record ID deletions, and returning deleted document values back to the client.

---

## 1. Prerequisites
- [SurrealQL](../level_01/surrealql.md) — The query language context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Executed by the write planner engine. Removes records from storage and updates related database indexes and cache subscriptions dynamically).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Data cleanup is essential: deleting expired sessions, removing test records, or closing cancelled accounts.
-   **PostgreSQL:** Uses `DELETE FROM table WHERE condition;`. 
    -   It returns a numeric count (like `DELETE 1`), but does not return the deleted data unless you explicitly append a `RETURNING *` clause.
-   **MongoDB:** Uses `deleteMany({ filter })`.

We designed the **`DELETE`** statement in SurrealQL to provide a clean and unified deletion tool:
-   It keeps the standard SQL layout but eliminates the mandatory `FROM` keyword (you can write `DELETE user:john` directly).
-   **It returns the deleted record data by default** back to the client SDK (equivalent to MongoDB's `findOneAndDelete()`). 
    -   This allows your application to access user details one last time (e.g. for logging, analytics, or clearing local caching) without running lookup queries before the delete.

---

### (2) Deletion Targets
You can execute deletions at different scopes:
-   **Specific Record ID:** `DELETE user:john` (instant constant-time deletion, bypassing index scans).
-   **Entire Table:** `DELETE user` (deletes every record in the table, equivalent to purging).
-   **Filtered Query:** `DELETE user WHERE active = false` (deletes matching subset).

---

### (3) Reality Metaphor (The Shredder)
Imagine cleaning out a physical filing cabinet:
-   **SQL `DELETE`:** You locate folder `user:john`, pull it out, and toss it straight into a shredder. The clerk yells: *"One item shredded!"* (You only get a count).
-   **SurrealQL `DELETE`:** You locate folder `user:john`. 
    -   You pull it out, read the contact name and email one last time to make a note in your logbook (returning the deleted document), and then slide it into the paper shredder.

---

### (4) Code Examples

#### Deleting Records in SurrealQL
Observe the query layouts:

```sql
-- 1. Delete a single record by its ID
-- (Returns the deleted user:john document back to the client!)
DELETE user:john;

-- 2. Delete matching records using a filter
DELETE logs WHERE created_at < time::now() - 30d;

-- 3. Delete an entire table (purging)
DELETE user;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Executing a global 'DELETE <table>' query without a 'WHERE' clause, accidentally wiping out all data in the table

**The mistake:** Writing `DELETE user;` intending to delete a single user, but forgetting to specify the user ID.

**Why it's wrong:** SurrealDB does not require the `FROM` keyword, and it does not prompt you with a confirmation warning. 

Executing `DELETE user;` performs a bulk table purge, **permanently deleting every single user record in the database** instantly.

**Fix: Always specify a specific Record ID target in the `DELETE` clause, or add a strict `WHERE` filter:**

```sql
-- BAD (Purges table)
DELETE user;

-- GOOD (Deletes one record)
DELETE user:john;

-- GOOD (Deletes filtered records)
DELETE user WHERE status = "pending_deletion";
```

---



### Mistake 2: Executing Unrestricted `DELETE table;` in Production

**The mistake:** Running `DELETE user;` expecting to delete a single record.

**Why it's wrong:** `DELETE table;` without a Record ID or `WHERE` clause deletes EVERY record in the table!

*Incorrect:*
```surrealql
-- Deletes ALL records in 'user' table!
DELETE user; // 💥 Wipes entire table data!
```

*Fix:*
```surrealql
-- Target specific record ID:
DELETE user:alice;
-- Or use WHERE clause:
DELETE user WHERE active = false;
```

### Mistake 3: Confusing `DELETE` Data Removal with `REMOVE TABLE` Schema Removal

**The mistake:** Executing `DELETE user;` expecting the table schema definition to be removed.

**Why it's wrong:** `DELETE` removes record data rows while leaving table definitions intact. Use `REMOVE TABLE user;` to drop table schemas.

*Incorrect:*
```surrealql
-- Expecting to drop table schema definition
DELETE user; // Table schema remains!
```

*Fix:*
```surrealql
REMOVE TABLE user; // Drops table schema and definitions
```

## 6. Practice Exercises

### Exercise 1: Delete Query Construction

**Problem:** You are building a cleanup script for a shopping cart. 
Write the SurrealQL query to:
1.  Target the `cart` table.
2.  Delete all records where the `updated_at` field is older than `24h` (relative to the current database time).

**Expected output:**
```sql
DELETE cart WHERE updated_at < time::now() - 24h;
```

> [!check]- Answer
> - The table target is `cart`.
> - Use duration arithmetic with the `time::now()` function to calculate the time boundary.

---



### Exercise 2: Deleting Single Record by ID

**Problem:** Delete record `session:123` directly.

**Expected output:**
```text
DELETE session:123;
```

> [!check]- Answer
> ```surrealql
> DELETE session:123;
> ```
>
> **Explanation:** `DELETE table:id` deletes specific primary key records in $O(1)$ time.

### Exercise 3: Deleting Records Returning Deleted Data

**Problem:** Delete all inactive logs returning the deleted records using `RETURN BEFORE`.

**Expected output:**
```text
DELETE log WHERE active = false RETURN BEFORE;
```

> [!check]- Answer
> ```surrealql
> DELETE log WHERE active = false RETURN BEFORE;
> ```
>
> **Explanation:** `RETURN BEFORE` returns record contents prior to deletion.

## 7. Related Terms
- [`RETURN` Clause](return_clause.md) — Customizing delete outputs.
- [`UPDATE`](update.md) — Modifying records.

---

## 8. Key Takeaways
- The `DELETE` statement permanently removes records from the database.
- Bypasses the SQL requirement of the `FROM` keyword (e.g. write `DELETE user:john`).
- **Key behavior:** Returns the deleted record data to the client by default.
- Delete operations can target tables, specific IDs, or filtered scopes.
- Targeting a specific Record ID is an $O(1)$ constant-time operation.
- Running `DELETE` on a table name without filters purges the entire table.
- Verify target Record IDs and filters to prevent accidental bulk data loss.
