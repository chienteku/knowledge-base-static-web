# Retryable Writes / Retryable Reads

> **Level 8 — Transactions, Consistency & Durability**
> MongoDB's driver-level mechanism that automatically retries read and write operations once when encountering transient network glitches or replica set elections, ensuring high availability with zero application-level boilerplate.

---

## 1. Prerequisites
- [`WriteConcernError` / `WriteError`](write_errors.md) — The write failure context.
- [Replica Set](../level_09/replica_set.md) — The distributed cluster.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Enabled by default in modern MongoDB drivers. Configured via connection string parameters `retryWrites=true` and `retryReads=true`).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Retry Behavior Diagnostic

**Problem:** A replica set triggers an election because the Primary node lost power. 
At that exact millisecond, your Node.js app runs an `insertOne` query with `retryWrites=true`. 
The driver gets a `NotWritablePrimary` error.
Describe the step-by-step actions the driver will execute to resolve this query.

**Expected output:**
```text
1. The driver catches the transient `NotWritablePrimary` election error.
2. The driver pauses and queries the replica set seeds to locate the newly elected Primary node.
3. The driver establishes a connection to the new Primary node.
4. The driver retries the `insertOne` command once on the new Primary, passing the original session and transaction numbers to guarantee idempotency.
5. The query completes successfully, and the application execution continues without throwing errors.
```

> [!check]- Answer
> - The driver behaves as a smart cluster controller during elections.
> - Explain how cluster clocks and transaction numbers guide the retry handshake.

---



### Exercise 2: Enabling Retryable Writes and Reads in Connection String

**Problem:** Construct URI enabling `retryWrites=true` and `retryReads=true`.

**Expected output:**
```text
mongodb+srv://user:pass@cluster.mongodb.net/app?retryWrites=true&retryReads=true
```

> [!check]- Answer
> ```text
> mongodb+srv://user:pass@cluster.mongodb.net/app?retryWrites=true&retryReads=true
> ```
>
> **Explanation:** Connection URI parameters enable automatic single-attempt retries for network glitches.

### Exercise 3: Retryable Write Requirements

**Problem:** What storage engine requirement exists for Retryable Writes? (WiredTiger storage engine with replica sets or sharded clusters).

**Expected output:**
```text
WiredTiger storage engine with replica sets or sharded clusters
```

> [!check]- Answer
> ```text
> WiredTiger storage engine with replica sets or sharded clusters
> ```
>
> **Explanation:** Retryable writes utilize WiredTiger transaction logs to prevent duplicate executions.

## 7. Related Terms
- [`WriteConcernError` / `WriteError`](write_errors.md) — The error formats.
- [Replica Set](../level_09/replica_set.md) — The distributed cluster.

---

## 8. Key Takeaways
- Retryable operations automatically handle transient network and election errors.
- Configured in the connection string via `retryWrites=true` and `retryReads=true`.
- Retries the failed query exactly once on a new primary or secondary node.
- Uses session IDs and transaction numbers (`txnNumber`) to ensure idempotency.
- Prevents duplicate writes if the original write succeeded before a connection drop.
- Will not retry logical errors like duplicate key or validation failures.
- Eliminates application boilerplate code for handling temporary network drops.
