# Record Access (`DEFINE ACCESS ... TYPE RECORD`)

> **Level 8 — Authentication, Permissions & Security**
> SurrealDB's native end-user access method where application users sign up or sign in as records in a table, issuing JWT tokens directly from the database engine.

---

## 1. Prerequisites
- [Authentication Architecture](auth_architecture.md) — The 4-tier auth hierarchy.
- [System Users (`DEFINE USER`)](define_user.md) — Contrast between administrative system users and record users.

---

## 2. Term Category
- **Database Command / Security**

---

## 3. Environment Context
- **SurrealDB Core & Client SDKs** (Evaluated during user signup, signin, or token authentication over WebSocket and HTTP).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional web applications, user authentication requires a dedicated backend server (Express, NestJS, FastAPI) that queries the database, verifies hashed passwords, signs a JWT token, and sends it back to the client.

SurrealDB eliminates this boilerplate backend code with `DEFINE ACCESS ... TYPE RECORD`. This statement instructs SurrealDB to treat records in a specified table (e.g. `user`) as authenticated entities. When a user calls `SIGNUP` or `SIGNIN`, SurrealDB executes the defined SurrealQL query, verifies credentials using built-in cryptographic functions (`crypto::argon2::compare`), and issues a signed JWT token directly to the client.

### (2) Reality Metaphor
Imagine a residential apartment building:
- **System Users (`DEFINE USER`)**: The building landlord and maintenance engineers holding master keys.
- **Record Access (`DEFINE ACCESS ... TYPE RECORD`)**: The tenant registration kiosk in the lobby. When a new tenant checks in, the kiosk verifies their passport, logs them into the tenant directory (`user:tobie`), and prints an encrypted digital keycard (JWT token) valid for their apartment.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Define Record Access for application users
DEFINE ACCESS account_access ON DATABASE TYPE RECORD
    SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $pass) );
```

#### Fuller Example
```surrealql
-- 1. Create a user table
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD email ON user TYPE string ASSERT string::is::email($value);
DEFINE FIELD password ON user TYPE string;

-- 2. Define Record Access with SIGNUP and SIGNIN handlers
DEFINE ACCESS account_access ON DATABASE TYPE RECORD
    SIGNUP (
        CREATE user SET
            email = $email,
            password = crypto::argon2::generate($pass)
    )
    SIGNIN (
        SELECT * FROM user WHERE
            email = $email AND
            crypto::argon2::compare(password, $pass)
    )
    DURATION FOR TOKEN 15m, FOR SESSION 7d;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Comparing Passwords in Plaintext

**The mistake:** Performing direct string comparison (`password = $pass`) inside the `SIGNIN` clause.

**Why it's wrong:** Storing passwords in plaintext violates security compliance standards. Passwords must always be hashed using strong algorithms like Argon2.

*Incorrect:*
```surrealql
SIGNIN ( SELECT * FROM user WHERE email = $email AND password = $pass );
```

*Fix:*
```surrealql
SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $pass) );
```

---



### Mistake 2: Omitting `SIGNIN` or `SIGNUP` Queries in RECORD Access Definitions

**The mistake:** Defining `DEFINE ACCESS user_access ON DATABASE TYPE RECORD;` without `SIGNIN` or `SIGNUP` clauses.

**Why it's wrong:** RECORD access definitions require `SIGNIN (query)` and/or `SIGNUP (query)` blocks to process authentication requests.

*Incorrect:*
```surrealql
DEFINE ACCESS user_access ON DATABASE TYPE RECORD; // ❌ Missing SIGNIN and SIGNUP handlers!
```

*Fix:*
```surrealql
DEFINE ACCESS user_access ON DATABASE TYPE RECORD SIGNUP (...) SIGNIN (...);
```

### Mistake 3: Returning Non-Record Values in `SIGNIN` Query Blocks

**The mistake:** Writing `SIGNIN (SELECT count() FROM user ...)` inside RECORD access definitions.

**Why it's wrong:** `SIGNIN` query blocks MUST return a valid user record (e.g. `SELECT * FROM user WHERE ...`). The returned record is bound to `$auth`.

*Incorrect:*
```surrealql
DEFINE ACCESS user_access ... SIGNIN (SELECT count() FROM user); // ❌ Must return user record!
```

*Fix:*
```surrealql
DEFINE ACCESS user_access ... SIGNIN (SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass));
```



### Mistake 4: Omitting `SIGNIN` or `SIGNUP` Queries in RECORD Access Definitions

**The mistake:** Defining `DEFINE ACCESS user_access ON DATABASE TYPE RECORD;` without `SIGNIN` or `SIGNUP` clauses.

**Why it's wrong:** RECORD access definitions require `SIGNIN (query)` and/or `SIGNUP (query)` blocks to process authentication requests.

*Incorrect:*
```surrealql
DEFINE ACCESS user_access ON DATABASE TYPE RECORD; // ❌ Missing SIGNIN and SIGNUP handlers!
```

*Fix:*
```surrealql
DEFINE ACCESS user_access ON DATABASE TYPE RECORD SIGNUP (...) SIGNIN (...);
```

### Mistake 5: Returning Non-Record Values in `SIGNIN` Query Blocks

**The mistake:** Writing `SIGNIN (SELECT count() FROM user ...)` inside RECORD access definitions.

**Why it's wrong:** `SIGNIN` query blocks MUST return a valid user record (e.g. `SELECT * FROM user WHERE ...`). The returned record is bound to `$auth`.

*Incorrect:*
```surrealql
DEFINE ACCESS user_access ... SIGNIN (SELECT count() FROM user); // ❌ Must return user record!
```

*Fix:*
```surrealql
DEFINE ACCESS user_access ... SIGNIN (SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass));
```

## 6. Practice Exercises

### Exercise 1: Configure Token Duration
Write a `DEFINE ACCESS` statement named `mobile_app` on the current database that sets the JWT token duration to 30 minutes (`30m`) and session duration to 30 days (`30d`).

> [!check]- Answer
> - Add `DURATION FOR TOKEN 30m, FOR SESSION 30d;` at the end of your `DEFINE ACCESS` definition.

---



### Exercise 2: Complete RECORD Access Definition

**Problem:** Write full `DEFINE ACCESS account_access ON DATABASE TYPE RECORD` with SIGNUP and SIGNIN.

**Expected output:**
```text
DEFINE ACCESS account_access ON DATABASE TYPE RECORD SIGNUP (...) SIGNIN (...);
```

> [!check]- Answer
> ```surrealql
> DEFINE ACCESS account_access ON DATABASE TYPE RECORD
>   SIGNUP (CREATE user SET email = $email, pass = crypto::argon2::generate($pass))
>   SIGNIN (SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass));
> ```
>
> **Explanation:** RECORD access definitions specify signin and signup database handlers.

### Exercise 3: Session Expiration Setting

**Problem:** Set RECORD access token duration to 12 hours (`12h`).

**Expected output:**
```text
DEFINE ACCESS user_access ON DATABASE TYPE RECORD DURATION FOR SESSION 12h ...
```

> [!check]- Answer
> ```surrealql
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD DURATION FOR SESSION 12h;
> ```
>
> **Explanation:** `DURATION FOR SESSION` configures JWT token validity periods.



### Exercise 4: Complete RECORD Access Definition

**Problem:** Write full `DEFINE ACCESS account_access ON DATABASE TYPE RECORD` with SIGNUP and SIGNIN.

**Expected output:**
```text
DEFINE ACCESS account_access ON DATABASE TYPE RECORD SIGNUP (...) SIGNIN (...);
```

> [!check]- Answer
> ```surrealql
> DEFINE ACCESS account_access ON DATABASE TYPE RECORD
>   SIGNUP (CREATE user SET email = $email, pass = crypto::argon2::generate($pass))
>   SIGNIN (SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass));
> ```
>
> **Explanation:** RECORD access definitions specify signin and signup database handlers.

### Exercise 5: Session Expiration Setting

**Problem:** Set RECORD access token duration to 12 hours (`12h`).

**Expected output:**
```text
DEFINE ACCESS user_access ON DATABASE TYPE RECORD DURATION FOR SESSION 12h ...
```

> [!check]- Answer
> ```surrealql
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD DURATION FOR SESSION 12h;
> ```
>
> **Explanation:** `DURATION FOR SESSION` configures JWT token validity periods.

## 7. Related Terms
- [Authentication Architecture](auth_architecture.md) — System auth hierarchy overview.
- [`SIGNUP` / `SIGNIN` Clauses](signup_signin.md) — Authentication handler expressions.
- [JWT Token-Based Auth](jwt_auth.md) — How JWT tokens are evaluated.

---

## 8. Key Takeaways
- `DEFINE ACCESS ... TYPE RECORD` allows database records to act as authenticated users.
- Handles user registration (`SIGNUP`) and login (`SIGNIN`) natively inside SurrealQL.
- Eliminates the need for custom authentication microservices in client-heavy applications.
