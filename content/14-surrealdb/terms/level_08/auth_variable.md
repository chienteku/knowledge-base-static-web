# `$auth` Variable

> **Level 8 — Authentication, Permissions & Security**
> A built-in system variable containing the full record of the currently authenticated Record user, available in permissions clauses, query logic, and default expressions.

---

## 1. Prerequisites

- [Authentication Architecture (Root, Namespace, Database, Record)](auth_architecture.md) — The 4-tier security hierarchy.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Record authentication.

---

## 2. Term Category


**Authentication & Permissions ($auth session record context variable)**: - **System Variable / Security**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When an application end-user executes a query or updates a record, the database engine must know *who* is performing the action. In standard SQL databases, developers must pass the user ID manually in query parameters (`WHERE author_id = $1`).

SurrealDB provides the built-in `$auth` variable. When a client authenticates with a Record Access JWT token, SurrealDB automatically binds `$auth` to the matching record (e.g., `user:tobie`). This variable is globally accessible inside `PERMISSIONS` clauses, `DEFAULT` expressions, `VALUE` expressions, and raw SurrealQL statements, enabling seamless identity checks.

### (2) Reality Metaphor
Think of an electronic keycard issued to an employee:
- The physical badge holds embedded data: employee ID (`user:alice`), department (`engineering`), and security clearance level (`admin`).
- Wherever Alice swipes her badge, the automated doors check `$auth` (`badge.owner` and `badge.department`) to instantly decide whether to open.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Using $auth.id in table permissions
DEFINE TABLE post PERMISSIONS
    FOR update WHERE author = $auth.id;
```

#### Fuller Example
```surrealql
-- 1. Using $auth in DEFAULT value expressions for auto-attributing creators
DEFINE TABLE comment SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create WHERE author = $auth.id;

DEFINE FIELD author ON comment TYPE record<user> DEFAULT $auth.id;
DEFINE FIELD content ON comment TYPE string;

-- 2. Querying data scoped automatically to the current user
SELECT * FROM comment WHERE author = $auth.id;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting $auth to exist during Root/DB Admin Sessions

**The mistake:** Referencing `$auth` inside scripts executed by Root or Database administrative users.

**Why it's wrong:** Administrative users (`DEFINE USER ... ON ROOT/DATABASE`) are system administrators, not table records. When connected as a system admin, `$auth` evaluates to `NONE`.

*Incorrect:*
```surrealql
-- Running as Root user in psql/cli mode
SELECT * FROM post WHERE author = $auth.id; -- $auth.id is NONE!
```

*Fix:*
```surrealql
-- Pass parameter explicitly when executing queries as system admin
SELECT * FROM post WHERE author = $target_user;
```

---



### Mistake 2: Expecting `$auth` Variable to Be Available in Un-Authenticated Root Queries

**The mistake:** Referencing `$auth.id` when executing queries as root administrator.

**Why it's wrong:** `$auth` is populated ONLY when a client connects using a RECORD access scope token! Root administrator sessions do not populate `$auth` (evaluates to `NONE`).

*Incorrect:*
```surrealql
-- Executed as Root admin:
SELECT * FROM article WHERE author = $auth.id; // ❌ $auth is NONE for Root admin!
```

*Fix:*
```surrealql
SELECT * FROM article WHERE author = user:alice;
-- Use $auth in table PERMISSIONS for record scope users
```

### Mistake 3: Attempting Direct Assignment to `$auth` Variable in Queries

**The mistake:** Executing `LET $auth = user:alice;` in client query scripts.

**Why it's wrong:** `$auth` is a read-only system variable injected automatically by the authentication engine upon verifying JWT access tokens. Client scripts cannot reassign `$auth`.

*Incorrect:*
```surrealql
LET $auth = user:alice; // ❌ Cannot reassign system variable $auth!
```

*Fix:*
```surrealql
Authenticate via db.signin() to set $auth context
```





## 5. Practice Exercises

### Exercise 1: Row-Level Owner Isolation with `$auth`

**Scenario:**
Configure a `PERMISSIONS` clause on table `document` ensuring users can only select and update documents where `owner = $auth.id`.

**Requirements:**
1. Define table `document` with `PERMISSIONS FOR select, update WHERE owner = $auth.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE document SCHEMAFULL
>     PERMISSIONS 
>         FOR select, update WHERE owner = $auth.id,
>         FOR create WHERE owner = $auth.id,
>         FOR delete WHERE owner = $auth.id;
> ```
>
> #### Technical Explanation
>
> 1. `$auth` represents the authenticated user's record document during active scoped client sessions.
> 2. `$auth.id` extracts the primary key ID pointer (`user:alice`) of the active user.
> 3. Enforces row-level security automatically across client queries.
> 
---

### Exercise 2: Role-Based Access Control with `$auth.role`

**Scenario:**
Allow document deletion if the active user owns the document (`owner = $auth.id`) OR holds role `"admin"` (`$auth.role = "admin"`).

**Requirements:**
1. Apply `PERMISSIONS FOR delete WHERE owner = $auth.id OR $auth.role = "admin"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE document SCHEMAFULL
>     PERMISSIONS 
>         FOR delete WHERE owner = $auth.id OR $auth.role = "admin";
> ```
>
> #### Technical Explanation
>
> 1. `$auth.role` inspects custom properties stored on the authenticated user record object.
> 2. Combines record ownership checks with role-based access control (RBAC).
> 3. Evaluates security rules dynamically per record mutation.
> 
---

### Exercise 3: Inspecting Active `$auth` Context

**Scenario:**
Execute a test query returning current `$auth.id` and `$auth.email` details during a client session.

**Requirements:**
1. Select `$auth.id`, `$auth.email`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT $auth.id AS current_user_id, $auth.email AS current_user_email;
> ```
>
> #### Technical Explanation
>
> 1. Selecting `$auth` projects the authenticated session's record context.
> 2. Evaluates to `NONE` if the query is executed by an unauthenticated guest connection.
> 3. Enables frontend SDK apps to retrieve current user session state directly.
> 
---





## 6. Related Terms

- [`PERMISSIONS` Clause (Table & Field Level)](permissions_clause.md) — Table and field level security.
- [`$auth.id` vs `$auth.*` (Accessing Auth Record Fields)](auth_record_fields.md) — Accessing specific properties of `$auth`.
- [`$session` / `$token` Variables](session_token_variables.md) — Contextual session metadata.
- [`SIGNUP` / `SIGNIN` Clauses](signup_signin.md) — Related concept: `SIGNUP` / `SIGNIN` Clauses.
- [`$before` / `$after` / `$event` / `$value` Variables (in Events)](../level_09/event_variables.md) — Related concept: `$before` / `$after` / `$event` / `$value` Variables (in Events).

---

## 7. Key Takeaways
- `$auth` represents the authenticated record user (e.g. `user:tobie`).
- Automatically populated when client SDKs connect using Record Access JWT tokens.
- Available in `PERMISSIONS`, `DEFAULT`, `ASSERT`, `VALUE`, and SurrealQL queries.
