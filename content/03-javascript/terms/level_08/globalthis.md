# globalThis

> **Level 8 — Modern JavaScript (ES6+)**
> Standard reference to the global object anywhere.

---

## 1. Prerequisites
- [Global Scope](../level_03/global_scope.md) — The outermost execution context where globally accessible variables reside.
- [window object / BOM](../level_05/window_bom.md) — The browser environment's global object.
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Standardized in ES2020. Supported in all modern browsers, Node.js (v12+), and Deno.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Every JavaScript execution environment has a global object that hosts standard global variables, utility functions (like `setTimeout`), and system APIs (like `fetch`). However, because JavaScript is run in diverse environments, they referred to this global object by completely different names:
- **Web Browsers:** `window`, `self`, or `frames`.
- **Node.js:** `global`.
- **Web Workers:** `self`.

This mismatch made it difficult to write "isomorphic" (universal) JavaScript libraries designed to run seamlessly in both the browser and a Node.js backend. Library authors had to write complex detection wrappers just to retrieve the global object:

*Legacy Wrapper:*
```javascript
const getGlobalObject = () => {
  if (typeof self !== "undefined") { return self; }
  if (typeof window !== "undefined") { return window; }
  if (typeof global !== "undefined") { return global; }
  throw new Error("Unable to locate global object");
};
```

To eliminate this fragmentation, ES2020 introduced **`globalThis`**—a standard, unified global variable that is guaranteed to point to the global object of the current execution environment, working identically across browsers, Node.js, and background workers.

### (2) Reality Metaphor
Imagine asking for administrative information while traveling.
- **Before `globalThis`**, you have to speak the local terminology of whichever country you are in. In Web Browser Land, you must ask for directions to the `"Town Hall"` (`window`). In Node.js City, you must ask for the `"Civic Center"` (`global`). In Web Worker Station, you ask for `"Central Hub"` (`self`). If you use Browser terminology inside Node.js, the system breaks.
- **With `globalThis`**, the global community adopts a universal translator keyword: **`globalThis`**. No matter which city, planet, or space colony you stand in, invoking `globalThis` immediately directs you to the administrative headquarters of that environment.

### (3) JavaScript Code Examples

#### Universal Global API Detection
```javascript
// Check if the current environment supports the modern cryptography API
function getSecureCrypto() {
  // globalThis works in Node.js, Browsers, and Web Workers!
  if (globalThis.crypto && typeof globalThis.crypto.subtle !== "undefined") {
    return globalThis.crypto.subtle;
  }
  
  console.warn("Subtle crypto API not supported in this runtime.");
  return null;
}

const cryptoApi = getSecureCrypto();
```

#### Declaring Global Configurations in Shared Scripts
```javascript
// Define a configuration property on the global scope universally
globalThis.__APP_CONFIG__ = {
  version: "2.1.0",
  environment: "production"
};

// In a browser:
// console.log(window.__APP_CONFIG__.version); // "2.1.0"

// In Node.js:
// console.log(global.__APP_CONFIG__.version); // "2.1.0"

// Works everywhere:
console.log(globalThis.__APP_CONFIG__.version); // "2.1.0"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Globalthis Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Globalthis blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "globalthis";
```

*Fix:*
```javascript
let value = "globalthis";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Globalthis Callbacks

**The mistake:** Passing methods from Globalthis instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "globalthis",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "globalthis",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Globalthis Operations

**The mistake:** Executing asynchronous operations within Globalthis without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/globalthis"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/globalthis");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in globalthis: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Universal Logger Checker

**Problem:** Complete the function `hasConsole` to return `true` if a `console` object is defined on the global object in the current environment, and `false` otherwise.

```javascript
function hasConsole() {
  // Return true if console exists on globalThis
}

console.log("Console available?", hasConsole());
```

> [!check]- Answer
> - Check if `globalThis.console` is not `undefined`.

---

### Exercise 2: Environment Agnostic Global Property Access

**Problem:** Read global `Set` constructor via `globalThis.Set`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> console.log(globalThis.Set === Set);
> ```
>
> **Explanation:** `globalThis` provides unified access to standard ECMAScript global objects across runtime hosts.

---

### Exercise 3: Attaching Global Utilities Safely

**Problem:** Attach `globalThis.__DEBUG__ = true` and read it.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> globalThis.__DEBUG__ = true;
> console.log(globalThis.__DEBUG__);
> ```
>
> **Explanation:** `globalThis` serves as standard root storage for global cross-module properties.


---

## 7. Related Terms
- [Node.js](../level_10/node_js.md) — The server-side JavaScript environment which uses `global` as its native global object.
- [Alternative Runtimes (Deno / Bun)](../level_10/alternative_runtimes.md) — Related concept: Alternative Runtimes (Deno / Bun).
---

## 8. Key Takeaways
- `globalThis` is a standard global property pointing to the environment's global object.
- It provides a single, unified reference name that works in Web Browsers (`window`/`self`), Node.js (`global`), and Web Workers (`self`).
- Use `globalThis` to write isomorphic, cross-platform code that runs identically across client and server runtimes.
- Avoid writing properties to `globalThis` unless you explicitly intend to create global variables.
