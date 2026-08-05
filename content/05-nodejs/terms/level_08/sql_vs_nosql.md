# SQL vs NoSQL

> **Level 8 — Database Integration**
> The two fundamental paradigms of storing data in a backend application. Relational databases use strict tables (Excel), while NoSQL databases use flexible documents (JSON).

---

## 1. Prerequisites
- json — The data structure that powers NoSQL databases.
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — The server that connects to these databases.
---

## 2. Term Category
- **Database Architecture**

---

## 3. Environment Context
- **System Architecture**

---

## 4. Explanation

### (1) Relational Databases (SQL)
Think of a Relational Database like a massive **Excel Spreadsheet**.
- **Examples:** PostgreSQL, MySQL, SQLite.
- **Structure:** Data is stored in strict rows and columns.
- **Rules (Schema):** You must define the columns before you insert data. If the `users` table requires an `email` column, and you try to save a user without an email, the database crashes and rejects the data.
- **Relationships:** Tables are connected using "Foreign Keys." A `users` table connects to an `orders` table via the `user_id`.

### (2) NoSQL Databases
Think of a NoSQL Database like a massive folder of **JSON Files**.
- **Examples:** MongoDB, CouchDB, DynamoDB.
- **Structure:** Data is stored as flexible "Documents" (BSON/JSON objects).
- **Rules (Schema-less):** There are no strict columns. You can save User A with just a `name`, and User B with a `name`, `age`, and `favorite_color`. The database doesn't care; it just accepts the JSON.
- **Relationships:** Instead of connecting tables, you often "embed" data. A user document might contain an array of their orders directly inside of it.

### (3) Which one should I use?
In 2012, Node.js developers obsessed over MongoDB (NoSQL) because it used JSON, which felt natural for JavaScript. 
Today, the industry heavily favors **PostgreSQL (Relational)** for 90% of applications. 
- Use **SQL** when your data is structured, relational (e.g., E-commerce: Users have Orders, Orders have Products), and requires strict data integrity.
- Use **NoSQL** when your data is unstructured, changing rapidly, or requires massive horizontal scaling (e.g., IoT sensor logs, real-time chat messages).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating NoSQL like SQL

**The mistake:** A developer uses MongoDB for an E-commerce site. They create a `Users` collection and an `Orders` collection. Every time they load a user, they write a complex manual query to search the `Orders` collection for the matching user ID.

**Why it's wrong:** You are using a NoSQL database as if it were a Relational database! NoSQL is terrible at "joining" different collections together. If a user's orders belong to them, they should be embedded directly inside the User's JSON document. If you find yourself manually linking IDs across multiple collections, you chose the wrong database type.
**Golden Rule:** SQL is for linking. NoSQL is for embedding.

---



### Mistake 2: Choosing NoSQL (MongoDB) for Highly Relational Financial Data

**The mistake:** Building a banking ledger application with complex multi-table joins using MongoDB without ACID transactions.

**Why it's wrong:** Highly relational data with complex transactions and strict schema guarantees is best handled by relational SQL databases (PostgreSQL). Forcing NoSQL requires manually implementing joins and transaction guarantees.

*Incorrect:*
```javascript
// Manually joining 10 MongoDB collections across application code for financial ledgers
```

*Fix:*
```javascript
Use relational SQL database (PostgreSQL) for ACID relational financial data
```

### Mistake 3: Choosing SQL for Unstructured, Rapidly Evolving Schema Log Data

**The mistake:** Storing dynamic, highly nested sensor/telemetry JSON data in rigid SQL tables requiring frequent schema migrations.

**Why it's wrong:** NoSQL document databases excel at storing dynamic, unstructured, or semi-structured JSON documents without requiring rigid schema migrations for every new property.

*Incorrect:*
```javascript
// Running ALTER TABLE migration every time a sensor adds a new property
```

*Fix:*
```javascript
Use NoSQL document database (MongoDB) or JSONB columns in PostgreSQL for flexible schema data
```

## 6. Practice Exercises

### Exercise 1: Pick the Database

**Problem:** You are building two different applications. Which database paradigm (SQL or NoSQL) is best for each?
App A: A banking application where financial transactions, account balances, and user identities must be strictly validated and linked.
App B: A web scraper that collects arbitrary, constantly changing JSON metadata from 10,000 different websites every minute.

**Expected output:**
> [!check]- Answer
> ```text
> App A: SQL (Relational). The data is strict, highly structured, and cannot afford errors or missing columns.
> App B: NoSQL. The data is unstructured (every website's JSON looks different), and we need to just dump it into storage quickly.
> ```
> - Which app has strict rules, and which app needs flexibility?

---



### Exercise 2: Comparing Database Characteristics

**Problem:** Match characteristic to SQL or NoSQL:
1. Fixed tabular schemas with Foreign Keys
2. Flexible JSON document structures
3. Scaled vertically (bigger server CPU/RAM)
4. Scaled horizontally across clusters easily

**Expected output:**
> [!check]- Answer
> ```text
> 1. SQL
> 2. NoSQL
> 3. SQL
> 4. NoSQL
> ```
> ```text
> 1. SQL
> 2. NoSQL
> 3. SQL
> 4. NoSQL
> ```
>
> **Explanation:** SQL databases prioritize relational integrity; NoSQL databases prioritize horizontal scalability and flexible schemas.

---

### Exercise 3: Selecting Database for E-Commerce Catalog

**Problem:** Which database type is better for an e-commerce catalog with thousands of diverse product categories each having unique dynamic attributes?

**Expected output:**
> [!check]- Answer
> ```text
> NoSQL (Document database like MongoDB) or PostgreSQL JSONB.
> ```
> ```text
> NoSQL (Document database like MongoDB) or PostgreSQL JSONB.
> ```
>
> **Explanation:** Document schemas naturally accommodate varied product attribute structures per item.

## 7. Related Terms
- [ORMs & ODMs](orms_odms.md) — The tools Node.js uses to talk to these databases.
- [Migrations](migrations.md) — A concept that exists in SQL, but rarely in NoSQL.
- [Mongoose (MongoDB ODM)](mongoose.md) — Related concept: Mongoose (MongoDB ODM).
---

## 8. Key Takeaways
- **Relational (SQL)** databases use strict tables, rows, and columns. Excellent for structured, connected data (PostgreSQL).
- **NoSQL** databases use flexible JSON documents. Excellent for unstructured, rapidly changing data (MongoDB).
- Node.js works perfectly with both, but PostgreSQL is the modern industry standard for general-purpose apps.
