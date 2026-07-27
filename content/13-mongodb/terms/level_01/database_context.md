# Database (MongoDB Context)

> **Level 1 — What Is a Document Database?**
> A logical container on a MongoDB server that groups related collections together, providing namespace isolation, distinct physical disk storage files, and security access boundaries.

---

## 1. Prerequisites
- [Collection](collection.md) — The data tables grouped inside the database.

---

## 2. Term Category
- **Database Structure / Namespace**

---

## 3. Environment Context
- **MongoDB Core** (Managed in the server's storage directory. A single MongoDB server instance (`mongod`) can run multiple databases simultaneously).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When deploying a database server, you rarely host just one application. 

You might run:
-   An e-commerce storefront (`store_db`).
-   A corporate blogging site (`blog_db`).
-   A temporary development test environment (`test_db`).

If all collections (like `users`, `posts`, `logs`) were dumped into a single global namespace:
-   Names would conflict (the blog's `users` table would overwrite the storefront's `users` table).
-   **Security breaches:** A developer working on the blog could accidentally read customer credit card tables.

We designed the **Database** namespace to act as a secure boundary. 

Each database gets its own separate folder on disk, its own access passwords, and its own collections, isolating applications.

---

### (2) Key Database Boundary Rules
-   **Storage separation:** Under the hood, the storage engine (WiredTiger) writes separate physical file segments on disk for each database.
-   **Security boundaries:** You can restrict database user roles to a single database (e.g. User Bob is granted read/write access to `store_db`, but is blocked from even seeing `blog_db`).
-   **Dynamic creation:** In MongoDB, you don't need to run a `CREATE DATABASE` query. You simply switch to a new database name using `use new_db_name`, and MongoDB creates it automatically the moment you insert your first document.

---

### (3) Reality Metaphor
Imagine a corporate headquarters skyscraper:
-   The entire building is the physical MongoDB server.
-   **Databases** are the individual **floors** of the building:
    -   Floor 1 is leased by the **Sales Department** (`sales_db`).
    -   Floor 2 is leased by the **Human Resources Department** (`hr_db`).
-   The filing cabinets (collections) and files (documents) reside on their respective floors. 
-   HR staff badges only unlock the elevator doors for Floor 2, preventing them from accessing Sales cabinets on Floor 1.

---

### (4) Code Examples

#### Creating and Navigating Databases in mongosh
```javascript
// 1. Show all databases on the active server
show dbs

// 2. Switch to a database namespace (creates it dynamically)
use analytics_db

// 3. Check what the active database is right now
db

// 4. Insert a document (triggers physical creation on disk)
db.events.insertOne({ type: "click", page: "home" });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to run cross-database joins ($lookup queries)

**The mistake:** Running a query in `store_db` that tries to join a collection located inside `blog_db`.

**Why it's wrong:** MongoDB namespaces are strictly isolated. 

While you can join collections within the *same* database using the `$lookup` operator, MongoDB query engines do not support native, high-performance joins across separate database boundaries.

**Fix: Ensure all collections that need to be joined or queried together reside inside the same database namespace.**

---



### Mistake 2: Executing Queries Against the Default `test` Database Context in Production

**The mistake:** Connecting driver without specifying database name `mongodb://localhost:27017`.

**Why it's wrong:** Omitting the database name defaults connection operations to the `test` database, mixing production records into temporary test scopes.

*Incorrect:*
```javascript
const client = new MongoClient("mongodb://localhost:27017"); // Defaults to 'test' DB
```

*Fix:*
```javascript
const client = new MongoClient("mongodb://localhost:27017/production_db"); // Explicit database name
```

### Mistake 3: Creating Thousands of Micro Databases for Multi-Tenant Isolation

**The mistake:** Creating a separate database `db_tenant_123` for every tenant in a SaaS application.

**Why it's wrong:** Each database incurs file descriptor, metadata, and WiredTiger cache overhead. Prefer single shared database with `tenantId` field and index partitioning.

*Incorrect:*
```javascript
const tenantDb = client.db(`tenant_${tenantId}`); // ❌ Database sprawl anti-pattern!
```

*Fix:*
```javascript
const db = client.db("saas_app"); db.users.find({ tenantId: tenantId }); // Single shared database
```

## 6. Practice Exercises

### Exercise 1: Namespace Creation Commands

**Problem:** You connect to a fresh MongoDB server. You want to create a database namespace named `inventory_app` and seed a single document containing `{ item: "wrench", stock: 15 }` into a collection named `tools`. 
Write the shell commands to execute this.

**Expected output:**
```javascript
use inventory_app

db.tools.insertOne({ item: "wrench", stock: 15 });
```

> [!check]- Answer
> - The database is created automatically upon document write.
> - Switch context using the `use` keyword.

---



### Exercise 2: Switching Database Context in mongosh

**Problem:** Command to switch active database context to `analytics` (`use analytics`).

**Expected output:**
```text
use analytics
```

> [!check]- Answer
> ```javascript
> use analytics
> ```
>
> **Explanation:** `use dbname` sets active database context in mongosh.

### Exercise 3: Listing Databases

**Problem:** Command to list all databases and disk usage in mongosh (`show dbs`).

**Expected output:**
```text
show dbs
```

> [!check]- Answer
> ```javascript
> show dbs
> ```
>
> **Explanation:** `show dbs` prints active non-empty databases and file sizes.

## 7. Related Terms
- [Collection](collection.md) — The child collections.
- [mongosh (MongoDB Shell)](mongosh.md) — The command line interface.

---

## 8. Key Takeaways
- A database is the high-level logical container for collections in MongoDB.
- Provides namespace isolation and application data separation.
- Physical storage files are written separately on disk for each database.
- Created dynamically upon the first document insert; no CREATE DDL required.
- Serves as the primary security boundary for user role access.
- Cross-database collection joins are not supported; keep query sets local.
