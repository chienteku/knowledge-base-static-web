# Promise.resolve / Promise.reject

> **Level 6 — Asynchronous JavaScript**
> Create already-settled promises.

---

## 1. Prerequisites
- [Promise](promise.md) — An object representing the eventual completion (or failure) of an asynchronous operation.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Usually, to create a Promise, we write a constructor block: `new Promise((resolve, reject) => { ... })`. While this works well for executing delayed operations (like timer delays or file reading), it is unnecessarily verbose when you already have the data or error synchronously.

To make Promise creation clean and efficient, the TC39 committee implemented static constructor shorthand methods:
- **`Promise.resolve(value)`** creates and returns a Promise that is **already Fulfilled** with the provided value.
- **`Promise.reject(reason)`** creates and returns a Promise that is **already Rejected** with the provided error reason.

These are essential when implementing caching layers (returning cached data synchronously wrapped in a Promise so the caller can still use `.then()`), or writing mock tests that simulate asynchronous successes or failures.

### (2) Reality Metaphor
- **`new Promise()`** is like ordering a custom cake from a bakery. You have to wait for the baker to mix the ingredients, bake it, and notify you when it is ready.
- **`Promise.resolve(cake)`** is like buying a pre-made cake from the display counter. It is already baked and boxed (already settled). You buy it and immediately walk out of the store.
- **`Promise.reject(error)`** is like a pre-printed "Sold Out" card sitting on the shelf, telling you immediately that your transaction has failed.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Synchronous values wrapped in settled Promises
const resolvedPromise = Promise.resolve("Success value");
const rejectedPromise = Promise.reject(new Error("Failure reason"));

resolvedPromise.then(val => console.log(val)); // Logs: "Success value"
rejectedPromise.catch(err => console.error(err.message)); // Logs: "Failure reason"
```

#### Fuller Example
```javascript
// A simple data caching database client simulation
const userCache = {
  101: { name: "Alice", role: "admin" }
};

function fetchUserData(userId) {
  // 1. If data exists in cache, return a resolved promise IMMEDIATELY
  if (userCache[userId]) {
    console.log("Serving user data from cache...");
    return Promise.resolve(userCache[userId]); 
  }

  // 2. If data is not in cache, perform an async API request (simulated with new Promise)
  console.log("Fetching user data from network API...");
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mockDatabase = {
        102: { name: "Bob", role: "guest" }
      };
      const user = mockDatabase[userId];
      
      if (user) {
        // Save to cache for next time
        userCache[userId] = user;
        resolve(user);
      } else {
        reject(new Error(`User with ID ${userId} not found.`));
      }
    }, 1000);
  });
}

// First lookup: goes to network
fetchUserData(102)
  .then(user => console.log("User retrieved:", user.name))
  .catch(err => console.error("Error:", err.message));

// Second lookup: served instantly from cache via Promise.resolve
setTimeout(() => {
  fetchUserData(102)
    .then(user => console.log("User retrieved (from cache):", user.name));
}, 2000);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Promise Static Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Promise Static blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "promise_static";
```

*Fix:*
```javascript
let value = "promise_static";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Promise Static Callbacks

**The mistake:** Passing methods from Promise Static instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "promise_static",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "promise_static",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Promise Static Operations

**The mistake:** Executing asynchronous operations within Promise Static without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/promise_static"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/promise_static");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in promise_static: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Cache Mock

**Problem:** Complete the function `getMockProduct` to return a resolved Promise containing the object `{ id: 5, name: "Book" }` synchronously.

```javascript
function getMockProduct() {
  // Write resolved promise return here
}

getMockProduct().then(product => console.log("Product:", product.name));
```

**Expected output:**
> [!check]- Answer
> ```text
> Product: Book
> ```
> - Use the static method `Promise.resolve(value)`.
> - Pass the object as the value argument.

---

### Exercise 2: Resolving Promises with `Promise.any`

**Problem:** Pass `[Promise.reject("fail"), Promise.resolve("success")]` to `Promise.any()`.

**Expected output:**
> [!check]- Answer
> ```text
> success
> ```
> ```javascript
> const p1 = Promise.reject("fail");
> const p2 = Promise.resolve("success");
> Promise.any([p1, p2]).then(val => console.log(val));
> ```
>
> **Explanation:** `Promise.any` fulfills with the value of the first promise that fulfills, ignoring rejections unless all reject.

---

### Exercise 3: `AggregateError` in `Promise.any`

**Problem:** Catch `AggregateError` when all promises in `Promise.any()` reject.

**Expected output:**
> [!check]- Answer
> ```text
> All promises were rejected
> ```
> ```javascript
> Promise.any([Promise.reject(1), Promise.reject(2)])
>   .catch(err => console.log(err.message));
> ```
>
> **Explanation:** `Promise.any` throws `AggregateError` when every input promise rejects.


---

## 7. Related Terms
- [.then() / .catch()](then_catch.md) — Methods used to handle settled values.
- [Promise.all / allSettled / race / any](promise_combinators.md) — Parallel promise combinators that consume collections of promises.

---

## 8. Key Takeaways
- `Promise.resolve(value)` creates a Promise that is already fulfilled.
- `Promise.reject(reason)` creates a Promise that is already rejected.
- Use these static methods to wrap synchronous values in Promises, facilitating consistent interface designs.
- Even if a Promise is pre-settled, its callbacks are scheduled asynchronously on the Microtask Queue, executing after synchronous code ends.
