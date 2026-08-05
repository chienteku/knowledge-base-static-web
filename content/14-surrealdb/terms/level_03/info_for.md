# `INFO FOR` (Introspection)

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL introspection statement used to inspect the schemas, tables, fields, indexes, and user permissions configured inside your database server, equivalent to PostgreSQL's `\d` commands or MongoDB's collection info diagnostics.

---

## 1. Prerequisites

- [Namespace & Database](../level_01/namespace_database.md) — The database structure context.
- [SurrealDB CLI (`surreal sql`)](../level_01/surreal_cli.md) — The execution console context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed directly by the system catalog manager. Queries internal configurations and returns structure schemas as standard JSON objects).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When developing database schemas or debugging query errors, you need a way to verify the active setup:
-   What tables exist in this database?
-   What fields are defined on the `user` table?
-   Are there any indexes active on this collection?

In PostgreSQL, you query this using terminal meta-commands like `\dt` (list tables) or `\d table_name` (describe table). 

In MongoDB, you run shell commands like `show collections` or `db.getCollectionInfos()`.

We designed the **`INFO FOR`** statement in SurrealQL to provide a unified, query-based introspection tool. 

Unlike other systems where introspection uses custom shell scripts or separate tables, `INFO FOR` is a first-class SQL keyword. 

It queries the system catalog and returns a structured JSON object containing your tables, fields, indexes, events, and tokens, making database inspection easy in both the CLI and web applications.

---

### (2) Introspection Scopes
SurrealDB allows you to query configuration details at different levels of the hierarchy:

1.  **`INFO FOR ROOT;`**
    -   Lists namespaces, server logins, and tokens. (Requires root admin privileges).
2.  **`INFO FOR NS;`** (or `INFO FOR NAMESPACE;`)
    -   Lists databases and namespace-level users.
3.  **`INFO FOR DB;`** (or `INFO FOR DATABASE;`)
    -   Lists tables, scopes, tokens, and database logins.
4.  **`INFO FOR TABLE <table>;`**
    -   Lists defined fields, indexes, constraints, and table events.

---

### (3) Reality Metaphor (Mall Directory Boards)
Imagine navigating a large shopping complex:
-   **`INFO FOR` Command:** The **Interactive Directory Board** standing in the lobby.
    -   Pressing **`ROOT`** display: A map showing the layout of the entire mall properties (Namespaces).
    -   Pressing **`DB`** display: A directory list of all storage sections and departments (Tables) inside the active store.
    -   Clicking **`TABLE`** display: A schematic blueprint zooming in on a specific filing cabinet, showing the shelf sizes (Fields) and labels (Indexes).

---

### (4) Code Examples

#### Inspecting Database Schemas in SurrealQL
Make sure you are connected to a database context before running these queries:

```sql
-- 1. Select the database context
USE NS test DB production;

-- 2. Inspect the active Database structures
-- Returns a list of defined tables, logins, and tokens
INFO FOR DB;

-- Output returned includes details like:
// {
//   "tables": {
//     "user": "DEFINE TABLE user SCHEMAFULL",
//     "post": "DEFINE TABLE post SCHEMALESS"
//   }
// }

-- 3. Inspect a specific table schema
-- Returns defined fields, indexes, and events
INFO FOR TABLE user;

-- Output returned includes fields definitions:
// {
//   "fields": {
//     "email": "DEFINE FIELD email ON user TYPE string",
//     "age": "DEFINE FIELD age ON user TYPE int"
//   },
//   "indexes": {
//     "user_email": "DEFINE INDEX user_email ON user COLUMNS email UNIQUE"
//   }
// }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running 'INFO FOR TABLE' queries on a new database session without executing the 'USE' command first, returning empty schemas

**The mistake:** Opening a new console connection and immediately running `INFO FOR TABLE user;`, receiving empty schemas or namespace missing errors.

**Why it's wrong:** Introspection scans the active database session context. 

If you do not specify a Namespace and Database using `USE`, SurrealDB has no database catalog to read, causing the command to fail.

**Fix: Always run `USE NS <name> DB <name>;` before executing introspection queries.**

---



### Mistake 2: Executing `INFO FOR` Without Specifying Target Scope Target (`ROOT`, `NS`, `DB`, `TABLE`)

**The mistake:** Writing `INFO FOR;` (SyntaxError).

**Why it's wrong:** `INFO FOR` requires specifying the target scope level: `INFO FOR ROOT`, `INFO FOR NS`, `INFO FOR DB`, or `INFO FOR TABLE table_name`.

*Incorrect:*
```surrealql
INFO FOR; // ❌ Parse error: missing scope level target
```

*Fix:*
```surrealql
INFO FOR DB; // Inspect database level schema information
```

### Mistake 3: Expecting `INFO FOR TABLE` to Return Record Data Rows

**The mistake:** Running `INFO FOR TABLE user;` expecting to view user data records.

**Why it's wrong:** `INFO FOR TABLE` inspects table METADATA (fields, indexes, events, foreign keys), NOT record data rows. Use `SELECT * FROM user;` to view data.

*Incorrect:*
```surrealql
-- Expecting record rows
INFO FOR TABLE user; // ❌ Returns metadata object, not record rows!
```

*Fix:*
```surrealql
SELECT * FROM user; // Queries record data rows
```

## 6. Practice Exercises

### Exercise 1: Introspection Scoping

**Problem:** You are debugging an index conflict. 
Write the SurrealQL commands to:
1.  Target namespace `"firm_hq"` and database `"production"`.
2.  Inspect all tables defined inside this database.
3.  Inspect the index and field definitions of the `invoice` table.

**Expected output:**
> [!check]- Answer
> ```sql
> -- 1. Set context
> USE NS firm_hq DB production;
> 
> -- 2. Inspect database tables
> INFO FOR DB;
> 
> -- 3. Inspect table fields and indexes
> INFO FOR TABLE invoice;
> ```
> - The target scope is `NS firm_hq DB production`.
> - Use `INFO FOR DB` to see tables, and `INFO FOR TABLE <name>` to describe columns and indexes.

---



### Exercise 2: Inspecting Table Schema Metadata

**Problem:** Write command to inspect fields, indexes, and events configured on `article` table.

**Expected output:**
> [!check]- Answer
> ```text
> INFO FOR TABLE article;
> ```
> ```surrealql
> INFO FOR TABLE article;
> ```
>
> **Explanation:** `INFO FOR TABLE` outputs detailed schema metadata objects.

---

### Exercise 3: Inspecting Active Database Definitions

**Problem:** Command to list all tables, scope accesses, and parameters defined in current database.

**Expected output:**
> [!check]- Answer
> ```text
> INFO FOR DB;
> ```
> ```surrealql
> INFO FOR DB;
> ```
>
> **Explanation:** `INFO FOR DB` returns active database scope definition metadata.

## 7. Related Terms

- [Namespace & Database](../level_01/namespace_database.md) — The database structure context.
- [`DEFINE TABLE`](../level_04/define_table.md) — Creating tables.

---

## 8. Key Takeaways
- `INFO FOR` provides first-class introspection for SurrealDB configurations.
- Equivalent to PostgreSQL's `\d` commands and MongoDB collection stats diagnostics.
- Returns structured JSON data blocks, simplifying programmatic schema checks.
- Introspects at ROOT, NS (Namespace), DB (Database), and TABLE levels.
- `INFO FOR TABLE <table>` lists all fields, assertions, and indexes.
- Requires session context (`USE`) to resolve database structures successfully.
- Highly useful for debugging migrations and checking index setups in the CLI.
