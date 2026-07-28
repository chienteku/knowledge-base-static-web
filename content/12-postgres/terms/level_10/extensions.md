# Extensions (`CREATE EXTENSION`)

> **Level 10 — Administration, Security & Production**
> PostgreSQL's modular package manager system used to install and run third-party or built-in software modules (`Extensions`) that add new data types, SQL functions, index types, or monitoring views to the database.

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The query context.
- [UUID Type](../level_06/uuid_type.md) — Custom types historically enabled by extensions.

---

## 2. Term Category
- **PostgreSQL Core Engine**

---

## 3. Environment Context
- **PostgreSQL Core** (Requires superuser privileges (`SUPERUSER`) to install because extensions run compiled C-code modules directly inside the host operating system server memory space).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational database engines are often bloated because developers demand hundreds of specialized features:
-   Geospatial map routing coordinates (`PostGIS`).
-   Cryptographic hashing algorithms (`pgcrypto`).
-   Fuzzy text string matching algorithms (`pg_trgm`).
-   Query performance statistics views (`pg_stat_statements`).

If the core PostgreSQL team tried to compile all of these features directly into the main database engine binary file:
-   The software would grow massive and slow.
-   It would consume excessive memory.
-   Debugging would be difficult.

We designed the **Extensions** framework to keep the PostgreSQL core engine lightweight, fast, and modular. 

Postgres acts as an open platform. 

If you need geospatial coordinates or custom cryptos, you don't rewrite the database code. 

You simply load a pre-compiled **Extension** module on-the-fly using a single SQL command:

`CREATE EXTENSION postgis;`

---

### (2) Common Production Extensions
Postgres ships with over 40 official "contrib" extensions available in its default packages:

-   **`pg_stat_statements`:** The most critical monitoring tool. Tracks metrics (calls, total time, rows) for every SQL query run on the server to help you locate slow endpoints.
-   **`uuid-ossp`:** Provides functions to generate Version 4 UUIDs (legacy, modern versions use built-in generators).
-   **`pgcrypto`:** Provides hashing and encryption functions (e.g. encrypting data cells using AES).
-   **`pg_trgm` (Trigram):** Speeds up substring searches (like `LIKE '%keyword%'`) using 3-character text string splitting indexes.

---

### (3) Reality Metaphor
Imagine a smartphone:
-   Out of the box, the phone comes with basic, essential default apps: Phone, Clock, and Calculator (the core PostgreSQL engine).
-   **Extensions:** If you want to use the phone as a GPS navigation device, you open the **App Store** and download the Google Maps application (`PostGIS`). The app instantly extends the capabilities of your phone without requiring the hardware manufacturer to rebuild the device.

---

### (4) Code Examples

#### Installing and Auditing Extensions
```sql
-- 1. Check all available extensions on the server
SELECT name, default_version, description 
FROM pg_available_extensions 
ORDER BY name;

-- 2. Install the trigram text search extension
CREATE EXTENSION pg_trgm;

-- 3. Verify installed extensions in the current database
SELECT extname, extversion FROM pg_extension;
```

#### Uninstalling Extensions
```sql
-- Remove the extension and all its associated functions/types
DROP EXTENSION pg_trgm;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to install extensions on a managed cloud database using a standard non-superuser role

**The mistake:** Connecting your web app role and executing `CREATE EXTENSION pgcrypto;`, and getting a permission denied crash.

**Why it's wrong:** Installing extensions executes raw compiled binary code on the host operating system. 

To prevent security exploits or memory hijacking, PostgreSQL restricts `CREATE EXTENSION` strictly to **Superusers**. 

On managed cloud platforms (like AWS RDS), you are not granted raw superuser status.

**Fix: On managed services, use the platform's control console to enable extensions, or connect using the database's administrative master role (e.g. `rds_superuser` on AWS) to run the DDL query.**

---



### Mistake 2: Creating Extensions Without `IF NOT EXISTS` Guards

**The mistake:** Executing `CREATE EXTENSION pg_trgm;` in automated initialization scripts.

**Why it's wrong:** If `pg_trgm` extension is already installed, execution fails with error `extension "pg_trgm" already exists`. Add `IF NOT EXISTS`.

*Incorrect:*
```sql
CREATE EXTENSION pg_trgm; -- Fails if extension exists
```

*Fix:*
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Mistake 3: Installing Un-Trusted Extensions in Custom Schemas Without Security Review

**The mistake:** Installing third-party C-language extensions in production without auditing superuser requirements.

**Why it's wrong:** C-language extensions execute natively inside the PostgreSQL daemon memory space! A bug in a C extension can crash the database daemon or breach security. Use trusted extensions.

*Incorrect:*
```sql
// Installing unverified C-based extension binaries
```

*Fix:*
```sql
Audit extension security and superuser permissions before deployment
```

## 6. Practice Exercises

### Exercise 1: Query Stat Monitoring Activation

**Problem:** You are diagnosing a slow production database. You want to install the standard queries stats collector extension named `pg_stat_statements`. Write the SQL query to install this module.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE EXTENSION pg_stat_statements;
> ```
> - Use the `CREATE EXTENSION` keyword.
> - Specify the exact extension name `pg_stat_statements`.

---



### Exercise 2: Installing Extensions Safely

**Problem:** Install `pg_trgm` and `uuid-ossp` extensions safely using `CREATE EXTENSION IF NOT EXISTS`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
> ```
> ```sql
> CREATE EXTENSION IF NOT EXISTS pg_trgm;
> CREATE EXTENSION IF NOT EXISTS 'uuid-ossp';
> ```
>
> **Explanation:** `CREATE EXTENSION IF NOT EXISTS` installs extensions idempotently.

---

### Exercise 3: Inspecting Installed Extensions

**Problem:** Query installed database extensions from `pg_extension` system catalog.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT extname, extversion FROM pg_extension;
> ```
> ```sql
> SELECT extname, extversion FROM pg_extension;
> ```
>
> **Explanation:** `pg_extension` catalog lists active database extension names and installed versions.

## 7. Related Terms
- [`pg_stat_statements` / Monitoring](monitoring.md) — The monitoring metrics extension.
- [UUID Type](../level_06/uuid_type.md) — Custom types historically enabled by extensions.

---

## 8. Key Takeaways
- PostgreSQL extensions add custom functions, types, and indexes to the engine.
- Keeps the database core lightweight and modular.
- Shipped with over 40 official pre-compiled "contrib" modules.
- `pg_stat_statements` is the industry-standard slow query monitoring tool.
- Requires superuser role privileges to install due to operating system access.
- Managed cloud databases require using administrative roles to enable modules.
- Uninstall extensions cleanly using the `DROP EXTENSION` statement.
