# Authentication Architecture (Root, Namespace, Database, Record)

> **Level 8 — Authentication, Permissions & Security**
> SurrealDB's four-tier authentication hierarchy: Root (superuser), Namespace (manages DBs in a namespace), Database (manages a single DB), and Record (end-user authenticated as a specific table record).

---

## 1. Prerequisites
- [Namespace & Database](../level_01/namespace_database.md) — The logical container hierarchy.
- [Connection Credentials](../level_01/connection_credentials.md) — Authentication token basics.

---

## 2. Term Category
- **Security & Architecture**

---

## 3. Environment Context
- **SurrealDB Core Engine** (Evaluated during session connection and statement execution across HTTP, WebSocket, or SDK sessions).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Using Root Credentials in Web Client Applications

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

### Mistake 5: Forgetting Namespace or Database Scope Contexts in Access Tokens

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

## 6. Practice Exercises

### Exercise 1: Identify Auth Tiers
Categorize the following credentials into Root, Namespace, Database, or Record level:
1. A service account deploying schema migrations to `NS app DB prod`.
2. A web user logging into `user:alice`.
3. A cluster admin creating a new Namespace.

> [!check]- Answer
> - Admin users managing schemas belong to Database/Namespace level.
> - Individual end-users logging in via app UI belong to Record level.

---



### Exercise 2: Auth Architecture Level Comparison

**Problem:** List 3 authentication levels in SurrealDB (Root level, Namespace level, Database/Record Access level).

**Expected output:**
> [!check]- Answer
> ```text
> Root level, Namespace level, Database/Record Access level
> ```
> ```text
> Root level, Namespace level, Database/Record Access level
> ```
>
> **Explanation:** SurrealDB enforces multi-tenant authentication at root, namespace, and database levels.

---

### Exercise 3: Direct Client-to-Database Security Model

**Problem:** How does SurrealDB authorize direct web browser query access safely? (Via SCOPE/ACCESS definitions and table PERMISSIONS).

**Expected output:**
> [!check]- Answer
> ```text
> Through RECORD access authentication tokens evaluated against SurrealQL PERMISSIONS rules
> ```
> ```text
> Through RECORD access authentication tokens evaluated against SurrealQL PERMISSIONS rules
> ```
>
> **Explanation:** SCOPE/ACCESS tokens inject `$auth` identity context into table `PERMISSIONS` rules.

## 7. Related Terms
- [System Users (`DEFINE USER`)](define_user.md) — Creating Root, NS, and DB admins.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Authenticating end-users as table records.
- [Direct Browser-to-Database Architecture](browser_to_db.md) — Architectural pattern for client-side connections.

---

## 8. Key Takeaways
- SurrealDB features a 4-tier auth hierarchy: Root, Namespace, Database, and Record.
- System Users (Root/NS/DB) are designed for admins and backend infrastructure.
- Record Access is designed for end-users, enabling row-level security and direct client connectivity.
