# `pg_hba.conf` (Host-Based Authentication)

> **Level 10 — Administration, Security & Production**
> PostgreSQL's host-based authentication configuration file that acts as an internal network firewall, controlling which clients can connect to which databases from specific IP addresses using defined authentication methods.

---

## 1. Prerequisites
- [Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)](roles_permissions.md) — The login roles validated by pg_hba.conf.

---

## 2. Term Category
- **PostgreSQL Configuration File**

---

## 3. Environment Context
- **PostgreSQL Server Configuration** (Stored in the database server's data directory. Changing this file requires reloading the PostgreSQL server configuration (`pg_ctl reload` or `SELECT pg_reload_conf()`) to take effect).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, PostgreSQL is configured to be highly secure on your local machine: it only allows connections from `localhost` (127.0.0.1).

However, when you deploy PostgreSQL to a production cloud server:
-   Your web application servers reside on different IP addresses and must connect to the database over the network.
-   If you open the default port `5432` to the public internet, malicious bots will immediately start brute-forcing your passwords.

We designed the **`pg_hba.conf`** (Host-Based Authentication) file to serve as a built-in firewall. 

Before checking password databases or starting connection slots, Postgres reads `pg_hba.conf` from top to bottom. 

If a client's IP address or username does not match a rule in the file, Postgres terminates the connection instantly, preventing brute-force attacks and securing remote connections.

---

### (2) The Rule Record Format
Each line in `pg_hba.conf` defines a rule with five core parameters:
`TYPE   DATABASE   USER   ADDRESS   METHOD`

1.  **`TYPE`:** How the client connects.
    -   `local`: Unix-domain sockets (local machine console logins).
    -   `host`: TCP/IP network connections (IPv4 or IPv6).
2.  **`DATABASE`:** Which database. Can be a specific name, `all`, or `replication`.
3.  **`USER`:** Which role. Can be a specific user role, `all`, or prefixed with `+` for group memberships.
4.  **`ADDRESS`:** The client IP range in CIDR notation (e.g. `10.0.0.0/8` for private AWS VPC networks). Omitted for `local` socket types.
5.  **`METHOD`:** How the client must authenticate:
    -   **`scram-sha-256`:** Modern, secure encrypted password authentication (The industry standard).
    -   **`md5`:** Legacy encrypted password auth.
    -   **`trust`:** Allows connection **without a password** (extremely dangerous, only use for local sockets).
    -   **`reject`:** Blocks connections matching this rule immediately.

---

### (3) Reality Metaphor
Imagine a gated corporate laboratory building:
-   The network port `5432` is the open front gate.
-   **`pg_hba.conf`** is the **Security Guard's Clipboard** at the gate.
-   When a visitor arrives, the guard checks the clipboard sheet from top to bottom:
    -   *"Where are you coming from?"* (Address check).
    -   *"Which lab door are you trying to enter?"* (Database check).
    -   *"What is your name?"* (User check).
    -   *"Show me your badge credentials."* (Method check).
-   If no line on the clipboard matches the visitor's details, the guard turns them away immediately.

---

### (4) Code Examples

#### Typical Production pg_hba.conf Rules
```text
# TYPE    DATABASE        USER            ADDRESS                 METHOD

# 1. Local Unix sockets: trust local terminal users completely
local     all             all                                     trust

# 2. Local loopback TCP: require secure password
host      all             all             127.0.0.1/32            scram-sha-256

# 3. Private network: allow web app servers inside the 10.0.0.0 network
host      production_db   app_user        10.0.0.0/16             scram-sha-256

# 4. Block all other connections explicitly (Postgres does this by default if no rules match)
host      all             all             0.0.0.0/0               reject
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Setting the METHOD to 'trust' for remote network connection IP ranges

**The mistake:** Adding the rule `host all all 0.0.0.0/0 trust` to resolve connection errors.

**Why it's wrong:** The keyword `trust` instructs PostgreSQL to completely bypass password checks. 

By setting it to `0.0.0.0/0` (which represents the entire public internet), anyone in the world can connect to your database as the `postgres` superuser without entering any password, giving them full control over your database.

**Fix: Never use `trust` for network `host` rules. Always use `scram-sha-256` for password validation, and restrict the IP `ADDRESS` column strictly to your application's private IP subnets.**

---



### Mistake 2: Using `trust` Authentication Method in Remote `pg_hba.conf` Configuration Rules

**The mistake:** Configuring `host all all 0.0.0.0/0 trust` in `pg_hba.conf`.

**Why it's wrong:** `trust` authentication allows ANY remote client to connect as ANY user (including superuser `postgres`) WITHOUT supplying a password! Use `scram-sha-256`.

*Incorrect:*
```sql
host all all 0.0.0.0/0 trust -- 💥 Anyone can connect without password!
```

*Fix:*
```sql
host all all 0.0.0.0/0 scram-sha-256 -- Password authentication required
```

### Mistake 3: Placing Broad Catch-All Rules Before Specific Subnet Rules in `pg_hba.conf`

**The mistake:** Placing `host all all 0.0.0.0/0 trust` at line 1 of `pg_hba.conf`.

**Why it's wrong:** PostgreSQL processes `pg_hba.conf` rules sequentially from TOP TO BOTTOM and applies the FIRST matching rule! Place specific IP subnet rules before broad fallback rules.

*Incorrect:*
```sql
// Placing 0.0.0.0/0 broad rule at top of file
```

*Fix:*
```sql
Place restrictive specific IP rules at top; broad fallback rules at bottom
```

## 6. Practice Exercises

### Exercise 1: Config Rule Design

**Problem:** You are deploying a PostgreSQL server. Your web server resides at IP address `192.168.1.45`. The web server needs to connect to the database `store_db` using the role `store_app`. 

Write the exact line that you must append to `pg_hba.conf` to authorize this connection securely using scram passwords.

**Expected output:**
> [!check]- Answer
> ```text
> host    store_db    store_app    192.168.1.45/32    scram-sha-256
> ```
> - A single IP address in CIDR notation uses the subnet mask `/32`.
> - Order the columns correctly: Type, Database, User, Address, Method.

---



### Exercise 2: Configuring Secure pg_hba.conf Entry

**Problem:** Write `pg_hba.conf` line granting `app_user` access to `prod_db` from `10.0.1.0/24` subnet using `scram-sha-256`.

**Expected output:**
> [!check]- Answer
> ```text
> host prod_db app_user 10.0.1.0/24 scram-sha-256
> ```
> ```text
> host prod_db app_user 10.0.1.0/24 scram-sha-256
> ```
>
> **Explanation:** `pg_hba.conf` rules specify connection type, database, user, address subnet, and authentication method.

---

### Exercise 3: Reloading pg_hba.conf Configuration

**Problem:** SQL command reloading `pg_hba.conf` without restarting PostgreSQL server (`SELECT pg_reload_conf();`).

**Expected output:**
> [!check]- Answer
> ```text
> SELECT pg_reload_conf();
> ```
> ```sql
> SELECT pg_reload_conf();
> ```
>
> **Explanation:** `pg_reload_conf()` reloads configuration files without interrupting active client connections.

## 7. Related Terms
- [Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)](roles_permissions.md) — The login roles checked.
- [`postgresql.conf` (Server Configuration)](postgresql_conf.md) — General connection settings.

---

## 8. Key Takeaways
- `pg_hba.conf` manages network connection authentication in PostgreSQL.
- Evaluates rules from top to bottom, applying the first matching configuration.
- Columns list Type (local/host), Database, User, Client IP, and Auth Method.
- `scram-sha-256` is the standard, secure password verification method.
- `trust` bypasses password checks; never use it for remote internet addresses.
- Restrict IP address columns strictly to your private server network brackets.
- Re-run configuration reload commands to activate modifications to the file.
