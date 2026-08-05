# `REMOVE` Statement

> **Level 4 — Schema Definition & Constraints**
> The DDL (Data Definition Language) statement in SurrealDB used to permanently delete schema structures, including tables, fields, indexes, events, and namespaces.

---

## 1. Prerequisites

- [`DEFINE TABLE`](define_table.md) — The schema generation context.
- [`IF NOT EXISTS` / `IF EXISTS`](../level_03/if_not_exists.md) — The execution guards.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the system catalog. Wipes schema config nodes from memory and frees associated disk storage instantly).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
During the lifecycle of a database, schemas shift:
-   An index is no longer needed.
-   A field is deprecated and replaced.
-   An entire table is retired.

In standard SQL (PostgreSQL), you delete structures using the `DROP` keyword: `DROP TABLE users;`, `DROP INDEX index_name;`. 

In MongoDB, you call `db.collection.drop()`.

We designed the **`REMOVE`** statement in SurrealQL to act as a unified structure deletion command. 

Instead of switching between different drop verbs (like SQL's `DROP TABLE` vs `ALTER TABLE ... DROP COLUMN`), SurrealDB uses the single, consistent keyword `REMOVE` followed by the structure type. 

This provides a cleaner syntax for database migrations.

---

### (2) CRUD 'DELETE' vs. DDL 'REMOVE'
It is critical to separate these two operations:
-   **`DELETE` (CRUD):** Clears **data records** from a table. The table schema, defined fields, and indexes remain intact on disk.
-   **`REMOVE` (DDL):** Wipes out the **schema definition** itself. For example, `REMOVE TABLE user` deletes the table schema, defined fields, indexes, and all records in it.

---

### (3) Reality Metaphor (Clearing folders vs Demolishing Cabinets)
Imagine organizing a physical archives warehouse:
-   **`DELETE` (CRUD):** Pulling all paper folders out of a cabinet drawer and throwing them in the paper shredder. 
    -   The drawer organizer still exists, bolted to the floor, ready to accept new folders.
-   **`REMOVE` (DDL):** A **Demolition Crew**. 
    -   They walk in with crowbars, unbolt the filing cabinet from the floor (`REMOVE TABLE`), carry it out of the warehouse, and throw it in the dumpster. 
    -   The structure is gone.

---

### (4) Code Examples

#### Removing Schemas in SurrealQL
Observe the DDL query layouts:

```sql
-- 1. Remove a specific field definition from a table
REMOVE FIELD age ON TABLE user;

-- 2. Remove an index from a table
REMOVE INDEX user_email ON TABLE user;

-- 3. Remove an event trigger from a table
REMOVE EVENT log_email_change ON TABLE user;

-- 4. Remove an entire table schema and all its records (Purges everything!)
REMOVE TABLE user;

-- 5. Using safety guards to prevent crashes if the index is already gone
REMOVE INDEX user_email ON TABLE user IF EXISTS;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running 'DELETE <table>' expecting the table's schema, defined fields, and indexes to be deleted from the database configuration

**The mistake:** Executing `DELETE user;` in a migration script to reset a table, assuming that it behaves like SQL's `DROP TABLE`.

**Why it's wrong:** `DELETE user;` only deletes the **documents** inside the table. 

If the table was defined as `SCHEMAFULL`, all defined fields, indexes, and write rules remain active. 

If you try to import new data with a different schema, the old field rules will still validate and potentially block your writes.

**Fix: Use `REMOVE TABLE <table>` to delete both the data and the schema definition of a table:**

```sql
-- BAD (Leaves schema active)
DELETE user;

-- GOOD (Deletes data and schema definition)
REMOVE TABLE user;
```

---



### Mistake 2: Using SQL `DROP` Keywords in Place of SurrealQL `REMOVE` Statements

**The mistake:** Executing `DROP FIELD email ON TABLE user;` or `DROP INDEX idx ON TABLE user;`.

**Why it's wrong:** SurrealQL uses `REMOVE FIELD`, `REMOVE INDEX`, `REMOVE EVENT`, `REMOVE TABLE`, `REMOVE DATABASE`, `REMOVE NS`, `REMOVE ACCESS`.

*Incorrect:*
```surrealql
DROP FIELD email ON TABLE user; // ❌ Invalid SurrealQL syntax!
```

*Fix:*
```surrealql
REMOVE FIELD email ON TABLE user; // Correct SurrealQL removal syntax
```

### Mistake 3: Omitting `ON TABLE` in `REMOVE FIELD` Statements

**The mistake:** Writing `REMOVE FIELD email;` (SyntaxError).

**Why it's wrong:** `REMOVE FIELD` requires specifying the target table: `REMOVE FIELD email ON TABLE user;`.

*Incorrect:*
```surrealql
REMOVE FIELD email; // ❌ Parse error!
```

*Fix:*
```surrealql
REMOVE FIELD email ON TABLE user;
```

## 6. Practice Exercises

### Exercise 1: Cleanup Script Construction

**Problem:** You are refactoring an analytics database. 
Write the SurrealQL commands to:
1.  Remove an index named `log_timestamp` on the `logs` table.
2.  Remove a field named `session_hash` on the `logs` table.
3.  Add error suppression guards to both statements to ensure the script runs safely.

**Expected output:**
> [!check]- Answer
> ```sql
> REMOVE INDEX log_timestamp ON TABLE logs IF EXISTS;
> REMOVE FIELD session_hash ON TABLE logs IF EXISTS;
> ```
> - The target schema component is specified using `ON TABLE logs`.
> - Append the conditional modifier `IF EXISTS` to both commands.

---



### Exercise 2: Removing Schema Definitions

**Problem:** Write commands to remove field `legacy_age` and index `user_age_idx` from `user` table.

**Expected output:**
> [!check]- Answer
> ```text
> REMOVE FIELD legacy_age ON TABLE user; REMOVE INDEX user_age_idx ON TABLE user;
> ```
> ```surrealql
> REMOVE FIELD legacy_age ON TABLE user;
> REMOVE INDEX user_age_idx ON TABLE user;
> ```
>
> **Explanation:** `REMOVE FIELD` and `REMOVE INDEX` drop schema definitions.

---

### Exercise 3: Removing Database Scope

**Problem:** Command to drop entire database `test_db` from namespace (`REMOVE DATABASE test_db;`).

**Expected output:**
> [!check]- Answer
> ```text
> REMOVE DATABASE test_db;
> ```
> ```surrealql
> REMOVE DATABASE test_db;
> ```
>
> **Explanation:** `REMOVE DATABASE` drops database schemas and all associated records.

## 7. Related Terms

- [`DEFINE TABLE`](define_table.md) — The table creation DDL.
- [`DELETE`](../level_03/delete.md) — Data record deletion.

---

## 8. Key Takeaways
- The `REMOVE` statement deletes schema configurations from SurrealDB.
- Unifies SQL's `DROP` and `ALTER TABLE DROP` verbs under a single keyword.
- Used to delete tables, fields, indexes, events, scopes, databases, and namespaces.
- `REMOVE TABLE` deletes the schema definition and all records in it.
- `DELETE` deletes data records; `REMOVE` deletes structural definitions.
- Append `IF EXISTS` to prevent scripts from crashing on missing resources.
- Table-scoped removals require the `ON TABLE <table>` clause.
**
