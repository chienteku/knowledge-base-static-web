# `psql` (Interactive Terminal)

> **Level 1 — What Is a Database?**
> The official, interactive command-line terminal client for PostgreSQL, used to execute SQL queries, run admin scripts, and inspect database schemas.

---

## 1. Prerequisites
- [Client-Server Model (in Databases)](client_server_model.md) — Understanding that `psql` is a client connecting to a server process.
- [PostgreSQL (Postgres)](postgresql.md) — PostgreSQL interactive terminal CLI client.

---

## 2. Term Category

**Administration / Operations** (Interactive Terminal CLI): psql is the native command-line terminal interface for interactively querying and administering PostgreSQL databases.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Built-in Utility** (Bundled with every standard PostgreSQL installation. Executable from the operating system's command shell).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Inspecting Table Structures with Meta-Commands

**Scenario:**
Inspect column definitions, data types, defaults, and indexes of table `users` in `psql`.

**Requirements:**
1. Execute `\d users`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> \d users
> ```
>
> #### Technical Explanation
>
> 1. `\d tablename` is a psql meta-command inspecting table schema definitions.
> 2. Displays column names, data types, constraints, foreign key links, and associated indexes.
> 3. Fast CLI schema inspection tool.
> 
---

### Exercise 2: Executing SQL Scripts from Files in psql

**Scenario:**
Execute a database migration script file `schema.sql` against database `dev_db` using `psql`.

**Requirements:**
1. Execute `psql -d dev_db -f schema.sql`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> psql -h localhost -U app_user -d dev_db -f ./scripts/schema.sql
> ```
>
> #### Technical Explanation
>
> 1. `-f filename` executes SQL statements contained in a file sequentially.
> 2. Standard command for executing database setup and seed scripts in CI/CD pipelines.
> 3. Returns execution status for each SQL command.
> 
---

### Exercise 3: Exporting Query Results to CSV Files

**Scenario:**
Export query output for `users` table directly to a CSV file using psql `\copy`.

**Requirements:**
1. Execute `\copy (SELECT * FROM users) TO 'users.csv' WITH CSV HEADER`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> \copy (SELECT id, username, email FROM users) TO 'users.csv' WITH CSV HEADER;
> ```
>
> #### Technical Explanation
>
> 1. `\copy` is a psql client command streaming data between PostgreSQL and local client files.
> 2. `WITH CSV HEADER` formats output as comma-separated values with column title headers.
> 3. Export data without requiring server file permissions.
> 
---



## 6. Related Terms
- [Client-Server Model (in Databases)](client_server_model.md) — The underlying network architecture.
- [pgAdmin & GUI Tools](pgadmin.md) — The graphical client alternative.
- [Connection String / DSN](connection_string.md) — Related concept: Connection String / DSN.
- [PostgreSQL (Postgres)](postgresql.md) — Related concept: PostgreSQL (Postgres).

---

## 7. Key Takeaways
- `psql` is the official command-line interface client for PostgreSQL.
- It executes standard SQL queries and local client helper commands.
- All standard SQL queries inside `psql` must end with a semicolon (`;`).
- Backslash commands (meta-commands like `\dt`, `\d`) inspect database structure.
- Type `\q` to safely exit the interactive `psql` shell terminal.
