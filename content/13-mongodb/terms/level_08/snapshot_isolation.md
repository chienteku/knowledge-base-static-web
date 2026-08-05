# Snapshot Isolation

> **Level 8 — Transactions, Consistency & Durability**
> The database isolation level used by MongoDB's multi-document transactions, where operations read from a consistent snapshot of data frozen at the start of the transaction, equivalent to PostgreSQL's `REPEATABLE READ` isolation level.

---

## 1. Prerequisites

- [Multi-Document Transaction](multi_document_transaction.md) — The transaction context.
- [Transaction Isolation Levels](../../../12-postgres/terms/level_08/isolation_levels.md) — Relational isolation levels.

---

## 2. Term Category
- **Database Theory / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Managed by the WiredTiger storage engine's MVCC concurrency manager. Maintains historical document state changes in memory cache to satisfy active transaction snapshots).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In high-traffic applications, thousands of clients read and write data simultaneously. 

If a multi-document transaction is checking bank accounts:
-   At Step 1: Read Account A balance ($100).
-   At Step 2: Read Account B balance ($50).
-   If a separate client updates Account B to $200 *between* Step 1 and Step 2:
-   Without strict isolation, the transaction would read the new $200 value. 
-   This is a **Non-Repeatable Read** anomaly, which breaks calculation consistency.

In PostgreSQL, you resolve concurrency anomalies by configuring isolation levels (like `REPEATABLE READ`).

We designed **Snapshot Isolation** to enforce this consistency in MongoDB transactions. 

The moment a transaction begins, the database engine freezes a logical **Snapshot** of the data. 

For the entire duration of the transaction, all reads are resolved from this snapshot. 

Any updates written by other concurrent queries are invisible, guaranteeing a stable, unchanging view of data.

---

### (2) Concurrency Conflicts & The Write Conflict Error
Because documents are read from a snapshot, write conflicts can occur:
-   If Transaction A starts and reads Document 1.
-   If Transaction B updates and commits Document 1 *while* Transaction A is still running.
-   If Transaction A now attempts to write to Document 1:
-   **MongoDB will trigger a Write Conflict.**
-   The database immediately aborts Transaction A, rolling back its staged changes, and throws a `WriteConflict` error. 
-   The application must catch this error and retry the transaction block.

---

### (3) Reality Metaphor (Whiteboard Photos)
Imagine working off a shared meeting room whiteboard:
-   **No Snapshot Isolation (Read Committed):** You read the whiteboard, look down at your keyboard, a coworker walks in and rewrites the notes, and you look back up to see the new text. (Confusing and unstable).
-   **Snapshot Isolation:** You walk into the room, hold up a **Polaroid Camera**, and snap a photo of the whiteboard. 
    -   You sit at your desk and work off the printed photo. 
    -   Even if a coworker walks in and erases the physical whiteboard, the photo in your hand remains unchanged.

---

### (4) Interleaved Transaction Timeline

| Time | Transaction A (Snapshot Isolation) | Transaction B (Concurrent Write) | Document 1 on Disk |
| :--- | :--- | :--- | :--- |
| **T1** | **Starts** (freezes snapshot: `value: 10`) | | `value: 10` |
| **T2** | Reads Document 1 $\rightarrow$ Returns `10` | | `value: 10` |
| **T3** | | Updates & Commits Document 1 $\rightarrow$ `20` | `value: 20` |
| **T4** | Reads Document 1 $\rightarrow$ **Returns `10`** | | `value: 20` |
| **T5** | Writes Document 1 $\rightarrow$ **Crashes!** | *(Write Conflict Error)* | `value: 20` |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Failing to write client-side retry logic to handle write conflicts in MongoDB transactions

**The mistake:** Assuming that because a transaction block is wrapped in `try/catch`, it is completely robust, without writing code to catch and retry on `WriteConflict` errors.

**Why it's wrong:** Under high write concurrency, write conflicts are a normal database behavior, not a critical bug. 

If your application simply fails and returns `500 Server Error` on a write conflict, users will experience frequent checkout and transfer errors.

**Fix: Always implement automatic retry loop logic inside your application transaction wrapper to catch transient write conflict exceptions and restart the transaction session.**

---



### Mistake 2: Expecting Snapshot Isolation Across Separate Non-Transactional Queries

**The mistake:** Executing two separate `findOne()` queries in an API route expecting point-in-time snapshot consistency without a session transaction.

**Why it's wrong:** Without a transaction session using `readConcern: 'snapshot'`, concurrent writes between queries can mutate underlying data.

*Incorrect:*
```javascript
// 2 independent queries expecting consistent snapshot across calls
```

*Fix:*
```javascript
Wrap multi-query snapshot reads inside a transaction session
```

### Mistake 3: Experiencing Write Conflicts Under High-Concurrency Snapshot Transactions

**The mistake:** Running concurrent snapshot transactions modifying the exact same document simultaneously.

**Why it's wrong:** MongoDB uses optimistic concurrency control. Concurrent transactions mutating the same document cause write conflicts, aborting the transaction. Catch write conflict errors and retry.

*Incorrect:*
```javascript
// Concurrent transactions updating same document without retry logic
```

*Fix:*
```javascript
Use session.withTransaction() which automatically retries on TransientTransactionError
```

## 6. Practice Exercises

### Exercise 1: Concurrency Diagnostic

**Problem:** Transaction A starts under Snapshot Isolation at `10:00:00`. At `10:00:05`, Transaction B updates a user's address and commits. 
At `10:00:10`, Transaction A reads that user's address.
1.  State which address (the old address or the new address) Transaction A will see.
2.  Explain why.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Transaction A will see the old address.
> 2. Under Snapshot Isolation, Transaction A reads from a consistent snapshot frozen at its start time (`10:00:00`). Any updates committed by other queries after this start time are invisible to the transaction until it terminates.
> ```
> - Apply the snapshot freezing rule relative to transaction start times.
> - Consider if concurrent commits can bleed into active snapshots.

---



### Exercise 2: Snapshot Isolation in Transactions

**Problem:** Explain what Snapshot Isolation guarantees during a transaction (All reads reflect a consistent point-in-time snapshot of the database).

**Expected output:**
> [!check]- Answer
> ```text
> All reads within the transaction reflect a single point-in-time database snapshot
> ```
> ```text
> All reads within the transaction reflect a single point-in-time database snapshot
> ```
>
> **Explanation:** Snapshot isolation prevents dirty reads, non-repeatable reads, and phantom reads.

---

### Exercise 3: Transient Transaction Error Retries

**Problem:** Why does `withTransaction()` automatically retry transactions on `TransientTransactionError`? (Retries transient write conflict aborts under concurrency).

**Expected output:**
> [!check]- Answer
> ```text
> Automatically retries transactions aborting due to concurrent write conflicts
> ```
> ```text
> Automatically retries transactions aborting due to concurrent write conflicts
> ```
>
> **Explanation:** `withTransaction()` includes built-in retry handlers for OCC write conflicts.

## 7. Related Terms

- [Multi-Document Transaction](multi_document_transaction.md) — The transaction context.
- [Transaction Isolation Levels](../../../12-postgres/terms/level_08/isolation_levels.md) — Relational isolation levels.

---

## 8. Key Takeaways
- Snapshot Isolation provides a consistent, frozen view of data for a transaction.
- Direct NoSQL equivalent to PostgreSQL's `REPEATABLE READ` isolation level.
- Prevents Dirty Reads and Non-Repeatable Reads anomalies.
- Concurrent updates committed after the transaction starts are invisible.
- Attempting to update a document changed by another query causes a Write Conflict.
- Write conflicts abort the transaction, requiring application-side retry loops.
- WiredTiger maintains snapshots in memory using MVCC ticket metrics.
