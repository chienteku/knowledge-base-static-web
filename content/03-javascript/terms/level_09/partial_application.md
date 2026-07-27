# Partial Application

> **Level 9 — Advanced Concepts & Patterns**
> Fixing some arguments of a function.

---

## 1. Prerequisites
- [Closure](../level_03/closure.md) — The mechanism preserving scope variables.
- [`call` / `apply` / `bind`](../level_07/call_apply_bind.md) — Explicit context and argument binding.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In functional programming, we often work with generic, multi-argument helper functions. However, writing out the same repeated arguments over and over is verbose and error-prone (e.g. repeatedly calling a logging function like `log("DEBUG", "Database", message)`).

Instead of repeating parameters, we can create a specialized version of the function with some of its arguments pre-filled ("fixed"). 

This technique is called **Partial Application**:
- It takes a function that accepts $N$ arguments, fixes values for a subset of them (e.g., the first 2 arguments), and returns a new function that accepts the remaining arguments.
- **Implementation Methods:** You can implement partial application using closures or built-in methods like **`Function.prototype.bind()`**.

#### Partial Application vs. Currying
These two concepts are related but distinct:
- **Currying** transforms a function of $N$ arguments into a strict chain of $N$ nested functions, each accepting **exactly one** argument: `f(a)(b)(c)`.
- **Partial Application** binds a batch of arguments all at once, returning a function that accepts **multiple** remaining arguments: `f(a, b)(c, d)`.

### (2) Reality Metaphor
Imagine operating a DSLR camera.
- A **standard function** is like taking a photo in full manual mode. Every single time you want to capture a shot, you must manually dial three parameters: Shutter Speed (Arg 1), Aperture (Arg 2), and ISO (Arg 3).
- **Partial Application** is like switching to a custom **"Action Sports" Preset Mode**. This mode automatically locks the Shutter Speed and Aperture (fixed arguments) to optimal settings. It hands you a camera where you only need to dial the ISO (remaining argument) to capture the photo, making the process much faster.

### (3) JavaScript Code Examples

#### Creating Specialized Loggers using Closures
```javascript
// A generic logger function taking 3 arguments
const logger = (level, component, message) => {
  console.log(`[${level}] (${component}) ${message}`);
};

// 1. Partial Application using Closures (arrow functions)
// We pre-fill "ERROR" and "AuthService"
const authErrorLogger = (message) => logger("ERROR", "AuthService", message);

authErrorLogger("Login failed: password mismatch."); 
// Logs: "[ERROR] (AuthService) Login failed: password mismatch."
```

#### Partial Application using `bind()`
```javascript
const multiply = (factor, number) => factor * number;

// 2. Partial Application using bind
// Argument 1 is the 'this' context (passed as null)
// Argument 2 binds 'factor' to 2
const double = multiply.bind(null, 2);
const triple = multiply.bind(null, 3);

console.log(double(15)); // 30
console.log(triple(15)); // 45
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing parameter position in `bind()`

**The mistake:** Calling `myFn.bind(2)` expecting it to bind the first argument to `2`.

**Why it's wrong:** The very first parameter of `.bind()` always overrides the function's internal **`this`** execution context, not its standard arguments. To bind arguments, you must pass the `this` argument first (use `null` or `undefined` if `this` doesn't matter), followed by the values to pre-fill.

*Incorrect:*
```javascript
const double = multiply.bind(2); // Binds 'this' to 2! 'factor' remains unbound.
console.log(double(10));          // NaN (factor becomes 10, number becomes undefined!)
```

*Fix:*
```javascript
const double = multiply.bind(null, 2); // Binds 'this' to null, binds first arg 'factor' to 2
console.log(double(10));               // 20
```

---

### Mistake 2: Losing Context Binding (`this`) in Partial Application Callbacks

**The mistake:** Passing methods from Partial Application instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "partial_application",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "partial_application",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Partial Application Operations

**The mistake:** Executing asynchronous operations within Partial Application without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/partial_application"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/partial_application");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in partial_application: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: API Request Builder

**Problem:** Complete the code to partially apply `fetchApi` using `.bind()`, creating a specialized function `fetchUsers` that fixes the host parameter to `"https://api.example.com"` and the endpoint to `"/users"`.

```javascript
function fetchApi(host, endpoint, options) {
  console.log(`Calling ${host}${endpoint} with options:`, options);
}

// Partially apply fetchApi
const fetchUsers = // Write code here

fetchUsers({ method: "GET" });
```

**Expected output:**
```text
Calling https://api.example.com/users with options: { method: 'GET' }
```

> [!check]- Answer
> - Bind the first two arguments by writing `fetchApi.bind(null, "https://api.example.com", "/users")`.

---

### Exercise 2: Partial Application with `bind()`

**Problem:** Use `fn.bind(null, 10)` to fix the first argument of `function add(a, b) { return a + b; }`.

**Expected output:**
```text
15
```

> [!check]- Answer
> ```javascript
> function add(a, b) { return a + b; }
> const addTen = add.bind(null, 10);
> console.log(addTen(5));
> ```
>
> **Explanation:** `.bind(thisArg, ...preboundArgs)` partially applies leading function arguments.

### Exercise 3: Custom `partial(fn, ...preset)` Helper

**Problem:** Write a `partial(fn, ...preset)` helper function.

**Expected output:**
```text
Hello Alice
```

> [!check]- Answer
> ```javascript
> function partial(fn, ...preset) {
>   return (...later) => fn(...preset, ...later);
> }
> const greet = (salutation, name) => `${salutation} ${name}`;
> const sayHello = partial(greet, "Hello");
> console.log(sayHello("Alice"));
> ```
>
> **Explanation:** Partial application pre-binds specific parameter values ahead of time.

---

---

## 7. Related Terms
- [Currying](./currying.md) — The transformation of a function into a nested chain of single-argument functions.

---

## 8. Key Takeaways
- Partial Application binds a subset of a function's arguments, returning a new function that accepts the remaining arguments.
- It differs from Currying: Currying splits arguments into single-parameter chains, whereas Partial Application binds multiple values at once.
- Implement partial application using `fn.bind(thisArg, ...boundArgs)` or by creating nested arrow function closures.
- Always pass `null` or `undefined` as the first argument in `.bind()` if you only intend to bind parameters without altering the `this` context.
