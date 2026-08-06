# Data Lifecycle & TTL Strategies

> **Level 5 — Data Modeling & Schema Design**
> The design decisions and database patterns used to manage temporary data (like user sessions, API tokens, or logs) that should automatically expire, focusing on BSON TTL (Time-To-Live) indexes, Capped Collections, and archival strategies.

---

## 1. Prerequisites

- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [Date](../level_02/date_type.md) — The required time parameters.

---

## 2. Term Category

**Data Modeling** (TTL & Archive Management): Data Lifecycle Management controls document retention using Time-to-Live (TTL) indexes and archival strategies for automated data expiration.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported natively by MongoDB, Redis, and DynamoDB. Governs storage capacity sizing and disk cleaning routines).

### (1) Design Motivation — "Why did we design this?"
Not all database data should live forever:
-   **User Sessions:** An auth session should expire after 24 hours of inactivity.
-   **API rate limits:** Trackers should clear out after 60 seconds.
-   **System logs:** Debug logs are useless after 30 days.

If you let this temporary data accumulate:
-   Disk storage costs soar.
-   Indexes grow too large to fit in server RAM cache, slowing down all queries.
-   Your backend developer must write complex cron cleanup scripts that query and delete rows, driving database load during peak hours.

To solve this, MongoDB provides built-in **Data Lifecycle Strategies** to automatically clean up disk files without application intervention.

---

### (2) The Two Core Lifecycle Tools

#### 1. TTL (Time-To-Live) Indexes
A specialized single-field index that automatically deletes documents from a collection after a specified number of seconds or at a specific calendar date.
-   *How it works:* MongoDB runs a background thread (once every 60 seconds) that scans the TTL index and deletes expired documents.
-   *Note on millisecond latency:* Because the thread runs every minute, a document is not deleted the exact millisecond it expires.

#### 2. Capped Collections (Circular Buffers)
Fixed-size collections that automatically overwrite the oldest documents when they hit a size limit (in bytes) or count limit. (We will learn Capped Collections in Level 10).

---

### (3) Reality Metaphor
Imagine managing trash and food safety:
-   **TTL Index:** A sticky note on a carton of milk labeled **"EXPIRES ON: JULY 21"**. 
    -   An office janitor (the background thread) walks around the kitchen fridge once a day, checks the dates on the cartons, and throws away anything past its expiration date.
-   **Capped Collection:** A small desk garbage can that holds exactly **10 soda cans**. 
    -   When you drop can #11 inside, Can #1 automatically falls out a trapdoor at the bottom into a recycle chute. The can count never exceeds 10.

---

### (4) Code Examples

#### Creating a TTL Session Expirer
Let's make sessions automatically delete 1 hour (3600 seconds) after creation:

```javascript
// 1. Create a session document with a BSON Date field
db.sessions.insertOne({
  session_token: "xyz123",
  user_id: 105,
  created_at: new Date() // Must be a BSON Date!
});

// 2. Build the TTL index on the Date field
db.sessions.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 3600 } // Time in seconds
);
```

To verify index creation, run:
`db.sessions.getIndexes()`

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing the date field as a text string instead of a BSON Date type when using TTL indexes

**The mistake:** Running the query `{ created_at: "2026-07-21T23:00:00Z" }` (saving a string) on a collection that has a TTL index.

**Why it's wrong:** MongoDB's TTL background thread only evaluates fields containing BSON Dates or arrays of BSON Dates. 

If the field value is a string, the thread ignores it, and the document will sit on disk forever, bloating your storage.

**Fix: Always use the `new Date()` constructor to write BSON Date values to your TTL fields.**

---



### Mistake 2: Running Manual `cron` Batch Deletion Scripts for Archiving Log Data

**The mistake:** Running a nightly `db.logs.deleteMany({ createdAt: { $lt: oldDate } })` script in production.

**Why it's wrong:** Large `deleteMany()` batch scripts generate heavy disk IOPS, WiredTiger cache pressure, and oplog replication lag. Use TTL Indexes (`expireAfterSeconds`) or Time-Series Collections.

*Incorrect:*
```javascript
// Nightly cron job executing deleteMany on millions of log records
```

*Fix:*
```javascript
db.logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Automatic background TTL expiry
```

### Mistake 3: Creating TTL Indexes on Non-Date Primitive Fields

**The mistake:** Creating a TTL index on a field containing epoch numbers or string date representations.

**Why it's wrong:** TTL indexes monitor ONLY BSON Date primitives (`new Date()`) or arrays of Date primitives. TTL background threads ignore string or number fields.

*Incorrect:*
```javascript
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Field stores string ISO date!
```

*Fix:*
```javascript
Ensure field values are BSON Date objects: { createdAt: new Date() }
```

## 5. Practice Exercises

### Exercise 1: Configuring Time-To-Live (TTL) Automatic Document Expiration

**Scenario:**
Configure a TTL index on collection `user_sessions` so that session documents automatically expire 24 hours (86,400 seconds) after `createdAt`.

**Requirements:**
1. Create TTL index on `createdAt` with `expireAfterSeconds: 86400`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.user_sessions.createIndex(
>   { createdAt: 1 },
>   { expireAfterSeconds: 86400 }
> );
> ```
>
> #### Technical Explanation
>
> 1. TTL indexes automatically delete expired documents in the background.
> 2. A background thread runs every 60 seconds to purge documents where `createdAt + expireAfterSeconds < current_time`.
> 3. Eliminates manual cleanup cron jobs.

---

### Exercise 2: Dynamic Per-Document Expiration Times

**Scenario:**
Configure a TTL index with `expireAfterSeconds: 0` so that documents expire at an explicit datetime stored in field `expireAt`.

**Requirements:**
1. Create TTL index on `expireAt` with `expireAfterSeconds: 0`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.promo_codes.createIndex(
>   { expireAt: 1 },
>   { expireAfterSeconds: 0 }
> );
> 
> // Insert promo code expiring at explicit target date
> db.promo_codes.insertOne({
>   code: "SUMMER2026",
>   expireAt: new Date("2026-08-31T23:59:59Z")
> });
> ```
>
> #### Technical Explanation
>
> 1. Setting `expireAfterSeconds: 0` expires documents at the exact BSON Date value stored in the indexed field.
> 2. Allows individual documents to specify custom, dynamic expiration timestamps.
> 3. Ideal for promotional codes, temporary tokens, and custom leases.

---

### Exercise 3: Archiving Historical Data to Cold Storage

**Scenario:**
Move orders older than 1 year from active collection `orders` to archive collection `orders_archive` before deletion.

**Requirements:**
1. Execute bulk export/copy and `deleteMany()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
> 
> // 1. Copy old orders to archive collection
> const oldOrders = db.orders.find({ createdAt: { $lt: oneYearAgo } }).toArray();
> if (oldOrders.length > 0) {
>   db.orders_archive.insertMany(oldOrders);
>   
>   // 2. Delete copied orders from active collection
>   db.orders.deleteMany({ createdAt: { $lt: oneYearAgo } });
> }
> ```
>
> #### Technical Explanation
>
> 1. Archiving old data maintains small working sets in active operational collections.
> 2. Keeps active index sizes small enough to fit within RAM.
> 3. Reduces disk IOPS and speeds up daily queries.

---



## 6. Related Terms

- [Date](../level_02/date_type.md) — The data type.
- [Schema Design (Document Modeling)](schema_design.md) — Modeling rules.
- [TTL (Time-To-Live) Index](../level_07/ttl_index.md) — Related concept: TTL (Time-To-Live) Index.

---

## 7. Key Takeaways
- Data lifecycle strategies automate database cleanup for temporary records.
- TTL Indexes delete documents automatically after a specified time window.
- The TTL background thread runs once every 60 seconds on the server.
- TTL indexes must be built on single fields containing BSON Dates.
- Storing date strings or building compound TTL indexes breaks expiration.
- Capped Collections act as circular disk buffers, overwriting oldest logs.
- Helps maintain small index sizes to ensure active data fits in RAM.
