# Causal Consistency

> **Level 8 — Transactions, Consistency & Durability**
> The database consistency guarantee that ensures a client's operations are executed and seen in strict causal order—specifically guaranteeing that you always read your own writes, even when queries are routed to lagging replica set members.

---

## 1. Prerequisites

- [Read Concern](read_concern.md) — The read durability context.
- [Read Preference](read_preference.md) — The routing of queries.
- [`startSession()` / `session.withTransaction()`](session_transaction.md) — The sessions container.

---

## 2. Term Category
- **Database Theory / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Supported inside Client Sessions. Uses a logical clock system called **Cluster Time** (`$clusterTime`) passed between the driver and replica nodes to synchronize states).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in `read_preference.md`, routing read queries to Secondary nodes (to offload the primary) introduces **Replication Lag**.

Suppose a user edits their username from `"Alice"` to `"Alice_S"`, saves it (writes to primary), and refreshes their page (reads from a lagging secondary):
-   Without synchronization, they see their old name `"Alice"`.
-   They assume their change was lost, click save again, or file a bug report.
-   While eventual consistency is acceptable for other users (it's fine if Bob sees the old name for a few seconds), a user should always see **their own edits**. This is called **Read-Your-Own-Writes** consistency.

We designed **Causal Consistency** to solve this stale read problem. 

By tracking relationships inside a **Session**, MongoDB guarantees that a client's reads and writes are logically linked. 

If you write an update, the driver registers the logical timestamp. 

If your next query hits a lagging secondary, the driver tells the secondary: *"Do not return data until you have synchronized up to this timestamp."* 

The secondary blocks the query for a few milliseconds until it catches up, ensuring you never read stale data.

---

### (2) The Four Causal Guarantees
Within a causally consistent session, MongoDB guarantees:

1.  **Read-Your-Own-Writes:** A read will always see the effects of a previous write in that session.
2.  **Monotonic Reads:** A user will never see data revert to an older state on subsequent queries.
3.  **Monotonic Writes:** Writes are executed in the exact order they were submitted.
4.  **Writes Follow Reads:** If a write occurs after a read, the write occurs after that read logically in the cluster log.

---

### (3) Reality Metaphor (Version Sync)
Imagine editing a shared online document:
-   **Without Causal Consistency:** You edit a paragraph, click save, and refresh. 
    -   Because your browser hits a laggy server, the paragraph disappears. 
    -   You panic, rewrite it, and click save. 
    -   Suddenly the sync finishes and both changes merge, messing up the document.
-   **With Causal Consistency:** You write a paragraph. 
    -   The editor stamps your browser session with **`Version 5`**. 
    -   When you reload, your browser tells the server: *"Only show me the document if you have synced up to at least `Version 5`."* 
    -   If the server is only on `Version 4`, it pauses for a fraction of a second, waits for the sync, and then shows you the document. 
    -   You never see your text vanish.

---

### (4) Code Examples

#### Starting a Causally Consistent Session
To enforce causal consistency, you must enable it when starting a session and pass the session to your queries:

```javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');

async function runSession() {
  await client.connect();
  const db = client.db('shop');

  // 1. Start a session with causal consistency enabled (enabled by default in modern drivers)
  const session = client.startSession({ causalConsistency: true });

  try {
    const filter = { user_id: 101 };

    // 2. Write to the Primary node (passes session)
    await db.collection('profiles').updateOne(
      filter,
      { $set: { status: "Active" } },
      { session }
    );

    // 3. Read from a Secondary node (passes session)
    // The driver forces the secondary to wait until the write replicates!
    const profile = await db.collection('profiles').findOne(
      filter,
      { session, readPreference: 'secondary' }
    );

    console.log("Verified Status:", profile.status); // Guaranteed to display "Active"!
  } finally {
    await session.endSession();
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Executing queries without passing the session parameter, assuming causal consistency is globally active for the client connection

**The mistake:** Enabling `{ causalConsistency: true }` in your session setup, but writing your subsequent query statements without passing the `{ session }` option object.

**Why it's wrong:** Causal consistency is not a global connection state. 

The client driver tracks the `$clusterTime` token inside the local `session` instance variable. 

If you omit the session parameter, the query planner executes a standard query, which will read stale data from lagging secondaries.

**Fix: Always pass the `{ session }` parameter object to every read and write query in your workflow chain.**

---



### Mistake 2: Expecting Read-After-Write Consistency Across Separate Un-Sessioned Driver Requests

**The mistake:** Writing to Primary and immediately reading from Secondary without passing a Causal Consistency Session.

**Why it's wrong:** Secondary nodes replicate primary writes asynchronously. Without causal sessions (`causalConsistency: true`), reading from secondaries may return stale data.

*Incorrect:*
```javascript
// Executing write on primary and reading secondary without session
```

*Fix:*
```javascript
const session = client.startSession({ causalConsistency: true }); await db.coll.find({}, { session });
```

### Mistake 3: Disabling Causal Consistency on Client Sessions

**The mistake:** Explicitly setting `{ causalConsistency: false }` on client sessions in user-facing web applications.

**Why it's wrong:** Disabling causal consistency permits reading stale pre-update state after user mutations.

*Incorrect:*
```javascript
client.startSession({ causalConsistency: false });
```

*Fix:*
```javascript
Keep default causalConsistency: true on client sessions
```

## 6. Practice Exercises

### Exercise 1: Causal Consistency Audit

**Problem:** You have a 3-node replica set with a replication lag of `2 seconds`. 
A user updates their status. 
Explain how MongoDB handles a query sent to a secondary node 10 milliseconds later under these two scenarios:
1.  The query is executed **outside** a session.
2.  The query is executed **inside** a session configured with Causal Consistency.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Outside Session: The query executes immediately on the secondary node. Because the secondary lags by 2 seconds, the query reads and returns the user's old status.
> 2. Inside Causal Session: The driver passes the write's cluster timestamp to the secondary. The secondary recognizes it has not replicated up to this timestamp yet, pauses the query, waits for the replication log to catch up, and then returns the correct new status.
> ```
> - Analyze the impact of replication lag on unlinked queries.
> - Consider how the cluster clock blocks secondary reads until synchronization is complete.

---



### Exercise 2: Causally Consistent Session Setup

**Problem:** Start causally consistent client session in Node.js driver (`client.startSession({ causalConsistency: true })`).

**Expected output:**
> [!check]- Answer
> ```text
> const session = client.startSession({ causalConsistency: true });
> ```
> ```javascript
> const session = client.startSession({ causalConsistency: true });
> ```
>
> **Explanation:** Causally consistent sessions guarantee read-after-write operations across replica nodes.

---

### Exercise 3: Causal Consistency Guarantees

**Problem:** List 2 causal consistency guarantees in MongoDB (Read-after-write, Monotonic reads).

**Expected output:**
> [!check]- Answer
> ```text
> Read-after-write, Monotonic reads
> ```
> ```text
> Read-after-write, Monotonic reads
> ```
>
> **Explanation:** Causal sessions track cluster operations to ensure operations observe preceding writes.

## 7. Related Terms

- [`startSession()` / `session.withTransaction()`](session_transaction.md) — The session containers.
- [Read Preference](read_preference.md) — The routing of queries.

---

## 8. Key Takeaways
- Causal Consistency guarantees that operations are executed in causal order.
- Guarantees Read-Your-Own-Writes and Monotonic Reads in a session.
- Solves the stale read problem when query routing is sent to secondary nodes.
- Requires using Client Sessions (`startSession()`) to track cluster time.
- Uses logical cluster clocks (`$clusterTime`) to synchronize driver and nodes.
- Lagging nodes will block reads until they replicate up to the session timestamp.
- Always pass the `{ session }` object parameter to every query to enable tracking.
