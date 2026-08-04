# `DEFINE SCOPE` (Auth Scopes Overview)

> **Level 4 — Schema Definition & Constraints**
> The DDL (Data Definition Language) statement in SurrealDB used to configure client authentication scopes, defining session token durations (`SESSION`), custom registration queries (`SIGNUP`), and login verification queries (`SIGNIN`) directly at the database layer.

---

## 1. Prerequisites
- [`DEFINE TABLE`](define_table.md) — The user table context.
- [Namespace & Database](../level_01/namespace_database.md) — The execution boundaries.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the authentication manager. Generates encrypted JWT session keys and binds authenticated user records to the global `$auth` variable).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional web architectures:
1.  The client browser connects to a backend API server (Node.js, Python).
2.  The backend server manages user sessions, queries the database, and returns data.
3.  This middleman layer exists because databases cannot authorize user permissions safely: giving a client direct access to PostgreSQL exposes the entire database.

We designed the **`DEFINE SCOPE`** statement in SurrealDB to eliminate this backend API middleman. 

Scopes define authentication zones directly inside the database. 

By writing signup and signin query scripts inside a scope, SurrealDB handles user registration, password validation, and JWT generation natively. 

The client connects directly to SurrealDB via WebSockets, authenticates against a scope, and queries data safely, restricted by the table's row-level permissions.

---

### (2) Key Scope Attributes
-   **`SESSION <duration>`:** Sets the expiration time for the client's JWT auth token (e.g. `SESSION 24h`).
-   **`SIGNUP <query>`:** The SurrealQL query that runs when a client signs up. It creates a record in the `user` table and hashes their password.
-   **`SIGNIN <query>`:** The query that runs when a user attempts to log in. It compares input details against the database and validates passwords.
-   **The `$auth` Variable:** Once authenticated, the user's record is bound to the `$auth` variable, which is referenced in row permissions (e.g. `WHERE id = $auth.id`).

---

### (3) Reality Metaphor (Hotel Check-in Kiosks)
Imagine guest access in a secure hotel:
-   **Traditional API:** A tourist booking rooms through a **Travel Agent**. 
    -   The agent checks availability, collects details, books the room, and hands over a key. 
    -   The guest never speaks directly to the hotel management.
-   **`DEFINE SCOPE` (Direct Web):** A **Self-Service Check-in Kiosk** in the lobby.
    -   **`SIGNUP` (Registration):** You type your name and scan your passport. The machine registers you.
    -   **`SIGNIN` (Verification):** You type your PIN. The machine prints a magnetic **Key Card** (JWT) with your name on the chip (`$auth`).
    -   You swipe this card directly at the elevator and room doors (row permissions) to gain access without asking the clerk.

---

### (4) Code Examples

#### Defining Auth Scopes in SurrealQL
Let's build a client authentication scope:

```sql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD password ON user TYPE string;

-- Define the authentication scope
DEFINE SCOPE user_scope
  SESSION 24h
  -- Signup logic (creates user and hashes password using Argon2)
  SIGNUP (
    CREATE user SET
      email = $email,
      password = crypto::argon2::generate($password)
  )
  -- Signin logic (verifies email and validates password hash)
  SIGNIN (
    SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $password)
  );
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Storing raw text passwords or using basic string comparisons in signin scripts, creating security vulnerabilities

**The mistake:** Writing a scope signin query as `SELECT * FROM user WHERE email = $email AND password = $password;` without password hashing comparison functions.

**Why it's wrong:** Storing and comparing passwords in raw text exposes user credentials to SQL injections and database leaks. 

SurrealDB's type validations require secure cryptographic helpers to verify hashed passwords.

**Fix: Always use the built-in `crypto::argon2::generate()` on signup and `crypto::argon2::compare()` on signin to secure user credentials:**

```sql
-- CORRECT SIGNIN PASSWORD CHECK
SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $password);
```

---



### Mistake 2: Defining Access Scopes Without Password Hashing Assertions

**The mistake:** Storing raw plain-text passwords in `SIGNUP` scope queries.

**Why it's wrong:** Scope signup handlers MUST hash passwords using `crypto::argon2::generate($pass)` before storing user records.

*Incorrect:*
```surrealql
DEFINE ACCESS user ON DATABASE TYPE RECORD SIGNUP (CREATE user SET pass = $pass); // ❌ Plain-text password!
```

*Fix:*
```surrealql
DEFINE ACCESS user ON DATABASE TYPE RECORD SIGNUP (CREATE user SET pass = crypto::argon2::generate($pass));
```

### Mistake 3: Comparing Passwords in `SIGNIN` Scopes Without Argon2 Verification

**The mistake:** Comparing `$pass = pass` in `SIGNIN` handlers when passwords were stored as Argon2 hashes.

**Why it's wrong:** Argon2 hashes must be verified using `crypto::argon2::compare(pass, $pass)`.

*Incorrect:*
```surrealql
-- Comparing plain-text $pass to hash
DEFINE ACCESS user ... SIGNIN (SELECT * FROM user WHERE email = $email AND pass = $pass); // ❌ Fails!
```

*Fix:*
```surrealql
DEFINE ACCESS user ... SIGNIN (SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass));
```

## 6. Practice Exercises

### Exercise 1: Scope Schema Design

**Problem:** Write the SurrealQL statement to define an auth scope named `admin_scope`.
-   Configure the token session duration to expire in `12h`.
-   Write a basic `SIGNIN` query that checks if the admin email matches `$email` and the password matches `$password` (use `crypto::argon2::compare`).
-   (Omit the `SIGNUP` block as admins are registered manually by root).

**Expected output:**
> [!check]- Answer
> ```sql
> DEFINE SCOPE admin_scope
>   SESSION 12h
>   SIGNIN (
>     SELECT * FROM admin WHERE email = $email AND crypto::argon2::compare(password, $password)
>   );
> ```
> - The scope configuration keyword is `DEFINE SCOPE`.
> - Enclose the `SIGNIN` query block in parentheses.

---



### Exercise 2: Record Access Scope Definition Syntax

**Problem:** Define RECORD access `user_access` on database for `user` table.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD ...
> ```
> ```surrealql
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD
>   SIGNUP (CREATE user SET email = $email, pass = crypto::argon2::generate($pass))
>   SIGNIN (SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass));
> ```
>
> **Explanation:** `DEFINE ACCESS ... TYPE RECORD` configures user authentication handlers.

---

### Exercise 3: Access Session Token Duration

**Problem:** Set DURATION on access scope to expire tokens after `1d` (1 day).

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD DURATION FOR SESSION 1d ...
> ```
> ```surrealql
> DEFINE ACCESS user_access ON DATABASE TYPE RECORD DURATION FOR SESSION 1d;
> ```
>
> **Explanation:** `DURATION FOR SESSION` specifies JWT token expiration times.

## 7. Related Terms

- [SurrealDB](../level_01/surrealdb.md)

---

## 8. Key Takeaways
- `DEFINE SCOPE` configures native client authentication inside SurrealDB.
- Bypasses the need for backend API servers for simple user signups and logins.
- `SESSION` defines JWT token expiration intervals (e.g. `24h`, `30d`).
- `SIGNUP` executes registration scripts; `SIGNIN` verifies credentials.
- Always use namespaced functions like `crypto::argon2::*` to hash and compare passwords.
- Validated connections return a JWT token, binding the user's ID to `$auth`.
- Row permissions check `$auth.id` to secure data access for direct client queries.
