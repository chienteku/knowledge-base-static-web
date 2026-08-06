# Document

> **Level 1 — What Is a Document Database?**
> The fundamental unit of data storage in MongoDB, represented as a JSON-like object of field-value pairs that supports nested objects, arrays, and flexible schemas.

---

## 1. Prerequisites

- [MongoDB](mongodb.md) — The parent database engine.

---

## 2. Term Category

**Core Concept** (Primary Data Unit): A Document is the fundamental record unit in MongoDB, represented as a field-and-value structure supporting nested arrays and embedded documents.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported conceptually by all document databases. Represented as JSON in application code and compiled as BSON on the database disk files).

### (1) Design Motivation — "Why did we design this?"
In relational databases (like PostgreSQL), the fundamental unit of data is the **Row**:
-   A row is a flat grid list of cells matching the table columns.
-   A row cannot natively contain lists or objects. To store complex structures, you must link rows to other tables.

We designed the **Document** to act as a self-contained data unit. 

A document stores related data together in a hierarchy. 

Instead of dividing a record across multiple tables, a document allows you to embed arrays and nested sub-documents directly inside a single record. 

This matches how data is structured in programming code, making database reads fast because all information is retrieved in a single read query from disk.

---

### (2) Document vs. SQL Row Analogy
A document is analogous to a **Row** in PostgreSQL, but with major differences:

| SQL Row (PostgreSQL) | Document (MongoDB) |
| :--- | :--- |
| Flat structure (columns only). | Nested structure (objects and arrays). |
| Enforces a strict schema (all rows have same columns). | Flexible schema (each document can have a unique shape). |
| Columns must be predefined. | Fields can be created dynamically on-the-fly. |

---

### (3) Reality Metaphor
Imagine a shipping parcel box:
-   **SQL Row:** A printed line item invoice sheet listing: `[Item: Laptop, RAM: 16GB, Warranty: Yes]`. It is flat text.
-   **Document:** The physical **Shipping Box** itself. 
    -   Inside the box is the laptop.
    -   Also inside the box is a small envelope containing the user manual (an embedded sub-document).
    -   Also inside the box is a bag containing 3 power cables (an array). 
    -   Everything needed is self-contained in one box.

---

### (4) Code Examples

#### A Standard MongoDB Document
Documents are written using curly braces `{}` containing keys and values, separated by colons:

```json
{
  "_id": "60c72b2f9b1d8b2e88a8d1a1",
  "title": "Database Overview",
  "tags": ["database", "nosql", "mongodb"], // Array field
  "author": {
    "name": "Alice Smith",
    "role": "editor" // Embedded document field
  },
  "published": true
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Flattening document structures to mimic SQL rows

**The mistake:** Designing a user document by splitting their addresses into separate collections and using reference IDs, rather than embedding the address list directly inside the user document.

**Why it's wrong:** If you flatten your data, you lose the primary advantage of document databases (fast, single-read access). 

You force your application to run slow manual relationships to retrieve basic user profiles. 

**Fix: Embed child data (like addresses, tags, or settings) directly inside the parent document if that data is always read together with the parent.**

---



### Mistake 2: Storing Unbounded Arrays Inside Documents (Unbounded Growth Anti-Pattern)

**The mistake:** Pushing thousands of activity logs into a user document `user.logs` array field.

**Why it's wrong:** Arrays that grow without bound eventually hit the 16MB document size limit and cause frequent document fragmentation/re-allocation overhead. Store logs in a separate `logs` collection.

*Incorrect:*
```javascript
db.users.updateOne({ _id: id }, { $push: { logs: logEntry } }); // ❌ Unbounded array growth!
```

*Fix:*
```javascript
db.logs.insertOne({ userId: id, ...logEntry }); // Separate collection for logs
```

### Mistake 3: Deeply Nesting Objects Beyond Recommended Levels

**The mistake:** Nesting objects 50 levels deep (e.g. `doc.a.b.c.d...`).

**Why it's wrong:** MongoDB document nesting limit is 100 levels, but deep nesting hinders index creation, readability, and performance. Keep object hierarchies shallow.

*Incorrect:*
```javascript
// Deep 30-level nested object schema
```

*Fix:*
```javascript
Flatten object hierarchies into top-level or shallow 2-3 level fields
```

## 5. Practice Exercises

### Exercise 1: Modeling Hierarchical Documents with Embedded Arrays

**Scenario:**
Create a user document in collection `users` containing an embedded `address` object and an array of `roles`.

**Requirements:**
1. Embed object `address: { city: "Austin", state: "TX" }`.
2. Embed array `roles: ["admin", "developer"]`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.insertOne({
>   name: "Alice Smith",
>   email: "alice@example.com",
>   address: {
>     street: "123 Tech Way",
>     city: "Austin",
>     state: "TX"
>   },
>   roles: ["admin", "developer"],
>   createdAt: new Date()
> });
> ```
>
> #### Technical Explanation
>
> 1. Documents store complex nested structures natively without relational JOIN tables.
> 2. Embedded objects (`address`) and arrays (`roles`) are retrieved in a single read operation.
> 3. Aligns database representation with application object models.

---

### Exercise 2: Querying Nested Document Fields with Dot-Notation

**Scenario:**
Query user documents where embedded field `address.city` is `"Austin"`.

**Requirements:**
1. Use dot-notation string key `"address.city"`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find({
>   "address.city": "Austin"
> });
> ```
>
> #### Technical Explanation
>
> 1. Dot-notation (`"parent.child"`) traverses nested document properties cleanly.
> 2. Dot-notation keys must be enclosed in quotation marks.
> 3. Secondary indexes can be defined directly on nested dot-notation fields.

---

### Exercise 3: Document Size Enforcement

**Scenario:**
Demonstrate what happens when attempting to insert a document exceeding MongoDB's 16MB document size limit.

**Requirements:**
1. Describe the 16MB document size limit enforcement.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Limit Exception:
> Attempting to insert a document > 16MB throws BSONObjectTooLarge error (code 10334).
> ```
>
> #### Technical Explanation
>
> 1. MongoDB enforces a strict 16MB maximum BSON size limit per document.
> 2. Prevents unbounded document growth from degrading RAM and network performance.
> 3. Use GridFS or reference collections when storing large binary files or unbounded arrays.

---



## 6. Related Terms


- [MongoDB](mongodb.md)
- [Collection](collection.md) — Related concept: Collection.
- [Document vs. Relational Model](document_vs_relational.md) — Related concept: Document vs. Relational Model.
- [Field](field.md) — Related concept: Field.

---

## 7. Key Takeaways
- A document is the core data record unit in MongoDB.
- Analogous to a row in PostgreSQL, but supports nested object values.
- Written as field-value pairs in JSON format (stored as BSON on disk).
- Can hold arrays and embedded sub-documents natively.
- Does not enforce a fixed schema; each document can have unique fields.
- Storing related data inside a single document eliminates the need for joins.
