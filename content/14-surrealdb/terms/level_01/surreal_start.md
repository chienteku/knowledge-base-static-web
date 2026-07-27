# SurrealDB Server (`surreal start`)

> **Level 1 — What Is SurrealDB?**
> The command-line CLI command and running background process used to launch a SurrealDB database server instance, defining connection ports, authentication credentials, and storage engines.

---

## 1. Prerequisites
- [Namespace & Database](namespace_database.md) — The logical containers hosted.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **Operating System Shell** (Run in the system command line console. Spawns the persistent `surreal` server process that listens for WebSocket and HTTP database traffic).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Server Start Script

**Problem:** You are creating a startup script for a local development team. 
Write the terminal command to:
1.  Launch SurrealDB on port `8080` (listening on all interfaces: `0.0.0.0`).
2.  Set the admin credentials to `"devUser"` / `"devPass"`.
3.  Configure it to store data persistently in a local path: `/home/user/db_data`.

**Expected output:**
```bash
surreal start --user devUser --pass devPass --bind 0.0.0.0:8080 file:///home/user/db_data
```

> [!check]- Answer
> - The binding parameter value is `0.0.0.0:8080`.
> - Use the `file://` protocol prefix for the storage path argument.

---



### Exercise 2: Starting Local In-Memory Development Server

**Problem:** Command to start a local development server on port `8000` in-memory with user `root` pass `root`.

**Expected output:**
```text
surreal start --bind 0.0.0.0:8000 --user root --pass root mem://
```

> [!check]- Answer
> ```text
> surreal start --bind 0.0.0.0:8000 --user root --pass root mem://
> ```
>
> **Explanation:** `mem://` creates fast ephemeral in-memory database instances for local development.

### Exercise 3: Log Level Configuration Flag

**Problem:** Flag to increase server logging verbosity to debug level (`--log debug` / `-l debug`).

**Expected output:**
```text
surreal start --log debug rocksdb://data.db
```

> [!check]- Answer
> ```text
> surreal start --log debug rocksdb://data.db
> ```
>
> **Explanation:** `--log debug` outputs detailed internal RPC, storage, and query execution logs.

## 7. Related Terms
- [Connection URI & Protocols](connection_uri.md) — Connect protocols.
- [Storage Backends](storage_backends.md) — Pluggable storage engines.

---

## 8. Key Takeaways
- `surreal start` launches a SurrealDB database server instance.
- Built-in server operations are managed in a single unified binary file (`surreal`).
- Master admin credentials are set using `--user` (-u) and `--pass` (-p).
- The default connection port is 8000 (`--bind 127.0.0.1:8000`).
- The storage argument specifies where data is saved (memory, file, or TiKV).
- In-memory databases are fast and ideal for testing, but data is lost on stop.
- Master credentials must be specified on start to allow client authentication.
