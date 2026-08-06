# Async Error Handling (try/catch + .catch)

> **Level 5 — Asynchronous Patterns**
> How to actually catch errors in async code so one rejection doesn't crash the process.

---

## 1. Prerequisites
- [async / await in Node](async_await.md) — The control flow syntax utilizing Promises.
- [Unhandled Promise Rejections](unhandled_rejections.md) — The consequence of failing to handle async errors.

---

## 2. Term Category
- **Async Pattern**

---

## 3. Environment Context
- **Node.js / V8 Engine** (Governed by the Promise rejection handling behaviors in the runtime thread).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In synchronous code, catching errors is simple: you wrap the code in a `try/catch` block. If an error is thrown, the stack pauses, and control jumps directly to the `catch` block.

In asynchronous code, handling errors is more difficult due to **Call Stack Disconnection**:
- When an asynchronous task (like a database query) finally completes and fires its callback, the original synchronous execution thread that initiated the query **has already exited and its Call Stack is empty**.
- Wrapping a standard async function call in a synchronous `try/catch` block **will not capture the error** because the code inside the `try` block completes successfully (by returning a pending Promise), and the `try/catch` context exits *before* the asynchronous error actually occurs.
- If an asynchronous error goes unhandled, it triggers an **Unhandled Rejection**, which will immediately terminate and crash your Node.js server process in modern versions of Node.

To build stable servers, developers must use asynchronous error handling strategies.

---

### (2) Asynchronous Error Handling Patterns

#### 1. The `try/catch` + `await` Pattern
When you use `await` inside an `async` function, the V8 engine suspends execution of the function context. This allows standard `try/catch` syntax to capture asynchronous rejections as if they were synchronous errors:

```javascript
async function fetchConfig() {
  try {
    // V8 traps a rejection from readFile and routes it to catch
    const data = await fs.promises.readFile('./config.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Caught asynchronous file read error:", error.message);
    return {}; // Return safe fallback
  }
}
```

#### 2. The `.catch()` Promise Chain Pattern
If you write standard Promise chains without `async/await`, attach a `.catch()` block at the end of the chain. Any error thrown in any `.then()` block will bubble down to the final `.catch()` handler:

```javascript
fs.promises.readFile('./config.json', 'utf8')
  .then(data => JSON.parse(data))
  .catch(error => {
    console.error("Caught error in chain:", error.message);
  });
```

---

### (3) Reality Metaphor
Imagine sending a shipping package.
- **Synchronous Try/Catch** is like handing a package to a store clerk, standing there while they scan it, and if it fails validation, taking it back immediately.
- **Asynchronous (Broken Try/Catch)** is dropping the package into a collection mailbox and going home, assuming that if the package fails to ship 3 days later, the mailbox will walk to your house to complain. It will not; the mail is lost (**unhandled rejection**).
- **Asynchronous Catch / Await** is placing a **return address label** on the package (**the catch block**). If the package delivery fails 3 days later at the sorting facility, the post office reads the label and ships it back to your doorstep, where you handle it.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Wrapping a callback-based async call in a `try/catch` block

**The mistake:** Wrapping an old callback-style function in a `try/catch` block and expecting it to catch errors passed to the callback:

```javascript
// WRONG: This will NOT catch file read errors!
try {
  fs.readFile('./missing.json', 'utf8', (err, data) => {
    if (err) throw err; // Throws into empty call stack! SERVER CRASHES!
  });
} catch (error) {
  console.log("This block never runs!");
}
```

**Why it's wrong:** `fs.readFile` initiates the request and exits immediately. The `try/catch` block exits. When the file read fails, V8 pushes the callback onto the Call Stack. The callback throws the error, but since the `try/catch` wrapper is gone, the error bubbles to the global scope and crashes the process.

*Fix:* Callback functions must handle errors manually using the error-first callback parameter:
```javascript
fs.readFile('./missing.json', 'utf8', (err, data) => {
  if (err) {
    console.error("Handled error inside callback:", err.message);
    return;
  }
  // Process data
});
```

---



### Mistake 2: Swallowing Async Errors Silently with Empty Catch Blocks

**The mistake:** Writing `try { await db.save(); } catch (err) {}` with empty catch handler.

**Why it's wrong:** Swallowing errors silently hides database failures, leaving applications in corrupt states without error logging or client notifications.

*Incorrect:*
```javascript
try {
  await db.save();
} catch (err) {} // ❌ Silent failure!
```

*Fix:*
```javascript
try {
  await db.save();
} catch (err) {
  logger.error('Failed to save DB:', err);
  throw err; // Re-throw or pass to error handler
}
```

### Mistake 3: Throwing Errors Inside `forEach` Array Callbacks (Async Unhandled Catch Trap)

**The mistake:** Using `items.forEach(async item => await process(item))` expecting top-level `try/catch` to catch errors.

**Why it's wrong:** `Array.prototype.forEach` ignores returned promises! Errors thrown inside async `forEach` callbacks run unhandled outside the outer try/catch scope. Use `for...of` or `Promise.all(items.map(...))`.

*Incorrect:*
```javascript
try {
  items.forEach(async (item) => {
    await processItem(item); // ❌ Unhandled promise rejection!
  });
} catch (err) {}
```

*Fix:*
```javascript
try {
  for (const item of items) {
    await processItem(item); // Properly caught in try/catch
  }
} catch (err) {}
```

## 6. Practice Exercises

### Exercise 1: Bug Hunting

**Problem:** The Express endpoint below crashes the server if the database query fails. Locate the bug and fix it:

```javascript
// Before (Crashes on DB query failures):
app.get('/user/:id', async (req, res) => {
  const user = await db.fetchUser(req.params.id);
  res.json(user);
});

// After (Fixed):
app.get('/user/:id', async (req, res, next) => {
  try {
    const user = await db.fetchUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err); // Route error to Express error-handling middleware
  }
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Handling Promise.allSettled Results

**Problem:** Use `Promise.allSettled([req1, req2])` to log fulfilled values and rejected error reasons.

**Expected output:**
> [!check]- Answer
> ```text
> const results = await Promise.allSettled([req1, req2]); results.forEach(r => r.status === 'fulfilled' ? console.log(r.value) : console.error(r.reason));
> ```
> ```javascript
> const results = await Promise.allSettled([req1, req2]);
> results.forEach(r => {
>   if (r.status === 'fulfilled') console.log('Success:', r.value);
>   else console.error('Failed:', r.reason);
> });
> ```
>
> **Explanation:** `Promise.allSettled` waits for all promises to settle without short-circuiting on single rejections.
> 
---

### Exercise 3: Express Async Error Propagation

**Problem:** In Express 4, how do you forward an async error caught in a route handler to central error middleware?

**Expected output:**
> [!check]- Answer
> ```text
> Pass the caught error to next(err).
> ```
> ```javascript
> catch (err) {
>   next(err);
> }
> ```
>
> **Explanation:** Calling `next(err)` hands error handling over to Express error middleware.
> 
## 7. Related Terms
- [Unhandled Promise Rejections](unhandled_rejections.md) — The process crashes caused by missing catch blocks.
- [Callbacks & Callback Hell](callbacks.md) — The error-first callback style of handling errors.
- [async / await in Node](async_await.md) — Related concept: async / await in Node.
- [Error Handling Middleware](../level_09/error_handling_middleware.md) — Related concept: Error Handling Middleware.

---

## 8. Key Takeaways
- Asynchronous errors execute on a separate call stack frame from their initiation code.
- Synchronous `try/catch` wrappers cannot catch errors from asynchronous callback functions.
- Use `try/catch` combined with `await` to safely handle errors in async functions.
- Attach a `.catch()` block to the end of Promise chains to intercept rejections.
- Classic callback APIs must handle errors using error-first parameters, not `throw`.
- Unhandled rejections crash the Node.js server; always implement a fallback catch.
