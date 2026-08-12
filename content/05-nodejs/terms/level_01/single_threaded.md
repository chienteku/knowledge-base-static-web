# Single-Threaded Architecture

> **Level 1 — Introduction & Architecture**
> The architectural design choice where Node.js uses only *one* main thread (one CPU core) to execute all of your JavaScript code, rather than spinning up a new thread for every user.

---

## 1. Prerequisites
- [V8 JavaScript Engine](v8_engine.md) — V8 is inherently single-threaded.

---

## 2. Term Category

**Computer Science Concept / Architecture (Node.js Core Architecture)**: Single-Threaded Architecture is a fundamental concept in this technology stack. **Level 1 — Introduction & Architecture**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional backend languages (like Java or PHP), servers use **Multi-Threaded Architecture**. When 1,000 users visit a Java website, the server creates 1,000 separate "Threads" (mini-processes) in the CPU. Each thread requires about 2MB of RAM. 1,000 users = 2 Gigabytes of RAM wasted just on managing threads! If 10,000 users visit, the server crashes from memory exhaustion.
Ryan Dahl designed Node.js to be **Single-Threaded**. Whether 1 user visits or 10,000 users visit, Node.js only uses **ONE** main thread to run your JavaScript. Because it doesn't create new threads, it uses almost zero RAM to handle concurrent connections, making it massively scalable.

### (2) Reality Metaphor
**Multi-Threaded (Java):** A restaurant with 10 waiters. A customer walks in, Waiter #1 takes their order, goes to the kitchen, and *stands there doing nothing for 15 minutes* until the food is ready. If 11 customers walk in, the restaurant crashes because all the waiters are busy waiting.
**Single-Threaded (Node.js):** A restaurant with **One Waiter** on roller skates. The waiter takes an order, hands it to the kitchen, and *immediately skates to the next table* to take another order. The single waiter never stops moving and never waits. One waiter can serve 1,000 tables!

### (3) The Catch: CPU-Intensive Tasks
Because there is only one waiter, what happens if a customer asks the waiter to do complex math for 5 minutes instead of just writing down an order? 
The waiter stops. The other 999 customers get ignored for 5 minutes. The restaurant freezes. 
This is why Node.js is terrible at heavy CPU tasks (like video encoding or complex AI math).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Blocking the Main Thread

**The mistake:** A developer builds an API endpoint that loops 10 billion times to calculate prime numbers.

**Why it's wrong:** Because Node.js is Single-Threaded, while your code is busy looping 10 billion times, *no other user can use the website*. The entire server is frozen. Every single HTTP request from other users will time out. 
**Golden Rule:** Node.js is for I/O (Input/Output: reading databases, sending network requests). It is NOT for heavy CPU math! Never block the main thread.

---



### Mistake 2: Assuming 'Single-Threaded' Means Node.js Cannot Use Multiple CPU Cores

**The mistake:** Believing Node.js can never perform parallel background processing.

**Why it's wrong:** Application JavaScript code runs on a single main thread, but Node.js uses C++ Worker Threads (libuv) and Cluster/Worker Thread modules for multi-core parallelism.

*Incorrect:*
```javascript
// Avoiding Node.js because project requires background worker threads
```

*Fix:*
```javascript
Use Worker Threads (worker_threads module) or Cluster module to utilize all CPU cores
```

### Mistake 3: Uncaught Exceptions Crashing the Entire Node.js Server Process

**The mistake:** Failing to catch errors in a single request handler, causing the single-threaded process to exit.

**Why it's wrong:** Because all users share a single Node.js process, an uncaught exception in one request handler crashes the process for ALL users.

*Incorrect:*
```javascript
app.get('/crash', (req, res) => {
  throw new Error('Boom!'); // ❌ Crashes entire server for all users!
});
```

*Fix:*
```javascript
app.get('/crash', (req, res, next) => {
  try {
    throw new Error('Boom!');
  } catch (err) {
    next(err); // Handle gracefully via Express error middleware
  }
});
```

## 5. Practice Exercises

### Exercise 1: Async Mutex for Shared In-Memory State

**Scenario:** In a single-threaded Node.js server, asynchronous `await` points allow concurrent request handlers to interleave execution. An Async Mutex lock prevents race conditions on shared in-memory data structures.

**Requirements:**
1. Write createAsyncMutex().
2. Implement acquire().
3. Release lock after critical section finishes.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createAsyncMutex() {
>   let isLocked = false;
>   const waitingQueue = [];
>
>   return {
>     async acquire() {
>       if (!isLocked) {
>         isLocked = true;
>         return () => this.release();
>       }
>
>       return new Promise((resolve) => {
>         waitingQueue.push(resolve);
>       }).then(() => () => this.release());
>     },
>     release() {
>       if (waitingQueue.length > 0) {
>         const nextResolve = waitingQueue.shift();
>         nextResolve();
>       } else {
>         isLocked = false;
>       }
>     }
>   };
> }
>
> // Verification tests
> const mutex = createAsyncMutex();
> let counter = 0;
>
> async function incrementSafely() {
>   const release = await mutex.acquire();
>   try {
>     const temp = counter;
>     await new Promise(r => setTimeout(r, 5)); // Interleaving point
>     counter = temp + 1;
>   } finally {
>     release();
>   }
> }
>
> Promise.all([incrementSafely(), incrementSafely(), incrementSafely()]).then(() => {
>   console.assert(counter === 3, "Test 1 Failed: Counter must be 3 after 3 mutex-protected increments");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Single-Threaded Misconception**: While Node.js executes JavaScript on a single thread, `await` points yield execution, introducing async race conditions.
> 2. **Asynchronous Race Conditions**: Shared in-memory variables can be modified by inter-leaved async requests during await execution.
> 3. **Async Mutex Locks**: Enforces serialized execution across async critical sections.
> 
---

### Exercise 2: State Isolation Guard Across Concurrent Requests

**Scenario:** A security validator prevents global variable state leakage between concurrent user HTTP requests on the single Node.js thread.

**Requirements:**
1. Write handleUserRequest(reqContext, handlerFn).
2. Isolate request context without mutating global state.
3. Return response.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createIsolatedRequestHandler() {
>   return async function handleUserRequest(userId, requestPayload, handlerFn) {
>     // Create local request context on Call Stack (isolated per invocation!)
>     const localContext = {
>       userId,
>       requestId: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
>       timestamp: Date.now()
>     };
>
>     return await handlerFn(localContext, requestPayload);
>   };
> }
>
> // Verification tests
> const requestHandler = createIsolatedRequestHandler();
>
> const req1 = requestHandler("u1", { action: "read" }, async (ctx, payload) => {
>   await new Promise(r => setTimeout(r, 10));
>   return ctx.userId;
> });
>
> const req2 = requestHandler("u2", { action: "write" }, async (ctx, payload) => {
>   return ctx.userId;
> });
>
> Promise.all([req1, req2]).then(([id1, id2]) => {
>   console.assert(id1 === "u1" && id2 === "u2", "Test 1 Failed: Context leakage prevented");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Global Variable Contamination**: Storing request-specific state in global variables leaks user data across concurrent HTTP requests.
> 2. **Call Stack Context Isolation**: Local variables declared inside function scopes are naturally isolated per request execution context.
> 3. **AsyncLocalStorage**: Node.js `AsyncLocalStorage` API provides request-scoped context across asynchronous continuation chains.
> 
---

### Exercise 3: Thread-Safety Verification for Shared Memory

**Scenario:** An API validator verifies that shared `SharedArrayBuffer` memory mutated across Worker Threads uses atomic operations (`Atomics.add`).

**Requirements:**
1. Write atomicIncrement(sharedInt32Array, index, value).
2. Use Atomics.add.
3. Return new value.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function atomicIncrement(sharedInt32Array, index = 0, value = 1) {
>   if (!(sharedInt32Array instanceof Int32Array)) {
>     throw new TypeError("Expected Int32Array");
>   }
>
>   // Atomics.add is atomic and thread-safe across multi-threaded Worker Threads
>   return Atomics.add(sharedInt32Array, index, value);
> }
>
> // Verification tests
> const sab = new SharedArrayBuffer(4);
> const i32 = new Int32Array(sab);
>
> const oldVal = atomicIncrement(i32, 0, 5);
> console.assert(oldVal === 0, "Test 1 Failed: Old value 0 returned");
> console.assert(i32[0] === 5, "Test 2 Failed: Shared memory updated to 5");
> ```
>
> #### Technical Explanation
>
> 1. **Single Main Thread Execution**: Main thread JavaScript executes sequentially without multi-threading data races on standard objects.
> 2. **SharedArrayBuffer & Worker Threads**: When using Worker Threads, SharedArrayBuffer shares raw memory across threads.
> 3. **Atomics API**: Atomics methods (add, sub, compareExchange) provide thread-safe atomic operations on SharedArrayBuffer.
## 6. Related Terms
- [Non-Blocking I/O](non_blocking_io.md) — How the single thread manages to avoid waiting for the kitchen.
- [The Event Loop & Libuv](event_loop.md) — The mechanism that tells the single thread when the kitchen is done cooking.
- [Blocking the Event Loop](blocking_event_loop.md) — Related concept: Blocking the Event Loop.
- [CPU-bound vs I/O-bound](cpu_vs_io.md) — Related concept: CPU-bound vs I/O-bound.
- [The Thread Pool (libuv)](thread_pool.md) — Related concept: The Thread Pool (libuv).

---

## 7. Key Takeaways
- **Single-Threaded** means Node.js uses exactly one CPU core to run your JavaScript.
- It is highly memory efficient because it doesn't spin up thousands of threads for users.
- It is perfect for handling high-concurrency, data-heavy applications (Chat apps, REST APIs).
- It is terrible for CPU-heavy applications (Image/Video processing, Machine Learning).
- **Never block the main thread!**
