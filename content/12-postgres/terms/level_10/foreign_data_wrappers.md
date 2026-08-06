# Foreign Data Wrappers (`postgres_fdw`)

> **Level 10 — Administration, Security & Production**
> The SQL standard mechanism that allows a PostgreSQL database to connect to external data sources (other databases, CSV files, or APIs) and query them directly as if they were local tables.

---

## 1. Prerequisites
- [Table (Relation)](../level_01/table.md) — The data grids mapped from external servers.
- [Extensions (`CREATE EXTENSION`)](extensions.md) — The packaging system used to install the FDW module.

---

## 2. Term Category

**Advanced Feature** (Federated Cross-Database Queries): Foreign Data Wrappers (`postgres_fdw`) query remote external PostgreSQL or foreign databases as local tables.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Standardized by SQL/MED (Management of External Data). The built-in **`postgres_fdw`** extension handles connections between separate PostgreSQL instances over standard network ports).

### (1) Design Motivation — "Why did we design this?"
In large companies, databases are split across separate servers:
-   The user billing records are stored in `billing_db` on Server A.
-   The warehouse stock counts are stored in `warehouse_db` on Server B.

If you need to run a business report joining billing accounts with stock counts:
-   **The manual way:** You write backend application code (in JavaScript or Python) to connect to Server A, fetch accounts, connect to Server B, fetch stock counts, and run loops to merge them in RAM. This requires writing complex code and is slow.

We designed **Foreign Data Wrappers (FDW)** to solve this cross-database reporting problem. 

An FDW allows you to mount a remote table directly inside your local database catalog. 

Once mounted, you can write standard SQL queries:
`SELECT * FROM local_users JOIN remote_billing_table ON ...;`

The database engine handles the TCP network connections and data streaming behind the scenes.

---

### (2) Setup Sequence (The postgres_fdw steps)
To connect to another PostgreSQL database, you follow a 4-step setup sequence:

1.  **Load the Extension:** `CREATE EXTENSION postgres_fdw;`
2.  **Define the Server Link:** Specify the remote host IP address and database name.
3.  **Define User Mapping:** Provide the username and password credentials to log in to the remote server.
4.  **Define the Foreign Table:** Map the remote columns locally so Postgres knows the data schema.

---

### (3) Reality Metaphor (Network Shared Folders)
Imagine working on document files:
-   **Manual app code:** Copying files back-and-forth between Server A and Server B using a USB thumb drive.
-   **Foreign Data Wrapper:** Mounting a remote office server's network folder onto your laptop's File Explorer. The folder appears next to your local documents. You double-click, read, and write files in the remote folder as if they were saved on your local hard drive.

---

### (4) Code Examples

#### Mounting a Remote PostgreSQL Table
Let's connect our local server to a remote database:

```sql
-- Step 1: Install the FDW extension
CREATE EXTENSION postgres_fdw;

-- Step 2: Define the remote server connection
CREATE SERVER remote_billing_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host '192.168.1.100', port '5432', dbname 'billing_db');

-- Step 3: Define client login credentials mapping
CREATE USER MAPPING FOR local_user
SERVER remote_billing_server
OPTIONS (user 'billing_reader', password 'secure_pwd_123');

-- Step 4: Map the remote table schema locally
CREATE FOREIGN TABLE foreign_invoices (
  id INT,
  amount NUMERIC(10,2),
  customer_id INT
) 
SERVER remote_billing_server
OPTIONS (schema_name 'public', table_name 'invoices');

-- Query the foreign table directly!
SELECT * FROM foreign_invoices WHERE amount > 500.00;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Executing complex joins and aggregates on foreign tables without checking network bandwidth costs

**The mistake:** Joining a local 10-row table with a remote 10-million-row foreign table, assuming it is as fast as local disk lookups.

**Why it's wrong:** To resolve the join, Postgres must fetch the 10 million rows from the remote server over the network TCP connection. 

This consumes massive network bandwidth, triggers high latency, and causes query timeouts.

**Fix: Ensure the query planner can execute "Filter Pushdown". If you filter `WHERE remote_id = 5`, Postgres will send the filter to the remote server first, sending only the 1 matching row over the network. Always verify foreign query plans using `EXPLAIN`.**

---



### Mistake 2: Executing Large Un-Filtered JOINs Over Foreign Tables (Heavy Network Fetch Overhead)

**The mistake:** Executing `SELECT * FROM local_users u JOIN remote_orders_fdw o ON u.id = o.user_id;` without predicate pushdown.

**Why it's wrong:** If predicate pushdown is not supported, PostgreSQL fetches the ENTIRE remote table over the network to perform the join locally! Filter remote queries explicitly.

*Incorrect:*
```sql
SELECT * FROM local_users JOIN remote_orders_fdw; -- ❌ Fetches entire remote table over network!
```

*Fix:*
```sql
Filter remote tables explicitly or use materialized views
```

### Mistake 3: Storing Un-Encrypted Foreign Server User Passwords in User Mappings

**The mistake:** Creating user mapping `CREATE USER MAPPING FOR local_user SERVER remote_db OPTIONS (user 'app', password 'secret');`.

**Why it's wrong:** User mapping options store remote database credentials in `pg_user_mapping`. Ensure `pg_user_mapping` access is restricted to database administrators.

*Incorrect:*
```sql
// Exposing plaintext passwords in user mappings
```

*Fix:*
```sql
Restrict pg_user_mappings catalog permissions or use SSL certificates
```

## 5. Practice Exercises

### Exercise 1: Querying Remote PostgreSQL Databases with `postgres_fdw`

**Scenario:**
Configure `postgres_fdw` to connect local database `analytics` to remote database `production_db`.

**Requirements:**
1. Execute `CREATE EXTENSION postgres_fdw`, `CREATE SERVER`, `CREATE USER MAPPING`, `IMPORT FOREIGN SCHEMA`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE EXTENSION IF NOT EXISTS postgres_fdw;
> 
> CREATE SERVER prod_server 
> FOREIGN DATA WRAPPER postgres_fdw 
> OPTIONS (host 'db.prod.example.com', port '5432', dbname 'production_db');
> 
> CREATE USER MAPPING FOR CURRENT_USER 
> SERVER prod_server 
> OPTIONS (user 'app_reader', password 'SecretPass123!');
> 
> IMPORT FOREIGN SCHEMA public 
> FROM SERVER prod_server 
> INTO public;
> ```
>
> #### Technical Explanation
>
> 1. Foreign Data Wrappers (FDW) implement ANSI SQL/MED (Management of External Data) specifications.
> 2. `postgres_fdw` allows local queries to read and join tables residing on remote PostgreSQL servers transparently.
> 3. Enables federated multi-database querying.

---

### Exercise 2: Querying Remote Foreign Tables in SQL

**Scenario:**
Execute a local `SELECT` query joining local table `reports` with remote foreign table `orders`.

**Requirements:**
1. Execute `SELECT * FROM orders` over foreign table.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   r.report_name, 
>   o.id AS remote_order_id, 
>   o.total_cents 
> FROM local_reports AS r 
> JOIN orders AS o ON r.order_id = o.id;
> ```
>
> #### Technical Explanation
>
> 1. Foreign tables behave like standard local tables in SQL queries.
> 2. `postgres_fdw` pushes filtering predicates (`WHERE`) and projections down to the remote server automatically (`Predicate Pushdown`).
> 3. Reduces network data transfer overhead.

---

### Exercise 3: Cross-Database Querying Limits and Performance

**Scenario:**
Explain why heavy multi-table joins across foreign tables can suffer from network latency compared to local joins.

**Requirements:**
1. Contrast local memory heap scans vs TCP network socket latency.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> FDW Performance Analysis:
> - Local Joins: Read from shared_buffers RAM in nanoseconds.
> - FDW Remote Joins: Fetch data over TCP network sockets in milliseconds.
> Optimization: Use 'IMPORT FOREIGN SCHEMA' selectively; use Materialized Views to cache remote FDW data locally for analytics!
> ```
>
> #### Technical Explanation
>
> 1. FDW queries depend on remote server CPU and network link throughput.
> 2. Materializing FDW query results into a local Materialized View eliminates network latency for reporting dashboards.
> 3. Federated database architecture pattern.

---



## 6. Related Terms
- [Extensions (`CREATE EXTENSION`)](extensions.md) — The packaging system.
- [Table (Relation)](../level_01/table.md) — The base data grid.

---

## 7. Key Takeaways
- Foreign Data Wrappers (FDW) allow querying remote data sources in SQL.
- Mounts external databases, CSV files, or APIs as local tables.
- `postgres_fdw` is the built-in extension used to link separate Postgres servers.
- Setup steps: install extension, create server link, map users, create foreign tables.
- Network data transfers between servers introduce latency.
- Ensure filter pushdowns are active to prevent streaming entire tables over TCP.
- Enables clean cross-database joins without writing complex backend server code.
