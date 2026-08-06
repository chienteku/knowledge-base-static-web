# `postgresql.conf` (Server Configuration)

> **Level 10 — Administration, Security & Production**
> PostgreSQL's central configuration file used to tune server behavior, memory allocation buffers (`shared_buffers`, `work_mem`), connection limits, logging, and write-ahead log (WAL) properties.

---

## 1. Prerequisites
- [Connection Pooling](connection_pooling.md) — Managing connection caps tuned in postgresql.conf.

---

## 2. Term Category

**Administration / Operations** (Server Configuration File): `postgresql.conf` controls core server memory settings (`shared_buffers`, `work_mem`), WAL settings, and connection limits.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Server Configuration** (Stored in the database server's data directory. Some settings take effect after a config reload, while others require a full PostgreSQL service restart to reallocate system RAM).

### (1) Design Motivation — "Why did we design this?"
When you install PostgreSQL, it is configured with highly conservative default settings. 

These defaults are designed to ensure that Postgres can run on simple hardware (like a local development laptop with very limited resources).

If you deploy this default configuration to a high-end production cloud server containing 32GB of RAM:
-   Postgres will only use a tiny fraction of the server's memory.
-   It will write temporary files to the slow hard drive during sorting, instead of running calculations in the fast RAM.
-   Your database will run slowly despite expensive hardware.

We designed the **`postgresql.conf`** file to allow administrators to tune the database engine to match the physical hardware of the host server.

---

### (2) Key Performance Parameters

#### 1. `shared_buffers` (Table Block Cache)
Determines how much memory PostgreSQL uses to cache read/write table data blocks in RAM.
-   *Best Practice:* Set to **25% of the total system RAM** on production servers (never exceed 30%, as the OS needs the remaining RAM for filesystem page caching).

#### 2. `work_mem` (Sorting Memory)
Specifies the memory used by internal sort operations (like `ORDER BY` or `DISTINCT`) and hash joins before writing temporary files to disk.
-   *Caution:* This is allocated **per query step**. If a query has 3 joins, it can use `3 * work_mem`. If 50 users run queries, they use `150 * work_mem`. Keep this small (e.g. `32MB` to `64MB`).

#### 3. `maintenance_work_mem` (Maintenance Memory)
Memory allocated for administrative tasks like building indexes (`CREATE INDEX`), cleaning tables (`VACUUM`), or adding foreign keys.
-   *Best Practice:* Can be set much larger than `work_mem` (e.g. `1GB` on a 16GB RAM server) because these tasks run one-at-a-time.

#### 4. `max_connections` (Connection Cap)
The maximum number of simultaneous database connections (defaults to `100`).

---

### (3) Reality Metaphor
Imagine tuning a sports car:
-   A new car leaves the factory with a **Speed Limiter Cap** (the default PostgreSQL settings) so it doesn't crash on standard neighborhood streets.
-   When you take the car to a professional racetrack (a high-end production cloud server), you hire a mechanic to open the hood, connect a laptop to the engine control unit (modifying `postgresql.conf`), and remove the limiters, allowing the cylinders to utilize their maximum horsepower (RAM) to achieve peak speeds.

---

### (4) Code Examples

#### Standard Settings inside a postgresql.conf file
```text
# Memory Settings (for a 16GB RAM production server)
shared_buffers = 4GB                # 25% of system RAM
work_mem = 64MB                     # Per-query sort buffer
maintenance_work_mem = 1GB          # Maintenance tasks buffer

# Connection Settings
max_connections = 100               # Capped connection count

# Write-Ahead Log (WAL) Settings
wal_level = replica                 # Logging depth (for backups/replication)
```

#### Reloading Configurations (Without Server Restart)
If you edit settings that do not require RAM reallocation, you can reload without disconnecting users:

```sql
SELECT pg_reload_conf();
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Setting 'work_mem' too high in an attempt to speed up sort queries

**The mistake:** Setting `work_mem = 4GB` on a server with 16GB of RAM because you want your reports to sort faster.

**Why it's wrong:** `work_mem` is not a global limit; it is allocated **per sorting node, per active query**. 

If 10 users run complex queries simultaneously, each performing 2 sorts, the database tries to allocate:
`10 users * 2 sorts * 4GB = 80GB of RAM.`

The server runs out of physical memory instantly, and the Linux kernel kills the PostgreSQL process, causing immediate database downtime.

**Fix: Keep `work_mem` conservative (e.g., 32MB to 128MB). If a specific large migration script requires massive sort memory, increase `work_mem` temporarily for that single session connection only, instead of setting it globally.**

```sql
-- Increase work_mem for the current database connection session only
SET work_mem = '1GB';
-- Run heavy migration...
-- Connection closes, work_mem resets to global safety default automatically!
```

---



### Mistake 2: Setting `shared_buffers` Higher Than 40% of Total System RAM

**The mistake:** Setting `shared_buffers = 64GB` on a server with 64GB total RAM.

**Why it's wrong:** PostgreSQL relies on OS File System Disk Caching alongside `shared_buffers`. Setting `shared_buffers` higher than 40% of RAM causes double-buffering and triggers OS Out-Of-Memory (OOM) killer shutdowns. Set `shared_buffers = 25% of RAM`.

*Incorrect:*
```sql
shared_buffers = 64GB -- ❌ Exhausts OS memory on 64GB server!
```

*Fix:*
```sql
shared_buffers = 16GB -- 25% of total system RAM
```

### Mistake 3: Setting `work_mem` Globally High Causing Out-Of-Memory Crashes During Concurrent Queries

**The mistake:** Setting `work_mem = 4GB` globally in `postgresql.conf` with 100 max connections.

**Why it's wrong:** `work_mem` is allocated PER SORT/HASH STAGE PER QUERY! A complex query with 4 sort stages across 100 concurrent connections can allocate $4\text{GB} \times 4 \times 100 = 1.6\text{TB}$ of RAM! Keep global `work_mem` modest (64MB) and override per session.

*Incorrect:*
```sql
work_mem = 4GB -- ❌ Triggers OOM crash during concurrent sorts!
```

*Fix:*
```sql
work_mem = 64MB -- Global setting; set higher per session for specific heavy queries
```

## 5. Practice Exercises

### Exercise 1: Tuning Shared Buffers and Work Memory

**Scenario:**
Configure `shared_buffers = 4GB` and `work_mem = 64MB` in `postgresql.conf` for a 16GB RAM database server.

**Requirements:**
1. Code `postgresql.conf` memory parameter tuning entries.

> [!check]- Answer
>
> #### Implementation
>
> ```ini
> # postgresql.conf
> shared_buffers = 4GB      # ~25% of total system RAM for page caching
> work_mem = 64MB           # Memory for internal sort/hash operations per query operation
> maintenance_work_mem = 1GB # Memory for VACUUM and CREATE INDEX builds
> ```
>
> #### Technical Explanation
>
> 1. `shared_buffers` allocates dedicated RAM for caching 8KB table and index pages inside PostgreSQL.
> 2. `work_mem` allocates RAM per sort/hash operation within a query; setting it too high causes out-of-memory (OOM) crashes under high concurrency.
> 3. Core PostgreSQL memory tuning standard.
> 
---

### Exercise 2: Tuning Checkpoints for High Write Performance

**Scenario:**
Tune `max_wal_size = 16GB` and `checkpoint_completion_target = 0.9` to eliminate frequent checkpoint I/O spikes.

**Requirements:**
1. Code checkpoint tuning settings.

> [!check]- Answer
>
> #### Implementation
>
> ```ini
> # postgresql.conf
> max_wal_size = 16GB
> min_wal_size = 2GB
> checkpoint_completion_target = 0.9
> ```
>
> #### Technical Explanation
>
> 1. `max_wal_size` expands WAL capacity before forcing a dirty page checkpoint flush.
> 2. `checkpoint_completion_target = 0.9` spreads dirty page disk writes evenly over 90% of the checkpoint interval.
> 3. Prevents severe disk I/O latency spikes during heavy write workloads.
> 
---

### Exercise 3: Inspecting Active Configuration Parameters with `SHOW`

**Scenario:**
Query active server configuration parameters using `SHOW` and `pg_settings`.

**Requirements:**
1. Execute `SHOW max_connections;` and query `pg_settings`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SHOW max_connections;
> 
> SELECT name, setting, unit, context 
> FROM pg_settings 
> WHERE name IN ('shared_buffers', 'work_mem', 'random_page_cost');
> ```
>
> #### Technical Explanation
>
> 1. `SHOW param_name` displays the active runtime value of a configuration setting.
> 2. `pg_settings` exposes parameter metadata, units, and reload contexts (`sighup`, `postmaster`).
> 3. Runtime configuration inspection.
> 
---



## 6. Related Terms
- [`pg_hba.conf` (Host-Based Authentication)](pg_hba_conf.md) — Network permissions file.
- [Connection Pooling](connection_pooling.md) — Managing connection caps.
- [Managed PostgreSQL Services (Supabase, Neon, AWS RDS)](managed_services.md) — Related concept: Managed PostgreSQL Services (Supabase, Neon, AWS RDS).
- [`pg_stat_statements` / Monitoring](monitoring.md) — Related concept: `pg_stat_statements` / Monitoring.

---

## 7. Key Takeaways
- `postgresql.conf` is the main file containing PostgreSQL engine parameters.
- Default settings are highly conservative and must be tuned for production.
- `shared_buffers` caches data blocks; set to 25% of total system RAM.
- `work_mem` is per-query-step sorting memory; keep it small to prevent crashes.
- `maintenance_work_mem` caches index builds and vacuums; set larger.
- Use `SET work_mem` to temporarily increase sorting memory for a single session.
- Run `SELECT pg_reload_conf()` to apply non-restart configurations.
