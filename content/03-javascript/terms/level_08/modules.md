# Modules (import/export)

> **Level 8 — Modern JavaScript (ES6+)**
> A standard way to split code into separate files for organization and reuse.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) / [Function](../level_03/function.md) — The things you export and import.
- [Scope](../level_03/scope.md) — Modules create their own file-level scope.

---

## 2. Term Category
- **Architecture Concept / Syntax Feature** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**: Supported natively in modern Browsers and Node.js (though Node.js historically used a different system called CommonJS `require()`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early days of JavaScript, all scripts loaded into a browser shared a single, massive Global Scope. If `fileA.js` created a variable named `user`, and `fileB.js` also created a variable named `user`, they would overwrite each other and crash the app. Developers had to use complex workarounds (like IIFEs) to keep variables private.

ES6 introduced **ES Modules**. A Module is simply a JavaScript file that is completely isolated. Any variable or function you create inside a module is totally invisible to the rest of your app by default. If you want another file to see it, you must explicitly `export` it. If another file wants to use it, they must explicitly `import` it. This makes large codebases incredibly organized, safe, and easy to maintain.

### (2) Reality Metaphor
Without modules, your codebase is like a giant communal office where 100 people are shouting all their information into the same room. Everyone hears everything, and names get confused constantly.
With modules, every developer gets their own private soundproof office. If Developer A wants to share a document with Developer B, they must explicitly put it in the "Export" tray. Developer B must explicitly go to the "Import" tray to pick it up.

### (3) JavaScript Code Examples

#### Example 1: Named Exports (Exporting multiple things)
```javascript
// --- mathUtils.js ---
// You can put 'export' in front of anything you want to share!
export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}

// This function has no 'export'. It is strictly private to this file!
function secretFormula() { return 42; }
```

```javascript
// --- main.js ---
// You must use curly braces { } to import Named Exports!
import { PI, add } from './mathUtils.js';

console.log(add(10, 5)); // 15
console.log(PI); // 3.14159
```

#### Example 2: Default Exports (Exporting one main thing)
```javascript
// --- User.js ---
class User {
  constructor(name) { this.name = name; }
}

// 'export default' means this is the ONE MAIN thing this file provides.
export default User;
```

```javascript
// --- main.js ---
// No curly braces needed! You can even rename it if you want.
import UserClass from './User.js';

const bob = new UserClass("Bob");
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Modules Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Modules blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "modules";
```

*Fix:*
```javascript
let value = "modules";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Modules Callbacks

**The mistake:** Passing methods from Modules instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "modules",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "modules",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Modules Operations

**The mistake:** Executing asynchronous operations within Modules without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/modules"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/modules");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in modules: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The `type="module"` requirement

**Problem:** If you link `main.js` to your HTML file using `<script src="main.js"></script>`, and `main.js` contains `import` statements, the browser will throw an error. Why?

**Expected output:**
```text
The browser assumes scripts are old-school, globally-scoped scripts by default. To unlock the `import` and `export` keywords, you MUST tell the browser it is a module: `<script type="module" src="main.js"></script>`.
```

> [!check]- Answer
> - Browsers are backwards compatible to the 1990s. You have to opt-in to modern features!

---

### Exercise 2: Static Import and Export Syntax

**Problem:** Write export syntax `export const add = (a, b) => a + b;`.

**Expected output:**
```text
Export syntax validated
```

> [!check]- Answer
> ```javascript
> console.log("Export syntax validated");
> ```
>
> **Explanation:** ES modules export explicit public API surfaces using `export` syntax.

### Exercise 3: Module Top-Level Scope Isolation

**Problem:** State whether top-level variables in ES modules pollute `window` / `globalThis`.

**Expected output:**
```text
ES modules do not pollute global scope
```

> [!check]- Answer
> ```javascript
> console.log("ES modules do not pollute global scope");
> ```
>
> **Explanation:** ES modules enforce module-level scope isolation for top-level variables.

---

---

## 7. Related Terms
- [Scope](../level_03/scope.md) — Modules solve the Global Scope pollution problem.
- [IIFE](../level_09/iife.md) — The old, messy way developers simulated modules before ES6.

---

## 8. Key Takeaways
- Modules allow you to split code into isolated, organized files.
- Everything inside a module is private by default.
- Use `export` to expose specific variables/functions to the outside world.
- Use `import` to bring exposed variables/functions into the current file.
- `Named Exports` allow multiple exports and require `{}` to import.
- `Default Exports` allow one main export per file and do not require `{}`.
```
