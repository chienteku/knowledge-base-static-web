# Memory Leaks & Garbage Collection

> **Level 10 — Security & Production**
> The V8 heap, how leaks happen (dangling closures/listeners), and how to spot them.

---

## 1. Prerequisites
- [The Event Loop & Libuv](../level_01/event_loop.md) — The execution context running code scopes.
- [Buffers](../level_06/buffers.md) — The heavy binary chunks stored in memory.

---

## 2. Term Category

**Production / DevOps / Performance Debugging (Node.js / V8 Engine .)**: Memory Leaks & Garbage Collection is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Event Listener Memory Leak Detector

**Scenario:** Inspects EventEmitter instances to detect dangling listeners causing memory leaks.

**Requirements:**
1. Write auditEventEmitterLeak(emitter, eventName, threshold).
2. Count listeners.
3. Flag if count > threshold.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditEventEmitterLeak(emitter, eventName, threshold = 10) {
>   const count = emitter.listenerCount(eventName);
>   const isLeaking = count > threshold;
>
>   return {
>     eventName,
>     listenerCount: count,
>     threshold,
>     isLeaking,
>     warning: isLeaking ? `Possible EventEmitter memory leak detected: ${count} listeners attached` : null
>   };
> }
>
> // Verification tests
> const EventEmitter = require("events");
> const emitter = new EventEmitter();
> for (let i = 0; i < 15; i++) {
>   emitter.on("data", () => {});
> }
>
> const audit = auditEventEmitterLeak(emitter, "data", 10);
> console.assert(audit.isLeaking === true, "Test 1 Failed: Flagged event listener leak");
> ```
>
> #### Technical Explanation
>
> 1. **EventEmitter Memory Leaks**: Attaching event listeners inside request handlers without removing them prevents garbage collection of request scopes.
> 2. **`setMaxListeners(n)`**: Node.js prints a warning if >10 listeners are attached to an event by default.
> 3. **Teardown Cleanup**: Always unbind listeners (`emitter.removeListener()`) during component unmount/teardown.
> 
---

### Exercise 2: Unbound In-Memory Cache Sweeper & LRU Evictor

**Scenario:** Implements a bounded in-memory cache with Least Recently Used (LRU) eviction to prevent unbound memory leak growth.

**Requirements:**
1. Write createBoundedCache(maxSize).
2. Implement `set(key, val)` and `get(key)`.
3. Evict oldest entry when maxSize is reached.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createBoundedCache(maxSize = 3) {
>   const cache = new Map();
>
>   return {
>     get(key) {
>       if (!cache.has(key)) return undefined;
>       const val = cache.get(key);
>       // Refresh key position for LRU
>       cache.delete(key);
>       cache.set(key, val);
>       return val;
>     },
>     set(key, val) {
>       if (cache.has(key)) {
>         cache.delete(key);
>       } else if (cache.size >= maxSize) {
>         // Evict oldest (first) entry in Map!
>         const firstKey = cache.keys().next().value;
>         cache.delete(firstKey);
>       }
>       cache.set(key, val);
>     },
>     size: () => cache.size
>   };
> }
>
> // Verification tests
> const c = createBoundedCache(2);
> c.set("k1", 1);
> c.set("k2", 2);
> c.set("k3", 3); // Triggers LRU eviction of k1!
>
> console.assert(c.get("k1") === undefined, "Test 1 Failed: k1 evicted");
> console.assert(c.size() === 2, "Test 2 Failed: Size bounded at max 2");
> ```
>
> #### Technical Explanation
>
> 1. **Unbound Global Cache Leak**: Storing objects in global JavaScript objects (`const cache = {}`) without TTL or max limits causes Heap OOM crashes.
> 2. **Map Key Ordering**: JavaScript `Map` preserves insertion order; deleting and re-setting a key moves it to the back (most recent position).
> 3. **lru-cache Package**: Popular production LRU cache package with TTL expiration and byte-size caps.
> 
---

### Exercise 3: V8 Heap Usage Monitor & Threshold Guard

**Scenario:** Monitors V8 heap memory usage (`process.memoryUsage()`) and triggers warning alerts when heap usage exceeds 85% of heap limit.

**Requirements:**
1. Write auditHeapMemoryUsage(memoryUsageObj, heapLimitBytes).
2. Calculate heap usage ratio.
3. Flag memory leak warning.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditHeapMemoryUsage(memoryUsageObj, heapLimitBytes = 1_500_000_000) {
>   const heapUsed = memoryUsageObj.heapUsed || 0;
>   const heapTotal = memoryUsageObj.heapTotal || 0;
>
>   const usageRatio = heapUsed / heapLimitBytes;
>   const isThresholdExceeded = usageRatio >= 0.85;
>
>   return {
>     heapUsedMb: Number((heapUsed / 1024 / 1024).toFixed(2)),
>     usageRatio: Number(usageRatio.toFixed(2)),
>     isThresholdExceeded,
>     status: isThresholdExceeded ? "CRITICAL_MEMORY_WARNING" : "HEALTHY"
>   };
> }
>
> // Verification tests
> const mem = { heapUsed: 1_350_000_000, heapTotal: 1_400_000_000 };
> const audit = auditHeapMemoryUsage(mem, 1_500_000_000);
>
> console.assert(audit.isThresholdExceeded === true, "Test 1 Failed: 90% heap usage flagged critical");
> console.assert(audit.status === "CRITICAL_MEMORY_WARNING", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **`process.memoryUsage()`**: Returns `rss` (Resident Set Size), `heapTotal` (allocated V8 heap), `heapUsed` (actual occupied JS objects).
> 2. **V8 Heap Limit (`--max-old-space-size`)**: Default Node.js 64-bit V8 heap limit is ~2GB–4GB; configure via `NODE_OPTIONS=--max-old-space-size=4096`.
> 3. **Heap Snapshots**: Generating V8 heap snapshots (`v8.writeHeapSnapshot()`) enables inspecting leaking retained objects in Chrome DevTools.
## 6. Related Terms
- [Blocking the Event Loop](../level_01/blocking_event_loop.md) — Freezing the main execution thread.
- [Buffers](../level_06/buffers.md) — High-memory byte allocations that require garbage collection.

---

## 7. Key Takeaways
- A memory leak occurs when V8 cannot reclaim memory because references to unused objects remain.
- Unhandled memory leaks will eventually crash the server with an Out Of Memory (OOM) error.
- Common causes of memory leaks include dangling event listeners and global variables.
- The Stack stores small primitive variables; the Heap stores heavy objects and closures.
- Use `node --inspect` and Chrome DevTools Heap Snapshots to locate memory leaks.
- Do not use manual `global.gc()` calls to manage memory; resolve the underlying dangling references.
