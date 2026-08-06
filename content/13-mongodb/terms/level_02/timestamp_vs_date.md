# `Timestamp` vs. `Date`

> **Level 2 — BSON Data Types & Document Structure**
> The comparison between the two time-related BSON data types: `Date` (for general application time-tracking) and `Timestamp` (a specialized type used internally by MongoDB's replication system).

---

## 1. Prerequisites

- [Date](date_type.md) — The standard calendar time data type.
- [Replication (Streaming / Logical)](../../../12-postgres/terms/level_10/replication.md) — The sync architecture context.

---

## 2. Term Category

**Core Concept** (Internal Replication vs Application Time): Timestamp vs Date contrasts MongoDB's internal 64-bit replication op-log timestamp counter against application-facing UTC BSON Date objects.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Both are stored as 64-bit values. `Date` is standard; `Timestamp` carries special behaviors that cause it to auto-increment when written to database indexes).

### (1) Design Motivation — "Why did we design this?"
MongoDB developers exploring system catalogs or documentation often spot two similar time data types: `Date` and `Timestamp`. 

This leads to confusion:
-   *"Should I use Timestamp to log my users' registration times?"*
-   *"Are they the same thing under different names?"*

The answer is: **No, they serve completely different purposes.**

We designed the two types to isolate application calendars from internal replication pipelines:
-   **`Date`** is designed for **developers**. It logs real-world calendar dates with millisecond precision.
-   **`Timestamp`** is a highly specialized type designed for **MongoDB's internal synchronization engine**. 

To replicate data across multiple backup servers, MongoDB writes writes to a sequential change stream log called the **Oplog** (Operations Log). 

The replication engine must guarantee that every log entry has a unique, strictly incrementing time marker, even if the primary server executes 10,000 queries in the exact same second. 

`Timestamp` contains an incrementing counter specifically to solve this ordering problem.

---

### (2) Structural Differences

| Dimension | BSON `Date` | BSON `Timestamp` |
| :--- | :--- | :--- |
| **Type Identifier** | BSON Type `9`. | BSON Type `17`. |
| **Anatomy** | 64-bit integer (milliseconds since epoch). | 32-bit seconds since epoch + 32-bit incrementing counter. |
| **Primary Use** | Application code dates and deadlines. | MongoDB replication logging (Oplog ordering). |
| **Value updates** | Static (must be manually set by code). | Dynamic (auto-increments on write operations). |
| **Rule of Thumb** | **Always use this for app data.** | **Never use this for app data.** |

---

### (3) Reality Metaphor
Imagine managing a business office:
-   **`Date`:** The **Wall Calendar** on your desk. You write appointments, deadlines, and user registration dates. It is a reference tool for scheduling.
-   **`Timestamp`:** The electronic **Finish-Line Race Timer** at a horse race track. 
    -   If two horses cross the line in the same second, the timer starts a millisecond decimal counter (`i`) to determine who crossed first. 
    -   The timer is managed exclusively by the racetrack referees (MongoDB's replication system) to order the race events. You don't use the race timer to schedule your next business meeting.

---

### (4) Code Examples

#### 1. What happens if you insert a Timestamp in your data?
If you try to run the shell constructor `Timestamp()`, you will get a split value:

```javascript
db.logs.insertOne({
  event: "click",
  
  // DANGER: Do not do this for application dates!
  sys_time: Timestamp() 
});

db.logs.find();
// Output:
// { "_id": ObjectId("..."), "event": "click", "sys_time": Timestamp({ t: 17846496, i: 1 }) }
// Note: 't' represents seconds, 'i' represents the incrementing ordinal counter.
```

If you insert another document immediately in the same session, the ordinal counter `i` will auto-increment to `2` automatically to maintain strict write sequence matching.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing application calendar dates (like registration date or payment date) using the BSON Timestamp type

**The mistake:** Declaring a field as a `Timestamp` in your schema validation rules, thinking it is synonymous with SQL's `TIMESTAMP` type.

**Why it's wrong:** In SQL, the `TIMESTAMP` type is equivalent to MongoDB's `Date` type. 

If you use BSON `Timestamp` in MongoDB:
-   Your date loses millisecond precision (it only counts seconds).
-   The value will change or auto-increment unexpectedly during updates due to the replication counter.
-   Standard programming languages (like Node.js or Python) cannot parse it directly to a native calendar date without manual conversions, introducing code bugs.

**Fix: Always use `Date` (instantiated using `new Date()`) for all application time-tracking. Leave `Timestamp` strictly to MongoDB's internal processes.**

---



### Mistake 2: Using BSON `Timestamp` Data Type for Application Wall-Clock Timestamps

**The mistake:** Using `Timestamp()` type for application `createdAt` document fields.

**Why it's wrong:** BSON `Timestamp` is a internal 64-bit data type used exclusively by MongoDB internally for the Replication Oplog. Applications should use BSON `Date` (`new Date()`).

*Incorrect:*
```javascript
db.posts.insertOne({ createdAt: new Timestamp() }); // ❌ Internal Oplog type!
```

*Fix:*
```javascript
db.posts.insertOne({ createdAt: new Date() }); // Standard application BSON Date
```

### Mistake 3: Confusing Unix Epoch Milliseconds with Seconds in Timestamp Conversions

**The mistake:** Passing Unix epoch seconds (1700000000) into `new Date(1700000000)`.

**Why it's wrong:** `new Date(ms)` expects milliseconds! Passing seconds yields dates in January 1970. Multiply epoch seconds by 1000.

*Incorrect:*
```javascript
new Date(1700000000); // ❌ Evaluates to Jan 20, 1970!
```

*Fix:*
```javascript
new Date(1700000000 * 1000); // Correct millisecond conversion
```

## 5. Practice Exercises

### Exercise 1: Inspecting Oplog BSON Timestamps

**Scenario:**
Inspect the internal 64-bit BSON `Timestamp` stored in a replica set oplog entry in `local.oplog.rs`.

**Requirements:**
1. Query `local.oplog.rs` for the latest oplog entry.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> use local;
> const latestOp = db.oplog.rs.find().sort({ $natural: -1 }).limit(1).next();
> console.log("Oplog BSON Timestamp (ts):", latestOp.ts);
> ```
>
> #### Technical Explanation
>
> 1. BSON `Timestamp` (Type 17) is a 64-bit value: 32-bit epoch seconds + 32-bit incrementing ordinal counter.
> 2. Used internally by MongoDB replication and change streams to order oplog events deterministically.
> 3. Distinct from application BSON `Date` (Type 9).
> 
---

### Exercise 2: Application Date Field Selection

**Scenario:**
Store user registration time using application-facing BSON `Date` instead of internal `Timestamp`.

**Requirements:**
1. Insert document using `registeredAt: new Date()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.insertOne({
>   username: "alice",
>   registeredAt: new Date()
> });
> ```
>
> #### Technical Explanation
>
> 1. BSON `Date` (Type 9) is the standard type for application datetime attributes.
> 2. Supported natively across all language drivers (Node.js `Date`, Python `datetime`).
> 3. `Timestamp` should only be used when dealing with internal replication or change stream resume tokens.
> 
---

### Exercise 3: Comparing BSON Type Codes for Timestamp vs Date

**Scenario:**
Query collection `events` using `$type` to confirm field `time` is BSON `Date` (Code 9 / `"date"`) and not `Timestamp` (Code 17 / `"timestamp"`).

**Requirements:**
1. Filter using `{ time: { $type: "date" } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.events.find({
>   time: { $type: "date" }
> });
> ```
>
> #### Technical Explanation
>
> 1. BSON Type Code 9 = `Date` (64-bit UTC timestamp).
> 2. BSON Type Code 17 = `Timestamp` (internal replication opcode counter).
> 3. Ensures schema type correctness across document properties.
> 
---



## 6. Related Terms

- [Date](date_type.md) — The developer date type.
- [Replication (Streaming / Logical)](../../../12-postgres/terms/level_10/replication.md) — The replication pipeline.

---

## 7. Key Takeaways
- `Date` stores calendar times with millisecond precision; use for applications.
- `Timestamp` is a specialized type reserved for MongoDB replication syncs.
- `Timestamp` combines epoch seconds with an ordinal counter to order events.
- Never use BSON `Timestamp` for custom fields in application databases.
- BSON `Date` is the direct equivalent of PostgreSQL's `TIMESTAMPTZ` type.
- In `mongosh`, BSON Dates display wrapped inside the `ISODate()` function.
- Always use `new Date()` to log calendar events securely.
