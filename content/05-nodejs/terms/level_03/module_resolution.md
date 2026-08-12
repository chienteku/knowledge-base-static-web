# Module Resolution

> **Level 3 — Module Systems**
> The algorithm Node.js uses under the hood to figure out exactly *where* a file is located when you type `require('something')` or `import 'something'`.

---

## 1. Prerequisites
- [CommonJS (require, module.exports)](commonjs.md) — Uses the classic module resolution algorithm.
- [NPM (Node Package Manager)](../level_04/npm.md) — Resolution specifically looks for packages installed by NPM.

---

## 2. Term Category

**Node.js Core Architecture (Node.js Only .)**: Module Resolution is a fundamental concept in this technology stack. **Level 3 — Module Systems**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When you write `require('./math.js')`, it's obvious to the computer: "Look in the exact same folder for a file named math.js."
But what happens when you write `require('express')`? There is no `./`. There is no `.js`. You just gave Node a random word. How does Node.js magically know where the Express framework is located on your massive hard drive?
This magic is called **Module Resolution**. It is a strict set of rules Node.js follows to hunt down the file you asked for.

### (2) The Resolution Algorithm (Simplified)
When Node.js sees `require('X')`:
1. **Is it a Core Module?** 
   Node checks if `X` is built-in (like `fs`, `http`, `path`). If yes, it loads it instantly.
2. **Is it a Relative Path?** 
   If `X` starts with `./` or `../`, Node looks at the exact file path. If it's a folder, it automatically looks for an `index.js` file inside that folder.
3. **Is it in `node_modules`?** (The Magic Step)
   If it's just a raw word (like `'express'`), Node looks in the current folder for a `node_modules` directory. If it doesn't find it, it goes up to the parent folder. It keeps going up folder by folder until it hits the root of your hard drive. If it finds `node_modules/express`, it loads it.

### (3) Why the `index.js` rule matters
Because the algorithm automatically looks for `index.js` inside folders, you can organize your code cleanly:
```javascript
// Instead of this ugly path:
const db = require('./database/connection/index.js');

// You can just write:
const db = require('./database/connection');
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Global vs Local Installs

**The mistake:** A developer runs `npm install -g express` (Global install). They create a new project folder, write `require('express')`, and the app crashes with "Module Not Found."

**Why it's wrong:** The Module Resolution algorithm climbs up the directory tree looking for a `node_modules` folder. It does *not* look in your global hidden system folders by default! If you want to `require` a package in your code, you must install it locally in that specific project folder so the algorithm can find it.
**Golden Rule:** Global installs are for command-line tools (like `nodemon`). Local installs are for code libraries (like `express`).

---



### Mistake 2: Assuming Relative Paths Are Resolved Relative to `process.cwd()` in `require()`

**The mistake:** Expecting `require('./config')` to look in the directory where the terminal command was executed.

**Why it's wrong:** `require('./relative')` ALWAYS resolves relative to the directory of the current file (`__dirname`), NOT the working directory `process.cwd()`.

*Incorrect:*
```javascript
// Assuming require('./config') changes behavior depending on launch directory
```

*Fix:*
```javascript
// require() relative paths are fixed to the source file location
```

### Mistake 3: Creating Duplicate Package Instances via Inconsistent Module Resolution Paths

**The mistake:** Requiring a module via both relative path `require('../node_modules/pkg')` and package name `require('pkg')`.

**Why it's wrong:** Node's module cache indexes files by resolved absolute filepath. Inconsistent require paths can load the same library twice into memory, creating dual singleton instances.

*Incorrect:*
```javascript
const a = require('../node_modules/lib');
const b = require('lib'); // ❌ Loads two separate instances in memory!
```

*Fix:*
```javascript
const a = require('lib');
const b = require('lib'); // Resolves to same cached instance
```

## 5. Practice Exercises

### Exercise 1: Node.js node_modules Lookup Path Generator

**Scenario:** Simulates Node.js module resolution algorithm generating the directory search paths for non-relative module specifiers (e.g. `require('lodash')`).

**Requirements:**
1. Write generateNodeModulesPaths(startDir, mockPathLib).
2. Walk up directory tree to filesystem root.
3. Append `/node_modules` at each level.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function generateNodeModulesPaths(startDir = "/app/services/user", mockPathLib) {
>   const pathLib = mockPathLib || require("path");
>   let current = pathLib.resolve(startDir);
>   const paths = [];
>
>   while (true) {
>     paths.push(pathLib.join(current, "node_modules"));
>     const parent = pathLib.dirname(current);
>     if (parent === current) {
>       break; // Reached filesystem root!
>     }
>     current = parent;
>   }
>
>   return paths;
> }
>
> // Verification tests
> const path = require("path");
> const searchPaths = generateNodeModulesPaths("/app/src/controllers", path);
>
> console.assert(searchPaths[0].endsWith("app/src/controllers/node_modules"), "Test 1 Failed");
> console.assert(searchPaths[1].endsWith("app/src/node_modules"), "Test 2 Failed");
> console.assert(searchPaths[2].endsWith("app/node_modules"), "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Node.js Module Resolution Algorithm**: When requiring non-relative packages (`express`), Node.js searches `node_modules` in current directory and parent directories up to root.
> 2. **Relative vs Absolute Specifiers**: Relative specifiers (`./foo`, `../bar`) look relative to current file path; absolute specifiers search `node_modules`.
> 3. **NODE_PATH Environment Variable**: Additional lookup paths can be configured via `NODE_PATH` environment variable.
> 
---

### Exercise 2: Package entry point resolver via package.json exports field

**Scenario:** Parses `package.json` to resolve entry points based on module type (ESM vs CommonJS) using 'exports' conditional mappings.

**Requirements:**
1. Write resolvePackageEntryPoint(packageJsonObj, isEsm).
2. Check `exports` object.
3. Check `main` fallback.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function resolvePackageEntryPoint(packageJsonObj = {}, isEsm = false) {
>   const exportsField = packageJsonObj.exports;
>
>   if (exportsField) {
>     if (typeof exportsField === "string") return exportsField;
>
>     const rootMapping = exportsField["."] || exportsField;
>     if (typeof rootMapping === "object") {
>       if (isEsm && rootMapping.import) return rootMapping.import;
>       if (!isEsm && rootMapping.require) return rootMapping.require;
>       if (rootMapping.default) return rootMapping.default;
>     }
>   }
>
>   return packageJsonObj.main || "index.js";
> }
>
> // Verification tests
> const pkg = {
>   name: "my-lib",
>   main: "dist/cjs/index.js",
>   exports: {
>     ".": {
>       import: "./dist/esm/index.mjs",
>       require: "./dist/cjs/index.cjs"
>     }
>   }
> };
>
> console.assert(resolvePackageEntryPoint(pkg, true) === "./dist/esm/index.mjs", "Test 1 Failed: ESM import path");
> console.assert(resolvePackageEntryPoint(pkg, false) === "./dist/cjs/index.cjs", "Test 2 Failed: CJS require path");
> ```
>
> #### Technical Explanation
>
> 1. **package.json exports Field**: Modern Node.js package.json field defining package entry points and encapsulation rules.
> 2. **Conditional Exports Mappings**: Maps import specifiers based on environment conditions (`import`, `require`, `node`, `default`).
> 3. **Subpath Encapsulation**: If `exports` is defined, internal files not explicitly exported CANNOT be imported by consumers.
> 
---

### Exercise 3: File Extension Auto-Completion Resolution

**Scenario:** Simulates Node.js extension lookup algorithm for relative imports missing extensions (`./utils` -> `./utils.js`, `./utils.json`, `./utils/index.js`).

**Requirements:**
1. Write resolveFileWithExtensions(basePath, mockFs).
2. Check exact match.
3. Test `.js`, `.json`, `.node` extensions.
4. Test `/index.js`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function resolveFileWithExtensions(basePath, mockFs) {
>   const fsLib = mockFs || require("fs").promises;
>   const candidates = [
>     basePath,
>     `${basePath}.js`,
>     `${basePath}.json`,
>     `${basePath}.node`,
>     `${basePath}/index.js`,
>     `${basePath}/index.json`
>   ];
>
>   for (const candidate of candidates) {
>     try {
>       const stat = await fsLib.stat(candidate);
>       if (stat.isFile()) {
>         return candidate;
>       }
>     } catch (_) {}
>   }
>
>   throw new Error(`Cannot find module '${basePath}'`);
> }
>
> // Verification tests
> const mockFs = {
>   stat: async (p) => {
>     if (p === "/app/utils.js") return { isFile: () => true };
>     throw new Error("File not found");
>   }
> };
>
> resolveFileWithExtensions("/app/utils", mockFs).then(resolved => {
>   console.assert(resolved === "/app/utils.js", "Test 1 Failed: Resolved .js extension automatically");
> });
> ```
>
> #### Technical Explanation
>
> 1. **CommonJS Automatic Extensions**: CommonJS automatically attempts appending `.js`, `.json`, and `.node` to path specifiers.
> 2. **ESM Mandatory Extensions**: ES Modules in Node.js REQUIRE explicit file extensions in relative import specifiers (`import './utils.js'`).
> 3. **Directory Index Resolution**: If path is a directory, Node.js searches for `index.js` or `index.json` inside the directory.
## 6. Related Terms
- [node_modules](../level_04/node_modules.md) — The folder the algorithm is desperately searching for.
- [ES Modules (import, export)](es_modules.md) — ESM resolution is slightly stricter (e.g., forcing you to include the `.js` extension).
- [Circular Dependencies](circular_dependencies.md) — Related concept: Circular Dependencies.
- [Built-in vs External Modules](module_types.md) — Related concept: Built-in vs External Modules.
- [CommonJS (require, module.exports)](commonjs.md) — Related concept: CommonJS (require, module.exports).

---

## 7. Key Takeaways
- **Module Resolution** is how Node.js finds files and packages.
- If a path starts with `./`, it looks exactly there. If the target is a folder, it defaults to `index.js`.
- If it's just a word (like `'react'`), it searches for a `node_modules` folder, climbing up the directory tree until it hits the hard drive root.
