# `KILL` (Stopping Live Queries)

> **Level 9 — Real-Time Features, Events & Functions**
> The SurrealQL statement and SDK method used to terminate an active live query subscription using its unique UUID identifier.

---

## 1. Prerequisites

- [`LIVE SELECT` (Live Queries)](live_select.md) — Creating live query subscriptions.
- [Parameters (`$param`)](../level_06/parameters.md) — Passing query parameters.

---

## 2. Term Category


**SurrealQL Command (live query subscription termination statement)**: - **Real-Time & Resource Management**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When a client application starts a `LIVE SELECT` subscription, the SurrealDB server allocates memory and CPU resources to evaluate matching record events for that session. If a user navigates to another page, closes a tab, or unmounts a UI component without canceling the subscription, orphaned subscriptions continue consuming server bandwidth and memory.

The `KILL` statement allows client applications to explicitly unsubscribe from a live query by passing its subscription UUID (`KILL u"d85c8e31-5a21-4f1e-8e01-9c8742ab1234"`). This immediately stops server event evaluation and releases server resources.

### (2) Reality Metaphor
Think of a magazine subscription:
- **`LIVE SELECT`**: Signing up for monthly magazine deliveries.
- **`KILL`**: Calling subscriber services to cancel your subscription when you move away, stopping shipments so magazines don't pile up in an empty mailbox.

### (3) Code Examples

#### Short Snippet
```surrealql
-- Terminate a live query subscription using its UUID
KILL u"d85c8e31-5a21-4f1e-8e01-9c8742ab1234";
```

#### Fuller Example
```javascript
// React component lifecycle managing live query subscription and cleanup
import React, { useEffect, useState } from 'react';
import { db } from './surreal';

function LiveChatFeed() {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        let liveQueryUuid;

        async function startSubscription() {
            // 1. Start live query subscription
            liveQueryUuid = await db.live('message', (action, record) => {
                if (action === 'CREATE') {
                    setMessages(prev => [...prev, record]);
                }
            });
        }

        startSubscription();

        // 2. Cleanup phase: KILL subscription when React component unmounts
        return () => {
            if (liveQueryUuid) {
                db.kill(liveQueryUuid);
                console.log('Killed live query:', liveQueryUuid);
            }
        };
    }, []);

    return (
        <div>
            {messages.map(m => <p key={m.id}>{m.text}</p>)}
        </div>
    );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Unsubscribe on Component Unmount

**The mistake:** Calling `db.live()` inside single-page application (SPA) views without invoking `db.kill()` when the view unmounts.

**Why it's wrong:** Re-entering the view multiple times accumulates duplicate active live subscriptions on the same WebSocket connection, causing memory leaks and duplicated event callbacks.

*Incorrect:*
```javascript
// Missing cleanup function in useEffect!
useEffect(() => {
    db.live('notification', handleNotification);
}, []);
```

*Fix:*
```javascript
useEffect(() => {
    let queryId;
    db.live('notification', handleNotification).then(id => queryId = id);
    return () => { if (queryId) db.kill(queryId); };
}, []);
```

---



### Mistake 2: Passing Non-UUID Arguments to `KILL` Statements

**The mistake:** Executing `KILL 'user';` or passing table names to `KILL`.

**Why it's wrong:** `KILL` requires the exact UUID string returned when establishing a `LIVE SELECT` subscription (e.g. `KILL u"f47ac10b-58cc-4372-a567-0e02b2c3d479";`).

*Incorrect:*
```surrealql
KILL "user"; // ❌ Invalid UUID live query target!
```

*Fix:*
```surrealql
KILL u"f47ac10b-58cc-4372-a567-0e02b2c3d479"; // Valid live query UUID target
```

### Mistake 3: Forgetting to Cancel Live Queries in Client Application Un-Mount Hooks

**The mistake:** Leaving `LIVE SELECT` subscriptions active when React components unmount.

**Why it's wrong:** Un-killed live queries keep WebSocket channels and server memory buffers active indefinitely. Always call `db.kill(liveQueryId)` or `KILL` on component unmount.

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





## 5. Practice Exercises

### Exercise 1: Subscribing and Terminating Live Queries

**Scenario:**
A web client subscribes to a live query on table `order`, receives a subscription UUID, and subsequently terminates the live query using `KILL`.

**Requirements:**
1. Execute `LIVE SELECT * FROM order;` and capture the returned UUID.
2. Execute `KILL "live-query-uuid";` to terminate the subscription.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- 1. Subscribe to live query (returns UUID string e.g. "018c4e6a-7b3f-7123-89ab-cdef01234567")
> LIVE SELECT * FROM order;
> 
> -- 2. Terminate live query subscription by UUID
> KILL "018c4e6a-7b3f-7123-89ab-cdef01234567";
> ```
>
> #### Technical Explanation
>
> 1. `LIVE SELECT` returns a unique UUID identifying the active real-time subscription channel.
> 2. `KILL "<uuid>"` terminates the background live query stream on the server.
> 3. Frees WebSocket connection memory and server listener resources.
> 
---

### Exercise 2: Terminating Live Queries from JavaScript SDK

**Scenario:**
Write the JavaScript SDK code to unsubscribe from an active live query using `db.kill(uuid)`.

**Requirements:**
1. Unsubscribe from live query using `await db.kill(queryUuid)`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const queryUuid = await db.live("order", (action, result) => {
>   console.log("Order update:", action, result);
> });
> 
> // Later, unsubscribe and release resources
> await db.kill(queryUuid);
> console.log("Unsubscribed live query subscription.");
> ```
> 
> #### Technical Explanation
>
> 1. SDK client `db.kill(uuid)` sends a `KILL` statement over the WebSocket channel.
> 2. Removes the live query listener on the SurrealDB server process.
> 3. Prevents memory leaks in single-page web apps when UI components unmount.
> 
---

### Exercise 3: Automatic Server-Side Live Query Cleanup

**Scenario:**
Explain what happens to active live queries when a client WebSocket connection drops unexpectedly.

**Requirements:**
1. Describe automatic connection cleanup behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Server Connection Cleanup:
> When a client WebSocket disconnects unexpectedly, SurrealDB automatically terminates and kills all active live query listeners associated with that connection session.
> ```
>
> #### Technical Explanation
>
> 1. SurrealDB binds live query subscriptions to active client connection session IDs.
> 2. Automatically cleans up orphan live queries when client sockets disconnect.
> 3. Protects database server memory against leaked subscriptions.
> 
---





## 6. Related Terms

- [`LIVE SELECT` (Live Queries)](live_select.md) — Starting live subscriptions.
- [JavaScript / TypeScript SDK](../level_10/js_sdk.md) — Client SDK lifecycle methods.
- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](../level_01/connection_uri.md) — WebSocket session transport.
- [SDK Live Query Subscriptions](../level_10/sdk_live_queries.md) — Related concept: SDK Live Query Subscriptions.

---

## 7. Key Takeaways
- `KILL` terminates active `LIVE SELECT` subscriptions using their UUID.
- Essential for preventing server memory leaks and redundant network events in SPAs.
- In SDKs, invoke `db.kill(uuid)` during component cleanup/unmount lifecycle phases.
