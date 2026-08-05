# JSON vs. BSON

> **Level 1 — What Is a Document Database?**
> The design comparison and interface boundary between JSON (human-readable, text-based data format) and BSON (machine-optimized, binary-encoded database storage format).

---

## 1. Prerequisites

- [BSON (Binary JSON)](bson.md) — The binary-encoded database format.

---

## 2. Term Category
- **Database Theory / Data Format**

---

## 3. Environment Context
- **Universal Standard** (JSON is the web standard format for data exchange; BSON is the internal format used on MongoDB servers. Drivers automatically convert between the two at the application boundary).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Boundary Mapping

**Problem:** A JavaScript application reads a user document containing a date field. Explain what format the data is in at each step of the pipeline:
1.  Stored on the MongoDB hard drive.
2.  Transmitted over the TCP socket network.
3.  Loaded inside the backend Node.js application memory.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Stored on disk: BSON (Binary bytes, specifically the BSON Date type representing a 64-bit UTC integer).
> 2. Transmitted over network: BSON (Serialized binary packets).
> 3. Loaded in Node.js application: JSON / JavaScript Object (A native JavaScript `Date` object translated by the MongoDB driver).
> ```
> - The database engine and network transfer operate on binary representations.
> - The application layer converts binary types to standard programming language objects.

---



### Exercise 2: JSON vs BSON Comparison Matrix

**Problem:** Compare JSON vs BSON: 1. Format (JSON: Text, BSON: Binary), 2. Types (BSON adds Date, ObjectId, BinData, Decimal128).

**Expected output:**
> [!check]- Answer
> ```text
> JSON: Text string, BSON: Binary format with rich data types
> ```
> ```text
> JSON: Text string, BSON: Binary format with rich data types
> ```
>
> **Explanation:** BSON extends JSON with binary encoding, fast traversal headers, and extra data types.

---

### Exercise 3: BSON Parsing Performance Advantage

**Problem:** Why is BSON faster to traverse than JSON text? (BSON embeds length prefixes allowing elements to be skipped without scanning text).

**Expected output:**
> [!check]- Answer
> ```text
> BSON includes length prefixes to skip elements without string parsing
> ```
> ```text
> BSON includes length prefixes to skip elements without string parsing
> ```
>
> **Explanation:** Length prefixes allow database engines to jump directly to target fields.

## 7. Related Terms

- [BSON (Binary JSON)](bson.md) — The parent binary structure.

---

## 8. Key Takeaways
- JSON is human-readable text; BSON is machine-optimized database binary.
- MongoDB uses BSON internally for disk storage and network wire packets.
- Developers write queries in JSON; MongoDB drivers translate them to BSON.
- BSON adds support for dates, object IDs, and high-precision numbers.
- BSON size prefixes allow the query engine to skip parsing bytes (traversable).
- Never send raw BSON to browser clients; serialize to standard JSON first.
