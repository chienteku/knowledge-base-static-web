# Schema Design (Document Modeling)

> **Level 5 — Data Modeling & Schema Design**
> The practice of structuring collections, documents, and nested fields based on application data access patterns, prioritizing read performance and write safety over strict relational normalization rules.

---

## 1. Prerequisites

- [Document](../level_01/document.md) — BSON document structure.
- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — Flexible schema-on-read paradigm.
- [Embedded Document (Subdocument)](../level_02/embedded_document.md) — Nested document modeling.

---

## 2. Term Category

**Data Modeling** (Application-Driven Schema Design): Schema Design in MongoDB structures documents based on application read/write query patterns rather than abstract mathematical normalization rules.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Applies conceptually to all document databases like MongoDB, DynamoDB, and Couchbase. Governs developer decisions during early architectural design phases).

### (1) Design Motivation — "Why did we design this?"
In relational database systems (like PostgreSQL), schema design follows mathematical rules called **Normalization** (typically 3rd Normal Form). 
-   You split data into separate tables to eliminate redundancy.
-   You design the schema based on the *structure of the data itself* (e.g., a user has a profile, settings, and logs; therefore, you create 4 tables).
-   When designing, you ignore *how* the application will query the data, relying on SQL `JOIN` clauses to assemble data on the fly.

In MongoDB, **this design paradigm is turned upside down.**

Document modeling is designed around the **application's access patterns** (how the code queries and writes data):
-   Which pages do users load most often?
-   Which fields are read together on the homepage?
-   Which fields are updated hundreds of times a second?

The fundamental rule of document modeling is: **Data that is accessed together should be stored together.** 

Instead of spreading data across tables and joining them at runtime, you nest related data inside a single document (denormalization) to allow high-speed reads in a single database lookup.

---

### (2) Relational vs. Document Design Paradigm

| Dimension | Relational (SQL) Design | Document (NoSQL) Design |
| :--- | :--- | :--- |
| **Focus** | Structure of the data (Entities). | Access patterns of the application (Queries). |
| **Redundancy** | Strictly forbidden (saves disk space). | Accepted (sacrifices write space for read speed). |
| **Relationships** | Resolved at query runtime via `JOIN`. | Resolved at design time via `Embedding`. |
| **Scalability** | Harder to scale horizontally. | Easy to scale horizontally across servers. |

---

### (3) Reality Metaphor (Kitchen Storage)
Imagine preparing food in a kitchen:
-   **SQL (Normalized):** You store every single food item in its own dedicated, locked container on separate shelves. 
    -   To make a ham sandwich, you must walk to Shelf A for bread, Shelf B for ham, Shelf C for cheese, and Shelf D for lettuce. 
    -   There is no duplication, but preparing the sandwich (the query) takes 4 trips.
-   **MongoDB (Document Model):** You store a pre-made **Lunch Box** in the fridge. 
    -   The lunch box contains the bread, ham, cheese, and lettuce pre-assembled. 
    -   When you are hungry (read access pattern), you grab the single box and eat immediately. 
    -   No assembly, no walks across shelves (joins) required.

---

### (4) Code Examples: Normalization vs. Document Modeling

#### Relational Style in NoSQL (Anti-Pattern)
Spreading user profile information across separate collections:

```javascript
// Collection: users
{ _id: 101, username: "alice" }

// Collection: profiles
{ _id: 201, user_id: 101, first_name: "Alice", last_name: "Smith" }

// Collection: settings
{ _id: 301, user_id: 101, theme: "dark", email_notifications: true }
```
*Problem: Fetching the user dashboard requires 3 separate database calls or complex `$lookup` queries, degrading read performance.*

#### Document Model Style (Recommended)
Consolidating all dashboard data inside a single user document:

```javascript
// Collection: users
{
  _id: 101,
  username: "alice",
  profile: {
    first_name: "Alice",
    last_name: "Smith"
  },
  settings: {
    theme: "dark",
    email_notifications: true
  }
}
```
*Benefit: The application can fetch the entire dashboard dataset in a single, high-speed query: `db.users.findOne({ username: "alice" })`.*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Designing MongoDB schemas like SQL tables, creating separate collections for every entity and relying on joins ($lookup)

**The mistake:** Creating separate collections for `users`, `user_metadata`, `user_preferences`, and `user_addresses`, and joining them in every query.

**Why it's wrong:** MongoDB is not optimized for join-heavy operations. 

Running multiple `$lookup` aggregates on every API call drives high CPU usage and slows query response times.

**Fix: Embed related metadata and preferences directly inside the parent document as subdocuments, unless the nested fields have unbounded growth.**

---



### Mistake 2: Designing Schemas Based on Data Entities Instead of Application Query Access Patterns

**The mistake:** Designing MongoDB schemas purely by drawing ER diagrams without considering query access patterns.

**Why it's wrong:** In MongoDB, schemas MUST be designed around application query access patterns (what data is queried together, write frequency, read/write ratio).

*Incorrect:*
```javascript
-- Normalizing schemas purely from ER diagrams
```

*Fix:*
```javascript
Design schemas around application read and write access patterns
```

### Mistake 3: Assuming Schema-Less Means No Schema Design is Required

**The mistake:** Storing arbitrary un-indexed unstructured JSON objects across collections.

**Why it's wrong:** Neglecting schema design leads to poor query performance, memory bloat, and application runtime type crashes. Plan schema patterns deliberately.

*Incorrect:*
```javascript
// Unstructured arbitrary JSON dumping
```

*Fix:*
```javascript
Apply established MongoDB Schema Design Patterns (Subset, Extended Reference, Bucket)
```

## 5. Practice Exercises

### Exercise 1: Query-Driven Schema Design Workflow

**Scenario:**
Design a MongoDB collection schema for an online news platform based on its top 3 query access patterns.

**Requirements:**
1. Query 1: Fetch article with author name and top 5 comments.
2. Design embedded schema addressing Query 1 in a single read.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.articles.insertOne({
>   title: "MongoDB Schema Design Best Practices",
>   slug: "mongodb-schema-design",
>   author: {
>     id: new ObjectId(),
>     name: "Jane Doe" // Extended reference for fast read
>   },
>   content: "Article text here...",
>   recentComments: [ // Subset pattern: Top 5 recent comments embedded
>     { author: "Alice", text: "Great article!", createdAt: new Date() }
>   ],
>   commentCount: 1,
>   publishedAt: new Date()
> });
> ```
>
> #### Technical Explanation
>
> 1. MongoDB schema design starts with identifying application query access patterns rather than abstract normalization.
> 2. Extended references (`author.name`) and subset arrays (`recentComments`) satisfy primary queries in a single $O(1)$ read.
> 3. Maximizes application rendering speed.

---

### Exercise 2: Balancing Read Velocity vs Write Amplification

**Scenario:**
Compare denormalized user name embedding across 10,000 post documents vs referencing user IDs.

**Requirements:**
1. Evaluate write amplification when user changes their name.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Denormalized Name: Reads are instant ($0ms$ joins), but updating name requires modifying 10,000 post documents.
> Referenced User ID: Name updates require 1 single write to `users` collection, but reading posts requires $lookup join.
> Decision Rule: If names change once per decade, denormalize for read speed. If names change hourly, reference.
> ```
>
> #### Technical Explanation
>
> 1. Denormalization trades write amplification for read velocity.
> 2. Data that rarely changes should be denormalized to accelerate high-frequency reads.
> 3. High-frequency volatile data should be referenced to minimize write amplification.

---

### Exercise 3: Schema Design Audit & Refactoring Checklist

**Scenario:**
Audit an existing MongoDB collection for common schema design flaws (unbounded arrays, missing indexes, mixed types).

**Requirements:**
1. Formulate a 3-point schema audit checklist.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Schema Audit Checklist:
> - Are any embedded arrays unbounded (>1,000 items)? -> Refactor to referenced collection.
> - Do primary application queries require $lookup joins? -> Apply Extended Reference Pattern.
> - Are all query filters and sort fields backed by secondary indexes? -> Create targeted compound indexes.
> ```
>
> #### Technical Explanation
>
> 1. Regular schema audits identify performance bottlenecks before production scaling issues occur.
> 2. Re-aligns document structures with evolving application query patterns.
> 3. Maintains high query throughput.

---



## 6. Related Terms

- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — Dynamic structures.
- [Embedding vs. Referencing](embedding_vs_referencing.md) — The core design choice.
- [Anti-Patterns in Schema Design](anti_patterns.md) — Related concept: Anti-Patterns in Schema Design.
- [The Attribute Pattern](attribute_pattern.md) — Related concept: The Attribute Pattern.
- [The Bucket Pattern](bucket_pattern.md) — Related concept: The Bucket Pattern.
- [Data Lifecycle & TTL Strategies](data_lifecycle.md) — Related concept: Data Lifecycle & TTL Strategies.
- [The Extended Reference Pattern](extended_reference_pattern.md) — Related concept: The Extended Reference Pattern.
- [Schema Validation (`$jsonSchema`)](schema_validation.md) — Related concept: Schema Validation (`$jsonSchema`).

---

## 7. Key Takeaways
- Schema design in MongoDB is driven by application query access patterns.
- Prioritizes high-speed reads and atomic writes over mathematical normalization.
- The core rule: Data that is accessed together should be stored together.
- Relational databases normalize data; document databases denormalize (embed) data.
- Avoid splitting user profile segments into separate collections.
- Embed subdocuments by default to avoid slow `$lookup` join operations.
- Always evaluate document growth boundaries to prevent size limit crashes.
