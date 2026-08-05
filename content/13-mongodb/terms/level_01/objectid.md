# `_id` Field & ObjectId

> **Level 1 — What Is a Document Database?**
> The mandatory, unique, and immutable primary key field (`_id`) present in every MongoDB document, which defaults to a 12-byte binary identifier (`ObjectId`) containing a creation timestamp.

---

## 1. Prerequisites

- [Field](field.md) — The key-value structure of document attributes.

---

## 2. Term Category
- **Database Structure / Data Type**

---

## 3. Environment Context
- **MongoDB Core** (Enforced automatically by the storage engine. If a write query omits the `_id` field, the MongoDB driver or server automatically generates an `ObjectId` and inserts it before writing to disk).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational databases, tables use a **Primary Key** (usually an auto-incrementing integer like `id SERIAL` or a `UUID`) to uniquely identify rows.

In MongoDB, we need the same unique identification. 

MongoDB enforces a strict rule: **every single document in a collection must contain a field named exactly `_id`**.

If you use auto-incrementing integers (`1, 2, 3...`) in a distributed database:
-   If you have 5 database servers handling writes, they must communicate constantly over the network to coordinate which server gets to assign ticket number `42`. This network coordination slows down write speeds.

We designed **`ObjectId`** as a decentralized, 12-byte binary primary key. 

Because of its mathematical formula, any client or database server can generate an `ObjectId` independently, guaranteeing uniqueness across global clusters without any network coordination overhead.

---

### (2) The 12-Byte Anatomy of an ObjectId
An ObjectId is displayed as a 24-character hexadecimal string (e.g. `60c72b2f9b1d8b2e88a8d1a1`), but represents 12 bytes of binary data:

```text
 ┌──────────────────────┬──────────────────────────┬──────────────────┐
 │ Timestamp (4 bytes)  │ Random Machine (5 bytes) │ Counter (3 bytes)│
 └──────────────────────┴──────────────────────────┴──────────────────┘
```

1.  **Bytes 1–4 (Timestamp):** Seconds since the Unix epoch. **This means you can extract the exact creation date/time of a document directly from its `_id`!** You don't need a separate `created_at` field if you only need the creation date.
2.  **Bytes 5–9 (Random Value):** A unique identifier for the machine and process that generated the ID.
3.  **Bytes 10–12 (Counter):** An incrementing counter to prevent collisions if the same machine generates multiple IDs in the same second.

---

### (3) Reality Metaphor
Imagine printing tracking barcodes in a shipping logistics company:
-   **Auto-increment SQL ID:** A single mechanical ticket counter. To print a ticket, you must walk to the machine, click the lever, and get the next sequential number. (Bottlenecked).
-   **ObjectId:** A **Barcode Formula** printed on boxes. The label prints the current time, the printer machine serial number, and a counter tracking how many boxes the printer has processed that second. 
    -   Because the printer ID is baked in, 50 warehouses around the world print barcodes simultaneously without ever duplicate-printing the same number.

---

### (4) Code Examples

#### Generating and Inspecting ObjectIds in mongosh
```javascript
// 1. Generate a new ObjectId on-the-fly
const newId = ObjectId();
// Returns e.g. ObjectId("65fc71239b1d8b2e88a8d1a1")

// 2. Extract the embedded timestamp date directly from the ID!
newId.getTimestamp();
// Returns: ISODate("2026-07-21T15:04:35.000Z")

// 3. Query a document by its ObjectId key
db.users.findOne({ _id: ObjectId("65fc71239b1d8b2e88a8d1a1") });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to modify the '_id' field of a document after it has been created

**The mistake:** Executing an update query to change a user's `_id` from a legacy key to a new ObjectId:

```javascript
// BAD: Fails with a database write error!
db.users.updateOne(
  { _id: "old_key" },
  { $set: { _id: ObjectId("65fc71239b1d8b2e88a8d1a1") } }
);
// ERROR: Performing an update on the path '_id' is immutable.
```

**Why it's wrong:** The `_id` field is **immutable** in MongoDB. 

Once a document is written, its primary key index key cannot be changed. 

This ensures index integrity and prevents data corruption.

**Fix: If you must change a document's `_id`, you must copy the document data, delete the original document from the collection, and insert a new document containing the modified `_id`.**

---



### Mistake 2: Comparing BSON `ObjectId` Instances with String `"..."` Using JavaScript `===`

**The mistake:** Writing `if (doc._id === "60d5ecb8b5c9c22b9c8b4567")` in Node.js.

**Why it's wrong:** `doc._id` is an `ObjectId` object instance! String comparison `ObjectId === string` returns `false`. Use `doc._id.equals(str)` or `doc._id.toString() === str`.

*Incorrect:*
```javascript
if (user._id === "60d5ecb8b5c9c22b9c8b4567") // ❌ Always evaluates to false!
```

*Fix:*
```javascript
if (user._id.equals("60d5ecb8b5c9c22b9c8b4567")) // Correct BSON ObjectId comparison
```

### Mistake 3: Passing Invalid 24-Character Strings to `new ObjectId()`

**The mistake:** Constructing `new ObjectId("invalid_string")`.

**Why it's wrong:** `ObjectId` requires a 12-byte binary buffer or a 24-character hexadecimal string. Passing invalid strings throws `BSONTypeError`.

*Incorrect:*
```javascript
new ObjectId("12345"); // ❌ BSONTypeError: Argument passed in must be a 24 char hex string
```

*Fix:*
```javascript
if (ObjectId.isValid(str)) { new ObjectId(str); }
```

## 6. Practice Exercises

### Exercise 1: Shell Diagnostic Commands

**Problem:** You query a document and get this output:
`{ _id: ObjectId("60c72b2f9b1d8b2e88a8d1a1"), username: "tester" }`
Write the `mongosh` shell command to extract and view the exact year and date this document was inserted into the database.

**Expected output:**
> [!check]- Answer
> ```javascript
> ObjectId("60c72b2f9b1d8b2e88a8d1a1").getTimestamp()
> ```
> - The helper method `getTimestamp()` is built into the `ObjectId` object prototype.
> - Call the method directly on the hexadecimal string wrapped in `ObjectId()`.

---



### Exercise 2: Extracting Timestamp from ObjectId

**Problem:** Extract creation date timestamp from `_id` using `_id.getTimestamp()` in mongosh.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.findOne()._id.getTimestamp();
> ```
> ```javascript
> db.users.findOne()._id.getTimestamp();
> ```
>
> **Explanation:** The first 4 bytes of a 12-byte BSON ObjectId store a Unix epoch timestamp.

---

### Exercise 3: ObjectId Structure Breakdown

**Problem:** State byte composition of 12-byte BSON ObjectId (4-byte timestamp, 5-byte random, 3-byte incrementing counter).

**Expected output:**
> [!check]- Answer
> ```text
> 4-byte timestamp, 5-byte random value, 3-byte incrementing counter
> ```
> ```text
> 4-byte timestamp, 5-byte random value, 3-byte incrementing counter
> ```
>
> **Explanation:** ObjectId components guarantee distributed uniqueness without central coordination.

## 7. Related Terms

- [Field](field.md) — The parent attribute structure.
- [BSON (Binary JSON)](bson.md) — The serialization format.
- [`ObjectId` as a Manual Reference](../level_02/objectid_reference.md) — Related concept: `ObjectId` as a Manual Reference.

---

## 8. Key Takeaways
- The `_id` field is the mandatory, immutable primary key for every document.
- `ObjectId` is the default 12-byte binary type auto-generated for the `_id` field.
- Decentralized design allows clients to generate unique IDs without network lag.
- The first 4 bytes of an ObjectId store the creation epoch timestamp.
- Use `.getTimestamp()` to extract the creation date, saving separate field writes.
- Primary key values are immutable; you cannot update an `_id` column value.
- If you don't provide `_id` at write time, the driver injects an ObjectId.
