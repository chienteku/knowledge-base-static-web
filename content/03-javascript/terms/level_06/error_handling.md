# Error Handling (try/catch/finally)

> **Level 6 — Asynchronous JavaScript**
> Structured exception handling flow.

---

## 1. Prerequisites
- [Statement](../level_01/statement.md) — An instruction that performs an action.
- [Function](../level_03/function.md) — A reusable block of code designed to perform a task.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Error Handling (try/catch/finally) is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In programming, things will inevitably go wrong: network requests fail, users input invalid text, database queries time out, or developers make typos. When JavaScript encounters a runtime error (an "exception"), its default behavior is to halt execution immediately, print an error stack trace, and crash the thread.

To prevent applications from crashing on users, the TC39 committee built the **`try...catch...finally`** statement. This structured error-handling construct allows developers to:
1. **`try`** executing risky code in a protected block.
2. **`catch`** any thrown errors, inspect them, log details, and execute fallback/recovery logic instead of crashing.
3. **`finally`** execute cleanup operations (like closing connections, removing loaders) that must run *regardless* of whether the code succeeded or failed.

### (2) Reality Metaphor
`try...catch...finally` is like a safety net system for a trapeze artist in a circus.
- **`try`** is the trapeze artist executing a dangerous jump in the air.
- **`catch`** is the safety net placed beneath them. If the artist misses the bar and falls (throws an exception), the net catches them safely so they don't crash onto the hard ground (no application crash).
- **`finally`** is the circus crew cleaning and sweeping the arena floor after the act. The floor must be swept whether the artist caught the bar successfully or fell into the net.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
try {
  // Call a function that does not exist
  nonExistentFunction(); 
} catch (error) {
  console.log("An error occurred: " + error.message);
} finally {
  console.log("This will always print.");
}
```

#### Fuller Example
```javascript
// A safe JSON parsing configuration client
const invalidJSON = "{ name: 'Alice' }"; // Missing double quotes around keys!
const validJSON = '{ "name": "Alice" }';

function parseConfigSafe(jsonString) {
  let config = null;

  console.log("--- Starting JSON Parsing ---");
  
  try {
    // 1. JSON.parse will throw an error if the string is invalid
    config = JSON.parse(jsonString);
    console.log("Success! Configuration loaded.");
  } catch (error) {
    // 2. This block runs ONLY if an exception is thrown in the try block
    console.warn("Parsing failed! Loading default fallback configuration.");
    console.warn("Reason:", error.message);
    config = { name: "Default Guest" }; // Fallback value
  } finally {
    // 3. This block ALWAYS runs, even if try succeeded or catch ran
    console.log("Cleanup: Closing file streams...");
  }

  return config;
}

const user1 = parseConfigSafe(invalidJSON);
console.log("Parsed User 1:", user1);

console.log("\n");

const user2 = parseConfigSafe(validJSON);
console.log("Parsed User 2:", user2);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Synchronous `try/catch` to Catch Asynchronous Errors

**The mistake:** Wrapping a `setTimeout` or a Promise call in a synchronous `try/catch` block expecting to intercept errors thrown inside the callback.

**Why it's wrong:** The `try` block executes the timer setup synchronously and finishes immediately. By the time the asynchronous callback timer fires (e.g. 1 second later), the `try/catch` statement has already finished executing and is off the Call Stack. The exception will go uncaught, crashing the program.

*Incorrect:*
```javascript
try {
  setTimeout(() => {
    // Thrown 1s later when call stack has unwound from try/catch!
    throw new Error("Async failure!"); 
  }, 1000);
} catch (error) {
  console.log("Caught:", error.message); // This will NOT run! Uncaught Error!
}
```

*Fix:*
```javascript
// Place the try/catch INSIDE the asynchronous callback function
setTimeout(() => {
  try {
    throw new Error("Async failure!");
  } catch (error) {
    console.log("Caught:", error.message); // Correctly caught!
  }
}, 1000);
```

---

### Mistake 2: Losing Context Binding (`this`) in Error Handling Callbacks

**The mistake:** Passing methods from Error Handling instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "error_handling",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "error_handling",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Error Handling Operations

**The mistake:** Executing asynchronous operations within Error Handling without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/error_handling"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/error_handling");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in error_handling: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Centralized API Gateway Response Error Handler

**Scenario:** An API client implements centralized error handling, catching network errors, HTTP 4xx/5xx status errors, and JSON parse errors.

**Requirements:**
1. Write handleApiResponse(responseObj).
2. Check responseObj.ok status.
3. Throw custom error if not ok.
4. Parse JSON data cleanly.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleApiResponse(responseObj) {
>   if (!responseObj) {
>     throw new Error("Network Error: No response received");
>   }
>   if (!responseObj.ok) {
>     const status = responseObj.status || 500;
>     const err = new Error(`HTTP Error: ${status}`);
>     // @ts-ignore
>     err.status = status;
>     throw err;
>   }
>   return responseObj.data;
> }
>
> // Verification tests
> console.assert(handleApiResponse({ ok: true, data: { user: "Alice" } }).user === "Alice", "Test 1 Failed");
>
> let errorCaught = false;
> try {
>   handleApiResponse({ ok: false, status: 404 });
> } catch (err) {
>   errorCaught = err.message.includes("404");
> }
> console.assert(errorCaught === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Centralized Error Strategy**: Centralizing error handling logic guarantees consistent error normalization across microservices.
> 2. **Defensive Validation**: Validate response objects and HTTP status codes before consuming payload data.
> 3. **Explicit Error Re-throwing**: Throw descriptive Error instances to trigger outer catch blocks.
> 
---

### Exercise 2: Error Handling Advanced Context Handler

**Scenario:** A web application component processes error handling data operations within enterprise workflows.

**Requirements:**
1. Write handleErrorHandlingSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleErrorHandlingSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleErrorHandlingSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Error Handling Architecture**: Applying error handling patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Error Handling Performance Optimization

**Scenario:** An application utility optimizes error handling execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeErrorHandlingTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeErrorHandlingTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeErrorHandlingTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Error Handling Optimization**: Optimizing error handling improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [throw statement](throw_statement.md) — The keyword used to raise exceptions.
- [Error object & Error Types](error_object.md) — The metadata wrapper representing runtime failures.
- [try/catch with async/await](try_catch_async_await.md) — Handling asynchronous errors in synchronous-looking code.

---

## 7. Key Takeaways
- `try...catch...finally` protects application execution paths from runtime exceptions.
- The `try` block holds code that might throw an error.
- The `catch(error)` block intercept errors, receiving the error details as an argument.
- The `finally` block executes *always*, making it ideal for freeing memory, closing files, or toggling state loaders.
- Synchronous `try/catch` blocks cannot intercept errors thrown in asynchronous execution paths (callbacks/timers); place the `try/catch` directly inside the callback body.
