# `OVERWRITE` Keyword

> **Level 4 — Schema & Modeling**
> A SurrealDB DDL modifier used in `DEFINE` statements (`DEFINE TABLE OVERWRITE`, `DEFINE FIELD OVERWRITE`) to replace existing schema definitions atomically without requiring explicit `REMOVE` steps.

---

## 1. Prerequisites

- [`DEFINE TABLE`](define_table.md) — Defining table schemas.
- [`DEFINE FIELD`](define_field.md) — Defining table field constraints.
- [Idempotent Schema Migration Scripts](idempotent_migrations.md) — Managing schema changes safely.

---

## 2. Term Category

**Schema & Modeling (schema overwriting DDL modifier)**: The `OVERWRITE` clause in SurrealDB `DEFINE` statements forces the engine to replace an existing table, field, or index definition. In SurrealDB 2.x, `OVERWRITE` ensures schema migration scripts run idempotently without throwing "already exists" errors.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional relational migration workflows (PostgreSQL), updating a column or table definition requires dropping constraints (`DROP CONSTRAINT`) or checking `IF EXISTS` before recreating. In CI/CD deployment pipelines, re-running migration scripts without guards triggers fatal "relation already exists" errors.

SurrealDB provides the `OVERWRITE` keyword for `DEFINE` statements:
1. **Atomic Replacement**: Overwrites an existing table, field, index, or event definition in a single DDL statement.
2. **Idempotent Deployments**: Migration scripts can be run multiple times safely during CI/CD deployments.
3. **No Prior `REMOVE` Needed**: Replaces definitions directly without needing `REMOVE FIELD` or `REMOVE TABLE` statements first.

### (2) Reality Metaphor

Imagine a white-board configuration display in a control room:
- Without `OVERWRITE`: To update a rule, you must find an eraser, completely wipe the board (`REMOVE`), and write the new rule (`DEFINE`). If someone else wrote on the board in between, your script fails.
- With `OVERWRITE`: You place a new magnetized sign directly over the old sign (`DEFINE OVERWRITE`). The new configuration takes effect immediately.

### (3) SurrealQL Code Examples

#### Idempotent Field & Table Schema Definitions

```surrealql
-- Initial definition of customer table
DEFINE TABLE OVERWRITE customer SCHEMAFULL;

-- Overwrite field definition (updates TYPE and ASSERT atomically)
DEFINE FIELD OVERWRITE email ON TABLE customer TYPE string
    ASSERT string::is::email($value);

-- Overwrite index definition
DEFINE INDEX OVERWRITE idx_email ON TABLE customer FIELDS email UNIQUE;

-- Re-running the script above multiple times will NEVER throw an error!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing DDL `OVERWRITE` with DML `UPDATE` Content Replacement

**The mistake:** Expecting `DEFINE TABLE OVERWRITE` to delete data records inside the table.

**Why it's wrong:** `OVERWRITE` modifies the **schema definition** (metadata), not data records stored in the table. Existing records remain intact unless they violate new `SCHEMAFULL` or `ASSERT` rules.

*Fix:* Use `DELETE` to clear records; use `OVERWRITE` strictly for DDL schema migrations.

### Mistake 2: Omitting `OVERWRITE` in Automated CI/CD Migration Scripts

**The mistake:** Writing plain `DEFINE FIELD email ON TABLE user` in migration files.

**Why it's wrong:** Running the migration script a second time during deployment fails with error `An item with the name 'email' already exists`.

*Fix:* Use `DEFINE FIELD OVERWRITE` in idempotent migration scripts.

### Mistake 3: Overwriting a Field to an Incompatible Type with Existing Records

**The mistake:** Changing `DEFINE FIELD OVERWRITE age ON TABLE user TYPE int` to `TYPE string` while table `user` contains integer records.

**Why it's wrong:** In `SCHEMAFULL` mode, existing records violating the new field type will fail subsequent read or write operations.

*Fix:* Migrate existing record values before applying incompatible schema type overwrites.

---

## 5. Practice Exercises

### Exercise 1: Idempotent Table Overwrites

**Scenario:**
Update table `product` schema to `SCHEMAFULL` using `DEFINE TABLE OVERWRITE`.

**Requirements:**
1. Write `DEFINE TABLE OVERWRITE product SCHEMAFULL`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE OVERWRITE product SCHEMAFULL;
> ```
>
> #### Technical Explanation
>
> 1. `OVERWRITE` replaces existing table schema definitions idempotently.
> 2. Prevents migration failure errors when re-executing schema scripts.
> 3. Standardizes deployment script execution.

---

### Exercise 2: Idempotent Field Overwrites

**Scenario:**
Update field `price` definition on table `product` using `DEFINE FIELD OVERWRITE`.

**Requirements:**
1. Write `DEFINE FIELD OVERWRITE price ON TABLE product TYPE decimal ASSERT $value > 0.0dec`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE FIELD OVERWRITE price ON TABLE product TYPE decimal 
>     ASSERT $value > 0.0dec;
> ```
>
> #### Technical Explanation
>
> 1. `OVERWRITE` modifies field types and assertion rules in-place.
> 2. Avoids preliminary `REMOVE FIELD` calls.
> 3. Ensures clean field schema updates.

---

### Exercise 3: Idempotent Index Overwrites

**Scenario:**
Re-define an index `user_email` on table `user` using `DEFINE INDEX OVERWRITE`.

**Requirements:**
1. Write `DEFINE INDEX OVERWRITE user_email ON TABLE user COLUMNS email UNIQUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE INDEX OVERWRITE user_email ON TABLE user COLUMNS email UNIQUE;
> ```
>
> #### Technical Explanation
>
> 1. `DEFINE INDEX OVERWRITE` updates secondary index configurations.
> 2. Rebuilds index structures idempotently.
> 3. Facilitates index optimization migrations.

---



## 6. Related Terms

- [`DEFINE TABLE`](define_table.md) — Table definition statement.
- [`DEFINE FIELD`](define_field.md) — Field definition statement.
- [Idempotent Schema Migration Scripts](idempotent_migrations.md) — Migration automation practices.

---

## 7. Key Takeaways

- `OVERWRITE` enables idempotent DDL schema definition replacements in SurrealDB.
- Prevents "already exists" errors during CI/CD deployment script execution.
- Replaces definitions atomically without needing prior `REMOVE` commands.
- Modifies schema metadata without deleting data records in the table.
