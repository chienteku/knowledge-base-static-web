# Document vs. Relational Model

> **Level 1 — What Is a Document Database?**
> The direct comparison between the Relational Model (PostgreSQL), which normalizes data into tables linked by foreign keys, and the Document Model (MongoDB), which embeds related data within self-contained documents.

---

## 1. Prerequisites

- [Document](document.md) — The fundamental unit of the document model.
- [Flexible Schema (Schema-on-Read)](flexible_schema.md) — The schema design contrast.

---

## 2. Term Category

**Core Concept** (Paradigm Comparison): Document vs Relational compares schema-flexible hierarchical document storage against normalized tabular structures governed by strict SQL schemas.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (The core architectural choice when designing application backends. Compares SQL database modeling vs NoSQL document database modeling).

### (1) Design Motivation — "Why did we design this?"
As a developer transitioning from PostgreSQL to MongoDB, the single most important task is changing **how you think about data.**

-   **Relational Model (PostgreSQL):** Designed when storage was expensive. It focuses on **reducing redundancy** by dividing data into separate, flat tables. You link tables using Foreign Keys. This is called **Normalization**.
-   **Document Model (MongoDB):** Designed when storage became cheap, but developer speed and horizontal scaling became critical. It focuses on **data access speed** by grouping related data together in a single document. This is called **Denormalization**.

SQL databases require you to model tables around **"What is this thing?"** (Entities). 

Document databases require you to model documents around **"How will the application query this data?"** (Access Patterns).

---

### (2) Head-to-Head Comparison

| Dimension | Relational Model (PostgreSQL) | Document Model (MongoDB) |
| :--- | :--- | :--- |
| **Basic Unit** | Row. | Document. |
| **Container** | Table. | Collection. |
| **Data Philosophy** | **Normalize:** Split tables to avoid duplication. | **Denormalize:** Embed arrays/sub-objects together. |
| **Relationship Link** | Foreign Keys (DDL enforced). | Reference IDs (application enforced). |
| **Query Merges** | High-performance relational `JOIN`. | Native nested lookups; limited `$lookup`. |
| **Scaling** | Vertical (Scale Up: larger CPU/RAM). | Horizontal (Scale Out: sharding across nodes). |
| **Data Integrity** | Strict ACID (Immediate Consistency). | Flexible (supports Eventual Consistency options). |

---

### (3) Reality Metaphor
Imagine assembling a desktop computer:
-   **Relational (SQL):** Storing parts normalized: one drawer for Monitors, one drawer for Keyboards, one drawer for CPUs. To sell a computer, you must run to three drawers, pull the parts, and assemble them on the table (running a SQL `JOIN`).
-   **Document (MongoDB):** Storing the parts pre-assembled inside a **Computer Box** containing the monitor, keyboard, and CPU already mounted together. To sell a computer, you grab the box and hand it to the customer. No assembly is required (instant read).

---

### (4) Code Example: Modeling a Blog Post with Comments

#### 1. Relational Model (PostgreSQL - Normalized Tables)
Requires two tables and a foreign key constraint:

```sql
CREATE TABLE posts (id SERIAL PRIMARY KEY, title VARCHAR(200), content TEXT);
CREATE TABLE comments (id SERIAL PRIMARY KEY, post_id INT REFERENCES posts(id), body TEXT);

-- Querying requires a JOIN:
SELECT * FROM posts LEFT JOIN comments ON posts.id = comments.post_id WHERE posts.id = 1;
```

#### 2. Document Model (MongoDB - Embedded Document)
Stores the post and its comments together inside a single document:

```json
{
  "_id": ObjectId("65fc71239b1d8b2e88a8d1a1"),
  "title": "Document vs Relational",
  "content": "MongoDB stores data differently...",
  "comments": [
    { "user": "alice", "body": "Great article!" },
    { "user": "bob", "body": "Very clear analogies." }
  ]
}
// Querying requires no joins:
// db.posts.findOne({ _id: ObjectId("65fc71239b1d8b2e88a8d1a1") })
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Normalizing documents in MongoDB by creating separate collections for everything and linking them using ID references

**The mistake:** Creating a `users` collection, an `addresses` collection, and a `user_addresses` reference collection in MongoDB, thinking it is clean design.

**Why it's wrong:** MongoDB does not contain physical, high-performance relational join engines like PostgreSQL. 

If you normalize all data, your application must execute multiple queries back-and-forth or run heavy `$lookup` aggregation stages, resulting in slow page load times.

**Fix: Embrace the document paradigm. Default to embedding child arrays and nested subdocuments directly inside the parent document, unless the child data grows infinitely or is queried independently.**

---



### Mistake 2: Replicating 3NF Relational SQL Normalization 1:1 in Document Databases

**The mistake:** Splitting a user profile into 6 separate collections connected via `objectId` foreign keys.

**Why it's wrong:** Forcing extreme SQL normalization leads to multiple network requests or `$lookup` pipeline joins, sacrificing MongoDB's document speed advantage.

*Incorrect:*
```javascript
// Splitting profile, settings, address into 3 separate collections
```

*Fix:*
```javascript
Embed closely-bound data into single documents
```

### Mistake 3: Using `$lookup` Pipeline Joins for High-Throughput OLTP Queries

**The mistake:** Executing `$lookup` joins on every single read request in high-throughput APIs.

**Why it's wrong:** `$lookup` performs un-indexed scans if foreign keys lack indexes, creating memory and latency overhead. Prefer embedding or denormalizing key fields.

*Incorrect:*
```javascript
db.orders.aggregate([{ $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }]);
```

*Fix:*
```javascript
Denormalize essential user details (e.g. userName) directly into order documents
```

## 5. Practice Exercises

### Exercise 1: Mapping Relational Tables to Embedded Document Schemas

**Scenario:**
Refactor a relational 3-table schema (`orders`, `order_items`, `products`) into a single denormalized MongoDB `orders` collection document.

**Requirements:**
1. Model `order` document embedding array of items `items: [{ productId, name, price, qty }]`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.insertOne({
>   _id: new ObjectId(),
>   customerName: "Alice Smith",
>   status: "completed",
>   items: [
>     { productId: new ObjectId("60c72b2f9b1d8b2c88888881"), name: "Keyboard", price: 79.99, qty: 1 },
>     { productId: new ObjectId("60c72b2f9b1d8b2c88888882"), name: "Mouse", price: 29.99, qty: 2 }
>   ],
>   totalAmount: 139.97,
>   orderedAt: new Date()
> });
> ```
>
> #### Technical Explanation
>
> 1. Replaces relational SQL foreign key JOINs with embedded document arrays.
> 2. Fetches entire order details in a single atomic $O(1)$ disk read.
> 3. Eliminates multi-table transaction coordination for order lookups.

---

### Exercise 2: Evaluating Read-Heavy vs Write-Heavy Modeling Trade-offs

**Scenario:**
Compare denormalized embedded documents vs normalized referenced collections for a high-volume blogging platform.

**Requirements:**
1. Compare embedding comments in post documents vs referencing comments in a separate collection.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Embedded Comments: Fast reads for post page load, but runs risk of hitting 16MB limit if comments grow infinitely.
> Referenced Comments: Unlimited scaling for viral posts, but requires $lookup aggregation pipeline to fetch comments.
> ```
>
> #### Technical Explanation
>
> 1. Embedded schema optimizes read performance for bounded arrays (<100 items).
> 2. Referenced schema prevents 16MB document size limit issues for unbounded 1-to-many relationships.
> 3. Driven by application read/write query access patterns.

---

### Exercise 3: Multi-Document ACID Transactions vs Single-Document Atomicity

**Scenario:**
Explain why updating an embedded document in MongoDB is atomic by default without multi-table transactions.

**Requirements:**
1. Contrast single-document atomic updates with SQL multi-table `BEGIN TRANSACTION`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $set: { status: "shipped", "items.0.qty": 2 } }
> );
> ```
>
> #### Technical Explanation
>
> 1. All modifications to a single MongoDB document are 100% atomic by default.
> 2. Updates embedded items and status in a single lock execution.
> 3. Eliminates 2-phase commit overhead required by normalized relational tables.

---



## 6. Related Terms

- [Document](document.md) — The basic unit of data.
- [Collection](collection.md) — The logical container.
- [Flexible Schema (Schema-on-Read)](flexible_schema.md) — The schema design contrast.
- [NoSQL Databases (Overview)](nosql_databases.md) — Related concept: NoSQL Databases (Overview).

---

## 7. Key Takeaways
- Relational normalizes data into tables; Document embeds data inside records.
- SQL reduces data duplication; MongoDB optimizes data retrieval speeds.
- SQL tables are defined by entity relationships; MongoDB by access patterns.
- Reading a document is fast because related sub-data is retrieved in a single read.
- Avoid normalizing documents in MongoDB to prevent slow manual relationships.
- Choose Relational for ACID ledger safety; choose Document for agility and scale.
