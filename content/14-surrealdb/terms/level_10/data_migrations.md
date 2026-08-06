# Data Migrations in SurrealDB

> **Level 10 — SDKs, Deployment & Production**
> Strategies and patterns for evolving SurrealDB schemas, transforming record data, and applying idempotent migration scripts in production environments without application downtime.

---

## 1. Prerequisites

- [`OVERWRITE` Keyword](../level_04/overwrite_keyword.md) — Idempotent definition syntax.
- [`DEFINE FIELD`](../level_04/define_field.md) — Schema definitions and computed values.

---

## 2. Term Category


**Performance / Operations (database schema & data migration scripts)**: - **Database Architecture & Evolution**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
As application requirements change over time, database schemas must evolve: new fields are added, existing columns are renamed, and old data structures are transformed. In relational databases (PostgreSQL), developers write sequential SQL migration files (`001_add_user_table.sql`, `002_add_phone_field.sql`) managed by tools like Prisma or Knex. In document databases (MongoDB), developers write eager script transformations or rely on lazy application-level migrations.

SurrealDB supports a powerful hybrid approach to schema migration:
1. **Idempotent Declarative DDL (`OVERWRITE`)**: Schema definition scripts use `DEFINE TABLE ... OVERWRITE` and `DEFINE FIELD ... OVERWRITE`, allowing the entire current schema definition to be re-applied safely without failing on existing objects.
2. **Computed Backfill (`VALUE` Clause)**: New fields can be backfilled across existing records automatically using `VALUE` expressions or batch `UPDATE` transformations.
3. **Flexible Hybrid Schemas**: `SCHEMALESS` tables or `FLEXIBLE` fields allow smooth phase-in of new document structures while old records are updated asynchronously.

### (2) Reality Metaphor
Think of renovating an occupied apartment building:
- **Destructive Migration**: Shutting down electricity for all tenants, tearing down walls, and locking everyone out for 3 days.
- **SurrealDB Declarative Migration**: Upgrading wiring floor-by-floor while the building stays operational, updating individual room fixtures dynamically without interrupting tenant service.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Idempotent field migration adding a new verified status field to existing users
DEFINE FIELD is_verified ON TABLE user TYPE bool DEFAULT false OVERWRITE;
```

#### Fuller Example (Multi-Step Migration Pattern)
```surrealql
-- Step 1: Idempotently define new field 'full_name' on user table
DEFINE FIELD full_name ON user TYPE option<string> OVERWRITE;

-- Step 2: Batch transform existing records by concatenating first_name and last_name
UPDATE user SET full_name = string::concat(first_name, ' ', last_name)
WHERE full_name = NONE AND first_name != NONE;

-- Step 3: Enforce strict SCHEMAFULL rules once data backfill completes
DEFINE FIELD full_name ON user TYPE string OVERWRITE;
REMOVE FIELD first_name ON user;
REMOVE FIELD last_name ON user;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Applying Non-Idempotent DEFINE Statements in CI/CD Deployments

**The mistake:** Writing migration scripts containing `DEFINE TABLE user;` without the `OVERWRITE` keyword.

**Why it's wrong:** If a deployment pipeline runs `DEFINE TABLE user;` a second time, SurrealDB throws an error ("Table already exists"), causing the build to fail.

*Incorrect:*
```surrealql
-- Fails if user table already exists!
DEFINE TABLE user SCHEMAFULL;
```

*Fix:*
```surrealql
-- Idempotent: Overwrites definition safely if it exists, or creates it if missing
DEFINE TABLE user SCHEMAFULL OVERWRITE;
```

---



### Mistake 2: Executing Schema Migration Scripts Without Idempotent `IF NOT EXISTS` Guards

**The mistake:** Running non-idempotent `DEFINE` statements in container deployment hooks.

**Why it's wrong:** Non-idempotent migration scripts fail on subsequent deployment runs when tables or fields already exist. Use `IF NOT EXISTS`.

*Incorrect:*
```surrealql
-- Fails on migration re-run
DEFINE TABLE user SCHEMAFULL;
```

*Fix:*
```surrealql
DEFINE TABLE IF NOT EXISTS user SCHEMAFULL;
```

### Mistake 3: Performing Destructive Field Removals Without Prior Data Backups

**The mistake:** Executing `REMOVE FIELD legacy_data ON TABLE user;` before backing up data.

**Why it's wrong:** `REMOVE FIELD` drops field values permanently. Export database backups with `surreal export` before running destructive schema migrations.

*Incorrect:*
```surrealql
REMOVE FIELD legacy_col ON TABLE user; // ❌ Permanent data deletion!
```

*Fix:*
```surrealql
surreal export ... backup.surql # Export backup first
REMOVE FIELD legacy_col ON TABLE user;
```





## 5. Practice Exercises

### Exercise 1: Versioned Migration Script Construction

**Scenario:**
You are building an automated database migration runner that applies versioned schema DDL files (e.g. `V1__init_schema.surql`) idempotently.

**Requirements:**
1. Write a SurrealQL migration script using `DEFINE ... OVERWRITE` statements.
2. Define table `user` and fields `username`, `email`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Migration Script: V1__init_schema.surql
> DEFINE TABLE OVERWRITE user SCHEMAFULL;
> DEFINE FIELD OVERWRITE username ON TABLE user TYPE string;
> DEFINE FIELD OVERWRITE email ON TABLE user TYPE string ASSERT string::is::email($value);
> ```
>
> #### Technical Explanation
>
> 1. `DEFINE ... OVERWRITE` makes migration scripts idempotent and safe to re-run.
> 2. Prevents "definition already exists" migration errors in CI/CD pipelines.
> 3. Enforces schema version control at the database DDL level.

---

### Exercise 2: Migration Tracking Table Implementation

**Scenario:**
Design a schema migration tracking table `schema_migration` to record applied migration version files and execution timestamps.

**Requirements:**
1. Define table `schema_migration` in `SCHEMAFULL` mode.
2. Store `version`, `name`, and `applied_at`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE schema_migration SCHEMAFULL;
> DEFINE FIELD version ON TABLE schema_migration TYPE string;
> DEFINE FIELD name ON TABLE schema_migration TYPE string;
> DEFINE FIELD applied_at ON TABLE schema_migration TYPE datetime DEFAULT time::now();
> 
> CREATE schema_migration:V1 SET version = "1.0", name = "init_schema";
> ```
>
> #### Technical Explanation
>
> 1. Migration tracking tables track which migration scripts have been applied to a cluster.
> 2. Prevents duplicate migration execution during automated deployments.
> 3. Records historical schema deployment timestamps.

---

### Exercise 3: CLI Migration Execution with `surreal import`

**Scenario:**
Run the `surreal import` CLI command to execute migration file `V1__init_schema.surql` against a staging database.

**Requirements:**
1. Formulate the `surreal import` CLI command.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal import >   --endpoint http://localhost:8000 >   --user root >   --pass root >   --ns staging >   --db main >   V1__init_schema.surql
> ```
>
> #### Technical Explanation
>
> 1. `surreal import` executes SurrealQL script files sequentially against the target database.
> 2. Handles multi-statement schema definitions in transaction blocks.
> 3. Integrates database migrations with automated CI/CD deployment jobs.

---





## 6. Related Terms

- [`OVERWRITE` Keyword](../level_04/overwrite_keyword.md) — Idempotent syntax details.
- [`surreal validate` (Query Validation)](surreal_validate.md) — Pre-flight migration validation.
- [`UPDATE` Strategies (`SET` / `CONTENT` / `MERGE` / `PATCH`)](../level_03/update_strategies.md) — Batch data transformations.
- [`surreal export` / `surreal import` (Backups)](export_import.md) — Related concept: `surreal export` / `surreal import` (Backups).

---

## 7. Key Takeaways
- Use `OVERWRITE` on all `DEFINE` statements to create idempotent, repeatable migration scripts.
- Use `UPDATE ... SET` for batch data backfilling during schema evolution.
- Combine `FLEXIBLE` fields or `SCHEMALESS` modes for zero-downtime rolling deployments.
