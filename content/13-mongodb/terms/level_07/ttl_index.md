# TTL (Time-To-Live) Index

> **Level 7 — Indexes & Query Performance**
> The specialized database index type that automatically deletes documents from a collection after a specified amount of time or at a specific calendar date, outlining the relative and absolute expiration strategies.

---

## 1. Prerequisites

- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The index creation triggers.
- [Data Lifecycle & TTL Strategies](../level_05/data_lifecycle.md) — The parent modeling rules.

---

## 2. Term Category

**Index / Performance** (Time-To-Live Expiration Indexing): A TTL Index automatically purges documents from a collection after a specified time interval (expireAfterSeconds) has elapsed.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Managed by a background thread running once every 60 seconds on the primary database server, which executes delete operations on expired records).

### (1) Design Motivation — "Why did we design this?"
As learned in `data_lifecycle.md`, temporary records (like sessions, logs, or OTP tokens) must be cleaned up to protect storage capacity.

We designed the **TTL Index** to automate this. 

Instead of writing application cron jobs that query and delete expired records, you build a TTL index on a Date field. 

The database storage engine monitors this index and automatically deletes documents when they expire, ensuring your collections stay small.

---

### (2) The Two Expiration Strategies

#### 1. Relative Expiration (Inactivity Timer)
Deletes documents after a fixed number of seconds have passed since the document's creation date.
-   *Setup:* Build the index with `expireAfterSeconds: <seconds>` on a creation timestamp field.
-   *Use Case:* Session tokens that expire after 1 hour (3600 seconds) of inactivity.

#### 2. Absolute Expiration (Scheduled Calendar Date)
Deletes documents at a specific, predetermined calendar date and time.
-   *Setup:* Set `expireAfterSeconds: 0` on an expiration date field (e.g. `expireAt`).
-   *Behavior:* The document expires the moment the server's clock passes the date-time stored in that document's `expireAt` field.
-   *Use Case:* Flash sales ending on a specific Friday at midnight, or scheduled tasks.

---

### (3) Reality Metaphor (Parking Tickets)
-   **Relative Expiration:** A parking ticket stamped: **"Valid for 2 Hours from issue time"**. 
    -   No matter when you park, the ticket expires exactly 120 minutes after creation.
-   **Absolute Expiration:** A concert ticket stamped: **"EXPIRES ON: JULY 21, 2026, AT 11:59 PM"** (`expireAfterSeconds: 0`). 
    -   No matter when you buy or use the ticket, the ticket becomes garbage the moment the clock strikes midnight on July 22nd.

---

### (4) Code Examples

#### 1. Relative Expiration (Delete after 2 hours)
```javascript
db.sessions.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 7200 } // 2 hours
);
```

#### 2. Absolute Expiration (Delete at a specific date)
```javascript
// Build index with expireAfterSeconds: 0
db.promotions.createIndex(
  { expireAt: 1 },
  { expireAfterSeconds: 0 } 
);

// Insert a document that expires on a specific date (e.g., Christmas)
db.promotions.insertOne({
  coupon_code: "XMAS50",
  expireAt: new Date("2026-12-25T23:59:59Z") // Deletes when this date is reached
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to build a TTL index on the primary key '_id' field, expecting it to expire documents

**The mistake:** Running `db.users.createIndex({ _id: 1 }, { expireAfterSeconds: 3600 })` to clean up temporary guest profiles.

**Why it's wrong:** MongoDB does not allow TTL constraints on the `_id` field. 

Furthermore, `_id` values are ObjectIds, not BSON Date objects. 

The command will either fail or have no effect, and guest profiles will remain in the database.

**Fix: Always create a dedicated BSON Date field (like `created_at` or `expireAt`) to support your TTL index configurations.**

---





### Mistake 2: Creating TTL Indexes on Non-Date Primitive Fields

**The mistake:** Creating a TTL index on a field containing Unix epoch seconds or ISO text strings.

**Why it's wrong:** MongoDB TTL background threads monitor ONLY BSON `Date` primitives (`new Date()`). TTL threads ignore number and string fields.

*Incorrect:*
```javascript
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Field stores string ISO date!
```

*Fix:*
```javascript
Ensure field values are BSON Date objects: { createdAt: new Date() }
```



### Mistake 3: Attempting to Create TTL Indexes on Compound Indexes

**The mistake:** Creating a compound TTL index `{ createdAt: 1, userId: 1 }` with `expireAfterSeconds`.

**Why it's wrong:** MongoDB TTL indexes CANNOT be compound indexes! TTL indexes must target a single BSON Date field.

*Incorrect:*
```javascript
db.sessions.createIndex({ createdAt: 1, userId: 1 }, { expireAfterSeconds: 3600 }); // ❌ Compound TTL error!
```

*Fix:*
```javascript
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
```



## 5. Practice Exercises

### Exercise 1: Automatic Document Expiration after Relative Time

**Scenario:**
Create a TTL index on `createdAt` in collection `sessions` expiring documents 3,600 seconds (1 hour) after creation.

**Requirements:**
1. Execute `createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.sessions.createIndex(
>   { createdAt: 1 },
>   { expireAfterSeconds: 3600 }
> );
> ```
>
> #### Technical Explanation
>
> 1. TTL indexes automatically purge expired documents from collections.
> 2. Background thread runs every 60 seconds deleting documents where `createdAt + expireAfterSeconds < current_time`.
> 3. Automates session and temporary token lifecycle management.
> 
---

### Exercise 2: Explicit Dynamic Expiration Datetime

**Scenario:**
Create a TTL index with `expireAfterSeconds: 0` expiring documents at an explicit datetime stored in `expireAt`.

**Requirements:**
1. Execute `createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.auth_tokens.createIndex(
>   { expireAt: 1 },
>   { expireAfterSeconds: 0 }
> );
> 
> db.auth_tokens.insertOne({
>   token: "ABC-123",
>   expireAt: new Date("2026-12-31T23:59:59Z")
> });
> ```
>
> #### Technical Explanation
>
> 1. Setting `expireAfterSeconds: 0` expires documents at the exact BSON Date stored in field `expireAt`.
> 2. Allows individual documents to define custom expiration timestamps.
> 3. Ideal for custom promotional leases and dynamic access tokens.
> 
---

### Exercise 3: TTL Index Constraints and Limitations

**Scenario:**
Explain why TTL indexes CANNOT be created on compound indexes or primary key `_id`.

**Requirements:**
1. List TTL index constraints.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> TTL Index Constraints:
> - Cannot be created on compound indexes (must be single-field).
> - Target field MUST contain a valid BSON Date object (strings/numbers are ignored).
> - Cannot be created on primary key '_id'.
> ```
>
> #### Technical Explanation
>
> 1. TTL background cleanup thread expects single-field date B-trees.
> 2. Non-date field values (strings, numbers) are skipped by the TTL monitor.
> 3. Essential operational constraints.
> 
---



## 6. Related Terms

- [`createIndex()` / `dropIndex()`](create_drop_index.md) — Index management.
- [Data Lifecycle & TTL Strategies](../level_05/data_lifecycle.md) — The parent modeling rules.

---

## 7. Key Takeaways
- TTL indexes automate document deletion based on BSON Date fields.
- Managed by a background system thread that runs once every 60 seconds.
- Relative expiration deletes documents after a set number of seconds.
- Absolute expiration uses `expireAfterSeconds: 0` to delete at a specific calendar date.
- TTL indexes must be single-field indexes; compound indexes are not supported.
- Cannot be built on the primary key `_id` field or on non-date fields.
- Deletions are not real-time; expect up to a 60-second latency window.
