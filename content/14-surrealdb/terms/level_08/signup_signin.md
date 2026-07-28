# `SIGNUP` / `SIGNIN` Clauses

> **Level 8 — Authentication, Permissions & Security**
> The SurrealQL execution blocks inside `DEFINE ACCESS ... TYPE RECORD` that define custom user registration and login verification logic.

---

## 1. Prerequisites
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — The parent access definition.
- [Built-in Functions Overview](../level_06/builtin_functions.md) — Cryptographic functions (`crypto::*`).

---

## 2. Term Category
- **Database Syntax / Security**

---

## 3. Environment Context
- **SurrealDB Core Engine** (Invoked when a client SDK executes `.signup()` or `.signin()` calls over network protocols).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Returning Boolean Expressions instead of User Records in `SIGNIN` Scopes

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

### Mistake 5: Omitting Password Hashing in `SIGNUP` Handlers

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

## 6. Practice Exercises

### Exercise 1: Write a Username-based SIGNIN
Write a `SIGNIN` clause that authenticates users by `username` instead of `email`, checking the password hash with `crypto::argon2::compare`.

> [!check]- Answer
> - Filter by `username = $username`.
> - Compare password using `crypto::argon2::compare(password, $pass)`.

---



### Exercise 2: SDK Signin Call Syntax

**Problem:** Write JS SDK call signing in to access scope `user_access` with username and password.

**Expected output:**
```text
await db.signin({ access: "user_access", ns: "main", db: "app", username: "alice", pass: "secret" });
```

> [!check]- Answer
> ```javascript
> await db.signin({ access: "user_access", ns: "main", db: "app", username: "alice", pass: "secret" });
> ```
>
> **Explanation:** `db.signin()` authenticates clients against defined RECORD access scopes.

### Exercise 3: SDK Signup Call Syntax

**Problem:** Write JS SDK call signing up a new user via access scope `user_access`.

**Expected output:**
```text
await db.signup({ access: "user_access", ns: "main", db: "app", email: "a@b.com", pass: "secret" });
```

> [!check]- Answer
> ```javascript
> await db.signup({ access: "user_access", ns: "main", db: "app", email: "a@b.com", pass: "secret" });
> ```
>
> **Explanation:** `db.signup()` invokes the RECORD access `SIGNUP` query block.

## 7. Related Terms
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Parent access setup.
- [JWT Token-Based Auth](jwt_auth.md) — Token generated after `SIGNUP` / `SIGNIN`.
- [`$auth` Variable](auth_variable.md) — The bound context variable after successful login.

---

## 8. Key Takeaways
- `SIGNUP` executes `CREATE` statements to register new user records.
- `SIGNIN` executes `SELECT` queries to locate and verify credentials.
- Both clauses must evaluate to a valid record for SurrealDB to issue an authentication JWT.
