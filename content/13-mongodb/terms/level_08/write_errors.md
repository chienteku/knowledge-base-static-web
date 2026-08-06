# `WriteConcernError` / `WriteError`

> **Level 8 — Transactions, Consistency & Durability**
> The database write error classifications in MongoDB, comparing `WriteError` (document-level validation or constraint failures) with `WriteConcernError` (replication acknowledgment timeouts on replica sets).

---

## 1. Prerequisites

- [Write Concern](write_concern.md) — The write acknowledgment parameters.

---

## 2. Term Category

**Driver / Integration** (Write Command Failure Handling): Write Errors classify write command failures into top-level execution errors, individual document write errors, and write concern replication timeouts.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Returned by database write commands. Structured as JSON error properties in driver exceptions to guide application error recovery logic).

### (1) Design Motivation — "Why did we design this?"
In high-scale database programming, handling errors correctly is critical to prevent data duplication. 

When your application attempts to insert a document and it fails, the database driver throws an exception.

However, a write failure can mean two completely different things:
1.  The document contains bad data and was rejected.
2.  The document was saved successfully on the primary node, but the backup nodes failed to replicate it in time.

We designed **`WriteError`** and **`WriteConcernError`** to separate these issues. 

By categorizing errors, your application can distinguish between logical failures (which should not be retried) and replica replication timeouts (which require network investigation but mean the write *was* saved).

---

### (2) The Error Classifications

#### 1. `WriteError` (Logical/Document Failure)
Occurs when the database rejects the write operation due to document-level validation errors or database constraints.
-   *Examples:* Duplicate key error (`11000`), schema validation failure, or out-of-disk space.
-   *State on Disk:* **No write occurred.** The document was discarded.
-   *Action:* Do not retry the same write. Fix the data or report the validation error to the client.

#### 2. `WriteConcernError` (Replication Failure)
Occurs when the write operation succeeds on the primary node, but fails to replicate to the requested number of secondary nodes within the `wtimeout` limit.
-   *State on Disk:* **The write succeeded on the Primary node.**
-   *Action:* Do not blindly retry the insert (it could cause duplicate key errors or duplicate documents). Check replication lag metrics.

---

### (3) Reality Metaphor (Movie Theater Checkouts)
Imagine buying a movie ticket:
-   **`WriteError` (Card Declined):** The cashier slides your card. The terminal display says: **"DECLINED: EXPIRED CARD"**. 
    -   No transaction occurred. 
    -   You walk away without a ticket. 
    -   Retrying with the same card is useless; you must provide a valid card.
-   **`WriteConcernError` (Network Drop):** The cashier charges your card, prints the ticket, and hands it to you. 
    -   However, as they hand it over, the theater's local network drops, preventing the cashier's computer from updating the seat charts on the display screens in the hallway. 
    -   You have the ticket, but the secondary displays are laggy.

---

### (4) Code Examples

#### Auditing Driver Write Error Payloads
Here are the JSON structures returned by the MongoDB driver during write failures:

```javascript
// 1. Example of a WriteError (Duplicate Key)
{
  "writeErrors": [
    {
      "index": 0,
      "code": 11000,
      "errmsg": "E11000 duplicate key error collection: shop.users index: email_1 dup key: { email: 'alice@mail.com' }"
    }
  ],
  "writeConcernErrors": []
}

// 2. Example of a WriteConcernError (Replication Timeout)
{
  "writeErrors": [],
  "writeConcernErrors": [
    {
      "code": 64,
      "errmsg": "waiting for replication timed out",
      "errInfo": {
        "wtimeout": true
      }
    }
  ]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Treating 'WriteConcernError' as a standard write failure and blindly resending the insert query, causing duplicate entries

**The mistake:** Receiving a write concern timeout error during a checkout query, and immediately running the insert statement again without checking if the document was already written to the primary node.

**Why it's wrong:** Because the write succeeded on the primary node, resending the insert will trigger a duplicate key error (if the collection has a unique index) or write a duplicate order entry (if the collection has no unique index).

**Fix: When catching write concern errors, verify if the document exists in the database, or design your schema to use unique primary keys (`_id`) to block duplicate inserts automatically.**

---



### Mistake 2: Ignoring Duplicate Key Exception Error Code `11000` in Application Code

**The mistake:** Swallowing unique index constraint violations in generic `catch {}` blocks without informing users.

**Why it's wrong:** Duplicate key violations throw error code `11000`. Swallowing error 11000 causes silent signup or update failures.

*Incorrect:*
```javascript
try { await db.users.insertOne({ email }); } catch (e) {} // ❌ Swallows duplicate email error!
```

*Fix:*
```javascript
try { await db.users.insertOne({ email }); } catch (err) { if (err.code === 11000) throw new Error("Email taken"); }
```

### Mistake 3: Failing to Inspect `writeErrors` Array in `bulkWrite()` Un-Ordered Execution Results

**The mistake:** Calling `bulkWrite(ops, { ordered: false })` without checking `result.writeErrors`.

**Why it's wrong:** Unordered `bulkWrite()` continues executing remaining writes when individual operations fail, recording errors in `result.writeErrors`. Inspect the error array.

*Incorrect:*
```javascript
const res = await db.coll.bulkWrite(ops, { ordered: false }); // ❌ Ignores individual writeErrors!
```

*Fix:*
```javascript
const res = await db.coll.bulkWrite(ops, { ordered: false }); if (res.hasWriteErrors()) console.error(res.writeErrors);
```

## 5. Practice Exercises

### Exercise 1: Handling Duplicate Key Write Errors (Code 11000)

**Scenario:**
Catch and handle `E11000 duplicate key error` during account registration in Node.js.

**Requirements:**
1. Inspect `err.code === 11000`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> try {
>   await db.collection("users").insertOne({ email: "alice@example.com" });
> } catch (err) {
>   if (err.code === 11000) {
>     console.error("Write Error: Email address is already registered.");
>   } else {
>     throw err;
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. Unique index violations return `MongoServerError` with error code `11000`.
> 2. Catching `11000` allows applications to return HTTP 409 Conflict status codes cleanly.
> 3. Prevents unhandled application server crashes.
> 
---

### Exercise 2: Inspecting Bulk Write Partial Error Arrays

**Scenario:**
Inspect `writeErrors` array returned when an unordered `bulkWrite()` encounters individual document write failures.

**Requirements:**
1. Catch `MongoBulkWriteError` and inspect `err.writeErrors`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> try {
>   await db.collection("products").bulkWrite([
>     { insertOne: { document: { _id: 1, name: "A" } } },
>     { insertOne: { document: { _id: 1, name: "B" } } }, // Duplicate!
>     { insertOne: { document: { _id: 2, name: "C" } } }
>   ], { ordered: false });
> } catch (err) {
>   if (err.name === "MongoBulkWriteError") {
>     console.log("Successful Inserts:", err.result.nInserted);
>     console.log("Individual Write Errors:", err.writeErrors);
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. In unordered bulk writes (`ordered: false`), failed items generate entries in `writeErrors` while valid items succeed.
> 2. `err.writeErrors` contains details on exact document index positions and error codes.
> 3. Enables fine-grained batch error recovery.
> 
---

### Exercise 3: Handling Write Concern Timeout Errors

**Scenario:**
Catch `WriteConcernError` when a majority write fails to replicate within specified `wtimeout`.

**Requirements:**
1. Check `err.hasWriteConcernError()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> try {
>   await db.collection("orders").insertOne(
>     { orderId: "ORD-900" },
>     { writeConcern: { w: "majority", wtimeout: 2000 } }
>   );
> } catch (err) {
>   if (err.hasWriteConcernError && err.hasWriteConcernError()) {
>     console.warn("Write succeeded on primary, but secondary replication timed out!");
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. `WriteConcernError` indicates the write completed on the primary node, but secondary replication acknowledgment exceeded `wtimeout`.
> 2. The write was NOT rolled back, but durability acknowledgment failed within the timeout.
> 3. Crucial distinction for distributed system error handling.
> 
---



## 6. Related Terms

- [Write Concern](write_concern.md) — The write acknowledgment parameters.
- [Retryable Writes / Retryable Reads](retryable_operations.md) — Network recovery.

---

## 7. Key Takeaways
- `WriteError` indicates logical document failures (e.g. duplicate keys).
- `WriteConcernError` indicates replication timeouts across secondaries.
- Under a `WriteError`, the write failed and no changes were saved.
- Under a `WriteConcernError`, the write succeeded on the Primary node.
- Do not blindly retry insert commands after catching write concern timeouts.
- Use unique constraints (`_id` or unique indexes) to block duplicate retry writes.
- Audit replica set synchronization lag when write concern errors occur.
