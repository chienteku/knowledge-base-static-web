# Database Migrations

> **Level 10 — Administration, Security & Production**
> The software engineering practice of version-controlling database schema changes using sequential, timestamped migration files, enabling reproducible and reversible database structure evolution.

---

## 1. Prerequisites
- [`ALTER TABLE`](../level_06/alter_table.md) — The DDL queries executed during migrations.

---

## 2. Term Category
- **Database Administration / Development Practice**

---

## 3. Environment Context
- **Universal Standard** (Supported via programming frameworks like Knex, Prisma, Flyway, or Liquibase. Relies on a hidden tracking table inside the database schema to record deployment state history).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building a software application with a team of developers:
-   Developer Alice adds a `profile_avatar` column to her local database.
-   Developer Bob creates a new `billing_records` table on his local machine.
-   If they only modify their local databases manually using GUI tools (like pgAdmin):
    -   They will forget what changes they made.
    -   When they deploy the code to the production server, the application will crash because the production database schema is out-of-sync (missing columns and tables).

We designed **Database Migrations** to solve this database synchronization problem. 

Migrations treat your database structure as **version-controlled code**:
1.  Every schema change is written inside a text file (SQL or JavaScript) carrying a chronological prefix (e.g. `202607211050_add_avatar_to_users.sql`).
2.  These files are committed to Git alongside your application code.
3.  A migration framework automatically applies the scripts in order, guaranteeing that local, staging, and production databases share the exact same schema.

---

### (2) Up and Down Migrations
Most migration frameworks divide migration files into two actions:
-   **`UP` Migration:** Applies the structural upgrades (e.g. `CREATE TABLE`, `ADD COLUMN`).
-   **`DOWN` Migration:** Rolls back those exact upgrades to revert the database state (e.g. `DROP TABLE`, `DROP COLUMN`) if a production deployment goes wrong.

---

### (3) The Metadata Tracking Table
To keep track of which migration files have already run, the migration framework creates a tracking table (e.g. `schema_migrations`) in your database. 

When you run migrations:
1.  The framework scans the migration folder.
2.  It queries the `schema_migrations` table to see which filenames exist.
3.  It executes **only the new files** that haven't run yet, and inserts their names into the tracking table.

---

### (4) Reality Metaphor
Imagine Git version control for code:
-   You don't share code updates by emailing zipped folders of your project. You write Git commits that record line additions and subtractions chronologically.
-   **Database Migrations** are Git commits for your database schema. Instead of emailing SQL dumps, you write a chronological chain of changes. 
-   When a new developer joins the team, they run `migrate up`, and the framework replays the commits from Day 1 to build a matching database instantly.

---

### (5) Code Examples

#### A Sample Migration File (`202607211050_create_users_table.sql`)

```sql
-- --- UP MIGRATION ---
CREATE TABLE users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- --- DOWN MIGRATION ---
DROP TABLE users;
```

#### The Metadata Tracking Table inside PostgreSQL
```sql
SELECT * FROM schema_migrations;
-- Output:
--            version           |         run_at         
-- -----------------------------+------------------------
--  202607211050_create_users   | 2026-07-21 11:00:15
--  202607211230_add_user_phone | 2026-07-21 12:35:10
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Editing a migration file that has already been committed and applied to production

**The mistake:** Opening `202607211050_create_users.sql` three weeks after deployment, adding a column to the DDL script, and saving it.

**Why it's wrong:** Because the production server's `schema_migrations` table already contains the log record `202607211050_create_users`, the framework will skip this file during future deployments. 

The production database will not receive the new column, while new developers installing the app locally *will* receive it, splitting your database schemas.

**Fix: Once a migration file has been committed to Git and deployed, it is frozen. If you need to make changes (like adding a column), always create a *new* migration file (`202608120900_add_new_column.sql`) to apply the change.**

---



### Mistake 2: Executing Non-Idempotent Schema Migration Scripts in Automated Deployment Pipelines

**The mistake:** Writing migration `CREATE TABLE users (...);` without `IF NOT EXISTS` or tracking tables.

**Why it's wrong:** Re-running migration pipelines on deployment failures throws fatal error `relation "users" already exists`. Track executed migration files in a `schema_migrations` tracking table.

*Incorrect:*
```sql
CREATE TABLE users ( id INT ); -- ❌ Fails on second deployment run!
```

*Fix:*
```sql
CREATE TABLE IF NOT EXISTS users ( id INT );
```

### Mistake 3: Performing Destructive Column Deletions or Renames in a Single Deployment

**The mistake:** Renaming column `username` to `login_name` in a migration while application code is actively running.

**Why it's wrong:** Existing running app containers expecting `username` immediately fail with column not found errors! Use expand-contract 2-phase migration patterns (add new column, sync data, deploy app, drop old column).

*Incorrect:*
```sql
ALTER TABLE users RENAME COLUMN username TO login_name; -- ❌ Breaks running app code!
```

*Fix:*
```sql
Expand-contract migration pattern across zero-downtime releases
```

## 6. Practice Exercises

### Exercise 1: Migration Script Design

**Problem:** You need to add a required `bio` text column to the `users` table. Write the UP and DOWN SQL statements for the migration file.

**Expected output:**
> [!check]- Answer
> ```sql
> -- UP
> ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT '';
> 
> -- DOWN
> ALTER TABLE users DROP COLUMN bio;
> ```
> - The UP statement alters the table to add the column.
> - The DOWN statement must undo the change by dropping the same column.

---



### Exercise 2: Migration Tracking Table Schema

**Problem:** Create migration tracking table `schema_migrations` storing `version` string and `executed_at` timestamp.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE TABLE schema_migrations ( version VARCHAR(255) PRIMARY KEY, executed_at TIMESTAMPTZ DEFAULT NOW() );
> ```
> ```sql
> CREATE TABLE schema_migrations (
>   version VARCHAR(255) PRIMARY KEY,
>   executed_at TIMESTAMPTZ DEFAULT NOW()
> );
> ```
>
> **Explanation:** Migration tracking tables prevent re-applying completed database migrations.

---

### Exercise 3: Zero-Downtime Column Rename Pattern

**Problem:** State 3 phases of Expand-Contract zero-downtime column renames (1. Add new column; 2. Sync data & update app; 3. Drop old column).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Add new column; 2. Sync data & update app; 3. Drop old column
> ```
> ```text
> 1. Add new column; 2. Sync data & update app; 3. Drop old column
> ```
>
> **Explanation:** Expand-contract migration patterns eliminate application downtime during schema refactoring.

## 7. Related Terms
- [`ALTER TABLE`](../level_06/alter_table.md) — The DDL queries.
- [Managed PostgreSQL Services (Supabase, Neon, AWS RDS)](managed_services.md) — Related concept: Managed PostgreSQL Services (Supabase, Neon, AWS RDS).

---

## 8. Key Takeaways
- Database Migrations version-control database structures using sequential files.
- Ensures local, staging, and production databases share identical schemas.
- `UP` migrations apply upgrades; `DOWN` migrations revert them.
- Uses a `schema_migrations` database table to track applied files.
- Never edit a committed migration file; write new migration files to modify schemas.
- Committing migration files to Git coordinates team database changes.
- Eliminates manual database modifications in production.
