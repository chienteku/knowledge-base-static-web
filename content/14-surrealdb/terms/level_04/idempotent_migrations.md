# Idempotent Schema Migration Scripts

> **Level 4 — Schema Definition & Constraints**
> The design pattern and structural blueprint used to write SurrealDB database migration scripts, ensuring they can execute repeatedly on a server without causing crashes or corrupting schemas, built using conditional guards and transaction blocks.

---

## 1. Prerequisites

- [`DEFINE TABLE`](define_table.md) — The schema generation context.
- [`IF NOT EXISTS` / `IF EXISTS`](../level_03/if_not_exists.md) — The execution guards.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (Software engineering deployment patterns. Implemented inside CD pipeline configuration scripts to automate server setups).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern DevOps and CI/CD pipelines, application code and database schemas are updated constantly. 
-   When a developer adds a feature, they create a script to add new database tables and indexes.
-   When the application is deployed, the server automatically executes this script.

If the migration script is not **Idempotent** (meaning running it multiple times yields different results or throws errors):
-   The script runs fine on the first deployment.
-   On the next deployment, when the script runs again, the database sees that the tables already exist and throws a `Table already exists` error.
-   The migration fails, the deployment container crashes, and the server goes offline.

To solve this, developers must write scripts using idempotent patterns. 

By combining SurrealQL's `IF NOT EXISTS` and `IF EXISTS` conditional guards with explicit **Transaction Blocks** (`BEGIN` / `COMMIT`), you write migration scripts that run safely on every deployment, updating structures without errors.

---

### (2) The Idempotent Blueprint
An idempotent SurrealDB migration script should follow three rules:

1.  **Wrap in a Transaction:** Place all DDL commands inside `BEGIN TRANSACTION;` and `COMMIT TRANSACTION;` blocks. If any single field or index definition fails, the entire migration rolls back, preventing a "partially-migrated" database.
2.  **Guard Creations:** Add `IF NOT EXISTS` to all `DEFINE` commands.
3.  **Guard Deletions:** Add `IF EXISTS` to all `REMOVE` commands.

---

### (3) Reality Metaphor (Robot Shelf Assemblers)
Imagine instructing a robot to construct shelves in a room:
-   **Non-Idempotent Blueprint:** The instruction reads: *"Step 1: Hammer a wood shelf onto the empty wall slot. Step 2: Glue a plastic hook on the shelf."* 
    -   If the robot runs this a second time, it tries to hammer a shelf where one already exists. 
    -   It crashes into the shelf, snaps its mechanical arm, and shuts down. (Deployment crash).
-   **Idempotent Blueprint:** The instruction reads: *"Step 1: **If no shelf exists**, install a wood shelf. Step 2: **If no hook exists**, glue a plastic hook."* 
    -   The robot can run this 100 times. 
    -   On runs 2 to 100, it checks, sees everything is in place, and completes the checklist safely.

---

### (4) Code Examples

#### A Production-Ready Idempotent Migration Script
This is how a schema migration script should be structured in a `.surql` file:

```sql
-- 1. Begin the transaction block
BEGIN TRANSACTION;

-- 2. Define tables safely
DEFINE TABLE user IF NOT EXISTS SCHEMAFULL;
DEFINE TABLE post IF NOT EXISTS SCHEMAFULL;

-- 3. Define fields safely
DEFINE FIELD email ON user IF NOT EXISTS TYPE string;
DEFINE FIELD title ON post IF NOT EXISTS TYPE string;
DEFINE FIELD author ON post IF NOT EXISTS TYPE record<user>;

-- 4. Define indexes safely
DEFINE INDEX user_email ON user IF NOT EXISTS COLUMNS email UNIQUE;

-- 5. Commit the transaction block (Only executed if ALL statements succeeded!)
COMMIT TRANSACTION;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running migration scripts without wrapping them inside transaction blocks, leaving the database in a corrupted 'partially-migrated' state on failures

**The mistake:** Writing a migration script with 10 `DEFINE FIELD` commands, and executing it raw. 

If statement 7 fails due to a typo, the first 6 fields are written, but the last 4 are missing.

**Why it's wrong:** Without a transaction wrapper, each DDL query commits individually. 

If a query halfway down fails, your database is left in a broken, half-configured state. 

Fixing it requires logging into the database console and manually dropping fields, which increases the risk of human error during deployments.

**Fix: Always enclose your migration scripts inside `BEGIN TRANSACTION;` and `COMMIT TRANSACTION;` blocks to guarantee atomic database updates.**

---



### Mistake 2: Writing Imperative Migration Scripts Without Schema Guards

**The mistake:** Running SQL schema migration scripts containing naked `DEFINE` statements in CI/CD deployments.

**Why it's wrong:** Re-running migration scripts containing naked `DEFINE` statements causes deployment failures when tables/fields already exist. Use `IF NOT EXISTS`.

*Incorrect:*
```surrealql
-- Fails on CI re-run if schema exists
DEFINE TABLE user SCHEMAFULL;
```

*Fix:*
```surrealql
DEFINE TABLE IF NOT EXISTS user SCHEMAFULL; // Idempotent deployment migration
```

### Mistake 3: Executing Non-Idempotent Data Mutation Scripts in Deployment Hooks

**The mistake:** Running `CREATE setting:1 SET value = 'dark';` in automated container startup hooks.

**Why it's wrong:** `CREATE` throws a collision error if `setting:1` exists. Use `UPSERT` or `INSERT ... ON DUPLICATE KEY UPDATE` in deployment data hooks.

*Incorrect:*
```surrealql
CREATE setting:1 SET value = "dark"; // ❌ Fails on second container startup!
```

*Fix:*
```surrealql
UPSERT setting:1 SET value = "dark"; // Idempotent data initialisation
```

## 6. Practice Exercises

### Exercise 1: Migration Safety Audit

**Problem:** You are deploying a schema update. 
Explain why the following script is not safe for continuous integration (CI/CD) pipelines:
```sql
BEGIN TRANSACTION;
REMOVE TABLE logs;
DEFINE TABLE logs SCHEMAFULL;
DEFINE FIELD message ON logs TYPE string;
COMMIT TRANSACTION;
```

**Expected output:**
> [!check]- Answer
> ```text
> The script is not safe because:
> 1. The `REMOVE TABLE logs` statement does not have an `IF EXISTS` guard. On the very first run of this migration script (when the database is completely empty), this command will fail because the table does not exist, causing the entire transaction to rollback and fail.
> 2. The `DEFINE TABLE` and `DEFINE FIELD` commands do not have `IF NOT EXISTS` guards.
> To make it safe, it must be rewritten as:
> BEGIN TRANSACTION;
> REMOVE TABLE logs IF EXISTS;
> DEFINE TABLE logs IF NOT EXISTS SCHEMAFULL;
> DEFINE FIELD message ON logs IF NOT EXISTS TYPE string;
> COMMIT TRANSACTION;
> ```
> - Assess what happens on the first run when the `logs` table is completely absent.
> - Apply error-suppression keywords to every DDL statement in the transaction.

---



### Exercise 2: Idempotent Index Creation

**Problem:** Define unique index on `user.username` idempotently.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE INDEX IF NOT EXISTS user_username_idx ON TABLE user FIELDS username UNIQUE;
> ```
> ```surrealql
> DEFINE INDEX IF NOT EXISTS user_username_idx ON TABLE user FIELDS username UNIQUE;
> ```
>
> **Explanation:** `IF NOT EXISTS` prevents index re-creation errors during repeated deployment runs.

---

### Exercise 3: Idempotent Data Seeding

**Problem:** Write idempotent SurrealQL query to seed initial admin user `user:admin`.

**Expected output:**
> [!check]- Answer
> ```text
> UPSERT user:admin SET name = "Admin", role = "admin";
> ```
> ```surrealql
> UPSERT user:admin SET name = "Admin", role = "admin";
> ```
>
> **Explanation:** `UPSERT` seeds record data safely without failing if records already exist.

## 7. Related Terms

- [`IF NOT EXISTS` / `IF EXISTS`](../level_03/if_not_exists.md) — The execution guards.
- [`SCHEMAFULL` Validation Assertion Patterns](schemafull_validation.md) — Designing schemas.
- [`OVERWRITE` Keyword](overwrite_keyword.md) — Related concept: `OVERWRITE` Keyword.

---

## 8. Key Takeaways
- Idempotency ensures migration scripts can run repeatedly without errors.
- Wrap all migration commands in `BEGIN TRANSACTION` and `COMMIT TRANSACTION` blocks.
- Transactions guarantee that migrations succeed completely or fail completely.
- Append `IF NOT EXISTS` to all `DEFINE` commands to guard against collisions.
- Append `IF EXISTS` to all `REMOVE` commands to prevent missing resource errors.
- Prevents database deployment crashes and environment sync failures in CI/CD.
- Always review setup files for missing guards before pushing to production.
