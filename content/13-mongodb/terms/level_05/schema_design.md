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
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Applies conceptually to all document databases like MongoDB, DynamoDB, and Couchbase. Governs developer decisions during early architectural design phases).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Access Pattern Analysis

**Problem:** You are designing a blog database. The homepage displays the 10 latest article titles, author names, and publication dates. Comments are only displayed when a user clicks on a specific article.
1.  Should you embed the full text of all comments inside the article document? Explain why or why not based on the access patterns.

**Expected output:**
> [!check]- Answer
> ```text
> 1. No, you should not embed the full text of all comments inside the article document. 
> The homepage access pattern only requires article titles, author names, and dates. If you embed comments (which can grow to thousands of entries), fetching the latest article titles will load megabytes of unused comment text into database RAM cache, slowing down the homepage. Furthermore, comments can grow infinitely, risking hitting the 16MB document size limit. Comments should be stored in a separate collection or managed using referencing patterns.
> ```
> - Assess what data is needed for the homepage read pattern.
> - Consider the risk of unbounded array growth.

---



### Exercise 2: Golden Rule of MongoDB Schema Design

**Problem:** State the golden rule of MongoDB schema design (Data that is accessed together should be stored together).

**Expected output:**
> [!check]- Answer
> ```text
> Data that is accessed together should be stored together
> ```
> ```text
> Data that is accessed together should be stored together
> ```
>
> **Explanation:** Co-locating frequently queried fields eliminates `$lookup` joins and network roundtrips.

---

### Exercise 3: Read/Write Ratio Schema Tradeoffs

**Problem:** How does high read/write ratio (99% reads) influence schema design? (Favors embedding and denormalization).

**Expected output:**
> [!check]- Answer
> ```text
> Favors embedding and denormalization to optimize fast single-query reads
> ```
> ```text
> Favors embedding and denormalization to optimize fast single-query reads
> ```
>
> **Explanation:** High read ratios justify embedding and denormalizing data to minimize read latency.

## 7. Related Terms

- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — Dynamic structures.
- [Embedding vs. Referencing](embedding_vs_referencing.md) — The core design choice.
- [Anti-Patterns in Schema Design](anti_patterns.md) — Related concept: Anti-Patterns in Schema Design.
- [The Attribute Pattern](attribute_pattern.md) — Related concept: The Attribute Pattern.
- [The Bucket Pattern](bucket_pattern.md) — Related concept: The Bucket Pattern.
- [Data Lifecycle & TTL Strategies](data_lifecycle.md) — Related concept: Data Lifecycle & TTL Strategies.
- [The Extended Reference Pattern](extended_reference_pattern.md) — Related concept: The Extended Reference Pattern.
- [Schema Validation (`$jsonSchema`)](schema_validation.md) — Related concept: Schema Validation (`$jsonSchema`).

---

## 8. Key Takeaways
- Schema design in MongoDB is driven by application query access patterns.
- Prioritizes high-speed reads and atomic writes over mathematical normalization.
- The core rule: Data that is accessed together should be stored together.
- Relational databases normalize data; document databases denormalize (embed) data.
- Avoid splitting user profile segments into separate collections.
- Embed subdocuments by default to avoid slow `$lookup` join operations.
- Always evaluate document growth boundaries to prevent size limit crashes.
