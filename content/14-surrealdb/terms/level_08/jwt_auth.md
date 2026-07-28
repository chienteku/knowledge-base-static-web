# JWT Token-Based Auth

> **Level 8 — Authentication, Permissions & Security**
> How SurrealDB issues, signs, decodes, and validates JSON Web Tokens (JWTs) for stateless, scalable authentication across stateless web and mobile clients.

---

## 1. Prerequisites
- [Authentication Architecture](auth_architecture.md) — The 4-tier security hierarchy.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Record authentication.

---

## 2. Term Category
- **Security & Protocol**

---

## 3. Environment Context
- **SurrealDB Transport Layer** (Validated on every HTTP Authorization header `Bearer <token>` or WebSocket auth handshake).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Hardcoding JWT Secret Keys in Public Frontend Repositories

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

### Mistake 5: Omitting Expiration `exp` Claims in Generated JWT Tokens

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

## 6. Practice Exercises

### Exercise 1: Decode JWT Payload Claims
Identify the 4 core system claims included in every SurrealDB Record Access JWT token.

> [!check]- Answer
> - Target Namespace (`NS`).
> - Target Database (`DB`).
> - Access Definition Name (`AC`).
> - Authenticated Record ID (`ID` / `sub`).

---



### Exercise 2: SurrealDB JWT Claims Structure

**Problem:** List essential claims in SurrealDB JWT tokens (`NS`, `DB`, `AC` / access scope, `ID` / `$auth.id`).

**Expected output:**
```text
NS, DB, AC (access scope), ID ($auth.id)
```

> [!check]- Answer
> ```text
> NS, DB, AC (access scope), ID ($auth.id)
> ```
>
> **Explanation:** SurrealDB JWT claims specify target namespace, database, access scope, and user identity.

### Exercise 3: Authenticating SDK with Raw JWT Token

**Problem:** Write JS SDK call authenticating using token `await db.authenticate(token)`.

**Expected output:**
```text
await db.authenticate(token);
```

> [!check]- Answer
> ```javascript
> await db.authenticate(token);
> ```
>
> **Explanation:** `db.authenticate(token)` establishes SDK session state using a raw JWT string.

## 7. Related Terms
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Built-in access definition.
- [`$session` / `$token` Variables](session_token_variables.md) — Accessing decoded JWT claims in SurrealQL.
- [`DEFINE ACCESS ... TYPE JWT`](define_access_jwt.md) — Validating third-party provider JWTs.

---

## 8. Key Takeaways
- SurrealDB issues and verifies standard RFC 7519 JSON Web Tokens (JWTs).
- Enables stateless authentication across HTTP endpoints and WebSocket streams.
- Tokens contain signature, expiration (`exp`), subject (`ID`), and targeted database boundaries (`NS`/`DB`/`AC`).
