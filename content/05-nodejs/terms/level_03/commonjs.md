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

### Exercise 1: Default vs Named Exports

**Problem:** You have a file `user.js` containing a `class User`. 
Developer A writes: `module.exports = User;`
Developer B writes: `module.exports = { User: User };`
How does the `require` statement look different for Developer A vs Developer B?

**Expected output:**
> [!check]- Answer
> ```javascript
> // Developer A (Exporting the class directly)
> const User = require('./user.js');
> 
> // Developer B (Exporting an object containing the class)
> const { User } = require('./user.js');
> ```
> - Is `require()` returning the class itself, or an object *holding* the class?
> 
---



### Exercise 2: Exporting Functions in CommonJS

**Problem:** Write CommonJS syntax to export object with `add` and `subtract` math functions.

**Expected output:**
> [!check]- Answer
> ```text
> module.exports = { add: (a, b) => a + b, subtract: (a, b) => a - b };
> ```
> ```javascript
> module.exports = {
>   add: (a, b) => a + b,
>   subtract: (a, b) => a - b
> };
> ```
>
> **Explanation:** `module.exports` defines the public API object returned when requiring the module.
> 
---

### Exercise 3: CommonJS Caching Behavior

**Problem:** If module `a.js` is required 3 times across different files, how many times is `a.js` executed?

**Expected output:**
> [!check]- Answer
> ```text
> 1 time (cached in `require.cache` on first import).
> ```
> ```text
> 1 time (cached in require.cache on first import)
> ```
>
> **Explanation:** `require()` caches loaded module exports in `require.cache`; subsequent imports return the cached object.
> 
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
