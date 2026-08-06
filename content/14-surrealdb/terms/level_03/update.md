# `UPDATE`

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL statement used to modify existing records inside a table, supporting specific Record ID targets and automatic record creation if the target key is absent from the database.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.

---

## 2. Term Category


**SurrealQL Command (record mutation statement)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Single Record Mutation by Primary Key

**Scenario:**
A user updates their display name. Mutate user record `user:john` setting `name = "Johnathan Doe"`.

**Requirements:**
1. Create user `user:john` with `name = "John"`.
2. Update `user:john` using `UPDATE user:john SET name = "Johnathan Doe"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:john SET name = "John";
> 
> -- Update single record by primary key
> UPDATE user:john SET name = "Johnathan Doe";
> ```
>
> #### Technical Explanation
>
> 1. `UPDATE table:id` mutates a single targeted record directly in $O(1)$ constant time complexity.
> 2. `SET key = val` updates specified fields while leaving unmentioned fields untouched.
> 3. Returns the updated record document payload (`RETURN AFTER` by default).

---

### Exercise 2: Filtered Bulk Record Mutation

**Scenario:**
A batch job deactivates all user accounts that have been inactive for more than 365 days (`last_active < time::now() - 365d`).

**Requirements:**
1. Write an `UPDATE user` query with a `WHERE` filter clause.
2. Set `status = "deactivated"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET last_active = time::now() - 400d, status = "active";
> CREATE user:u2 SET last_active = time::now() - 10d, status = "active";
> 
> -- Bulk update inactive users
> UPDATE user SET status = "deactivated" WHERE last_active < time::now() - 365d;
> ```
>
> #### Technical Explanation
>
> 1. `UPDATE table SET ... WHERE condition` evaluates filters across table records and mutates matching records.
> 2. Executes atomically within a database transaction block.
> 3. Unmatched records (`user:u2`) remain unmodified.

---

### Exercise 3: Shallow Document Modification with `MERGE`

**Scenario:**
Update user `user:john`'s preferences using `MERGE` to add a new property `theme = "dark"` without erasing existing record properties.

**Requirements:**
1. Update `user:john` using `UPDATE user:john MERGE { theme: "dark" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Non-destructive shallow merge update
> UPDATE user:john MERGE { theme: "dark" };
> ```
>
> #### Technical Explanation
>
> 1. `MERGE` performs a shallow merge, updating specified JSON keys while preserving unmentioned fields.
> 2. Prevents accidental document truncation caused by `CONTENT` replacements.
> 3. Provides safe partial document updates for JSON payloads.

---



## 6. Related Terms

- [`CREATE`](create.md) — The parent write statement.
- [`UPDATE` Strategies (`SET` / `CONTENT` / `MERGE` / `PATCH`)](update_strategies.md) — Update payload options.
- [`DELETE`](delete.md) — Related concept: `DELETE`.
- [`RETURN` Clause (`RETURN NONE / BEFORE / AFTER / DIFF`)](return_clause.md) — Related concept: `RETURN` Clause (`RETURN NONE / BEFORE / AFTER / DIFF`).
- [`UPSERT`](upsert.md) — Related concept: `UPSERT`.
- [`PARALLEL` Keyword](../level_06/parallel_keyword.md) — Related concept: `PARALLEL` Keyword.

---

## 7. Key Takeaways
- The `UPDATE` statement modifies existing records in SurrealDB tables.
- Directly targets table names (`UPDATE user`), IDs (`UPDATE user:john`), or filters.
- **Key behavior:** If a targeted Record ID does not exist, SurrealDB creates it.
- Returns the completed updated records back to the client program.
- Supports arithmetic modification shortcuts (like `+=`, `-=`).
- Running `UPDATE` on a table name without filters affects all rows.
- Always double check query targets before executing updates.
