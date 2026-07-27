# Unhandled Promise Rejections

> **Level 5 — Asynchronous Patterns**
> A fatal error state that occurs when a Promise fails (rejects), but the developer forgot to attach a `.catch()` block to handle the failure, causing the Node.js process to crash.

---

## 1. Prerequisites
- [Promises](../../../04-apis/terms/level_05/promises.md) — The asynchronous objects that are failing.
- [The `process` Object](../level_02/process_object.md) — How Node.js handles fatal crashes globally.

---

## 2. Term Category
- **Error Handling / Architecture**

---

## 3. Environment Context
- **Node.js (Server Infrastructure)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Catching the Void

**Problem:** How do you fix the following code so that it doesn't crash the Node.js server if the fake API is down?

```javascript
function fetchWeather() {
  return Promise.reject("API is offline");
}

// Calling the function
fetchWeather(); 
```

**Expected output:**
```javascript
// Add a .catch() block!
fetchWeather().catch((err) => {
  console.log("Failed to get weather, but the server survives!", err);
});
```

> [!check]- Answer
> - How do you handle errors on a standard Promise chain?

---



### Exercise 2: Registering Unhandled Rejection Listener

**Problem:** Write global event listener on `process` logging unhandled rejection reason and promise.

**Expected output:**
```text
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled:', reason); });
```

> [!check]- Answer
> ```javascript
> process.on('unhandledRejection', (reason, promise) => {
>   console.error('Unhandled Rejection:', reason);
> });
> ```
>
> **Explanation:** `process.on('unhandledRejection')` catches promises rejected without `.catch()` handlers.

### Exercise 3: Node.js Unhandled Rejection CLI Mode Flag

**Problem:** Which CLI flag configures Node.js to warn on unhandled rejections without crashing the process?

**Expected output:**
```text
node --unhandled-rejections=warn app.js
```

> [!check]- Answer
> ```bash
> node --unhandled-rejections=warn app.js
> ```
>
> **Explanation:** `--unhandled-rejections` mode flag sets rejection behavior (`strict`, `throw`, `warn`, `none`).

## 7. Related Terms
- [Microtasks vs Macrotasks](../level_05/microtasks_macrotasks.md) — Promise rejections happen in the VIP Microtask queue.
- [The `process` Object](../level_02/process_object.md) — The object that emits the `unhandledRejection` event.

---

## 8. Key Takeaways
- An **Unhandled Promise Rejection** occurs when an asynchronous task fails without a `.catch()` or `try/catch` block to handle it.
- In modern Node.js, this causes an intentional, fatal crash of your entire server.
- Every `async/await` database or network call MUST be wrapped in error handling.
- You can listen to the `process.on('unhandledRejection')` global event to log the error right before the server dies.
