# Document Size Limit (16 MB)

> **Level 5 — Data Modeling & Schema Design**
> The hard physical constraint in MongoDB that limits the size of any single BSON document to exactly 16 Megabytes, acting as the primary constraint driving schema design choices.

---

## 1. Prerequisites
- [BSON](../level_01/bson.md) — The binary format that is sized.
- [Embedding vs. Referencing](embedding_vs_referencing.md) — The design decision driven.

---

## 2. Term Category
- **Database Structure / Constraint**

---

## 3. Environment Context
- **MongoDB Core** (Hard-coded at the engine level. Applies to all documents written to collections, including system configuration settings and index keys payloads).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Size Constraint Audit

**Problem:** You are reviewing a logging system design. A developer proposes this structure for tracking server health metrics:
```json
{
  "server_name": "db-01",
  "pings": [
    { "timestamp": "10:00:00", "status": "online" },
    // ... ping entries appended every 5 seconds forever
  ]
}
```
Explain why this design will eventually crash the database, and state how to fix it.

**Expected output:**
```text
The design will crash because the `pings` array is unbounded and appends data every 5 seconds forever. 
Over time, the array will grow to millions of items, eventually exceeding the 16MB document size limit and throwing BSON size errors. 
To fix this, separate the pings into their own collection, storing the parent `server_id` inside each ping document (Child Referencing), or use the Bucket Pattern to split pings into fixed daily documents.
```

> [!check]- Answer
> - Evaluate the growth boundary of a 5-second interval log over months.
> - Relate the crash back to the BSON maximum payload constraint.

---



### Exercise 2: Document Size Validation in Code

**Problem:** Check BSON size of document using `Object.bsonsize(doc)` before saving.

**Expected output:**
```text
if (Object.bsonsize(doc) > 16777216) throw new Error("Document exceeds 16MB limit");
```

> [!check]- Answer
> ```javascript
> if (Object.bsonsize(doc) > 16 * 1024 * 1024) {
>   throw new Error("Document exceeds 16MB limit");
> }
> ```
>
> **Explanation:** `Object.bsonsize(doc)` calculates exact BSON byte sizes.

### Exercise 3: GridFS Usage Threshold

**Problem:** State threshold size for using GridFS instead of standard BSON documents (16MB).

**Expected output:**
```text
Files larger than 16MB threshold
```

> [!check]- Answer
> ```text
> Files larger than 16MB threshold
> ```
>
> **Explanation:** GridFS chunks binary files exceeding the 16MB document size limit.

## 7. Related Terms
- [BSON](../level_01/bson.md) — The binary format.
- [Embedding vs Referencing](embedding_vs_referencing.md) — The parent modeling rules.

---

## 8. Key Takeaways
- MongoDB limits any single BSON document size to exactly 16 Megabytes.
- Standardized to protect server RAM cache and prevent network bottlenecks.
- Prevents expensive disk I/O rewrites during updates.
- Serves as the primary driver forcing referencing designs for unbounded data.
- Exceeding the 16MB boundary triggers immediate write crashes (Code 10334).
- Avoid storing large binary files (images, PDFs) inside documents.
- Use GridFS or cloud buckets (like S3) to handle large attachments.
