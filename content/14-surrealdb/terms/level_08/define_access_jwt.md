# `DEFINE ACCESS ... TYPE JWT` (External Auth Providers)

> **Level 8 — Authentication, Permissions & Security**
> Integrating external identity providers (Auth0, Clerk, Supabase Auth, Firebase Auth) into SurrealDB by validating third-party JWT tokens via public key algorithms or JWKS endpoints.

---

## 1. Prerequisites
- [Authentication Architecture](auth_architecture.md) — The 4-tier security hierarchy.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Built-in record access vs external JWT validation.

---

## 2. Term Category
- **Database Command / Integration**

---

## 3. Environment Context
- **SurrealDB Core Engine** (Validates incoming HTTP Bearer headers or WebSocket connection headers against configured JWKS endpoints).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Configuring JWT Access Without Specifying Verification Keys or Algorithms

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

### Mistake 5: Mismatched Issuer or Audience Claims in External JWT Tokens

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

## 6. Practice Exercises

### Exercise 1: Configure Secret Key JWT Access
Write a `DEFINE ACCESS` statement named `custom_service` on the database level using `TYPE JWT` with symmetric algorithm `HS256` and secret key `"MySecretKey123"`.

> [!check]- Answer
> - Use `DEFINE ACCESS custom_service ON DATABASE TYPE JWT`.
> - Specify `ALGORITHM HS256 KEY "MySecretKey123"`.

---



### Exercise 2: Defining HMAC HS256 JWT Access

**Problem:** Define JWT access `app_jwt` on database using `HS256` algorithm and secret `"my_secret"`.

**Expected output:**
```text
DEFINE ACCESS app_jwt ON DATABASE TYPE JWT ALGORITHM HS256 KEY "my_secret";
```

> [!check]- Answer
> ```surrealql
> DEFINE ACCESS app_jwt ON DATABASE TYPE JWT ALGORITHM HS256 KEY "my_secret";
> ```
>
> **Explanation:** `TYPE JWT ALGORITHM HS256 KEY ...` validates external HMAC-SHA256 tokens.

### Exercise 3: JWKS Endpoint RS256 Integration

**Problem:** Define JWT access for Auth0 using RS256 JWKS endpoint URL.

**Expected output:**
```text
DEFINE ACCESS auth0 ON DATABASE TYPE JWT ALGORITHM RS256 URL "https://dev.auth0.com/.well-known/jwks.json";
```

> [!check]- Answer
> ```surrealql
> DEFINE ACCESS auth0 ON DATABASE TYPE JWT ALGORITHM RS256 URL "https://dev.auth0.com/.well-known/jwks.json";
> ```
>
> **Explanation:** `URL` fetches public JWKS verification keys for validating asymmetric RS256 JWTs.

## 7. Related Terms
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Built-in database user registration.
- [JWT Token-Based Auth](jwt_auth.md) — JWT structure and verification details.
- [`$session` / `$token` Variables](session_token_variables.md) — Accessing token payload claims in SurrealQL.

---

## 8. Key Takeaways
- `DEFINE ACCESS ... TYPE JWT` connects SurrealDB directly to external OAuth/SSO identity providers.
- Supports JWKS URLs (`URL '...'`) for automatic public key rotation.
- Exposes incoming token claims through the `$token` variable in row-level permission logic.
