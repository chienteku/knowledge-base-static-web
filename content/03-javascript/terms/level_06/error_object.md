# Error object & Error Types

> **Level 6 — Asynchronous JavaScript**
> `Error`, `TypeError`, `RangeError`, custom errors.

---

## 1. Prerequisites
- [`throw` statement](./throw_statement.md) — The keyword used to raise runtime exceptions.
- [Class (extends)](../level_07/extends.md) — The inheritance model used to build custom error classes.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Error Classifier

**Problem:** Complete the code inside the `catch` block to log `"Type Mistake"` if the caught error is a `TypeError`, and `"Generic Mistake"` for all other error types.

```javascript
try {
  const value = null;
  value.toString(); // Throws TypeError
} catch (error) {
  // Check instanceof TypeError
  // Log message
}
```

**Expected output:**
```text
Type Mistake
```

> [!check]- Answer
> - Use the `instanceof` operator: `if (error instanceof TypeError)`.

---

### Exercise 2: Inspecting Built-in Error Types

**Problem:** Trigger and catch a `TypeError` by calling `null.toString()`.

**Expected output:**
```text
TypeError: Cannot read properties of null (reading 'toString')
```

> [!check]- Answer
> ```javascript
> try {
>   null.toString();
> } catch (err) {
>   console.log(`${err.name}: ${err.message}`);
> }
> ```
>
> **Explanation:** `TypeError` is thrown when an operation is performed on an incompatible value type.

### Exercise 3: Custom Error Cause Chaining

**Problem:** Re-throw an error using ES2022 cause option `{ cause: originalError }`.

**Expected output:**
```text
High-level error caused by underlying failure
```

> [!check]- Answer
> ```javascript
> try {
>   try {
>     throw new Error("Low level DB error");
>   } catch (err) {
>     throw new Error("High level error", { cause: err });
>   }
> } catch (outer) {
>   console.log("High-level error caused by underlying failure");
> }
> ```
>
> **Explanation:** `{ cause: err }` chains low-level errors into high-level context errors.

---

---

## 7. Related Terms
- [Error Handling (`try`/`catch`/`finally`)](./error_handling.md) — The code control blocks that capture and inspect Error objects.
- [Class (extends)](../level_07/extends.md) — The syntax mechanism used to create custom subclasses.

---

## 8. Key Takeaways
- The built-in global `Error` object contains a `.message` (description) and a `.stack` (files/lines execution log).
- Specialized subclasses group common failures: `TypeError` (types), `RangeError` (numerical boundaries), `ReferenceError` (unresolved variables), and `SyntaxError` (formatting issues).
- Custom errors can be declared by building classes that inherit from `Error` (always call `super(message)` inside their constructors).
- Use `error instanceof ErrorClass` to check what type of error was caught.
