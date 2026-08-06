# Migrations

> **Level 8 — Database Integration**
> Version control (like Git) but specifically for your database structure. Migrations are a historical record of exactly how your database tables have changed over time.

---

## 1. Prerequisites
- [SQL vs NoSQL](sql_vs_nosql.md) — Migrations are primarily used for Relational (SQL) databases because they have strict schemas.

---

## 2. Term Category
- **Database Architecture / DevOps**

---

## 3. Environment Context
- **System Architecture**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Rollback

**Problem:** You write a migration to add a `birthdate` column to the database (The "Up" migration). What exact command must you write in the "Down" (rollback) section of the migration file?

**Expected output:**
> [!check]- Answer
> ```text
> You must write the code to DELETE the `birthdate` column. 
> If "Up" adds the column, "Down" must drop the column.
> ```
> - The "Down" migration must perfectly reverse whatever the "Up" migration did.
> 
---



### Exercise 2: Up and Down Migration Functions

**Problem:** What are the roles of `up` vs `down` functions in database migration files?

**Expected output:**
> [!check]- Answer
> ```text
> up applies schema changes; down reverses/rolls back schema changes.
> ```
> ```text
> up applies schema changes; down reverses/rolls back schema changes.
> ```
>
> **Explanation:** `up` migrates forward; `down` provides rollback capability.
> 
---

### Exercise 3: Prisma Migration Commands

**Problem:** Which Prisma command generates and applies migrations in development vs applying in production?

**Expected output:**
> [!check]- Answer
> ```text
> Development: npx prisma migrate dev
> Production: npx prisma migrate deploy
> ```
> ```bash
> # Development:
> npx prisma migrate dev
> # Production:
> npx prisma migrate deploy
> ```
>
> **Explanation:** `migrate dev` creates new migration files; `migrate deploy` applies pending migrations deterministically.
> 
## 7. Related Terms
- [ORMs & ODMs](orms_odms.md) — ORMs like Prisma automatically generate these migration files for you based on your JavaScript code!
- [Database Transactions](db_transactions.md) — Related concept: Database Transactions.
- [Prisma / Sequelize (SQL ORMs)](prisma_sequelize.md) — Related concept: Prisma / Sequelize (SQL ORMs).
- [SQL vs NoSQL](sql_vs_nosql.md) — Related concept: SQL vs NoSQL.

---

## 8. Key Takeaways
- **Migrations** are version control for your database structure.
- They are a series of timestamped scripts that alter the database tables step-by-step.
- They guarantee that every developer's local database matches the production database perfectly.
- Never edit an old migration file; always create a new one to fix mistakes.
