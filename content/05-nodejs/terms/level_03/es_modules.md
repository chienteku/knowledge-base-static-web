# ES Modules (import, export)

> **Level 3 — Module Systems**
> The modern, official, standardized JavaScript module system adopted by both Node.js and modern web browsers.

---

## 1. Prerequisites
- [CommonJS](../level_03/commonjs.md) — You must understand the legacy system to understand why we upgraded to ES Modules.

---

## 2. Term Category
- **ECMAScript Standard / Module System**

---

## 3. Environment Context
- **Universal** (Supported natively in both Node.js and Modern Browsers).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
For years, the JavaScript ecosystem was fractured. If you wrote backend code in Node.js, you used `require()`. But because browsers didn't understand `require()`, if you wrote frontend code, you had to use complex bundlers like Webpack, or rely on global `<script>` tags. 
In 2015, the official JavaScript committee (ECMA) said: "This is ridiculous. JavaScript needs one, official, universal module system that works everywhere."
They created **ES Modules (ESM)**. Instead of `require`, you use `import`. Instead of `module.exports`, you use `export`. Today, ES Modules are the industry standard for both React frontends and Node.js backends.

### (2) The Syntax

**math.js (The Exporter)**
```javascript
// Named Export
export function add(a, b) {
  return a + b;
}

// Default Export (only one per file)
export default class Calculator {}
```

**app.js (The Importer)**
```javascript
import Calculator, { add } from './math.js';
```

### (3) Asynchronous & Static Analysis
Unlike CommonJS (which halts the program to read files synchronously), ES Modules are **Asynchronous** and **Static**. 
This means before the code even runs, the engine scans all the `import` statements at the top of your files, maps out the entire dependency tree, and can actually completely delete code that you imported but never used (a process called **Tree-Shaking**).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `.js` extension in Node.js

**The mistake:** A developer converts their Node.js app from CommonJS to ESM. They write `import { add } from './math'`. Node.js instantly crashes with "Module Not Found".

**Why it's wrong:** In the old CommonJS days, `require('./math')` would magically assume you meant `.js`. ES Modules in Node.js are strictly compliant with web standards. On the web, URLs require exact filenames. Therefore, in Node.js ESM, you **must** include the `.js` extension: `import { add } from './math.js'`.
*(Note: If you use TypeScript or a bundler like Vite, they hide this rule from you, but native Node.js strictly enforces it).*

---



### Mistake 2: Omitting File Extensions in Relative ESM `import` Statements in Node.js

**The mistake:** Writing `import { user } from './user';` in a Node.js ES Module project.

**Why it's wrong:** Unlike CommonJS `require('./user')`, native Node.js ES Module resolution requires explicit file extensions (`import { user } from './user.js'`).

*Incorrect:*
```javascript
import { helper } from './utils'; // ❌ ERR_MODULE_NOT_FOUND in Node.js ESM!
```

*Fix:*
```javascript
import { helper } from './utils.js'; // Explicit file extension required
```

### Mistake 3: Attempting to `import` CommonJS Named Exports That Use Dynamic Properties

**The mistake:** Writing `import { namedExport } from 'cjs-package';` when `cjs-package` assigns dynamic exports at runtime.

**Why it's wrong:** ESM imports are parsed statically at load time. If a CJS package assigns exports dynamically (`module.exports[name] = ...`), named ESM imports fail. Import default export.

*Incorrect:*
```javascript
import { dynamicFn } from 'cjs-legacy'; // ❌ SyntaxError: Named export not found!
```

*Fix:*
```javascript
import cjsPkg from 'cjs-legacy';
const { dynamicFn } = cjsPkg;
```

## 6. Practice Exercises

### Exercise 1: Enabling ESM in Node

**Problem:** By default, if you try to use `import` in a `.js` file, Node.js will crash and tell you "Cannot use import statement outside a module". How do you tell Node.js to use the new ES Modules system instead of the legacy CommonJS system?

**Expected output:**
```text
You must open your `package.json` file and add the following line:
"type": "module"

This single line tells Node.js: "Stop using legacy CommonJS. Treat all my .js files as modern ES Modules."
```

> [!check]- Answer
> - Which central configuration file controls the settings for your entire Node project?

---



### Exercise 2: Enabling ES Modules via package.json

**Problem:** What key-value pair in `package.json` enables native ES Module mode (`.js` treated as ESM) across a project?

**Expected output:**
```text
type: module
```

> [!check]- Answer
> ```json
> {
>   "type": "module"
> }
> ```
>
> **Explanation:** `"type": "module"` configures Node.js to interpret `.js` files as ES Modules.

### Exercise 3: Top-Level Await in ES Modules

**Problem:** Can `await` be used at the top-level of an ES Module outside an `async` function in Node.js? (Yes/No).

**Expected output:**
```text
Yes (Top-Level Await is natively supported in ES Modules).
```

> [!check]- Answer
> ```javascript
> const res = await fetch('https://api.example.com/data');
> const data = await res.json();
> ```
>
> **Explanation:** ES Modules support Top-Level Await natively without wrapping code in `(async () => {})()`.

## 7. Related Terms
- [CommonJS](../level_03/commonjs.md) — The legacy system that ESM is slowly replacing.
- [package.json](../level_04/package_json.md) — Where you configure Node to use `"type": "module"`.

---

## 8. Key Takeaways
- **ES Modules (ESM)** is the modern, universal standard for sharing JavaScript code across files.
- It uses **`import`** and **`export`** syntax.
- It is supported by both Browsers and Node.js.
- To use it in Node.js, you must add `"type": "module"` to your `package.json` and include `.js` file extensions in your import paths.
