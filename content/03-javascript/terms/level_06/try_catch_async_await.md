# try/catch with async/await

> **Level 6 — Asynchronous JavaScript**
> Error handling for awaited promises.

---

## 1. Prerequisites
- [async / await](async_await.md) — Syntactic sugar built on top of Promises.
- [Error Handling (try/catch/finally)](error_handling.md) — Structured exception handling flow.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: try/catch with async/await is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing asynchronous code using Promises, we handle success values inside `.then()` and catch rejections inside `.catch()`. However, once we adopt `async/await` to make our asynchronous code read like clean, synchronous code, mixing in `.catch()` methods breaks the flow and readability.

To solve this, the JavaScript engine integrates asynchronous promises with the standard, synchronous **`try...catch...finally`** statement. When you **`await`** a Promise:
- If the Promise resolves successfully, the engine extracts the value and assigns it to your variable.
- If the Promise rejects, the engine **automatically converts the rejection into a thrown exception**, interrupting execution and immediately jumping to the surrounding `catch` block.

This allows developers to handle both synchronous syntax errors (like typos) and asynchronous operational errors (like network timeouts) inside a single, unified `catch` block.

### (2) Reality Metaphor
- **Traditional `.catch()`** is like setting up a single custom safety net under a single tightrope.
- **`try/catch` with `async/await`** is like moving your entire performance (including both walking, jugging, and tightropes) inside the main circus arena where the standard safety net (the try-catch block) is already pre-installed. Whether you trip over your shoelaces (synchronous TypeError) or fall off the high tightrope (asynchronous Promise rejection), the exact same safety net catches you safely.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
async function loadData() {
  try {
    // If this fetch promise rejects, the engine throws it into the catch block
    const data = await fetch("https://api.example.com/data");
    const json = await data.json();
    return json;
  } catch (error) {
    console.error("Caught error:", error.message);
  }
}
```

#### Fuller Example
```javascript
// Simulated API client that fails randomly
function getProductDetails(productId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (productId === 101) {
        resolve({ id: 101, name: "Premium Coffee" });
      } else {
        reject(new Error(`Failed to find product with ID ${productId}`));
      }
    }, 500);
  });
}

async function displayProductUI(productId) {
  console.log("Loading product details...");
  // Show spinner UI...
  
  try {
    // 1. If getProductDetails rejects, it instantly throws an exception
    const product = await getProductDetails(productId);
    
    // 2. This line only runs if the await above succeeds
    console.log(`RENDER SUCCESS: Product Name is ${product.name}`);
    
  } catch (error) {
    // 3. Catches the asynchronous rejection error
    console.error("RENDER ERROR: Could not render product card.");
    console.error("Error Description:", error.message);
    
  } finally {
    // 4. Always runs: ideal place to clean up spinner UI
    console.log("Cleanup: Hide loading spinner UI.");
  }
}

// Successful path
displayProductUI(101);

// Failed path after 1 second
setTimeout(() => {
  displayProductUI(999);
}, 1000);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to `await` the Promise Inside the `try` block

**The mistake:** Calling an asynchronous function inside a `try` block but omitting the `await` keyword, causing errors to go uncaught.

**Why it's wrong:** Without `await`, the function executes synchronously, returning a pending `Promise` object immediately and exiting the `try` block. Because the promise hasn't rejected *yet* during that instant, the `catch` block is bypassed. When the promise rejects later, it behaves as an uncaught promise rejection, crashing the thread.

*Incorrect:*
```javascript
async function getSettings() {
  throw new Error("Disk read failure");
}

async function runConfig() {
  try {
    getSettings(); // Missing 'await'! Immediately returns a pending Promise.
  } catch (error) {
    // This catch block is completely bypassed!
    console.log("Caught:", error.message); 
  }
}

runConfig(); // UnhandledPromiseRejection Warning/Crash!
```

*Fix:*
```javascript
async function getSettings() {
  throw new Error("Disk read failure");
}

async function runConfig() {
  try {
    await getSettings(); // Add 'await' to block and wait for resolution/rejection
  } catch (error) {
    console.log("Caught:", error.message); // Correctly caught!
  }
}

runConfig();
```

---

### Mistake 2: Losing Context Binding (`this`) in Try Catch Async Await Callbacks

**The mistake:** Passing methods from Try Catch Async Await instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "try_catch_async_await",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "try_catch_async_await",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Try Catch Async Await Operations

**The mistake:** Executing asynchronous operations within Try Catch Async Await without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/try_catch_async_await"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/try_catch_async_await");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in try_catch_async_await: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Async REST Client Error Handling with try...catch...finally

**Scenario:** A network service performs async fetch requests, catching rejected promises and network errors using try...catch...finally.

**Requirements:**
1. Write safeAsyncFetch(fetchFn).
2. Wrap await fetchFn() inside try block.
3. Catch and handle errors in catch block.
4. Perform cleanup in finally block.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function safeAsyncFetch(fetchFn) {
>   let isCompleted = false;
>   try {
>     const data = await fetchFn();
>     return { status: 200, data };
>   } catch (err) {
>     return { status: 500, error: err.message };
>   } finally {
>     isCompleted = true;
>   }
> }
>
> // Verification tests
> const okFetch = async () => "User Data";
> const errFetch = async () => { throw new Error("Connection Refused"); };
>
> safeAsyncFetch(okFetch).then(res => {
>   console.assert(res.status === 200 && res.data === "User Data", "Test 1 Failed");
> });
>
> safeAsyncFetch(errFetch).then(res => {
>   console.assert(res.status === 500 && res.error === "Connection Refused", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **try...catch with await**: Enables handling asynchronous rejected promises using standard synchronous try...catch syntax.
> 2. **Rejected Promise Capture**: A rejected promise awaited inside try block transfers control directly to catch block.
> 3. **finally Block Guarantee**: The finally block executes after try/catch blocks complete, regardless of resolution or rejection.
> 
---

### Exercise 2: Try Catch Async Await Advanced Context Handler

**Scenario:** A web application component processes try catch async await data operations within enterprise workflows.

**Requirements:**
1. Write handleTryCatchAsyncAwaitSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleTryCatchAsyncAwaitSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleTryCatchAsyncAwaitSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Try Catch Async Await Architecture**: Applying try catch async await patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Try Catch Async Await Performance Optimization

**Scenario:** An application utility optimizes try catch async await execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeTryCatchAsyncAwaitTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeTryCatchAsyncAwaitTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeTryCatchAsyncAwaitTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Try Catch Async Await Optimization**: Optimizing try catch async await improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [.then() / .catch()](then_catch.md) — The Promise instance methods replaced by try/catch.
- [Fetch API](fetch_api.md) — The network interface frequently wrapped in try/catch pipelines.
- [Error Handling (try/catch/finally)](error_handling.md) — Related concept: Error Handling (try/catch/finally).

---

## 7. Key Takeaways
- Using `try/catch/finally` with `async/await` allows asynchronous errors to be handled with standard synchronous syntax.
- The engine automatically translates a Promise rejection into a thrown exception when you `await` the Promise.
- Always write the `await` keyword inside the `try` block, or the Promise will return pending, bypassing the `catch` block entirely.
- A single `catch` block can handle both synchronous runtime errors and asynchronous promise rejections.
