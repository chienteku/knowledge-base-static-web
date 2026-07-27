# Module Resolution

> **Level 3 — Module Systems**
> The algorithm Node.js uses under the hood to figure out exactly *where* a file is located when you type `require('something')` or `import 'something'`.

---

## 1. Prerequisites
- [CommonJS](../level_03/commonjs.md) — Uses the classic module resolution algorithm.
- [NPM](../level_04/npm.md) — Resolution specifically looks for packages installed by NPM.

---

## 2. Term Category
- **Node.js Core Architecture**

---

## 3. Environment Context
- **Node.js Only** (Browsers resolve modules purely via URLs).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Hunt

**Problem:** You are running a script located at `/Users/bob/projects/app/src/server.js`. The script says `require('lodash')`.
List the exact directory paths Node.js will check in order, looking for `lodash`.

**Expected output:**
```text
1. Node checks if `lodash` is a core module (It's not).
2. It checks `/Users/bob/projects/app/src/node_modules/lodash`
3. It climbs up: `/Users/bob/projects/app/node_modules/lodash` (This is usually where it finds it!)
4. It climbs up: `/Users/bob/projects/node_modules/lodash`
5. It climbs up: `/Users/bob/node_modules/lodash`
6. It climbs up: `/Users/node_modules/lodash`
7. It climbs up: `/node_modules/lodash`
If it fails at the root `/`, it throws an Error.
```

> [!check]- Answer
> - Remember the rule: if it's not a core module and not a relative path, it hunts for a `node_modules` folder, climbing up the tree.

---



### Exercise 2: Tracing Node.js node_modules Lookup Path

**Problem:** If file `/app/src/utils/math.js` calls `require('lodash')`, list the first 3 directories Node searches.

**Expected output:**
```text
1. /app/src/utils/node_modules/lodash
2. /app/src/node_modules/lodash
3. /app/node_modules/lodash
```

> [!check]- Answer
> ```text
> 1. /app/src/utils/node_modules/lodash
> 2. /app/src/node_modules/lodash
> 3. /app/node_modules/lodash
> ```
>
> **Explanation:** Node traverses parent directories recursively looking for `node_modules` until reaching filesystem root.

### Exercise 3: Index File Resolution Order

**Problem:** When resolving `require('./models')`, what file names does Node attempt if `./models` is a directory?

**Expected output:**
```text
./models/index.js, ./models/index.json, ./models/index.node (or package.json main entry).
```

> [!check]- Answer
> ```text
> 1. ./models/package.json (main field)
> 2. ./models/index.js
> 3. ./models/index.json
> 4. ./models/index.node
> ```
>
> **Explanation:** Folder module resolution checks `package.json` main field before falling back to `index` files.

## 7. Related Terms
- [`node_modules`](../level_04/node_modules.md) — The folder the algorithm is desperately searching for.
- [ES Modules](../level_03/es_modules.md) — ESM resolution is slightly stricter (e.g., forcing you to include the `.js` extension).

---

## 8. Key Takeaways
- **Module Resolution** is how Node.js finds files and packages.
- If a path starts with `./`, it looks exactly there. If the target is a folder, it defaults to `index.js`.
- If it's just a word (like `'react'`), it searches for a `node_modules` folder, climbing up the directory tree until it hits the hard drive root.
