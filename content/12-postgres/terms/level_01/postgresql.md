# PostgreSQL (Postgres)

> **Level 1 — What Is a Database?**
> An open-source, enterprise-grade relational database management system (RDBMS) widely celebrated for its reliability, feature robustness, strict standards compliance, and extensibility.

---

## 1. Prerequisites
- [Database](database.md) — Understanding why we need database storage.

---

## 2. Term Category

**Core Concept** (Object-Relational DBMS): PostgreSQL is an advanced, open-source object-relational database management system (ORDBMS) emphasizing extensible SQL compliance, data integrity, and concurrency.



---

## 3. Explanation

### Environment Context
- **Cross-Platform Standard** (Runs as a background daemon process (`postgres` or `pg_ctl`) listening on port `5432` by default. Can run locally, in Docker containers, or inside cloud clusters).

### (1) Design Motivation — "Why did we design this?"
In 1986, a database pioneer named Michael Stonebraker started the POSTGRES project at UC Berkeley to solve limitations in early relational databases. 

The name originally stood for *"Post-Ingres"* (since it succeeded Stonebraker's previous database system, Ingres). Later, support for SQL was added, and the official name became **PostgreSQL**, though the community commonly refers to it simply as **Postgres**.

Postgres was designed with a "Safety First" philosophy:

-   **Reliability & Integrity:** It strictly implements transaction safety rules (ACID compliance) so that data is never lost or corrupted, even during server crashes or hardware failures.
-   **Standards Compliance:** It adheres strictly to ANSI-SQL standards, meaning SQL queries written for Postgres behave exactly as specified by international specifications.
-   **Extensibility:** Unlike rigid legacy databases, Postgres was built to support custom plugins. You can add support for custom data types (like GIS geographic mapping, or native JSONB document objects) directly into the database engine.

---

### (2) Reality Metaphor
Imagine choosing a lockbox for your company:
-   **SQLite** is like a small personal cash box in your desk drawer. It is tiny, fast to open, and requires no setup. However, it only fits in one desk, and only one person can use it at a time.
-   **PostgreSQL** is an industrial-strength bank vault. It is heavy, requires a dedicated room (background server installation), has a security guard (authentication), can hold unlimited assets, and allows hundreds of tellers to deposit and withdraw money at the same time without conflicts.

---

### (3) Command Examples

#### Verifying PostgreSQL Version
You can check if PostgreSQL is installed and see its version using the command-line interface:

```bash
postgres --version
# Output: postgres (PostgreSQL) 15.3 (or similar)
```

#### SQL Engine Identification Query
Once connected to a Postgres database, you can run a system query to inspect details about the server:

```sql
SELECT version();
-- Returns detailed compilation and version details about the running database engine.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming Postgres is an embedded in-memory system

**The mistake:** Thinking Postgres is like SQLite, where you can simply import a package and immediately write to a local file, without installing database software.

**Why it's wrong:** Postgres runs as a client-server database. It is a separate background system service that must be installed on your machine and kept running. Your Node.js or Python application connects to it over a network socket, meaning you must manage server start states and configuration ports.

**Fix: Install the PostgreSQL server software (e.g., using Homebrew, apt, or Docker) and ensure the Postgres service is running before starting your client application.**

---



### Mistake 2: Assuming PostgreSQL is an In-Process Embedded Database (like SQLite)

**The mistake:** Thinking Postgres is an in-memory embedded library that does not require database server installation.

**Why it's wrong:** PostgreSQL is a dedicated client-server database daemon process. Server software must be installed and running on target hosts.

*Incorrect:*
```sql
// Expecting local DB without running postgres daemon
```

*Fix:*
```sql
Install PostgreSQL service and verify daemon status before running app code
```

### Mistake 3: Confusing PostgreSQL System Version (`SELECT version()`) with Client Driver Versions

**The mistake:** Assuming `pg` npm driver version matches PostgreSQL server daemon version.

**Why it's wrong:** Client driver versions (`pg@8.11`) operate independently of PostgreSQL database engine server versions (`PostgreSQL 15.3`).

*Incorrect:*
```sql
// Expecting driver version to match server version
```

*Fix:*
```sql
Check server engine version via SELECT version();
```

## 5. Practice Exercises

### Exercise 1: Querying Server Version Telemetry

**Scenario:**
Query the running PostgreSQL server version and build configuration using `SELECT version()`.

**Requirements:**
1. Execute `SELECT version()`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT version();
> ```
>
> #### Technical Explanation
>
> 1. `version()` returns the full PostgreSQL version string, OS compilation target, and compiler details.
> 2. Verifies whether server features (e.g. PG 15+ `MERGE` or PG 16+ `json_table`) are supported.
> 3. Initial diagnostic step during environment setup.

---

### Exercise 2: Checking Transactional ACID Compliance Settings

**Scenario:**
Verify that `synchronous_commit` is enabled on the server to guarantee ACID write durability.

**Requirements:**
1. Execute `SHOW synchronous_commit`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SHOW synchronous_commit;
> ```
>
> #### Technical Explanation
>
> 1. `synchronous_commit = on` guarantees that write transactions wait for WAL disk flush before returning success to clients.
> 2. Enforces strict ACID Durability guarantees.
> 3. Prevents data loss during unexpected power loss.

---

### Exercise 3: Inspecting Server Uptime Telemetry

**Scenario:**
Query server start time and uptime duration using system statistics.

**Requirements:**
1. Query `pg_postmaster_start_time()`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   pg_postmaster_start_time() AS server_started_at,
>   CURRENT_TIMESTAMP - pg_postmaster_start_time() AS uptime_duration;
> ```
>
> #### Technical Explanation
>
> 1. `pg_postmaster_start_time()` returns the timestamp when the main server daemon (`postgres`) was started.
> 2. Subtracting from `CURRENT_TIMESTAMP` calculates total server uptime.
> 3. Monitors server stability and restart cycles.

---



## 6. Related Terms
- [Database](database.md) — The parent technology class.
- [Relational Database](relational_database.md) — The relational data structure model.
- [Client-Server Model (in Databases)](client_server_model.md) — Related concept: Client-Server Model (in Databases).
- [`psql` (Interactive Terminal)](psql.md) — Interactive terminal CLI.

---

## 7. Key Takeaways
- PostgreSQL (commonly called Postgres) is an open-source, enterprise-grade relational database.
- It prioritizes data safety, transaction reliability, and ANSI-SQL standard compliance above all else.
- It is highly extensible, supporting custom types (like JSONB, GIS coordinates, vectors).
- It runs as a background service listening on default port `5432`.
- You must install and run the PostgreSQL server before your client code can connect to it.
