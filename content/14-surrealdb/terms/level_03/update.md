# `UPDATE`

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL statement used to modify existing records inside a table, supporting specific Record ID targets and automatic record creation if the target key is absent from the database.

---

## 1. Prerequisites
- [SurrealQL](../level_01/surrealql.md) — The query language context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Executed by the write planner engine. Triggers index re-evaluations and updates cached query subscriptions dynamically).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Data changes constantly: users update emails, product prices shift, and metrics accumulate.
-   **PostgreSQL:** Uses `UPDATE table SET column = value WHERE condition;`. 
    -   If the row does not exist, the query returns `0 rows affected` and does nothing. 
    -   If you want to create it, you must write a separate, verbose `INSERT ON CONFLICT` statement.
-   **MongoDB:** Uses `updateOne({ filter }, { $set: { value } })`.

We designed the **`UPDATE`** statement in SurrealQL to act as a direct, high-performance modifier. 

It keeps the standard SQL layout but introduces a crucial behavior: 

If you target a specific Record ID (e.g. `UPDATE user:john`) and that record does not exist on disk, **SurrealDB will create the record on the fly**. 

This makes `UPDATE` a default, convenient upsert tool for single-document targets. 

Like `CREATE`, it returns the fully updated records back to the client SDK immediately, eliminating extra lookup requests.

---

### (2) Targeting Contexts
You can execute updates at different scopes:
-   **Specific Record ID:** `UPDATE user:john SET email = "new@mail.com"` (instant, constant-time lookup).
-   **Entire Table:** `UPDATE user SET status = "inactive"` (updates every document in the table).
-   **Filtered Query:** `UPDATE user SET status = "inactive" WHERE last_login < time::now() - 30d` (updates matching subset).

---

### (3) Reality Metaphor (Filing Edits)
Imagine updating customer files:
-   **SQL `UPDATE`:** You search for folder `user:david`. 
    -   If you find it, you erase their old email and write the new one. 
    -   If the folder is missing, you close the drawer and do nothing.
-   **SurrealQL `UPDATE`:** You search for folder `user:david`. 
    -   If it exists, you update the details. 
    -   If the folder is missing, you take a blank Manila folder, write the tab label **`user:david`**, write the email inside, and slide it in. (Creates on the fly).

---

### (4) Code Examples

#### Updating Records in SurrealQL
Observe the query layouts:

```sql
-- 1. Update a single record (Fuses target to ID directly)
-- (If 'user:john' does not exist, this query creates it!)
UPDATE user:john SET email = "john@example.com", active = true;

-- 2. Update a filtered subset of a table
UPDATE user SET status = "dormant" WHERE last_login < time::now() - 90d;

-- 3. Increment a value inside a update statement
UPDATE product:laptop SET views += 1;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running an 'UPDATE <table> SET ...' command without specifying a Record ID or a 'WHERE' clause, accidentally modifying all records in the table

**The mistake:** Running the query `UPDATE user SET role = "guest";` intending to update a single user, but forgetting to specify the user ID.

**Why it's wrong:** Unlike some modern ORMs, SurrealDB does not block global update statements. 

Executing `UPDATE user SET ...` without a filter runs a bulk operation that overwrites the `role` field to `"guest"` for **every single record in the entire `user` table**, corrupting your user permissions.

**Fix: Always specify a specific Record ID target in the `UPDATE` clause, or add a strict `WHERE` filter:**

```sql
-- BAD (Overwrites entire table)
UPDATE user SET role = "guest";

-- GOOD: Targets one record
UPDATE user:john SET role = "guest";

-- GOOD: Filters target records
UPDATE user SET role = "guest" WHERE registration_pending = true;
```

---



### Mistake 2: Overwriting Entire Records using `UPDATE ... CONTENT` instead of `MERGE` or `SET`

**The mistake:** Running `UPDATE user:alice CONTENT { age: 31 };` expecting `name` field to remain intact.

**Why it's wrong:** `CONTENT` replaces the entire record object with the new object, wiping all omitted fields! Use `MERGE` or `SET`.

*Incorrect:*
```surrealql
-- Wipes existing fields!
UPDATE user:alice CONTENT { age: 31 }; // ❌ Deletes name field!
```

*Fix:*
```surrealql
UPDATE user:alice MERGE { age: 31 }; // Preserves existing fields
```

### Mistake 3: Executing `UPDATE table` Without `WHERE` Clause in Production

**The mistake:** Running `UPDATE user SET active = false;` expecting to update a single record.

**Why it's wrong:** `UPDATE table` updates EVERY record in the table unless targeted with a Record ID or `WHERE` clause.

*Incorrect:*
```surrealql
UPDATE user SET active = false; // 💥 Updates ALL users!
```

*Fix:*
```surrealql
UPDATE user:alice SET active = false; // Targets specific Record ID
```

## 6. Practice Exercises

### Exercise 1: Update Statement Translation

**Problem:** You are migrating a SQL server command:
`UPDATE products SET stock = stock - 5 WHERE id = 'product:101';`
Write the equivalent, optimized query in SurrealQL.

**Expected output:**
> [!check]- Answer
> ```sql
> UPDATE product:101 SET stock -= 5;
> ```
> - Bypasses index scans by targeting the Record ID directly in the `UPDATE` target.
> - Use the subtraction assignment shortcut operator `-=`.

---



### Exercise 2: Updating Fields with Arithmetic Increments

**Problem:** Increment `view_count` on `article:1` by 1 using `+=` operator in `UPDATE` statement.

**Expected output:**
> [!check]- Answer
> ```text
> UPDATE article:1 SET view_count += 1;
> ```
> ```surrealql
> UPDATE article:1 SET view_count += 1;
> ```
>
> **Explanation:** `+=` operator increments numeric field values inline.

---

### Exercise 3: Conditional Update

**Problem:** Update status to `"dormant"` for all users whose `last_login` was over 30 days ago.

**Expected output:**
> [!check]- Answer
> ```text
> UPDATE user SET status = "dormant" WHERE last_login < time::now() - 30d;
> ```
> ```surrealql
> UPDATE user SET status = "dormant" WHERE last_login < time::now() - 30d;
> ```
>
> **Explanation:** `UPDATE table SET ... WHERE condition` updates records matching predicate criteria.

## 7. Related Terms
- [`CREATE`](create.md) — The parent write statement.
- [`UPDATE` Strategies](update_strategies.md) — Update payload options.

---

## 8. Key Takeaways
- The `UPDATE` statement modifies existing records in SurrealDB tables.
- Directly targets table names (`UPDATE user`), IDs (`UPDATE user:john`), or filters.
- **Key behavior:** If a targeted Record ID does not exist, SurrealDB creates it.
- Returns the completed updated records back to the client program.
- Supports arithmetic modification shortcuts (like `+=`, `-=`).
- Running `UPDATE` on a table name without filters affects all rows.
- Always double check query targets before executing updates.
