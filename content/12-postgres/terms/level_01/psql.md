# `psql` (Interactive Terminal)

> **Level 1 — What Is a Database?**
> The official, interactive command-line terminal client for PostgreSQL, used to execute SQL queries, run admin scripts, and inspect database schemas.

---

## 1. Prerequisites
- [Client-Server Model (in Databases)](client_server_model.md) — Understanding that `psql` is a client connecting to a server process.

---

## 2. Term Category
- **Database Client / CLI**

---

## 3. Environment Context
- **PostgreSQL Built-in Utility** (Bundled with every standard PostgreSQL installation. Executable from the operating system's command shell).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing applications, you often need to quickly test an SQL query, check a table's structure, list existing databases, or dump database backups.

While you could write a temporary JavaScript file to run queries, this is slow and annoying.

To solve this, PostgreSQL provides **`psql`**, a fast, lightweight command-line interface. 

It connects directly to your running database server. You type SQL queries into the terminal, `psql` sends them to the server, and prints the results in clean text tables directly in your terminal.

---

### (2) SQL Queries vs. Meta-Commands
A key feature of `psql` is its division between two types of commands:

1.  **Standard SQL Queries:** Standard declarative database instructions. These **must** end with a semicolon (`;`).
    -   E.g., `SELECT * FROM users;`
2.  **`psql` Meta-Commands (Backslash Commands):** Specialized commands processed locally by the `psql` client to fetch database metadata. These start with a backslash (`\`) and do **not** use semicolons.
    -   `\l` : List all databases on the server.
    -   `\c dbname` : Connect to a different database.
    -   `\dt` : List all tables in the current database.
    -   `\d tablename` : Describe/inspect a table's columns and types.
    -   `\q` : Quit/exit `psql`.

---

### (3) Reality Metaphor
Imagine the terminal prompt for database systems:
-   **Postgres server** is a secure, locked library vault.
-   **`psql`** is like an intercom terminal mounted on the wall outside the vault. 

You press the button (open `psql`), speak your request into the microphone (type SQL), and a computer voice reads back the catalog details (prints rows in terminal).

---

### (4) Command Examples

#### Connecting via Terminal Command
```bash
# Connect to default database 'postgres' as user 'postgres'
psql -U postgres -d postgres
```

#### Executing a Query inside `psql`
```text
postgres=# SELECT name, email FROM users;

   name    |       email       
-----------+-------------------
 John Doe  | john@example.com
 Jane Smith| jane@example.com
(2 rows)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the semicolon (`;`) at the end of SQL queries

**The mistake:** Typing a query like `SELECT * FROM users` and pressing Enter, only to watch `psql` display a new line indentation prefix without showing any output.

```text
postgres=# SELECT * FROM users
postgres-# 
```

**Why it's wrong:** SQL queries can span multiple lines. The `psql` client will not send your query to the database server until it sees the semicolon delimiter. If you omit the semicolon, `psql` assumes you are still writing columns or filters on subsequent lines.

**Fix: Type a semicolon (`;`) on the new line and press Enter to execute the query.**

```text
postgres-# ;
```

---



### Mistake 2: Prefixing Meta-Commands with Backslashes as SQL Statements with Semicolons

**The mistake:** Executing `\dt;` or `\l;` expecting semicolon termination.

**Why it's wrong:** `psql` backslash meta-commands (like `\dt`, `\c`, `\d`) are CLI terminal commands, NOT SQL statements! Semicolons are not required and can cause syntax errors.

*Incorrect:*
```sql
\dt; -- Un-necessary semicolon on psql meta-command
```

*Fix:*
```sql
\dt -- Clean psql meta-command
```

### Mistake 3: Forgetting Semicolons on Standard SQL Statements in `psql` Interactive Prompt

**The mistake:** Typing `SELECT * FROM users` and pressing Enter expecting output.

**Why it's wrong:** `psql` continues multi-line SQL input until a terminating semicolon `;` is received.

*Incorrect:*
```sql
SELECT * FROM users <Enter> -- Prompt changes to user-# waiting for semicolon!
```

*Fix:*
```sql
SELECT * FROM users; -- Terminate SQL statements with semicolon
```

## 6. Practice Exercises

### Exercise 1: Schema Discovery

**Problem:** You are hired to work on a legacy Postgres database. You connect using `psql`, but you have no idea what tables exist or what columns are in the `customers` table. Write the two `psql` backslash commands to discover this structure.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Type `\dt` and press Enter to list all tables in the database.
> 2. Type `\d customers` and press Enter to describe the columns, types, and constraints of the `customers` table.
> ```
> - Use the backslash commands specifically built to inspect metadata inside `psql`.
> - Do not write standard SQL `SELECT` queries for discovery.

---



### Exercise 2: Essential `psql` Meta-Commands

**Problem:** List `psql` meta-commands for: 1. List databases (`\l`), 2. Connect to database (`\c dbname`), 3. List tables (`\dt`), 4. Quit (`\q`).

**Expected output:**
> [!check]- Answer
> ```text
> \l, \c dbname, \dt, \q
> ```
> ```text
> \l, \c dbname, \dt, \q
> ```
>
> **Explanation:** Backslash meta-commands manage connections and inspect catalog schema objects in `psql`.

---

### Exercise 3: Executing SQL Script File via `psql` CLI

**Problem:** CLI command to execute SQL script `schema.sql` against database `app` using `psql`.

**Expected output:**
> [!check]- Answer
> ```text
> psql -d app -f schema.sql
> ```
> ```bash
> psql -d app -f schema.sql
> ```
>
> **Explanation:** `psql -f script.sql` executes file contents against specified databases.

## 7. Related Terms
- [Client-Server Model (in Databases)](client_server_model.md) — The underlying network architecture.
- [pgAdmin & GUI Tools](pgadmin.md) — The graphical client alternative.

---

## 8. Key Takeaways
- `psql` is the official command-line interface client for PostgreSQL.
- It executes standard SQL queries and local client helper commands.
- All standard SQL queries inside `psql` must end with a semicolon (`;`).
- Backslash commands (meta-commands like `\dt`, `\d`) inspect database structure.
- Type `\q` to safely exit the interactive `psql` shell terminal.
