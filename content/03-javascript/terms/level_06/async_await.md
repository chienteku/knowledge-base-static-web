# async / await

> **Level 6 — Asynchronous JavaScript**
> Syntactic sugar built on top of Promises, making asynchronous code read synchronously.

---

## 1. Prerequisites
- [Promise](promise.md) — The underlying technology `async/await` interacts with.
- [Synchronous](synchronous.md) — The style of code `async/await` mimics.

---

## 2. Term Category

**Language Core *(Introduced in ES8 / ES2017)* (Universal: Works everywhere)**: async / await is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While `.then()` chains successfully fixed the "Pyramid of Doom" caused by callbacks, they still required developers to write lots of callback functions, `return` statements, and visually break up their logic. Developers constantly wished they could just write standard, top-to-bottom synchronous code, but still have it operate asynchronously under the hood.

In ES8, JavaScript introduced `async` and `await`. It is purely "syntactic sugar" (a sweeter, easier way to write existing logic) placed directly on top of Promises. By marking a function as `async`, you gain the magical ability to use the `await` keyword inside it. `await` literally pauses the execution of that specific function until a Promise resolves, unwraps the data, and hands it to a normal variable, completely eliminating the need for `.then()`.

### (2) Reality Metaphor
Using `.then()` is like ordering a package and leaving a note on the door: "Whenever the mailman arrives, please put the package in the bin."
Using `await` is like sitting in a magical chair. You say "I await my package." Time freezes for you, but the rest of the world keeps moving. The moment the mailman hands you the package, time unfreezes, and you immediately continue your day holding the package in your hands.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// 1. Mark the function with 'async'
async function getUser() {
  console.log("Fetching...");
  
  // 2. Use 'await' to pause until the Promise finishes. 
  // It automatically unwraps the resolved data!
  const response = await fetch('https://api.example.com/user');
  const data = await response.json();
  
  console.log("User received:", data);
}

getUser();
```

#### Fuller Example: Try / Catch Error Handling
```javascript
// Because async/await behaves synchronously, we use standard try/catch blocks!

async function getDashboardData() {
  try {
    const userRes = await fetch('/api/user/1');
    const user = await userRes.json();
    
    // We can easily use data from the previous line on the next line
    const postRes = await fetch(`/api/posts?userId=${user.id}`);
    const posts = await postRes.json();
    
    console.log(`Loaded ${posts.length} posts for ${user.name}`);
    
  } catch (error) {
    // This catches errors from ANY of the awaited Promises above
    console.error("Dashboard failed to load:", error);
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Async Await Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Async Await blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "async_await";
```

*Fix:*
```javascript
let value = "async_await";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Async Await Callbacks

**The mistake:** Passing methods from Async Await instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "async_await",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "async_await",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Async Await Operations

**The mistake:** Executing asynchronous operations within Async Await without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/async_await"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/async_await");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in async_await: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Sequential User Profile & Order Fetcher

**Scenario:** A user dashboard service uses async and await to sequentially fetch user details, user orders, and order shipping statuses.

**Requirements:**
1. Write fetchUserDashboard(userId, apiMock).
2. Use await to fetch user object first.
3. Use await to fetch orders array using user.orderId.
4. Return combined dashboard object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchUserDashboard(userId, apiMock) {
>   const user = await apiMock.getUser(userId);
>   if (!user || !user.orderId) {
>     throw new Error("User or order not found");
>   }
>   const order = await apiMock.getOrder(user.orderId);
>   return {
>     user: user.name,
>     orderId: order.id,
>     amount: order.amount
>   };
> }
>
> // Verification tests
> const mockApi = {
>   getUser: async (id) => ({ id, name: "Alice", orderId: "ORD-99" }),
>   getOrder: async (id) => ({ id, amount: 150.00 })
> };
>
> fetchUserDashboard(101, mockApi).then(dashboard => {
>   console.assert(dashboard.user === "Alice", "Test 1 Failed");
>   console.assert(dashboard.amount === 150.00, "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **async Keyword**: The async keyword marks a function as asynchronous, guaranteeing it returns a Promise instance.
> 2. **await Expression**: The await operator pauses async function execution until the Promise resolves or rejects.
> 3. **Synchronous Syntax Readability**: async/await flattens asynchronous code into linear, synchronous-like syntax.
> 
---

### Exercise 2: Async Await Advanced Context Handler

**Scenario:** A web application component processes async await data operations within enterprise workflows.

**Requirements:**
1. Write handleAsyncAwaitSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleAsyncAwaitSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleAsyncAwaitSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Async Await Architecture**: Applying async await patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Async Await Performance Optimization

**Scenario:** An application utility optimizes async await execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeAsyncAwaitTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeAsyncAwaitTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeAsyncAwaitTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Async Await Optimization**: Optimizing async await improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Promise](promise.md) — What `async/await` is secretly working with under the hood.
- [.then() / .catch()](then_catch.md) — The older syntax that `async/await` replaces.
- [Callback Hell](callback_hell.md) — Related concept: Callback Hell.
- [Fetch API](fetch_api.md) — Related concept: Fetch API.
- [Promise Chaining](promise_chaining.md) — Related concept: Promise Chaining.
- [Promise.all / allSettled / race / any](promise_combinators.md) — Related concept: Promise.all / allSettled / race / any.

---

## 7. Key Takeaways
- `async/await` allows you to write asynchronous code that reads like synchronous code.
- To use `await`, you must mark the parent function with the `async` keyword.
- `await` pauses the function execution until the Promise resolves, then unwraps the data.
- Under the hood, an `async` function always automatically returns a Promise!
- Use standard `try { ... } catch (error) { ... }` blocks to handle errors.
