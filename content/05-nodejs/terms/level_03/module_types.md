# Built-in vs External Modules

> **Level 3 — Module Systems**
> The distinction between modules that come pre-packaged inside Node.js itself, and modules you must download from the internet using NPM.

---

## 1. Prerequisites
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — Node.js module system architecture.

---

## 2. Term Category

**Ecosystem Concept (Node.js Ecosystem)**: Built-in vs External Modules is a fundamental concept in this technology stack. **Level 3 — Module Systems**

---

## 3. Explanation

### (1) Core (Built-in) Modules
When you install Node.js on your computer, it comes with a standard library of powerful tools already baked into the C++ binary. You do **not** need to download these from the internet. You just `require` them instantly.
- **Examples:** `fs` (File System), `http` (Networking), `path` (File Paths), `crypto` (Hashing/Security), `os` (Operating System info).
- **Usage:**
  ```javascript
  // No installation needed!
  const os = require('os');
  console.log(os.totalmem());
  ```

*(Modern Note: In ES Modules, it is considered best practice to prefix built-in modules with `node:` to explicitly state they are built-in, e.g., `import fs from 'node:fs'`)*.

### (2) External (Third-Party) Modules
While Node's built-in modules are powerful, they are extremely low-level. Writing a massive API using just the built-in `http` module is painful. 
For complex tasks, developers rely on the open-source community. These are **External Modules**. They do not exist on your computer by default. You must connect to the internet, download them via NPM (Node Package Manager), and save them into your `node_modules` folder.
- **Examples:** `express` (Web Framework), `mongoose` (Database ORM), `axios` (HTTP Requests), `dotenv` (Environment Variables).
- **Usage:**
  ```bash
  npm install express
  ```
  ```javascript
  const express = require('express');
  ```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to NPM install a built-in module

**The mistake:** A developer watches a tutorial that uses the `fs` module. They go to their terminal and type `npm install fs`.

**Why it's wrong:** The `fs` module is already baked into Node.js! You don't need to download it. Interestingly, malicious actors sometimes publish fake packages to NPM with the same names as core modules. If you type `npm install fs`, you might accidentally download a virus!
**Golden Rule:** Never `npm install` core modules like `fs`, `path`, or `http`. They are already there.

---



### Mistake 2: Mixing Dual-Package Dual-Emit CommonJS and ESM Build Artifacts Incorrectly

**The mistake:** Configuring package.json `main` and `module` fields pointing to identical unbuilt source files.

**Why it's wrong:** Dual packages must export distinct, valid CJS artifacts (`dist/index.cjs`) and ESM artifacts (`dist/index.mjs`) or use package `exports` conditions.

*Incorrect:*
```javascript
{
  "main": "./src/index.js",
  "module": "./src/index.js" // ❌ Syntax error if file contains ESM import in CJS project!
}
```

*Fix:*
```javascript
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "exports": { ".": { "require": "./dist/index.cjs", "import": "./dist/index.js" } }
}
```

### Mistake 3: Treating `.json` Imports in ESM Identically to CommonJS

**The mistake:** Writing `import data from './data.json';` without import assertions / attributes.

**Why it's wrong:** Native ES Modules require Import Attributes (`import data from './data.json' with { type: 'json' };`) to safely import JSON files.

*Incorrect:*
```javascript
import data from './data.json'; // ❌ ERR_IMPORT_ASSERTION_MISSING in Node.js ESM!
```

*Fix:*
```javascript
import data from './data.json' with { type: 'json' }; // Import attribute for JSON
```

## 5. Practice Exercises

### Exercise 1: Core, Local, and Third-Party Module Specifier Classifier

**Scenario:** An API linter classifies module specifiers into Core (`fs`, `http`), Local (`./utils`), or Third-Party (`lodash`, `express`).

**Requirements:**
1. Write classifyModuleSpecifier(specifier, mockBuiltinModules).
2. Check core built-ins.
3. Check relative/absolute paths.
4. Return classification.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function classifyModuleSpecifier(specifier, mockBuiltinModules) {
>   if (!specifier || typeof specifier !== "string") return "UNKNOWN";
>
>   const builtins = new Set(mockBuiltinModules || require("module").builtinModules || ["fs", "http", "path", "events", "crypto"]);
>
>   // Core Built-in Module (or node: prefix)
>   if (specifier.startsWith("node:") || builtins.has(specifier)) {
>     return { type: "CORE_BUILTIN", specifier };
>   }
>
>   // Local File Relative or Absolute Path
>   if (specifier.startsWith(".") || specifier.startsWith("/")) {
>     return { type: "LOCAL_FILE", specifier };
>   }
>
>   // Third-Party npm package in node_modules
>   return { type: "THIRD_PARTY_NPM", specifier };
> }
>
> // Verification tests
> console.assert(classifyModuleSpecifier("fs").type === "CORE_BUILTIN", "Test 1 Failed");
> console.assert(classifyModuleSpecifier("node:path").type === "CORE_BUILTIN", "Test 2 Failed");
> console.assert(classifyModuleSpecifier("./user.js").type === "LOCAL_FILE", "Test 3 Failed");
> console.assert(classifyModuleSpecifier("express").type === "THIRD_PARTY_NPM", "Test 4 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Three Categories of Node Modules**: Core Built-in (compiled C++/JS into Node binary), Local Files, and Third-Party (installed in node_modules).
> 2. **`node:` Protocol Prefix**: Modern Node.js convention explicitly identifying core modules (e.g. `node:fs`, `node:http`).
> 3. **Resolution Priority**: Core modules take top precedence over node_modules packages with identical names.
> 
---

### Exercise 2: Dynamic Core Module Loader with Fallback

**Scenario:** An application plugin loader safely loads core Node.js modules using the `node:` protocol prefix.

**Requirements:**
1. Write loadNodeCoreModule(moduleName, mockRequire).
2. Prepend `node:` prefix if missing.
3. Require module and return instance.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function loadNodeCoreModule(moduleName, mockRequire) {
>   const req = mockRequire || require;
>   const prefixedName = moduleName.startsWith("node:") ? moduleName : `node:${moduleName}`;
>
>   try {
>     return {
>       success: true,
>       moduleInstance: req(prefixedName)
>     };
>   } catch (err) {
>     // Fallback attempt without node: prefix for older runtimes
>     try {
>       return {
>         success: true,
>         moduleInstance: req(moduleName)
>       };
>     } catch (fallbackErr) {
>       return { success: false, error: fallbackErr.message };
>     }
>   }
> }
>
> // Verification tests
> const mockReq = (name) => {
>   if (name === "node:fs" || name === "fs") return { readFile: () => {} };
>   throw new Error("Module not found");
> };
>
> const res = loadNodeCoreModule("fs", mockReq);
> console.assert(res.success === true && typeof res.moduleInstance.readFile === "function", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **`node:` Prefix Benefits**: Prevents third-party npm packages from squatting core module names and guarantees loading native C++ bindings.
> 2. **Core Module C++ Bindings**: Core modules contain high-performance C++ bindings (V8, libuv, OpenSSL, zlib) embedded directly in Node.js executable.
> 3. **Zero Installation Overhead**: Core modules are always available without installing npm packages.
> 
---

### Exercise 3: package.json Type Property Evaluator

**Scenario:** An API builder inspects `package.json` 'type' property to determine whether `.js` files are interpreted as ES Modules or CommonJS.

**Requirements:**
1. Write evaluateModuleFormat(filePath, packageJsonObj).
2. Check file extension (.mjs -> ESM, .cjs -> CommonJS).
3. Check package.json "type": "module".

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function evaluateModuleFormat(filePath = "app.js", packageJsonObj = {}) {
>   if (filePath.endsWith(".mjs")) return "ESM";
>   if (filePath.endsWith(".cjs")) return "COMMONJS";
>
>   if (filePath.endsWith(".js")) {
>     return packageJsonObj.type === "module" ? "ESM" : "COMMONJS";
>   }
>
>   return "UNKNOWN";
> }
>
> // Verification tests
> console.assert(evaluateModuleFormat("server.mjs") === "ESM", "Test 1 Failed: .mjs is always ESM");
> console.assert(evaluateModuleFormat("utils.cjs") === "COMMONJS", "Test 2 Failed: .cjs is always CommonJS");
> console.assert(evaluateModuleFormat("index.js", { type: "module" }) === "ESM", "Test 3 Failed: .js with type module is ESM");
> console.assert(evaluateModuleFormat("index.js", {}) === "COMMONJS", "Test 4 Failed: .js without type is CJS default");
> ```
>
> #### Technical Explanation
>
> 1. **.mjs vs .cjs Extensions**: Explicit file extensions override package.json configuration; `.mjs` is always ESM; `.cjs` is always CommonJS.
> 2. **package.json "type": "module"**: Configures all `.js` files in that package folder and subfolders to be interpreted as ES Modules.
> 3. **Scope Inheritance**: Subdirectories inherit parent package.json module type unless overridden by nested package.json.
## 6. Related Terms
- [NPM (Node Package Manager)](../level_04/npm.md) — The registry where you download all External Modules.
- [node_modules](../level_04/node_modules.md) — The folder where External Modules physically live on your hard drive once downloaded.
- [Module Resolution](module_resolution.md) — How Node finds these modules.

---

## 7. Key Takeaways
- **Built-in Modules** (Core) come pre-installed with Node.js (e.g., `fs`, `path`, `http`). Never NPM install them.
- **External Modules** are built by the community and must be downloaded via NPM (e.g., `express`, `react`).
- Using the `node:` prefix (like `node:fs`) is the modern way to explicitly identify built-in modules.
