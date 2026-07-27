# `IF NOT EXISTS` / `IF EXISTS`

> **Level 3 — CRUD Operations in SurrealQL**
> The conditional schema-definition modifiers in SurrealDB used inside DDL commands (like `DEFINE TABLE` and `DEFINE INDEX`) to suppress error messages when resources are already present or missing, enabling idempotent migration scripts.

---

## 1. Prerequisites
- [`CREATE`](create.md) — The parent write statement.
- [Table](table.md) — The schema container.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Evaluated by the schema manager engine. Prevents query aborts by checking system catalog tables before executing schema definitions).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Migration Script Auditing

**Problem:** You are reviewing a database initialization file. 
State whether this script will **Succeed** or **Fail** on its second consecutive run, and explain why:
```sql
DEFINE TABLE posts SCHEMALESS;
DEFINE INDEX post_title ON posts IF NOT EXISTS COLUMNS title;
```

**Expected output:**
```text
The script will fail on its second run.
Although the index creation is protected by `IF NOT EXISTS`, the first line (`DEFINE TABLE posts`) has no conditional guard. 
On the second run, the database will attempt to define the `posts` table again, see that it already exists, throw an error, and halt execution. 
To fix it, change the first line to `DEFINE TABLE posts IF NOT EXISTS SCHEMALESS;`.
```

> [!check]- Answer
> - Check every command starting with the `DEFINE` keyword.
> - Consider if any command lacks error suppression guards.

---



### Exercise 2: Idempotent Schema Migration Script

**Problem:** Write idempotent SurrealQL statements to define `article` table and `title` field.

**Expected output:**
```text
DEFINE TABLE IF NOT EXISTS article; DEFINE FIELD IF NOT EXISTS title ON TABLE article TYPE string;
```

> [!check]- Answer
> ```surrealql
> DEFINE TABLE IF NOT EXISTS article;
> DEFINE FIELD IF NOT EXISTS title ON TABLE article TYPE string;
> ```
>
> **Explanation:** `IF NOT EXISTS` guarantees idempotent schema migrations across deployments.

### Exercise 3: Idempotent Index Definition

**Problem:** Define unique index on `user.email` using `IF NOT EXISTS`.

**Expected output:**
```text
DEFINE INDEX IF NOT EXISTS user_email_idx ON TABLE user FIELDS email UNIQUE;
```

> [!check]- Answer
> ```surrealql
> DEFINE INDEX IF NOT EXISTS user_email_idx ON TABLE user FIELDS email UNIQUE;
> ```
>
> **Explanation:** `DEFINE INDEX IF NOT EXISTS` prevents index re-creation errors.

## 7. Related Terms
- [`CREATE`](create.md) — The parent write statement.
- [Table](table.md) — The schema container.
- [Define Table](../level_04/define_table.md) — Table creation in detail.

---

## 8. Key Takeaways
- `IF NOT EXISTS` / `IF EXISTS` are modifiers for schema definition queries.
- Prevents database deployment crashes by suppressing object conflict errors.
- Used with DDL commands starting with `DEFINE` and `REMOVE`.
- Makes database initialization and migration scripts idempotent.
- `IF NOT EXISTS` guards creations; `IF EXISTS` guards deletions.
- Cannot be used with standard CRUD queries (use `UPSERT` or `ON DUPLICATE` instead).
- Always include these guards in application startup database setup scripts.
