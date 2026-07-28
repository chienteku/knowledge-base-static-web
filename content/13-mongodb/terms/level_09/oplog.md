# Oplog (Operations Log)

> **Level 9 — Replica Sets & Sharding**
> The specialized, fixed-size capped collection (`local.oplog.rs`) that records all database write operations on the primary node, allowing secondary nodes to poll and replay these logs to stay synchronized.

---

## 1. Prerequisites
- [Replica Set](replica_set.md) — The parent cluster context.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Stored inside the system-reserved `local` database. Automatically created when initializing replica sets. Crucial for syncing nodes and driving Change Streams).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a replica set, secondary nodes must keep their data identical to the primary. 

How do we copy changes efficiently?
-   We cannot copy the entire database files over the network on every write; that would consume too much bandwidth.
-   We cannot just trust nodes to copy files at random intervals.

In PostgreSQL, standby nodes replicate data by reading the **Write-Ahead Log (WAL)**.

We designed the **Oplog (Operations Log)** to perform this role in MongoDB. 

The Oplog is a circular ledger (a Capped Collection). 

Every time a write command (insert, update, delete) is executed on the Primary, the database records the operation details inside the Oplog. 

The Secondaries continuously tail (poll) the primary's Oplog, copy the new entries, and apply the operations to their local collections, achieving real-time synchronization.

---

### (2) The Idempotency Rule
A critical design feature of the Oplog is that **all entries are written in an idempotent format.** 

No matter how many times you apply the same Oplog entry to a document, the result must be identical.

If your application runs a relative update:
`db.users.updateOne({ _id: 1 }, { $inc: { points: 5 } })` (assuming points goes from 10 to 15).

MongoDB **does not** write the relative `$inc` command to the Oplog. 

Instead, it calculates the final value and writes an absolute set:
`"o": { "$set": { "points": 15 } }`

*Why?* If a network glitch occurs and a secondary applies the Oplog entry twice, setting the points to 15 twice keeps the value correct. If it applied the relative `$inc: 5` twice, the points would incorrectly grow to 20.

---

### (3) Reality Metaphor (Chef Chalkboards)
Imagine a busy restaurant kitchen:
-   **Oplog:** A **Kitchen Instruction Chalkboard** managed by the Head Chef (Primary).
    -   When the Head Chef adds ingredients, they write it down: **"Action 1: Set salt to 10g. Action 2: Set sugar to 50g."** (Idempotent absolute state, not "add salt").
    -   The Apprentice Chefs (Secondaries) look at the chalkboard, replicate the actions in their own bowls, and wipe the oldest instructions off the top of the board when they run out of writing space.

---

### (4) Code Examples

#### Auditing an Oplog Document
You can view the Oplog collection in mongosh:

```javascript
// Query the replica set oplog collection in the 'local' database
db.getSiblingDB("local").oplog.rs.find().limit(1).pretty();

// Output Oplog Entry (JSON):
{
  "ts": Timestamp(1672531199, 1), // Logical transaction timestamp
  "t": NumberLong(1),             // Election term number
  "h": NumberLong("289..."),      // Hash identifier
  "v": 2,                         // Oplog version format
  "op": "u",                      // Operation type: 'u' for update (i = insert, d = delete)
  "ns": "shop.users",             // Namespace: database.collection
  "o2": { "_id": 105 },           // The target document identifier
  "o": {                          // The write payload: written as an absolute SET!
    "$set": {
      "status": "Active"          // Even if written as an inc or push originally!
    }
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Configuring the Oplog size too small on high-write systems, causing secondaries to drop out of synchronization

**The mistake:** Allocating a tiny Oplog size (e.g. 1GB) on a high-throughput transaction database, allowing old logs to be overwritten in under 30 minutes.

**Why it's wrong:** If a secondary node goes offline for 1 hour for standard server maintenance:
-   When it boots back up, it tries to read the primary's Oplog from where it left off.
-   Because the Oplog is a capped collection and the write volume is high, the logs it needs have already been overwritten and deleted.
-   The secondary fails to sync, throws an error, and must execute a slow, expensive **Initial Sync** (copying the entire raw database from scratch).

**Fix: Configure the Oplog size (using `oplogSizeMB`) to hold at least 24 to 72 hours of write operations under peak traffic conditions, providing a safe window for secondary maintenance.**

---



### Mistake 2: Under-Sizing the Replication Oplog Size for High-Volume Write Clusters

**The mistake:** Configuring a 1GB Oplog size on a cluster performing 50GB of daily bulk updates.

**Why it's wrong:** The Oplog is a fixed-size capped collection (`local.oplog.rs`). If write volume overwrites Oplog entries faster than Secondaries can replicate, Secondaries fall out of sync and require manual re-initialization (resync).

*Incorrect:*
```javascript
// Setting 1GB Oplog on high-write production cluster
```

*Fix:*
```javascript
Size Oplog to hold at least 24 to 72 hours of peak write volume
```

### Mistake 3: Assuming Non-Idempotent Operations in Application Code Cause Oplog Replay Errors

**The mistake:** Worrying that `$inc: { views: 1 }` will be replayed incorrectly as `$inc` in the Oplog.

**Why it's wrong:** MongoDB automatically converts non-idempotent updates (like `$inc`) into explicit, idempotent `$set` operations inside the Oplog before writing.

*Incorrect:*
```javascript
// Fearing $inc operations produce non-idempotent oplog replays
```

*Fix:*
```javascript
MongoDB converts all oplog entries to idempotent $set operations automatically
```

## 6. Practice Exercises

### Exercise 1: Idempotency Translation

**Problem:** A client executes this update:
`db.inventory.updateOne({ _id: "sku-01" }, { $push: { tags: "sale" } });`
Before this write, the document was: `{ _id: "sku-01", tags: ["clearance"] }`.
Write the idempotent update payload (`"o"` object) that MongoDB will write to the Oplog.

**Expected output:**
> [!check]- Answer
> ```javascript
> {
>   "$set": {
>     "tags": [ "clearance", "sale" ]
>   }
> }
> ```
> - Oplog updates must not use relative array operations like `$push`.
> - Convert the array change into an absolute `$set` containing the final array elements.

---



### Exercise 2: Inspecting Oplog Window in mongosh

**Problem:** Check Oplog window capacity hours using `rs.printReplicationInfo()`.

**Expected output:**
> [!check]- Answer
> ```text
> rs.printReplicationInfo();
> ```
> ```javascript
> rs.printReplicationInfo();
> ```
>
> **Explanation:** `rs.printReplicationInfo()` prints active Oplog size and buffer time window coverage.

---

### Exercise 3: Resizing Oplog Dynamically

**Problem:** Command to dynamically resize Oplog to 50,000 MB (50GB) using `replSetResizeOplog`.

**Expected output:**
> [!check]- Answer
> ```text
> db.adminCommand({ replSetResizeOplog: 1, size: 50000 });
> ```
> ```javascript
> db.adminCommand({ replSetResizeOplog: 1, size: 50000 });
> ```
>
> **Explanation:** `replSetResizeOplog` dynamically resizes capped Oplog collections without server restarts.

## 7. Related Terms
- [Replica Set](replica_set.md) — The parent cluster context.
- [Replication Lag](replication_lag.md) — The sync delay.

---

## 8. Key Takeaways
- The Oplog is a capped circular collection recording all write operations.
- Direct NoSQL equivalent to PostgreSQL's Write-Ahead Log (WAL).
- Secondaries tail the primary's Oplog to replicate writes in real-time.
- Oplog entries use an idempotent format (absolute `$set` instead of relative `$inc`).
- Idempotency ensures replaying an Oplog entry twice yields correct data.
- If the Oplog is too small, log entries are overwritten, causing secondary sync drops.
- Configure Oplog sizes to hold at least 24 to 72 hours of log data.
