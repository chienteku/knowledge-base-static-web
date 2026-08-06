# `DEFINE ACCESS ... TYPE JWT` (External Auth Providers)

> **Level 8 — Authentication, Permissions & Security**
> Integrating external identity providers (Auth0, Clerk, Supabase Auth, Firebase Auth) into SurrealDB by validating third-party JWT tokens via public key algorithms or JWKS endpoints.

---

## 1. Prerequisites

- [Authentication Architecture (Root, Namespace, Database, Record)](auth_architecture.md) — The 4-tier security hierarchy.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Built-in record access vs external JWT validation.

---

## 2. Term Category


**Authentication & Permissions (JWT external access definition)**: - **Database Command / Integration**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While SurrealDB supports built-in user registration with `TYPE RECORD`, production enterprise architectures frequently rely on external identity providers (Auth0, Clerk, Firebase, Okta, Supabase Auth) for single sign-on (SSO), multi-factor authentication (MFA), and OAuth social logins (Google, GitHub, Apple).

`DEFINE ACCESS ... TYPE JWT` allows SurrealDB to accept JWT tokens issued by external authentication services. Instead of verifying user passwords locally, SurrealDB fetches the provider's public key (via a JWKS URL or static public key string), verifies the signature of the incoming JWT token, and extracts the user claims (like `$token.sub`) to bind the session to `$auth`.

### (2) Reality Metaphor
Imagine an international airport border control desk:
- **`TYPE RECORD`**: The airport issuing its own temporary transit badges at the local information desk.
- **`TYPE JWT`**: The airport accepting official passports issued by recognized foreign governments (Auth0, Clerk). Border control checks the security watermark and digital signature against an official global database (JWKS URL) without needing to issue a new local passport.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Accept Auth0 JWTs using RS256 algorithm and public JWKS endpoint
DEFINE ACCESS auth0 ON DATABASE TYPE JWT
    ALGORITHM RS256
    URL 'https://dev-tenant.us.auth0.com/.well-known/jwks.json';
```

#### Fuller Example
```surrealql
-- 1. Define external JWT access provider
DEFINE ACCESS clerk_auth ON DATABASE TYPE JWT
    ALGORITHM RS256
    URL 'https://clerk.example.com/.well-known/jwks.json';

-- 2. Define a user table where external subjects map to local records
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD email ON user TYPE string;

-- 3. Row-Level Permission using external JWT claims ($token.sub)
DEFINE TABLE document SCHEMAFULL
    PERMISSIONS
        FOR select WHERE owner = type::thing('user', $token.sub);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mismatched Token Algorithm

**The mistake:** Configuring `ALGORITHM HS256` when the external provider signs tokens using asymmetric public-key cryptography (`RS256` or `ES256`).

**Why it's wrong:** Asymmetric providers (like Auth0 or Clerk) issue RSA key pairs. Specifying HS256 causes token signature verification failures.

*Incorrect:*
```surrealql
DEFINE ACCESS auth0 ON DATABASE TYPE JWT ALGORITHM HS256 URL '.../jwks.json';
```

*Fix:*
```surrealql
DEFINE ACCESS auth0 ON DATABASE TYPE JWT ALGORITHM RS256 URL '.../jwks.json';
```

---



### Mistake 2: Configuring JWT Access Without Specifying Verification Keys or Algorithms

**The mistake:** Defining JWT access without setting `ALGORITHM` or `KEY` parameters.

**Why it's wrong:** SurrealDB must verify external JWT signature tokens using declared algorithms (`HS256`, `RS256`) and verification secret keys.

*Incorrect:*
```surrealql
DEFINE ACCESS auth0 ON DATABASE TYPE JWT; // ❌ Missing ALGORITHM and KEY!
```

*Fix:*
```surrealql
DEFINE ACCESS auth0 ON DATABASE TYPE JWT ALGORITHM HS256 KEY "secret_key";
```

### Mistake 3: Mismatched Issuer or Audience Claims in External JWT Tokens

**The mistake:** Passing external JWTs from Auth0 / Clerk without matching `URL` or `WITH ISSUER` configuration fields.

**Why it's wrong:** SurrealDB rejects JWT tokens if issuer or audience claims do not match declared ACCESS definitions.

*Incorrect:*
```surrealql
-- Misconfigured JWT issuer validation
```

*Fix:*
```surrealql
DEFINE ACCESS auth0 ON DATABASE TYPE JWT ALGORITHM RS256 URL "https://domain.auth0.com/.well-known/jwks.json";
```





## 5. Practice Exercises

### Exercise 1: External JWT Provider Access Definition

**Scenario:**
Configure an external JWT access method `auth0_access` on database `app` to validate tokens issued by Auth0 using algorithm `HS256`.

**Requirements:**
1. Define access method `auth0_access` ON DATABASE TYPE JWT.
2. Specify algorithm `HS256` and secret key `"Auth0SecretKey2026!"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> USE DB app;
> 
> -- Define external JWT access method
> DEFINE ACCESS auth0_access ON DATABASE TYPE JWT
>     ALGORITHM HS256
>     KEY "Auth0SecretKey2026!";
> ```
>
> #### Technical Explanation
>
> 1. `DEFINE ACCESS ... TYPE JWT` configures SurrealDB to authenticate external JSON Web Tokens.
> 2. `ALGORITHM` specifies the cryptographic signature algorithm (`HS256`, `RS256`).
> 3. `KEY` stores the shared secret or public key used to verify token signatures.

---

### Exercise 2: Public Key RS256 JWT Verification

**Scenario:**
Configure JWT access method `clerk_access` using an RSA public key (`RS256`) for asymmetric token signature verification.

**Requirements:**
1. Define access method `clerk_access` using algorithm `RS256` and a public PEM key string.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE ACCESS clerk_access ON DATABASE TYPE JWT
>     ALGORITHM RS256
>     KEY "-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
-----END PUBLIC KEY-----";
> ```
>
> #### Technical Explanation
>
> 1. Asymmetric `RS256` verification uses a public key to verify tokens signed by an external auth service's private key.
> 2. Allows third-party identity providers (Clerk, Auth0, Firebase) to issue client tokens safely.
> 3. Prevents storing private signing keys inside database configurations.

---

### Exercise 3: Accessing JWT Claims in `$token`

**Scenario:**
Inspect external claims (such as `$token.sub` and `$token.role`) contained within validated JWT tokens during a client session.

**Requirements:**
1. Select `$token.sub` and `$token.role`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT $token.sub AS user_id, $token.role AS user_role;
> ```
>
> #### Technical Explanation
>
> 1. `$token` contains decoded JSON Web Token payload claims (e.g. `sub`, `exp`, `iss`, custom claims).
> 2. Can be used inside `PERMISSIONS` clauses (`PERMISSIONS FOR select WHERE id = type::thing("user", $token.sub)`).
> 3. Integrates external identity claims directly with SurrealDB authorization rules.

---





## 6. Related Terms

- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Built-in database user registration.
- [JWT Token-Based Auth](jwt_auth.md) — JWT structure and verification details.
- [`$session` / `$token` Variables](session_token_variables.md) — Accessing token payload claims in SurrealQL.

---

## 7. Key Takeaways
- `DEFINE ACCESS ... TYPE JWT` connects SurrealDB directly to external OAuth/SSO identity providers.
- Supports JWKS URLs (`URL '...'`) for automatic public key rotation.
- Exposes incoming token claims through the `$token` variable in row-level permission logic.
