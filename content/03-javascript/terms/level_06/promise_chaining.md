# Promise Chaining

> **Level 6 — Asynchronous JavaScript**
> Sequencing `.then()` calls; returning values/promises.

---

## 1. Prerequisites
- [Promise](./promise.md) — An object representing the eventual completion of an asynchronous operation.
- [`.then()` / `.catch()`](./then_catch.md) — Methods chained to handle Promise completion.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing asynchronous programs, we often need to run operations in sequence—for example, fetching a user's record from a server, using the user's ID to query their list of orders, and then taking that list to display a price discount on screen. 

If we implemented this using legacy callbacks, we would nested them inside each other, creating **Callback Hell** (a triangle-shaped pyramid of doom). 

To solve this, JavaScript designed **Promise Chaining**. Whenever you call `.then()`, it automatically returns a **new Promise**. 
- If the callback function inside `.then()` returns a standard value, the new Promise is immediately resolved with that value, passing it to the next `.then()`.
- If the callback returns a **new Promise**, the execution of the chain pauses. The engine waits until this new Promise settles, and then passes its resolved value down to the next `.then()` block.

This allows us to flatten our code structure into a single, vertical pipeline.

### (2) Reality Metaphor
Promise Chaining is like a package delivery relay race.
- Runner 1 (First fetch) runs their leg and hands a box to Runner 2.
- Runner 2 (First `.then()`) opens the box, processes the item, wraps it, and hands it to Runner 3.
- If Runner 2 has to perform a slow task, like waiting for a signature (returning a Promise), Runner 3 waits at their starting block. Once Runner 2 gets the signature, they hand the package over, and Runner 3 runs their leg.
- If any runner drops the package (an error occurs), the run is aborted and the package is passed directly to the medical tent (**`.catch()`**) at the end of the track.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// A mathematical chain resolving sequentially
Promise.resolve(5)
  .then(num => num * 2)  // Returns 10
  .then(num => num + 3)  // Returns 13
  .then(val => {
    console.log("Final Value:", val); // Logs: 13
  });
```

#### Fuller Example
```javascript
// Sequencing user login and inventory fetching operations
function getUser(username) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ id: 42, name: username }), 500);
  });
}

function getOrders(userId) {
  return new Promise(resolve => {
    setTimeout(() => resolve(["Order-201", "Order-304"]), 500);
  });
}

// Chaining the operations in a flat linear structure
getUser("Brendan")
  .then(function(user) {
    console.log(`Step 1: Retrieved user ${user.name}`);
    // CRITICAL: We return the Promise returned by getOrders.
    // The chain will pause and wait for it to resolve!
    return getOrders(user.id); 
  })
  .then(function(orders) {
    console.log("Step 2: Retrieved user orders list:", orders);
    // Returning a primitive value
    return orders.length; 
  })
  .then(function(orderCount) {
    console.log(`Step 3: User has ${orderCount} active orders.`);
  })
  .catch(function(error) {
    // A single .catch() block handles errors from ANY of the steps above!
    console.error("An error occurred during process:", error.message);
  });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to `return` inside `.then()` blocks

**The mistake:** Performing a calculation or launching a Promise inside a `.then()` callback but forgetting to write the `return` statement.

**Why it's wrong:** In JavaScript, a function without a `return` statement returns `undefined` implicitly. The next link in the chain will execute immediately, receiving `undefined` as its argument instead of your data or Promise.

*Incorrect:*
```javascript
Promise.resolve(5)
  .then(num => {
    num * 2; // Calculation performed but NOT returned!
  })
  .then(result => {
    console.log(result); // Logs: undefined!
  });
```

*Fix:*
```javascript
Promise.resolve(5)
  .then(num => {
    return num * 2; // Explicitly return the value
  })
  .then(result => {
    console.log(result); // 10
  });
```

### Mistake 2: Nesting Promises inside `.then()` (Recreating Callback Hell)

**The mistake:** Nesting new Promises inside a `.then()` body instead of returning them and chaining them outside.

**Why it's wrong:** Nesting defeats the entire design goal of Promises (which is code flatness). It recreates the hard-to-read "Callback Pyramids" using Promise syntax.

*Incorrect:*
```javascript
getUser("Alice").then(user => {
  getOrders(user.id).then(orders => {
    console.log(orders); // Hard to read nested "Promise Hell"!
  });
});
```

*Fix:*
```javascript
getUser("Alice")
  .then(user => getOrders(user.id)) // Return the Promise to the outer chain
  .then(orders => {
    console.log(orders); // Flat and readable!
  });
```

---

### Mistake 3: Unhandled Asynchronous Failures in Promise Chaining Operations

**The mistake:** Executing asynchronous operations within Promise Chaining without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/promise_chaining"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/promise_chaining");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in promise_chaining: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Math Chainer

**Problem:** Complete the code to multiply `value` by 3, subtract 5 in the next step, and print the final result.

```javascript
Promise.resolve(10)
  // Step 1: Multiply by 3
  // Step 2: Subtract 5
  .then(result => console.log("Result:", result));
```

**Expected output:**
```text
Result: 25
```

> [!check]- Answer
> - The first `.then()` should return `val * 3`.
> - The second `.then()` should return `val - 5`.

---

### Exercise 2: Sequential Value Transformation in Promise Chains

**Problem:** Chain `.then(x => x + 1).then(x => x * 2)` starting from `Promise.resolve(5)`.

**Expected output:**
```text
12
```

> [!check]- Answer
> ```javascript
> Promise.resolve(5)
>   .then(x => x + 1)
>   .then(x => x * 2)
>   .then(res => console.log(res));
> ```
>
> **Explanation:** Each `.then()` returns a new promise resolving to the return value of its handler.

### Exercise 3: Propagating Errors in Promise Chains

**Problem:** Catch an error thrown in step 1 using a single downstream `.catch()` at chain end.

**Expected output:**
```text
Caught error in chain: Step 1 failed
```

> [!check]- Answer
> ```javascript
> Promise.resolve()
>   .then(() => { throw new Error("Step 1 failed"); })
>   .then(() => console.log("Step 2"))
>   .catch(err => console.log(`Caught error in chain: ${err.message}`));
> ```
>
> **Explanation:** Unhandled rejections propagate down promise chains until reaching `.catch()` handlers.

---

## 7. Related Terms
- [Callback Hell](./callback_hell.md) — The nested pattern that Promise Chaining replaces.
- [`async` / `await`](./async_await.md) — A cleaner syntax built on top of Promise chains.

---

## 8. Key Takeaways
- Every `.then()` method call returns a new Promise, enabling method chaining.
- If you return a primitive value inside `.then()`, the new Promise resolves with that value.
- If you return a new Promise inside `.then()`, the chain pauses until that Promise settles, passing the result to the next `.then()`.
- Always remember to write `return` statements inside your `.then()` callbacks, or the next link will receive `undefined`.
- A single `.catch()` block placed at the end of a chain will intercept rejections from any preceding link in the pipeline.
