# Document

> **Level 1 — What Is a Document Database?**
> The fundamental unit of data storage in MongoDB, represented as a JSON-like object of field-value pairs that supports nested objects, arrays, and flexible schemas.

---

## 1. Prerequisites
- [MongoDB](mongodb.md) — The parent database engine.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (Supported conceptually by all document databases. Represented as JSON in application code and compiled as BSON on the database disk files).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Document Structure Identification

**Problem:** Inspect the following document:
```json
{
  "order_id": 105,
  "client": "John Doe",
  "items": [
    { "name": "mouse", "price": 20 },
    { "name": "cable", "price": 10 }
  ]
}
```
1.  What BSON data type is the `items` field?
2.  What is nested inside that field?

**Expected output:**
```text
1. The `items` field is an Array.
2. Inside the array are two nested Embedded Documents (representing order items).
```

> [!check]- Answer
> - Square brackets `[]` define arrays.
> - Curly braces `{}` define documents.

---



### Exercise 2: Inspecting Document Size in Bytes

**Problem:** Calculate size in bytes of document using `Object.bsonsize(doc)` in mongosh.

**Expected output:**
```text
Object.bsonsize(doc)
```

> [!check]- Answer
> ```javascript
> const doc = db.users.findOne();
> Object.bsonsize(doc);
> ```
>
> **Explanation:** `Object.bsonsize(doc)` evaluates exact BSON byte sizes of documents.

### Exercise 3: Top-Level Document Identifiers

**Problem:** What mandatory field is required on all top-level MongoDB documents? (`_id`).

**Expected output:**
```text
_id
```

> [!check]- Answer
> ```text
> _id
> ```
>
> **Explanation:** `_id` acts as the primary key unique identifier for every MongoDB document.

## 7. Related Terms

- [MongoDB](mongodb.md)

---

## 8. Key Takeaways
- A document is the core data record unit in MongoDB.
- Analogous to a row in PostgreSQL, but supports nested object values.
- Written as field-value pairs in JSON format (stored as BSON on disk).
- Can hold arrays and embedded sub-documents natively.
- Does not enforce a fixed schema; each document can have unique fields.
- Storing related data inside a single document eliminates the need for joins.
