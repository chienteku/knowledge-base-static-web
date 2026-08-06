# Authentication Architecture (Root, Namespace, Database, Record)

> **Level 8 — Authentication, Permissions & Security**
> SurrealDB's four-tier authentication hierarchy: Root (superuser), Namespace (manages DBs in a namespace), Database (manages a single DB), and Record (end-user authenticated as a specific table record).

---

## 1. Prerequisites

- [Namespace & Database](../level_01/namespace_database.md) — The logical container hierarchy.
- [Connection Credentials (`USE NS ... DB ...`)](../level_01/connection_credentials.md) — Authentication token basics.

---

## 2. Term Category


**Authentication & Permissions (built-in security & access architecture)**: - **Security & Architecture**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Traditional databases like PostgreSQL or MongoDB implement a **two-tier access model**: administrative database users (roles) connect from backend applications, while end-users are authenticated separately inside backend web servers (Express, Next.js, Django). The database engine itself has no concept of who the end-user is — to PostgreSQL, every web request looks like it came from `app_user`.

SurrealDB introduces a **four-tier authentication architecture**:
1. **Root**: Global superuser managing the entire engine instance.
2. **Namespace**: Administrative user managing databases within a specific tenant namespace.
3. **Database**: Administrative user managing schema, tables, and indexes inside one database.
4. **Record**: End-users authenticated directly as records inside a user table (e.g. `user:tobie`).

By embedding **Record-level authentication** directly into the engine, SurrealDB allows browsers, mobile apps, and edge devices to connect directly to the database securely.

### (2) Reality Metaphor
Think of an office skyscraper:
- **Root**: The building owner with master keys to every floor and system.
- **Namespace**: A company renting Floor 5, with keys to all department offices on that floor.
- **Database**: The IT Department manager on Floor 5, controlling access to the server room inside that department.
- **Record**: An individual employee holding an ID badge (`user:tobie`) that grants access only to their assigned desk and personal locker.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Connecting as Root (System Admin)
USE NS test DB test;

-- Defining a Record Access scope for end-users
DEFINE ACCESS user_auth ON DATABASE TYPE RECORD
    SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $pass) );
```

#### Fuller Example
```surrealql
-- 1. System Level: Define a Database Admin for backend service operations
DEFINE USER backend_service ON DATABASE PASSWORD "StrongServicePassword123!" ROLES OWNER;

-- 2. End-User Level: Define a Record Access for mobile/web app users
DEFINE ACCESS app_user ON DATABASE TYPE RECORD
    AUTHENTICATE {
        -- Validate JWT signature and token claims
        RETURN $token.sub;
    };

-- 3. Querying with $auth variable automatically bound to the logged-in Record
SELECT * FROM document WHERE owner = $auth.id;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Root Credentials in Application SDK Clients

**The mistake:** Hardcoding Root superuser credentials in web clients or public environment variables.

**Why it's wrong:** Root users bypass all table permissions and row-level security, exposing the entire database cluster to potential compromise.

*Incorrect:*
```javascript
// Web Client Code
const db = new Surreal();
await db.connect('http://127.0.0.1:8000');
await db.signin({ user: 'root', pass: 'root' }); // Dangerous!
```

*Fix:*
```javascript
// Web Client Code
const db = new Surreal();
await db.connect('http://127.0.0.1:8000');
await db.signin({ access: 'app_user', email: 'user@example.com', pass: 'secret' }); // Safe Record Auth
```

---



### Mistake 2: Using Root Credentials in Web Client Applications

**The mistake:** Embedding root username and password in web frontend connections.

**Why it's wrong:** Root credentials bypass all permissions and give clients total administrative control over the entire database server. Use RECORD access scopes or JWT tokens for web clients.

*Incorrect:*
```surrealql
// Web Client SDK
await db.signin({ user: "root", pass: "root" }); // ❌ Exposes root credentials!
```

*Fix:*
```surrealql
await db.signin({ access: "user_access", ns: "main", db: "app", username: "alice", pass: "123" });
```

### Mistake 3: Forgetting Namespace or Database Scope Contexts in Access Tokens

**The mistake:** Attempting RECORD scope authentication without specifying target `ns` and `db`.

**Why it's wrong:** Record access scopes belong to specific Namespace or Database boundaries. Omitting `ns` or `db` parameters causes authentication failure.

*Incorrect:*
```surrealql
await db.signin({ access: "user_access", username: "alice", pass: "123" }); // ❌ Missing ns and db!
```

*Fix:*
```surrealql
await db.signin({ access: "user_access", ns: "production", db: "main", username: "alice", pass: "123" });
```





## 5. Practice Exercises

### Exercise 1: Multi-Level Auth Credentials Matrix

**Scenario:**
An infrastructure architect configures database access levels across Root, Namespace, Database, and Record Access scopes in SurrealDB.

**Requirements:**
1. Define a Root-level administrator user `sysadmin`.
2. Define a Namespace-level administrator user `tenant_admin` on namespace `acme`.
3. Define a Database-level Record access method `user_access` on database `app`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- 1. Root Level Administrator
> DEFINE USER sysadmin ON ROOT PASSWORD "RootPass123!" ROLES OWNER;
> 
> -- 2. Namespace Level Administrator
> USE NS acme;
> DEFINE USER tenant_admin ON NAMESPACE PASSWORD "TenantPass123!" ROLES OWNER;
> 
> -- 3. Database Scoped RECORD Access Method
> USE DB app;
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD
>     SIGNIN (SELECT * FROM user WHERE username = $username AND crypto::argon2::compare(password, $pass));
> ```
>
> #### Technical Explanation
>
> 1. Root users hold engine-wide cluster management privileges across all namespaces and databases.
> 2. Namespace users hold administrative authority restricted to databases within their designated tenant namespace.
> 3. Record access scopes authenticate end-user web applications, enforcing row-level security PERMISSIONS.
> 
---

### Exercise 2: Evaluating Direct Web Client Access

**Scenario:**
A web development team evaluates replacing an intermediate Express.js authentication API with direct browser-to-SurrealDB connections.

**Requirements:**
1. Describe how SurrealDB's built-in access methods validate web client credentials.
2. Explain how row-level security `PERMISSIONS` protect data without custom API endpoints.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // Direct SDK client authentication over WebSockets
> import Surreal from "surrealdb";
> 
> const db = new Surreal();
> await db.connect("wss://db.example.com/rpc");
> 
> // Authenticate directly using RECORD access method
> const token = await db.signin({
>   access: "user_access",
>   ns: "acme",
>   db: "app",
>   username: "alice",
>   pass: "Secret123!"
> });
> 
> console.log("Authenticated directly over WebSockets:", token);
> ```
> 
> #### Technical Explanation
>
> 1. Direct WebSocket client connections authenticate against `DEFINE ACCESS` methods defined inside SurrealDB.
> 2. Issues a cryptographically signed JWT token stored by the client SDK.
> 3. Eliminates custom Express/FastAPI authentication middleware boilerplate.
> 
---

### Exercise 3: Restricting Admin Privileges with Roles

**Scenario:**
Define a database-level administrative user `auditor` with read-only viewer roles.

**Requirements:**
1. Write `DEFINE USER auditor ON DATABASE PASSWORD "AuditPass123!" ROLES VIEWER`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE USER auditor ON DATABASE PASSWORD "AuditPass123!" ROLES VIEWER;
> ```
>
> #### Technical Explanation
>
> 1. `ROLES VIEWER` grants read-only schema and record inspection privileges.
> 2. Prevents administrative accounts from executing unintended data mutations.
> 3. Implements the principle of least privilege.
> 
---





## 6. Related Terms

- [System Users (`DEFINE USER`)](define_user.md) — Creating Root, NS, and DB admins.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Authenticating end-users as table records.
- [Direct Browser-to-Database Architecture](browser_to_db.md) — Architectural pattern for client-side connections.
- [JWT Token-Based Auth](jwt_auth.md) — JWT authentication.

---

## 7. Key Takeaways
- SurrealDB features a 4-tier auth hierarchy: Root, Namespace, Database, and Record.
- System Users (Root/NS/DB) are designed for admins and backend infrastructure.
- Record Access is designed for end-users, enabling row-level security and direct client connectivity.
