# SDK Live Query Subscriptions

> **Level 10 — SDKs, Deployment & Production**
> Client SDK methods (`db.live()` and `db.subscribeLive()`) that subscribe to real-time database updates over WebSocket streams, firing event callbacks whenever records are created, updated, or deleted.

---

## 1. Prerequisites
- [`LIVE SELECT` (Live Queries)](../level_09/live_select.md) — Server-side live queries.
- [`KILL` (Stopping Live Queries)](../level_09/kill_live_query.md) — Unsubscribing live queries.

---

## 2. Term Category
- **SDK Methods & Real-Time**

---

## 3. Environment Context
- **Browser & Mobile UI Frameworks** (React, Vue, Svelte, React Native) receiving real-time push data from SurrealDB.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Building reactive UI components (such as live chat feeds, notification bells, collaborative whiteboards, or stock tickers) requires real-time data sync. In traditional web development, developers write custom WebSocket client listeners, parse incoming messages, match IDs, and update local state manually.

SurrealDB's JavaScript SDK simplifies real-time UI development with the `db.live()` method. When called, `db.live('table_name', callback)` issues a `LIVE SELECT` query over WebSocket and invokes your callback function whenever a `CREATE`, `UPDATE`, or `DELETE` event occurs on matching records.

### (2) Reality Metaphor
Think of an RSS feed reader:
- Instead of manually opening a website and refreshing the browser page to check for new articles, your RSS reader app runs silently in the background and sends you a desktop notification the second a new article is published.

### (3) Code Examples

#### Short Snippet
```typescript
// Subscribing to real-time live events on the 'post' table
const queryUuid = await db.live('post', (action, record) => {
    console.log(`Action: ${action}`, record); // action: 'CREATE' | 'UPDATE' | 'DELETE'
});
```

#### Fuller Example
```typescript
import { Surreal, RecordId } from 'surrealdb';

interface Message {
    id: RecordId<'message'>;
    text: string;
    sender: string;
}

async function setupChatFeed(db: Surreal) {
    // 1. Subscribe to live queries on 'message' table
    const liveUuid = await db.live<Message>('message', (action, record) => {
        switch (action) {
            case 'CREATE':
                console.log('New message received:', record.text);
                appendMessageToUI(record);
                break;
            case 'UPDATE':
                console.log('Message edited:', record.id, record.text);
                updateMessageUI(record);
                break;
            case 'DELETE':
                console.log('Message deleted:', record.id);
                removeMessageFromUI(record.id);
                break;
        }
    });

    console.log('Subscribed with Live UUID:', liveUuid);

    // 2. Later: Cleanly terminate live query subscription when UI unmounts
    setTimeout(async () => {
        await db.kill(liveUuid);
        console.log('Unsubscribed from live chat feed.');
    }, 60000);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Invoking db.live() over HTTP Connections

**The mistake:** Calling `db.live()` when the SDK is connected via HTTP protocol (`http://` or `https://`).

**Why it's wrong:** HTTP is a stateless request-response protocol and cannot support streaming WebSocket callbacks. `db.live()` requires a WebSocket connection (`ws://` or `wss://`).

*Incorrect:*
```typescript
const db = new Surreal();
await db.connect('http://localhost:8000'); // HTTP connection!
await db.live('post', callback); // Error: Live queries require WebSocket!
```

*Fix:*
```typescript
const db = new Surreal();
await db.connect('ws://localhost:8000/rpc'); // WebSocket connection!
await db.live('post', callback); // Works!
```

---



### Mistake 2: Forgetting to Un-Subscribe Live Queries When Components Unmount

**The mistake:** Calling `db.live('user', callback)` inside UI components without calling `db.kill(id)` on cleanup.

**Why it's wrong:** Failing to kill live queries keeps WebSocket listeners active, causing memory leaks and redundant UI re-renders.

*Incorrect:*
```surrealql
// React useEffect missing cleanup function
useEffect(() => { db.live('user', callback); }, []);
```

*Fix:*
```surrealql
useEffect(() => {
  let id;
  db.live('user', callback).then(res => id = res);
  return () => { if (id) db.kill(id); };
}, []);
```

### Mistake 3: Ignoring Action Parameter in Live Query Callbacks

**The mistake:** Treating all live query updates as new created records.

**Why it's wrong:** Live query callbacks receive `(action, result)`. `action` is `'CREATE'`, `'UPDATE'`, or `'DELETE'`. Handle each action type accordingly.

*Incorrect:*
```surrealql
db.live('user', (action, result) => { items.push(result); }); // ❌ Duplicate items on UPDATE!
```

*Fix:*
```surrealql
db.live('user', (action, result) => {
  if (action === 'DELETE') remove(result.id);
  else upsert(result);
});
```



### Mistake 4: Forgetting to Un-Subscribe Live Queries When Components Unmount

**The mistake:** Calling `db.live('user', callback)` inside UI components without calling `db.kill(id)` on cleanup.

**Why it's wrong:** Failing to kill live queries keeps WebSocket listeners active, causing memory leaks and redundant UI re-renders.

*Incorrect:*
```surrealql
// React useEffect missing cleanup function
useEffect(() => { db.live('user', callback); }, []);
```

*Fix:*
```surrealql
useEffect(() => {
  let id;
  db.live('user', callback).then(res => id = res);
  return () => { if (id) db.kill(id); };
}, []);
```

### Mistake 5: Ignoring Action Parameter in Live Query Callbacks

**The mistake:** Treating all live query updates as new created records.

**Why it's wrong:** Live query callbacks receive `(action, result)`. `action` is `'CREATE'`, `'UPDATE'`, or `'DELETE'`. Handle each action type accordingly.

*Incorrect:*
```surrealql
db.live('user', (action, result) => { items.push(result); }); // ❌ Duplicate items on UPDATE!
```

*Fix:*
```surrealql
db.live('user', (action, result) => {
  if (action === 'DELETE') remove(result.id);
  else upsert(result);
});
```

## 6. Practice Exercises

### Exercise 1: Live Query Event Actions
What are the 3 possible string values for the `action` parameter passed to the `db.live()` callback function?

> [!check]- Answer
> - The 3 actions correspond to database record mutations: `'CREATE'`, `'UPDATE'`, and `'DELETE'`.

---



### Exercise 2: Live Query Subscription and Un-subscription

**Problem:** Subscribe to `article` live query, receive updates, and kill query with `db.kill(queryId)`.

**Expected output:**
```text
const id = await db.live('article', cb); ... await db.kill(id);
```

> [!check]- Answer
> ```javascript
> const queryId = await db.live('article', (action, result) => {
>   console.log(action, result);
> });
> // Later on cleanup:
> await db.kill(queryId);
> ```
>
> **Explanation:** `db.live()` returns a query ID used to cancel subscriptions via `db.kill()`.

### Exercise 3: Handling Live Query Action Types

**Problem:** List 3 action types passed to live query callbacks (`CREATE`, `UPDATE`, `DELETE`).

**Expected output:**
```text
CREATE, UPDATE, DELETE
```

> [!check]- Answer
> ```text
> CREATE, UPDATE, DELETE
> ```
>
> **Explanation:** Live query callbacks receive action strings indicating record mutation type.



### Exercise 4: Live Query Subscription and Un-subscription

**Problem:** Subscribe to `article` live query, receive updates, and kill query with `db.kill(queryId)`.

**Expected output:**
```text
const id = await db.live('article', cb); ... await db.kill(id);
```

> [!check]- Answer
> ```javascript
> const queryId = await db.live('article', (action, result) => {
>   console.log(action, result);
> });
> // Later on cleanup:
> await db.kill(queryId);
> ```
>
> **Explanation:** `db.live()` returns a query ID used to cancel subscriptions via `db.kill()`.

### Exercise 5: Handling Live Query Action Types

**Problem:** List 3 action types passed to live query callbacks (`CREATE`, `UPDATE`, `DELETE`).

**Expected output:**
```text
CREATE, UPDATE, DELETE
```

> [!check]- Answer
> ```text
> CREATE, UPDATE, DELETE
> ```
>
> **Explanation:** Live query callbacks receive action strings indicating record mutation type.

## 7. Related Terms
- [`LIVE SELECT` (Live Queries)](../level_09/live_select.md) — Server-side live query statement.
- [`KILL` (Stopping Live Queries)](../level_09/kill_live_query.md) — Terminating subscriptions.
- [JavaScript / TypeScript SDK](js_sdk.md) — SDK package overview.

---

## 8. Key Takeaways
- `db.live('table', callback)` subscribes to real-time database changes over WebSocket.
- Callback receives `action` (`CREATE`/`UPDATE`/`DELETE`) and the modified `record`.
- Returns a unique subscription UUID that must be passed to `db.kill(uuid)` when cleaning up.
