# BSON (Binary JSON)

> **Level 1 — What Is a Document Database?**
> The binary-encoded serialization format used by MongoDB to store documents on disk and transmit them over the network, extending JSON with machine-optimized parsing and rich data types.

---

## 1. Prerequisites
- [`_id` Field & ObjectId](objectid.md) — The binary ObjectId type introduced by BSON.

---

## 2. Term Category
- **Database Serialization / Data Format**

---

## 3. Environment Context
- **MongoDB Core** (Used natively for storage on disk (WiredTiger) and transmission over network wire sockets. Humans write JSON, but MongoDB translates it to BSON automatically).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Assuming BSON and JSON Have Identical Data Type Support

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

### Mistake 5: Ignoring BSON 16MB Maximum Document Size Limit

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

## 6. Practice Exercises

### Exercise 1: BSON Type Audit

**Problem:** Explain why BSON is better suited than standard JSON for storing financial transactions (hint: think about precision decimals).

**Expected output:**
```text
Standard JSON has only a single generic "Number" type, which is parsed as a double-precision floating-point number. Floating-point numbers suffer from binary rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`), which can cause financial discrepancies. 
BSON introduces specialized numeric types, specifically `Decimal128`, which stores high-precision decimals using exact arithmetic, guaranteeing correct currency balance tracking.
```

> [!check]- Answer
> - Floating-point conversions introduce arithmetic noise.
> - Consider which BSON type maps to SQL's exact `NUMERIC` columns.

---



### Exercise 2: Extended JSON Serialization

**Problem:** Serialize document `{ date: new Date(), id: new ObjectId() }` using BSON Extended JSON (`EJSON.stringify`).

**Expected output:**
```text
Extended JSON stringified preserving $date and $oid keys
```

> [!check]- Answer
> ```javascript
> const { EJSON } = require('bson');
> const doc = { date: new Date(), id: new ObjectId() };
> console.log(EJSON.stringify(doc));
> ```
>
> **Explanation:** `EJSON` preserves BSON type annotations (`$date`, `$oid`) in JSON strings.

### Exercise 3: BSON Type Inspection in mongosh

**Problem:** Inspect BSON type of `db.coll.findOne()._id` using `typeof` or `bsontype`.

**Expected output:**
```text
"object" (ObjectId instance in JS driver)
```

> [!check]- Answer
> ```javascript
> typeof db.coll.findOne()._id;
> ```
>
> **Explanation:** `ObjectId` values are BSON object primitives in driver APIs.



### Exercise 4: Extended JSON Serialization

**Problem:** Serialize document `{ date: new Date(), id: new ObjectId() }` using BSON Extended JSON (`EJSON.stringify`).

**Expected output:**
```text
Extended JSON stringified preserving $date and $oid keys
```

> [!check]- Answer
> ```javascript
> const { EJSON } = require('bson');
> const doc = { date: new Date(), id: new ObjectId() };
> console.log(EJSON.stringify(doc));
> ```
>
> **Explanation:** `EJSON` preserves BSON type annotations (`$date`, `$oid`) in JSON strings.

### Exercise 5: BSON Type Inspection in mongosh

**Problem:** Inspect BSON type of `db.coll.findOne()._id` using `typeof` or `bsontype`.

**Expected output:**
```text
"object" (ObjectId instance in JS driver)
```

> [!check]- Answer
> ```javascript
> typeof db.coll.findOne()._id;
> ```
>
> **Explanation:** `ObjectId` values are BSON object primitives in driver APIs.

## 7. Related Terms
- [`_id` Field & ObjectId](objectid.md) — BSON primary keys.
- [JSON vs BSON](json_vs_bson.md) — The differences in use cases.

---

## 8. Key Takeaways
- BSON is the binary serialization format of MongoDB.
- Translates JSON into machine-optimized bytes for storage and network transfer.
- Adds rich data types: Date, ObjectId, Decimal128, Binary, and Regex.
- Introduces size prefixes to make document scanning fast (traversable).
- Prevents floating-point rounding errors by using binary integer types.
- Binary files are not human-readable; use shells/GUIs to translate them to JSON.
