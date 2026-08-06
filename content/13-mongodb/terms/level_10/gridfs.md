# GridFS

> **Level 10 — Administration, Security & Advanced Features**
> MongoDB's specification and driver-level API for storing and retrieving files that exceed the 16MB BSON document size limit by splitting files into binary chunks across two dedicated collections.

---

## 1. Prerequisites

- [Document Size Limit (16 MB)](../level_05/document_size_limit.md) — The 16MB ceiling constraint.

---

## 2. Term Category

**Advanced Feature** (Large Binary Blob Chunk Storage): GridFS is a specification for storing files exceeding 16MB by automatically splitting files into 255KB chunks across `fs.files` and `fs.chunks` collections.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Implemented inside client drivers. Interacts with the database by dividing file binary streams into multiple standard documents).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Uploading Large Files using GridFS Bucket

**Scenario:**
Upload a 50MB video file to MongoDB GridFS using Node.js `GridFSBucket`.

**Requirements:**
1. Instantiate `new GridFSBucket(db, { bucketName: "videos" })`.
2. Open upload stream and pipe file buffer.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { MongoClient, GridFSBucket } from "mongodb";
> import fs from "fs";
> 
> const client = new MongoClient("mongodb://localhost:27017");
> const db = client.db("media_db");
> const bucket = new GridFSBucket(db, { bucketName: "videos" });
> 
> fs.createReadStream("movie.mp4")
>   .pipe(bucket.openUploadStream("movie.mp4"))
>   .on("finish", () => console.log("File uploaded successfully to GridFS!"));
> ```
> 
> #### Technical Explanation
>
> 1. `GridFSBucket` automatically splits files larger than 16MB into 255KB chunk documents stored in `videos.chunks`.
> 2. `videos.files` stores parent metadata documents (`filename`, `length`, `chunkSize`, `uploadDate`).
> 3. Streams large files seamlessly without memory overflow.
> 
---

### Exercise 2: Streaming GridFS Files to HTTP Client Responses

**Scenario:**
Download and stream a GridFS file directly to an Express.js HTTP response stream by filename.

**Requirements:**
1. Execute `bucket.openDownloadStreamByName("movie.mp4")`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> app.get("/video/:filename", (req, res) => {
>   const bucket = new GridFSBucket(db, { bucketName: "videos" });
>   
>   res.setHeader("Content-Type", "video/mp4");
>   bucket.openDownloadStreamByName(req.params.filename)
>     .pipe(res);
> });
> ```
>
> #### Technical Explanation
>
> 1. `openDownloadStreamByName()` fetches and reassembles binary chunks from `fs.chunks` sequentially.
> 2. Piping directly to HTTP `res` streams audio/video data to clients without buffering 50MB into RAM.
> 3. Efficient binary media streaming.
> 
---

### Exercise 3: Deleting GridFS Files and Chunks

**Scenario:**
Delete a GridFS file and its corresponding binary chunk documents by file `_id`.

**Requirements:**
1. Execute `bucket.delete(fileId)`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const bucket = new GridFSBucket(db, { bucketName: "videos" });
> await bucket.delete(new ObjectId("60c72b2f9b1d8b2c88888880"));
> ```
>
> #### Technical Explanation
>
> 1. `bucket.delete(fileId)` removes the parent file document from `fs.files` AND deletes all associated 255KB chunks from `fs.chunks`.
> 2. Prevents orphaned binary chunks in the database.
> 3. Clean binary asset management.
> 
---



## 6. Related Terms

- [Document Size Limit (16 MB)](../level_05/document_size_limit.md) — The 16MB ceiling constraint.

---

## 7. Key Takeaways
- GridFS stores and retrieves files that exceed the 16MB BSON document limit.
- Splits files into binary chunks, saving each chunk as a separate document.
- Divides files into two collections: `fs.chunks` (binary data) and `fs.files` (metadata).
- Default chunk size is 255 Kilobytes per document.
- Reconstructs file streams automatically via driver APIs.
- Do not use GridFS for files under 16MB; store them directly as binary `BinData`.
- Keeps large backups or media files in the database, simplifying admin setups.
