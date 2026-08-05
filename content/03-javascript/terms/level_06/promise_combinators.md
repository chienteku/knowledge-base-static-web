# Promise.all / allSettled / race / any

> **Level 6 — Asynchronous JavaScript**
> Combinators for running promises in parallel.

---

## 1. Prerequisites
- [Promise](promise.md) — An object representing the eventual completion of an asynchronous operation.
- [.then() / .catch()](then_catch.md) — Core methods used to resolve or reject Promises.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In web applications, we often need to trigger multiple asynchronous operations at the same time—such as fetching a user's details, loading page configurations, and pulling sidebar widgets. If we call them sequentially, the total load time is the *sum* of all delays. 

To execute requests in parallel, JavaScript provides four static **Promise Combinators**. Each accepts an array of Promises and returns a single Promise, but they resolve and reject under different criteria:

| Combinator | Fulfills when... | Rejects when... | Short-circuit behavior |
|------------|------------------|-----------------|------------------------|
| **`Promise.all`** | **All** input promises resolve successfully. Returns array of values. | **Any** single input promise rejects. | **Yes**: Rejects immediately on the first failure. |
| **`Promise.allSettled`** | **All** input promises settle (either success or fail). Returns detail object array. | Never rejects. | **No**: Waits for every single promise to finish. |
| **`Promise.race`** | The **first** input promise settles (either success or fail). | The **first** input promise settles as a rejection. | **Yes**: Resolves or rejects based on the fastest promise. |
| **`Promise.any`** | The **first** input promise resolves successfully. | **All** input promises reject (returns `AggregateError`). | **Yes**: Resolves as soon as the first success occurs. |

### (2) Reality Metaphors
- **`Promise.all` (The School Group Project):** A teacher assigns a project to a group of 3 students. Every student must complete their section. If one student fails to submit (rejects), the entire group project fails immediately (rejects).
- **`Promise.allSettled` (The Report Card):** A class takes an exam. The teacher waits for every student to submit their paper (settled). At the end, the teacher prints a sheet showing who passed and who failed, but the class continues.
- **`Promise.race` (The Sprint Race):** A literal 100m sprint. The runner who crosses the finish line first stops the clock, regardless of whether they crossed it successfully (resolved) or tripped and got disqualified (rejected).
- **`Promise.any` (Calling Taxis):** You call three separate taxi companies. You only need one taxi to show up (resolved). If the first company declines (rejects), you wait for the others. You only fail if all three companies decline.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const p1 = Promise.resolve("A");
const p2 = Promise.resolve("B");

Promise.all([p1, p2]).then(results => console.log(results)); // ["A", "B"]
```

#### Fuller Example
```javascript
// Simulating parallel API requests
const fetchProducts = () => new Promise(res => setTimeout(() => res("Products Data"), 500));
const fetchUser = () => new Promise(res => setTimeout(() => res("User Profile"), 300));
const fetchBrokenAd = () => new Promise((_, rej) => setTimeout(() => rej(new Error("Ad block failed")), 100));

// 1. Promise.all: Fast parallel execution (resolves in 500ms total, not 800ms)
Promise.all([fetchProducts(), fetchUser()])
  .then(function(results) {
    console.log("Promise.all Success:", results); // [ 'Products Data', 'User Profile' ]
  })
  .catch(err => console.error("Promise.all Error:", err.message));

// 2. Promise.all failure short-circuiting:
Promise.all([fetchProducts(), fetchUser(), fetchBrokenAd()])
  .then(results => console.log("Will not run!"))
  .catch(err => {
    // Fails immediately after 100ms because fetchBrokenAd rejected!
    console.log("Promise.all short-circuited error:", err.message); // "Ad block failed"
  });

// 3. Promise.allSettled: Waiting for all outcomes regardless of failure
Promise.allSettled([fetchProducts(), fetchUser(), fetchBrokenAd()])
  .then(function(results) {
    console.log("Promise.allSettled Results:");
    results.forEach(result => {
      // Results format: { status: "fulfilled", value } or { status: "rejected", reason }
      console.log(`Status: ${result.status}, Payload:`, result.value || result.reason.message);
    });
  });
// Logs:
// Status: fulfilled, Payload: Products Data
// Status: fulfilled, Payload: User Profile
// Status: rejected, Payload: Ad block failed
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Promise Combinators Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Promise Combinators blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "promise_combinators";
```

*Fix:*
```javascript
let value = "promise_combinators";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Promise Combinators Callbacks

**The mistake:** Passing methods from Promise Combinators instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "promise_combinators",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "promise_combinators",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Promise Combinators Operations

**The mistake:** Executing asynchronous operations within Promise Combinators without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/promise_combinators"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/promise_combinators");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in promise_combinators: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Parallel Fetch Mock

**Problem:** Complete the code to resolve three numeric mock Promises in parallel using `Promise.all` and log their mathematical sum.

```javascript
const p1 = Promise.resolve(10);
const p2 = Promise.resolve(20);
const p3 = Promise.resolve(30);

// Use Promise.all to sum the results
// Write implementation here
```

**Expected output:**
> [!check]- Answer
> ```text
> Sum: 60
> ```
> - Pass `[p1, p2, p3]` to `Promise.all()`.
> - In `.then(results => ...)` use `results.reduce((a, b) => a + b)` to sum them.

---

### Exercise 2: Handling Promise Failures with `Promise.allSettled`

**Problem:** Pass `[Promise.resolve(1), Promise.reject("err")]` to `Promise.allSettled()` and inspect statuses.

**Expected output:**
> [!check]- Answer
> ```text
> fulfilled
> rejected
> ```
> ```javascript
> const p1 = Promise.resolve(1);
> const p2 = Promise.reject("err");
> Promise.allSettled([p1, p2]).then(results => {
>   results.forEach(r => console.log(r.status));
> });
> ```
>
> **Explanation:** `Promise.allSettled` yields an array of status objects without short-circuiting on rejections.

---

### Exercise 3: Racing Promises with `Promise.race`

**Problem:** Race a 10ms fast promise against a 100ms slow promise using `Promise.race()`.

**Expected output:**
> [!check]- Answer
> ```text
> Fast winner
> ```
> ```javascript
> const fast = new Promise(res => setTimeout(() => res("Fast winner"), 10));
> const slow = new Promise(res => setTimeout(() => res("Slow"), 100));
> Promise.race([fast, slow]).then(winner => console.log(winner));
> ```
>
> **Explanation:** `Promise.race` settles with the value or error of the first promise that settles.


---

## 7. Related Terms
- [Fetch API](fetch_api.md) — The network request API often executed in parallel.
- [async / await](async_await.md) — Syntactic sugar used to resolve combinator promises.
- [Promise.resolve / Promise.reject](promise_static.md) — Related concept: Promise.resolve / Promise.reject.

---

## 8. Key Takeaways
- Use Promise combinators to run multiple asynchronous operations concurrently in parallel.
- `Promise.all` fulfills only if all promises succeed; it rejects immediately if a single one fails (short-circuit).
- `Promise.allSettled` waits for all promises to finish (either success or fail) and returns an array of outcome status objects.
- `Promise.race` settles based on the absolute fastest promise (resolved or rejected).
- `Promise.any` resolves based on the first successful promise; it only rejects if all inputs fail.
