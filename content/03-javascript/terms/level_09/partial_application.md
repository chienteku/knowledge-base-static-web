# Partial Application

> **Level 9 — Advanced Concepts & Patterns**
> Fixing some arguments of a function.

---

## 1. Prerequisites
- [Closure](../level_03/closure.md) — The mechanism preserving scope variables.
- [call / apply / bind](../level_07/call_apply_bind.md) — Explicit context and argument binding.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Partial Application is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Pre-filling API Endpoint URL Parameters with partial()

**Scenario:** An HTTP gateway client uses a `partial(fn, ...presetArgs)` utility to pre-bind API base URLs and headers to generic request handlers.

**Requirements:**
1. Write partial(fn, ...presetArgs).
2. Return function combining presetArgs with fresh call arguments.
3. Preserve function context.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function partial(fn, ...presetArgs) {
>   return function(...laterArgs) {
>     return fn.apply(this, [...presetArgs, ...laterArgs]);
>   };
> }
>
> // Verification tests
> const fetchApi = (baseUrl, endpoint, query) => `${baseUrl}/${endpoint}?q=${query}`;
> const fetchFromV1 = partial(fetchApi, "https://api.example.com/v1");
>
> console.assert(
>   fetchFromV1("users", "active") === "https://api.example.com/v1/users?q=active", 
>   "Test 1 Failed"
> );
> ```
>
> #### Technical Explanation
>
> 1. **Partial Application Definition**: Binding fixed values to a subset of a function's parameters, producing a function of smaller arity.
> 2. **Partial Application vs Currying**: Partial application pre-binds ANY number of arguments at once; Currying strictly transforms to single-argument function chains.
> 3. **Argument Concatenation**: Combines presetArgs with laterArgs using ES6 spread operator.
> 
---

### Exercise 2: Event Handler Listener Pre-binding with Fixed Options

**Scenario:** A UI component pre-binds specific action names and component IDs to generic event click handlers using partial application.

**Requirements:**
1. Write handleAction(componentId, actionType, event).
2. Use partial application to create onClickSave listener.
3. Verify event payload.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleAction(componentId, actionType, event) {
>   return {
>     targetId: componentId,
>     action: actionType,
>     eventType: event ? event.type : "unknown"
>   };
> }
>
> function partial(fn, ...presetArgs) {
>   return function(...laterArgs) {
>     return fn.apply(this, [...presetArgs, ...laterArgs]);
>   };
> }
>
> // Verification tests
> const onSaveUser = partial(handleAction, "user-form-101", "SAVE");
> const result = onSaveUser({ type: "click" });
>
> console.assert(result.targetId === "user-form-101", "Test 1 Failed");
> console.assert(result.action === "SAVE", "Test 2 Failed");
> console.assert(result.eventType === "click", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Event Callback Adaptors**: Pre-binding contextual variables (IDs, types) makes generic event callbacks compatible with DOM event signatures.
> 2. **Cleaner Template Bindings**: Eliminates inline arrow functions inside repeated UI render loops.
> 3. **Closure Variable Retention**: Preset arguments are retained inside closure scope across multiple event trigger invocations.
> 
---

### Exercise 3: Placeholder-Supported Partial Application Utility

**Scenario:** A math utility library builds a flexible `partialWithPlaceholders` function supporting placeholder symbols (`_`) for arbitrary argument slot pre-binding.

**Requirements:**
1. Write partialWithPlaceholders(fn, ...presetArgs).
2. Use symbol _ as placeholder.
3. Fill placeholder slots with laterArgs.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const _ = Symbol("PLACEHOLDER");
>
> function partialWithPlaceholders(fn, ...presetArgs) {
>   return function(...laterArgs) {
>     let laterIdx = 0;
>     const finalArgs = presetArgs.map(arg => {
>       if (arg === _) {
>         return laterArgs[laterIdx++];
>       }
>       return arg;
>     });
>
>     while (laterIdx < laterArgs.length) {
>       finalArgs.push(laterArgs[laterIdx++]);
>     }
>
>     return fn.apply(this, finalArgs);
>   };
> }
>
> // Verification tests
> const divide = (numerator, denominator) => numerator / denominator;
> const divideByTwo = partialWithPlaceholders(divide, _, 2);
>
> console.assert(divideByTwo(10) === 5, "Test 1 Failed: 10 / 2 = 5");
>
> const divideTenBy = partialWithPlaceholders(divide, 10, _);
> console.assert(divideTenBy(2) === 5, "Test 2 Failed: 10 / 2 = 5");
> ```
>
> #### Technical Explanation
>
> 1. **Arbitrary Parameter Pre-binding**: Placeholder symbols allow pre-binding trailing or middle arguments while leaving leading slots open.
> 2. **Symbol Unique Identifier**: Using a unique Symbol ensures placeholders never collide with valid primitive values.
> 3. **Flexible Argument Filling**: Iterates preset argument templates, filling placeholder slots sequentially from provided runtime arguments.
---

## 6. Related Terms
- [Currying](currying.md) — The transformation of a function into a nested chain of single-argument functions.
- [Functional Programming & Composition](functional_programming.md) — Related concept: Functional Programming & Composition.

---

## 7. Key Takeaways
- Partial Application binds a subset of a function's arguments, returning a new function that accepts the remaining arguments.
- It differs from Currying: Currying splits arguments into single-parameter chains, whereas Partial Application binds multiple values at once.
- Implement partial application using `fn.bind(thisArg, ...boundArgs)` or by creating nested arrow function closures.
- Always pass `null` or `undefined` as the first argument in `.bind()` if you only intend to bind parameters without altering the `this` context.
