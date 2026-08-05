# Connection String / DSN

> **Level 1 — What Is a Database?**
> A structured URI string (such as `postgresql://user:pass@host:5432/dbname`) that packs all necessary connection parameters—host, port, database name, username, and password—into a single address for client applications.

---

## 1. Prerequisites
- [Client-Server Model (in Databases)](client_server_model.md) — Understanding that client libraries require parameters to find database servers.
---

## 2. Term Category
- **Network Protocol Parameter**

---

## 3. Environment Context
- **Universal Standard** (Also known as a **DSN (Data Source Name)**. Adopted universally by database client drivers across JavaScript, Python, Go, and Java).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
To connect any client application (like a Node.js backend) to a PostgreSQL database server, the client driver must know five critical pieces of information:
1.  **Host:** Where is the server? (e.g., local machine `127.0.0.1` or a cloud address).
2.  **Port:** Which port is the server listening on? (usually `5432`).
3.  **Database Name:** Which database on the server do you want to open?
4.  **Username:** Who is logging in? (e.g., `postgres` or `admin`).
5.  **Password:** The security credential.

Historically, config files had separate keys for each variable. 

To simplify database configs, database engineers standardized on the **Connection String** format. 

By packing all these variables into a single, standardized URL-like structure, you can pass a single string to any database program to instantly authenticate and connect.

---

### (2) The URI Template
The standard PostgreSQL connection string schema follows this format:

```text
postgresql://[user]:[password]@[host]:[port]/[database_name]?sslmode=require
```

-   **`postgresql://`**: The protocol scheme.
-   **`sslmode=require`**: An optional query parameter telling the client to encrypt the connection.

---

### (3) Reality Metaphor
Imagine mailing an overseas package:
-   Instead of sending the shipping label in pieces (writing the zipcode in one document, the gate code on a post-it note, and the name in a text message), you write a single, standardized delivery block:
    `Recipient Name, Street Address, Apartment #, City, Zip Code`
    
A connection string is this exact address label format, customized for network computers to locate databases.

---

### (4) Code Examples

#### Connecting in Node.js (pg client library)
Instead of passing complex config objects, you simply pass the connection string directly:

```javascript
const { Pool } = require('pg');

// Single connection string config
const connectionString = 'postgresql://db_user:mySuperPassword123@db-server.host.com:5432/my_app_prod';

const pool = new Pool({
  connectionString: connectionString,
});
```

#### Connecting in Terminal using `psql`
You can pass the string to `psql` to connect instantly:

```bash
psql "postgresql://postgres:secret123@localhost:5432/postgres"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to URL-encode special characters in passwords

**The mistake:** Using characters like `@`, `#`, `/`, or `:` in your database password without encoding them inside the connection string:

```text
/* BAD: The parser thinks the '@' in the password marks the host start! */
postgresql://admin:pass@word@localhost:5432/my_db
```

**Why it's wrong:** The connection string is a URI. Symbols like `@` are reserved characters used to separate parts of the address (username/password from host/port). If your password contains `@`, the parser gets confused, splits the string in the wrong place, and throws a login or connection failure.

**Fix: Always URL-encode special characters (e.g., replace `@` with `%40`, `#` with `%23`, `:` with `%3A`).**

```text
/* CORRECT: Encoded password symbol */
postgresql://admin:pass%40word@localhost:5432/my_db
```

---



### Mistake 2: Embedding Special Un-Escaped Password Characters in PostgreSQL Connection URIs

**The mistake:** Using password `P@ss#123` in `postgresql://user:P@ss#123@localhost:5432/app`.

**Why it's wrong:** Special characters (`@`, `:`, `/`, `#`) break URI string parsing. Percent-encode special password characters using `encodeURIComponent()` (`P%40ss%23123`).

*Incorrect:*
```sql
postgresql://user:P@ss#123@localhost:5432/app -- ❌ URI parse error!
```

*Fix:*
```sql
postgresql://user:P%40ss%23123@localhost:5432/app -- Percent-encoded URI password
```

### Mistake 3: Omitting `sslmode=require` in Production Cloud Database Connection Strings

**The mistake:** Connecting to cloud managed PostgreSQL databases without specifying SSL connection modes.

**Why it's wrong:** Un-encrypted TCP connection strings transmit database credentials and queries over public networks in plain text. Use `sslmode=require` or `sslmode=verify-full`.

*Incorrect:*
```sql
postgresql://user:pass@db.cloud.com:5432/production -- ❌ Plaintext connection!
```

*Fix:*
```sql
postgresql://user:pass@db.cloud.com:5432/production?sslmode=require
```

## 6. Practice Exercises

### Exercise 1: Connection String Construction

**Problem:** You are deploying a web application. Your cloud database details are:
-   Database Host: `db-instance.neon.tech`
-   Port: `5432`
-   Database Name: `users_db`
-   Username: `webapp_user`
-   Password: `p@ss#word` (Note the special characters `@` and `#`!)

Construct the correct, URL-safe connection string to connect your application. Refer to standard URL encoding tables: `@` is `%40`, `#` is `%23`.

**Expected output:**
> [!check]- Answer
> ```text
> postgresql://webapp_user:p%40ss%23word@db-instance.neon.tech:5432/users_db
> ```
> - Start with the scheme `postgresql://`.
> - URL-encode the special characters in the password.
> - Assemble the parts using `@`, `:`, and `/` separators.

---



### Exercise 2: Constructing Standard Connection URI

**Problem:** Construct PostgreSQL URI connecting user `app_user` with password `secret` to database `prod` on host `db.example.com`.

**Expected output:**
> [!check]- Answer
> ```text
> postgresql://app_user:secret@db.example.com:5432/prod?sslmode=require
> ```
> ```text
> postgresql://app_user:secret@db.example.com:5432/prod?sslmode=require
> ```
>
> **Explanation:** Standard PostgreSQL URIs specify scheme, user, password, host, port, database, and query options.

---

### Exercise 3: PostgreSQL URI Schemes

**Problem:** List 2 valid connection URI schemes for PostgreSQL (`postgres://`, `postgresql://`).

**Expected output:**
> [!check]- Answer
> ```text
> postgres://, postgresql://
> ```
> ```text
> postgres://, postgresql://
> ```
>
> **Explanation:** Both `postgres://` and `postgresql://` schemes are supported by standard client drivers.

## 7. Related Terms
- [Client-Server Model (in Databases)](client_server_model.md) — The network structure.
- [`psql` (Interactive Terminal)](psql.md) — Connects using connection strings.
- [pgAdmin & GUI Tools](pgadmin.md) — Related concept: pgAdmin & GUI Tools.
---

## 8. Key Takeaways
- A connection string is a single URI address containing all database credentials.
- Standard syntax: `postgresql://user:password@host:port/database`.
- DSN (Data Source Name) is another common name for a connection string.
- You must URL-encode special symbols in passwords (like `@` becoming `%40`).
- Database client drivers accept this string directly to initiate server handshakes.
