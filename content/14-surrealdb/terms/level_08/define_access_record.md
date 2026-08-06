# Record Access (`DEFINE ACCESS ... TYPE RECORD`)

> **Level 8 — Authentication, Permissions & Security**
> SurrealDB's native end-user access method where application users sign up or sign in as records in a table, issuing JWT tokens directly from the database engine.

---

## 1. Prerequisites

- [Authentication Architecture (Root, Namespace, Database, Record)](auth_architecture.md) — The 4-tier auth hierarchy.
- [System Users (`DEFINE USER`)](define_user.md) — Contrast between administrative system users and record users.

---

## 2. Term Category


**Authentication & Permissions (RECORD user access definition)**: - **Database Command / Security**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Defining RECORD Access for User Registration and Signin

**Scenario:**
Define a RECORD access method `user_access` on table `user` configuring `SIGNUP` (user registration) and `SIGNIN` (user login) query blocks.

**Requirements:**
1. Define access method `user_access` ON DATABASE TYPE RECORD.
2. Configure `SIGNUP` inserting user with hashed password.
3. Configure `SIGNIN` checking Argon2 password hash.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD
>     SIGNUP (
>         CREATE user SET 
>             username = $username, 
>             password = crypto::argon2::generate($pass)
>     )
>     SIGNIN (
>         SELECT * FROM user 
>         WHERE username = $username AND crypto::argon2::compare(password, $pass)
>     );
> ```
>
> #### Technical Explanation
>
> 1. `DEFINE ACCESS ... TYPE RECORD` manages user authentication against database records.
> 2. `SIGNUP` executes registration logic, returning a new user record and issuing a session token.
> 3. `SIGNIN` executes authentication checks, returning a matching user record and issuing a session token.

---

### Exercise 2: Setting Access Token Duration Lifetimes

**Scenario:**
Configure access method `user_access` setting session token expiration duration to 15 minutes (`15m`).

**Requirements:**
1. Add `DURATION FOR TOKEN 15m` to access definition.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD
>     AUTHENTICATE (
>         SELECT * FROM user WHERE username = $username
>     )
>     DURATION FOR TOKEN 15m;
> ```
>
> #### Technical Explanation
>
> 1. `DURATION FOR TOKEN` specifies session token expiration lifetimes (e.g. `15m`, `1h`, `7d`).
> 2. Forces clients to re-authenticate or refresh tokens after expiration.
> 3. Hardens session security against stolen token reuse.

---

### Exercise 3: Revoking RECORD Access Methods

**Scenario:**
Drop access method `user_access` using `REMOVE ACCESS`.

**Requirements:**
1. Write `REMOVE ACCESS user_access ON DATABASE`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> REMOVE ACCESS user_access ON DATABASE;
> ```
>
> #### Technical Explanation
>
> 1. `REMOVE ACCESS` drops access method definitions from database metadata registers.
> 2. Invalidates future client signin attempts against the target access method.
> 3. User table records remain unaffected.

---





## 6. Related Terms

- [Authentication Architecture (Root, Namespace, Database, Record)](auth_architecture.md) — System auth hierarchy overview.
- [`SIGNUP` / `SIGNIN` Clauses](signup_signin.md) — Authentication handler expressions.
- [JWT Token-Based Auth](jwt_auth.md) — How JWT tokens are evaluated.
- [Direct Browser-to-Database Architecture](browser_to_db.md) — Related concept: Direct Browser-to-Database Architecture.
- [`DEFINE ACCESS ... TYPE JWT` (External Auth Providers)](define_access_jwt.md) — Related concept: `DEFINE ACCESS ... TYPE JWT` (External Auth Providers).
- [System Users (`DEFINE USER`)](define_user.md) — Related concept: System Users (`DEFINE USER`).

---

## 7. Key Takeaways
- `DEFINE ACCESS ... TYPE RECORD` allows database records to act as authenticated users.
- Handles user registration (`SIGNUP`) and login (`SIGNIN`) natively inside SurrealQL.
- Eliminates the need for custom authentication microservices in client-heavy applications.
