# Data Lifecycle & TTL Strategies

> **Level 5 — Data Modeling & Schema Design**
> The design decisions and database patterns used to manage temporary data (like user sessions, API tokens, or logs) that should automatically expire, focusing on BSON TTL (Time-To-Live) indexes, Capped Collections, and archival strategies.

---

## 1. Prerequisites
- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [Date Type](../level_02/date_type.md) — The required time parameters.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Supported natively by MongoDB, Redis, and DynamoDB. Governs storage capacity sizing and disk cleaning routines).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: TTL Config Diagnose

**Problem:** You build a rate-limiting collection and write this index command:
`db.api_limits.createIndex({ ip: 1, created_at: 1 }, { expireAfterSeconds: 60 });`
The documents do not delete after 60 seconds.
1.  Explain why the TTL index is failing.
2.  Write the corrected index command.

**Expected output:**
```text
1. The TTL index is failing because it was declared as a compound index (`{ ip: 1, created_at: 1 }`). MongoDB TTL indexes must be single-field indexes; the database engine cannot apply expiration rules to compound paths.
```
```javascript
// 2. Corrected index command
db.api_limits.createIndex({ created_at: 1 }, { expireAfterSeconds: 60 });
```

> [!check]- Answer
> - Check the number of fields in the index definition keys.
> - TTL indexes can only be bound to a single date field.

---



### Exercise 2: Configuring TTL Automatic Data Expiry

**Problem:** Create TTL index on `sessions` collection expiring documents 30 days (2592000 seconds) after `createdAt`.

**Expected output:**
```text
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
```

> [!check]- Answer
> ```javascript
> db.sessions.createIndex(
>   { createdAt: 1 },
>   { expireAfterSeconds: 2592000 }
> );
> ```
>
> **Explanation:** TTL indexes automatically delete expired documents in background threads.

### Exercise 3: Modifying Existing TTL Expiry Duration

**Problem:** Command to modify existing TTL index expiry time using `collMod` command.

**Expected output:**
```text
db.runCommand({ collMod: "sessions", index: { keyPattern: { createdAt: 1 }, expireAfterSeconds: 86400 } });
```

> [!check]- Answer
> ```javascript
> db.runCommand({
>   collMod: "sessions",
>   index: {
>     keyPattern: { createdAt: 1 },
>     expireAfterSeconds: 86400
>   }
> });
> ```
>
> **Explanation:** `collMod` updates index parameters without dropping and re-building indexes.

## 7. Related Terms
- [Date Type](../level_02/date_type.md) — The data type.
- [Schema Design (Document Modeling)](schema_design.md) — Modeling rules.

---

## 8. Key Takeaways
- Data lifecycle strategies automate database cleanup for temporary records.
- TTL Indexes delete documents automatically after a specified time window.
- The TTL background thread runs once every 60 seconds on the server.
- TTL indexes must be built on single fields containing BSON Dates.
- Storing date strings or building compound TTL indexes breaks expiration.
- Capped Collections act as circular disk buffers, overwriting oldest logs.
- Helps maintain small index sizes to ensure active data fits in RAM.
