# Collection

> **Level 1 — What Is a Document Database?**
> A grouping of related documents in MongoDB, serving as the document-oriented equivalent of a PostgreSQL table but without enforcing a fixed schema by default.

---

## 1. Prerequisites

- [Document](document.md) — The fundamental data units grouped inside collections.

---

## 2. Term Category

**Core Concept** (Document Grouping Structure): A Collection is a logical grouping of MongoDB BSON documents, serving as the document-oriented equivalent of a relational database table.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported conceptually by all document databases. Stored physically as separate logical files on disk managed by the storage engine).

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Collection Creation with Capped Limits

**Scenario:**
An application logging service creates a capped collection `system_logs` to maintain a fixed 50MB log buffer.

**Requirements:**
1. Create collection `system_logs` with `capped: true`, `size: 52428800`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.createCollection("system_logs", {
>   capped: true,
>   size: 52428800, // 50 MB
>   max: 100000     // Max 100,000 documents
> });
> ```
>
> #### Technical Explanation
>
> 1. Capped collections maintain fixed allocation sizes on disk.
> 2. Automatically overwrites oldest documents when max size or document count limits are reached.
> 3. Guarantees natural insertion order without index maintenance overhead.

---

### Exercise 2: Inspecting Collection Storage Statistics

**Scenario:**
Analyze storage metrics for collection `orders` to evaluate disk space utilization and index size.

**Requirements:**
1. Execute `db.orders.stats()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const stats = db.orders.stats();
> console.log("Document Count:", stats.count);
> console.log("Storage Size (Bytes):", stats.storageSize);
> console.log("Total Index Size (Bytes):", stats.totalIndexSize);
> ```
>
> #### Technical Explanation
>
> 1. `db.collection.stats()` extracts storage engine statistics (WiredTiger page sizes, index footprints).
> 2. Identifies bloated indexes and uncompressed collection storage.
> 3. Guides index pruning and disk capacity planning.

---

### Exercise 3: Dropping Collections Cleanly

**Scenario:**
Drop temporary collection `temp_imports` to free database storage space.

**Requirements:**
1. Execute `db.temp_imports.drop()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.temp_imports.drop();
> ```
>
> #### Technical Explanation
>
> 1. `drop()` removes collection metadata and frees allocated storage pages.
> 2. Automatically drops all associated secondary indexes.
> 3. Reclaims WiredTiger disk space allocation.

---



## 6. Related Terms

- [Document](document.md) — The core data record.
- [Database (MongoDB Context)](database_context.md) — The parent namespace.
- [Flexible Schema (Schema-on-Read)](flexible_schema.md) — The schema design.
- [Document vs. Relational Model](document_vs_relational.md) — Related concept: Document vs. Relational Model.
- [MongoDB](mongodb.md) — Related concept: MongoDB.
- [`insertOne()` / `insertMany()`](../level_03/insert.md) — Related concept: `insertOne()` / `insertMany()`.

---

## 7. Key Takeaways
- A Collection is a logical container for documents in MongoDB.
- Analogous to a table in PostgreSQL, but schema-less by default.
- Does not enforce identical fields across documents in the collection.
- Eliminates the need to run DDL migrations when adding fields.
- Keep collections entity-focused (e.g. users, products) to optimize search indexes.
- Avoid over-splitting collections for dynamic variations of the same entity.
