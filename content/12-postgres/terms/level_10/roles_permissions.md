# Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)

> **Level 10 — Administration, Security & Production**
> PostgreSQL's access control system used to manage database login accounts (`Roles`) and configure their specific read, write, or administrative privileges (`Permissions`) across schemas and tables.

---

## 1. Prerequisites
- [SQL (Structured Query Language)](../level_01/sql.md) — The query language context.

---

## 2. Term Category
- **Database Administration / Security**

---

## 3. Environment Context
- **PostgreSQL Core** (Stored globally inside the database cluster catalog. In PostgreSQL, there is no physical distinction between "users" and "groups"—both are defined as **Roles**).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When you initialize a new PostgreSQL database, the engine creates a default superuser account named `postgres`. 

The superuser can bypass all security controls, drop tables, change server settings, and read raw password files.

In a production environment, connecting your web application or developer tools using the `postgres` superuser is extremely dangerous:
-   If your web application is compromised, the attacker gains full control over your entire database server.
-   If a junior developer connects using the superuser key, they could accidentally run `DROP DATABASE` on the production server.

We designed the **Roles and Permissions** system to enforce the **Principle of Least Privilege**:
1.  You create separate Roles (accounts) for different jobs (e.g. `web_app`, `data_analyst`, `dba_admin`).
2.  You explicitly **`GRANT`** only the minimum permissions required (e.g. the web app only gets `SELECT`, `INSERT`, `UPDATE` on specific tables).
3.  You can **`REVOKE`** privileges immediately if role access is no longer needed.

---

### (2) Users vs. Groups in PostgreSQL
Postgres simplifies user administration: both users and groups are simply **Roles**.
-   **User Role:** A role created with the `LOGIN` privilege and a password.
-   **Group Role:** A role created without the `LOGIN` privilege. You assign user roles as members of group roles, allowing users to inherit permissions (e.g., granting Alice membership in the `marketing` group).

---

### (3) Reality Metaphor
Imagine a high-security research facility building:
-   **Roles:** Individual employees (users) and departments (groups, e.g., the "Chemistry Lab").
-   **Inheritance:** If Alice joins the Chemistry Lab group, her badge card automatically inherits access to all research rooms assigned to that lab.
-   **GRANT/REVOKE:** The security manager **grants** Alice access to the lunchroom badge reader. If she changes departments, the manager **revokes** her Chemistry Lab badge access.

---

### (4) Code Examples

#### Creating a Read-Only Analyst Role
Let's create a read-only role that can select rows but cannot write or delete:

```sql
-- Step 1: Create a role that can login (User Role)
CREATE ROLE analyst_bob WITH LOGIN PASSWORD 'bob_secure_pwd';

-- Step 2: Grant read-only access to Bob
-- (Requires granting schema usage first, then table permissions)
GRANT USAGE ON SCHEMA public TO analyst_bob;
GRANT SELECT ON TABLE customers TO analyst_bob;

-- Verify Bob's access
-- If Bob tries to write, Postgres blocks it:
-- INSERT INTO customers VALUES (...);
-- ERROR: permission denied for table customers
```

#### Revoking Permissions
```sql
-- Revoke Bob's read access on the table
REVOKE SELECT ON TABLE customers FROM analyst_bob;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Connecting your live web application to the production database using the default 'postgres' superuser role

**The mistake:** Setting the environment variable `DATABASE_URL=postgres://postgres:password@host/db` inside a production web server.

**Why it's wrong:** If your web application has an SQL Injection vulnerability (which we will learn in Term #128), an attacker can exploit the superuser privileges to read system catalogs, fetch other databases on the server, write files to the database server's OS, or wipe out the hard drive.

**Fix: Create a dedicated, non-superuser role (e.g. `app_user`) specifically for the web application. Only grant DML permissions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on the specific schemas the application needs.**

---



### Mistake 2: Connecting Web Client Applications Using the `postgres` Superuser Account

**The mistake:** Configuring app connection pool string with `postgresql://postgres:pass@localhost:5432/app`.

**Why it's wrong:** The `postgres` superuser account bypasses ALL permission checks, row-level security policies, and can execute file system commands! Create dedicated low-privilege roles for applications.

*Incorrect:*
```sql
postgresql://postgres:pass@localhost:5432/app -- 💥 Excessive superuser privilege!
```

*Fix:*
```sql
CREATE ROLE app_user LOGIN PASSWORD 'secret'; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
```

### Mistake 3: Forgetting `GRANT USAGE ON SCHEMA` When Granting Table Permissions

**The mistake:** Executing `GRANT SELECT ON users TO app_role;` without granting `USAGE` on schema `public`.

**Why it's wrong:** Roles MUST have `USAGE` privilege on the containing schema namespace! Without `USAGE ON SCHEMA`, table queries fail with permission denied error.

*Incorrect:*
```sql
GRANT SELECT ON users TO app_role; -- ❌ Fails if app_role lacks USAGE on schema!
```

*Fix:*
```sql
GRANT USAGE ON SCHEMA public TO app_role;
GRANT SELECT ON users TO app_role;
```

## 6. Practice Exercises

### Exercise 1: Read-Write Role Setup

**Problem:** You are setting up a backend analytics service. Write the SQL queries to:
1.  Create a login role named `service_writer` with the password `'write_secure_123'`.
2.  Grant the role permissions to read (`SELECT`) and write (`INSERT`, `UPDATE`) data on a table named `reports`.

**Expected output:**
```sql
CREATE ROLE service_writer WITH LOGIN PASSWORD 'write_secure_123';

GRANT USAGE ON SCHEMA public TO service_writer;
GRANT SELECT, INSERT, UPDATE ON TABLE reports TO service_writer;
```

> [!check]- Answer
> - Remember to grant schema `USAGE` permission first, otherwise table lookups fail.
> - Chain multiple privileges in the `GRANT` statement separating them with commas.

---



### Exercise 2: Creating Read-Only Application Role

**Problem:** Create role `read_only_role` with login password and grant `SELECT` on all tables in schema `public`.

**Expected output:**
```text
CREATE ROLE read_only_role WITH LOGIN PASSWORD 'pass'; GRANT USAGE ON SCHEMA public TO read_only_role; GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only_role;
```

> [!check]- Answer
> ```sql
> CREATE ROLE read_only_role WITH LOGIN PASSWORD 'pass';
> GRANT USAGE ON SCHEMA public TO read_only_role;
> GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only_role;
> ```
>
> **Explanation:** Roles combine user identity and permission grouping in PostgreSQL.

### Exercise 3: Revoking Permissions

**Problem:** Revoke `DELETE` permission on table `orders` from role `app_user`.

**Expected output:**
```text
REVOKE DELETE ON orders FROM app_user;
```

> [!check]- Answer
> ```sql
> REVOKE DELETE ON orders FROM app_user;
> ```
>
> **Explanation:** `REVOKE permission ON table FROM role` strips specific privileges.

## 7. Related Terms
- [`pg_hba.conf` (Host-Based Authentication)](pg_hba_conf.md) — Remote connection security configurations.
- [Row-Level Security (RLS)](row_level_security.md) — Finer security filters.

---

## 8. Key Takeaways
- Roles are database accounts that manage login credentials and permissions.
- PostgreSQL unified users and groups into the single `ROLE` concept.
- `GRANT` assigns schema, table, or database permissions to roles.
- `REVOKE` removes assigned privileges from target roles.
- Non-login roles act as groups; login roles inherit group privileges.
- **Security Rule:** Never run production web servers using the `postgres` superuser.
