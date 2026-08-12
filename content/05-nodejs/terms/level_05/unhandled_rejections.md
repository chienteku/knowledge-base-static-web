# Unhandled Promise Rejections

> **Level 5 — Asynchronous Patterns**
> A fatal error state that occurs when a Promise fails (rejects), but the developer forgot to attach a `.catch()` block to handle the failure, causing the Node.js process to crash.

---

## 1. Prerequisites
- [Promises (in the context of networks)](../../../04-apis/terms/level_05/promises.md) — The asynchronous objects that are failing.
- [The process Object](../level_02/process_object.md) — How Node.js handles fatal crashes globally.

---

## 2. Term Category

**Error Handling / Architecture (Node.js)**: Unhandled Promise Rejections is a fundamental concept in this technology stack. **Level 5 — Asynchronous Patterns**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard synchronous JavaScript, if you try to read an undefined variable, the app throws an Error. If you don't wrap it in a `try/catch` block, the entire Node.js server crashes. This is a good thing! You want the server to die rather than running in a corrupted, broken state.
However, **Promises** are asynchronous. If a database query Promise fails 3 seconds in the future, it emits a "Rejection". If you don't have a `.catch()` block attached to it, that error used to just vanish into the void. The server would keep running, but the database connection was broken, leading to silent, impossible-to-debug failures.

### (2) The Node.js Strict Policy
To fix these silent failures, modern Node.js instituted a strict rule: **An Unhandled Promise Rejection is a fatal crash.**
If any Promise in your entire application rejects, and you forgot to catch it, Node.js will intentionally shut down the entire server (triggering a `process.exit(1)`).

### (3) The Global Safety Net
While you should always use `try/catch` or `.catch()` on your individual API routes, what if you miss one? You can set up a global safety net using the `process` object.
```javascript
process.on('unhandledRejection', (reason, promise) => {
  console.error("CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
  // Log the error to your monitoring system
  // Then safely shut down the server
  process.exit(1);
});
```
*Note: You should STILL exit the process. The safety net is just to log the error before the server dies, not to keep a broken server alive.*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `try/catch` in async Express routes

**The mistake:** A developer writes an async Express route but forgets the `try/catch` block.
```javascript
app.get('/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users'); // Fails!
  res.json(users);
});
```

**Why it's wrong:** If the database query fails, the `await` statement triggers a Promise Rejection. Because there is no `try/catch`, it becomes an Unhandled Rejection. The entire Node.js server crashes, and the other 5,000 users currently browsing your website are instantly disconnected.
**Golden Rule:** EVERY SINGLE `async` API route must be wrapped in a `try/catch` block (or passed to an error-handling middleware).

---



### Mistake 2: Ignoring `unhandledRejection` Events in Production (Process Degradation)

**The mistake:** Not attaching a global `process.on('unhandledRejection')` listener.

**Why it's wrong:** In modern Node.js (v15+), unhandled promise rejections terminate the Node.js process with exit code 1 by default (`--unhandled-rejections=throw`).

*Incorrect:*
```javascript
// Missing process.on('unhandledRejection') handler in production server
```

*Fix:*
```javascript
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log to error monitoring and perform graceful shutdown
});
```

### Mistake 3: Using `unhandledRejection` Handler as a Permanent Substitute for Proper Local Try/Catch Blocks

**The mistake:** Relying on global `unhandledRejection` listener to catch all application errors without local handling.

**Why it's wrong:** Global rejection handlers lack request context (e.g. `res` object), preventing web servers from returning HTTP 500 status codes to affected clients.

*Incorrect:*
```javascript
app.get('/data', async (req, res) => {
  const data = await fetchData(); // ❌ Relies on global handler; client request hangs!
});
```

*Fix:*
```javascript
app.get('/data', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.send(data);
  } catch (err) {
    next(err); // Proper Express error propagation
  }
});
```

## 5. Practice Exercises

### Exercise 1: Unhandled Promise Rejection Process Monitor

**Scenario:** An APM safety agent monitors process-level `unhandledRejection` events, tracking rejected Promises that lacked `.catch()` handlers.

**Requirements:**
1. Write setupUnhandledRejectionTracker(processMock).
2. Listen for `unhandledRejection`.
3. Track rejection error and target promise.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function setupUnhandledRejectionTracker(processMock) {
>   const proc = processMock || process;
>   const unhandledList = [];
>
>   proc.on("unhandledRejection", (reason, promise) => {
>     unhandledList.push({
>       reason: reason?.message || String(reason),
>       timestamp: Date.now()
>     });
>   });
>
>   return {
>     getUnhandledCount: () => unhandledList.length,
>     getUnhandledList: () => unhandledList
>   };
> }
>
> // Verification tests
> const handlers = {};
> const mockProc = { on: (e, fn) => { handlers[e] = fn; } };
>
> const tracker = setupUnhandledRejectionTracker(mockProc);
> handlers["unhandledRejection"](new Error("Unhandled DB Error"), {});
>
> console.assert(tracker.getUnhandledCount() === 1, "Test 1 Failed");
> console.assert(tracker.getUnhandledList()[0].reason === "Unhandled DB Error", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Unhandled Rejection Concept**: Occurs when a Promise rejects and no `.catch()` handler is attached within an event loop tick.
> 2. **Node.js Default Crash Behavior**: Since Node.js v15, unhandled rejections terminate the process with exit code 1 by default.
> 3. **Global Process Monitoring**: Process `unhandledRejection` listeners capture unhandled errors for logging before process exit.
> 
---

### Exercise 2: Safe Promise Execution Decorator

**Scenario:** Wraps async operations in a protective decorator that guarantees no unhandled rejection escapes.

**Requirements:**
1. Write safePromiseWrap(asyncFn).
2. Execute asyncFn.
3. Catch rejections and return `{ ok: false, error }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safePromiseWrap(asyncFn) {
>   return async function (...args) {
>     try {
>       const data = await asyncFn(...args);
>       return { ok: true, data };
>     } catch (error) {
>       return { ok: false, error: error?.message || String(error) };
>     }
>   };
> }
>
> // Verification tests
> const failingFn = async () => { throw new Error("Async failure"); };
> const safeFn = safePromiseWrap(failingFn);
>
> safeFn().then(res => {
>   console.assert(res.ok === false, "Test 1 Failed");
>   console.assert(res.error === "Async failure", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Result Pattern**: Encapsulates success/failure into a `{ ok, data, error }` object instead of throwing.
> 2. **Preventing Unhandled Rejections**: Guarantees returned Promise always resolves without rejection.
> 3. **Safer Error Handling**: Simplifies error handling in calling functions without requiring nested try/catch blocks.
> 
---

### Exercise 3: Unhandled Rejection Exit Behavior Simulator

**Scenario:** Simulates process exit behavior when an unhandled rejection occurs without a process listener.

**Requirements:**
1. Write handleUnhandledRejectionEvent(reason, isHandledByApp, processMock).
2. Log error.
3. Exit process if unhandled.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleUnhandledRejectionEvent(reason, isHandledByApp = false, processMock) {
>   const proc = processMock || process;
>
>   if (!isHandledByApp) {
>     proc.exit(1);
>     return { status: "CRASHED", exitCode: 1 };
>   }
>
>   return { status: "HANDLED_BY_APP", exitCode: 0 };
> }
>
> // Verification tests
> let exitCalled = false;
> const mockProc = { exit: (code) => { exitCalled = true; } };
>
> const r1 = handleUnhandledRejectionEvent(new Error("Fail"), false, mockProc);
> console.assert(r1.status === "CRASHED" && exitCalled === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Process Crash Prevention**: Attaching application listeners prevents default process termination.
> 2. **Exit Code 1**: Uncaught promise rejections trigger non-zero exit codes to signal crash to process managers (PM2/K8s).
> 3. **APM Alerting**: Integrate error trackers (Sentry, Datadog) inside unhandledRejection handlers.
## 6. Related Terms
- [Microtasks vs Macrotasks](microtasks_macrotasks.md) — Promise rejections happen in the VIP Microtask queue.
- [The process Object](../level_02/process_object.md) — The object that emits the `unhandledRejection` event.
- [async / await in Node](async_await.md) — Related concept: async / await in Node.
- [Async Error Handling (try/catch + .catch)](async_error_handling.md) — Related concept: Async Error Handling (try/catch + .catch).
- [HTTP Status Codes](../level_09/status_codes.md) — Related concept: HTTP Status Codes.
- [Event Emitter](event_emitter.md) — Related concept: Event Emitter.

---

## 7. Key Takeaways
- An **Unhandled Promise Rejection** occurs when an asynchronous task fails without a `.catch()` or `try/catch` block to handle it.
- In modern Node.js, this causes an intentional, fatal crash of your entire server.
- Every `async/await` database or network call MUST be wrapped in error handling.
- You can listen to the `process.on('unhandledRejection')` global event to log the error right before the server dies.
