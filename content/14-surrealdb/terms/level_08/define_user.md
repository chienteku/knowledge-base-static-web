# System Users (`DEFINE USER`)

> **Level 8 — Authentication, Permissions & Security**
> Creating administrative system users at Root, Namespace, or Database levels to manage database access, run migrations, and authenticate backend services.

---

## 1. Prerequisites
- [Authentication Architecture](auth_architecture.md) — The 4-tier security hierarchy.
- [Namespace & Database](../level_01/namespace_database.md) — Logical database boundary isolation.

---

## 2. Term Category
- **Database Command / Security**

---

## 3. Environment Context
- **SurrealDB Core Engine** (Executed by administrators via CLI or migration tools to configure system roles).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In database management, administrative tasks (creating tables, applying migrations, taking backups) must be strictly separated from application end-user traffic. In PostgreSQL, this is handled via `CREATE ROLE` and `GRANT`. In MongoDB, it is handled via `db.createUser()`.

SurrealDB provides the `DEFINE USER` statement to create administrative accounts scoped to specific levels of the authentication hierarchy:
- `DEFINE USER ... ON ROOT`: Grants cluster-wide administrative rights.
- `DEFINE USER ... ON NAMESPACE`: Grants administrative rights across all databases inside one namespace.
- `DEFINE USER ... ON DATABASE`: Grants administrative rights to a single database instance.

### (2) Reality Metaphor
Think of a hotel security system:
- `ON ROOT`: Master key given to the General Manager, opening every room in the entire hotel chain.
- `ON NAMESPACE`: Keycard given to the Hotel Branch Manager, opening every room in the Chicago location.
- `ON DATABASE`: Keycard given to the Housekeeping Supervisor, opening all guest rooms on Floor 3.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Create a database-level administrator for backend migration scripts
DEFINE USER db_admin ON DATABASE PASSHASH "$argon2id$v=19$m=19456,t=2,p=1$..." ROLES OWNER;
```

#### Fuller Example
```surrealql
-- Define a Namespace-level user for CI/CD pipeline automation
DEFINE USER cicd_bot ON NAMESPACE PASSWORD "SecurePipelinePass2026!" ROLES OWNER;

-- Define a Database-level user with read-only view access for reporting
DEFINE USER analytics_reporter ON DATABASE PASSWORD "ReportingPass456!" ROLES VIEWER;

-- List all defined users on the current database
INFO FOR DB;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using Plaintext PASS When Versioning Schema Files

**The mistake:** Committing plaintext passwords in `DEFINE USER ... PASSWORD "secret"` migration files in Git repositories.

**Why it's wrong:** Plaintext passwords committed to source control create high-severity security vulnerabilities.

*Incorrect:*
```surrealql
-- In schema.surql file committed to Git
DEFINE USER app_backend ON DATABASE PASSWORD "MySecretPassword123" ROLES OWNER;
```

*Fix:*
```surrealql
-- Use PASSHASH with pre-hashed Argon2 string or environment variable injection
DEFINE USER app_backend ON DATABASE PASSHASH "$argon2id$v=19$m=19456,t=2,p=1$..." ROLES OWNER;
```

---



### Mistake 2: Confusing System `DEFINE USER` with Application Record Users (`user` Table)

**The mistake:** Using `DEFINE USER` to register end-user application clients in a web app.

**Why it's wrong:** `DEFINE USER` creates database system administrators (Root, NS, DB users). Application end-users should be records in a `user` table managed via `DEFINE ACCESS ... TYPE RECORD`.

*Incorrect:*
```surrealql
-- Creating app end-user as DB admin:
DEFINE USER john ON DATABASE PASSWORD "123" ROLES OWNER; // ❌ Exposes admin database access!
```

*Fix:*
```surrealql
CREATE user:john SET email = "john@example.com"; // Application end-user record
```

### Mistake 3: Assigning Inappropriate System Roles to Database Users

**The mistake:** Assigning `ROLES OWNER` to read-only database metrics users.

**Why it's wrong:** `OWNER` role grants full read/write/schema alteration rights. Use `ROLES VIEWER` or `ROLES EDITOR` for restricted system users.

*Incorrect:*
```surrealql
DEFINE USER metrics ON DATABASE PASSWORD "pass" ROLES OWNER; // ❌ Excessive privileges!
```

*Fix:*
```surrealql
DEFINE USER metrics ON DATABASE PASSWORD "pass" ROLES VIEWER;
```



### Mistake 4: Confusing System `DEFINE USER` with Application Record Users (`user` Table)

**The mistake:** Using `DEFINE USER` to register end-user application clients in a web app.

**Why it's wrong:** `DEFINE USER` creates database system administrators (Root, NS, DB users). Application end-users should be records in a `user` table managed via `DEFINE ACCESS ... TYPE RECORD`.

*Incorrect:*
```surrealql
-- Creating app end-user as DB admin:
DEFINE USER john ON DATABASE PASSWORD "123" ROLES OWNER; // ❌ Exposes admin database access!
```

*Fix:*
```surrealql
CREATE user:john SET email = "john@example.com"; // Application end-user record
```

### Mistake 5: Assigning Inappropriate System Roles to Database Users

**The mistake:** Assigning `ROLES OWNER` to read-only database metrics users.

**Why it's wrong:** `OWNER` role grants full read/write/schema alteration rights. Use `ROLES VIEWER` or `ROLES EDITOR` for restricted system users.

*Incorrect:*
```surrealql
DEFINE USER metrics ON DATABASE PASSWORD "pass" ROLES OWNER; // ❌ Excessive privileges!
```

*Fix:*
```surrealql
DEFINE USER metrics ON DATABASE PASSWORD "pass" ROLES VIEWER;
```

## 6. Practice Exercises

### Exercise 1: Define a DB Viewer
Write a `DEFINE USER` statement that creates a database user named `support_agent` on the database level with the `VIEWER` role.

> [!check]- Answer
> - Use `DEFINE USER support_agent ON DATABASE`.
> - Specify `PASSWORD` or `PASSHASH` and `ROLES VIEWER`.

---



### Exercise 2: Defining Database Editor System User

**Problem:** Define database system user `dev_editor` on database `main` with password `"pass123"` and role `EDITOR`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE USER dev_editor ON DATABASE PASSWORD "pass123" ROLES EDITOR;
> ```
> ```surrealql
> DEFINE USER dev_editor ON DATABASE PASSWORD "pass123" ROLES EDITOR;
> ```
>
> **Explanation:** `DEFINE USER` creates system database administrators with specified role privileges.

---

### Exercise 3: System User Roles Overview

**Problem:** List 3 built-in system user roles in SurrealDB (`OWNER`, `EDITOR`, `VIEWER`).

**Expected output:**
> [!check]- Answer
> ```text
> OWNER, EDITOR, VIEWER
> ```
> ```text
> OWNER, EDITOR, VIEWER
> ```
>
> **Explanation:** Built-in system roles specify administrative privilege levels.

## 7. Related Terms
- [Authentication Architecture](auth_architecture.md) — The overall 4-tier security system.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Contrast with end-user table authentication.
- [SurrealQL Injection Prevention](injection_prevention.md) — Security best practices.

---

## 8. Key Takeaways
- `DEFINE USER` configures system administrators and backend service roles.
- Users can be scoped `ON ROOT`, `ON NAMESPACE`, or `ON DATABASE`.
- Supported roles include `OWNER` (full DDL/DML access), `EDITOR` (data modification), and `VIEWER` (read-only).
