# JWT Token-Based Auth

> **Level 8 — Authentication, Permissions & Security**
> How SurrealDB issues, signs, decodes, and validates JSON Web Tokens (JWTs) for stateless, scalable authentication across stateless web and mobile clients.

---

## 1. Prerequisites

- [Authentication Architecture (Root, Namespace, Database, Record)](auth_architecture.md) — The 4-tier security hierarchy.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Record authentication.

---

## 2. Term Category


**Authentication & Permissions (JSON Web Token token authentication)**: - **Security & Protocol**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Stateful session databases (like traditional session tables stored in Redis or SQL) require every single incoming web request to perform a database lookup to check if the session cookie is valid. For high-throughput applications, this creates a massive bottleneck.

SurrealDB natively uses **JSON Web Tokens (JWTs)** for authentication:
- When a client signs in via `SIGNIN` or `SIGNUP`, SurrealDB constructs a cryptographically signed JWT token.
- The token contains claims identifying the user (`ID: user:tobie`), target namespace (`NS`), target database (`DB`), access method (`AC`), and expiration timestamp (`exp`).
- Subsequent HTTP requests send `Authorization: Bearer <token>`. SurrealDB verifies the signature in memory **without performing any database read**, making authentication completely stateless and ultra-fast.

### (2) Reality Metaphor
Think of an amusement park VIP wristband:
- When you buy a ticket at the entrance (`SIGNIN`), staff hand you a tamper-evident wristband with a holographic seal (cryptographic signature) stamping your access privileges (`VIP`), valid date (`exp`), and pass type (`AC`).
- Every ride operator instantly lets you onto the ride by checking the wristband seal, without calling central office to check a paper ledger.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Configuring JWT token expiration durations on Record Access
DEFINE ACCESS account_auth ON DATABASE TYPE RECORD
    SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $pass) )
    DURATION FOR TOKEN 15m, FOR SESSION 7d;
```

#### Fuller Example
```javascript
// Client SDK receiving and restoring JWT session
import Surreal from 'surrealdb';

const db = new Surreal();
await db.connect('http://127.0.0.1:8000');

// 1. Authenticate and receive JWT token
const token = await db.signin({
    access: 'account_auth',
    variables: { email: 'user@example.com', pass: 'secret123' }
});

// Store JWT token in localStorage / SecureStore
console.log('Received JWT Token:', token);

// 2. Later session initialization: Authenticate statelessly using stored JWT token
await db.authenticate(token);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Setting Infinite Token Lifetimes in Production

**The mistake:** Configuring `DURATION FOR TOKEN 100y` or omitting token expiration limits on public applications.

**Why it's wrong:** If an auth token is stolen from a client device (via XSS or network intercept), an infinite token allows malicious actors persistent access until manually revoked.

*Incorrect:*
```surrealql
DEFINE ACCESS user_auth ON DATABASE TYPE RECORD DURATION FOR TOKEN 999d;
```

*Fix:*
```surrealql
-- Use short-lived tokens (e.g. 15 minutes) with longer refresh session durations
DEFINE ACCESS user_auth ON DATABASE TYPE RECORD DURATION FOR TOKEN 15m, FOR SESSION 7d;
```

---



### Mistake 2: Hardcoding JWT Secret Keys in Public Frontend Repositories

**The mistake:** Storing `DEFINE ACCESS ... KEY "my_secret_key"` inside open source client repos.

**Why it's wrong:** Anyone with access to the secret key can forge valid JWT tokens and bypass authentication.

*Incorrect:*
```surrealql
// Public repo
DEFINE ACCESS jwt ON DATABASE TYPE JWT ALGORITHM HS256 KEY "public_secret";
```

*Fix:*
```surrealql
Use environment variables or asymmetric RS256 JWKS endpoint URLs
```

### Mistake 3: Omitting Expiration `exp` Claims in Generated JWT Tokens

**The mistake:** Issuing JWT tokens without an `exp` (expiration timestamp) claim.

**Why it's wrong:** JWTs without expiration remain valid forever, preventing token revocation if compromised. Always set `exp` claims.

*Incorrect:*
```surrealql
// Token payload without exp claim
{ sub: "user:alice" } // ❌ Never expires!
```

*Fix:*
```surrealql
// Token payload with exp claim
{ sub: "user:alice", exp: 1700000000 } // Time-bound expiration
```





## 5. Practice Exercises

### Exercise 1: Decoding JWT Session Claims

**Scenario:**
Inspect decoded JWT session claims stored in `$token` during an authenticated client session.

**Requirements:**
1. Select `$token.sub`, `$token.exp`, `$token.iss`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT 
>     $token.sub AS subject,
>     $token.exp AS expiration_timestamp,
>     $token.iss AS issuer;
> ```
>
> #### Technical Explanation
>
> 1. `$token` contains decoded JSON Web Token claims parsed from client authorization headers.
> 2. Includes standard JWT fields (`sub`, `exp`, `iss`, `nbf`).
> 3. Available across all queries executed during active sessions.

---

### Exercise 2: Using Custom JWT Claims in Row Security

**Scenario:**
Restrict access to table `project` so that users can only select projects matching their token's tenant claim (`$token.tenant_id`).

**Requirements:**
1. Define table `project` with `PERMISSIONS FOR select WHERE tenant_id = $token.tenant_id`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE project SCHEMAFULL
>     PERMISSIONS FOR select WHERE tenant_id = $token.tenant_id;
> ```
>
> #### Technical Explanation
>
> 1. Custom JWT claims (e.g. `tenant_id`) are accessible via `$token.tenant_id`.
> 2. Enforces multi-tenant row security dynamically using external JWT claims.
> 3. Eliminates manual tenant filtering in client queries.

---

### Exercise 3: Validating JWT Expiration Lifetimes

**Scenario:**
Explain how SurrealDB automatically rejects expired JSON Web Tokens.

**Requirements:**
1. Describe how SurrealDB checks the `$token.exp` claim against current time.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> When a client passes a JWT:
> - SurrealDB verifies the cryptographic signature (using KEY & ALGORITHM).
> - SurrealDB checks if $token.exp < current_timestamp.
> - If expired, the request is rejected with an unauthenticated 401 response.
> ```
>
> #### Technical Explanation
>
> 1. SurrealDB validates JWT expiration (`exp`) automatically during token parsing.
> 2. Rejects expired tokens before executing database queries.
> 3. Protects against stale authentication session reuse.

---





## 6. Related Terms

- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Built-in access definition.
- [`$session` / `$token` Variables](session_token_variables.md) — Accessing decoded JWT claims in SurrealQL.
- [`DEFINE ACCESS ... TYPE JWT` (External Auth Providers)](define_access_jwt.md) — Validating third-party provider JWTs.
- [`SIGNUP` / `SIGNIN` Clauses](signup_signin.md) — Related concept: `SIGNUP` / `SIGNIN` Clauses.
- [Authentication Architecture (Root, Namespace, Database, Record)](auth_architecture.md) — Related concept: Authentication Architecture (Root, Namespace, Database, Record).

---

## 7. Key Takeaways
- SurrealDB issues and verifies standard RFC 7519 JSON Web Tokens (JWTs).
- Enables stateless authentication across HTTP endpoints and WebSocket streams.
- Tokens contain signature, expiration (`exp`), subject (`ID`), and targeted database boundaries (`NS`/`DB`/`AC`).
