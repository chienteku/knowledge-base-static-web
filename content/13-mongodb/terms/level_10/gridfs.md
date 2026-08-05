# GridFS

> **Level 10 — Administration, Security & Advanced Features**
> MongoDB's specification and driver-level API for storing and retrieving files that exceed the 16MB BSON document size limit by splitting files into binary chunks across two dedicated collections.

---

## 1. Prerequisites

- [Document Size Limit (16 MB)](../level_05/document_size_limit.md) — The 16MB ceiling constraint.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Implemented inside client drivers. Interacts with the database by dividing file binary streams into multiple standard documents).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
MongoDB documents are capped at a strict physical limit of **16 Megabytes** to protect server memory performance.

What if your application must process and store large media files:
-   A 50 Megabyte company invoice PDF.
-   A 400 Megabyte video clip uploaded by a user.

You cannot store these files inside standard collection documents; the database will reject the write. 

While you can store files on external cloud storage (like AWS S3) and save URLs in MongoDB, managing two systems adds API keys, sync tasks, and backup dependencies.

We designed **GridFS** to let you store large files directly inside your MongoDB database. 

Instead of forcing you to bypass the 16MB limit, GridFS splits large files into small, 255KB binary chunks. 

It saves each chunk as a separate document in one collection and stores a master file metadata manifest in another collection. 

When you read the file, the driver automatically streams and combines the chunks, presenting a seamless file retrieval API.

---

### (2) The Two GridFS Collections
GridFS organizes files using a bucket name prefix (default is `fs`) and writes to two collections:

1.  **`fs.chunks`:** Stores the actual file bytes.
    -   *Splitting:* The file is divided into chunks (default size is **255 Kilobytes** per chunk).
    -   *Payload:* Each document contains the binary segment (`data`), its sequence order (`n`), and a link to the parent metadata file (`files_id`).
2.  **`fs.files`:** Stores the file's metadata index.
    -   Contains the unique file `_id`, filename, total length in bytes, chunk size, upload date, and file MD5 hash checks.

---

### (3) Reality Metaphor (Dismantling a Clock)
Imagine shipping a giant grandfather clock:
-   **Without GridFS:** Attempting to stuff a 7-foot grandfather clock into a standard 1-foot parcel shipping box (the 16MB limit). The cardboard rips, and the postal service rejects the box.
-   **GridFS:** Dismantling the clock into pieces:
    -   You wrap the weights in Box 1, the hands in Box 2, the pendulum in Box 3, and the gears in Box 4. (The `fs.chunks` documents).
    -   You tape a **Manifest Envelope** to Box 1 listing: *"Grandfather Clock, 4 boxes total, assemble in order 1-2-3-4."* (The `fs.files` metadata document).
    -   The recipient reads the manifest and reconstructs the clock.

---

### (4) Code Examples

#### Streaming Files with GridFS in Node.js
Here is how to upload a file to GridFS using the Node.js driver:

```javascript
const { MongoClient, GridFSBucket } = require('mongodb');
const fs = require('fs');

async function uploadVideo() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('media');

  // 1. Initialize the GridFS bucket wrapper
  const bucket = new GridFSBucket(db, { bucketName: 'videos' });

  // 2. Open a write stream pointing to GridFS files collection
  const uploadStream = bucket.openUploadStream('tutorial.mp4');

  // 3. Pipe local file stream into GridFS!
  // The driver will automatically split the file into 255KB BSON chunks!
  fs.createReadStream('./local_tutorial.mp4')
    .pipe(uploadStream)
    .on('error', (error) => console.error(error))
    .on('finish', () => {
      console.log("File uploaded successfully to GridFS!");
      client.close();
    });
}

uploadVideo();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using GridFS to store small images or document thumbnails (under 1MB), adding query roundtrip overhead

**The mistake:** Using GridFS to store 40KB user profile pictures, creating `fs.chunks` and `fs.files` records for every profile icon.

**Why it's wrong:** GridFS requires querying two separate collections (`fs.files` to get ID, then `fs.chunks` to download blocks). 

For a small 40KB file, this doubles the network queries and metadata lookup overhead. 

Small files fit easily inside the 16MB document limit.

**Fix: For files under 16MB (like avatars, images, small PDFs), store the binary data directly inside standard collection documents using the BSON `BinData` data type field. Save GridFS strictly for files larger than 16MB.**

---



### Mistake 2: Using GridFS for Small 10KB Image Files

**The mistake:** Storing small 10KB thumbnail images in GridFS.

**Why it's wrong:** GridFS chunks files across two collections (`fs.files` and `fs.chunks`). For small files under 16MB, store binary buffers in standard `BinData` fields or Cloud S3 buckets.

*Incorrect:*
```javascript
// Using GridFS for 10KB thumbnails
```

*Fix:*
```javascript
Store small images in AWS S3 or inside document BinData fields
```

### Mistake 3: Querying GridFS `fs.chunks` Directly in Application Code

**The mistake:** Executing `db.fs.chunks.find({ files_id: id })` manually to rebuild files.

**Why it's wrong:** Use official Driver GridFS Bucket APIs (`GridFSBucket.openDownloadStream()`) which assemble chunk streams automatically.

*Incorrect:*
```javascript
db.fs.chunks.find({ files_id: id }); // Manual chunk assembly anti-pattern
```

*Fix:*
```javascript
const downloadStream = bucket.openDownloadStream(fileId);
```

## 6. Practice Exercises

### Exercise 1: GridFS Math

**Problem:** You upload a **10 Megabyte** (10,485,760 bytes) PDF file to a default GridFS bucket.
1.  Calculate the total number of documents that will be created in the `fs.chunks` collection (assume a default chunk size of 255 Kilobytes (261,120 bytes)).
2.  State the number of documents that will be created in the `fs.files` collection.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Total Chunks Documents: ceil(10,485,760 / 261,120) = ceil(40.15) = 41 documents. (40 chunks of 255KB and 1 remaining chunk of 40KB).
> 2. Total Files Documents: 1 document. (The master metadata manifest index file).
> ```
> - Divide the total file bytes by the default chunk size of 261,120 bytes.
> - Round up to the nearest whole integer to account for the trailing chunk.

---



### Exercise 2: Uploading File with GridFSBucket in Node.js

**Problem:** Create GridFSBucket upload stream for file `video.mp4`.

**Expected output:**
> [!check]- Answer
> ```text
> const bucket = new GridFSBucket(db); fs.createReadStream('video.mp4').pipe(bucket.openUploadStream('video.mp4'));
> ```
> ```javascript
> const { GridFSBucket } = require('mongodb');
> const bucket = new GridFSBucket(db);
> fs.createReadStream('video.mp4')
>   .pipe(bucket.openUploadStream('video.mp4'));
> ```
>
> **Explanation:** `GridFSBucket` streams large binary files into 255KB chunk documents.

---

### Exercise 3: GridFS Collections List

**Problem:** List 2 standard collections created by GridFS (`fs.files`, `fs.chunks`).

**Expected output:**
> [!check]- Answer
> ```text
> fs.files, fs.chunks
> ```
> ```text
> fs.files, fs.chunks
> ```
>
> **Explanation:** `fs.files` stores file metadata; `fs.chunks` stores binary chunk payloads.

## 7. Related Terms

- [Document Size Limit (16 MB)](../level_05/document_size_limit.md) — The 16MB ceiling constraint.

---

## 8. Key Takeaways
- GridFS stores and retrieves files that exceed the 16MB BSON document limit.
- Splits files into binary chunks, saving each chunk as a separate document.
- Divides files into two collections: `fs.chunks` (binary data) and `fs.files` (metadata).
- Default chunk size is 255 Kilobytes per document.
- Reconstructs file streams automatically via driver APIs.
- Do not use GridFS for files under 16MB; store them directly as binary `BinData`.
- Keeps large backups or media files in the database, simplifying admin setups.
