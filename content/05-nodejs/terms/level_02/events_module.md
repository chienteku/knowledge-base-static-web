# The events Module

> **Level 2 — Core Modules & Globals**
> The `EventEmitter` class's home module (used in Level 5) surfaced as a core module.

---

## 1. Prerequisites
- [Global Objects (global, __dirname, __filename)](global_objects.md) — The global namespace containing built-in primitives.
---

## 2. Term Category
- **Core Module**

---

## 3. Environment Context
- **Node.js Core Architecture** (Provides the asynchronous event-driven interface template used across Node's modules).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Event Subscription Configuration

**Problem:** Complete the script to register a listener that triggers **only the first time** an `'error'` event is emitted, printing the error message to the console. Subsequent emissions should be ignored:

```javascript
const EventEmitter = require('events');
const emitter = new EventEmitter();

// Write the subscription logic here
emitter.once('error', (err) => {
  console.error("Caught Initial Error:", err.message);
});

// Emitting errors:
emitter.emit('error', new Error('Database connection failed')); // Logs message
emitter.emit('error', new Error('Timeout error'));            // Ignored
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Creating Custom EventEmitter Class

**Problem:** Create a `OrderProcessor` class extending `EventEmitter` that emits `'orderPlaced'` with order ID.

**Expected output:**
> [!check]- Answer
> ```text
> class OrderProcessor extends EventEmitter { placeOrder(id) { this.emit('orderPlaced', id); } }
> ```
> ```javascript
> class OrderProcessor extends EventEmitter {
>   placeOrder(id) {
>     this.emit('orderPlaced', id);
>   }
> }
> ```
>
> **Explanation:** Extending `EventEmitter` grants custom domain objects event publish/subscribe features.

---

### Exercise 3: Once vs On Listeners

**Problem:** Which method subscribes a listener that automatically removes itself after firing once? (`emitter.once()`).

**Expected output:**
> [!check]- Answer
> ```text
> emitter.once()
> ```
> ```text
> emitter.once()
> ```
>
> **Explanation:** `once()` executes the event listener function at most one time, automatically unsubscribing.

## 7. Related Terms
- [Event Emitter](../level_05/event_emitter.md) — The conceptual implementation of this architecture.
- [Streams (General Concept)](../level_06/streams.md) — Data-flow streams that inherit directly from `EventEmitter`.
- [The http Module](http_module.md) — HTTP server events.
---

## 8. Key Takeaways
- The built-in `events` module provides the `EventEmitter` class.
- Objects extending `EventEmitter` can publish events (`.emit`) and listen to events (`.on`).
- `.once()` registers a listener that triggers once and then automatically deregisters.
- Excess listeners trigger a warning to help detect memory leaks.
- Always clean up event listeners using `.off()` when they are no longer needed to prevent memory issues.
