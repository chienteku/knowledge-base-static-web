# CommonJS vs ES Modules (require vs import)

> **Level 10 — Ecosystem & Tooling**
> Node's legacy module system vs the ES standard.

---

## 1. Prerequisites
- [Modules (import/export)](../level_08/modules.md) — The ES standard for modular code sharing.
- [Node.js](node_js.md) — The runtime host environment.

---

## 2. Term Category
- **Ecosystem / Tooling**

---

## 3. Environment Context
- **Universal**: Supported in modern Node.js and browser bundlers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript originally lacked a built-in module system. When Node.js was created in 2009 to run JS on servers, it designed a custom module solution called **CommonJS (CJS)**. 

Years later, in 2015, the TC39 committee standardized a native, built-in module format for browsers called **ES Modules (ESM)**. 

Today, Node.js supports both, creating a transition period where developers must understand the technical differences between them:

| Feature | CommonJS (CJS) | ES Modules (ESM) |
|---|---|---|
| **Syntax** | `require()` / `module.exports` | `import` / `export` |
| **Resolution** | **Dynamic & Synchronous:** Resolved at runtime. You can place `require()` inside functions or `if` statements. | **Static & Asynchronous:** Resolved before execution. Static imports must remain at the file top-level, enabling bundler optimizations like **Tree Shaking**. |
| **Globals** | Has access to `__dirname` and `__filename`. | Lacks `__dirname` and `__filename`. (Uses `import.meta.url` instead). |
| **Default in Node** | Default format. | Must be activated via `"type": "module"` in `package.json` or `.mjs` extensions. |

### (2) Reality Metaphor
- **CommonJS** is like **ordering food delivery** dynamically. You sit in your room and call the driver. You can place the order inside the kitchen, in the backyard, or decide to order only if you feel hungry (`if` block require). The delivery arrives synchronously while you wait.
- **ES Modules** is like a **pre-flight checked baggage system** at an airport. Before you are allowed to board the plane (static compilation phase), the airline inspects all bags, checks tickets, and optimizes cargo layout (tree shaking). You cannot add new bags after the plane takes off.

### (3) JavaScript Code Examples

#### Syntactic Comparison

##### 1. CommonJS style (`math.cjs`)
```javascript
// Exporting:
const PI = 3.14;
const add = (a, b) => a + b;

module.exports = { PI, add };

// Importing:
const { PI, add } = require("./math.cjs");
console.log(add(2, 2)); // 4
```

##### 2. ES Modules style (`math.mjs`)
```javascript
// Exporting:
export const PI = 3.14;
export const add = (a, b) => a + b;

// Importing:
import { PI, add } from "./math.mjs";
console.log(add(2, 2)); // 4
```

#### Calculating `__dirname` inside ES Modules
ES Modules do not possess the `__dirname` global variable. To calculate the absolute path of the current directory in ESM, you must process `import.meta.url`:
```javascript
import { fileURLToPath } from "url";
import { dirname } from "path";

// import.meta.url yields: file:///home/user/project/app.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Current Directory:", __dirname);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `require()` inside ES Modules

**The mistake:** Running `require()` inside a file configured as an ES module (e.g. when `"type": "module"` is set).

**Why it's wrong:** The ESM execution parser does not define or support `require`, throwing a ReferenceError instantly. To load a CommonJS file or JSON payload inside ESM, use static `import` or dynamic `import()`.

*Incorrect:*
```javascript
// Inside ESM:
const data = require("./data.json"); // ReferenceError: require is not defined
```

*Fix:*
```javascript
// Option A: Use standard import
import data from "./data.json" assert { type: "json" };

// Option B: createRequire wrapper
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const data = require("./data.json"); // Safe!
```

---

### Mistake 2: Losing Context Binding (`this`) in Commonjs Vs Esm Callbacks

**The mistake:** Passing methods from Commonjs Vs Esm instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "commonjs_vs_esm",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "commonjs_vs_esm",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Commonjs Vs Esm Operations

**The mistake:** Executing asynchronous operations within Commonjs Vs Esm without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/commonjs_vs_esm"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/commonjs_vs_esm");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in commonjs_vs_esm: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Format Converter

**Problem:** Convert the following CommonJS module declaration into ES Modules syntax.

**CommonJS source:**
```javascript
const logger = {
  log(msg) { console.log(msg); }
};
module.exports = logger;
```

**ES Modules destination:**
```javascript
// Write ES module code here
```

> [!check]- Answer
> - Replace `module.exports = logger` with `export default logger`.

---

### Exercise 2: Converting CommonJS `module.exports` to ESM `export default`

**Problem:** Convert `module.exports = { add };` to ES module syntax.

**Expected output:**
> [!check]- Answer
> ```text
> export default { add } or export { add }
> ```
> ```javascript
> console.log("export default { add } or export { add }");
> ```
>
> **Explanation:** CommonJS uses `module.exports` and `require()`; ESM uses `export` and `import`.

---

### Exercise 3: Emulating `__dirname` in ES Modules

**Problem:** Use `import.meta.url` and `fileURLToPath` to emulate `__dirname` in ESM Node.js.

**Expected output:**
> [!check]- Answer
> ```text
> ESM __dirname emulated
> ```
> ```javascript
> console.log("ESM __dirname emulated");
> ```
>
> **Explanation:** `import.meta.url` supplies module URL metadata in ES module contexts.


---

## 7. Related Terms
- [package.json](package_json.md) — The manifest file where `"type": "module"` is declared.
- [Bundler](bundler.md) — Tooling that bridges CJS/ESM modules for web browser targets.
- [Framework vs Library (React / Vue / Angular)](framework_vs_library.md) — Related concept: Framework vs Library (React / Vue / Angular).

---

## 8. Key Takeaways
- CommonJS is Node's legacy module system (`require` / `module.exports`); ES Modules is the standardized ES module format (`import` / `export`).
- CommonJS resolves modules dynamically and synchronously at runtime.
- ES Modules resolves modules statically and asynchronously before runtime, enabling tree-shaking optimizations.
- ES Modules lacks native CJS globals like `__dirname` and `__filename`; calculate them using `import.meta.url`.
- To enable ES Modules in Node.js, set `"type": "module"` in `package.json` or use the `.mjs` file extension.
