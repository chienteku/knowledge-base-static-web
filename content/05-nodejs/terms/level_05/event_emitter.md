# Event Emitter

> **Level 5 — Asynchronous Patterns**
> The core architectural pattern inside Node.js that allows objects to "emit" (broadcast) named events, and other parts of your code to "listen" and react to those events asynchronously.

---

## 1. Prerequisites
- [The Event Loop](../level_01/event_loop.md) — What manages the asynchronous nature of events.
- [Callbacks](../level_05/callbacks.md) — What executes when an event is heard.

---

## 2. Term Category
- **Node.js Core API / Design Pattern (Observer Pattern)**

---

## 3. Environment Context
- **Node.js Only** (Though browsers have the `EventTarget` API for DOM events, `EventEmitter` is the pure JavaScript backend equivalent).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Custom Emitters

**Problem:** You want to build a `ChatRoom` class. Whenever someone sends a message, it should emit a `message` event. How do you make your custom class an Event Emitter?

**Expected output:**
```javascript
const EventEmitter = require('events');

// By extending the class, ChatRoom gains the .on() and .emit() superpowers!
class ChatRoom extends EventEmitter {
  sendMessage(user, text) {
    this.emit('message', `${user} said: ${text}`);
  }
}

const room = new ChatRoom();
room.on('message', (msg) => console.log(msg));
room.sendMessage("Bob", "Hello!");
```

> [!check]- Answer
> - How do you give a class the superpowers of a parent class in JavaScript?

---



### Exercise 2: Emitting and Handling Custom Events

**Problem:** Create `emitter`, listen for `'userLoggedIn'` event logging `'Welcome ' + name`, and emit event with `'Alice'`. 

**Expected output:**
```text
const emitter = new EventEmitter(); emitter.on('userLoggedIn', name => console.log('Welcome ' + name)); emitter.emit('userLoggedIn', 'Alice');
```

> [!check]- Answer
> ```javascript
> const { EventEmitter } = require('events');
> const emitter = new EventEmitter();
> emitter.on('userLoggedIn', (name) => console.log(`Welcome ${name}`));
> emitter.emit('userLoggedIn', 'Alice');
> ```
>
> **Explanation:** `on(event, listener)` registers subscriber callbacks triggered by `emit(event, data)`.

### Exercise 3: Increasing Max Listeners Limit

**Problem:** Write code to increase default max listeners limit on `emitter` to 20.

**Expected output:**
```text
emitter.setMaxListeners(20);
```

> [!check]- Answer
> ```javascript
> emitter.setMaxListeners(20);
> ```
>
> **Explanation:** `setMaxListeners()` adjusts the threshold for `MaxListenersExceededWarning` alerts.

## 7. Related Terms
- [Streams](../level_06/streams.md) — The most famous use-case of Event Emitters in Node.js.
- [The `http` Module](../level_02/http_module.md) — Servers are Event Emitters under the hood.

---

## 8. Key Takeaways
- The **`EventEmitter`** is the Node.js implementation of the Observer design pattern.
- It replaces browser DOM events (`addEventListener`) with backend data events.
- You use **`.on('eventName')`** to listen, and **`.emit('eventName')`** to broadcast.
- Nearly all core Node.js objects (Servers, Streams, Sockets) are built on top of the `EventEmitter` class.
