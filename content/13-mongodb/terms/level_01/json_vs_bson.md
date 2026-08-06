# JSON vs. BSON

> **Level 1 — What Is a Document Database?**
> The design comparison and interface boundary between JSON (human-readable, text-based data format) and BSON (machine-optimized, binary-encoded database storage format).

---

## 1. Prerequisites

- [BSON (Binary JSON)](bson.md) — The binary-encoded database format.

---

## 2. Term Category

**Core Concept** (Data Format Comparison): JSON vs BSON contrasts human-readable text serialization against MongoDB's typed, binary-encoded storage format supporting dates and ObjectIds.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (JSON is the web standard format for data exchange; BSON is the internal format used on MongoDB servers. Drivers automatically convert between the two at the application boundary).

### (1) Design Motivation — "Why did we design this?"
In web development, we often refer to MongoDB as a "JSON Database." 

While this is true on the surface, it is technically inaccurate under the hood. 

If MongoDB stored raw JSON text strings directly on disk, query operations would be slow because of text parsing overhead.

We designed the interface boundary to combine the strengths of both formats:
-   **JSON** is designed for **humans** and **network payloads** (it is easy to read, write, and parse in web browsers).
-   **BSON** is designed for **computers** and **database engines** (it is fast to parse, traverse, and supports rich datatypes).

The MongoDB driver acts as the translator. 

When you write a query in JavaScript, you write standard JSON. 

The driver compiles your query into binary BSON bytes and sends it to MongoDB. 

The server processes the query in BSON, returns BSON bytes, and the driver translates the bytes back to JSON objects in your application code.

---

### (2) Technical Feature Comparison

| Feature | JSON | BSON |
| :--- | :--- | :--- |
| **Format** | Text (String). | Binary (Bytes). |
| **Readability** | Human-readable. | Machine-readable only. |
| **Parsing Speed** | Slower (character scan). | **Fast** (length prefixed). |
| **Storage Size** | Compact for small data. | Slightly larger (adds byte headers). |
| **Numeric Types** | Generic "Number" only. | `Int32`, `Int64`, `Double`, `Decimal128`. |
| **Extended Types** | None (dates must be strings). | `Date`, `ObjectId`, `Binary`, `Regex`. |

---

### (3) Reality Metaphor
Imagine voice messages:
-   **JSON** is a **written letter** (plain text). Humans can read it with their eyes, copy it, and translate it easily. However, sending long letters takes room and requires looking at every word.
-   **BSON** is an **MP3 audio recording** (binary bytes) saved on a hard drive. 
    -   You cannot "read" an MP3 file with your eyes. 
    -   But a computer can scan, fast-forward (traverse), and store it efficiently. 
    -   The audio player (driver) translates the MP3 file back into spoken words (JSON text) so you can understand it.

---

### (4) The Translation Pipeline

```text
[Web Developer] ── writes Query ──> [JSON Object]
                                         │
                                   (Node.js Driver)
                                         ▼
[MongoDB Server] ── parses/saves ──> [BSON Bytes]
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to send raw BSON binary blocks over a standard REST API endpoint to a web browser frontend

**The mistake:** Fetching documents from MongoDB and sending the raw driver BSON objects directly to a React frontend without converting them to standard JSON, causing browser parse errors.

**Why it's wrong:** Web browsers run standard JavaScript engines that do not natively understand BSON binary files. 

If you send raw BSON (like `ObjectId` wrappers or binary date offsets), the browser's JSON parser will throw syntax errors or fail to display values.

**Fix: Always let your backend API server serialize database documents into standard JSON text strings (usually handled automatically by backend frameworks, e.g. `res.json(data)` in Express) before transmitting them over HTTP.**

---



### Mistake 2: Expecting Plain JSON to Preserve 64-Bit Integers and Date Types

**The mistake:** Serializing BSON `Date` and `Long` primitives to plain JSON before database storage.

**Why it's wrong:** Plain JSON converts `Date` to ISO string and truncates 64-bit `Long` integers. BSON preserves exact binary types.

*Incorrect:*
```javascript
const json = JSON.stringify({ date: new Date() }); // Stringified ISO text
```

*Fix:*
```javascript
Use BSON EJSON or native BSON drivers to preserve rich data type primitives
```

### Mistake 3: Confusing Network Extended JSON Format with Storage BSON Format

**The mistake:** Expecting MongoDB disk storage files to contain raw JSON text.

**Why it's wrong:** MongoDB stores documents on disk as binary BSON data, NOT text JSON. Extended JSON is used for text representation.

*Incorrect:*
```javascript
// Expecting raw .json text files in database storage directory
```

*Fix:*
```javascript
WiredTiger stores documents as optimized binary BSON structures
```

## 5. Practice Exercises

### Exercise 1: BSON Type Extensions in Extended JSON

**Scenario:**
Export BSON documents to Canonical Extended JSON format (`$oid`, `$date`) for transmission over HTTP APIs.

**Requirements:**
1. Convert document with `ObjectId` and `Date` to Extended JSON string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const bsonDoc = {
>   _id: new ObjectId("60c72b2f9b1d8b2c88888880"),
>   createdAt: new Date("2026-08-06T00:00:00Z")
> };
> 
> // Extended JSON format
> const extJson = JSON.stringify({
>   _id: { "$oid": "60c72b2f9b1d8b2c88888880" },
>   createdAt: { "$date": "2026-08-06T00:00:00.000Z" }
> });
> 
> console.log(extJson);
> ```
>
> #### Technical Explanation
>
> 1. Extended JSON preserves rich BSON data types across standard text-only JSON APIs.
> 2. `$oid` represents 12-byte ObjectIds; `$date` represents 64-bit UTC timestamps.
> 3. Prevents type loss during REST API serialization.
> 
---

### Exercise 2: Binary Traversal Efficiency Comparison

**Scenario:**
Explain why MongoDB parses BSON field headers faster than parsing text JSON strings.

**Requirements:**
1. Compare BSON length prefixes with JSON character scanning.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Binary Traversal:
> - BSON: Binary length prefixes allow parser to jump over unneeded fields directly.
> - JSON: Text scanner must evaluate character-by-character searching for quotes and brackets.
> ```
>
> #### Technical Explanation
>
> 1. BSON embeds byte length prefixes for documents and nested sub-elements.
> 2. Query engine skips unrequested fields in $O(1)$ constant time.
> 3. Accelerates projection and query evaluation.
> 
---

### Exercise 3: BSON Data Type Support Matrix

**Scenario:**
List 3 native data types supported in BSON that do not exist natively in standard JSON specification.

**Requirements:**
1. List 3 BSON native types.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> BSON Native Data Types:
> - Date (64-bit UTC integer)
> - ObjectId (12-byte globally unique identifier)
> - Decimal128 (128-bit high precision decimal)
> ```
>
> #### Technical Explanation
>
> 1. Standard JSON only supports strings, numbers, booleans, arrays, objects, and null.
> 2. BSON adds native binary types for dates, decimals, object IDs, and raw binary data (`BinData`).
> 3. Provides rich data typing for application developers.
> 
---



## 6. Related Terms

- [BSON (Binary JSON)](bson.md) — The parent binary structure.

---

## 7. Key Takeaways
- JSON is human-readable text; BSON is machine-optimized database binary.
- MongoDB uses BSON internally for disk storage and network wire packets.
- Developers write queries in JSON; MongoDB drivers translate them to BSON.
- BSON adds support for dates, object IDs, and high-precision numbers.
- BSON size prefixes allow the query engine to skip parsing bytes (traversable).
- Never send raw BSON to browser clients; serialize to standard JSON first.
