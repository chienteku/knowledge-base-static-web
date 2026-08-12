# ES Modules (import, export)

> **Level 3 — Module Systems**
> The modern, official, standardized JavaScript module system adopted by both Node.js and modern web browsers.

---

## 1. Prerequisites
- [CommonJS (require, module.exports)](commonjs.md) — You must understand the legacy system to understand why we upgraded to ES Modules.

---

## 2. Term Category

**ECMAScript Standard / Module System (Universal .)**: ES Modules (import, export) is a fundamental concept in this technology stack. **Level 3 — Module Systems**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Dynamic ESM Interoperability Module Loader

**Scenario:** An API server loads ES Modules dynamically using `import()` from a CommonJS context, wrapping errors for unsupported specifiers.

**Requirements:**
1. Write loadEsmDynamic(specifier, mockImportFn).
2. Invoke dynamic import().
3. Return module namespace object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function loadEsmDynamic(specifier, mockImportFn) {
>   if (!specifier || typeof specifier !== "string") {
>     throw new TypeError("Specifier must be a non-empty string");
>   }
>
>   const importFn = mockImportFn || ((s) => import(s));
>
>   try {
>     const moduleNamespace = await importFn(specifier);
>     return {
>       success: true,
>       namespace: moduleNamespace,
>       hasDefault: "default" in moduleNamespace
>     };
>   } catch (err) {
>     return {
>       success: false,
>       error: err.message
>     };
>   }
> }
>
> // Verification tests
> const mockImport = async (s) => ({
>   default: () => "ESM Default Export",
>   namedFunc: () => "ESM Named Export"
> });
>
> loadEsmDynamic("./math.mjs", mockImport).then(res => {
>   console.assert(res.success === true, "Test 1 Failed");
>   console.assert(res.hasDefault === true, "Test 2 Failed");
>   console.assert(res.namespace.namedFunc() === "ESM Named Export", "Test 3 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Dynamic import() Expression**: Asynchronous expression allowing loading ES Modules dynamically from both ESM and CommonJS files.
> 2. **Module Namespace Object**: Dynamic import resolves to an immutable namespace object containing named exports and `default`.
> 3. **CJS to ESM Interop**: CommonJS CANNOT use static `import` statements, but CAN use dynamic `import()` promises.
> 
---

### Exercise 2: ESM import.meta.url Path Resolver for __dirname

**Scenario:** Emulates CommonJS `__dirname` and `__filename` globals inside ES Modules using `import.meta.url` and `fileURLToPath`.

**Requirements:**
1. Write resolveEsmMetaPaths(importMetaUrl, mockPathLib, mockUrlLib).
2. Convert `file://` URL to absolute OS path.
3. Extract directory path.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function resolveEsmMetaPaths(importMetaUrl, mockPathLib, mockUrlLib) {
>   const pathLib = mockPathLib || require("path");
>   const urlLib = mockUrlLib || require("url");
>
>   // Convert file:// URL to OS path (e.g. file:///app/main.js -> /app/main.js)
>   const __filename = urlLib.fileURLToPath(importMetaUrl);
>   const __dirname = pathLib.dirname(__filename);
>
>   return {
>     __filename,
>     __dirname
>   };
> }
>
> // Verification tests
> const mockUrl = {
>   fileURLToPath: (urlStr) => urlStr.replace("file://", "")
> };
> const mockPath = {
>   dirname: (p) => p.substring(0, p.lastIndexOf("/"))
> };
>
> const res = resolveEsmMetaPaths("file:///var/app/index.js", mockPath, mockUrl);
> console.assert(res.__filename === "/var/app/index.js", "Test 1 Failed");
> console.assert(res.__dirname === "/var/app", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Missing Globals in ESM**: ES Modules do NOT have `__dirname`, `__filename`, `require`, or `module` global variables.
> 2. **import.meta.url Metadata**: `import.meta` contains module metadata; `import.meta.url` returns the absolute `file://` URL of the current file.
> 3. **fileURLToPath Conversion**: `url.fileURLToPath(import.meta.url)` translates file URLs into native OS directory paths.
> 
---

### Exercise 3: ESM Live Bindings Simulator

**Scenario:** Demonstrates ES Module live bindings where exported variables update dynamically in consumer modules when changed by producer.

**Requirements:**
1. Write createEsmLiveBindingModule().
2. Expose getValue() and increment().
3. Verify live binding behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createEsmLiveBindingModule() {
>   let counter = 0;
>
>   return {
>     // ESM exports are LIVE BINDINGS (read-only views of exported values)
>     get counter() {
>       return counter;
>     },
>     increment() {
>       counter++;
>     }
>   };
> }
>
> // Verification tests
> const esmModule = createEsmLiveBindingModule();
>
> console.assert(esmModule.counter === 0, "Test 1 Failed: Initial value 0");
> esmModule.increment();
> console.assert(esmModule.counter === 1, "Test 2 Failed: Live binding reflects updated value 1");
> ```
>
> #### Technical Explanation
>
> 1. **ESM Live Bindings**: ESM exports are immutable live references; when exporter mutates value, importer sees updated value automatically.
> 2. **CJS Value Copy Contrast**: CommonJS exports values by copy at require time; mutating exported variables does NOT update imported references.
> 3. **Static Analysis Advantage**: ESM imports are read-only views statically validated by V8 before code execution.
## 6. Related Terms
- [CommonJS (require, module.exports)](commonjs.md) — The legacy system that ESM is slowly replacing.
- [package.json](../level_04/package_json.md) — Where you configure Node to use `"type": "module"`.
- [Module Resolution](module_resolution.md) — Related concept: Module Resolution.

---

## 7. Key Takeaways
- **ES Modules (ESM)** is the modern, universal standard for sharing JavaScript code across files.
- It uses **`import`** and **`export`** syntax.
- It is supported by both Browsers and Node.js.
- To use it in Node.js, you must add `"type": "module"` to your `package.json` and include `.js` file extensions in your import paths.
