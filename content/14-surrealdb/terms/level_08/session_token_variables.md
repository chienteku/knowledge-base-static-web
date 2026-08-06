# `$session` / `$token` Variables

> **Level 8 — Authentication, Permissions & Security**
> Built-in variables containing connection session details (`$session`) and JWT token claims (`$token`), enabling advanced security policies, multi-tenant isolation, and audit logging.

---

## 1. Prerequisites

- [`$auth` Variable](auth_variable.md) — The user record variable.
- [JWT Token-Based Auth](jwt_auth.md) — JSON Web Token structure and claims.

---

## 2. Term Category


**Authentication & Permissions ($session and $token session context variables)**: - **System Variables / Security**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While `$auth` represents the database record of the logged-in user, security policies often depend on **connection metadata** (e.g. client IP address, origin header, connection protocol) or **JWT token claims** issued by external identity providers (Auth0, Clerk, Firebase).

SurrealDB provides two specialized system variables:
- **`$session`**: Contains connection metadata provided by the network transport layer:
  - `$session.id`: Unique connection session ID.
  - `$session.ip`: Client IP address.
  - `$session.origin`: HTTP Origin header.
  - `$session.ns`: Active Namespace.
  - `$session.db`: Active Database.
- **`$token`**: Contains all claims decoded from the incoming JWT token:
  - `$token.sub`: Subject (User ID).
  - `$token.iss`: Token Issuer.
  - `$token.exp`: Expiration timestamp.
  - `$token.custom_claim`: Any custom payload fields included in the JWT.

### (2) Reality Metaphor
Imagine a visitor checking into a secure corporate building:
- **`$auth`**: The visitor's verified employee profile in the company database.
- **`$session`**: The security camera log recording which physical door they entered through, what time they arrived, and their entry IP/location.
- **`$token`**: The temporary paper pass printed at the front desk, stamped with an expiration time (`$token.exp`) and authorized floor clearance numbers (`$token.floors`).

### (3) Code Examples

#### Short Snippet
```surrealql
-- Using $token claims and $session metadata in permissions
DEFINE TABLE audit_log PERMISSIONS
    FOR create WHERE $session.ip != NONE AND $token.iss = 'https://auth0.com/';
```

#### Fuller Example
```surrealql
-- 1. Audit trail logging using $session and $token
DEFINE EVENT log_write ON TABLE document WHEN $event = 'UPDATE' THEN {
    CREATE audit_trail SET
        doc_id = $after.id,
        user_id = $auth.id,
        user_ip = $session.ip,
        jwt_issuer = $token.iss,
        timestamp = time::now();
};

-- 2. Restricting write access based on custom JWT claim ($token.role)
DEFINE TABLE config SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR update WHERE $token.role = 'admin' AND $session.origin = 'https://app.company.com';
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on $token Claims when Using TYPE RECORD without Custom Token Payload

**The mistake:** Accessing `$token.custom_field` when using standard SurrealDB `TYPE RECORD` auth without defining custom JWT token payloads.

**Why it's wrong:** Standard SurrealDB record auth tokens contain default claims (`ID`, `NS`, `DB`, `AC`, `exp`). Custom fields won't exist on `$token` unless injected via custom JWT signing or external auth providers (`TYPE JWT`).

*Incorrect:*
```surrealql
-- Using standard RECORD auth, but expecting $token.department to exist
DEFINE TABLE document PERMISSIONS FOR select WHERE department = $token.department;
```

*Fix:*
```surrealql
-- Use $auth.department when using RECORD auth, or $token.department when using external JWT auth
DEFINE TABLE document PERMISSIONS FOR select WHERE department = $auth.department;
```

---



### Mistake 2: Expecting `$token` Variables to Be Available in Un-Authenticated Root Connections

**The mistake:** Referencing `$token.exp` or `$token.id` in root administrator queries.

**Why it's wrong:** `$token` is populated ONLY during authenticated JWT or RECORD access scope sessions. In unauthenticated root sessions, `$token` is `NONE`.

*Incorrect:*
```surrealql
-- Executed as Root admin:
SELECT * FROM user WHERE id = $token.id; // ❌ $token is NONE!
```

*Fix:*
```surrealql
SELECT * FROM user WHERE id = $auth.id; // Record scope authenticated queries
```

### Mistake 3: Confusing `$auth` (Authenticated Record Object) with `$token` (JWT Claim Object)

**The mistake:** Expecting `$token` to contain table fields that were not embedded in the JWT payload claims.

**Why it's wrong:** `$auth` is the full database user record object. `$token` contains claims decoded directly from the JWT header/payload.

*Incorrect:*
```surrealql
-- Expecting un-encoded field in $token
SELECT * FROM article WHERE author_name = $token.name; // ❌ Field may not be in token claims!
```

*Fix:*
```surrealql
SELECT * FROM article WHERE author = $auth.id; // $auth fetches active record state
```





## 5. Practice Exercises

### Exercise 1: Session Variables Context Inspection

**Scenario:**
Inspect all active session variables (`$session`, `$token`, `$auth`) inside an active database query.

**Requirements:**
1. Select `$session.ns`, `$session.db`, `$token.sub`, `$auth.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT 
>     $session.ns AS active_ns,
>     $session.db AS active_db,
>     $session.id AS session_connection_id,
>     $token.sub AS token_subject,
>     $auth.id AS user_id;
> ```
>
> #### Technical Explanation
>
> 1. `$session` holds connection metadata (namespace, database, client IP, connection ID).
> 2. `$token` holds decoded JWT claims from the client's auth header.
> 3. `$auth` holds the authenticated user record document.
> 
---

### Exercise 2: Client IP Auditing with `$session.origin`

**Scenario:**
Record the client's IP address (`$session.origin`) inside an audit log record when a sensitive mutation occurs.

**Requirements:**
1. Create `audit_log` setting `client_ip = $session.origin`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE audit_log SET 
>     action = "sensitive_export",
>     user = $auth.id,
>     client_ip = $session.origin,
>     timestamp = time::now();
> ```
>
> #### Technical Explanation
>
> 1. `$session.origin` captures incoming client IP addresses or origin domains automatically.
> 2. Provides security auditing metrics without requiring backend API header parsing.
> 3. Records connection context at mutation execution time.
> 
---

### Exercise 3: Distinguishing `$auth` vs `$token`

**Scenario:**
Explain the architectural difference between `$auth` (database user record) and `$token` (raw JWT payload).

**Requirements:**
1. Contrast `$auth` record properties with `$token` claim properties.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> $auth: Represents the full live database record (e.g. user:alice document with up-to-date fields).
> $token: Represents static JSON Web Token claims passed by the client header (e.g. sub, exp, iss).
> ```
>
> #### Technical Explanation
>
> 1. `$auth` fetches live record data from storage during query execution.
> 2. `$token` reads pre-decoded JWT claim values directly from the request context.
> 3. Use `$auth` for live record checks; use `$token` for fast claim inspections.
> 
---





## 6. Related Terms

- [`$auth` Variable](auth_variable.md) — The authenticated record user object.
- [JWT Token-Based Auth](jwt_auth.md) — JWT validation and claims parsing.
- [`DEFINE ACCESS ... TYPE JWT` (External Auth Providers)](define_access_jwt.md) — External auth provider setup.
- [`$auth.id` vs `$auth.*` (Accessing Auth Record Fields)](auth_record_fields.md) — Related concept: `$auth.id` vs `$auth.*` (Accessing Auth Record Fields).

---

## 7. Key Takeaways
- `$session` provides transport-layer metadata (`$session.ip`, `$session.origin`, `$session.ns`, `$session.db`).
- `$token` provides decoded JWT payload claims (`$token.sub`, `$token.iss`, `$token.exp`).
- Essential for audit logging, geo/IP restrictions, and integrating external OAuth provider tokens.
