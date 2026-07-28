# Index (Concept in MongoDB)

> **Level 7 — Indexes & Query Performance**
> The sorted, auxiliary data structure (typically a B-Tree) managed by MongoDB's storage engine that maps specific document field values to their physical location on disk, drastically reducing query search times.

---

## 1. Prerequisites
- [Collection](../level_01/collection.md) — The collection where indexes are built.
- [Index (Concept - PostgreSQL)](../../../12-postgres/terms/level_07/index_concept.md) — Relational index conceptual foundations.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **Universal Standard** (Supported across all relational and NoSQL databases. Managed by MongoDB's default WiredTiger storage engine inside server memory).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When a database collection is small (e.g. 50 documents), searching for a specific user name is instant. 

However, as your collection grows to 10 million documents:
-   If you run `db.users.find({ email: "alice@mail.com" })` without an index:
-   The database engine must load and read **every single document** on disk from start to finish to check if the email matches. 
-   This is called a **Collection Scan** (equivalent to a SQL Table Scan). 
-   It consumes massive disk I/O, utilizes 100% CPU, and takes seconds or minutes, lagging your website.

We designed **Indexes** to solve this read bottleneck. 

An index is a sorted dictionary of a specific field (like a phone book sorted by last name) stored in RAM. 

Instead of reading all documents, the query engine searches the index (which takes logarithmic time, e.g. $\sim 20$ operations instead of 10,000,000) to find the target email and gets a direct pointer to the document's physical location on disk.

---

### (2) The Write Overhead Trade-off
While indexes make reads fast, they carry a performance cost:
-   **Disk/RAM footprint:** Indexes consume storage space.
-   **Write overhead:** Every time your application runs `insertOne()`, `updateOne()`, or `deleteOne()`, the database must write the document and **re-balance the sorted index B-Tree structures**. 
-   If you build too many indexes, your writes will become slow.

---

### (3) Reality Metaphor (Book Glossaries)
Imagine finding information in a 1,000-page historical textbook:
-   **No Index (Collection Scan):** Reading the textbook page-by-page, line-by-line, looking for the word `"Waterloo"`. (Takes days).
-   **With Index (Index Scan):** Flipping directly to the **Alphabetical Index Glossary** at the back of the book. 
    -   You find the entry `"Waterloo"`. 
    -   It lists `"Page 450"`. 
    -   You flip directly to page 450 in 2 seconds.

---

### (4) Code Examples

#### The Default _id Index
MongoDB automatically builds a unique index on the primary key `_id` field for every collection created. You can list the active indexes on a collection:

```javascript
db.users.getIndexes();
// Output showing the default _id index:
// [
//   {
//     "v": 2,
//     "key": { "_id": 1 },
//     "name": "_id_"
//   }
// ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Building indexes on every field in a collection to make all possible queries fast

**The mistake:** Creating indexes on `name`, `age`, `country`, `created_at`, `status`, and `zip_code` on a high-throughput transaction logging table.

**Why it's wrong:** This is called **Index Inflation** (which we saw in `anti_patterns.md`). 

Every index must be updated on every write. 

If you have 6 indexes, every single insert forces MongoDB to execute 7 disk writes (1 for the document, 6 to update the B-Trees), causing severe write bottlenecks. 

Furthermore, indexes compete for server RAM cache space, displacing documents and slowing down reads.

**Fix: Only build indexes on fields that are frequently queried in search filters (`$match`), sorting fields (`$sort`), or unique field constraints.**

---



### Mistake 2: Creating Too Many Un-Necessary Indexes on High-Write Collections

**The mistake:** Creating 30 indexes on a high-throughput write collection.

**Why it's wrong:** EVERY insert, update, or delete operation MUST update all associated collection indexes! Excessive indexes severely degrade write throughput and consume WiredTiger RAM.

*Incorrect:*
```javascript
// Creating 30 indexes on high-throughput write collection
```

*Fix:*
```javascript
Maintain concise targeted compound indexes based on ESR rule
```

### Mistake 3: Assuming Indexes Automatically Improve All Query Execution Speeds

**The mistake:** Creating indexes on fields with low cardinality (e.g. `gender: 1` or `booleanFlag: 1`).

**Why it's wrong:** Indexes on low-cardinality fields (where 50% of documents match) provide poor selectivity, often prompting the query planner to prefer `COLLSCAN`.

*Incorrect:*
```javascript
db.users.createIndex({ gender: 1 }); // Low selectivity index
```

*Fix:*
```javascript
Index high-cardinality unique fields or compound ESR fields
```



### Mistake 4: Creating Too Many Un-Necessary Indexes on High-Write Collections

**The mistake:** Creating 30 indexes on a high-throughput write collection.

**Why it's wrong:** EVERY insert, update, or delete operation MUST update all associated collection indexes! Excessive indexes severely degrade write throughput and consume WiredTiger RAM.

*Incorrect:*
```javascript
// Creating 30 indexes on high-throughput write collection
```

*Fix:*
```javascript
Maintain concise targeted compound indexes based on ESR rule
```

### Mistake 5: Assuming Indexes Automatically Improve All Query Execution Speeds

**The mistake:** Creating indexes on fields with low cardinality (e.g. `gender: 1` or `booleanFlag: 1`).

**Why it's wrong:** Indexes on low-cardinality fields (where 50% of documents match) provide poor selectivity, often prompting the query planner to prefer `COLLSCAN`.

*Incorrect:*
```javascript
db.users.createIndex({ gender: 1 }); // Low selectivity index
```

*Fix:*
```javascript
Index high-cardinality unique fields or compound ESR fields
```

## 6. Practice Exercises

### Exercise 1: Index Trade-off Analysis

**Problem:** You are designing a high-traffic message inbox system. Messages are inserted thousands of times a second. Users read their messages by filtering on `recipient_id`.
1.  Explain why you should build an index on `recipient_id`.
2.  Explain why you should not build an index on the message `body_text` field.

**Expected output:**
```text
1. You should index `recipient_id` because users constantly query their inbox matching this field. The index enables instant lookups, preventing slow collection scans during peak user reads.
2. You should not index the message `body_text` because messages are written at a high volume (thousands per second). Indexing long text bodies consumes massive RAM, bloats index storage, and slows down database inserts as the B-Tree must constantly be re-balanced with heavy text payloads.
```

> [!check]- Answer
> - Assess the frequency and requirement of reads vs the cost of writes.
> - Consider the size footprint of indexing long string bodies.

---



### Exercise 2: B-Tree Index Structure Explanation

**Problem:** What underlying data structure powers standard MongoDB single and compound indexes? (B-Tree).

**Expected output:**
```text
B-Tree (Balanced Tree)
```

> [!check]- Answer
> ```text
> B-Tree (Balanced Tree)
> ```
>
> **Explanation:** B-Tree index structures enable $O(\log N)$ key search and range traversal times.

### Exercise 3: Index Storage Location

**Problem:** Where are collection indexes stored on disk and memory? (Stored in WiredTiger cache RAM and persisted on disk).

**Expected output:**
```text
Cached in WiredTiger RAM and persisted in index storage files
```

> [!check]- Answer
> ```text
> Cached in WiredTiger RAM and persisted in index storage files
> ```
>
> **Explanation:** Active index working sets are kept in RAM for fast key lookups.

## 7. Related Terms
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — Index management.
- [Collection Scan vs Index Scan](collection_scan_vs_index.md) — The search methods.

---

## 8. Key Takeaways
- An Index is a sorted auxiliary B-Tree structure mapping values to disk offsets.
- Drastically speeds up search filters and sorting operations.
- Every collection has a default, immutable unique index built on the `_id` field.
- Indexes reside in RAM to ensure high-speed lookups.
- Building too many indexes slows down insert/update/delete write queries.
- Limit indexes to fields that are frequently matched or sorted in queries.
- Index scans (IXSCAN) are exponentially faster than collection scans (COLLSCAN).
