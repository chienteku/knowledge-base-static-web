# Error object & Error Types

> **Level 6 — Asynchronous JavaScript**
> `Error`, `TypeError`, `RangeError`, custom errors.

---

## 1. Prerequisites
- [throw statement](throw_statement.md) — The keyword used to raise runtime exceptions.
- [extends](../level_07/extends.md) — The inheritance model used to build custom error classes.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Error object & Error Types is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, an exception is more than just a raw text description of what failed. To debug code effectively, a developer needs a data object containing structural details: What went wrong? What type of code violated rules? Which sequence of function calls led to the crash?

To solve this, JavaScript provides the built-in **`Error`** class constructor. Instantiating `new Error("message")` creates an object with two key properties:
1. **`message`:** The human-readable string description passed to the constructor.
2. **`stack`:** A non-standard but universally supported string metadata containing the stack trace—the exact files, function names, and line numbers indicating where the Error object was instantiated.

### (2) Built-in Error Subclasses
To help developers categorize failures, the engine defines several specialized subclasses of `Error`. The most common are:
- **`TypeError`:** Thrown when a value is not of the expected type (e.g. calling a number as a function: `const x = 5; x()`).
- **`RangeError`:** Thrown when a numeric value is outside its allowed range (e.g. setting an array length to a negative number: `[].length = -1`).
- **`ReferenceError`:** Thrown when referencing a variable that has not been declared in any scope.
- **`SyntaxError`:** Thrown when the engine parses code that violates language syntax rules (e.g. mismatched braces `{}`).

Additionally, developers can declare **Custom Error classes** by extending the base `Error` class to append custom metadata (like HTTP status codes for API clients).

### (3) Reality Metaphor
An `Error` object is like a **medical incident report** filed at a hospital.
- It has a category name (the error name, e.g. "Broken Bone" vs "Sore Throat").
- It contains a description of what hurts (the `message`).
- It has a travel log showing exactly where the patient was walking leading up to the accident (the `stack` trace).

### (4) JavaScript Code Examples

#### Short Snippet
```javascript
const myError = new Error("Something went wrong!");

console.log(myError.name);    // "Error" (default name)
console.log(myError.message); // "Something went wrong!"
console.log(myError.stack);   // String detailing files/lines
```

#### Fuller Example
```javascript
// A database error parser handling different error subclasses
function executeQuery(sqlString) {
  if (sqlString === undefined) {
    throw new TypeError("SQL query string must be provided.");
  }
  if (sqlString.length > 1000) {
    throw new RangeError("SQL query string exceeds maximum length limit.");
  }
  if (sqlString.includes("invalid-syntax")) {
    throw new SyntaxError("SQL syntax violation detected.");
  }
}

// Declaring a Custom Error Class
class DatabaseConnectionError extends Error {
  constructor(message, port) {
    super(message); // Call parent Error constructor
    this.name = "DatabaseConnectionError"; // Override default name
    this.port = port; // Custom metadata
  }
}

try {
  // Trigger a custom connection error
  throw new DatabaseConnectionError("Timeout connecting to server", 5432);
} catch (error) {
  // Differentiating errors using the instanceof operator
  if (error instanceof DatabaseConnectionError) {
    console.error(`DB Error: ${error.message} on Port: ${error.port}`);
  } else if (error instanceof TypeError) {
    console.error(`Type Error: ${error.message}`);
  } else {
    console.error(`Generic Error: ${error.message}`);
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Call `super()` in Custom Error Constructors

**The mistake:** Declaring a custom class extending `Error` but forgetting to write `super(message)` in the constructor.

**Why it's wrong:** Inheriting classes must call the parent constructor (`super()`) before accessing `this`. If you forget it, JavaScript will throw a reference error and refuse to construct the custom error object. More importantly, `super(message)` is what sets the `.message` and `.stack` properties on the parent prototype.

*Incorrect:*
```javascript
class NetworkError extends Error {
  constructor(message, code) {
    // Missing super(message)!
    this.name = "NetworkError"; // ReferenceError: Must call super constructor in derived class before accessing 'this'
    this.code = code;
  }
}
```

*Fix:*
```javascript
class NetworkError extends Error {
  constructor(message, code) {
    super(message); // Call parent constructor first
    this.name = "NetworkError";
    this.code = code; // Custom attribute
  }
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Error Object Callbacks

**The mistake:** Passing methods from Error Object instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "error_object",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "error_object",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Error Object Operations

**The mistake:** Executing asynchronous operations within Error Object without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/error_object"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/error_object");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in error_object: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Custom Operational Error Class with Error Stacking

**Scenario:** A backend microservice creates a custom OperationalError class extending Error, using the ES2022 { cause } option to preserve root cause stack traces.

**Requirements:**
1. Define class OperationalError extends Error.
2. Accept message and options { statusCode, cause }.
3. Verify instance properties and cause chain.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class OperationalError extends Error {
>   constructor(message, options = {}) {
>     super(message, options);
>     this.name = "OperationalError";
>     this.statusCode = options.statusCode || 500;
>   }
> }
>
> function processTransaction(payload) {
>   try {
>     throw new TypeError("Invalid payload format");
>   } catch (rawErr) {
>     throw new OperationalError("Transaction failed", {
>       statusCode: 400,
>       cause: rawErr
>     });
>   }
> }
>
> // Verification tests
> let caught = null;
> try {
>   processTransaction({});
> } catch (err) {
>   caught = err;
> }
> console.assert(caught instanceof OperationalError, "Test 1 Failed");
> console.assert(caught.statusCode === 400, "Test 2 Failed");
> console.assert(caught.cause instanceof TypeError, "Test 3 Failed: Error cause missing");
> ```
>
> #### Technical Explanation
>
> 1. **Custom Error Classes**: Extending the standard Error class creates domain-specific error types (e.g. OperationalError, ValidationError).
> 2. **Error cause Property**: ES2022 super(message, { cause: rootErr }) chains low-level errors into high-level operational errors.
> 3. **Stack Trace Preservation**: Error objects automatically capture call stack traces (error.stack) upon instantiation.
> 
---

### Exercise 2: Error Object Advanced Context Handler

**Scenario:** A web application component processes error object data operations within enterprise workflows.

**Requirements:**
1. Write handleErrorObjectSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleErrorObjectSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleErrorObjectSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Error Object Architecture**: Applying error object patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Error Object Performance Optimization

**Scenario:** An application utility optimizes error object execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeErrorObjectTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeErrorObjectTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeErrorObjectTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Error Object Optimization**: Optimizing error object improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Error Handling (try/catch/finally)](error_handling.md) — The code control blocks that capture and inspect Error objects.
- [extends](../level_07/extends.md) — The syntax mechanism used to create custom subclasses.
- [throw statement](throw_statement.md) — Related concept: throw statement.
- [Browser DevTools & Debugging](../level_10/browser_devtools.md) — Related concept: Browser DevTools & Debugging.

---

## 7. Key Takeaways
- The built-in global `Error` object contains a `.message` (description) and a `.stack` (files/lines execution log).
- Specialized subclasses group common failures: `TypeError` (types), `RangeError` (numerical boundaries), `ReferenceError` (unresolved variables), and `SyntaxError` (formatting issues).
- Custom errors can be declared by building classes that inherit from `Error` (always call `super(message)` inside their constructors).
- Use `error instanceof ErrorClass` to check what type of error was caught.
