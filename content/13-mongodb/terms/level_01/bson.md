# BSON (Binary JSON)

> **Level 1 — What Is a Document Database?**
> The binary-encoded serialization format used by MongoDB to store documents on disk and transmit them over the network, extending JSON with machine-optimized parsing and rich data types.

---

## 1. Prerequisites

- [`_id` Field & ObjectId](objectid.md) — The binary ObjectId type introduced by BSON.

---

## 2. Term Category

**Core Concept** (Binary JSON Serialization): BSON (Binary JSON) is the underlying binary-encoded serialization format used by MongoDB to store documents and execute high-performance traversals.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Used natively for storage on disk (WiredTiger) and transmission over network wire sockets. Humans write JSON, but MongoDB translates it to BSON automatically).

### (1) Design Motivation — "Why did we design this?"
In web development, **JSON** (JavaScript Object Notation) is the standard format for exchanging data because it is human-readable and matches code objects.

However, JSON carries two severe limitations when used inside database engines:

1.  **Limited Data Types:** JSON only supports basic types: Strings, Numbers (with no difference between integers and floats), Booleans, Objects, Arrays, and Nulls. It cannot natively represent **Dates**, **High-precision decimals** (financial currency), or unique **ObjectIds**.
2.  **Slow Parsing Performance:** JSON is a text-based string. To find a nested field inside a JSON string, the database engine must scan the text character-by-character from the beginning, looking for quotes and curly braces. This is slow on large documents.

We designed **BSON** (Binary JSON) to solve these database performance constraints. 

BSON is a binary representation of JSON. 

It is designed to be **lightweight**, **type-rich**, and **traversable**. 

BSON inserts size prefixes before arrays and fields: if a query searches for a user's address, the engine reads the byte length of the preceding fields and jumps directly to the address bytes on disk, bypassing the other data instantly.

---

### (2) Key BSON Advantages
-   **Traversability:** Size-prefixed headers allow the query engine to skip parsing large, irrelevant nested arrays or subdocuments.
-   **Exact Binary Numbers:** Stores numbers as binary integers (Int32, Int64) or exact floats, preventing floating-point rounding errors.
-   **Rich Types:** Natively supports `Date` objects, `ObjectId`, `Regex`, and `Binary` (for raw byte blobs).

---

### (3) Reality Metaphor
Imagine searching for a chapter in a book:
-   **JSON (Raw Text):** A book with **no table of contents**. To find Chapter 5, you must flip page-by-page, scanning the text until you see the header "Chapter 5". (Slow, text-parsing scan).
-   **BSON (Binary Index):** A book containing a **Byte-Index Table of Contents** at the cover. The index reads: *"Chapter 1 starts at page 10 (length 20 pages), Chapter 5 starts at page 120"*. The CPU reads the page number and instantly flips directly to page 120, skipping the pages in between (traversability).

---

### (4) Conceptual Binary Layout
Behind the scenes, BSON serializes `{ "hello": "world" }` into a binary byte array:

```text
\x16\x00\x00\x00           <- Total document size (22 bytes)
\x02                       <- Element Type (2 = String)
hello\x00                  <- Field name (null-terminated string)
\x06\x00\x00\x00world\x00  <- String value size (6 bytes) and content
\x00                       <- Document terminator byte
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Believing BSON is a human-readable text file format that can be edited in a text editor

**The mistake:** Opening a MongoDB database file (`.wt` WiredTiger file) in Visual Studio Code to search for text or manually edit a user record.

**Why it's wrong:** BSON is a compiled binary format. 

If you open the file, you will see a garbled stream of unreadable binary character symbols (garbage characters) rather than clean JSON text. 

Editing the file directly will corrupt the database catalog, crashing the server.

**Fix: Always use the MongoDB Shell (`mongosh`) or a GUI client (like Compass) to query and modify documents. These tools automatically translate the binary BSON into readable JSON for you, and compile your JSON edits back to safe BSON.**

---





### Mistake 2: Assuming BSON and JSON Have Identical Data Type Support

**The mistake:** Expecting plain JSON to natively support 64-bit integers (`Long`), Date objects, Decimal128, and ObjectId primitives.

**Why it's wrong:** JSON supports only basic numbers, strings, booleans, arrays, objects, and null. BSON extends JSON with rich binary types like `Date`, `ObjectId`, `Decimal128`, and `BinData`.

*Incorrect:*
```javascript
// Expecting JSON.stringify to preserve BSON types
const json = JSON.stringify({ id: new ObjectId(), date: new Date() }); // ❌ Loss of BSON type metadata!
```

*Fix:*
```javascript
import { EJSON } from 'bson';
const ejson = EJSON.stringify({ id: new ObjectId(), date: new Date() }); // Extended JSON preserves types
```



### Mistake 3: Ignoring BSON 16MB Maximum Document Size Limit

**The mistake:** Storing large array logs or raw media file buffers inside a single BSON document.

**Why it's wrong:** MongoDB enforces a strict 16MB maximum BSON document size limit. Exceeding 16MB throws document size validation errors.

*Incorrect:*
```javascript
db.users.updateOne({ _id: id }, { $push: { logs: largeLogPayload } }); // ❌ Document grows past 16MB!
```

*Fix:*
```javascript
db.logs.insertOne({ userId: id, payload: largeLogPayload }); // Store logs in separate collection
```



## 5. Practice Exercises

### Exercise 1: Inspecting BSON Type Sizes

**Scenario:**
A data platform engineer inspects the byte storage efficiency of BSON data types compared to plain JSON text strings.

**Requirements:**
1. Insert a document containing `Date`, `ObjectId`, and `Decimal128` types.
2. Use `Object.bsonsize()` in `mongosh` to evaluate total byte size.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const doc = {
>   _id: new ObjectId(),
>   createdAt: new Date(),
>   balance: NumberDecimal("149.99")
> };
> 
> db.test_bson.insertOne(doc);
> 
> // Measure BSON binary size in bytes
> console.log("BSON Byte Size:", Object.bsonsize(doc));
> ```
>
> #### Technical Explanation
>
> 1. `Object.bsonsize(doc)` calculates exact binary byte footprints including type headers and field length prefixes.
> 2. BSON stores dates as 64-bit integers and decimals as 128-bit IEEE 754-2008 structures.
> 3. Fast binary parsing enables direct field index traversal without parsing entire text buffers.

---

### Exercise 2: Native BSON Date Queries

**Scenario:**
Query order documents created within the last 24 hours using native BSON Date objects.

**Requirements:**
1. Use `new Date()` BSON objects inside query filters.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
> 
> db.orders.find({
>   createdAt: { $gte: yesterday }
> });
> ```
>
> #### Technical Explanation
>
> 1. BSON represents dates as 64-bit UTC integers since epoch milliseconds.
> 2. Enables direct numeric comparisons (`$gte`) without string parsing overhead.
> 3. Preserves microsecond precision across client drivers.

---

### Exercise 3: Precise Financial Math with BSON Decimal128

**Scenario:**
Store product prices using `NumberDecimal` to avoid floating-point rounding errors.

**Requirements:**
1. Insert product with `price: NumberDecimal("19.99")`.
2. Query products with price equal to `NumberDecimal("19.99")`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.insertOne({
>   name: "Pro Mouse",
>   price: NumberDecimal("19.99")
> });
> 
> db.products.find({ price: NumberDecimal("19.99") });
> ```
>
> #### Technical Explanation
>
> 1. `NumberDecimal` stores 34 decimal digits of precision using BSON 128-bit IEEE format.
> 2. Eliminates binary floating-point representation errors inherent in double precision floats.
> 3. Standard choice for monetary and financial data fields.

---



## 6. Related Terms

- [`_id` Field & ObjectId](objectid.md) — BSON primary keys.
- [JSON vs. BSON](json_vs_bson.md) — The differences in use cases.
- [MongoDB](mongodb.md) — Related concept: MongoDB.
- [BSON Data Types (Overview)](../level_02/bson_data_types.md) — Related concept: BSON Data Types (Overview).
- [Document Size Limit (16 MB)](../level_05/document_size_limit.md) — Related concept: Document Size Limit (16 MB).

---

## 7. Key Takeaways
- BSON is the binary serialization format of MongoDB.
- Translates JSON into machine-optimized bytes for storage and network transfer.
- Adds rich data types: Date, ObjectId, Decimal128, Binary, and Regex.
- Introduces size prefixes to make document scanning fast (traversable).
- Prevents floating-point rounding errors by using binary integer types.
- Binary files are not human-readable; use shells/GUIs to translate them to JSON.
