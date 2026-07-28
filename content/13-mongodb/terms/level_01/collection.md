# Collection

> **Level 1 — What Is a Document Database?**
> A grouping of related documents in MongoDB, serving as the document-oriented equivalent of a PostgreSQL table but without enforcing a fixed schema by default.

---

## 1. Prerequisites
- [Document](document.md) — The fundamental data units grouped inside collections.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (Supported conceptually by all document databases. Stored physically as separate logical files on disk managed by the storage engine).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational databases, rows are stored inside **Tables**. 

A table has a rigid layout: it enforces that every row has the exact same columns, types, and constraints.

We designed the **Collection** to act as a flexible container for documents. 

A collection groups documents that belong to the same logical entity (e.g. a `users` collection, a `products` collection).

However, unlike a SQL table, **a collection does not enforce a schema structure by default.** 

Document 1 in the collection can contain 3 fields, while Document 2 in the same collection contains 10 fields. 

This allows you to store dynamic or evolving data structures in the same bucket without writing migrations to alter table definitions.

---

### (2) Collection vs. SQL Table Analogy
A collection is analogous to a **Table** in PostgreSQL, but with key differences:

| SQL Table (PostgreSQL) | Collection (MongoDB) |
| :--- | :--- |
| Enforces columns and data types. | Does not enforce schemas by default. |
| Adding columns requires migrations. | Adding fields is done instantly by inserting them. |
| Requires empty `NULL` values for empty columns. | Missing fields are simply omitted from documents. |

---

### (3) Reality Metaphor
Imagine a paper registry drawer in a company cabinet:
-   **SQL Table:** The drawer contains a rigid **metal grid organizer**. Every document card must slide into a specific grid slot. Every card must have the exact same lines printed on it.
-   **Collection:** The drawer is simply labeled **"Invoices"**. 
    -   You drop Manila Folders (documents) of invoices into the drawer. 
    -   Some folders contain 2 pages of details, others contain 5 pages, and some have sticky notes. 
    -   They all sit in the same drawer because they are all invoices, but their contents and structures vary.

---

### (4) Architecture Hierarchy

```text
Database
  ├── Collection: users
  │     ├── Document: { _id: 1, name: "Alice" }
  │     └── Document: { _id: 2, name: "Bob", email: "bob@company.com" }
  └── Collection: products
        └── Document: { _id: 101, title: "Laptop", price: 800 }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating a separate collection for every single category variation of a document type

**The mistake:** Creating separate collections named `books_catalog`, `shoes_catalog`, and `clothing_catalog` because the products have different specification properties.

**Why it's wrong:** This mimics the rigid thinking of relational tables. 

By creating separate collections, you make it impossible to run a single search query across your entire store inventory. 

**Fix: Create a single, unified `products` collection. Let MongoDB's flexible schema handle the differing shoe sizes or book page counts inside the individual documents.**

---



### Mistake 2: Creating Hundreds of Thousands of Small Collections (Collection Explosion)

**The mistake:** Creating a separate collection for every single user (e.g. `user_logs_user1`, `user_logs_user2`).

**Why it's wrong:** Each collection incurs index metadata overhead and wiredTiger cache tracking costs. Hundreds of thousands of collections degrade cluster performance.

*Incorrect:*
```javascript
db.createCollection(`user_logs_${userId}`); // ❌ Collection sprawl anti-pattern!
```

*Fix:*
```javascript
db.user_logs.insertOne({ userId: userId, logData: data }); // Single shared collection with userId field
```

### Mistake 3: Assuming Collections Require Explicit Creation Before Data Insertion

**The mistake:** Calling `db.createCollection('users')` before executing `db.users.insertOne()`.

**Why it's wrong:** MongoDB automatically creates collections on first document insertion or index creation.

*Incorrect:*
```javascript
await db.createCollection("users");
await db.users.insertOne({ name: "Alice" }); // Redundant createCollection call
```

*Fix:*
```javascript
await db.users.insertOne({ name: "Alice" }); // Collection implicitly created on insert
```



### Mistake 4: Creating Hundreds of Thousands of Small Collections (Collection Explosion)

**The mistake:** Creating a separate collection for every single user (e.g. `user_logs_user1`, `user_logs_user2`).

**Why it's wrong:** Each collection incurs index metadata overhead and wiredTiger cache tracking costs. Hundreds of thousands of collections degrade cluster performance.

*Incorrect:*
```javascript
db.createCollection(`user_logs_${userId}`); // ❌ Collection sprawl anti-pattern!
```

*Fix:*
```javascript
db.user_logs.insertOne({ userId: userId, logData: data }); // Single shared collection with userId field
```

### Mistake 5: Assuming Collections Require Explicit Creation Before Data Insertion

**The mistake:** Calling `db.createCollection('users')` before executing `db.users.insertOne()`.

**Why it's wrong:** MongoDB automatically creates collections on first document insertion or index creation.

*Incorrect:*
```javascript
await db.createCollection("users");
await db.users.insertOne({ name: "Alice" }); // Redundant createCollection call
```

*Fix:*
```javascript
await db.users.insertOne({ name: "Alice" }); // Collection implicitly created on insert
```

## 6. Practice Exercises

### Exercise 1: Analogy Mapping

**Problem:** Match the MongoDB concepts to their closest PostgreSQL relational database analogies:
1.  Collection
2.  Document
3.  Field
4.  Database

**Expected output:**
> [!check]- Answer
> ```text
> 1. Collection -> Table
> 2. Document -> Row
> 3. Field -> Column
> 4. Database -> Database
> ```
> - Identify which object acts as the parent container on disk.
> - Relate single record entries to their grid counterparts.

---



### Exercise 2: Capped Collection Creation

**Problem:** Create a capped collection `system_logs` capped at 5MB (5242880 bytes).

**Expected output:**
> [!check]- Answer
> ```text
> db.createCollection("system_logs", { capped: true, size: 5242880 });
> ```
> ```javascript
> db.createCollection("system_logs", { capped: true, size: 5242880 });
> ```
>
> **Explanation:** Capped collections maintain fixed-size circular buffers that overwrite oldest documents automatically.

---

### Exercise 3: Dropping Collection Safely

**Problem:** Drop collection `temp_data` from database.

**Expected output:**
> [!check]- Answer
> ```text
> db.temp_data.drop();
> ```
> ```javascript
> db.temp_data.drop();
> ```
>
> **Explanation:** `db.collection.drop()` deletes the collection and all its associated indexes.

## 7. Related Terms
- [Document](document.md) — The core data record.
- [Database (MongoDB Context)](database_context.md) — The parent namespace.
- [Flexible Schema (Schema-on-Read)](flexible_schema.md) — The schema design.

---

## 8. Key Takeaways
- A Collection is a logical container for documents in MongoDB.
- Analogous to a table in PostgreSQL, but schema-less by default.
- Does not enforce identical fields across documents in the collection.
- Eliminates the need to run DDL migrations when adding fields.
- Keep collections entity-focused (e.g. users, products) to optimize search indexes.
- Avoid over-splitting collections for dynamic variations of the same entity.
