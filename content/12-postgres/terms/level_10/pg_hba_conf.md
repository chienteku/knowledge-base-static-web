# `pg_hba.conf` (Host-Based Authentication)

> **Level 10 — Administration, Security & Production**
> PostgreSQL's host-based authentication configuration file that acts as an internal network firewall, controlling which clients can connect to which databases from specific IP addresses using defined authentication methods.

---

## 1. Prerequisites
- [Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)](roles_permissions.md) — The login roles validated by pg_hba.conf.
- [`postgresql.conf` (Server Configuration)](postgresql_conf.md) — PostgreSQL server configuration files.

---

## 2. Term Category

**Administration / Operations** (Host-Based Authentication Config): `pg_hba.conf` configures host-based client authentication rules, allowed IP ranges, and authentication methods (SCRAM-SHA-256, md5).



---

## 3. Explanation

### Environment Context
- **PostgreSQL Server Configuration** (Stored in the database server's data directory. Changing this file requires reloading the PostgreSQL server configuration (`pg_ctl reload` or `SELECT pg_reload_conf()`) to take effect).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Configuring Host-Based Client Authentication Rules

**Scenario:**
Configure `pg_hba.conf` to allow local IPv4 connections to database `store_db` for user `app_user` using `scram-sha-256`.

**Requirements:**
1. Code `pg_hba.conf` entry line.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> # TYPE  DATABASE        USER            ADDRESS                 METHOD
> host    store_db        app_user        192.168.1.0/24          scram-sha-256
> ```
>
> #### Technical Explanation
>
> 1. `pg_hba.conf` (Host-Based Authentication) defines network access security policies for the PostgreSQL server.
> 2. `host`: TCP/IP network connection.
> 3. `scram-sha-256`: Cryptographically strong salted password authentication method.
> 
---

### Exercise 2: Restricting Remote Admin Access to Localhost Only

**Scenario:**
Configure `pg_hba.conf` to restrict superuser `postgres` access exclusively to local Unix domain sockets (`local`).

**Requirements:**
1. Code `local` superuser access entry.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> # TYPE  DATABASE        USER            ADDRESS                 METHOD
> local   all             postgres                                peer
> host    all             postgres        127.0.0.1/32            scram-sha-256
> ```
>
> #### Technical Explanation
>
> 1. `local` uses Unix domain sockets local to the database server machine.
> 2. Restricting superuser `postgres` remote TCP access prevents remote brute-force administrative attacks.
> 3. Security hardening standard.
> 
---

### Exercise 3: Reloading Authentication Configuration without Server Restart

**Scenario:**
Reload modified `pg_hba.conf` rules without restarting the PostgreSQL server daemon using `pg_reload_conf()`.

**Requirements:**
1. Execute `SELECT pg_reload_conf()`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT pg_reload_conf();
> ```
>
> #### Technical Explanation
>
> 1. `pg_reload_conf()` sends a `SIGHUP` signal to the main `postgres` process to re-parse configuration files.
> 2. Applies new `pg_hba.conf` authentication rules online without interrupting active client connections.
> 3. Zero-downtime security administration.
> 
---



## 6. Related Terms
- [Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)](roles_permissions.md) — The login roles checked.
- [`postgresql.conf` (Server Configuration)](postgresql_conf.md) — General connection settings.

---

## 7. Key Takeaways
- `pg_hba.conf` manages network connection authentication in PostgreSQL.
- Evaluates rules from top to bottom, applying the first matching configuration.
- Columns list Type (local/host), Database, User, Client IP, and Auth Method.
- `scram-sha-256` is the standard, secure password verification method.
- `trust` bypasses password checks; never use it for remote internet addresses.
- Restrict IP address columns strictly to your private server network brackets.
- Re-run configuration reload commands to activate modifications to the file.
