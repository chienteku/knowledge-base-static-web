# Document Size Limit (16 MB)

> **Level 5 — Data Modeling & Schema Design**
> The hard physical constraint in MongoDB that limits the size of any single BSON document to exactly 16 Megabytes, acting as the primary constraint driving schema design choices.

---

## 1. Prerequisites

- [BSON (Binary JSON)](../level_01/bson.md) — The binary format that is sized.
- [Embedding vs. Referencing](embedding_vs_referencing.md) — The design decision driven.

---

## 2. Term Category

**Core Concept** (16MB BSON Limit Boundary): The 16MB Document Size Limit is MongoDB's maximum allocation boundary per BSON document, preventing unbounded RAM consumption and network latency.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Hard-coded at the engine level. Applies to all documents written to collections, including system configuration settings and index keys payloads).

### (1) Design Motivation — "Why did we design this?"
In relational database systems, tables can theoretically hold massive amounts of columns and text content across multiple storage blocks.

In MongoDB, why does a hard **16 Megabyte** document limit exist? 

It is not an arbitrary limit. It was designed to guarantee system performance:
1.  **RAM Cache Protection:** MongoDB caches frequently read documents in server memory (RAM). If a single document could grow to 500MB, reading it once would saturate the RAM cache, ejecting thousands of other documents and degrading system performance.
2.  **Network Efficiency:** During reads, MongoDB streams complete documents to client drivers. Large documents saturate network bandwidth, slowing down API response times.
3.  **Disk I/O Optimization:** When you update a field inside a document, MongoDB often has to rewrite the BSON byte structure. If the file is small (under a few kilobytes), disk rewrite operations are instant. If the document is massive, updates consume high disk I/O.

Keeping the document size capped at 16MB ensures consistent memory footprints, low network overhead, and fast writes.

---

### (2) The Schema Design Driver
The 16MB limit is the single most important constraint in MongoDB schema design. It is the reason why:
-   You cannot embed unbounded arrays (like transaction history or logs) inside parent documents.
-   You must use **Referencing** or patterns like **The Outlier Pattern** to route overflow data to separate collections.

---

### (3) Reality Metaphor
Imagine sending cargo via courier service:
-   **SQL Database:** A shipping container train flatbed. You can stack cargo crates high and long.
-   **MongoDB BSON:** A standard **Express Parcel Shipping Box**. 
    -   The shipping company enforces a strict **16-kilogram weight limit** (16MB) on the box. 
    -   If you pack shoes and letters (names and addresses), it is light and travels fast. 
    -   If you try to pack a **heavy steel engine block** inside, the courier rejects it at the counter (size error). 
    -   To ship the engine, you must split it into parts and send them in separate boxes (referencing).

---

### (4) Code Examples

#### Hitting the Limit
If your application attempts to save a document that exceeds 16MB, the MongoDB driver returns a write error:

```javascript
// Example Node.js Driver Write Crash:
{
  name: "MongoServerError",
  message: "BSONObj size (16778216 bytes) is larger than maximum allowed BSONObject size (16777216 bytes)",
  code: 10334
}
// Note: 16777216 bytes is exactly 16 MB.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing binary files (such as high-res images, PDF documents, or audio clips) directly inside a document's binary field

**The mistake:** Uploading raw PDF document buffers directly into a document's `attachment` binary field, assuming BSON handles large assets.

**Why it's wrong:** Storing files directly in documents causes documents to hit the 16MB ceiling after a few uploads. 

Even if the files are under 16MB, it bloats document size, slowing down basic queries.

**Fix: Never store binary attachments larger than 100KB directly inside documents. Store files in cloud storage (like AWS S3) and save only the URL string in MongoDB, or use MongoDB's built-in GridFS system (which automatically splits files into 255KB chunks across separate collections).**

---



### Mistake 2: Ignoring 16MB BSON Document Limit in Unbounded Array Designs

**The mistake:** Designing schemas where arrays continue growing without bound indefinitely.

**Why it's wrong:** Attempting to save or update a document that exceeds 16MB throws error `BSONObj size is invalid`. Design schemas with subset or bucket patterns.

*Incorrect:*
```javascript
db.users.updateOne({ _id: id }, { $push: { unboundedArray: item } }); // ❌ Throws 16MB limit error!
```

*Fix:*
```javascript
Store array items in a separate collection or use Subset Pattern
```

### Mistake 3: Using GridFS for Small 1KB Documents

**The mistake:** Using GridFS to store small 1KB text documents.

**Why it's wrong:** GridFS creates two collections (`fs.files` and `fs.chunks`) and adds overhead. GridFS is designed for binary files exceeding 16MB.

*Incorrect:*
```javascript
// Using GridFS for 1KB text files
```

*Fix:*
```javascript
Store small documents directly inside standard BSON collections
```

## 5. Practice Exercises

### Exercise 1: Calculating Document Byte Sizes in mongosh

**Scenario:**
Inspect the current BSON byte size of a document in collection `users` to ensure it is comfortably below the 16MB limit.

**Requirements:**
1. Use `Object.bsonsize(doc)` in `mongosh`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const doc = db.users.findOne({ email: "alice@example.com" });
> const bytes = Object.bsonsize(doc);
> const megaBytes = (bytes / (1024 * 1024)).toFixed(2);
> 
> console.log(`Document Size: ${bytes} Bytes (${megaBytes} MB / 16 MB)`);
> ```
>
> #### Technical Explanation
>
> 1. `Object.bsonsize(doc)` calculates exact binary byte footprints of BSON documents.
> 2. Documents approaching 16MB indicate schema anti-patterns (unbounded array growth).
> 3. Helps monitor collection schema health.
> 
---

### Exercise 2: Refactoring Oversized Array Documents into References

**Scenario:**
Refactor a `company` document containing an embedded array of 100,000 `employees` that exceeds 16MB into a referenced model.

**Requirements:**
1. Create `employees` collection with `companyId` reference.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // Refactored schema: Move employees to separate collection
> db.employees.insertOne({
>   companyId: new ObjectId("60c72b2f9b1d8b2c88888880"),
>   name: "Bob Jones",
>   role: "Engineer"
> });
> 
> db.employees.createIndex({ companyId: 1 });
> ```
>
> #### Technical Explanation
>
> 1. Moving 1-to-many child entities to a separate collection resolves 16MB document size limits.
> 2. Allows child entities to scale to billions of documents independently.
> 3. Preserves fast indexing on foreign key `companyId`.
> 
---

### Exercise 3: Handling Large Files with GridFS

**Scenario:**
Store 50MB PDF documents in MongoDB without breaching the 16MB BSON document limit using GridFS.

**Requirements:**
1. Explain how GridFS chunks large files across `fs.files` and `fs.chunks`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> GridFS Architecture:
> - fs.files: Stores file metadata document (filename, length, chunkSize, uploadDate).
> - fs.chunks: Stores file payload split into 255KB binary BSON chunk documents.
> ```
>
> #### Technical Explanation
>
> 1. GridFS splits files larger than 16MB into small 255KB chunk documents stored in `fs.chunks`.
> 2. `fs.files` maintains parent metadata documents.
> 3. Streams large binary files seamlessly without exceeding BSON size boundaries.
> 
---



## 6. Related Terms

- [BSON (Binary JSON)](../level_01/bson.md) — The binary format.
- [Embedding vs. Referencing](embedding_vs_referencing.md) — The parent modeling rules.
- [Anti-Patterns in Schema Design](anti_patterns.md) — Related concept: Anti-Patterns in Schema Design.
- [One-to-Many Relationship (Embedding vs. Referencing)](one_to_many.md) — Related concept: One-to-Many Relationship (Embedding vs. Referencing).
- [The Subset Pattern](subset_pattern.md) — Related concept: The Subset Pattern.
- [`$facet` Stage](../level_06/facet_stage.md) — Related concept: `$facet` Stage.
- [GridFS](../level_10/gridfs.md) — Related concept: GridFS.
- [The Outlier Pattern](outlier_pattern.md) — Outlier pattern for size limits.

---

## 7. Key Takeaways
- MongoDB limits any single BSON document size to exactly 16 Megabytes.
- Standardized to protect server RAM cache and prevent network bottlenecks.
- Prevents expensive disk I/O rewrites during updates.
- Serves as the primary driver forcing referencing designs for unbounded data.
- Exceeding the 16MB boundary triggers immediate write crashes (Code 10334).
- Avoid storing large binary files (images, PDFs) inside documents.
- Use GridFS or cloud buckets (like S3) to handle large attachments.
