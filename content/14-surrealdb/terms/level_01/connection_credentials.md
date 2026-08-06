# Connection Credentials (`USE NS ... DB ...`)

> **Level 1 — What Is SurrealDB?**
> The SurrealQL statements and session parameters used to authenticate a client connection and specify the target Namespace (`USE NS`) and Database (`USE DB`) query scopes.

---

## 1. Prerequisites

- [Namespace & Database](namespace_database.md) — The logical containers targeted.
- [SurrealDB CLI (`surreal sql`)](surreal_cli.md) — The executing client environment.

---

## 2. Term Category


**Authentication & Permissions (connection authentication credentials)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In other database systems, you define your target database and credentials inside the connection string (for example, `mongodb://user:pass@host:27017/dbname`). 

Once the connection is established, the target database is locked for that client session.

In SurrealDB, connection sessions are flexible. 

A single connection (especially over WebSockets) can dynamically change its namespace and database context at runtime. 

To manage this dynamic scoping, SurrealDB supports both **Connection Parameters** (declared when establishing the connection) and **SurrealQL Context Statements** (`USE NS` and `USE DB`).

By writing these commands directly in your query scripts, you ensure the queries target the correct client tenant database, regardless of the default connection configuration.

---

### (2) Session Scoping Statements

#### 1. `USE NS <namespace_name>;`
Instructs the database engine to route subsequent queries to the specified namespace.
-   *Restriction:* Fails if the authenticated user role does not have privileges for that namespace.

#### 2. `USE DB <database_name>;`
Instructs the database engine to route subsequent queries to the specified database (within the active namespace).

#### 3. Combined syntax: `USE NS <ns> DB <db>;`
Switches both contexts in a single command.

---

### (3) Security Access Scopes
Your connection credentials determine how far you can switch scopes:
-   **Root Admin:** Can execute `USE NS` and `USE DB` to target any namespace and database in the entire system.
-   **Namespace Admin:** Can run `USE DB` within their assigned namespace, but is blocked from running `USE NS` to switch to other tenants' namespaces.
-   **Database Admin:** Locked strictly to their single database scope.

---

### (4) Reality Metaphor (Security Card Elevators)
Imagine entering a secure corporate headquarters building:
-   **Connection Parameters:** Handing your ID badge to the lobby guard (authentication credentials). They swipe your card and assign you access rights.
-   **The `USE` Statements:** Pressing buttons in the elevator:
    -   **`USE NS` (Floor select):** Pressing the button for Floor 3 (Tenant Namespace A). 
    -   **`USE DB` (Room select):** Opening the Finance Office door (Database Finance) once you step off the elevator.
    -   If a Guest badge attempts to press the button for Floor 4 (Tenant Namespace B), the elevator elevator controls lock up, and access is denied.

---

### (5) Code Examples

#### Scoping Connections in SurrealQL Scripts
When importing schema definition files, it is best practice to declare the target scopes at the top of the file:

```sql
-- 1. Declare the active scope before creating tables
USE NS saas_firm_x DB billing;

-- 2. Create the invoicing table in 'saas_firm_x.billing' database
DEFINE TABLE invoice SCHEMAFULL;
DEFINE FIELD total ON invoice TYPE decimal;

-- 3. Switch database context to initialize telemetry tables
USE DB logging;

-- 4. Create the logs table in 'saas_firm_x.logging' database
DEFINE TABLE connections SCHEMALESS;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on the client SDK connection string credentials to select the database, without calling the '.use()' method in application startup, causing query scope crashes

**The mistake:** Initializing the JavaScript SDK using `new Surreal('ws://localhost:8000')` and running queries immediately, assuming that because you passed user credentials, the database knows which tenant database you want.

**Why it's wrong:** Unlike standard SQL drivers, SurrealDB connections initialize in a null namespace/database context. 

If you do not explicitly select the namespace and database via the SDK's `.use()` method, queries will fail with namespace missing exceptions.

**Fix: Always call the `.use({ namespace, database })` method immediately after establishing your client connection before executing queries in your application code.**

```javascript
// CORRECT SDK PATTERN
const db = new Surreal();
await db.connect('ws://localhost:8000/rpc');
await db.signin({ user: "root", pass: "root" });
await db.use({ namespace: 'app', database: 'prod' }); // MANDATORY TARGET SELECTOR!
const records = await db.select('user');
```

---



### Mistake 2: Using Root Administrator Credentials in Client Web Applications

**The mistake:** Embedding root credentials `--user root --pass root` inside client-side web browser SDK connections.

**Why it's wrong:** Root credentials bypass all database permissions, scope restrictions, and row-level security policies, giving any web client full administrative access to drop databases or modify system schemas.

*Incorrect:*
```surrealql
// Web Client Connection
const db = new Surreal();
await db.signin({ user: "root", pass: "root" }); // ❌ Exposes root admin credentials to clients!
```

*Fix:*
```surrealql
// Web Client Connection
const db = new Surreal();
await db.signin({ access: "user", db: "test", ns: "test", username: "alice", pass: "123" }); // Scope/Access user signin
```

### Mistake 3: Forgetting to Specify Namespace and Database in Signin Credentials

**The mistake:** Signing in with user credentials without providing `ns` and `db` fields in authentication payloads.

**Why it's wrong:** User access credentials in SurrealDB belong to specific Namespace or Database auth scopes. Omitting `ns` or `db` causes authentication failure.

*Incorrect:*
```surrealql
await db.signin({ username: "alice", pass: "123" }); // ❌ Missing ns and db parameters
```

*Fix:*
```surrealql
await db.signin({ access: "user_access", ns: "production", db: "main", username: "alice", pass: "123" });
```

## 5. Practice Exercises

### Exercise 1: Multi-Tenant Session Scope Target

**Scenario:**
You are writing an administrative CLI migration script that must target the `company_hq` namespace and the `production` database, create an active user record `user:john`, and then switch the active database context to `archive` to record the user's archived state.

**Requirements:**
1. Target namespace `company_hq` and database `production` using SurrealQL scope configuration.
2. Insert record `user:john` with `status = "active"`.
3. Switch database scope context to `archive`.
4. Insert record `user:john` with `status = "archived"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> USE NS company_hq DB production;
> CREATE user:john SET status = "active";
> 
> USE DB archive;
> CREATE user:john SET status = "archived";
> ```
>
> #### Technical Explanation
>
> 1. The `USE` keyword sets the current session's namespace (`NS`) and database (`DB`) context in SurrealDB.
> 2. Specifying both `NS` and `DB` on the first call establishes full tenant target isolation.
> 3. Switching only `DB` on subsequent calls maintains the active `NS` scope while altering database context.
> 
---

### Exercise 2: Scoped Record Access Signin Payload

**Scenario:**
A web client application using the SurrealDB JavaScript SDK needs to authenticate a regular user against a predefined RECORD access method `user_access` residing within namespace `main` and database `app`.

**Requirements:**
1. Construct the JavaScript client signin payload object.
2. Include the target `access` method name, namespace `ns`, database `db`, and user credentials.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const signinPayload = {
>   access: "user_access",
>   ns: "main",
>   db: "app",
>   username: "alice",
>   pass: "SecretPass123!"
> };
> 
> console.log("Configured scoped signin payload:", signinPayload);
> ```
>
> #### Technical Explanation
>
> 1. RECORD access authentication requires specifying the exact `ns` and `db` targets where the user record exists.
> 2. The `access` field targets SurrealDB 2.x `DEFINE ACCESS` definitions (replacing legacy 1.x `DEFINE SCOPE`).
> 3. Scoped user credentials authenticate clients with row-level security permissions without granting root database access.
> 
---

### Exercise 3: Database Authentication Hierarchy Classification

**Scenario:**
A security auditor is reviewing your SurrealDB deployment access architecture and requires a breakdown of SurrealDB's multi-level authentication hierarchy and role scopes.

**Requirements:**
1. List the 3 primary levels of authentication credentials supported in SurrealDB.
2. Briefly describe the scope of authority for each level.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> - Root Level: Global cluster administrator credentials with total access across all namespaces and databases.
> - Namespace Level: Administrative credentials restricted to managing databases and schemas within a single namespace.
> - Database / Access Scope Level: Scoped credentials for end-user applications restricted by table and row-level PERMISSIONS.
> ```
>
> #### Technical Explanation
>
> 1. Root credentials manage engine-wide configuration, storage backends, and namespace creation.
> 2. Namespace credentials enable multi-tenant isolation, allowing tenant admins to manage their own databases safely.
> 3. Database/Access Scope credentials authenticate web and mobile clients directly, enforcing SurrealDB's built-in security model.
> 
---



## 6. Related Terms

- [Namespace & Database](namespace_database.md) — The logical containers targeted.
- [SurrealDB CLI (`surreal sql`)](surreal_cli.md) — The executing client environment.
- [SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`)](../level_10/sdk_connection.md) — Related concept: SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`).

---

## 7. Key Takeaways
- Connection credentials authenticate and scope database client sessions.
- `USE NS` targets the namespace; `USE DB` targets the database.
- A single WebSocket connection can switch scopes dynamically at runtime.
- Scope switching is restricted by user access roles (Root vs. Namespace admins).
- Always call `USE NS ... DB ...` at the top of script files to guarantee targets.
- Client SDKs must call `.use()` immediately after connecting to prevent query crashes.
