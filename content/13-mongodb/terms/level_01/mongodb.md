# MongoDB

> **Level 1 — What Is a Document Database?**
> An open-source, document-oriented NoSQL database that stores data as flexible, JSON-like documents (BSON), designed for developer productivity and horizontal scalability.

---

## 1. Prerequisites
- [NoSQL Databases (Overview)](nosql_databases.md) — The parent non-relational database family.

---

## 2. Term Category
- **Database Engine / Software**

---

## 3. Environment Context
- **MongoDB Core** (The core server database engine. Communicates using the MongoDB Wire Protocol over TCP port `27017` by default).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional software development, programmers write code using object-oriented classes:
`const user = { name: "Alice", tags: ["tech", "coding"] };`

If you save this object to a relational SQL database (like PostgreSQL):
1.  You must strip the array `tags` out of the object.
2.  Save the user's name to a `users` table.
3.  Save the tags as separate rows inside a child `user_tags` table.
4.  To retrieve the object later, you must execute a SQL `JOIN` query to rebuild the array.

This back-and-forth mapping translation is slow.

We designed **MongoDB** to eliminate this database-to-code barrier. 

MongoDB stores data directly as **Documents** (JSON objects). 

The data model inside the database is identical to the data model inside your backend JavaScript application code. 

There are no joins required to load basic profiles: you write objects, read objects, and query them naturally.

---

### (2) Core Structural Features of MongoDB
-   **Flexible Schema:** Documents in the same group (collection) can have different shapes and fields.
-   **JSON/BSON Storage:** Internally serializes data to BSON (Binary JSON) to support high-speed parsing and rich data types.
-   **Built-in Horizontal Scaling:** Uses **Replica Sets** (automatic data backup copies) and **Sharding** (splitting data across clusters) natively.

---

### (3) Reality Metaphor
Imagine a doctor's office patient archive room:
-   **Relational (SQL):** The doctor writes a patient profile, but is forced to file the patient's billing data in the Billing Cabinet, their medical history in the History Cabinet, and their contact phone numbers in the Phone Roll (normalized tables). To read a profile, the doctor must pull files from three cabinets (Joins).
-   **MongoDB:** The doctor puts the patient profile, billing logs, and history pages all inside a single **Manila Folder** (the document). The doctor drops the folder into a single cabinet. To read it, they grab the folder and read straight down.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating MongoDB as a simple file storage system (like Dropbox or AWS S3) for storing raw media files

**The mistake:** Uploading raw `10MB` JPEG user profile photos or video files directly into a MongoDB document field.

**Why it's wrong:** MongoDB is a database engine designed to parse, index, and query structured text and numbers. 

Storing massive raw binary files inside documents bloats memory caches, slows down search indexes, and hits MongoDB's maximum document size limit of **`16MB`**.

**Fix: Store raw media files (images, audio, videos) in cloud storage buckets (like AWS S3). Save only the file's web URL string (`https://s3.amazonaws.com/...`) inside the MongoDB document.**

---



### Mistake 2: Storing Raw Binary Files inside MongoDB Documents

**The mistake:** Uploading 10MB JPEG photos directly into document BSON fields.

**Why it's wrong:** Storing large raw binary files bloats WiredTiger RAM caches and hits the 16MB document size limit. Use S3 storage buckets for files.

*Incorrect:*
```javascript
db.users.insertOne({ name: "Alice", photoRawBuffer: largeBuffer }); // ❌ Bloats RAM!
```

*Fix:*
```javascript
db.users.insertOne({ name: "Alice", photoUrl: "https://s3.amazonaws.com/img.jpg" });
```

### Mistake 3: Replicating Relational SQL Normalization 1:1 in MongoDB

**The mistake:** Splitting a single user profile into 6 separate collections connected via `objectId` foreign keys.

**Why it's wrong:** Forcing extreme SQL normalization leads to multiple network requests or `$lookup` pipeline joins, sacrificing MongoDB's document speed advantage.

*Incorrect:*
```javascript
// Splitting profile, settings, address into 3 collections
```

*Fix:*
```javascript
Embed closely-bound data into single documents
```

## 6. Practice Exercises

### Exercise 1: Mapping Code to DB

**Problem:** You have a JavaScript object representing a user:
`const admin = { username: "super_admin", permissions: ["read", "write", "delete"] };`
Explain how this object is saved in MongoDB compared to a relational database.

**Expected output:**
> [!check]- Answer
> ```text
> - MongoDB: The object is saved exactly as it is written. MongoDB accepts the nested array `permissions` directly inside the user's document in a single collection.
> - Relational Database: The object must be split. The username goes to a `users` table, and the three permissions must be inserted as three separate rows inside a child `permissions` table, linked via a foreign key.
> ```
> - Think about whether MongoDB requires splitting nested structures.
> - Consider how SQL handles array columns under normalization.

---



### Exercise 2: Document DB vs Relational DB Comparison

**Problem:** State how MongoDB stores user permissions vs PostgreSQL (MongoDB embeds array; Postgres splits into child junction table).

**Expected output:**
> [!check]- Answer
> ```text
> MongoDB embeds permissions array in single document; Postgres splits into child table rows
> ```
> ```text
> MongoDB embeds permissions array in single document; Postgres splits into child table rows
> ```
>
> **Explanation:** Document stores preserve object structures natively without relational joins.

---

### Exercise 3: Maximum Document Size Limit

**Problem:** What is MongoDB's maximum single BSON document size limit? (`16MB`).

**Expected output:**
> [!check]- Answer
> ```text
> 16MB
> ```
> ```text
> 16MB
> ```
>
> **Explanation:** MongoDB enforces a hard 16MB document size limit for BSON storage safety.

## 7. Related Terms
- [Document](document.md) — The core database unit.
- [Collection](collection.md) — Groupings of documents.
- [BSON (Binary JSON)](bson.md) — The internal storage format.

---

## 8. Key Takeaways
- MongoDB is a document-oriented NoSQL database.
- Stores data as flexible JSON-like documents.
- Resolves the translation gap between backend code objects and table columns.
- Eliminates the need for relational database joins for basic data retrieval.
- Features built-in replication and horizontal partitioning (sharding).
- Max document size is 16MB; do not store raw binary media files inside documents.
