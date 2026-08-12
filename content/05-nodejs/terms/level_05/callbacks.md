# Callbacks & Callback Hell

> **Level 5 — Asynchronous Patterns**
> A function passed as an argument to another function, intended to be executed later once an asynchronous task completes. When chained deeply, it creates unreadable "Callback Hell."

---

## 1. Prerequisites
- [Non-Blocking I/O](../level_01/non_blocking_io.md) — Callbacks are the original mechanism Node.js used to handle Non-Blocking I/O.
- [The Event Loop & Libuv](../level_01/event_loop.md) — The loop pushes callbacks back onto the main thread.

---

## 2. Term Category

**JavaScript / Node.js Design Pattern (Universal .)**: Callbacks & Callback Hell is a fundamental concept in this technology stack. **Level 5 — Asynchronous Patterns**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Because Node.js does not wait for a file to read (Non-Blocking), how does your code know when the file is actually ready?
You provide a **Callback Function**. You say to Node.js: *"Go read this file in the background. I am moving on to the next line of code. When you finish reading it, run this specific function I'm giving you."*

### (2) The "Error-First" Callback Pattern
In Node.js, asynchronous operations can fail (e.g., the file doesn't exist). By standard convention, the very first argument of a Node.js callback is *always* the `error` object. If it succeeds, `error` is null, and the second argument contains the `data`.
```javascript
const fs = require('fs');

fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) {
    console.error("Failed to read file:", err);
    return; // Stop execution
  }
  console.log("File content:", data);
});
```

### (3) Callback Hell (The Pyramid of Doom)
Callbacks work great for one task. But what if you need to:
1. Read a file to get a user ID.
2. Query the database for that user.
3. Update the user's profile.
4. Send an email to the user.
Because each task is asynchronous, you have to nest the callbacks inside of each other. The code drifts further and further to the right, forming a triangle shape known as **Callback Hell**.
```javascript
fs.readFile('user.json', (err, user) => {
  db.query(user.id, (err, profile) => {
    profile.update('status', (err, updated) => {
      email.send(updated.email, (err, success) => {
        console.log("Finally done.");
      });
    });
  });
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to `return` after handling an error

**The mistake:** A developer writes `if (err) { console.error(err); } console.log(data);` inside a callback.

**Why it's wrong:** If an error occurs, the code logs the error but *keeps running the rest of the function*. It will try to `console.log(data)`, but `data` will be undefined, instantly crashing your server. 
**Golden Rule:** Always add a `return` statement inside the `if (err)` block to stop the callback function from executing the success logic.

---



### Mistake 2: Failing to Follow Node.js Error-First Callback Conventions `(err, data) => {}`

**The mistake:** Writing a custom async function calling `callback(data)` with data in the 1st parameter slot.

**Why it's wrong:** Node.js standard convention requires the 1st argument of callbacks to be reserved for error objects (`null` if no error). Reversing argument order breaks utility tools like `util.promisify`.

*Incorrect:*
```javascript
function fetchData(cb) {
  cb({ user: 'Alice' }); // ❌ Data passed in error position!
}
```

*Fix:*
```javascript
function fetchData(cb) {
  cb(null, { user: 'Alice' }); // 1st arg null (no error), 2nd arg data
}
```

### Mistake 3: Calling Callbacks Multiple Times inside a Single Function Execution (Callback Hell)

**The mistake:** Omitting `return` when calling a callback on an error condition.

**Why it's wrong:** Without `return`, execution continues past the error check, invoking the callback a 2nd time with result data and causing dual-response bugs.

*Incorrect:*
```javascript
fs.readFile('file.txt', (err, data) => {
  if (err) cb(err); // ❌ Missing return! Keeps running below!
  cb(null, data);
});
```

*Fix:*
```javascript
fs.readFile('file.txt', (err, data) => {
  if (err) return cb(err); // Explicit return on error
  cb(null, data);
});
```

## 5. Practice Exercises

### Exercise 1: Node.js Error-First Callback Handler

**Scenario:** Implements a standard Node.js error-first callback function `(err, result) => {}` for processing filesystem data.

**Requirements:**
1. Write executeCallbackTask(inputValue, callback).
2. If inputValue is invalid, invoke `callback(new Error(...))`.
3. Otherwise invoke `callback(null, result)`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function executeCallbackTask(inputValue, callback) {
>   if (typeof callback !== "function") {
>     throw new TypeError("Callback must be a function");
>   }
>
>   process.nextTick(() => {
>     if (inputValue === null || inputValue === undefined) {
>       return callback(new Error("Input value cannot be null or undefined"));
>     }
>
>     if (typeof inputValue === "string" && inputValue.trim() === "") {
>       return callback(new Error("Input string cannot be empty"));
>     }
>
>     callback(null, { processed: String(inputValue).toUpperCase() });
>   });
> }
>
> // Verification tests
> executeCallbackTask("hello", (err, res) => {
>   console.assert(err === null, "Test 1 Failed");
>   console.assert(res.processed === "HELLO", "Test 2 Failed");
> });
>
> executeCallbackTask("", (err, res) => {
>   console.assert(err !== null && err.message.includes("empty"), "Test 3 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Error-First Callback Convention**: Node.js standard callback signature: first parameter `err` (null on success), second parameter `data`.
> 2. **Mandatory Early Return**: Always use `return callback(err)` to prevent executing subsequent success code after an error.
> 3. **Consistent Async Execution**: Always execute callbacks asynchronously (via `process.nextTick` or `setImmediate`) to avoid Zalgo bugs.
> 
---

### Exercise 2: Callback Hell Refactoring to Promises

**Scenario:** Refactors nested callback code (Callback Hell / Pyramid of Doom) into a flattened Promise-based pipeline.

**Requirements:**
1. Write step1Callback(cb)
2. Write step2Callback(val, cb)
3. Convert steps to Promises and chain with `.then()` or `await`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function step1Async(val) {
>   return new Promise((resolve, reject) => {
>     if (!val) return reject(new Error("Invalid val"));
>     setTimeout(() => resolve(val * 2), 10);
>   });
> }
>
> function step2Async(val) {
>   return new Promise((resolve) => {
>     setTimeout(() => resolve(val + 10), 10);
>   });
> }
>
> async function executeRefactoredPipeline(initialVal) {
>   const res1 = await step1Async(initialVal);
>   const res2 = await step2Async(res1);
>   return res2;
> }
>
> // Verification tests
> executeRefactoredPipeline(5).then(finalRes => {
>   console.assert(finalRes === 20, "Test 1 Failed: (5 * 2) + 10 = 20");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Callback Hell (Pyramid of Doom)**: Deeply nested asynchronous callbacks make code unreadable and error handling fragile.
> 2. **Promisification Solution**: Wrapping legacy callbacks in Promises flattens nested callbacks into clean async/await pipelines.
> 3. **Centralized Error Catching**: Promises allow catching errors across all steps with a single `.catch()` or `try/catch` block.
> 
---

### Exercise 3: Callback Race Condition Guard (Ensure Single Execution)

**Scenario:** A protective wrapper decorator ensures legacy callback functions are invoked at most once, preventing double-invocation bugs.

**Requirements:**
1. Write onceCallback(callbackFn).
2. Track invocation state.
3. Ignore subsequent calls to prevent duplicate executions.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function onceCallback(callbackFn) {
>   let called = false;
>
>   return function (err, result) {
>     if (called) {
>       return;
>     }
>     called = true;
>     callbackFn(err, result);
>   };
> }
>
> // Verification tests
> let callCount = 0;
> const safeCb = onceCallback((err, res) => {
>   callCount++;
> });
>
> safeCb(null, "First Call");
> safeCb(null, "Duplicate Call");
>
> console.assert(callCount === 1, "Test 1 Failed: Callback must execute exactly once");
> ```
>
> #### Technical Explanation
>
> 1. **Double Callback Invocation Bug**: Calling a callback twice in legacy Node.js code can cause double HTTP response header errors or corrupted state.
> 2. **State Guard Decorator**: Wrapping callbacks in a boolean closure prevents duplicate execution.
> 3. **Legacy Library Compatibility**: Useful when interfacing with older third-party callback libraries that lack strict single-call guarantees.
## 6. Related Terms
- [Promisification (util.promisify)](promisification.md) — How you convert old callback code into modern Promise code.
- [The Event Loop & Libuv](../level_01/event_loop.md) — Related concept: The Event Loop & Libuv.
- [Non-Blocking I/O](../level_01/non_blocking_io.md) — Related concept: Non-Blocking I/O.
- [Async Error Handling (try/catch + .catch)](async_error_handling.md) — Related concept: Async Error Handling (try/catch + .catch).
- [Event Emitter](event_emitter.md) — Related concept: Event Emitter.

---

## 7. Key Takeaways
- **Callbacks** are functions executed after an asynchronous task completes.
- Node.js established the **Error-First** convention (`err, data`).
- Nested callbacks create **Callback Hell**, making code impossible to read and maintain.
- Always `return` early if the `err` object exists.
