# `Binary` Data

> **Level 2 — BSON Data Types & Document Structure**
> The BSON data type used to store raw, unformatted byte arrays (such as UUIDs, cryptographic hashes, or small file buffers) directly inside documents, equivalent to PostgreSQL's `BYTEA` type.

---

## 1. Prerequisites

- [BSON Data Types (Overview)](bson_data_types.md) — The parent BSON type lists.
- [`UUID` Type](../../../12-postgres/terms/level_06/uuid_type.md) — Relational binary identifier equivalents.

---

## 2. Term Category

**Core Concept** (Raw Bytes BSON Type): Binary Data (BinData) is the BSON data type used to store raw unparsed byte arrays, such as UUIDs, cryptographic hashes, or small file blobs.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Stored directly as binary payload bytes. Enforced in client drivers using `BinData` wrappers or native language Buffer classes).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Storing Standard UUIDs as BSON BinData

**Scenario:**
Store user sessions where the session token is formatted as a 16-byte binary UUID using BSON BinData type 4.

**Requirements:**
1. Insert document with `token: UUID("550e8400-e29b-41d4-a716-446655440000")`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.sessions.insertOne({
>   _id: UUID("550e8400-e29b-41d4-a716-446655440000"),
>   userId: new ObjectId(),
>   createdAt: new Date()
> });
> ```
>
> #### Technical Explanation
>
> 1. `UUID()` converts 36-character string UUIDs into 16-byte BSON BinData subtype 4.
> 2. Reduces index storage space by 55% compared to storing raw UUID strings.
> 3. Accelerates index comparisons and memory caching.
> 
---

### Exercise 2: Querying Binary Data Fields

**Scenario:**
Query session collection by exact binary UUID match.

**Requirements:**
1. Query `_id: UUID("550e8400-e29b-41d4-a716-446655440000")`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.sessions.find({
>   _id: UUID("550e8400-e29b-41d4-a716-446655440000")
> });
> ```
>
> #### Technical Explanation
>
> 1. Binary comparisons evaluate raw byte arrays directly in $O(1)$ time.
> 2. Ensures driver-level UUID subtype alignment (Subtype 4 standard).
> 3. Leverages primary key index lookups.
> 
---

### Exercise 3: Storing Small File Binary Blobs

**Scenario:**
Store a user profile thumbnail image (under 1MB) as a raw binary buffer using BSON `BinData`.

**Requirements:**
1. Insert document with `avatar: BinData(0, "aW1hZ2VfYnl0ZXNfaGVyZQ==")`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $set: { avatar: BinData(0, "aW1hZ2VfYnl0ZXNfaGVyZQ==") } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `BinData(0, base64)` stores raw unformatted binary byte buffers.
> 2. Suitable for small files under 1MB; use GridFS for files exceeding 16MB.
> 3. Keeps binary payloads embedded alongside document metadata.
> 
---



## 6. Related Terms

- [BSON Data Types (Overview)](bson_data_types.md) — The parent types.
- [`UUID` Type](../../../12-postgres/terms/level_06/uuid_type.md) — Relational equivalents.

---

## 7. Key Takeaways
- BSON Binary stores raw, unformatted byte payloads.
- Serves as the MongoDB equivalent to PostgreSQL's `BYTEA` type.
- Prevents the storage overhead of base64 text strings (saves 33% space).
- Uses a Subtype byte to identify payloads (e.g. Subtype 4 for UUIDs).
- Index searches on raw binary bytes are faster than text strings.
- **Rule of Thumb:** Never store media files larger than 100KB inside documents.
- Use GridFS or cloud buckets to handle large binary file attachments.
