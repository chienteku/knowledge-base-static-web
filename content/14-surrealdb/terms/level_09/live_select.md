# `LIVE SELECT` (Live Queries)

> **Level 9 — Real-Time Features, Events & Functions**
> SurrealQL's real-time subscription statement that pushes live create, update, and delete notifications over WebSocket connections whenever matching database records change.

---

## 1. Prerequisites

- [`SELECT`](../level_03/select.md) — The base query syntax.
- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](../level_01/connection_uri.md) — Persistent WebSocket connections (`ws://`, `wss://`).

---

## 2. Term Category
- **Real-Time & Subscriptions**

---

## 3. Environment Context
- **SurrealDB WebSocket Protocol & SDKs** (Maintains stateful subscriptions on the server, pushing JSON delta events over WebSocket streams).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional web architectures, pushing real-time data updates to browsers requires complex infrastructure: polling endpoints periodically (high latency & server load), configuring Redis Pub/Sub, running Socket.io servers, or setting up PostgreSQL `LISTEN`/`NOTIFY` with custom backend handlers.

SurrealDB introduces `LIVE SELECT` as a first-class feature built directly into the database engine. By executing `LIVE SELECT * FROM post WHERE author = user:tobie` over a WebSocket connection, SurrealDB listens for data changes at the engine level. Whenever a matching record is created, updated, or deleted, SurrealDB pushes a lightweight JSON notification directly to the connected client.

### (2) Reality Metaphor
Think of news delivery:
- **Polling (Old approach)**: Walking down to the newsstand every 5 minutes to ask "Is the newspaper out yet?"
- **`LIVE SELECT` (SurrealDB approach)**: Subscribing to a home delivery service. The newspaper carrier drops the fresh edition at your doorstep the exact second it rolls off the printing press.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Execute over WebSocket connection to start listening to post changes
LIVE SELECT * FROM post WHERE published = true;
```

#### Fuller Example
```javascript
// JavaScript SDK subscribing to live query updates
import Surreal from 'surrealdb';

const db = new Surreal();
await db.connect('wss://db.example.com/rpc');
await db.use({ namespace: 'app', database: 'prod' });

// 1. Subscribe to live changes on the 'message' table
const liveQueryUuid = await db.live('message', (action, result) => {
    // action: 'CREATE' | 'UPDATE' | 'DELETE'
    console.log(`Live Event [${action}]:`, result);

    if (action === 'CREATE') {
        renderNewChatMessage(result);
    } else if (action === 'UPDATE') {
        updateMessageUI(result);
    } else if (action === 'DELETE') {
        removeMessageUI(result.id);
    }
});

console.log('Active Live Query UUID:', liveQueryUuid);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting LIVE SELECT over Stateless HTTP Requests

**The mistake:** Sending `LIVE SELECT` queries via standard stateless HTTP REST endpoints.

**Why it's wrong:** HTTP requests close immediately after returning a single response. `LIVE SELECT` requires a persistent, bidirectional WebSocket connection (`ws://` or `wss://`) to stream push events.

*Incorrect:*
```bash
# REST HTTP Post call (Cannot stream live events!)
curl -X POST http://localhost:8000/sql -d "LIVE SELECT * FROM post;"
```

*Fix:*
```javascript
// Use WebSocket protocol via JavaScript SDK or WebSocket client
const db = new Surreal();
await db.connect('wss://localhost:8000/rpc');
await db.live('post', callback);
```

---



### Mistake 2: Executing `LIVE SELECT` Over Stateless HTTP Connections

**The mistake:** Connecting SDK via `http://` endpoint and calling `db.live('user')`.

**Why it's wrong:** Stateless HTTP connections do NOT support real-time WebSocket live query push events. Connect via `ws://` or `wss://`.

*Incorrect:*
```surrealql
// HTTP connection
const db = new Surreal(); await db.connect("http://localhost:8000/rpc");
await db.live("user"); // ❌ Fails on HTTP!
```

*Fix:*
```surrealql
const db = new Surreal(); await db.connect("ws://localhost:8000/rpc");
await db.live("user"); // WebSocket live subscription
```

### Mistake 3: Ignoring `action` Types in Live Query Subscriptions

**The mistake:** Assuming live query events only stream newly created records.

**Why it's wrong:** Live queries push events for `CREATE`, `UPDATE`, and `DELETE` actions. Handle `action` metadata ('CREATE', 'UPDATE', 'DELETE') in client handlers.

*Incorrect:*
```surrealql
db.live("user", (action, result) => { updateList(result); }); // Ignores DELETE action!
```

*Fix:*
```surrealql
db.live("user", (action, result) => {
  if (action === 'DELETE') removeItem(result.id);
  else upsertItem(result);
});
```



### Mistake 4: Executing `LIVE SELECT` Over Stateless HTTP Connections

**The mistake:** Connecting SDK via `http://` endpoint and calling `db.live('user')`.

**Why it's wrong:** Stateless HTTP connections do NOT support real-time WebSocket live query push events. Connect via `ws://` or `wss://`.

*Incorrect:*
```surrealql
// HTTP connection
const db = new Surreal(); await db.connect("http://localhost:8000/rpc");
await db.live("user"); // ❌ Fails on HTTP!
```

*Fix:*
```surrealql
const db = new Surreal(); await db.connect("ws://localhost:8000/rpc");
await db.live("user"); // WebSocket live subscription
```

### Mistake 5: Ignoring `action` Types in Live Query Subscriptions

**The mistake:** Assuming live query events only stream newly created records.

**Why it's wrong:** Live queries push events for `CREATE`, `UPDATE`, and `DELETE` actions. Handle `action` metadata ('CREATE', 'UPDATE', 'DELETE') in client handlers.

*Incorrect:*
```surrealql
db.live("user", (action, result) => { updateList(result); }); // Ignores DELETE action!
```

*Fix:*
```surrealql
db.live("user", (action, result) => {
  if (action === 'DELETE') removeItem(result.id);
  else upsertItem(result);
});
```

## 6. Practice Exercises

### Exercise 1: Filtered Live Query
Write a `LIVE SELECT` statement that subscribes only to `order` table updates where `status = 'pending'`.

> [!check]- Answer
> - Combine `LIVE SELECT * FROM order` with `WHERE status = 'pending'`.

---



### Exercise 2: Subscribing to Filtered Live Query

**Problem:** Write SurrealQL query subscribing to live updates on `article` table where `published = true`.

**Expected output:**
> [!check]- Answer
> ```text
> LIVE SELECT * FROM article WHERE published = true;
> ```
> ```surrealql
> LIVE SELECT * FROM article WHERE published = true;
> ```
>
> **Explanation:** `LIVE SELECT ... WHERE` pushes live delta events for records matching predicates.

---

### Exercise 3: JS SDK Live Query Listener

**Problem:** Subscribe to `order` table updates using `db.live('order', callback)`.

**Expected output:**
> [!check]- Answer
> ```text
> const queryId = await db.live('order', (action, result) => console.log(action, result));
> ```
> ```javascript
> const queryId = await db.live('order', (action, result) => console.log(action, result));
> ```
>
> **Explanation:** `db.live(table, callback)` registers real-time event handlers over WebSockets.

## 7. Related Terms

- [`KILL` (Stopping Live Queries)](kill_live_query.md) — Terminating active live query subscriptions.
- [Changefeed (`DEFINE TABLE ... CHANGEFEED`)](changefeed.md) — Table change history tracking.
- [Direct Browser-to-Database Architecture](../level_08/browser_to_db.md) — Real-time browser architecture.
- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](../level_01/connection_uri.md) — Related concept: Connection URI & Protocols (`ws://`, `wss://`, `http://`).
- [`SHOW CHANGES FOR TABLE ... SINCE ...`](show_changes.md) — Related concept: `SHOW CHANGES FOR TABLE ... SINCE ...`.
- [SDK Live Query Subscriptions](../level_10/sdk_live_queries.md) — Related concept: SDK Live Query Subscriptions.
- [WebSocket vs HTTP Connection](../level_10/websocket_vs_http.md) — Related concept: WebSocket vs HTTP Connection.
- [`DEFINE EVENT`](define_event.md) — DEFINE EVENT triggers.

---

## 8. Key Takeaways
- `LIVE SELECT` enables real-time push subscriptions directly from SurrealDB.
- Pushes `CREATE`, `UPDATE`, and `DELETE` notifications over WebSocket connections.
- Replaces polling, Redis Pub/Sub, and backend Socket.io infrastructure.
