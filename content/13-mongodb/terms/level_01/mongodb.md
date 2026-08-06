# MongoDB

> **Level 1 — What Is a Document Database?**
> An open-source, document-oriented NoSQL database that stores data as flexible, JSON-like documents (BSON), designed for developer productivity and horizontal scalability.

---

## 1. Prerequisites

- [NoSQL Databases (Overview)](nosql_databases.md) — NoSQL database paradigm.

---

## 2. Term Category

**Core Concept** (Document Database Engine): MongoDB is a leading document-oriented NoSQL database designed for high availability, horizontal scalability, and developer velocity.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (The core server database engine. Communicates using the MongoDB Wire Protocol over TCP port `27017` by default).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Database CRUD Operation Execution

**Scenario:**
Connect to a MongoDB instance, switch to database `inventory`, and perform an `insertOne()` operation on collection `items`.

**Requirements:**
1. Switch to `inventory` database context.
2. Insert document into `items` collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> use inventory;
> 
> db.items.insertOne({
>   item: "journal",
>   qty: 25,
>   size: { h: 14, w: 21, uom: "cm" },
>   status: "A"
> });
> ```
>
> #### Technical Explanation
>
> 1. `use inventory` targets the specified database namespace.
> 2. `insertOne()` generates an `_id` ObjectId automatically if omitted.
> 3. Persists document directly into WiredTiger collection pages.

---

### Exercise 2: Querying Documents with Equality and Comparison Operators

**Scenario:**
Query collection `items` for documents where `qty` is greater than 20 and `status` is `"A"`.

**Requirements:**
1. Combine `$gt` and equality filters.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.items.find({
>   qty: { $gt: 20 },
>   status: "A"
> });
> ```
>
> #### Technical Explanation
>
> 1. Query filter object specifies match conditions declarative in JSON/BSON format.
> 2. `$gt` specifies greater-than comparison operations.
> 3. Leverages collection indexes when available.

---

### Exercise 3: Summarizing MongoDB Architecture Pillars

**Scenario:**
Summarize MongoDB's three core architectural pillars: Document Model, High Availability (Replica Sets), and Horizontal Scaling (Sharding).

**Requirements:**
1. Explain Document Model, Replica Sets, and Sharding.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Architecture Pillars:
> - Document Model: Flexible BSON documents mapping directly to application code objects.
> - Replica Sets: Automated multi-node primary/secondary failover for high availability.
> - Sharding: Horizontal database partitioning across clusters for petabyte-scale data distribution.
> ```
>
> #### Technical Explanation
>
> 1. Document model maximizes developer velocity and read efficiency.
> 2. Replica sets guarantee zero data loss and automated failovers.
> 3. Sharding enables transparent horizontal cluster expansion.

---



## 6. Related Terms

- [Document](document.md) — The core database unit.
- [Collection](collection.md) — Groupings of documents.
- [BSON (Binary JSON)](bson.md) — The internal storage format.
- [NoSQL Databases (Overview)](nosql_databases.md) — Related concept: NoSQL Databases (Overview).
- [The Outlier Pattern](../level_05/outlier_pattern.md) — Related concept: The Outlier Pattern.
- [`mongod` (MongoDB Server Daemon)](mongod.md) — MongoDB server daemon.

---

## 7. Key Takeaways
- MongoDB is a document-oriented NoSQL database.
- Stores data as flexible JSON-like documents.
- Resolves the translation gap between backend code objects and table columns.
- Eliminates the need for relational database joins for basic data retrieval.
- Features built-in replication and horizontal partitioning (sharding).
- Max document size is 16MB; do not store raw binary media files inside documents.
