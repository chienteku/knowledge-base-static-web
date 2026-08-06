# `LIVE SELECT` (Live Queries)

> **Level 9 — Real-Time Features, Events & Functions**
> SurrealQL's real-time subscription statement that pushes live create, update, and delete notifications over WebSocket connections whenever matching database records change.

---

## 1. Prerequisites

- [`SELECT`](../level_03/select.md) — The base query syntax.
- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](../level_01/connection_uri.md) — Persistent WebSocket connections (`ws://`, `wss://`).

---

## 2. Term Category


**Query Feature (real-time live query subscription statement)**: - **Real-Time & Subscriptions**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Subscribing to Table Mutations with `LIVE SELECT`

**Scenario:**
A dashboard application subscribes to real-time order creation events on table `order` using `LIVE SELECT`.

**Requirements:**
1. Execute `LIVE SELECT * FROM order;`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Subscribe to real-time table mutations
> LIVE SELECT * FROM order;
> ```
>
> #### Technical Explanation
>
> 1. `LIVE SELECT * FROM <table>` opens a persistent real-time streaming subscription over WebSockets.
> 2. Pushes mutation events (`CREATE`, `UPDATE`, `DELETE`) to the client instantly.
> 3. Eliminates client polling loops and external message brokers (Socket.io, Redis).

---

### Exercise 2: Filtered Live Query Subscriptions

**Scenario:**
Subscribe ONLY to high-priority order creation events where `total > 500dec`.

**Requirements:**
1. Execute `LIVE SELECT * FROM order WHERE total > 500dec;`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Filtered real-time live subscription
> LIVE SELECT * FROM order WHERE total > 500dec;
> ```
>
> #### Technical Explanation
>
> 1. `WHERE` clauses filter live query events on the database server before streaming to clients.
> 2. Only mutations satisfying the filter condition generate server push notifications.
> 3. Saves network bandwidth by filtering unwanted event traffic server-side.

---

### Exercise 3: JavaScript SDK Live Query Event Handling

**Scenario:**
Write the JavaScript SDK code to listen for `CREATE` and `UPDATE` events on table `notification`.

**Requirements:**
1. Use `db.live("notification", callback)` in TypeScript.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const liveUuid = await db.live("notification", (action, result) => {
>   if (action === "CREATE") {
>     console.log("New notification received:", result);
>   } else if (action === "UPDATE") {
>     console.log("Notification updated:", result);
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. `db.live()` registers a callback receiving `action` (`"CREATE"`, `"UPDATE"`, `"DELETE"`) and `result` record payloads.
> 2. Automatically decodes binary WebSocket frames into JavaScript objects.
> 3. Enables reactive UI rendering in frontend web applications.

---





## 6. Related Terms

- [`KILL` (Stopping Live Queries)](kill_live_query.md) — Terminating active live query subscriptions.
- [Changefeed (`DEFINE TABLE ... CHANGEFEED`)](changefeed.md) — Table change history tracking.
- [Direct Browser-to-Database Architecture](../level_08/browser_to_db.md) — Real-time browser architecture.
- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](../level_01/connection_uri.md) — Related concept: Connection URI & Protocols (`ws://`, `wss://`, `http://`).
- [`SHOW CHANGES FOR TABLE ... SINCE ...`](show_changes.md) — Related concept: `SHOW CHANGES FOR TABLE ... SINCE ...`.
- [SDK Live Query Subscriptions](../level_10/sdk_live_queries.md) — Related concept: SDK Live Query Subscriptions.
- [WebSocket vs HTTP Connection](../level_10/websocket_vs_http.md) — Related concept: WebSocket vs HTTP Connection.
- [`DEFINE EVENT`](define_event.md) — DEFINE EVENT triggers.

---

## 7. Key Takeaways
- `LIVE SELECT` enables real-time push subscriptions directly from SurrealDB.
- Pushes `CREATE`, `UPDATE`, and `DELETE` notifications over WebSocket connections.
- Replaces polling, Redis Pub/Sub, and backend Socket.io infrastructure.
