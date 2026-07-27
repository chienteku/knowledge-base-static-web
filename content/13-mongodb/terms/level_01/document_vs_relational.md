# Document vs. Relational Model

> **Level 1 — What Is a Document Database?**
> The direct comparison between the Relational Model (PostgreSQL), which normalizes data into tables linked by foreign keys, and the Document Model (MongoDB), which embeds related data within self-contained documents.

---

## 1. Prerequisites
- [Document](document.md) — The fundamental unit of the document model.
- [Flexible Schema (Schema-on-Read)](flexible_schema.md) — The schema design contrast.

---

## 2. Term Category
- **Database Theory / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (The core architectural choice when designing application backends. Compares SQL database modeling vs NoSQL document database modeling).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Model Strategy Selection

**Problem:** You are designing a database. Select the best database model (**Relational** or **Document**) for these developer scenarios:
1.  You are building a complex social media platform where users post, like, comment, tag, and message. Data shapes change rapidly, and you want to scale the database across 50 database nodes to handle global traffic.
2.  You are building a stock exchange platform where account balance safety is critical. You must ensure that if User A buys stock from User B, the balance deduction on A and addition on B happen immediately and atomically with zero risk of inconsistent data.

**Expected output:**
```text
1. Document Model (MongoDB): Ideal for dynamic schemas and horizontal scaling (sharding). It allows nesting posts and comments inside documents, and scales writes across nodes easily.
2. Relational Model (PostgreSQL): Ideal for strict transaction security (ACID). It guarantees immediate consistency across accounts, ensuring balance updates are safe and consistent.
```

> [!check]- Answer
> - Balance horizontal write scaling priorities against strict transaction consistency needs.
> - Consider which model maps best to dynamic JSON objects.

---



### Exercise 2: Embedding vs Joining Strategy

**Problem:** When should data be embedded vs referenced in MongoDB? (Embed data accessed together; reference large or unbounded data).

**Expected output:**
```text
Embed data queried together; reference large, unbounded, or independently accessed data
```

> [!check]- Answer
> ```text
> Embed data queried together; reference large, unbounded, or independently accessed data
> ```
>
> **Explanation:** Embedding optimizes read performance for co-located data.

### Exercise 3: Impedance Mismatch Resolution

**Problem:** How does document storage solve Object-Relational Impedance Mismatch? (Matches application object structure natively without splitting rows).

**Expected output:**
```text
Stores nested objects directly matching backend programming language data models
```

> [!check]- Answer
> ```text
> Stores nested objects directly matching backend programming language data models
> ```
>
> **Explanation:** Document databases eliminate ORM translation layers between code and tables.

## 7. Related Terms
- [Document](document.md) — The basic unit of data.
- [Collection](collection.md) — The logical container.
- [Flexible Schema (Schema-on-Read)](flexible_schema.md) — The schema design contrast.

---

## 8. Key Takeaways
- Relational normalizes data into tables; Document embeds data inside records.
- SQL reduces data duplication; MongoDB optimizes data retrieval speeds.
- SQL tables are defined by entity relationships; MongoDB by access patterns.
- Reading a document is fast because related sub-data is retrieved in a single read.
- Avoid normalizing documents in MongoDB to prevent slow manual relationships.
- Choose Relational for ACID ledger safety; choose Document for agility and scale.
