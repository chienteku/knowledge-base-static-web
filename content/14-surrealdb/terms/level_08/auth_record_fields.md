# `$auth.id` vs `$auth.*` (Accessing Auth Record Fields)

> **Level 8 — Authentication, Permissions & Security**
> Understanding how SurrealDB exposes all fields of the logged-in user record through `$auth`, enabling attribute-based access control (ABAC) without secondary queries.

---

## 1. Prerequisites

- [`$auth` Variable](auth_variable.md) — The built-in authenticated user variable.
- [`PERMISSIONS` Clause (Table & Field Level)](permissions_clause.md) — Row-level security rules.

---

## 2. Term Category


**Authentication & Permissions (authenticated user record fields)**: - **Security & Authorization**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional authorization (RBAC/ABAC), checking whether a user has access to a resource requires two pieces of information:
1. The user's ID (`$auth.id`).
2. The user's role, team, tenant, or subscription status (e.g. `user.role`, `user.organization_id`).

In SQL databases with Row-Level Security, checking `$auth.role` often forces a subquery or join against the `users` table for every single evaluated row, severely hurting query throughput.

SurrealDB solves this by making the **entire record object** available under `$auth`. Because `$auth` is the actual record in memory (e.g. `{ id: user:tobie, role: 'admin', organization: org:acme, plan: 'enterprise' }`), you can directly reference any property `$auth.role`, `$auth.organization`, or `$auth.plan` in your `PERMISSIONS` clauses instantly without secondary table lookups.

### (2) Reality Metaphor
Imagine a high-security facility ID card:
- Rather than just printing an account number on the badge (`$auth.id`), the badge features a smart chip containing your assigned department (`$auth.department`), security clearance (`$auth.clearance`), and office location (`$auth.office`).
- Security turnstiles read the chip instantly (`$auth.clearance >= 3`) without needing to call central HR every time you open a door.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Attribute-Based Access Control (ABAC) using $auth.tenant and $auth.role
DEFINE TABLE ticket PERMISSIONS
    FOR select WHERE tenant = $auth.tenant
    FOR delete WHERE tenant = $auth.tenant AND $auth.role = 'admin';
```

#### Fuller Example
```surrealql
-- 1. User table with custom properties
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD role ON user TYPE string DEFAULT 'member';
DEFINE FIELD team ON user TYPE record<team>;
DEFINE FIELD is_verified ON user TYPE bool DEFAULT false;

-- 2. Project table restricted by user's verified status and team membership
DEFINE TABLE project SCHEMAFULL
    PERMISSIONS
        FOR select WHERE team = $auth.team AND $auth.is_verified = true
        FOR create WHERE team = $auth.team AND ($auth.role = 'lead' OR $auth.role = 'admin')
        FOR update WHERE team = $auth.team AND ($auth.role = 'admin' OR owner = $auth.id);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Querying the User Table inside PERMISSIONS to check a user field

**The mistake:** Writing a subquery `(SELECT role FROM user WHERE id = $auth.id)` inside a `PERMISSIONS` clause.

**Why it's wrong:** This causes redundant subquery evaluation for every scanned row. `$auth.role` already contains the user's role directly in memory.

*Incorrect:*
```surrealql
DEFINE TABLE document PERMISSIONS
    FOR select WHERE (SELECT role FROM user WHERE id = $auth.id)[0].role = 'admin';
```

*Fix:*
```surrealql
DEFINE TABLE document PERMISSIONS
    FOR select WHERE $auth.role = 'admin';
```

---



### Mistake 2: Storing Un-Hashed Plaintext Passwords in User Records

**The mistake:** Writing `CREATE user SET email = $email, pass = $pass;` in `SIGNUP` scope clauses.

**Why it's wrong:** Storing un-hashed passwords exposes user credentials if the table is compromised. Always hash passwords using `crypto::argon2::generate($pass)`.

*Incorrect:*
```surrealql
DEFINE ACCESS user ON DATABASE TYPE RECORD SIGNUP (CREATE user SET pass = $pass); // ❌ Plaintext password!
```

*Fix:*
```surrealql
DEFINE ACCESS user ON DATABASE TYPE RECORD SIGNUP (CREATE user SET pass = crypto::argon2::generate($pass));
```

### Mistake 3: Comparing Hashes using Standard Equality Operators in `SIGNIN`

**The mistake:** Writing `WHERE email = $email AND pass = crypto::argon2::generate($pass)` in `SIGNIN` clauses.

**Why it's wrong:** Regenerating an Argon2 hash yields a new random salt string! Comparing generated hashes with stored hashes using `=` fails. Use `crypto::argon2::compare(pass, $pass)`.

*Incorrect:*
```surrealql
DEFINE ACCESS user ... SIGNIN (SELECT * FROM user WHERE email = $email AND pass = crypto::argon2::generate($pass)); // ❌ Fails!
```

*Fix:*
```surrealql
DEFINE ACCESS user ... SIGNIN (SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass));
```





## 5. Practice Exercises

### Exercise 1: Secure Password Hashing with Argon2

**Scenario:**
You are building a user registration table where user passwords must be hashed securely using Argon2 before storing in table `user`.

**Requirements:**
1. Define table `user` as `SCHEMAFULL`.
2. Define field `password` as `string`.
3. Create user `user:alice` hashing password using `crypto::argon2::generate($pass)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD username ON TABLE user TYPE string;
> DEFINE FIELD password ON TABLE user TYPE string;
> 
> CREATE user:alice SET 
>     username = "alice",
>     password = crypto::argon2::generate("MySecretPassword123!");
> ```
>
> #### Technical Explanation
>
> 1. `crypto::argon2::generate(secret)` hashes plaintext passwords using the password-hashing algorithm Argon2id.
> 2. Automatically generates random cryptographic salts to prevent rainbow table attacks.
> 3. Hashes passwords at the database engine tier during record creation.
> 
---

### Exercise 2: Validating Passwords with Argon2 Compare

**Scenario:**
Write a `SIGNIN` query for a `RECORD` access method that compares an incoming login password `$pass` against stored hash `password`.

**Requirements:**
1. Use `crypto::argon2::compare(password, $pass)` inside `SIGNIN`.

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
> 1. `crypto::argon2::compare(hash, secret)` verifies plaintext password inputs against stored Argon2 hashes.
> 2. Returns boolean `true` if credentials match, issuing a valid authentication token.
> 3. Protects authentication checks against timing side-channel attacks.
> 
---

### Exercise 3: Protecting Password Fields with PERMISSIONS

**Scenario:**
Restrict access to field `password` on table `user` so that no client (even the account owner) can select or read raw password hashes.

**Requirements:**
1. Apply `PERMISSIONS FOR select NONE` to field `password`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE FIELD password ON TABLE user TYPE string 
>     PERMISSIONS FOR select NONE;
> ```
>
> #### Technical Explanation
>
> 1. `PERMISSIONS FOR select NONE` redacts field values from all `SELECT` query results.
> 2. Prevents password hashes from leaking in client-side API response payloads.
> 3. Enforces field-level security independently from table read permissions.
> 
---





## 6. Related Terms

- [`$auth` Variable](auth_variable.md) — The parent authenticated user variable.
- [`PERMISSIONS` Clause (Table & Field Level)](permissions_clause.md) — Table and field level permission rules.
- [`$session` / `$token` Variables](session_token_variables.md) — Token and session attributes.

---

## 7. Key Takeaways
- `$auth` is not just an ID string; it is the complete user record object.
- Any field on the user record (`$auth.role`, `$auth.tenant`, `$auth.plan`) is accessible directly.
- Enables high-performance Attribute-Based Access Control (ABAC) without secondary table joins.
