# Promises (in the context of networks)

> **Level 5 — Fetching Data (Client-Side)**
> A JavaScript object that represents the eventual completion (or failure) of an asynchronous network operation.

---

## 1. Prerequisites
- [The fetch() API](fetch.md) — `fetch` is the most common function that generates a Promise.
- [Request & Response Lifecycle](../level_01/request_response.md) — Promises exist to handle the "waiting" phase of this lifecycle.

---

## 2. Term Category

**JavaScript Core Concept / Asynchronous Programming (Universal JavaScript .)**: Promises (in the context of networks) is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript is **single-threaded**. It can only do one thing at a time. 
If your code says `fetch('google.com')`, and the network takes 2 full seconds to reply, what should JavaScript do? If it freezes and does nothing for 2 seconds (Synchronous blocking), the entire website will lock up. The user won't be able to scroll or click buttons.
To prevent the UI from freezing, network requests are **Asynchronous**. JavaScript fires the request into the network, immediately grabs a "Promise" placeholder, and keeps running the rest of the code. When the network request finally finishes, the Promise "resolves," and JavaScript comes back to handle the data.

### (2) Reality Metaphor
You go to a busy burger restaurant. You pay the cashier. 
Instead of making you stand at the register for 10 minutes while they cook the burger (which would block the line for everyone else), the cashier hands you a **Buzzer** (a Promise). 
You go sit down and talk to your friends (JavaScript keeps executing other code). The Buzzer currently has a state of **Pending**.
Eventually, one of two things happens:
1. The Buzzer flashes green (**Resolved/Fulfilled**). You go to the counter and get your burger (the data).
2. The Buzzer flashes red (**Rejected**). The cashier tells you they ran out of meat (a network error).

### (3) The 3 States of a Promise
1. **Pending**: The network request is currently traveling across the internet.
2. **Fulfilled**: The server responded successfully.
3. **Rejected**: The network crashed (e.g., the user lost Wi-Fi).

### (4) Code Examples

#### Using `.then()` to handle the Buzzer
```javascript
console.log("1. Ordering burger...");

// fetch gives us the Buzzer (Promise) immediately
fetch('https://api.example.com/burger')
  .then((burger) => {
    // This code only runs when the Buzzer flashes green (Fulfilled)
    console.log("3. Eating the burger!");
  })
  .catch((error) => {
    // This code only runs if the Buzzer flashes red (Rejected)
    console.log("Error: Kitchen is on fire!");
  });

console.log("2. Sitting down to talk to friends.");

// Console output order: 1, 2, ... (wait 500ms) ... 3
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to return data from inside a `.then()`

**The mistake:** A developer tries to extract data out of the Promise to use it synchronously.
```javascript
let myData = null;

fetch('/api/data').then(data => {
  myData = data; // Assigning it later
});

console.log(myData); // Prints: null. Why?!
```

**Why it's wrong:** The `console.log(myData)` runs *immediately* (Step 2 in the burger metaphor), while the network is still pending! The data hasn't arrived yet. 
**Golden Rule:** You cannot "escape" a Promise. If a piece of code relies on network data, that code MUST be placed inside the `.then()` block, or you must use `await`.

---

### Mistake 2: Creating Deferred Anti-Pattern ("Explicit Promise Construction Anti-Pattern")

**The mistake:** Wrapping an already promise-returning function inside `new Promise((resolve, reject) => ...)`.

**Why it's wrong:** Wrapping existing promise-based functions (like `fetch()`) in `new Promise` adds unnecessary boilerplate and breaks exception propagation. Chain `.then()` or return `fetch()` directly.

*Incorrect:*
```javascript
// Redundant promise wrapper anti-pattern
function getData() {
  return new Promise((resolve, reject) => {
    fetch('/api/data').then(res => resolve(res.json())).catch(err => reject(err)); // ❌ Redundant!
  });
}
```

*Fix:*
```javascript
function getData() {
  return fetch('/api/data').then(res => res.json()); // Return fetch promise directly
}
```

---

### Mistake 3: Forgetting to Return Promises inside `.then()` Chains (Broken Chaining)

**The mistake:** Omitting the `return` keyword inside a `.then()` callback.

**Why it's wrong:** Omitting `return` causes subsequent `.then()` callbacks to receive `undefined` instead of waiting for the inner promise result.

*Incorrect:*
```javascript
fetch('/api/user')
  .then(res => {
    res.json(); // ❌ Missing return! Next .then gets undefined!
  })
  .then(data => console.log(data)); // Logs undefined!
```

*Fix:*
```javascript
fetch('/api/user')
  .then(res => res.json()) // Explicit implicit return
  .then(data => console.log(data));
```


---

## 5. Practice Exercises

### Exercise 1: Promise Chaining & Data Transformation Pipeline

**Scenario:** A REST client chains `.then()` handlers to parse HTTP responses, transform payloads, and attach metadata timestamps.

**Requirements:**
1. Write fetchAndTransformUser(userId, fetchFn).
2. Chain .then() handlers.
3. Return transformed user object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function fetchAndTransformUser(userId, fetchFn) {
>   return fetchFn(userId)
>     .then(response => {
>       if (!response.ok) throw new Error(`User ${userId} not found`);
>       return response.json();
>     })
>     .then(rawUser => {
>       return {
>         id: rawUser.id,
>         displayName: `${rawUser.firstName} ${rawUser.lastName}`,
>         email: rawUser.email.toLowerCase(),
>         fetchedAt: Date.now()
>       };
>     })
>     .catch(err => {
>       return { error: err.message, userId };
>     });
> }
>
> // Verification tests
> const mockFetch = async (id) => ({
>   ok: true,
>   json: async () => ({ id, firstName: "Alice", lastName: "Smith", email: "ALICE@EXAMPLE.COM" })
> });
>
> fetchAndTransformUser("u100", mockFetch).then(res => {
>   console.assert(res.displayName === "Alice Smith", "Test 1 Failed");
>   console.assert(res.email === "alice@example.com", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Promise States**: Pending -> Fulfilled (resolved) or Rejected.
> 2. **Chain Values**: Returning a value inside .then() resolves the next promise in the chain with that value.
> 3. **Centralized .catch()**: A single .catch() at the end of the chain handles errors thrown at any step.
> 
---

### Exercise 2: Legacy Callback to Promise Conversion Utility (Promisify)

**Scenario:** Converts a legacy node-style callback function `(arg, callback)` into a modern Promise-returning function.

**Requirements:**
1. Write promisifyCallback(fn).
2. Return new Promise((resolve, reject) => ...).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function promisifyCallback(legacyFn) {
>   return function (...args) {
>     return new Promise((resolve, reject) => {
>       legacyFn(...args, (err, result) => {
>         if (err) return reject(err);
>         resolve(result);
>       });
>     });
>   };
> }
>
> // Verification tests
> const legacyAsync = (name, cb) => {
>   if (!name) return cb(new Error("Name required"));
>   cb(null, `Hello ${name}`);
> };
>
> const promisedFn = promisifyCallback(legacyAsync);
>
> promisedFn("World").then(msg => {
>   console.assert(msg === "Hello World", "Test 1 Failed");
> });
>
> promisedFn(null).catch(err => {
>   console.assert(err.message === "Name required", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Promise Constructor**: new Promise((resolve, reject) => {}) wraps asynchronous callback operations.
> 2. **Node Callback Convention**: Node callbacks expect (err, result) parameters.
> 3. **Async Modernization**: Promisifying legacy libraries allows consuming them with modern async/await syntax.
> 
---

### Exercise 3: Unhandled Rejection Safeguard & Fallback Resolver

**Scenario:** Ensures promise execution chains always handle potential rejections, preventing unhandledRejection crashes.

**Requirements:**
1. Write safePromiseResolve(promiseInstance, fallbackValue).
2. Attach .catch() handler returning fallbackValue.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safePromiseResolve(promiseInstance, fallbackValue = null) {
>   return promiseInstance.catch(err => {
>     return fallbackValue;
>   });
> }
>
> // Verification tests
> const failingPromise = Promise.reject(new Error("Boom!"));
>
> safePromiseResolve(failingPromise, "SAFE_DEFAULT").then(res => {
>   console.assert(res === "SAFE_DEFAULT", "Test 1 Failed: Must return fallback value on rejection");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Unhandled Rejection Risk**: Uncaught promise rejections terminate Node.js processes in modern runtimes.
> 2. **.catch() Recovery**: Catching rejections converts error states back into fulfilled promise states with fallback values.
> 3. **Resilient API Pipelines**: Guarantees async operations complete without bubbling uncaught exceptions.
---

## 6. Related Terms
- [async / await](async_await.md) — The modern, much cleaner syntax for handling Promises without using `.then()`.
- [Error Handling (try / catch)](error_handling.md) — How we handle "Rejected" promises.
- [The fetch() API](fetch.md) — Related concept: The fetch() API.
- [XMLHttpRequest / AJAX](xmlhttprequest_ajax.md) — Related concept: XMLHttpRequest / AJAX.

---

## 7. Key Takeaways
- A **Promise** is a placeholder for data that hasn't arrived yet.
- Because network requests are slow, `fetch` returns a Promise so it doesn't freeze the browser.
- Use `.then()` to schedule code to run *after* the Promise successfully fulfills.
- Use `.catch()` to schedule code to run if the Promise rejects (fails).
