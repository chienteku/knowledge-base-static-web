# Data Migrations in SurrealDB

> **Level 10 — SDKs, Deployment & Production**
> Strategies and patterns for evolving SurrealDB schemas, transforming record data, and applying idempotent migration scripts in production environments without application downtime.

---

## 1. Prerequisites
- [`OVERWRITE` Keyword (Idempotent Definitions)](../level_04/overwrite_keyword.md) — Idempotent definition syntax.
- [`DEFINE FIELD`](../level_04/define_field.md) — Schema definitions and computed values.

---

## 2. Term Category
- **Database Architecture & Evolution**

---

## 3. Environment Context
- **Production Schema Evolution** (Executed during CI/CD deployments or automated database migration tasks).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Executing Schema Migration Scripts Without Idempotent `IF NOT EXISTS` Guards

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

### Mistake 5: Performing Destructive Field Removals Without Prior Data Backups

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

## 6. Practice Exercises

### Exercise 1: Identify Idempotent Keyword
Which keyword must be appended to `DEFINE FIELD` and `DEFINE TABLE` statements to ensure migration scripts can be re-run safely in CI/CD?

> [!check]- Answer
> - The keyword is `OVERWRITE`.

---



### Exercise 2: Idempotent Data Migration Pattern

**Problem:** Write idempotent SurrealQL script adding `status` field defaulting to `"active"`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE FIELD IF NOT EXISTS status ON TABLE user TYPE string DEFAULT "active";
> ```
> ```surrealql
> DEFINE FIELD IF NOT EXISTS status ON TABLE user TYPE string DEFAULT "active";
> ```
>
> **Explanation:** `DEFINE FIELD IF NOT EXISTS` ensures migration scripts execute safely across deployments.

---

### Exercise 3: SurrealDB Export Backup Command

**Problem:** CLI command to export database schema and records to `backup.surql`.

**Expected output:**
> [!check]- Answer
> ```text
> surreal export --endpoint http://localhost:8000 -u root -p root --ns main --db app backup.surql
> ```
> ```text
> surreal export --endpoint http://localhost:8000 -u root -p root --ns main --db app backup.surql
> ```
>
> **Explanation:** `surreal export` creates text backups of database schemas and data records.

## 7. Related Terms
- [`OVERWRITE` Keyword (Idempotent Definitions)](../level_04/overwrite_keyword.md) — Idempotent syntax details.
- [`surreal validate` (Query Validation)](surreal_validate.md) — Pre-flight migration validation.
- [`UPDATE` Strategies (`SET` / `CONTENT` / `MERGE` / `PATCH`)](../level_03/update_strategies.md) — Batch data transformations.

---

## 8. Key Takeaways
- Use `OVERWRITE` on all `DEFINE` statements to create idempotent, repeatable migration scripts.
- Use `UPDATE ... SET` for batch data backfilling during schema evolution.
- Combine `FLEXIBLE` fields or `SCHEMALESS` modes for zero-downtime rolling deployments.
