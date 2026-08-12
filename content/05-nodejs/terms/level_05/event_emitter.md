# Event Emitter

> **Level 5 — Asynchronous Patterns**
> The core architectural pattern inside Node.js that allows objects to "emit" (broadcast) named events, and other parts of your code to "listen" and react to those events asynchronously.

---

## 1. Prerequisites
- [The Event Loop & Libuv](../level_01/event_loop.md) — What manages the asynchronous nature of events.
- [Callbacks & Callback Hell](callbacks.md) — What executes when an event is heard.

---

## 2. Term Category

**Node.js Core API / Design Pattern (Observer Pattern) (Node.js Only .)**: Event Emitter is a fundamental concept in this technology stack. **Level 5 — Asynchronous Patterns**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In the browser, you are used to writing `button.addEventListener('click', callback)`. When the user clicks the button, the event fires, and your callback runs.
But Node.js doesn't have buttons! However, it still needs a way to handle asynchronous, recurring actions. For example, if you build a web server, you want to trigger a function *every time* a new HTTP request arrives.
Node.js built the **`events`** core module to handle this. It provides the `EventEmitter` class. It is the exact same concept as browser events, but purely for backend data.

### (2) How it Works
You create an emitter. You use `.on()` to listen for a specific word, and you use `.emit()` to shout that word into the void.
```javascript
const EventEmitter = require('events');
const myEmitter = new EventEmitter();

// 1. Setup a Listener (The "Radio Receiver")
myEmitter.on('userLoggedIn', (username) => {
  console.log(`Welcome to the server, ${username}!`);
});

// 2. Emit an Event (The "Radio Broadcast")
myEmitter.emit('userLoggedIn', 'Bob');
myEmitter.emit('userLoggedIn', 'Alice');
```

### (3) The Backbone of Node.js
You might think you've never used `EventEmitter`, but almost **every single core module in Node.js inherits from it**. 
- The `http.createServer()` object is actually an EventEmitter. When a network packet hits the computer, it runs `server.emit('request')`.
- Readable Streams are EventEmitters. When data arrives from the hard drive, they run `stream.emit('data')`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Emitting an event before the listener is attached

**The mistake:** A developer writes code that emits a "databaseReady" event, and on the next line, they attach the `.on('databaseReady')` listener.

**Why it's wrong:** Unlike Promises (which remember their value forever), Event Emitters are like actual radios. If you shout into the microphone *before* the listener turns on their radio, the message vanishes into the void. It is instantly lost forever.
**Golden Rule:** Always attach your `.on()` listeners *before* the code triggers `.emit()`.

---



### Mistake 2: Creating Memory Leaks by Failing to Unsubscribe Event Listeners

**The mistake:** Adding `emitter.on('data', handler)` inside a recurring function without calling `off()` or `removeListener()`.

**Why it's wrong:** Each call attaches a new listener closure in memory. In long-running servers, un-removed listeners consume memory and trigger `MaxListenersExceededWarning`.

*Incorrect:*
```javascript
function subscribe() {
  emitter.on('update', handleUpdate); // ❌ Memory leak on repeated calls!
}
```

*Fix:*
```javascript
function subscribe() {
  emitter.on('update', handleUpdate);
  return () => emitter.off('update', handleUpdate); // Cleanup function
}
```

### Mistake 3: Synchronous Event Listener Blocking in EventEmitter Handlers

**The mistake:** Executing heavy synchronous computation directly inside an `emitter.on('event', fn)` listener.

**Why it's wrong:** By default, `EventEmitter` invokes all registered listener functions SYNCHRONOUSLY in sequence when `emit()` is called. A slow listener blocks `emit()` completion.

*Incorrect:*
```javascript
emitter.on('data', (data) => {
  heavySyncProcessing(data); // ❌ Blocks emit() caller thread!
});
```

*Fix:*
```javascript
emitter.on('data', (data) => {
  setImmediate(() => heavySyncProcessing(data)); // Offload to next tick
});
```

## 5. Practice Exercises

### Exercise 1: Custom Reactive Bus with Event Filtering

**Scenario:** An Event Bus subclass filters emitted events based on severity levels before notifying subscribed handlers.

**Requirements:**
1. Write createFilteredEventBus(EventEmitterClass).
2. Filter events by minSeverity.
3. Emit only matching events.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createFilteredEventBus(EventEmitterClass) {
>   const EventEmitter = EventEmitterClass || require("events");
>   class FilteredBus extends EventEmitter {
>     constructor(minSeverity = "INFO") {
>       super();
>       this.minSeverity = minSeverity;
>       this.levels = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
>     }
>
>     emitLog(level, message) {
>       const targetWeight = this.levels[level.toUpperCase()] || 0;
>       const minWeight = this.levels[this.minSeverity.toUpperCase()] || 0;
>
>       if (targetWeight >= minWeight) {
>         return this.emit("log", { level, message, timestamp: Date.now() });
>       }
>       return false;
>     }
>   }
>
>   return new FilteredBus("WARN");
> }
>
> // Verification tests
> const EventEmitter = require("events");
> const bus = createFilteredEventBus(EventEmitter);
> const logs = [];
>
> bus.on("log", (l) => logs.push(l));
>
> bus.emitLog("INFO", "Ignore this");
> bus.emitLog("ERROR", "Database crashed");
>
> console.assert(logs.length === 1, "Test 1 Failed");
> console.assert(logs[0].message === "Database crashed", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **EventEmitter Subclassing**: Extending `EventEmitter` creates custom domain-specific event managers.
> 2. **Event Filtering Middleware**: Filtering events before invoking listeners reduces unnecessary CPU overhead.
> 3. **Decoupling Event Producers**: Allows publishing logs without consumers knowing subscriber details.
> 
---

### Exercise 2: Async Event Listener Error Handling Guard

**Scenario:** An EventEmitter wrapper catches unhandled errors inside asynchronous event listeners to prevent unhandled rejections.

**Requirements:**
1. Write attachSafeEventListener(emitter, eventName, asyncListenerFn, loggerMock).
2. Invoke async listener.
3. Catch rejections and log error.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function attachSafeEventListener(emitter, eventName, asyncListenerFn, loggerMock) {
>   emitter.on(eventName, async (...args) => {
>     try {
>       await asyncListenerFn(...args);
>     } catch (err) {
>       if (loggerMock && typeof loggerMock.error === "function") {
>         loggerMock.error(`Error in event listener for '${eventName}':`, err.message);
>       }
>     }
>   });
> }
>
> // Verification tests
> const EventEmitter = require("events");
> const emitter = new EventEmitter();
> let loggedErr = null;
>
> const flakyListener = async () => { throw new Error("Async listener failed"); };
> attachSafeEventListener(emitter, "user:login", flakyListener, { error: (msg, err) => { loggedErr = err; } });
>
> emitter.emit("user:login");
>
> setImmediate(() => {
>   console.assert(loggedErr === "Async listener failed", "Test 1 Failed: Listener rejection caught safely");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Async Listener Exception Trap**: Uncaught rejections in async EventEmitter listeners bypass normal try/catch unless explicitly caught.
> 2. **EventEmitter Error Event**: If an `error` event is emitted without a listener, Node.js prints a stack trace and exits the process.
> 3. **Safe Listener Wrapper Pattern**: Wrapping async listeners in try/catch keeps background event processing resilient.
> 
---

### Exercise 3: EventEmitter Subscription Lifecycle Manager

**Scenario:** A subscription manager tracks active EventEmitter listeners and provides a `dispose()` handle to unsubscribe all listeners on cleanup.

**Requirements:**
1. Write createSubscriptionManager(emitter).
2. Track added listeners.
3. Provide `dispose()` method to remove all managed listeners.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createSubscriptionManager(emitter) {
>   const subscriptions = [];
>
>   return {
>     subscribe(eventName, listenerFn) {
>       emitter.on(eventName, listenerFn);
>       subscriptions.push({ eventName, listenerFn });
>     },
>     dispose() {
>       subscriptions.forEach(({ eventName, listenerFn }) => {
>         emitter.removeListener(eventName, listenerFn);
>       });
>       subscriptions.length = 0;
>     },
>     getActiveCount: () => subscriptions.length
>   };
> }
>
> // Verification tests
> const EventEmitter = require("events");
> const emitter = new EventEmitter();
> const manager = createSubscriptionManager(emitter);
>
> const fn1 = () => {};
> const fn2 = () => {};
>
> manager.subscribe("data", fn1);
> manager.subscribe("error", fn2);
>
> console.assert(emitter.listenerCount("data") === 1, "Test 1 Failed");
> manager.dispose();
> console.assert(emitter.listenerCount("data") === 0, "Test 2 Failed: Unsubscribed all");
> ```
>
> #### Technical Explanation
>
> 1. **Subscription Memory Leaks**: Failing to unbind event listeners when components unmount leaves references in memory.
> 2. **Disposable Pattern**: Exposing a `dispose()` method allows clean teardown of event-driven resources.
> 3. **emitter.removeListener**: Removes specific listener functions from an EventEmitter instance.
## 6. Related Terms
- [Streams (General Concept)](../level_06/streams.md) — The most famous use-case of Event Emitters in Node.js.
- [The http Module](../level_02/http_module.md) — Servers are Event Emitters under the hood.
- [The events Module](../level_02/events_module.md) — Related concept: The events Module.
- [Callbacks & Callback Hell](callbacks.md) — Callbacks vs events.
- [Unhandled Promise Rejections](unhandled_rejections.md) — Error events.

---

## 7. Key Takeaways
- The **`EventEmitter`** is the Node.js implementation of the Observer design pattern.
- It replaces browser DOM events (`addEventListener`) with backend data events.
- You use **`.on('eventName')`** to listen, and **`.emit('eventName')`** to broadcast.
- Nearly all core Node.js objects (Servers, Streams, Sockets) are built on top of the `EventEmitter` class.
