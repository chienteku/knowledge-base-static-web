# SurrealDB CLI (`surreal sql`)

> **Level 1 — What Is SurrealDB?**
> The interactive command-line interface command used to connect to a SurrealDB database server to execute SurrealQL queries directly from the terminal shell, serving as the equivalent to PostgreSQL's `psql` or MongoDB's `mongosh`.

---

## 1. Prerequisites

- [SurrealDB Server (`surreal start`)](surreal_start.md) — The target server process.
- [Surrealist (Web IDE)](surrealist.md) — The graphical counterpart.
- [SurrealDB](surrealdb.md) — SurrealDB binary.

---

## 2. Term Category


**Integration / Ecosystem (command-line interface binary)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While visual IDEs (like Surrealist) are useful, developers need a fast, lightweight terminal-based client shell:
-   To run quick query tests without opening heavy GUI apps.
-   To write shell scripts that automate database tasks.
-   To execute database schema files during server deployment pipelines (CI/CD).

In PostgreSQL, you connect via **`psql`**. 

In MongoDB, you connect via **`mongosh`**.

We designed the **`surreal sql`** sub-command to act as this terminal interface. 

It is bundled directly inside the `surreal` CLI binary. 

You pass connection settings and credentials as arguments, and it opens a query shell prompt. 

You can type SurrealQL commands and get immediate JSON formatted outputs. 

Additionally, it supports standard Unix pipes, allowing you to feed `.surql` file scripts directly into the database.

---

### (2) Interactive vs. Scripting Modes

#### 1. Interactive Mode (The Shell Prompt)
You run the command, and it opens a prompt: `ns/db>`. 
-   You type queries sequentially, hit enter, and see BSON/JSON results printed.

#### 2. Scripting Mode (Unix Piping)
You feed query script files directly using shell operators:
`cat schema.surql | surreal sql --endpoint ws://localhost:8000 ...`
-   The command runs the schema instructions, returns outputs, and terminates. Great for migrations.

---

### (3) Reality Metaphor (The Walkie-Talkie)
Imagine communicating with a warehouse team:
-   **Surrealist GUI:** Sending typed letters inside post-office folders (structured and readable, but requires opening envelopes and sitting at a desk).
-   **Surreal CLI (`surreal sql`):** A **Walkie-Talkie**. 
    -   You press the button, shout a quick instructions query, the clerk yells back the raw document list, and you release the button. 
    -   It is fast, operates anywhere, and fits in your pocket.

---

### (4) Code Examples

#### Running the CLI Connection Shell
These commands are run in your OS terminal prompt, not inside the database:

```bash
# 1. Connect interactively to a local database (starts the prompt shell)
surreal sql --endpoint http://localhost:8000 --namespace test --database test --username root --password root

# Terminal transitions to shell prompt:
# test/test> 
# You can now run queries:
test/test> SELECT * FROM user;

# 2. Pipe a local schema file into the database (scripting mode)
# Runs the SQL commands inside 'init_schema.surql' and terminates
cat init_schema.surql | surreal sql --endpoint http://localhost:8000 -u root -p root -ns test -db production
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to connect using 'surreal sql' before launching the database server, expecting the CLI to start the database automatically

**The mistake:** Running the client command `surreal sql --endpoint http://localhost:8000` in a new server terminal tab, forgetting that the `surreal start` server process has not been run.

**Why it's wrong:** `surreal sql` is a **Client Shell**. It is not a database engine. 

It tries to open a connection socket to port 8000. 

If the database server (`surreal start`) is not running, the TCP request fails, and the CLI throws a connection refused error.

**Fix: Always run `surreal start` first (often in a background process or separate terminal tab). Once the server is active, open a new terminal window to launch your `surreal sql` client shell.**

---



### Mistake 2: Confusing `surreal sql` Shell Client with `surreal start` Server

**The mistake:** Running `surreal sql` expecting it to start the SurrealDB database server.

**Why it's wrong:** `surreal sql` is a command-line terminal client (REPL) used to connect to a running server. Use `surreal start` to launch the server engine.

*Incorrect:*
```surrealql
$ surreal sql # ❌ Fails if no database server is running on localhost:8000!
```

*Fix:*
```surrealql
$ surreal start rocksdb://data.db # 1. Start server engine
$ surreal sql --endpoint http://localhost:8000 --ns test --db test # 2. Connect CLI client
```

### Mistake 3: Forgetting Authentication Flags in `surreal sql` Commands

**The mistake:** Connecting `surreal sql` to a secured server without passing `--user` and `--pass`.

**Why it's wrong:** Secured SurrealDB servers reject unauthenticated CLI shell connections with authorization errors.

*Incorrect:*
```surrealql
$ surreal sql -e http://localhost:8000 --ns main --db app # ❌ Auth error on secured server
```

*Fix:*
```surrealql
$ surreal sql -e http://localhost:8000 -u root -p root --ns main --db app
```

## 5. Practice Exercises

### Exercise 1: Interactive SQL Shell Execution

**Scenario:**
A database developer needs to connect to a local running SurrealDB server using the `surreal` CLI binary to inspect database schemas interactively.

**Requirements:**
1. Formulate the `surreal sql` command targeting endpoint `http://localhost:8000`.
2. Include root credentials `root` / `root`.
3. Target namespace `dev` and database `app`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal sql >   --endpoint http://localhost:8000 >   --user root >   --pass root >   --ns dev >   --db app
> ```
>
> #### Technical Explanation
>
> 1. `surreal sql` starts an interactive Read-Eval-Print Loop (REPL) shell for executing SurrealQL queries.
> 2. Passing `--ns` and `--db` sets default session scoping flags automatically upon shell startup.
> 3. Enables fast query prototyping and schema debugging from terminal environments.
> 
---

### Exercise 2: Automated Database Backup Export

**Scenario:**
A DevOps engineer needs to export a nightly SurrealQL schema and data dump file `backup_prod.surql` from a production database.

**Requirements:**
1. Formulate the `surreal export` command targeting production namespace `production` and database `main`.
2. Save the output dump to file `backup_prod.surql`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal export >   --endpoint http://localhost:8000 >   --user root >   --pass SecretProdPass >   --ns production >   --db main >   backup_prod.surql
> ```
>
> #### Technical Explanation
>
> 1. `surreal export` streams valid SurrealQL DDL (`DEFINE`) and DML (`CREATE`) statements to a plain-text file.
> 2. Generated script files can be inspected with version control tools or imported into alternative clusters.
> 3. Provides clean backup and environment seeding capabilities for CI/CD pipelines.
> 
---

### Exercise 3: Database Schema Import and Migration Execution

**Scenario:**
A developer needs to seed a fresh staging environment by importing the SurrealQL script `schema_v1.surql`.

**Requirements:**
1. Formulate the `surreal import` CLI command.
2. Target namespace `staging` and database `main`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal import >   --endpoint http://localhost:8000 >   --user root >   --pass StagingPass123 >   --ns staging >   --db main >   schema_v1.surql
> ```
>
> #### Technical Explanation
>
> 1. `surreal import` reads and executes SurrealQL script files sequentially against the target cluster.
> 2. Handles multi-statement transactions and schema definitions defined in the imported file.
> 3. Used in deployment pipelines to apply versioned database schema migrations automatically.
> 
---



## 6. Related Terms

- [SurrealDB Server (`surreal start`)](surreal_start.md) — The server process target.
- [Connection Credentials (`USE NS ... DB ...`)](connection_credentials.md) — Connection parameters.
- [Surrealist (Web IDE)](surrealist.md) — Related concept: Surrealist (Web IDE).
- [Error Handling & Debugging](../level_10/error_handling.md) — Related concept: Error Handling & Debugging.
- [`surreal export` / `surreal import` (Backups)](../level_10/export_import.md) — Related concept: `surreal export` / `surreal import` (Backups).
- [`surreal validate` (Query Validation)](../level_10/surreal_validate.md) — Related concept: `surreal validate` (Query Validation).
- [SurrealQL](surrealql.md) — Running SurrealQL queries.

---

## 7. Key Takeaways
- `surreal sql` opens the interactive CLI database shell.
- Direct NoSQL equivalent to PostgreSQL's `psql` and MongoDB's `mongosh`.
- Commands are run in OS shell consoles, not inside databases.
- Supports interactive prompt inputs and unix pipe shell scripting.
- Ideal for automating database deployments and schema migrations.
- Requires target databases to be running (`surreal start`) beforehand.
- Accepts connection configurations (endpoints, namespaces, credentials) as flags.
