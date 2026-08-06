# Retryable Writes / Retryable Reads

> **Level 8 — Transactions, Consistency & Durability**
> MongoDB's driver-level mechanism that automatically retries read and write operations once when encountering transient network glitches or replica set elections, ensuring high availability with zero application-level boilerplate.

---

## 1. Prerequisites

- [`WriteConcernError` / `WriteError`](write_errors.md) — The write failure context.
- [Replica Set](../level_09/replica_set.md) — The distributed cluster.

---

## 2. Term Category

**Driver / Integration** (Automated Network Retry Mechanism): Retryable Reads and Retryable Writes automatically retry supported read/write commands once upon encountering transient network failures or primary node elections.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Enabled by default in modern MongoDB drivers. Configured via connection string parameters `retryWrites=true` and `retryReads=true`).

### (1) Design Motivation — "Why did we design this?"
In a distributed database cluster, servers occasionally reboot, network switches blip, and replica sets trigger elections to choose a new primary.

If your Node.js application attempts to save a document during a 2-second election window:
-   The query fails because the old primary is no longer writable.
-   Historically, developers had to write complex retry loops around every query to handle these temporary glitches.
-   If you forgot to write retry code, the user saw a crash screen.

We designed **Retryable Writes** and **Retryable Reads** to solve this network reliability problem. 

Modern database drivers handle these transient errors automatically. 

If a query fails due to a connection drop or primary election, the driver pauses, queries the cluster for the new primary, and retries the operation **exactly once**, keeping your application running smoothly during server failovers.

---

### (2) Preventing Double Writes (Idempotency)
A common problem with retrying writes is data duplication:
-   If the driver sends an insert, and the server saves it but the network connection drops before the server can return success.
-   If the driver retries, the server would insert the document a second time.

To prevent this, MongoDB uses **Idempotency Tracking**:
-   The driver attaches a unique transaction ID (`txnNumber`) and session ID to every write.
-   If the server receives a retried write, it checks the ID.
-   If the write was already applied, it simply returns success **without executing the write again**, preventing duplicate data.

---

### (3) Reality Metaphor (Phone Static)
Imagine dictating a shipping address over a cell phone:
-   **Without Retry:** You say: *"Save address 45 Elm St."* 
    -   Static cuts out the call. 
    -   You hang up immediately, delete the user's order, and flag a system error.
-   **With Retryable Writes:** You say: *"Save address 45 Elm St."* 
    -   Static cuts out the call. 
    -   Instead of hanging up, you wait 2 seconds for the signal to return and ask: *"Did you get that address?"* 
    -   The receptionist says: *"Yes, saved it"* (idempotent ignore) or *"No, repeat it"* (successful retry).

---

### (4) Code Examples

#### Enabling Retryable Operations in URIs
Retryable operations are configured in the connection string:

```javascript
// Connection URI with explicit retry options:
const uri = "mongodb://cluster.mongodb.net/mydb?retryWrites=true&retryReads=true";

// MongoDB client setup (automatically retries transient errors!)
const client = new MongoClient(uri);
```

Operations that are automatically retried on transient errors:
-   `insertOne()`, `insertMany()`
-   `updateOne()`, `updateMany()`
-   `deleteOne()`, `deleteMany()`
-   `findOne()`, `find().toArray()`

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting retryable writes to fix logical query failures or database constraint errors

**The mistake:** Assuming that `retryWrites=true` will automatically fix schema validation crashes or duplicate key errors (`E11000`).

**Why it's wrong:** Retryable writes **only retry transient network errors** (e.g. socket timeouts, lost connections, or `NotWritablePrimary` states). 

If a write fails due to a logical error (like a duplicate email key), retrying it will yield the exact same error. 

MongoDB recognizes this and will not retry logical failures.

**Fix: Do not rely on retryable writes to handle data validation. Handle logical write errors (`WriteError`) in your application code using `try/catch` validation blocks.**

---



### Mistake 2: Disabling Retryable Writes (`retryWrites=false`) in Cloud Environment URIs

**The mistake:** Setting `retryWrites=false` in Atlas connection string URIs.

**Why it's wrong:** Transient network glitches or primary failovers abort writes without retry logic. `retryWrites=true` automatically retries supported write operations once.

*Incorrect:*
```javascript
mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=false // ❌ Disabled retryable writes!
```

*Fix:*
```javascript
mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true // Automatic single write retry
```

### Mistake 3: Expecting Unsupported Operations (like `updateMany()`) to Be Retryable Automatically

**The mistake:** Expecting `updateMany()` or `deleteMany()` batch operations to automatically retry on network failure.

**Why it's wrong:** Retryable writes support single-document write operations (`insertOne`, `updateOne`, `deleteOne`, `findOneAndDelete`). Un-supported multi-document updates must be retried manually in code.

*Incorrect:*
```javascript
// Expecting updateMany to auto-retry on network disconnects
```

*Fix:*
```javascript
Implement application retry loops with backoff for multi-document operations
```

## 5. Practice Exercises

### Exercise 1: Enabling Automatic Retryable Writes

**Scenario:**
Configure MongoDB client connection URI with `retryWrites=true` to handle transient network blips automatically.

**Requirements:**
1. Append `retryWrites=true` to connection string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const uri = "mongodb+srv://user:pass@cluster0.abc.mongodb.net/app?retryWrites=true&w=majority";
> const client = new MongoClient(uri);
> ```
>
> #### Technical Explanation
>
> 1. `retryWrites=true` instructs the driver to automatically retry supported write operations (`insertOne`, `updateOne`, `deleteOne`) once upon encountering network failures.
> 2. Client assigns a unique statement ID (`txnNumber`) to each write command.
> 3. Server checks statement ID to prevent executing the write twice if the first attempt succeeded server-side.
> 
---

### Exercise 2: Enabling Automatic Retryable Reads

**Scenario:**
Configure client connection options with `retryReads=true` (enabled by default in modern drivers).

**Requirements:**
1. Pass `retryReads: true` in MongoClient options.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const client = new MongoClient(uri, {
>   retryReads: true,
>   retryWrites: true
> });
> ```
>
> #### Technical Explanation
>
> 1. `retryReads=true` automatically retries supported read operations (`find`, `aggregate`, `countDocuments`) once if network errors occur.
> 2. Re-routes read request to an alternate secondary node during failover.
> 3. Eliminates transient read exception spikes in client applications.
> 
---

### Exercise 3: Supported vs Unsupported Operations for Retryable Writes

**Scenario:**
Distinguish between write operations supported by `retryWrites` vs unsupported operations (e.g., `updateMany`, `deleteMany`).

**Requirements:**
1. List supported single-doc writes vs unsupported bulk commands.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Retryable Write Eligibility:
> ✅ Supported: insertOne(), updateOne(), deleteOne(), findOneAndUpdate(), replaceOne().
> ❌ Unsupported: updateMany(), deleteMany(), insertMany() (unless using bulkWrite with ordered: false).
> ```
>
> #### Technical Explanation
>
> 1. `updateMany()` and `deleteMany()` are not retryable because retrying multi-document writes could lead to partial duplicate modifications.
> 2. Use single-document operations or transactions for full retry safety.
> 3. Critical driver integration awareness.
> 
---



## 6. Related Terms

- [`WriteConcernError` / `WriteError`](write_errors.md) — The error formats.
- [Replica Set](../level_09/replica_set.md) — The distributed cluster.

---

## 7. Key Takeaways
- Retryable operations automatically handle transient network and election errors.
- Configured in the connection string via `retryWrites=true` and `retryReads=true`.
- Retries the failed query exactly once on a new primary or secondary node.
- Uses session IDs and transaction numbers (`txnNumber`) to ensure idempotency.
- Prevents duplicate writes if the original write succeeded before a connection drop.
- Will not retry logical errors like duplicate key or validation failures.
- Eliminates application boilerplate code for handling temporary network drops.
