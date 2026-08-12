# The events Module

> **Level 2 — Core Modules & Globals**
> The `EventEmitter` class's home module (used in Level 5) surfaced as a core module.

---

## 1. Prerequisites
- [Global Objects (global, __dirname, __filename)](global_objects.md) — The global namespace containing built-in primitives.
- [The process Object](process_object.md) — Node.js core modules and event emitter architecture.

---

## 2. Term Category

**Core Module (Node.js Core Architecture .)**: The events Module is a fundamental concept in this technology stack. **Level 2 — Core Modules & Globals**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Node.js is built around an **Event-Driven Architecture**. Many core features (such as HTTP servers, file streams, and child processes) need a standardized way to signal when operations change states (e.g. *"a client connected,"* *"a file finished loading,"* or *"an error occurred"*).

To provide a unified framework for event communication, Node.js includes the built-in **`events` module**:
-   **The `events` Module:** The home of the `EventEmitter` class.
-   **Publish/Subscribe (Pub/Sub):** Objects that inherit from `EventEmitter` can publish events using `.emit()`, and register interest in events using `.on()` or `.once()`.
-   **Memory Leak Safety:** If a developer registers more than **10 listeners** for a single event on an EventEmitter, Node.js logs a warning in the console:
    `MaxListenersExceededWarning: Possible EventEmitter memory leak detected.`
    This helps prevent memory leaks caused by repeatedly adding listeners without cleaning them up.

---

### (2) Reality Metaphor
Imagine a local **radio broadcasting tower**.
- **The `events` Module** is the transmission infrastructure that allows anyone to set up a radio booth.
- **An `EventEmitter` instance** is the **radio station**. It broadcasts updates on specific frequencies.
- **`.emit(channel, message)`** is the station announcer broadcasting a message over the airwaves. They do not know who is listening.
- **`.on(channel, callback)`** is a listener tuning their radio receiver dial to a specific channel frequency. Every time the announcer speaks on that channel, the listener runs a callback (e.g. writing down the news).

---

### (3) JavaScript Event Subclassing Example

Here is how to create a custom class that inherits from `EventEmitter` to signal changes in a database connection status:

```javascript
const EventEmitter = require('events');

// 1. Create a class that extends EventEmitter
class DatabaseConnector extends EventEmitter {
  connect() {
    console.log("Starting connection...");
    
    // Simulate connection lag
    setTimeout(() => {
      // 2. Emit the 'connected' event with a payload
      this.emit('connected', { dbName: 'production_db', latencyMs: 12 });
    }, 500);
  }
}

const db = new DatabaseConnector();

// 3. Register a subscriber using .on()
db.on('connected', (status) => {
  console.log(`Success! Database ${status.dbName} linked in ${status.latencyMs}ms.`);
});

db.connect();
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating memory leaks by forgetting to remove event listeners

**The mistake:** Registering event listeners inside a short-lived request handler without removing them, leaving references active.

```javascript
// BAD: Every HTTP request adds a NEW listener to the global emitter!
app.get('/status', (req, res) => {
  globalEmitter.on('update', (data) => {
    res.send(data);
  });
});
```

**Why it's wrong:** The `globalEmitter` maintains a list of callback references. The short-lived request object (`res`) cannot be garbage collected because `globalEmitter` holds a reference to it. Over time, memory usage grows, eventually causing the server to crash.

*Fix:* Remove listeners when they are no longer needed using `.off()` or `.removeListener()`, or use `.once()` to automatically clean up the listener after it fires:
```javascript
app.get('/status', (req, res) => {
  const handler = (data) => {
    res.send(data);
    globalEmitter.off('update', handler); // Clean up!
  };
  globalEmitter.on('update', handler);
});
```

---



### Mistake 2: Memory Leaks Caused by Un-Removed EventEmitter Listeners (`MaxListenersExceededWarning`)

**The mistake:** Attaching event listeners inside request handlers without removing them when requests complete.

**Why it's wrong:** Attaching listeners repeatedly accumulates callbacks in memory, triggering Node's `MaxListenersExceededWarning` and creating memory leaks.

*Incorrect:*
```javascript
app.get('/event', (req, res) => {
  emitter.on('data', (msg) => res.send(msg)); // ❌ Leaks listeners on every request!
});
```

*Fix:*
```javascript
app.get('/event', (req, res) => {
  emitter.once('data', (msg) => res.send(msg)); // Use once() or removeListener()
});
```

### Mistake 3: Emitting 'error' Events Without Attaching an Error Listener

**The mistake:** Calling `emitter.emit('error', new Error('Fail'))` on an EventEmitter instance with no `on('error')` handler attached.

**Why it's wrong:** If an EventEmitter emits `'error'` and has no listeners registered for `'error'`, Node.js treats it as an uncaught exception and crashes the process.

*Incorrect:*
```javascript
const emitter = new EventEmitter();
emitter.emit('error', new Error('Crash!')); // ❌ Process crashes instantly!
```

*Fix:*
```javascript
const emitter = new EventEmitter();
emitter.on('error', (err) => console.error('Caught:', err.message));
emitter.emit('error', new Error('Handled!'));
```

## 5. Practice Exercises

### Exercise 1: Custom EventEmitter Audit Logger

**Scenario:** An e-commerce order engine emits events (`order:created`, `order:failed`) handled asynchronously by logging and analytics listeners.

**Requirements:**
1. Write createOrderEventEmitter(EventEmitterClass).
2. Register listeners.
3. Emit order events with payload.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createOrderEventEmitter(EventEmitterClass) {
>   const EventEmitter = EventEmitterClass || require("events");
>   const emitter = new EventEmitter();
>
>   const auditLogs = [];
>
>   emitter.on("order:created", (order) => {
>     auditLogs.push({ event: "order:created", orderId: order.id, status: "SUCCESS" });
>   });
>
>   emitter.on("order:failed", (order, reason) => {
>     auditLogs.push({ event: "order:failed", orderId: order.id, status: "FAILED", reason });
>   });
>
>   return {
>     emitter,
>     getAuditLogs: () => auditLogs,
>     createOrder: (order) => emitter.emit("order:created", order),
>     failOrder: (order, reason) => emitter.emit("order:failed", order, reason)
>   };
> }
>
> // Verification tests
> const EventEmitter = require("events");
> const service = createOrderEventEmitter(EventEmitter);
>
> service.createOrder({ id: "ord_101", amount: 50 });
> service.failOrder({ id: "ord_102" }, "INSUFFICIENT_FUNDS");
>
> const logs = service.getAuditLogs();
> console.assert(logs.length === 2, "Test 1 Failed");
> console.assert(logs[0].orderId === "ord_101", "Test 2 Failed");
> console.assert(logs[1].reason === "INSUFFICIENT_FUNDS", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Publish-Subscribe Pattern**: Decouples event producers (order creator) from event consumers (audit logger, email notification service).
> 2. **Synchronous Execution by Default**: EventEmitter listeners run synchronously in registration order unless wrapped in async/setImmediate.
> 3. **Decoupled Microservice Architecture**: Allows adding new feature listeners without modifying core order processing logic.
> 
---

### Exercise 2: EventEmitter Memory Leak Detector & MaxListeners Guard

**Scenario:** An APM tool configures `setMaxListeners()` to catch memory leaks caused by registering duplicate event listeners in request handlers.

**Requirements:**
1. Write configureMaxListeners(emitter, limit).
2. Set max listeners limit.
3. Add listener monitor.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function configureMaxListeners(emitter, limit = 5) {
>   if (!emitter || typeof emitter.setMaxListeners !== "function") {
>     throw new TypeError("Invalid EventEmitter instance");
>   }
>
>   emitter.setMaxListeners(limit);
>
>   return {
>     limit,
>     listenerCount: (eventName) => emitter.listenerCount(eventName),
>     hasExceededLimit: (eventName) => emitter.listenerCount(eventName) > limit
>   };
> }
>
> // Verification tests
> const EventEmitter = require("events");
> const emitter = new EventEmitter();
>
> const config = configureMaxListeners(emitter, 3);
> emitter.on("data", () => {});
> emitter.on("data", () => {});
>
> console.assert(config.listenerCount("data") === 2, "Test 1 Failed");
> console.assert(config.hasExceededLimit("data") === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **MaxListenersExceededWarning**: Node.js emits warning when >10 listeners are attached to a single event to detect memory leaks.
> 2. **Common Leak Root Cause**: Registering `emitter.on()` inside HTTP request handlers causes listener buildup on every incoming request.
> 3. **Proper Cleanup**: Use `emitter.once()` or explicitly call `emitter.removeListener()` when request finishes.
> 
---

### Exercise 3: Async Event Handling with events.once

**Scenario:** A database client waits asynchronously for a connection event using `events.once()` with timeout protection.

**Requirements:**
1. Write waitForConnection(emitter, eventName, timeoutMs).
2. Listen for single event.
3. Reject if timeout expires before event fires.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function waitForConnection(emitter, eventName = "connect", timeoutMs = 1000) {
>   return new Promise((resolve, reject) => {
>     let timerId = null;
>
>     function handleEvent(data) {
>       if (timerId) clearTimeout(timerId);
>       resolve(data);
>     }
>
>     timerId = setTimeout(() => {
>       emitter.removeListener(eventName, handleEvent);
>       reject(new Error(`Timeout waiting for event '${eventName}' after ${timeoutMs}ms`));
>     }, timeoutMs);
>
>     emitter.once(eventName, handleEvent);
>   });
> }
>
> // Verification tests
> const EventEmitter = require("events");
> const emitter = new EventEmitter();
>
> const promise = waitForConnection(emitter, "ready", 500);
> emitter.emit("ready", { dbHost: "localhost" });
>
> promise.then(res => {
>   console.assert(res.dbHost === "localhost", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **events.once() Promise Wrapper**: Attaches a one-time listener that automatically unbinds after firing once.
> 2. **Timeout Cleanup**: Always clear fallback timeouts when event fires to prevent timer memory leaks.
> 3. **Asynchronous Event Synchronization**: Translates event-driven architecture into async/await Promise control flow.
## 6. Related Terms
- [Event Emitter](../level_05/event_emitter.md) — The conceptual implementation of this architecture.
- [Streams (General Concept)](../level_06/streams.md) — Data-flow streams that inherit directly from `EventEmitter`.
- [The http Module](http_module.md) — HTTP server events.

---

## 7. Key Takeaways
- The built-in `events` module provides the `EventEmitter` class.
- Objects extending `EventEmitter` can publish events (`.emit`) and listen to events (`.on`).
- `.once()` registers a listener that triggers once and then automatically deregisters.
- Excess listeners trigger a warning to help detect memory leaks.
- Always clean up event listeners using `.off()` when they are no longer needed to prevent memory issues.
