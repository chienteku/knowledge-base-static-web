# SurrealDB Server (`surreal start`)

> **Level 1 — What Is SurrealDB?**
> The command-line CLI command and running background process used to launch a SurrealDB database server instance, defining connection ports, authentication credentials, and storage engines.

---

## 1. Prerequisites

- [Namespace & Database](namespace_database.md) — The logical containers hosted.

---

## 2. Term Category


**Performance / Operations (database server startup command)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
To query a database, the database engine server process must be running and listening for network requests.
-   In PostgreSQL, you start the server via `pg_ctl` or system services (`systemctl start postgresql`).
-   In MongoDB, you run `mongod`.

In SurrealDB, the entire database management engine is compiled into a single, multi-functional CLI binary: **`surreal`**. 

To start the database server, you run the **`surreal start`** command. 

This command compiles storage setup, initial admin credentials, port bindings, and logging details into a single terminal call, making it easy to spin up fast in-memory databases for local development or hook into distributed storage systems in production.

---

### (2) Critical Command Flags
When running `surreal start`, you configure parameters using CLI flags:

-   **`--user` / `-u`:** Sets the master root admin username.
-   **`--pass` / `-p`:** Sets the master root admin password.
-   **`--bind`:** The IP address and port the server listens on (defaults to `127.0.0.1:8000`).
-   **`--log`:** Configures log output verbosity (e.g. `debug`, `info`, `warn`, `error`).
-   **Storage Argument:** The final parameter specifies the storage backend:
    -   `memory`: Keeps data in RAM. Fast, but data is lost on server restart (ideal for testing).
    -   `file://<path>`: Saves data to disk (using RocksDB or SurrealKV engines).
    -   `tikv://<address>`: Connects to a distributed TiKV cluster for horizontally scaled production deployments.

---

### (3) Reality Metaphor (Pop-up Kiosks)
Imagine starting a mall business:
-   **`surreal start`:** Setting up a **Service Kiosk** in the mall hallway.
    -   **`--bind`:** Positioning the kiosk at Booth #8000 in the lobby.
    -   **`-u / -p`:** Setting the master key combination to lock and unlock the cash drawer.
    -   **Storage Argument:**
        -   `memory` (Ice Stand): Selling ice sculptures. It's fast to set up, but if you unplug the freezer overnight (server shutdown), everything melts away.
        -   `file://` (Metal Safe): Installing a physical metal safe bolted to the floor. The goods persist even if you close for the weekend.

---

### (4) Code Examples

#### Running SurrealDB Startup Commands in the Terminal
These commands are run in your operating system command line prompt:

```bash
# 1. Start a local developer instance in-memory (data lost on stop)
# Listens on port 8000, with admin credentials 'root' / 'root'
surreal start --user root --pass root --bind 127.0.0.1:8000 memory

# 2. Start a persistent file-based instance (using RocksDB)
# Saves database files to a local folder '/data/mydb'
surreal start --user admin --pass secretPass123 --bind 0.0.0.0:8000 file:///data/mydb

# 3. Start in quiet logging mode in production
surreal start --user admin --pass secretPass123 --log warn file://prod_db
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to supply the '--user' (-u) and '--pass' (-p) flags when starting the server, preventing clients from connecting

**The mistake:** Running `surreal start memory` to test a local app, without defining admin credentials.

**Why it's wrong:** Unlike older databases, SurrealDB has security active by default. 

If you omit the master user and password flags, the server starts, but it does not create a root administrator account. 

When you try to connect using the shell (`surreal sql`) or an SDK client, your connection requests will be rejected as unauthorized, locking you out of the server.

**Fix: Always include the `-u` and `-p` parameters on startup to create your initial administrator credentials.**

---



### Mistake 2: Starting SurrealDB Server in Un-Authenticated Production Mode

**The mistake:** Running `surreal start` without `--user` and `--pass` or `--auth` flags in production.

**Why it's wrong:** Without authentication flags, SurrealDB runs in unauthenticated mode, permitting anyone to execute administrative queries without passwords.

*Incorrect:*
```surrealql
$ surreal start rocksdb://data.db # ❌ Unauthenticated open access mode!
```

*Fix:*
```surrealql
$ surreal start rocksdb://data.db --user root --pass StrongPass123! --auth
```

### Mistake 3: Binding Server to `127.0.0.1` expecting External Network Access

**The mistake:** Binding `surreal start` to `--bind 127.0.0.1:8000` when deploying in Docker or cloud servers.

**Why it's wrong:** `127.0.0.1` binds exclusively to local loopback interfaces. External clients and Docker containers cannot connect. Bind to `0.0.0.0:8000`.

*Incorrect:*
```surrealql
$ surreal start --bind 127.0.0.1:8000 # ❌ External containers cannot reach server!
```

*Fix:*
```surrealql
$ surreal start --bind 0.0.0.0:8000 # Binds to all network interfaces
```

## 5. Practice Exercises

### Exercise 1: Single-Node Persistent Server Deployment

**Scenario:**
You are writing a systemd service startup script for a production SurrealDB single-node instance storing data persistently on local SSD storage.

**Requirements:**
1. Formulate the `surreal start` command binding to interface `0.0.0.0:8000`.
2. Configure root user `admin` and secure password.
3. Specify local file storage path `file:///var/lib/surrealdb/data.db`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal start >   --bind 0.0.0.0:8000 >   --user admin >   --pass "ProductionSecretPass2026!" >   file:///var/lib/surrealdb/data.db
> ```
>
> #### Technical Explanation
>
> 1. `surreal start` launches the SurrealDB database engine server process.
> 2. `--bind 0.0.0.0:8000` allows the server to accept connections across all network interfaces on port 8000.
> 3. `file://` enables local disk persistence using single-node Key-Value storage engines.

---

### Exercise 2: Local Ephemeral Server Startup with Debug Logs

**Scenario:**
A developer needs to launch an ephemeral in-memory SurrealDB instance for local automated test execution with verbose query logging enabled.

**Requirements:**
1. Formulate `surreal start` using in-memory engine `memory`.
2. Set log level to `debug`.
3. Set development credentials `root` / `root`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal start >   --log debug >   --user root >   --pass root >   memory
> ```
>
> #### Technical Explanation
>
> 1. `memory` (or `mem://`) launches a zero-disk-I/O in-memory database instance in RAM.
> 2. `--log debug` prints detailed query parsing, transaction locks, and client connection events to stdout.
> 3. Ephemeral instances tear down completely when the process terminates, leaving no residual files.

---

### Exercise 3: Hardened Production Server Flags Configuration

**Scenario:**
A security administrator is hardening a production `surreal start` command flags configuration to restrict unauthenticated access and disable arbitrary script executions.

**Requirements:**
1. Pass flag `--deny-scripting` to disable embedded JavaScript functions.
2. Omit `--allow-unauthenticated` to mandate valid credentials for all incoming connections.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal start >   --bind 0.0.0.0:8000 >   --user root >   --pass "HardenedRootPass99!" >   --deny-scripting >   file:///var/data/surreal.db
> ```
>
> #### Technical Explanation
>
> 1. `--deny-scripting` disables execution of embedded JavaScript functions (`function() { ... }`), mitigating remote code execution risks.
> 2. Requiring root or access credentials on all connection requests prevents unauthenticated database access.
> 3. Hardened startup configurations protect production clusters against unauthorized network exploitation.

---



## 6. Related Terms

- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](connection_uri.md) — Connect protocols.
- [Storage Backends (Memory, RocksDB, TiKV)](storage_backends.md) — Pluggable storage engines.
- [SurrealDB CLI (`surreal sql`)](surreal_cli.md) — Related concept: SurrealDB CLI (`surreal sql`).
- [`PARALLEL` Keyword](../level_06/parallel_keyword.md) — Related concept: `PARALLEL` Keyword.
- [Docker Deployment](../level_10/docker_deployment.md) — Related concept: Docker Deployment.
- [TiKV Backend (Distributed Mode)](../level_10/tikv_backend.md) — Related concept: TiKV Backend (Distributed Mode).

---

## 7. Key Takeaways
- `surreal start` launches a SurrealDB database server instance.
- Built-in server operations are managed in a single unified binary file (`surreal`).
- Master admin credentials are set using `--user` (-u) and `--pass` (-p).
- The default connection port is 8000 (`--bind 127.0.0.1:8000`).
- The storage argument specifies where data is saved (memory, file, or TiKV).
- In-memory databases are fast and ideal for testing, but data is lost on stop.
- Master credentials must be specified on start to allow client authentication.
