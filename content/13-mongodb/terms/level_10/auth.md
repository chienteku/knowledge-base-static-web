# Authentication & Authorization (SCRAM, RBAC)

> **Level 10 — Administration, Security & Advanced Features**
> MongoDB's security model combining cryptographic identity verification (SCRAM) with Role-Based Access Control (RBAC) to enforce database access restrictions at the server level, comparing these to relational permissions.

---

## 1. Prerequisites

- [Database (MongoDB Context)](../level_01/database_context.md) — The `mongod` process.
- [Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)](../../../12-postgres/terms/level_10/roles_permissions.md) — Relational security models.

---

## 2. Term Category

**Administration / Operations** (Authentication & Role-Based Access Control): Authentication & Authorization enforce user identity verification (SCRAM-SHA-256, x.509, LDAP) and Role-Based Access Control (RBAC) privilege management across MongoDB databases.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Managed at the server engine level. Enforced only when the `mongod` process is launched with the security authentication flag enabled).

### (1) Design Motivation — "Why did we design this?"
By default, a clean local installation of MongoDB has security **disabled**. 

Anyone who can access the database port (27017) can read, write, or drop collections anonymously. 

If you deploy this setup to a cloud server, automated scanners will locate your database in minutes, copy your files, wipe your disk, and leave a ransom note.

To secure databases, we design two defenses:
1.  **Authentication (Identity Verification):** Confirming *who* is trying to connect.
2.  **Authorization (Permissions Enforcement):** Restricting *what* that verified user is allowed to do.

We designed **SCRAM** and **RBAC** to enforce these defenses natively. 

Clients authenticate securely using cryptographic handshakes. 

Once authenticated, they are assigned **Roles** (like read-only or read/write) that define their permissions, preventing junior developers or compromise credentials from exposing critical admin tables.

---

### (2) The Two Security Pillars

#### 1. SCRAM (Authentication Protocol)
Stands for **Salted Challenge Response Authentication Mechanism**.
-   *How it works:* The default mechanism (SCRAM-SHA-256) verifies a user's credentials using cryptographically hashed handshakes. 
-   The client and server prove to each other that they know the password without ever sending the raw password string over the network.

#### 2. RBAC (Authorization Model)
Stands for **Role-Based Access Control**.
-   Instead of granting permissions directly to individual users, you assign users to **Roles** (which represent collections of privileges).
-   *Built-in Roles:*
    -   `read`: Read-only access to collections.
    -   `readWrite`: Full CRUD access on a database.
    -   `dbAdmin`: Manage index builds and view diagnostics.
    -   `root`: Superuser access to all databases and configuration settings.

---

### (3) Reality Metaphor (Hotel Security)
Imagine checking into a secure hotel:
-   **Authentication (SCRAM):** Handing your physical Passport to the front desk receptionist. 
    -   They check your face photo, verify your credit card signature, and hand you a Key Card. (Proves who you are).
-   **Authorization (RBAC):** The Key Card holds access levels:
    -   **Guest Role:** Opens room 305 and the gym. It blocks you from entering the kitchen.
    -   **Janitor Role:** Opens all maintenance rooms and hallways, but not guest safes.
    -   **Hotel Manager Role (root):** Master key card that opens every door in the building.

---

### (4) Code Examples

#### Creating a Admin User in mongosh
To configure security, you connect standalone locally first, create an administrator user inside the reserved `admin` database, and then restart the server with authentication enabled:

```javascript
// 1. Switch to the admin database
use admin;

// 2. Create the root administrator user
db.createUser({
  user: "siteAdmin",
  pwd: "superSecretPassword123", // Strong password!
  roles: [ { role: "root", db: "admin" } ] // Assign the superuser root role
});
```

#### Launching the Server with Security
After creating the user, you must start the `mongod` process with authentication enabled:

```bash
# Start mongod via terminal with the auth flag enabled:
mongod --auth --dbpath /data/db
```

Now, any client connecting must provide credentials to query data.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating database users but launching the 'mongod' process without the '--auth' flag enabled in production configs

**The mistake:** Setting up users and roles in your script, but starting `mongod` using `mongod --dbpath /data/db` (omitting `--auth` or skipping the `security.authorization` flag in the config file).

**Why it's wrong:** If the server is started without the authentication flag, MongoDB **ignores all user credentials and roles**. 

Anyone can connect anonymously as a root administrator, bypassing your security settings.

**Fix: Always ensure your production startup configuration files (e.g. `/etc/mongod.conf`) explicitly enable authorization checks:**

```yaml
# /etc/mongod.conf
security:
  authorization: enabled
```

---



### Mistake 2: Assigning `root` Superuser Roles to Application Services

**The mistake:** Connecting production web apps using database superuser account `root`.

**Why it's wrong:** Assigning `root` privileges permits compromised application servers to drop databases or manipulate administrative security settings. Use Least Privilege principle.

*Incorrect:*
```javascript
mongodb://root:rootpass@localhost:27017/app // ❌ Excessive root privileges!
```

*Fix:*
```javascript
Create targeted user with readWrite role on app database only: { role: "readWrite", db: "app" }
```

### Mistake 3: Configuring SCRAM-SHA-1 Instead of SCRAM-SHA-256 for Password Authentication

**The mistake:** Configuring legacy SCRAM-SHA-1 authentication mechanisms in new deployments.

**Why it's wrong:** SCRAM-SHA-256 provides stronger cryptographic hashing for password authentication. Use SCRAM-SHA-256.

*Incorrect:*
```javascript
// Using legacy SCRAM-SHA-1 auth mechanism
```

*Fix:*
```javascript
Use SCRAM-SHA-256 as default authentication mechanism
```

## 5. Practice Exercises

### Exercise 1: Creating Administrative Database Users with Roles

**Scenario:**
Create an admin user `dbAdminUser` with `userAdminAnyDatabase` and `readWriteAnyDatabase` privileges.

**Requirements:**
1. Execute `db.createUser()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> use admin;
> db.createUser({
>   user: "dbAdminUser",
>   pwd: "SecurePassword123!",
>   roles: [
>     { role: "userAdminAnyDatabase", db: "admin" },
>     { role: "readWriteAnyDatabase", db: "admin" }
>   ]
> });
> ```
>
> #### Technical Explanation
>
> 1. `db.createUser()` registers database authentication credentials.
> 2. `userAdminAnyDatabase` grants permission to manage users and roles across all databases.
> 3. Credentials are hashed using SCRAM-SHA-256.

---

### Exercise 2: Creating Application-Scoped ReadWrite Roles

**Scenario:**
Create an application service account `appService` restricted to `readWrite` access on database `store_db`.

**Requirements:**
1. Execute `db.createUser()` on `store_db`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> use store_db;
> db.createUser({
>   user: "appService",
>   pwd: "AppServiceSecretPass456!",
>   roles: [
>     { role: "readWrite", db: "store_db" }
>   ]
> });
> ```
>
> #### Technical Explanation
>
> 1. Restricting roles to specific database targets enforces the Principle of Least Privilege.
> 2. `appService` cannot read or write to other databases or execute cluster administration commands.
> 3. Security best practice.

---

### Exercise 3: Enabling Authentication in `mongod.conf`

**Scenario:**
Configure `mongod.conf` to enforce mandatory client authentication across all database connections.

**Requirements:**
1. Enable `security.authorization: "enabled"`.

> [!check]- Answer
>
> #### Implementation
>
> ```yaml
> # /etc/mongod.conf
> security:
>   authorization: enabled
> ```
>
> #### Technical Explanation
>
> 1. Setting `security.authorization: enabled` enforces RBAC checks for all client connections.
> 2. Rejects unauthenticated connections immediately.
> 3. Essential production database hardening setting.

---



## 6. Related Terms

- [Connection String URI](connection_string.md) — Authentication connection strings.
- [NoSQL Injection](nosql_injection.md) — Input validation security.

---

## 7. Key Takeaways
- SCRAM verifies client passwords cryptographically without sending raw text.
- RBAC grants database access privileges using structured roles.
- Built-in roles include `read`, `readWrite`, `dbAdmin`, and `root`.
- Default MongoDB installations have security checks disabled.
- Launch `mongod` with `--auth` (or config `authorization: enabled`) to lock down access.
- Always create a root user in the `admin` database first before enabling auth.
- Standard clients must connect to target databases with valid SCRAM credentials.
