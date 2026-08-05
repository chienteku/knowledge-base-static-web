# `Binary` Data

> **Level 2 — BSON Data Types & Document Structure**
> The BSON data type used to store raw, unformatted byte arrays (such as UUIDs, cryptographic hashes, or small file buffers) directly inside documents, equivalent to PostgreSQL's `BYTEA` type.

---

## 1. Prerequisites

- [BSON Data Types (Overview)](bson_data_types.md) — The parent BSON type lists.
- [`UUID` Type](../../../12-postgres/terms/level_06/uuid_type.md) — Relational binary identifier equivalents.

---

## 2. Term Category
- **Database Structure / Data Type**

---

## 3. Environment Context
- **MongoDB Core** (Stored directly as binary payload bytes. Enforced in client drivers using `BinData` wrappers or native language Buffer classes).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Applications frequently require storing raw, non-text data:
-   Cryptographic password hashes.
-   16-byte UUID identifiers.
-   Small image thumbnails.

If you store this binary data as a text string (like hex or base64):
-   **Storage Bloat:** Base64 encoding increases file storage sizes by approximately **33%**.
-   **Index Slowdowns:** Comparing long strings in indexes consumes more CPU than comparing raw binary bytes.

We designed the BSON **Binary Data** type to solve this storage overhead. 

It acts as a raw binary envelope inside a document. 

The database engine does not try to parse or interpret the bytes; it simply stores them as a raw sequence of bits, saving space and accelerating index searches.

---

### (2) Binary Subtypes
BSON binary objects include a single-byte **Subtype** field that tells drivers how to interpret the payload:
-   **Subtype 0 (Generic):** General binary data (like file buffers or encrypted packets).
-   **Subtype 4 (UUID):** Specifically tells drivers that the 16 bytes represent a standard UUID, allowing tools to format it cleanly as a hex string (e.g. `123e4567-e89b-12d3-...`).

---

### (3) Reality Metaphor (Brown Wrap Parcels)
-   **Base64 Text String:** Writing out the binary bytes as hex letters on a paper sheet: `"0x4F6E6520..."`. It takes up a lot of ink and paper pages.
-   **BSON Binary:** A sealed **Brown Wrapping Parcel**. 
    -   The database engine doesn't open the package or read what is inside. 
    -   It simply reads the weight (byte length) and a category sticker (subtype, e.g. "UUID"), and slides the parcel onto a warehouse rack. 
    -   It is compact, fast to carry, and preserves the exact content inside.

---

### (4) Code Examples

#### Inserting UUIDs and Buffers in mongosh
In the shell, binary values are represented using the `BinData` constructor:

```javascript
db.devices.insertOne({
  name: "Sensors Gateway",
  
  // Subtype 4: Standard UUID representation
  device_uuid: UUID("3a5df67c-129b-4e8c-8822-12a8f111a123"),
  
  // Subtype 0: Generic binary data (encoded from base64)
  config_checksum: BinData(0, "4f6e65204c696e65")
});

// Query using the UUID helper
db.devices.find({
  device_uuid: UUID("3a5df67c-129b-4e8c-8822-12a8f111a123")
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Storing large media files (like 5MB photos or PDF files) directly inside a document's binary field

**The mistake:** Uploading raw PDF file buffers directly into a document's `attachment_data` binary field.

**Why it's wrong:** Storing large files directly in documents causes severe database bottlenecks. 

It bloats the size of the document, quickly hitting MongoDB's strict **`16MB`** document size limit. 

Furthermore, whenever MongoDB updates other fields in the document, it must read and rewrite the entire 5MB binary block on disk, consuming disk I/O.

**Fix: Keep inline binary fields small (e.g., under 100KB for encryption keys or UUIDs). For large files, store them in cloud storage (like AWS S3) and save only the URL string, or use MongoDB's built-in GridFS system (which splits large files into smaller chunks across separate collections automatically).**

---



### Mistake 2: Storing Large Media Video Files directly in `BinData` BSON Fields

**The mistake:** Storing 50MB raw video buffer files inside document `BinData` fields.

**Why it's wrong:** Single document BSON limit is 16MB. Large binary payloads bloat WiredTiger memory caches. Use GridFS or S3 cloud buckets for large binary files.

*Incorrect:*
```javascript
db.media.insertOne({ video: new Binary(large50MbBuffer) }); // ❌ Exceeds 16MB BSON limit!
```

*Fix:*
```javascript
Store video in S3 or GridFS, keeping only URL string in document
```

### Mistake 3: Confusing Binary Subtype Flags (e.g. UUID Subtype 4 vs Generic Subtype 0)

**The mistake:** Storing UUID binary data as generic Subtype 0 instead of explicit UUID Subtype 4.

**Why it's wrong:** Subtype 4 indicates explicit UUID encoding, enabling drivers and Compass to format and index binary UUIDs cleanly.

*Incorrect:*
```javascript
new Binary(uuidBuffer, 0); // Generic binary subtype
```

*Fix:*
```javascript
new Binary(uuidBuffer, Binary.SUBTYPE_UUID); // Explicit UUID Subtype 4
```

## 6. Practice Exercises

### Exercise 1: UUID Query Syntax

**Problem:** You are querying a device registry. Write the MongoDB query to select all documents where the `gateway_uuid` field matches the standard UUID `'9f3e4567-e89b-12d3-a456-426614174000'`.

**Expected output:**
> [!check]- Answer
> ```javascript
> db.devices.find({ gateway_uuid: UUID("9f3e4567-e89b-12d3-a456-426614174000") });
> ```
> - Wrap the hex string inside the built-in shell helper constructor `UUID()`.
> - Specify the exact field name target in the match filter.

---



### Exercise 2: Creating BSON Binary Buffer in Node.js

**Problem:** Create BSON `Binary` instance from Node.js `Buffer.from('hello')`.

**Expected output:**
> [!check]- Answer
> ```text
> new Binary(Buffer.from('hello'))
> ```
> ```javascript
> const { Binary } = require('mongodb');
> const bin = new Binary(Buffer.from('hello'));
> console.log(bin.buffer);
> ```
>
> **Explanation:** `Binary` wraps Node.js buffers into BSON BinData objects.

---

### Exercise 3: GridFS vs BinData Threshold

**Problem:** What is the recommended size threshold for using GridFS instead of `BinData` in documents? (16MB or >16MB).

**Expected output:**
> [!check]- Answer
> ```text
> 16MB threshold (use GridFS for files exceeding 16MB)
> ```
> ```text
> 16MB threshold (use GridFS for files exceeding 16MB)
> ```
>
> **Explanation:** GridFS chunks large files into 255KB pieces for storage across collections.

## 7. Related Terms

- [BSON Data Types (Overview)](bson_data_types.md) — The parent types.
- [`UUID` Type](../../../12-postgres/terms/level_06/uuid_type.md) — Relational equivalents.

---

## 8. Key Takeaways
- BSON Binary stores raw, unformatted byte payloads.
- Serves as the MongoDB equivalent to PostgreSQL's `BYTEA` type.
- Prevents the storage overhead of base64 text strings (saves 33% space).
- Uses a Subtype byte to identify payloads (e.g. Subtype 4 for UUIDs).
- Index searches on raw binary bytes are faster than text strings.
- **Rule of Thumb:** Never store media files larger than 100KB inside documents.
- Use GridFS or cloud buckets to handle large binary file attachments.
