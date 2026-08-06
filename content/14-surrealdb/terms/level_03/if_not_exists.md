# `IF NOT EXISTS` / `IF EXISTS`

> **Level 3 — CRUD Operations in SurrealQL**
> The conditional schema-definition modifiers in SurrealDB used inside DDL commands (like `DEFINE TABLE` and `DEFINE INDEX`) to suppress error messages when resources are already present or missing, enabling idempotent migration scripts.

---

## 1. Prerequisites

- [`CREATE`](create.md) — The parent write statement.
- [Table](../level_01/table.md) — The schema container.

---

## 2. Term Category


**SurrealQL Command (conditional creation modifier)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When deploying full-stack web applications, you write schema configuration scripts (migrations) to set up tables, fields, and indexes:
-   If you run a startup script that executes `DEFINE TABLE user;` every time your server boots, it will run fine on day one.
-   On day two, the server restarts. The database already has the `user` table. 
-   The command fails with the error: `Table 'user' already exists`. 
-   This error crashes your backend deployment container, taking your application offline.

In PostgreSQL, you solve this by appending `CREATE TABLE IF NOT EXISTS`.

We designed the **`IF NOT EXISTS`** and **`IF EXISTS`** modifiers in SurrealQL to provide this same safety for schema definitions. 

By adding these guards to your `DEFINE` and `REMOVE` commands, you make your setup scripts **Idempotent** (meaning a script can run multiple times without changing the result or throwing errors). 

This ensures server startups and deployment updates complete smoothly.

---

### (2) Modifiers and Scope
-   **`IF NOT EXISTS`:** Used with creation commands (like `DEFINE TABLE`, `DEFINE FIELD`, `DEFINE INDEX`). If the resource is already defined, SurrealDB does nothing and continues without errors.
-   **`IF EXISTS`:** Used with deletion commands (like `REMOVE TABLE`, `REMOVE INDEX`). If the resource is missing, SurrealDB bypasses the deletion without throwing errors.

---

### (3) Reality Metaphor (Labelling Mailboxes)
Imagine instructing a mail courier to organize mailbox slots:
-   **No Guard Check:** You tell the courier: *"Screw a plastic label saying 'Box 14' to the wall."* 
    -   The courier walks over, sees a label saying 'Box 14' is already screwed in, screams: **`"ERROR: KEY COLLISION!"`**, drops their tools, and runs away.
-   **`IF NOT EXISTS` Check:** You say: *"Install a label saying 'Box 14' if it doesn't exist."* 
    -   The courier walks over. 
    -   Since the label already exists, they nod, say *"Already done"*, and walk back without throwing a tantrum. (Silent bypass).

---

### (4) Code Examples

#### Building Idempotent Migrations in SurrealQL
Observe how schema setups are protected using conditional guards:

```sql
-- 1. Create a table safely (succeeds even if 'user' is already created)
DEFINE TABLE user IF NOT EXISTS SCHEMAFULL;

-- 2. Define fields safely
DEFINE FIELD email ON user IF NOT EXISTS TYPE string;
DEFINE FIELD age ON user IF NOT EXISTS TYPE int;

-- 3. Define indexes safely (ideal for search optimization)
DEFINE INDEX user_email ON user IF NOT EXISTS COLUMNS email UNIQUE;

-- 4. Delete table safely (does not crash if table was already deleted)
REMOVE TABLE user IF EXISTS;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to append 'IF NOT EXISTS' to standard CRUD queries like 'CREATE', expecting it to bypass record conflicts

**The mistake:** Writing a SurrealQL query like `CREATE user:john SET name = "John" IF NOT EXISTS;` hoping to skip inserts if the user already exists.

**Why it's wrong:** In SurrealQL, the `IF NOT EXISTS` modifier is restricted to **DDL Schema Definitions** (commands starting with `DEFINE` or `REMOVE`). 

Appending it to standard `CREATE` or `INSERT` query commands triggers a compiler syntax error.

**Fix: To handle duplicate record conflicts in CRUD queries, use `UPSERT` or `INSERT ... ON DUPLICATE KEY UPDATE` instead of DDL modifiers:**

```sql
-- BAD (Syntax error)
CREATE user:john SET name = "John" IF NOT EXISTS;

-- GOOD (Upserts record without errors)
UPSERT user:john SET name = "John";
```

---



### Mistake 2: Executing `DEFINE` Statements Without `IF NOT EXISTS` in Migration Scripts

**The mistake:** Running `DEFINE TABLE user SCHEMAFULL;` repeatedly in deployment pipelines.

**Why it's wrong:** Executing `DEFINE` statements for existing schemas without `IF NOT EXISTS` throws a duplicate definition error, breaking idempotent migrations.

*Incorrect:*
```surrealql
DEFINE TABLE user SCHEMAFULL; // ❌ Fails on subsequent migration runs if table exists!
```

*Fix:*
```surrealql
DEFINE TABLE IF NOT EXISTS user SCHEMAFULL; // Idempotent schema migration
```

### Mistake 3: Confusing `IF NOT EXISTS` Schema Guards with `UPSERT` Data Insertions

**The mistake:** Attempting `INSERT IF NOT EXISTS` expecting to upsert record data.

**Why it's wrong:** `IF NOT EXISTS` is a guard clause for DDL schema statements (`DEFINE TABLE`, `DEFINE FIELD`, `DEFINE INDEX`). Use `UPSERT` for DML data insertions.

*Incorrect:*
```surrealql
-- Invalid statement syntax attempt
INSERT IF NOT EXISTS INTO user ...;
```

*Fix:*
```surrealql
UPSERT user:1 SET name = "Alice"; // Data upsert statement
```

## 5. Practice Exercises

### Exercise 1: Conditional Record Creation without Conflicts

**Scenario:**
A seed script creates initial system configuration records (like `config:theme`) only if they do not already exist.

**Requirements:**
1. Write the `CREATE IF NOT EXISTS` statement for `config:theme`.
2. Execute the script twice to verify that no error is thrown on the second execution.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Create config record if not already present
> CREATE IF NOT EXISTS config:theme SET mode = "dark";
> 
> -- Second execution safely skips creation without throwing error
> CREATE IF NOT EXISTS config:theme SET mode = "light";
> ```
>
> #### Technical Explanation
>
> 1. `CREATE IF NOT EXISTS table:id` checks primary key existence before inserting.
> 2. If `config:theme` exists, SurrealDB skips record creation silently without raising a primary key conflict error.
> 3. Essential for idempotent environment seeding scripts in deployment pipelines.

---

### Exercise 2: Conditional Field Definition in Schema Migrations

**Scenario:**
A migration script adds a new field `discount_code` to table `coupon` only if the field is not already defined.

**Requirements:**
1. Write the `DEFINE FIELD IF NOT EXISTS` statement.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE IF NOT EXISTS coupon SCHEMAFULL;
> 
> -- Define field conditionally
> DEFINE FIELD IF NOT EXISTS discount_code ON TABLE coupon TYPE string;
> ```
>
> #### Technical Explanation
>
> 1. `IF NOT EXISTS` on DDL statements (`DEFINE TABLE`, `DEFINE FIELD`) prevents "item already exists" errors during migration script execution.
> 2. Ensures schema migration scripts can be re-run safely in CI/CD pipelines.
> 3. Complements `DEFINE ... OVERWRITE` for idempotent schema management.

---

### Exercise 3: Conditional Table Removal with `IF EXISTS`

**Scenario:**
A cleanup script drops temporary table `temp_import` only if the table currently exists in the active database.

**Requirements:**
1. Write the `REMOVE TABLE IF EXISTS` statement.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Remove table safely if present
> REMOVE TABLE IF EXISTS temp_import;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE TABLE IF EXISTS` drops table schema metadata and records if present.
> 2. If `temp_import` does not exist, SurrealDB skips removal without throwing a "table not found" error.
> 3. Simplifies teardown scripts across variable deployment environments.

---



## 6. Related Terms

- [`CREATE`](create.md) — The parent write statement.
- [Table](../level_01/table.md) — The schema container.
- [`DEFINE TABLE`](../level_04/define_table.md) — Table creation in detail.
- [Idempotent Schema Migration Scripts](../level_04/idempotent_migrations.md) — Related concept: Idempotent Schema Migration Scripts.

---

## 7. Key Takeaways
- `IF NOT EXISTS` / `IF EXISTS` are modifiers for schema definition queries.
- Prevents database deployment crashes by suppressing object conflict errors.
- Used with DDL commands starting with `DEFINE` and `REMOVE`.
- Makes database initialization and migration scripts idempotent.
- `IF NOT EXISTS` guards creations; `IF EXISTS` guards deletions.
- Cannot be used with standard CRUD queries (use `UPSERT` or `ON DUPLICATE` instead).
- Always include these guards in application startup database setup scripts.
