# Transaction Isolation & Atomicity Semantics

> **Level 9 — Real-Time Features, Events & Functions**
> SurrealDB's multi-version concurrency control (MVCC) and snapshot isolation semantics, ensuring concurrent reads and writes remain consistent without blocking read performance.

---

## 1. Prerequisites

- [Transactions (`BEGIN` / `COMMIT` / `CANCEL`)](transactions.md) — Basic transaction blocks.
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Storage engine architectures.

---

## 2. Term Category


**Performance / Operations (ACID transaction isolation level guarantees)**: - **Database Internals & Concurrency**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When hundreds of concurrent requests read and update the database at the same time, database engines must prevent anomaly bugs:
- **Dirty Reads**: Reading uncommitted data from another active transaction.
- **Non-Repeatable Reads**: Reading a record twice in one transaction and getting different values because another transaction modified it midway.
- **Phantom Reads**: A query returning different numbers of rows mid-transaction because another request inserted new matching rows.

SurrealDB uses **Snapshot Isolation (MVCC)** for transaction isolation:
1. When a transaction starts, it sees a **consistent frozen snapshot** of the database at that exact moment.
2. Concurrent reads do not block writes, and concurrent writes do not block reads.
3. If two transactions attempt to update the *same* record concurrently, SurrealDB detects the write conflict at commit time. One transaction succeeds, and the conflicting transaction fails with a conflict error, allowing the SDK/client to retry the operation cleanly.

### (2) Reality Metaphor
Think of editing a document in a collaborative publishing system:
- **Snapshot Isolation**: When you open an article to edit, you receive your own private copy (snapshot) of Version 10. You can read and write without locking the main website.
- **Write Conflict Detection**: If another editor publishes Version 11 while you are still working on Version 10, the system prevents you from blindly overwriting their changes when you click "Publish". It warns you of a conflict and asks you to merge or retry your edits.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Snapshot Isolation: Queries inside this transaction see a frozen snapshot
BEGIN TRANSACTION;
    -- Reads from snapshot; unaffected by concurrent commits outside this transaction
    SELECT * FROM user WHERE active = true;
COMMIT TRANSACTION;
```

#### Fuller Example
```javascript
// Handling Transaction Retry Logic in JavaScript SDK
import Surreal from 'surrealdb';
const db = new Surreal();

async function transferFundsWithRetry(fromId, toId, amount, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Execute atomic transaction
            await db.query(`
                BEGIN TRANSACTION;
                    UPDATE $from SET balance -= $amount;
                    UPDATE $to SET balance += $amount;
                COMMIT TRANSACTION;
            `, { from: fromId, to: toId, amount: amount });

            console.log('Transfer succeeded on attempt:', attempt);
            return;
        } catch (err) {
            // If conflict error occurs due to concurrent updates, retry
            if (attempt === maxRetries) throw err;
            console.warn(`Write conflict on attempt ${attempt}. Retrying...`);
            await new Promise(res => setTimeout(res, 50 * attempt)); // Backoff
        }
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming Blocking Row Locks instead of Optimistic Concurrency Control

**The mistake:** Assuming SurrealDB locks rows for reads like PostgreSQL `SELECT FOR UPDATE` and assuming concurrent writers will pause and wait indefinitely.

**Why it's wrong:** SurrealDB uses optimistic concurrency control (OCC). Concurrent writers do not block waiting for locks; instead, conflicting writes fail immediately at commit time with a conflict error. Applications must handle retry logic.

*Incorrect:*
```javascript
// Expecting database to pause concurrent requests automatically without retry logic
await db.query('BEGIN; UPDATE account:alice SET balance -= 10; COMMIT;');
```

*Fix:*
```javascript
// Wrap multi-record transactions in application retry loops (or SDK retry handlers)
await transferFundsWithRetry(fromAccount, toAccount, amount);
```

---



### Mistake 2: Assuming Long-Running Interactive Transactions Do Not Hold Lock Contention in High-Concurrency Systems

**The mistake:** Holding open transactional blocks while performing slow external network API calls.

**Why it's wrong:** Holding open transactions locks underlying storage resources, leading to transaction conflict retries and timeouts under high concurrency. Keep transactions short.

*Incorrect:*
```surrealql
BEGIN TRANSACTION;
-- Slow external API call ...
COMMIT TRANSACTION;
```

*Fix:*
```surrealql
// Perform API call first, then run fast atomic database transaction block
```

### Mistake 3: Ignoring Transaction Conflict Retry Errors in High-Write TiKV Clusters

**The mistake:** Executing concurrent transactions without handling optimistic concurrency control (OCC) conflict retries.

**Why it's wrong:** Distributed storage engines (TiKV) use optimistic concurrency control. Conflicting concurrent transactions must be retried by application code.

*Incorrect:*
```surrealql
-- Un-handled OCC transaction conflict
```

*Fix:*
```surrealql
Implement exponential backoff retry loops for transactional database operations
```





## 5. Practice Exercises

### Exercise 1: ACID Transaction Isolation Execution

**Scenario:**
Demonstrate executing multiple mutations inside an ACID transaction block using `BEGIN TRANSACTION` and `COMMIT TRANSACTION`.

**Requirements:**
1. Begin transaction block.
2. Deduct `$amount` from `account:a1` and credit `$amount` to `account:a2`.
3. Commit transaction.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> BEGIN TRANSACTION;
> 
> UPDATE account:a1 SET balance -= 100.00dec;
> UPDATE account:a2 SET balance += 100.00dec;
> 
> COMMIT TRANSACTION;
> ```
>
> #### Technical Explanation
>
> 1. `BEGIN TRANSACTION` opens an isolated ACID transaction block.
> 2. All statements execute atomically: either all mutations commit together, or none do.
> 3. Prevents dirty reads and partial account updates in concurrent financial workloads.
> 
---

### Exercise 2: Transaction Rollbacks on Exception Errors

**Scenario:**
Demonstrate that a transaction automatically rolls back all mutations if an error occurs prior to `COMMIT TRANSACTION`.

**Requirements:**
1. Begin transaction, perform an update, throw an exception, commit transaction.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> BEGIN TRANSACTION;
> 
> UPDATE account:a1 SET balance -= 100.00dec;
> THROW "Simulated transfer error!";
> 
> COMMIT TRANSACTION;
> ```
>
> #### Technical Explanation
>
> 1. If an error or `THROW` occurs inside a transaction block, SurrealDB aborts execution.
> 2. Rolls back all uncommitted mutations automatically.
> 3. Guarantees database state consistency.
> 
---

### Exercise 3: Comparing Transaction Isolation in Single-Node vs Distributed TiKV

**Scenario:**
Explain how transaction isolation operates in single-node storage engines (`file://`) vs distributed cluster backends (`tikv://`).

**Requirements:**
1. Describe how TiKV provides distributed ACID transactions.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Single-Node (file:// / SurrealKV): Uses local MVCC key-value storage engine transaction locks.
> Distributed (tikv://): Delegates multi-region ACID transactions to TiKV's 2-Phase Commit (2PC) and Raft consensus protocols.
> ```
>
> #### Technical Explanation
>
> 1. SurrealDB decouples transaction parsing from storage engine transaction execution.
> 2. `tikv://` provides distributed multi-master ACID transactions across server clusters.
> 3. Guarantees linearizable transaction isolation in cloud deployments.
> 
---





## 6. Related Terms

- [Transactions (`BEGIN` / `COMMIT` / `CANCEL`)](transactions.md) — Transaction commands.
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Single-node and distributed storage backends.
- [SDK Error Handling & Retry Patterns](../level_10/sdk_error_handling.md) — Handling write conflicts in SDKs.

---

## 7. Key Takeaways
- SurrealDB uses Snapshot Isolation built on Multi-Version Concurrency Control (MVCC).
- Reads see a consistent snapshot; reads and writes do not block each other.
- Concurrent write conflicts are detected at commit time, requiring clean client retry patterns.
