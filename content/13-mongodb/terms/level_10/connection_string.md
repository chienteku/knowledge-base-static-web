# Connection String URI

> **Level 10 — Administration, Security & Advanced Features**
> The standardized URI format used by application drivers and clients to connect to a MongoDB deployment, comparing the standard `mongodb://` protocol with the DNS seed list `mongodb+srv://` protocol.

---

## 1. Prerequisites
- [Database Context (Running processes)](../level_01/database_context.md) — The target `mongod` port.
- [Authentication & Authorization (SCRAM, RBAC)](auth.md) — Credentials validation.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **Universal Standard** (Supported across all MongoDB drivers, shell environments, and GUI clients like MongoDB Compass. Managed via client connection initialization).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
To connect your backend application (or a dashboard like Compass) to a database, you must supply connection configuration details:
-   Database server hostnames and ports.
-   Login usernames and passwords.
-   Target database name.
-   Connection parameters (like timeouts, replica set names, or write concerns).

Passing these parameters as separate arguments in your application code is hard to manage.

We designed the **Connection String URI** to compile all database connection settings into a single, standardized text string. 

Drivers parse this string to establish connection pools and routing rules automatically.

---

### (2) The Two URI Protocols

```mermaid
graph TD
    A["Connection Protocols"] --> B["Standard URI: 'mongodb://'"]
    A --> C["DNS Seed List URI: 'mongodb+srv://'"]
    
    B --> B1["Lists all replica set member IPs manually"]
    B --> B2["Long, hard-coded string; needs update if nodes change"]
    
    C --> C1["Points to a single DNS SRV record"]
    C --> C2["Short, clean string; resolves member IPs dynamically"]
```

#### 1. Standard Protocol (`mongodb://`)
The traditional format where you list every replica set member IP address manually:
`mongodb://user:pass@host1:27017,host2:27017,host3:27017/dbname?replicaSet=myRepl`
-   *Cons:* If you add a new secondary server or change IP addresses, you must update the connection string in all application configuration files.

#### 2. DNS Seed List Protocol (`mongodb+srv://`)
A modern, cleaner protocol introduced in MongoDB 3.6. 
-   *How it works:* You point the connection string to a single DNS SRV record:
    `mongodb+srv://user:pass@cluster.example.com/dbname`
-   The client driver queries the DNS server to retrieve the active list of replica set node IPs dynamically.
-   *Pros:* If a database administrator adds, removes, or modifies nodes in the cluster, you do **not** need to update your application code connection strings.

---

### (3) Reality Metaphor (Mailing Addresses)
Imagine shipping mail to a business office:
-   **Standard `mongodb://`:** Writing a detailed routing label listing every worker's desk: *"Deliver this package to desk 1, desk 2, and desk 3 on Floor 4 of Building A."* 
    -   If a worker moves desks, the routing label is incorrect.
-   **DNS Seed List `mongodb+srv://`:** Writing a simple PO Box pointer: *"Deliver to Suite 450."* 
    -   The mail room receptionist dynamically resolves Suite 450 to the correct employee desk numbers. 
    -   If workers change desks, they update the directory at the lobby desk; the mail label stays exactly the same.

---

### (4) Code Examples

#### Standard vs. SRV Connection Strings
Compare the two formats:

```javascript
// 1. Standard Replica Set URI (with auth database override)
const standardUri = "mongodb://siteAdmin:myPassword@node1.com:27017,node2.com:27017/shop?authSource=admin&replicaSet=myRS";

// 2. DNS Seed List URI (Atlas standard, clean and dynamic)
const srvUri = "mongodb+srv://siteAdmin:myPassword@cluster0.abcde.mongodb.net/shop?retryWrites=true&w=majority";
```

-   **`authSource=admin`:** Tells MongoDB that the user credentials reside in the reserved `admin` database, even though the query target is the `shop` database.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Failing to URL-encode special characters (like '@' or '/') inside database passwords, causing connection parser crashes

**The mistake:** Setting a user password to `"P@ss/word!"` and writing the URI string as `mongodb://user:P@ss/word!@host:27017/db`.

**Why it's wrong:** The connection parser splits the string using `@` and `/` characters as delimiters. 

If your password contains these characters un-escaped, the parser will mistake the password for the hostname separator, throw connection parsing errors, or fail to authenticate.

**Fix: Always URL-encode special characters inside passwords (e.g. converting `@` to `%40`, and `/` to `%2F`):**

```javascript
// CORRECT (P@ss/word! is encoded to P%40ss%2Fword%21)
const uri = "mongodb://user:P%40ss%2Fword%21@host:27017/db";
```

---



### Mistake 2: Embedding Un-Escaped Special Characters in Connection String Passwords

**The mistake:** Using password `P@ss#123` inside connection URI `mongodb://user:P@ss#123@localhost:27017`.

**Why it's wrong:** Special characters (`@`, `:`, `/`, `#`) break URI string parsing. Percent-encode passwords containing special characters (`encodeURIComponent`).

*Incorrect:*
```javascript
mongodb://user:P@ss#123@localhost:27017/db // ❌ URI parse error!
```

*Fix:*
```javascript
mongodb://user:P%40ss%23123@localhost:27017/db // Percent-encoded special characters
```

### Mistake 3: Using `mongodb://` Connection Scheme for Multi-Node DNS Seedlists Instead of `mongodb+srv://`

**The mistake:** Connecting to MongoDB Atlas using `mongodb://` scheme without listing all seedlist replica nodes.

**Why it's wrong:** Atlas utilizes DNS seedlists requiring `mongodb+srv://` scheme for automatic node discovery and TLS configuration.

*Incorrect:*
```javascript
mongodb://cluster0.mongodb.net/app // ❌ SRV seedlist requires mongodb+srv:// scheme!
```

*Fix:*
```javascript
mongodb+srv://user:pass@cluster0.mongodb.net/app // Correct SRV scheme for Atlas
```

## 6. Practice Exercises

### Exercise 1: Connection URI Construction

**Problem:** Construct the standard connection string URI for the following database credentials:
-   Username: `"worker"`
-   Password: `"pass123"`
-   Hosts: `"db-01:27017"` and `"db-02:27017"`
-   Replica Set name: `"prodRS"`
-   Target Database: `"inventory"`
-   Authentication database source: `"admin"`

**Expected output:**
```javascript
mongodb://worker:pass123@db-01:27017,db-02:27017/inventory?authSource=admin&replicaSet=prodRS
```

> [!check]- Answer
> - The standard prefix is `mongodb://`.
> - Pass the parameters `authSource` and `replicaSet` in the query string after the database name.

---



### Exercise 2: Percent-Encoding Special Password Characters

**Problem:** Percent-encode password `pass@123` for connection URI using `encodeURIComponent()`.

**Expected output:**
```text
pass%40123
```

> [!check]- Answer
> ```javascript
> encodeURIComponent("pass@123");
> ```
>
> **Explanation:** `encodeURIComponent()` converts reserved URI characters into percent-encoded strings.

### Exercise 3: Connection URI Options

**Problem:** Construct URI specifying `retryWrites=true` and `w=majority` query options.

**Expected output:**
```text
mongodb+srv://user:pass@cluster.mongodb.net/app?retryWrites=true&w=majority
```

> [!check]- Answer
> ```text
> mongodb+srv://user:pass@cluster.mongodb.net/app?retryWrites=true&w=majority
> ```
>
> **Explanation:** Connection URI query string parameters set driver configuration flags.

## 7. Related Terms
- [Authentication & Authorization (SCRAM, RBAC)](auth.md) — Credentials validation.
- [MongoDB Node.js Driver](node_driver.md) — The executing driver.

---

## 8. Key Takeaways
- The Connection String URI consolidates server, auth, and query settings.
- `mongodb://` lists replica set members and port mappings manually.
- `mongodb+srv://` queries DNS SRV records to discover active nodes dynamically.
- Modern cloud databases (like MongoDB Atlas) default to the SRV protocol.
- Password characters like `@` and `/` must be URL-encoded (e.g., `%40` and `%2F`).
- Use the `authSource` parameter to declare where credentials reside (typically admin).
- Protect connection string URIs as environment credentials secret variables.
