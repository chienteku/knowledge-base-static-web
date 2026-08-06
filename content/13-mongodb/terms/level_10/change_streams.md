# Change Streams

> **Level 10 — Administration, Security & Advanced Features**
> MongoDB's real-time event stream API that tapping into the replica set Oplog to notify applications instantly when collections, databases, or clusters experience changes (inserts, updates, deletes), serving as the equivalent to PostgreSQL's `LISTEN`/`NOTIFY`.

---

## 1. Prerequisites

- [Replica Set](../level_09/replica_set.md) — The cluster context.
- [Oplog (Operations Log)](../level_09/oplog.md) — The event source.

---

## 2. Term Category

**Advanced Feature** (Real-Time Change Data Capture): Change Streams allow applications to subscribe to real-time data modifications (`insert`, `update`, `delete`, `replace`) across collections, databases, or clusters via oplog tailing.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Requires replica set or sharded cluster configuration. Events are streamed asynchronously to client drivers using cursors).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Real-Time Document Change Subscriptions

**Scenario:**
Subscribe to real-time `insert` and `update` events on collection `orders` using `watch()`.

**Requirements:**
1. Execute `db.orders.watch([{ $match: { operationType: { $in: ["insert", "update"] } } }])`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const changeStream = db.orders.watch([
>   {
>     $match: {
>       operationType: { $in: ["insert", "update"] }
>     }
>   }
> ]);
> 
> changeStream.on("change", (change) => {
>   console.log("Real-time Mutation Event:", change.operationType, change.documentKey._id);
> });
> ```
>
> #### Technical Explanation
>
> 1. Change Streams tail the replica set oplog to emit real-time event notifications.
> 2. Supports aggregation pipeline filtering (`$match`) server-side.
> 3. Powers real-time notification feeds and webhooks.

---

### Exercise 2: Including Full Document Snapshots in Update Events

**Scenario:**
Configure change stream options with `fullDocument: "updateLookup"` to receive the complete post-update document payload.

**Requirements:**
1. Pass `fullDocument: "updateLookup"` in `watch()` options.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const changeStream = db.orders.watch([], {
>   fullDocument: "updateLookup"
> });
> 
> changeStream.on("change", (change) => {
>   console.log("Full Updated Document Payload:", change.fullDocument);
> });
> ```
>
> #### Technical Explanation
>
> 1. Standard update change events contain only modified delta fields (`updateDescription`).
> 2. `fullDocument: "updateLookup"` performs a instant lookup to return the complete document payload.
> 3. Simplifies client-side event processing.

---

### Exercise 3: Resuming Interrupted Change Streams with Resume Tokens

**Scenario:**
Resume a disconnected change stream from its exact point of failure using `resumeAfter: token`.

**Requirements:**
1. Save `change._id` resume token and pass `resumeAfter`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> let lastResumeToken = null;
> 
> const changeStream = db.orders.watch();
> changeStream.on("change", (change) => {
>   lastResumeToken = change._id; // Save resume token
> });
> 
> // Reconnect stream after crash
> const resumedStream = db.orders.watch([], {
>   resumeAfter: lastResumeToken
> });
> ```
>
> #### Technical Explanation
>
> 1. Change stream events include a unique BSON `_id` resume token representing oplog position.
> 2. `resumeAfter` resumes event processing seamlessly without dropping or duplicating events.
> 3. Guarantees fault-tolerant event processing.

---



## 6. Related Terms

- [Replica Set](../level_09/replica_set.md) — The cluster context.
- [Oplog (Operations Log)](../level_09/oplog.md) — The event source.

---

## 7. Key Takeaways
- Change Streams push real-time database modifications directly to applications.
- Direct NoSQL equivalent to PostgreSQL's `LISTEN` and `NOTIFY` signals.
- Taps directly into the replica set Oplog file to stream events.
- Requires replica sets or sharded clusters; fails on standalone instances.
- Resume tokens allow streams to reconnect and sync without losing missed events.
- Stream filters can target specific operation types (insert, update, delete).
- Eliminates resource-heavy database polling intervals in Node.js apps.
