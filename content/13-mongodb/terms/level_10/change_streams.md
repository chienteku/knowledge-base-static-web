# Change Streams

> **Level 10 — Administration, Security & Advanced Features**
> MongoDB's real-time event stream API that tapping into the replica set Oplog to notify applications instantly when collections, databases, or clusters experience changes (inserts, updates, deletes), serving as the equivalent to PostgreSQL's `LISTEN`/`NOTIFY`.

---

## 1. Prerequisites
- [Replica Set](../../level_09/replica_set.md) — The cluster context.
- [Oplog (Operations Log)](../../level_09/oplog.md) — The event source.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Requires replica set or sharded cluster configuration. Events are streamed asynchronously to client drivers using cursors).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern web applications, your backend must react to database changes in real-time:
-   **Notifications:** When a user receives a message, push a real-time alert via WebSockets.
-   **Caching:** When a product price changes, purge the Redis cache immediately.
-   **Analytics:** When an order is completed, push transaction details to a dashboard.

If you try to build this using **Polling** (running a query `find()` once every 2 seconds to check for new records):
-   You saturate the database with redundant queries.
-   You create a delay in user notifications.

In PostgreSQL, you handle real-time signaling using `LISTEN` and `NOTIFY` triggers.

We designed **Change Streams** to solve this in MongoDB. 

Instead of polling the collection, Change Streams tap directly into the replica set **Oplog**. 

When a write is committed, MongoDB pushes the event details directly to your connected Node.js application stream, enabling instant reaction with zero polling overhead.

---

### (2) Key Features of Change Streams

#### 1. High Availability & Resumability
If your Node.js application server restarts or loses connection for 10 seconds:
-   It does not lose the missed events.
-   The stream returns a **Resume Token** (`_id` field in the change event payload).
-   When reconnecting, the driver passes this token, and MongoDB resumes the stream from that exact millisecond in the Oplog.

#### 2. Event Types
Tails writes, categorizing them as:
-   `insert`: New document saved.
-   `update`: Specific fields changed (returns modified fields and values).
-   `delete`: Document removed.
-   `drop`: Collection deleted.

---

### (3) Reality Metaphor (Stock Tickers)
Imagine checking stock price updates:
-   **Polling:** Walking to a convenience store every 5 minutes to buy the latest newspaper print and check if Apple stock rose. (Slow, expensive, and redundant).
-   **Change Stream:** Staring at a **Real-Time LED Stock Ticker Display Board** on the wall. 
    -   The second a trade occurs, the ticker scrolls across the screen. 
    -   If the power cuts out for a minute (disconnect), the ticker rolls back to show the missed trades before displaying live numbers again. (Resumability).

---

### (4) Code Examples

#### Listening to Changes in Node.js
Here is how to build a real-time insert listener using the official driver:

```javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017/?replicaSet=myRS');

async function watchOrders() {
  await client.connect();
  const collection = client.db('shop').collection('orders');

  // 1. Initialize the change stream cursor
  const changeStream = collection.watch();

  console.log("Listening for real-time order events...");

  // 2. Iterate over the stream cursor events
  changeStream.on('change', (nextEvent) => {
    
    // Check event type
    if (nextEvent.operationType === 'insert') {
      const newOrder = nextEvent.fullDocument;
      console.log(`[ALERT] New order created! ID: ${newOrder._id}, Total: $${newOrder.total}`);
      // Trigger WebSockets or send notifications here!
    }
    
  });
}

watchOrders().catch(console.error);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to launch Change Streams on standalone MongoDB instances, causing query crashes

**The mistake:** Running `collection.watch()` in your local development environment using a standalone `mongod` server (without replica set configurations).

**Why it's wrong:** Change streams require a replica set because they read event logs from the **Oplog**. 

Since standalone MongoDB servers do not maintain an Oplog, the driver command will fail immediately and throw a database error:
`ERROR: The $changeStream stage is only supported on replica sets`

**Fix: Always configure your local development environment to run as a single-node Replica Set (using `mongod --replSet myRepl`) to support change stream testing.**

---



### Mistake 2: Opening Change Streams Against Standalone `mongod` Instances Without Replication

**The mistake:** Calling `db.collection.watch()` on a standalone non-replica-set `mongod` server.

**Why it's wrong:** Change Streams require the MongoDB Replication Oplog! Executing `.watch()` on a standalone non-replica-set server throws error `The $changeStream stage is only supported on replica sets`.

*Incorrect:*
```javascript
// Calling db.coll.watch() on single standalone mongod process
```

*Fix:*
```javascript
Initiate replica set (rs.initiate()) before opening Change Streams
```

### Mistake 3: Failing to Persist Resume Tokens (`resumeToken`) for Service Failure Recovery

**The mistake:** Opening change streams without saving the `_id` resume token during background worker restarts.

**Why it's wrong:** If a background worker crashes, resuming the change stream with `resumeAfter: token` guarantees zero missed events during downtime.

*Incorrect:*
```javascript
const stream = collection.watch(); // ❌ Misses events if worker crashes!
```

*Fix:*
```javascript
const stream = collection.watch([], { resumeAfter: savedResumeToken });
```

## 6. Practice Exercises

### Exercise 1: Listener Script Construction

**Problem:** You have a `notifications` collection. Write the Node.js code block to:
1.  Initialize a change stream on that collection.
2.  Listen to the `'change'` event.
3.  If the `operationType` is `"delete"`, log the deleted document identifier (`documentKey._id`) to the console.

**Expected output:**
```javascript
const changeStream = notifications.watch();
changeStream.on('change', (event) => {
  if (event.operationType === 'delete') {
    console.log("Deleted notification ID:", event.documentKey._id);
  }
});
```

> [!check]- Answer
> - Call the `.watch()` method to initialize the event stream.
> - Access the deleted document ID using the `event.documentKey._id` property path.

---



### Exercise 2: Opening Collection Change Stream in Node.js

**Problem:** Open change stream filtering for `operationType: "insert"` on `orders` collection.

**Expected output:**
```text
const stream = db.orders.watch([{ $match: { operationType: "insert" } }]); stream.on("change", change => console.log(change));
```

> [!check]- Answer
> ```javascript
> const stream = db.orders.watch([
>   { $match: { operationType: "insert" } }
> ]);
> stream.on("change", (change) => {
>   console.log("New order inserted:", change.fullDocument);
> });
> ```
>
> **Explanation:** `.watch([ pipeline ])` streams real-time database write mutations over WebSockets/RPC.

### Exercise 3: Full Document Lookup Option

**Problem:** Configure Change Stream to include full updated document on `update` events (`fullDocument: 'updateLookup'`).

**Expected output:**
```text
const stream = db.orders.watch([], { fullDocument: "updateLookup" });
```

> [!check]- Answer
> ```javascript
> const stream = db.orders.watch([], {
>   fullDocument: "updateLookup"
> });
> ```
>
> **Explanation:** `fullDocument: 'updateLookup'` fetches the current post-update document snapshot.

## 7. Related Terms
- [Replica Set](../../level_09/replica_set.md) — The cluster context.
- [Oplog (Operations Log)](../../level_09/oplog.md) — The event source.

---

## 8. Key Takeaways
- Change Streams push real-time database modifications directly to applications.
- Direct NoSQL equivalent to PostgreSQL's `LISTEN` and `NOTIFY` signals.
- Taps directly into the replica set Oplog file to stream events.
- Requires replica sets or sharded clusters; fails on standalone instances.
- Resume tokens allow streams to reconnect and sync without losing missed events.
- Stream filters can target specific operation types (insert, update, delete).
- Eliminates resource-heavy database polling intervals in Node.js apps.
