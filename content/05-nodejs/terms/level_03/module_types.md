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

### Exercise 1: Categorize the Imports

**Problem:** Look at the following three import statements. Which one is a built-in module, which is an external module, and which is a local file?
1. `const data = require('./users.json');`
2. `const crypto = require('crypto');`
3. `const react = require('react');`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Local File. (It starts with `./`, meaning it looks in the current directory).
> 2. Built-in Module. (`crypto` is part of the Node standard library).
> 3. External Module. (`react` is not built into Node.js; it must be downloaded via NPM).
> ```
> - Does it have a slash? Was it built by the Node.js core team?
> 
---



### Exercise 2: Matching File Extensions to Module Systems

**Problem:** Match extension to Node.js module mode:
1. `.cjs`
2. `.mjs`
3. `.js` (with `"type": "module"` in package.json)

**Expected output:**
> [!check]- Answer
> ```text
> 1. CommonJS
> 2. ES Module
> 3. ES Module
> ```
> ```text
> 1. .cjs -> CommonJS
> 2. .mjs -> ES Module
> 3. .js (type: module) -> ES Module
> ```
>
> **Explanation:** `.cjs` is explicitly CommonJS; `.mjs` is explicitly ESM; `.js` defaults to CJS unless package `type` specifies `module`.
> 
---

### Exercise 3: Conditional Package Exports

**Problem:** Write package.json `exports` field supporting `require` and `import` entry points.

**Expected output:**
> [!check]- Answer
> ```text
> "exports": { ".": { "import": "./index.mjs", "require": "./index.cjs" } }
> ```
> ```json
> {
>   "exports": {
>     ".": {
>       "import": "./index.mjs",
>       "require": "./index.cjs"
>     }
>   }
> }
> ```
>
> **Explanation:** Conditional exports direct CJS `require()` and ESM `import` statements to appropriate build formats.
> 
## 6. Related Terms
- [NPM (Node Package Manager)](../level_04/npm.md) — The registry where you download all External Modules.
- [node_modules](../level_04/node_modules.md) — The folder where External Modules physically live on your hard drive once downloaded.
- [Module Resolution](module_resolution.md) — How Node finds these modules.

---

## 7. Key Takeaways
- **Built-in Modules** (Core) come pre-installed with Node.js (e.g., `fs`, `path`, `http`). Never NPM install them.
- **External Modules** are built by the community and must be downloaded via NPM (e.g., `express`, `react`).
- Using the `node:` prefix (like `node:fs`) is the modern way to explicitly identify built-in modules.
