# Field

> **Level 1 — What Is a Document Database?**
> A key-value pair within a MongoDB document, serving as the document-oriented equivalent of a PostgreSQL column but supporting nested objects, arrays, and variable data types.

---

## 1. Prerequisites
- [Document](document.md) — The parent records containing fields.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (Supported conceptually by all document-based storage models. Case-sensitive and whitespace-sensitive in MongoDB query engines).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational databases, tables use **Columns** to define attributes:
-   Every row must contain cells for every column.
-   If a user doesn't have a middle name, the `middle_name` column must store a `NULL` placeholder.
-   A column can only hold flat, primitive values (numbers, strings).

We designed the **Field** (key-value pair) to allow documents to be self-contained and descriptive. 

In a document database, fields are stored **inside the document itself** alongside the data values. 

If a user doesn't have a middle name, you don't save a `NULL` marker; you simply omit the `middle_name` field completely from their document. 

This saves disk storage space. 

Furthermore, fields can store complex values like list arrays or complete nested sub-objects, making data modeling much closer to programming language objects.

---

### (2) Field vs. SQL Column

| SQL Column (PostgreSQL) | Field (MongoDB) |
| :--- | :--- |
| Predefined inside table schemas. | Stored inline inside the document. |
| Fixed data type for the whole column. | Can hold different BSON types per document. |
| Empty values store `NULL`. | Empty values can be completely omitted. |
| Cannot hold nested tables. | Can hold nested subdocuments and arrays. |

---

### (3) Reality Metaphor
Imagine labeling travel suitcases:
-   **SQL Column:** A steel baggage rack containing rigid slots. Every suitcase must slide into a specific slot. If a suitcase has no umbrella, the umbrella slot remains empty.
-   **Field:** Sticky **Luggage Tags** stuck directly on the suitcase fabric. 
    -   Tag 1 reads: `[Destination: Paris]`.
    -   Tag 2 reads: `[Weight: 15kg]`.
    -   If a suitcase is not fragile, you simply don't paste the `[Fragile]` sticker on it.

---

### (4) Code Examples

#### Fields in a MongoDB Document
In this document, the keys on the left are **Fields**, and the values on the right hold different data types:

```json
{
  "username": "coder123",              // Field containing a String
  "age": 28,                            // Field containing an Integer
  "interests": ["coding", "chess"],     // Field containing an Array
  "address": {                          // Field containing an Embedded Document
    "city": "London",
    "zip": "W1A"
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Inconsistent field name capitalization or spelling across documents in a collection

**The mistake:** Saving `{ username: "alice" }` for one user, and `{ userName: "bob" }` or `{ user_name: "charlie" }` for others.

**Why it's wrong:** MongoDB is case-sensitive and schema-free. 

If your database client queries `db.users.find({ username: "bob" })`, it will return nothing because Bob's field is spelled `userName` with a capital `N`. 

The query engine treats them as two completely unrelated columns, resulting in data retrieval bugs.

**Fix: Maintain strict naming conventions (typically lowerCamelCase in MongoDB) across all documents. Use application-level schemas (like Mongoose models) to guarantee that field spelling remains identical.**

---



### Mistake 2: Using Extremely Long Field Key Names Across Millions of Documents

**The mistake:** Naming fields `user_account_creation_timestamp_in_milliseconds: 1700000000`.

**Why it's wrong:** In BSON, field key names are stored verbatim inside EVERY document! Long key names consume megabytes of wasted RAM across millions of documents.

*Incorrect:*
```javascript
{ user_account_creation_timestamp_in_milliseconds: 1700000000 } // Wastes RAM across 10M docs!
```

*Fix:*
```javascript
{ createdAt: 1700000000 } // Concise idiomatic field key name
```

### Mistake 3: Using Dynamic Data as Field Names (Field Name Data Anti-Pattern)

**The mistake:** Storing dates or user IDs directly as document field keys `{ "2026-01-01": 100, "2026-01-02": 200 }`.

**Why it's wrong:** Using dynamic values as field names makes indexing and querying nearly impossible. Use key-value array objects `[{ date: "2026-01-01", val: 100 }]`.

*Incorrect:*
```javascript
{ "2026-01-01": 100, "2026-01-02": 200 } // ❌ Field names contain dynamic data!
```

*Fix:*
```javascript
metrics: [{ date: "2026-01-01", count: 100 }, { date: "2026-01-02", count: 200 }]
```

## 6. Practice Exercises

### Exercise 1: Field Type Parsing

**Problem:** Inspect the following document:
```json
{
  "_id": 1,
  "sku": "ITEM-900",
  "pricing": {
    "retail": 49.99,
    "discounted": 39.99
  }
}
```
1.  List the names of all fields at the top-level of the document.
2.  List the fields nested inside the `pricing` field.

**Expected output:**
```text
1. Top-level fields: `_id`, `sku`, and `pricing`.
2. Nested fields inside `pricing`: `retail` and `discounted`.
```

> [!check]- Answer
> - Top-level keys reside directly inside the outermost curly braces.
> - Nested keys reside inside the subdocument brace block.

---



### Exercise 2: Dot Notation Field Queries

**Problem:** Query users where nested field `address.city` equals `"New York"`.

**Expected output:**
```text
db.users.find({ "address.city": "New York" });
```

> [!check]- Answer
> ```javascript
> db.users.find({ "address.city": "New York" });
> ```
>
> **Explanation:** Dot-notation in quotes `"address.city"` accesses nested sub-document fields.

### Exercise 3: Array Element Position Query

**Problem:** Query documents where first tag `tags.0` equals `"tech"`.

**Expected output:**
```text
db.posts.find({ "tags.0": "tech" });
```

> [!check]- Answer
> ```javascript
> db.posts.find({ "tags.0": "tech" });
> ```
>
> **Explanation:** `"array.0"` indexes specific positional array elements in field paths.

## 7. Related Terms
- [Document](document.md) — The parent container.
- [BSON Data Types (Overview)](../level_02/bson_data_types.md) — The types of values fields can store.

---

## 8. Key Takeaways
- A Field is a case-sensitive key-value pair stored inside a document.
- Serving as the document equivalent of a relational database column.
- Can store primitive values, arrays, or complete nested subdocuments.
- Missing values are simply omitted from documents, saving disk space.
- Always enforce strict camelCase naming conventions to prevent query bugs.
- Manage consistent field names using application validation models.
