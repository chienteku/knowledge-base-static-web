# Background / Rolling Index Builds

> **Level 7 — Indexes & Query Performance**
> The database administration practices and mechanisms used to construct indexes on large production collections without locking the database or causing application service interruptions, focusing on background builds and rolling replica set deployments.

---

## 1. Prerequisites
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The index creation triggers.
- [Replication (Streaming / Logical)](../../../12-postgres/terms/level_10/replication.md) — The replica set architecture.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Since MongoDB 4.2+, all index builds use a hybrid build system that behaves as a background process by default. Building indexes still consumes high CPU and disk write I/O).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Building an index on a collection containing 50 million documents is a heavy task. 

The database must scan every document, extract the target field values, sort them, and compile the B-Tree blocks on disk. 

This process can take minutes to hours.

Historically, index builds were **Foreground Operations**:
-   They took an exclusive lock on the collection.
-   All read and write queries from your web application were blocked.
-   If you ran `createIndex()` on a live database at 2 PM, your entire application would freeze, causing a major outage.

To solve this, MongoDB evolved to build indexes in the **Background** by default. 

However, even background builds consume high disk I/O and CPU, which can degrade database speeds during peak hours. 

To achieve true zero-impact deployment, database administrators use **Rolling Index Builds** across replication networks.

---

### (2) Rolling Index Build Strategy
In a production Replica Set (a group of servers containing copies of the same data), you build the index one server at a time:

```mermaid
sequenceDiagram
    participant P as Primary Server (Active Traffic)
    participant S as Secondary Server (Offline)
    
    Note over S: 1. Take Secondary offline
    Note over S: 2. Build index locally (no impact on Primary)
    Note over S: 3. Bring Secondary online to sync
    Note over P: 4. Step down Primary to Secondary
    Note over P: 5. Build index on old Primary
```

1.  **Stop one Secondary server** (a backup node) and restart it as a standalone instance on a different port.
2.  **Build the index** on this standalone node. Since it is offline, the high disk I/O usage has zero impact on user traffic.
3.  **Restart the node** as a secondary and let it sync up.
4.  **Repeat the process** for all other secondary nodes.
5.  **Step down the Primary node** (converting it to a secondary), making one of the indexed secondaries the new primary.
6.  **Build the index** on the old primary (now secondary) node.

This ensures the new index is deployed across the database cluster with **zero downtime or latency spikes** for active users.

---

### (3) Reality Metaphor (Highway Repainting)
Imagine painting new lane markers on a busy city highway:
-   **Foreground Build (Locked):** Closing **all lanes** of the highway during rush hour at 5 PM to paint lines. Cars back up for miles, creating a gridlock (downtime).
-   **Background Build:** Painting lines at night, closing only one lane at a time while traffic flows slowly in the remaining lanes. (Slight delays, but highway stays open).
-   **Rolling Build:** Redirecting all cars to a **parallel detour highway** (the secondary node) while you close the main highway completely to paint. Drivers experience zero delays.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running createIndex() on a massive production database during peak business hours, assuming background builds have "zero performance impact"

**The mistake:** Executing `db.orders.createIndex({ user_id: 1 })` on a 100-million-row collection at 10 AM on a Monday, thinking it is safe because MongoDB runs it in the background.

**Why it's wrong:** Even though MongoDB does not lock the collection (reads and writes can continue), the index build saturates disk I/O and consumes significant CPU. 

This slows down all other active queries, causing API timeouts and connection pool bottlenecks, which can still lead to a production outage.

**Fix: Always schedule index builds during low-traffic windows (e.g. 2 AM), or use the rolling index build strategy on replica sets.**

---



### Mistake 2: Running Foreground Index Builds in Legacy MongoDB Servers During Peak Hours

**The mistake:** Building large indexes on 50M document production collections in foreground mode.

**Why it's wrong:** In modern MongoDB (4.2+), all index builds use an optimized hybrid background build protocol. In older versions, foreground builds locked databases.

*Incorrect:*
```javascript
// Building 50M index without monitoring build impact
```

*Fix:*
```javascript
Monitor active index builds using db.currentOp() or cancel via db.killOp()
```

### Mistake 3: Canceling Active Index Builds via `killOp` Improperly

**The mistake:** Killing index builds abruptly without checking build progress.

**Why it's wrong:** Modern index builds can be dropped safely using `db.collection.dropIndex()`, which cleanly aborts in-progress builds.

*Incorrect:*
```javascript
db.killOp(opId); // May leave build state un-cleaned
```

*Fix:*
```javascript
db.collection.dropIndex("index_name"); // Cleanly aborts active index build
```



### Mistake 4: Running Foreground Index Builds in Legacy MongoDB Servers During Peak Hours

**The mistake:** Building large indexes on 50M document production collections in foreground mode.

**Why it's wrong:** In modern MongoDB (4.2+), all index builds use an optimized hybrid background build protocol. In older versions, foreground builds locked databases.

*Incorrect:*
```javascript
// Building 50M index without monitoring build impact
```

*Fix:*
```javascript
Monitor active index builds using db.currentOp() or cancel via db.killOp()
```

### Mistake 5: Canceling Active Index Builds via `killOp` Improperly

**The mistake:** Killing index builds abruptly without checking build progress.

**Why it's wrong:** Modern index builds can be dropped safely using `db.collection.dropIndex()`, which cleanly aborts in-progress builds.

*Incorrect:*
```javascript
db.killOp(opId); // May leave build state un-cleaned
```

*Fix:*
```javascript
db.collection.dropIndex("index_name"); // Cleanly aborts active index build
```

## 6. Practice Exercises

### Exercise 1: Rolling Build Sequence

**Problem:** You are managing a 3-node MongoDB Replica Set (1 Primary, 2 Secondaries). You need to build a heavy compound index.
List the correct sequential steps to execute a rolling index build.

**Expected output:**
```text
1. Disconnect Secondary A from the replica set.
2. Build the index locally on Secondary A while it is standalone.
3. Reconnect Secondary A to the replica set and let it catch up.
4. Disconnect Secondary B from the replica set.
5. Build the index locally on Secondary B and reconnect it.
6. Step down the Primary server to convert it to a secondary.
7. Build the index on the old primary server.
```

> [!check]- Answer
> - The primary server must always stay online with the index built on secondaries first.
> - Relate this back to the step-down command sequence.

---



### Exercise 2: Checking Active Index Build Status

**Problem:** Inspect in-progress index builds using `db.currentOp()` in mongosh.

**Expected output:**
```text
db.currentOp({ "command.createIndexes": { $exists: true } });
```

> [!check]- Answer
> ```javascript
> db.currentOp({
>   "command.createIndexes": { $exists: true }
> });
> ```
>
> **Explanation:** `db.currentOp()` details active background index build progress.

### Exercise 3: Aborting In-Progress Index Build

**Problem:** Command to cleanly abort an in-progress index build `building_idx`.

**Expected output:**
```text
db.collection.dropIndex("building_idx");
```

> [!check]- Answer
> ```javascript
> db.collection.dropIndex("building_idx");
> ```
>
> **Explanation:** `dropIndex()` cleanly aborts active index builds on modern MongoDB clusters.



### Exercise 4: Checking Active Index Build Status

**Problem:** Inspect in-progress index builds using `db.currentOp()` in mongosh.

**Expected output:**
```text
db.currentOp({ "command.createIndexes": { $exists: true } });
```

> [!check]- Answer
> ```javascript
> db.currentOp({
>   "command.createIndexes": { $exists: true }
> });
> ```
>
> **Explanation:** `db.currentOp()` details active background index build progress.

### Exercise 5: Aborting In-Progress Index Build

**Problem:** Command to cleanly abort an in-progress index build `building_idx`.

**Expected output:**
```text
db.collection.dropIndex("building_idx");
```

> [!check]- Answer
> ```javascript
> db.collection.dropIndex("building_idx");
> ```
>
> **Explanation:** `dropIndex()` cleanly aborts active index builds on modern MongoDB clusters.

## 7. Related Terms
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — Index management.
- [Replication (Streaming / Logical)](../../../12-postgres/terms/level_10/replication.md) — Cluster architecture.

---

## 8. Key Takeaways
- Foreground index builds lock collections, blocking all read and write queries.
- Modern MongoDB builds indexes in the background (hybrid build) by default.
- Background builds allow queries to run but still consume high disk I/O and CPU.
- Rolling index builds construct indexes one node at a time across replica sets.
- Rolling builds guarantee zero performance impact on live production traffic.
- Never run heavy index builds during peak hours on active databases.
- View active index builds using `db.currentOp()` commands.
