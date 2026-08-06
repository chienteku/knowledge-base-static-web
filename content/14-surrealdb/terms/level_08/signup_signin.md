# `SIGNUP` / `SIGNIN` Clauses

> **Level 8 — Authentication, Permissions & Security**
> The SurrealQL execution blocks inside `DEFINE ACCESS ... TYPE RECORD` that define custom user registration and login verification logic.

---

## 1. Prerequisites

- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — The parent access definition.
- [Built-in Functions Overview](../level_06/builtin_functions.md) — Cryptographic functions (`crypto::*`).

---

## 2. Term Category


**Authentication & Permissions (record access SIGNUP and SIGNIN statements)**: - **Database Syntax / Security**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When building application authentication, signup and signin require different queries:
- **`SIGNUP`**: Executes when a new user registers. It must validate inputs, hash the plaintext password, create a record in the targeted user table, and return the newly created record.
- **`SIGNIN`**: Executes when an existing user logs in. It must query the user table by identifier (email/username), verify the password hash using cryptographic functions, and return the matching user record if valid.

The `SIGNUP` and `SIGNIN` clauses within `DEFINE ACCESS` encapsulate these queries inside SurrealQL, ensuring atomic execution and returning a signed JWT token on success.

### (2) Reality Metaphor
Think of an exclusive gym membership desk:
- **`SIGNUP`**: The new member registration counter — you fill out a registration form, staff create a new profile card (`user:tobie`), hash your passcode for safety, and issue your membership badge.
- **`SIGNIN`**: The turnstile gate at the entrance — you scan your badge or type your email/passcode. The system looks up your profile, checks your passcode against the encrypted file, and unlocks the gate if it matches.

### (3) Code Examples

#### Short Snippet
```surrealql
-- SIGNUP block creating a new record
SIGNUP (
    CREATE user SET email = $email, password = crypto::argon2::generate($pass)
)
```

#### Fuller Example
```surrealql
-- Complete RECORD Access definition with custom SIGNUP and SIGNIN logic
DEFINE ACCESS user_auth ON DATABASE TYPE RECORD
    SIGNUP (
        CREATE user SET
            name = $name,
            email = $email,
            password = crypto::argon2::generate($pass),
            created_at = time::now(),
            role = 'member'
    )
    SIGNIN (
        SELECT * FROM user WHERE
            email = $email AND
            crypto::argon2::compare(password, $pass)
    );
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Return a Record in SIGNIN

**The mistake:** Writing a `SIGNIN` block that returns a boolean or an empty result set on successful authentication.

**Why it's wrong:** SurrealDB expects `SIGNIN` to return a single matching record (or record array). If no record is returned, authentication fails and no token is issued.

*Incorrect:*
```surrealql
-- Returns boolean true/false instead of the matching record
SIGNIN ( SELECT crypto::argon2::compare(password, $pass) FROM user WHERE email = $email );
```

*Fix:*
```surrealql
-- Returns the full matching user record
SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $pass) );
```

---



### Mistake 2: Returning Boolean Expressions instead of User Records in `SIGNIN` Scopes

**The mistake:** Writing `SIGNIN (SELECT * FROM user WHERE ...) != NONE` returning a boolean `true`.

**Why it's wrong:** `SIGNIN` query handlers MUST return the user record object (e.g. `SELECT * FROM user WHERE ...`). Returning a boolean causes authentication failure.

*Incorrect:*
```surrealql
DEFINE ACCESS user ... SIGNIN (count() > 0); // ❌ Returns boolean instead of record!
```

*Fix:*
```surrealql
DEFINE ACCESS user ... SIGNIN (SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass));
```

### Mistake 3: Omitting Password Hashing in `SIGNUP` Handlers

**The mistake:** Creating users in `SIGNUP` without hashing `$pass`.

**Why it's wrong:** Failing to hash passwords exposes raw user passwords in database tables. Always use `crypto::argon2::generate($pass)`.

*Incorrect:*
```surrealql
SIGNUP (CREATE user SET pass = $pass); // ❌ Un-hashed password!
```

*Fix:*
```surrealql
SIGNUP (CREATE user SET pass = crypto::argon2::generate($pass));
```





## 5. Practice Exercises

### Exercise 1: User Registration with `SIGNUP`

**Scenario:**
Configure a `SIGNUP` query block inside `DEFINE ACCESS user_access` that hashes passwords using Argon2 and initializes default user roles.

**Requirements:**
1. Write `SIGNUP` query inserting a user record into table `user`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD
>     SIGNUP (
>         CREATE user SET 
>             username = $username,
>             email = $email,
>             password = crypto::argon2::generate($pass),
>             role = "customer",
>             created_at = time::now()
>     );
> ```
>
> #### Technical Explanation
>
> 1. `SIGNUP` executes registration logic when a client calls `db.signup()`.
> 2. Hashes plaintext passwords securely using `crypto::argon2::generate()`.
> 3. Returns the newly created user record and issues an authenticated session token.

---

### Exercise 2: User Authentication with `SIGNIN`

**Scenario:**
Configure a `SIGNIN` query block inside `DEFINE ACCESS user_access` that validates usernames and Argon2 password hashes.

**Requirements:**
1. Write `SIGNIN` query selecting matching user record using `crypto::argon2::compare()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD
>     SIGNIN (
>         SELECT * FROM user 
>         WHERE username = $username AND crypto::argon2::compare(password, $pass)
>     );
> ```
>
> #### Technical Explanation
>
> 1. `SIGNIN` executes authentication checks when a client calls `db.signin()`.
> 2. `crypto::argon2::compare()` verifies plaintext password inputs against stored hashes.
> 3. Issues an authenticated session token if a matching record is returned.

---

### Exercise 3: Testing SDK `db.signup()` Integration

**Scenario:**
Write the JavaScript SDK client call for registering a new user against the `user_access` RECORD access method.

**Requirements:**
1. Formulate the `db.signup()` JavaScript call.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const token = await db.signup({
>   access: "user_access",
>   ns: "main",
>   db: "app",
>   username: "alice",
>   email: "alice@example.com",
>   pass: "UserPass123!"
> });
> 
> console.log("Registered and received auth token:", token);
> ```
>
> #### Technical Explanation
>
> 1. `db.signup()` passes parameter payload variables (`$username`, `$email`, `$pass`) to the server `SIGNUP` block.
> 2. Receives a signed JWT authentication token on success.
> 3. Automatically authenticates the active SDK connection context.

---





## 6. Related Terms

- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Parent access setup.
- [JWT Token-Based Auth](jwt_auth.md) — Token generated after `SIGNUP` / `SIGNIN`.
- [`$auth` Variable](auth_variable.md) — The bound context variable after successful login.

---

## 7. Key Takeaways
- `SIGNUP` executes `CREATE` statements to register new user records.
- `SIGNIN` executes `SELECT` queries to locate and verify credentials.
- Both clauses must evaluate to a valid record for SurrealDB to issue an authentication JWT.
