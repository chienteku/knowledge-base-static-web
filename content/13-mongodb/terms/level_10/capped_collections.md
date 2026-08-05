# Capped Collections

> **Level 10 — Administration, Security & Advanced Features**
> The fixed-size, circular database collections in MongoDB that automatically overwrite the oldest documents when size limits are reached, supporting high-speed inserts and blocking individual document deletions.

---

## 1. Prerequisites

- [Oplog (Operations Log)](../level_09/oplog.md) — The most famous capped collection.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Configured during collection creation. Space is pre-allocated on disk to guarantee insertion speed).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Many database logging systems only care about the most recent events:
-   **App Logs:** Storing the last 10,000 error lines.
-   **Events Queue:** Maintaining a buffer of recent notifications.
-   **Replication Logs:** Tracking recent database writes (the Oplog).

If you store these events in a standard collection, the collection grows infinitely until the disk is full. 

To prevent this, you would have to write background scripts (cron jobs) to find and delete old logs daily, which wastes CPU cycles.

We designed **Capped Collections** to automate this log rotation. 

A capped collection behaves as a circular buffer queue. 

You define the maximum size limit (in bytes) on creation. 

MongoDB pre-allocates that space on disk. 

When the collection runs out of space, it automatically overwrites the oldest documents with new ones, guaranteeing that log storage remains constant with zero administration overhead.

---

### (2) Critical Restrictions of Capped Collections
Because capped collections are stored sequentially in a fixed space on disk, they enforce strict rules to maintain performance:

1.  **No Deletions:** You cannot delete individual documents (`deleteOne`/`deleteMany` are blocked). You can only delete all files by dropping the entire collection.
2.  **No Document Growth:** You can update documents, but you **cannot** execute updates that increase the document's size (like `$push` to an array). If the document grows, it cannot fit in its fixed sequential disk slot, and MongoDB blocks the write.
3.  **Natural Order:** Reads naturally return documents in the order they were written on disk, making chronological log queries incredibly fast.

---

### (3) Reality Metaphor (Tape Recorder Reels)
Imagine recording audio logs:
-   **Standard Collection:** Writing diaries in paper notebooks. 
    -   You keep adding notebooks to shelves. 
    -   Eventually, the shelves collapse under the weight, and you must manually burn old books to save room.
-   **Capped Collection:** A **Circular Tape Recorder Reel**. 
    -   The tape holds exactly 60 minutes of audio (the size limit). 
    -   When the 61st minute arrives, the tape head loops back to the start and records over the 1st minute. 
    -   The tape never runs out of space, and it always holds the latest hour.

---

### (4) Code Examples

#### Creating a Capped Collection in mongosh
To initialize a capped collection, you pass configuration flags inside options:

```javascript
// Create a capped collection named 'app_logs'
db.createCollection("app_logs", {
  capped: true,
  size: 5242880, // Mandatory: Max size in bytes (5 Megabytes)
  max: 5000      // Optional: Max count of 5000 documents
});

// Insert logs
db.app_logs.insertOne({ log_time: new Date(), msg: "User logged in" });

// If you have 5000 logs and insert one more, the oldest log document
// is deleted automatically from the start of the storage sequence.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to run delete operations on a capped collection, resulting in application runtime query exceptions

**The mistake:** Creating a capped collection for user login audits, and writing a cron cleanup route: `db.login_audits.deleteMany({ status: "resolved" })`.

**Why it's wrong:** MongoDB blocks document deletions in capped collections to preserve sequential write performance. 

Running any delete query on a capped collection throws an immediate database exception:
`Collection 'db.login_audits' is capped and cannot be deleted from`

**Fix: Do not use delete queries. Let the capped collection rotate old records out automatically. If you must clear the collection completely, drop it: `db.login_audits.drop()`.**

---



### Mistake 2: Attempting to Delete Documents from Capped Collections via `deleteMany()`

**The mistake:** Executing `db.capped_logs.deleteMany({ status: "old" })`.

**Why it's wrong:** Document deletion is NOT supported in capped collections! Capped collections overwrite oldest records automatically when space caps are reached.

*Incorrect:*
```javascript
db.capped_logs.deleteMany({ status: "old" }); // ❌ Cannot delete from capped collection!
```

*Fix:*
```javascript
Rely on automatic circular buffer overwriting or drop collection: db.capped_logs.drop()
```

### Mistake 3: Updating Documents in Capped Collections Increasing BSON Byte Size

**The mistake:** Updating a document in a capped collection expanding its BSON byte size.

**Why it's wrong:** Updates in capped collections MUST NOT increase the original BSON document size. Size-expanding updates fail.

*Incorrect:*
```javascript
db.capped_logs.updateOne({ _id: id }, { $set: { extraData: "very_long_string" } }); // ❌ Fails if size expands!
```

*Fix:*
```javascript
Keep document sizes fixed or use standard non-capped collections
```

## 6. Practice Exercises

### Exercise 1: Update Feasibility Diagnostic

**Problem:** You have a capped collection `chat_history`. A document is stored as:
`{ _id: 1, user: "Bob", status: "online" }`
Evaluate whether the following two update operations will succeed on this document:
1.  `db.chat_history.updateOne({ _id: 1 }, { $set: { status: "offline" } })`
2.  `db.chat_history.updateOne({ _id: 1 }, { $push: { messages: "Hello!" } })`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Succeeds: Setting `status` from "online" to "offline" changes string value but keeps the document within its pre-allocated size bounds.
> 2. Fails: The `$push` operator adds an array field and an element, growing the document's size beyond its pre-allocated disk slot. MongoDB will block this operation to prevent size violations in the capped collection.
> ```
> - Review the size growth restrictions in capped collections.
> - Consider if array modifications alter BSON byte sizes on disk.

---



### Exercise 2: Creating Capped Collection

**Problem:** Create capped collection `app_logs` capped at 10MB (10485760 bytes) and max 5000 documents.

**Expected output:**
> [!check]- Answer
> ```text
> db.createCollection("app_logs", { capped: true, size: 10485760, max: 5000 });
> ```
> ```javascript
> db.createCollection("app_logs", {
>   capped: true,
>   size: 10485760,
>   max: 5000
> });
> ```
>
> **Explanation:** `capped: true` maintains fixed-size circular buffer storage collections.

---

### Exercise 3: Tailable Cursor on Capped Collection

**Problem:** Create tailable cursor listening for new insertions in capped collection `app_logs`.

**Expected output:**
> [!check]- Answer
> ```text
> const cursor = db.app_logs.find().addCursorFlag("tailable", true).addCursorFlag("awaitData", true);
> ```
> ```javascript
> const cursor = db.app_logs.find()
>   .addCursorFlag("tailable", true)
>   .addCursorFlag("awaitData", true);
> ```
>
> **Explanation:** Tailable cursors remain open after reaching the end of capped collections, streaming new inserts like `tail -f`.

## 7. Related Terms

- [Oplog (Operations Log)](../level_09/oplog.md) — The most famous capped collection.
- [Time-Series Collections](time_series.md) — Chronological metrics.

---

## 8. Key Takeaways
- Capped collections maintain a fixed size on disk as a circular buffer queue.
- Automatically overwrite the oldest documents when size limits are reached.
- Pre-allocated storage space guarantees high-speed insert write rates.
- Individual document deletions are forbidden; only dropping the collection is allowed.
- Updates that grow document byte sizes on disk are blocked.
- Natural order queries return documents in insertion order, optimizing log reads.
- Always configure the mandatory `size` parameter when initializing.
