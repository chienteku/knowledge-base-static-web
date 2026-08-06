# `REMOVE` Statement

> **Level 4 — Schema Definition & Constraints**
> The DDL (Data Definition Language) statement in SurrealDB used to permanently delete schema structures, including tables, fields, indexes, events, and namespaces.

---

## 1. Prerequisites

- [`DEFINE TABLE`](define_table.md) — The schema generation context.
- [`IF NOT EXISTS` / `IF EXISTS`](../level_03/if_not_exists.md) — The execution guards.

---

## 2. Term Category


**SurrealQL Command (schema entity removal statement)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Dropping Table Schemas with `REMOVE TABLE`

**Scenario:**
Drop obsolete table `temp_logs` and all stored records.

**Requirements:**
1. Write `REMOVE TABLE temp_logs`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> REMOVE TABLE temp_logs;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE TABLE` drops table schema metadata and stored records completely.
> 2. Frees disk space allocation.
> 3. Equivalent to SQL `DROP TABLE`.

---

### Exercise 2: Dropping Field Definitions with `REMOVE FIELD`

**Scenario:**
Remove an obsolete field `legacy_sk` from table `user`.

**Requirements:**
1. Write `REMOVE FIELD legacy_sk ON TABLE user`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> REMOVE FIELD legacy_sk ON TABLE user;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE FIELD` drops field schema rules from table definitions.
> 2. Existing stored record data remains until mutated.
> 3. Updates table schema metadata registers.

---

### Exercise 3: Dropping Secondary Indexes with `REMOVE INDEX`

**Scenario:**
Remove secondary index `old_idx` from table `product`.

**Requirements:**
1. Write `REMOVE INDEX old_idx ON TABLE product`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> REMOVE INDEX old_idx ON TABLE product;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE INDEX` drops secondary index structures from disk.
> 2. Reduces write amplification overhead.
> 3. Preserves stored table record data.

---



## 6. Related Terms

- [`DEFINE TABLE`](define_table.md) — The table creation DDL.
- [`DELETE`](../level_03/delete.md) — Data record deletion.

---

## 7. Key Takeaways
- The `REMOVE` statement deletes schema configurations from SurrealDB.
- Unifies SQL's `DROP` and `ALTER TABLE DROP` verbs under a single keyword.
- Used to delete tables, fields, indexes, events, scopes, databases, and namespaces.
- `REMOVE TABLE` deletes the schema definition and all records in it.
- `DELETE` deletes data records; `REMOVE` deletes structural definitions.
- Append `IF EXISTS` to prevent scripts from crashing on missing resources.
- Table-scoped removals require the `ON TABLE <table>` clause.
**
