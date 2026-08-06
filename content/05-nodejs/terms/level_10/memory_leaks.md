# Memory Leaks & Garbage Collection

> **Level 10 — Security & Production**
> The V8 heap, how leaks happen (dangling closures/listeners), and how to spot them.

---

## 1. Prerequisites
- [The Event Loop & Libuv](../level_01/event_loop.md) — The execution context running code scopes.
- [Buffers](../level_06/buffers.md) — The heavy binary chunks stored in memory.

---

## 2. Term Category
- **Production / DevOps / Performance Debugging**

---

## 3. Environment Context
- **Node.js / V8 Engine** (Governed by V8 heap memory garbage collection algorithms).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Node.js executes inside the V8 JavaScript engine. To manage memory, V8 uses a **Garbage Collector (GC)** to clean up unused memory. When variables fall out of scope (e.g., when a function exits), V8 automatically marks that memory as free and reclaims it.

However, if your code maintains a reference to an object that is no longer needed, the Garbage Collector cannot reclaim it. 

As requests continue to hit the server, memory usage grows continuously until it reaches V8's memory ceiling (typically **1.4GB** to **4GB** depending on the configuration and node version). At that point, the process terminates with an **Out Of Memory (OOM)** crash. This is a **Memory Leak**.

#### V8 Memory Structure
-   **The Stack:** Stores small primitive values (numbers, booleans) and active function execution context pointers.
-   **The Heap:** Stores heavy reference types (Objects, Arrays, Closures, and Buffers). The Garbage Collector only scans the Heap.

#### Common Memory Leak Patterns
1.  **Dangling Event Listeners:** Registering an event listener on a global emitter inside a request-response handler. The global emitter holds a reference to the request context in memory, preventing garbage collection.
2.  **Unmanaged Global Variables:** Assigning a value to a variable without declaring it using `const`, `let`, or `var`. This attaches the variable to the root `global` object, preserving it indefinitely.
3.  **Dangling Closures:** Inner functions keeping outer function variables in memory after the outer function has completed execution.

---

### (2) Reality Metaphor
Imagine a hotel cleaning service.
- **Garbage Collection (Housekeeping):** When a guest checks out of a room (**variable goes out of scope**), housekeeping cleans the room, removes all trash, and resets it for the next guest.
- **Memory Leak (Dangling Suitcase):** A guest checks out but leaves a suitcase locked in the closet, and the front desk retains their profile as an active booking (**dangling reference**). Because the room is marked as occupied, housekeeping cannot clean it. If every guest leaves a suitcase behind, the hotel eventually runs out of rooms and shuts down (**Out Of Memory crash**).

---

### (3) JavaScript Memory Leak Example

#### The Leak (Accumulating Request Data)
```javascript
const express = require('express');
const app = express();

// A global array that grows with every request
const requestHistory = []; 

app.get('/api/data', (req, res) => {
  // Every request appends metadata to the global array, consuming memory
  requestHistory.push({ time: new Date(), ip: req.ip, payload: new Array(10000) });
  
  res.send('Data logged');
});
```

#### The Fix (Limit Memory Footprint)
```javascript
// Limit the global array size to prevent unbounded memory growth
const requestHistory = [];
const MAX_LOGS = 100;

app.get('/api/data', (req, res) => {
  requestHistory.push({ time: new Date(), ip: req.ip });
  
  if (requestHistory.length > MAX_LOGS) {
    requestHistory.shift(); // Remove oldest record to free memory
  }
  
  res.send('Data logged safely');
});
```

---

### (4) How to Identify Memory Leaks

You can use the Chrome DevTools to profile Node.js memory usage:

1.  **Start Node in Inspect Mode:**
    ```bash
    node --inspect app.js
    ```
2.  **Open Chrome Web Inspector:**
    Navigate to `chrome://inspect` in Google Chrome and click **"Open dedicated DevTools for Node."**
3.  **Take Heap Snapshots:**
    - Go to the **Memory** tab.
    - Take a **Heap Snapshot** immediately after starting the server.
    - Run load testing on your application (e.g. sending 1,000 requests using a tool like `autocannon`).
    - Take a second **Heap Snapshot**.
    - Compare the two snapshots using the **"Comparison"** view. Look for objects (like `Array` or `Object`) that did not clean up.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to resolve memory leaks by forcing garbage collection using `global.gc()`

**The mistake:** Running Node.js with the `--expose-gc` flag and calling `global.gc()` manually inside application code when memory usage spikes.

**Why it's wrong:** Forcing garbage collection is slow, blocks the Event Loop, and degrades server performance. Furthermore, if your code maintains a reference to an object, the Garbage Collector **cannot** delete it even when invoked manually. Manually running the GC only hides memory leak bugs without resolving the root cause.

---



### Mistake 2: Retaining References in Global Arrays or Caches Without Eviction Policies

**The mistake:** Creating an in-memory cache `const cache = {}` without max size or TTL expiration.

**Why it's wrong:** Adding entries to global objects without eviction causes memory footprint to grow infinitely until the Node process crashes with `Heap out of memory`.

*Incorrect:*
```javascript
const cache = {};
app.get('/data', (req, res) => {
  cache[req.query.id] = data; // ❌ Memory leak! Items are never deleted!
});
```

*Fix:*
```javascript
const { LRUCache } = require('lru-cache');
const cache = new LRUCache({ max: 500, ttl: 1000 * 60 }); // LRU cache with TTL eviction
```

### Mistake 3: Accidentally Creating Closures That Retain Large Outer Scope Variables

**The mistake:** Creating event handlers inside functions that reference large buffer arrays in outer closures.

**Why it's wrong:** Closures hold reference to their outer Lexical Environment. Retaining a callback retains large outer scope variables, preventing garbage collection.

*Incorrect:*
```javascript
function process() {
  const hugeBuffer = Buffer.alloc(1e8); // 100MB
  setInterval(() => { console.log(hugeBuffer.length); }, 1000); // ❌ Retains 100MB forever!
}
```

*Fix:*
```javascript
function process() {
  const size = Buffer.alloc(1e8).length;
  setInterval(() => { console.log(size); }, 1000); // Retains only scalar primitive
}
```

## 6. Practice Exercises

### Exercise 1: Spot the Leak

**Problem:** Identify the memory leak in this route handler:

```javascript
const EventEmitter = require('events');
const systemEvents = new EventEmitter();

app.get('/status', (req, res) => {
  // The leak:
  systemEvents.on('update', () => {
    res.send('System update complete');
  });
});
```

> [!check]- Answer
> - The leak occurs because `systemEvents.on('update')` registers a new listener to the global `systemEvents` emitter on every request. This keeps a reference to the `res` object in memory. Since `systemEvents` is never cleaned up, the listeners list grows with every request, creating a memory leak.
> - *Fix:* Use `systemEvents.once('update')` to automatically clean up the listener after it fires, or use `removeListener` inside the handler.
> 
> 
---



### Exercise 2: Generating Node.js Heap Snapshot

**Problem:** Which CLI flag or `v8` module function takes a V8 heap snapshot for memory leak inspection in Chrome DevTools?

**Expected output:**
> [!check]- Answer
> ```text
> v8.getHeapSnapshot() or node --heap-snapshot-on-signal=SIGUSR2 app.js
> ```
> ```javascript
> const v8 = require('v8');
> const stream = v8.getHeapSnapshot();
> ```
>
> **Explanation:** Heap snapshots write V8 memory object allocations to file for inspection in Chrome DevTools.
> 
---

### Exercise 3: Identifying Garbage Collection Root References

**Problem:** What are GC Roots in V8 garbage collection?

**Expected output:**
> [!check]- Answer
> ```text
> Active root objects (global variables, active call stack variables, DOM/event listeners) that prevent referenced objects from being garbage collected.
> ```
> ```text
> Active root objects (global variables, active call stack variables, DOM/event listeners) that prevent referenced objects from being garbage collected.
> ```
>
> **Explanation:** Objects reachable from GC Roots cannot be garbage-collected by V8.
> 
## 7. Related Terms
- [Blocking the Event Loop](../level_01/blocking_event_loop.md) — Freezing the main execution thread.
- [Buffers](../level_06/buffers.md) — High-memory byte allocations that require garbage collection.

---

## 8. Key Takeaways
- A memory leak occurs when V8 cannot reclaim memory because references to unused objects remain.
- Unhandled memory leaks will eventually crash the server with an Out Of Memory (OOM) error.
- Common causes of memory leaks include dangling event listeners and global variables.
- The Stack stores small primitive variables; the Heap stores heavy objects and closures.
- Use `node --inspect` and Chrome DevTools Heap Snapshots to locate memory leaks.
- Do not use manual `global.gc()` calls to manage memory; resolve the underlying dangling references.
