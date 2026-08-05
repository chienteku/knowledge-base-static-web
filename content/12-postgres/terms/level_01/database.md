# Database

> **Level 1 — What Is a Database?**
> A structured, organized collection of data stored electronically, designed for efficient storage, search, retrieval, and modification.

---

## 1. Prerequisites
- None!

---

## 2. Term Category
- **Core Architecture Concept**

---

## 3. Environment Context
- **Universal standard** (Fundamental concept of all modern software engineering. Solves the core challenge of persistent state storage).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In early computer programming, developers saved application data in plain text files (like `users.txt` or a JSON file like `data.json`). 

While file storage works for small projects, it fails when scaling:

1.  **Performance (Slow Searches):** If you have a file containing 1 million users, and you want to look up a user by their email address, you must read the entire file line-by-line from top to bottom. This takes seconds and hogs CPU memory.
2.  **Concurrency (Data Overwrites):** If two users edit their profiles at the exact same millisecond, the operating system opens the file, writes user A's changes, and then writes user B's changes, completely wiping out A's updates!
3.  **Data Integrity (Corruption):** If the server loses power or crashes halfway through writing data to a text file, the file gets cut off, corrupted, and becomes completely unreadable.

We designed **Databases** to solve these issues. 

A database manages memory and disk access directly, organizes data into structured records, indexes them for instant lookups, manages concurrent access locks safely, and guarantees that data is never partially written or corrupted.

---

### (2) Reality Metaphor
Imagine running a massive library:
-   **File Storage** is like throwing every single book receipt and user registration form into a giant cardboard box in the corner of the room. Finding a user's phone number means digging through the box for hours. If two assistants try to write on the same receipt, it tears.
-   **A Database** is a modern filing system. Every document is sorted into labeled filing cabinets, categorized by type. A master card catalog index tells you the exact drawer and folder where any document lives. A gatekeeper librarian ensures only one person writes on a folder at a time, preventing conflicts.

---

### (3) Code Examples

#### JSON File vs. Database Query
In a Node.js server, searching a JSON file requires loading and parsing the whole file:

```javascript
// Plain File Search (O(N) Slow)
const fs = require('fs');
const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
const user = users.find(u => u.email === 'alice@example.com');
```

In a database, we send a targeted query, and the database engine returns only the matching row instantly:

```sql
-- Database SQL Search (O(log N) Fast using Indexing)
SELECT * FROM users WHERE email = 'alice@example.com';
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating a database like a simple file explorer

**The mistake:** Assuming a database operates like a file directory where you can manually open, move, or rename raw tables and files inside the database folder.

**Why it's wrong:** Databases manage their physical files using highly specialized binary formats to optimize performance and protect data. If you touch or modify these files directly via your operating system's file manager, you will bypass the database engine's write locks, corrupt the database, and lose your data.

**Fix: Always access and modify database files using queries and official client tools (like `psql` or database client libraries).**

---



### Mistake 2: Attempting Cross-Database Queries within a Single PostgreSQL Query Statement

**The mistake:** Executing `SELECT * FROM db_a.public.users u JOIN db_b.public.orders o ON u.id = o.user_id;`.

**Why it's wrong:** In PostgreSQL, databases are strictly isolated administrative containers! Cross-database queries within a single connection are forbidden. Use Schemas (`search_path`) or Foreign Data Wrappers (`postgres_fdw`).

*Incorrect:*
```sql
SELECT * FROM db1.public.users JOIN db2.public.orders; -- ❌ Cross-database joins unsupported!
```

*Fix:*
```sql
Use schemas within the same database: SELECT * FROM schema_a.users JOIN schema_b.orders;
```

### Mistake 3: Creating Hundreds of Separate Databases for Tenant Isolation Instead of Schemas

**The mistake:** Creating a separate database `tenant_123` for every tenant in a SaaS application.

**Why it's wrong:** Each database incurs process, catalog memory, and connection pool overhead. Use separate Schemas within a shared database for tenant isolation.

*Incorrect:*
```sql
CREATE DATABASE tenant_123; -- ❌ Database sprawl anti-pattern!
```

*Fix:*
```sql
CREATE SCHEMA tenant_123; -- Isolated schemas inside shared database
```

## 6. Practice Exercises

### Exercise 1: Identifying Concurrency Issues

**Problem:** You are building an ticketing site. Two customers click the "Buy Ticket" button for the last remaining seat at the exact same millisecond. If you are storing ticket counts in a simple text file (`tickets.txt`), what visual bug will occur, and how does a database prevent this?

**Expected output:**
> [!check]- Answer
> ```text
> In a text file, both requests would open the file, see "1 ticket left," write "0 tickets left," and both users would be charged and issued the same seat, causing a double-booking bug. 
> A database prevents this using "transactions" and "write locks." It locks the row containing the seat when User A accesses it, forcing User B's request to wait until A's purchase completes. Once A buys the seat, B's query is re-evaluated and fails safely with "No seats available."
> ```
> - Think about what happens when two separate processes read and write to the same text file simultaneously.
> - Look up the difference between a write lock and plain file writing.

---



### Exercise 2: Database Isolation Principles

**Problem:** Can two different databases inside the same PostgreSQL server instance share tables in a single JOIN query? (No, databases are isolated).

**Expected output:**
> [!check]- Answer
> ```text
> No, cross-database SQL JOIN queries are not supported without Foreign Data Wrappers
> ```
> ```text
> No, cross-database SQL JOIN queries are not supported without Foreign Data Wrappers
> ```
>
> **Explanation:** Databases provide hard administrative isolation in PostgreSQL.

---

### Exercise 3: Inspecting Active Database

**Problem:** SQL function returning name of current active database (`SELECT current_database();`).

**Expected output:**
> [!check]- Answer
> ```text
> SELECT current_database();
> ```
> ```sql
> SELECT current_database();
> ```
>
> **Explanation:** `current_database()` returns the active connected database name.

## 7. Related Terms
- [PostgreSQL (Postgres)](postgresql.md) — A specific type of database management system.
- [Relational Database](relational_database.md) — The relational structural philosophy.
- [`CREATE DATABASE` / `DROP DATABASE`](create_drop_database.md) — Related concept: `CREATE DATABASE` / `DROP DATABASE`.
- [Schema](schema.md) — Related concept: Schema.
- [SQL (Structured Query Language)](sql.md) — Related concept: SQL (Structured Query Language).

---

## 8. Key Takeaways
- A database is an electronic filing system optimized for speed and reliability.
- Text files are slow to search, cannot handle concurrent writes, and are prone to corruption.
- Databases use indexes to retrieve records in milliseconds, even across billions of rows.
- They enforce strict safety rules (transactions) to prevent double-booking or data corruption.
- Never edit database files directly using your OS file system; always use query tools.
