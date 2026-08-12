# CommonJS (require, module.exports)

> **Level 3 — Module Systems**
> The original, legacy module system built specifically for Node.js, allowing developers to split their code across multiple files and import them using the `require()` function.

---

## 1. Prerequisites
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — Node was created before JavaScript had an official module system, so Ryan Dahl had to invent one.

---

## 2. Term Category

**Node.js Core Architecture / Module System (Node.js Only .)**: CommonJS (require, module.exports) is a fundamental concept in this technology stack. **Level 3 — Module Systems**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In 2009, when Node.js was created, standard JavaScript (in the browser) had no concept of "modules" or "importing files". If you wanted to load 5 scripts, you just added 5 `<script>` tags to your HTML file, and they all polluted the same global `window` object.
On a backend server, you might have 500 different files (User Models, Database Configs, Routing Logic). You cannot just jam all 500 files into one giant global scope; variables would collide everywhere.
Node.js adopted the **CommonJS** specification to solve this. Every single file in Node.js is automatically isolated into its own private "Module". Variables in `fileA.js` cannot be seen by `fileB.js` unless explicitly exported and imported.

### (2) How it works
There are two pieces to the puzzle:
1. **`module.exports`**: The object that you attach things to when you want to share them with the outside world.
2. **`require()`**: The function you call to load another file and read its `module.exports`.

**math.js (The Exporter)**
```javascript
const secretKey = "123"; // Completely private, nobody can see this

function add(a, b) {
  return a + b;
}

// Share the add function
module.exports = {
  add: add
};
```

**app.js (The Importer)**
```javascript
const math = require('./math.js');
console.log(math.add(5, 5)); // 10
```

### (3) Synchronous Loading
CommonJS uses **Synchronous (Blocking)** loading. When Node sees `require('./math')`, it literally halts the entire program, reads the file from the hard drive, parses it, and only then moves to the next line. This is why `require()` should only be used at the very top of your files during server startup, never inside a running route.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `require()` in the Browser

**The mistake:** A frontend developer writes `const axios = require('axios')` inside a script tag for their HTML website. The browser instantly throws an error: `Uncaught ReferenceError: require is not defined`.

**Why it's wrong:** `require()` is a function invented purely by Node.js. It requires access to the computer's hard drive to read the files. The Chrome browser has absolutely no idea what `require` means. 
*(Note: Tools like Webpack were invented specifically to translate `require()` into browser-friendly code).*
**Golden Rule:** CommonJS is for the server. Do not use it in native frontend browser code.

---



### Mistake 2: Re-assigning `exports = { ... }` Instead of `module.exports = { ... }`

**The mistake:** Writing `exports = { myFunc };` expecting to export a module object.

**Why it's wrong:** `exports` is merely a shorthand reference pointing to `module.exports`. Reassigning `exports = {}` breaks the pointer reference, leaving `module.exports` empty `{}`.

*Incorrect:*
```javascript
exports = {
  getUser: () => 'Alice' // ❌ Does NOT export getUser! module.exports remains empty!
};
```

*Fix:*
```javascript
module.exports = {
  getUser: () => 'Alice' // Correct assignment to module.exports
};
```

### Mistake 3: Attempting to Use Dynamic Synchronous `require()` inside ES Modules (`.mjs`)

**The mistake:** Using `require('./file.json')` inside an ES Module.

**Why it's wrong:** `require` is a CommonJS global and does not exist in ES Module scope. Use `import` or `module.createRequire()`.

*Incorrect:*
```javascript
// Inside ES module (.mjs):
const data = require('./data.json'); // ❌ ReferenceError: require is not defined!
```

*Fix:*
```javascript
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const data = require('./data.json');
```

## 5. Practice Exercises

### Exercise 1: CommonJS Module Wrapper Function Simulator

**Scenario:** Simulates Node.js's internal CommonJS module wrapper function `(function (exports, require, module, __filename, __dirname) { ... })`.

**Requirements:**
1. Write wrapAndExecuteCommonJS(moduleCodeStr, mockRequire, filePath).
2. Construct V8 Function wrapper.
3. Execute and return `module.exports`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function wrapAndExecuteCommonJS(moduleCodeStr, mockRequire, filePath = "/app/service.js") {
>   const pathLib = require("path");
>   const dirname = pathLib.dirname(filePath);
>
>   const moduleObj = { exports: {} };
>   const exportsObj = moduleObj.exports;
>
>   // Simulate internal Node.js CommonJS Wrapper Function
>   const wrapperFn = new Function(
>     "exports",
>     "require",
>     "module",
>     "__filename",
>     "__dirname",
>     moduleCodeStr
>   );
>
>   wrapperFn(exportsObj, mockRequire, moduleObj, filePath, dirname);
>
>   return moduleObj.exports;
> }
>
> // Verification tests
> const code = `
>   exports.add = function(a, b) { return a + b; };
>   module.exports.name = "Calculator";
> `;
>
> const exported = wrapAndExecuteCommonJS(code, () => {}, "/app/calc.js");
> console.assert(exported.name === "Calculator", "Test 1 Failed");
> console.assert(exported.add(2, 3) === 5, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Node.js Module Wrapper**: Node.js wraps every CJS file in a hidden function injecting 5 parameters: `exports`, `require`, `module`, `__filename`, `__dirname`.
> 2. **Local Scope Isolation**: Variables declared with `const`/`let`/`var` inside a module file remain private to that file.
> 3. **exports vs module.exports**: `exports` is an initial reference shorthand pointing to `module.exports` object.
> 
---

### Exercise 2: Dynamic CommonJS require() Cache Invalidator

**Scenario:** A hot-reloading development server invalidates specific `require.cache` entries to reload modified CommonJS modules without restarting the server.

**Requirements:**
1. Write invalidateRequireCache(moduleAbsPath, requireCacheMap).
2. Delete entry from requireCacheMap.
3. Return boolean indicating if entry was purged.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function invalidateRequireCache(moduleAbsPath, requireCacheMap) {
>   const cache = requireCacheMap || require.cache;
>
>   if (cache && cache[moduleAbsPath]) {
>     delete cache[moduleAbsPath];
>     return true;
>   }
>
>   return false;
> }
>
> // Verification tests
> const mockCache = {
>   "/app/routes.js": { id: "/app/routes.js", exports: {} }
> };
>
> const purged = invalidateRequireCache("/app/routes.js", mockCache);
> console.assert(purged === true, "Test 1 Failed");
> console.assert(mockCache["/app/routes.js"] === undefined, "Test 2 Failed: Cache entry must be deleted");
> ```
>
> #### Technical Explanation
>
> 1. **require.cache Object**: Node.js caches required modules by absolute file path in `require.cache` dictionary.
> 2. **Synchronous Module Execution**: `require()` runs synchronously on first call and returns cached `module.exports` on subsequent calls.
> 3. **Hot Module Reloading (HMR)**: Deleting `require.cache[path]` forces Node.js to re-read and re-evaluate the file on next `require()` call.
> 
---

### Exercise 3: exports vs module.exports Assignment Safety Guard

**Scenario:** An API linter checks whether a CommonJS file broke the `exports` reference link by reassigning `exports = ...` instead of `module.exports = ...`.

**Requirements:**
1. Write inspectExportSafety(moduleObj, exportsObj).
2. Check if moduleObj.exports === exportsObj.
3. Detect broken exports reassignments.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function inspectExportSafety(moduleObj, exportsObj) {
>   const isLinked = moduleObj.exports === exportsObj;
>
>   return {
>     isLinked,
>     effectiveExports: moduleObj.exports,
>     warning: !isLinked ? "WARNING: Reassigning 'exports = ...' breaks the link to module.exports!" : null
>   };
> }
>
> // Verification tests
> const mod1 = { exports: {} };
> let exp1 = mod1.exports;
> exp1.foo = "bar"; // Correct property attachment
>
> console.assert(inspectExportSafety(mod1, exp1).isLinked === true, "Test 1 Failed");
>
> const mod2 = { exports: {} };
> let exp2 = mod2.exports;
> exp2 = { foo: "bar" }; // BROKEN! Reassigned local variable, module.exports remains empty {}
>
> console.assert(inspectExportSafety(mod2, exp2).isLinked === false, "Test 2 Failed: Detected broken link");
> ```
>
> #### Technical Explanation
>
> 1. **exports Reference Mechanics**: `exports` is merely a argument reference passed to the wrapper function pointing to `module.exports`.
> 2. **Broken Reassignment**: Reassigning `exports = { ... }` changes the local variable reference, leaving `module.exports` empty.
> 3. **Best Practice Rule**: Always use `module.exports = { ... }` when assigning objects or functions as the primary export.
## 6. Related Terms
- [ES Modules (import, export)](es_modules.md) — The modern replacement for CommonJS.
- [NPM (Node Package Manager)](../level_04/npm.md) — NPM packages are historically distributed as CommonJS modules.
- [Module Resolution](module_resolution.md) — Node.js module resolution.

---

## 7. Key Takeaways
- **CommonJS** is the original module system for Node.js.
- It uses **`require()`** to import files, and **`module.exports`** to export data.
- Every file in Node.js is automatically a private module.
- It loads files **synchronously**, making it perfect for server startup but terrible for browsers.
