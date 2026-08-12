# Migrations

> **Level 8 — Database Integration**
> Version control (like Git) but specifically for your database structure. Migrations are a historical record of exactly how your database tables have changed over time.

---

## 1. Prerequisites
- [SQL vs NoSQL](sql_vs_nosql.md) — Migrations are primarily used for Relational (SQL) databases because they have strict schemas.

---

## 2. Term Category

**Database Architecture / DevOps (System Architecture)**: Migrations is a fundamental concept in this technology stack. **Level 8 — Database Integration**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When you build a Node.js app, you use Git to track the history of your code. If you make a mistake, you can revert to yesterday's code.
But what about the Database? 
In January, you created a `users` table. In February, you added a `phone_number` column. In March, you renamed it to `mobile_number`.
If a new developer joins the team in April, how do they recreate the exact database structure on their laptop? If they just manually create tables in a UI tool, they might misspell a column, and the code will crash.

### (2) What is a Migration?
A Migration is a small script (usually SQL or JS) that describes a single change to the database.
Instead of clicking buttons in a database UI, you write a migration file:
- `001_create_users_table.sql`
- `002_add_phone_number.sql`
- `003_rename_to_mobile.sql`

When the new developer joins, they run a terminal command (like `npx prisma migrate dev`). The migration tool looks at their empty database, runs script 001, then 002, then 003. Their database is now perfectly identical to the production database!

### (3) Up and Down
A proper migration always has two parts:
- **Up:** The code to apply the change (e.g., `ALTER TABLE users ADD column phone`).
- **Down:** The code to undo the change if it breaks production (e.g., `ALTER TABLE users DROP column phone`).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Editing old migration files

**The mistake:** In February, a developer realizes the `phone_number` column they added in January was supposed to be an integer, not a string. They open `002_add_phone_number.sql`, change the data type, and save it. 

**Why it's wrong:** Migrations are an immutable history! The production server already ran script `002` in January. If you edit the file now, the production server will ignore it because it thinks `002` is already done. 
**Golden Rule:** NEVER edit an old migration file. If you need to fix a mistake, you must create a brand new migration file (e.g., `004_fix_phone_type.sql`).

---



### Mistake 2: Editing Previously Applied Database Migration Files in Production

**The mistake:** Modifying an existing SQL migration file `20230101_init.sql` after it has already been executed on production databases.

**Why it's wrong:** Migration tools track applied migrations by filename/checksum in a `schema_migrations` table. Altering old migration files causes checksum validation errors and schema drift.

*Incorrect:*
```javascript
// Editing 20230101_init.js to add a new column after it ran in production
```

*Fix:*
```javascript
Create a NEW migration file: npx prisma migrate dev --name add_new_column
```

### Mistake 3: Running Database Migrations Dynamically inside Multi-Process Cluster Web Workers

**The mistake:** Calling `prisma migrate deploy` or `knex.migrate.latest()` on web app startup inside every clustered worker process.

**Why it's wrong:** When 10 web worker processes start simultaneously, they run migrations concurrently, causing migration table lock collisions and database crashes. Run migrations as a single pre-deployment CI/CD step.

*Incorrect:*
```javascript
// Running migrations in server app.listen() startup code across 8 cluster workers
```

*Fix:*
```javascript
# Run migrations once in CI/CD pipeline before launching app processes:
node -e 'runMigrations()'
```

## 5. Practice Exercises

### Exercise 1: Database Migration Runner with Up/Down Rollback

**Scenario:** A schema migration tool executes pending SQL migration scripts sequentially and logs applied versions to a `schema_migrations` tracking table.

**Requirements:**
1. Write runDatabaseMigrations(migrationFiles, appliedVersions, mockDb).
2. Execute `up` function for pending files.
3. Insert applied version record into tracking table.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function runDatabaseMigrations(migrationFiles = [], appliedVersionsSet = new Set(), mockDb) {
>   const executed = [];
>
>   for (const migration of migrationFiles) {
>     if (appliedVersionsSet.has(migration.version)) {
>       continue;
>     }
>
>     try {
>       await mockDb.query("BEGIN");
>       await migration.up(mockDb);
>       await mockDb.query("INSERT INTO schema_migrations(version) VALUES($1)", [migration.version]);
>       await mockDb.query("COMMIT");
>
>       executed.push(migration.version);
>     } catch (err) {
>       await mockDb.query("ROLLBACK");
>       throw new Error(`Migration ${migration.version} failed: ${err.message}`);
>     }
>   }
>
>   return {
>     executedCount: executed.length,
>     executed
>   };
> }
>
> // Verification tests
> const dbQueries = [];
> const mockDb = { query: async (sql) => { dbQueries.push(sql); } };
>
> const migrations = [
>   { version: "20260101_init", up: async (db) => db.query("CREATE TABLE users(id INT)") },
>   { version: "20260102_add_email", up: async (db) => db.query("ALTER TABLE users ADD email TEXT") }
> ];
>
> const applied = new Set(["20260101_init"]);
>
> runDatabaseMigrations(migrations, applied, mockDb).then(res => {
>   console.assert(res.executedCount === 1, "Test 1 Failed: Executed only pending 20260102_add_email migration");
>   console.assert(res.executed[0] === "20260102_add_email", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Database Migrations Concept**: Version-controlled SQL/JS scripts for reproducibly creating and modifying database schema structures across environments.
> 2. **Tracking Table (`schema_migrations`)**: Stores timestamps/version strings of executed migration files to prevent re-running completed migrations.
> 3. **Atomic Migration Runs**: Wrapping each migration in a transaction guarantees schema modifications roll back cleanly on failure.
> 
---

### Exercise 2: Migration Lock File & Version Table Auditor

**Scenario:** Audits local migration files against database tracking tables to flag missing or out-of-order migrations.

**Requirements:**
1. Write auditMigrationState(localMigrations, dbVersions).
2. Identify pending migrations.
3. Flag out-of-order migrations.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditMigrationState(localMigrations = [], dbVersions = []) {
>   const dbSet = new Set(dbVersions);
>   const pending = [];
>   const missingLocal = [];
>
>   for (const m of localMigrations) {
>     if (!dbSet.has(m.version)) {
>       pending.push(m.version);
>     }
>   }
>
>   const localSet = new Set(localMigrations.map(m => m.version));
>   for (const v of dbVersions) {
>     if (!localSet.has(v)) {
>       missingLocal.push(v);
>     }
>   }
>
>   return {
>     isSynced: pending.length === 0 && missingLocal.length === 0,
>     pendingCount: pending.length,
>     pending,
>     missingLocal
>   };
> }
>
> // Verification tests
> const local = [{ version: "001" }, { version: "002" }, { version: "003" }];
> const db = ["001", "002"];
>
> const audit = auditMigrationState(local, db);
> console.assert(audit.isSynced === false, "Test 1 Failed");
> console.assert(audit.pendingCount === 1 && audit.pending[0] === "003", "Test 2 Failed: 003 is pending");
> ```
>
> #### Technical Explanation
>
> 1. **CI/CD Schema Audits**: Running migration audits in CI build pipelines prevents deploying application code with unapplied database schemas.
> 2. **Migration Ordering**: Migrations MUST execute in strict chronological sequence based on filename timestamp prefixes (`20260812_01_create_table.js`).
> 3. **Idempotency Rule**: Migration scripts should be written idempotently (`CREATE TABLE IF NOT EXISTS`) when possible.
> 
---

### Exercise 3: Zero-Downtime Multi-Step Schema Migration

**Scenario:** Simulates the Expand/Contract (Parallel Run) migration pattern for renaming a column without downtime.

**Requirements:**
1. Write executeExpandContractStep(phase, mockDb).
2. Phase 1: Add new column (Expand).
3. Phase 2: Backfill data.
4. Phase 3: Drop old column (Contract).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeExpandContractStep(phase, mockDb) {
>   switch (phase.toLowerCase()) {
>     case "expand":
>       await mockDb.query("ALTER TABLE users ADD COLUMN full_name TEXT");
>       return { phase: "EXPAND_COMPLETE", status: "New column added, dual-writing enabled" };
>     case "backfill":
>       await mockDb.query("UPDATE users SET full_name = name WHERE full_name IS NULL");
>       return { phase: "BACKFILL_COMPLETE", status: "Historical data migrated" };
>     case "contract":
>       await mockDb.query("ALTER TABLE users DROP COLUMN name");
>       return { phase: "CONTRACT_COMPLETE", status: "Old column removed" };
>     default:
>       throw new Error(`Unknown phase: ${phase}`);
>   }
> }
>
> // Verification tests
> const queries = [];
> const mockDb = { query: async (sql) => { queries.push(sql); } };
>
> executeExpandContractStep("expand", mockDb).then(res => {
>   console.assert(res.phase === "EXPAND_COMPLETE", "Test 1 Failed");
>   console.assert(queries[0].includes("ADD COLUMN full_name"), "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Zero-Downtime Database Deployment**: Renaming/removing database columns breaking active application connections is avoided by using multi-step migrations.
> 2. **Expand Phase**: Add new database column and update backend code to dual-write to both old and new columns.
> 3. **Contract Phase**: After backfilling data and updating reads, remove old column in a final separate deployment.
## 6. Related Terms
- [ORMs & ODMs](orms_odms.md) — ORMs like Prisma automatically generate these migration files for you based on your JavaScript code!
- [Database Transactions](db_transactions.md) — Related concept: Database Transactions.
- [Prisma / Sequelize (SQL ORMs)](prisma_sequelize.md) — Related concept: Prisma / Sequelize (SQL ORMs).
- [SQL vs NoSQL](sql_vs_nosql.md) — Related concept: SQL vs NoSQL.

---

## 7. Key Takeaways
- **Migrations** are version control for your database structure.
- They are a series of timestamped scripts that alter the database tables step-by-step.
- They guarantee that every developer's local database matches the production database perfectly.
- Never edit an old migration file; always create a new one to fix mistakes.
