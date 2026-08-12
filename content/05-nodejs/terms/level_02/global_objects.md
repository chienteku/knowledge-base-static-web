# Global Objects (global, __dirname, __filename)

> **Level 2 — Core Modules & Globals**
> Built-in variables in Node.js that are available everywhere without needing to be imported, replacing browser-specific globals like `window` and `document`.

---

## 1. Prerequisites
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — Node strips out browser APIs and replaces them with its own Globals.

---

## 2. Term Category

**Node.js Core API (Node.js Only .)**: Global Objects (global, __dirname, __filename) is a fundamental concept in this technology stack. **Level 2 — Core Modules & Globals**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In the browser, if you need the current URL, you type `window.location.href`. The `window` object is the ultimate "Global" scope. Everything attaches to it.
In a headless server running Node.js, there is no "window". There is no screen. But developers still need a place to attach global variables and access vital environmental data (like "What folder am I currently running inside?").
Node.js provides a set of **Global Objects** that are magically injected into every single file you create. You never have to `require` them; they are just always there.

### (2) The `global` Object
This is Node's equivalent of `window`. If you want a variable to be accessible across 50 different files without passing it around, you attach it to `global`.
```javascript
// file1.js
global.mySecretKey = "12345";

// file2.js
console.log(global.mySecretKey); // "12345"
```
*(Note: Just like polluting the `window` object, mutating `global` is considered a terrible anti-pattern in modern development).*

### (3) `__dirname` and `__filename`
Because Node.js interacts with your computer's hard drive, knowing exactly where a file lives is critical.
- `__dirname`: A string containing the absolute path of the **folder** the current file lives in.
- `__filename`: A string containing the absolute path of the **file itself**.
```javascript
console.log(__dirname);  // Output: "/Users/bob/projects/my-api/src"
console.log(__filename); // Output: "/Users/bob/projects/my-api/src/app.js"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on relative paths instead of `__dirname`

**The mistake:** A developer writes a script to read a local config file: `fs.readFileSync('./config.json')`. They test it, and it works. But when they run the script from a different folder (`node src/app.js`), it crashes with "File Not Found".

**Why it's wrong:** In Node.js, a relative path (`./`) resolves relative to the **directory you ran the terminal command from**, *not* the directory the file lives in! If you run the command from the Desktop, it looks for the file on the Desktop.
**Golden Rule:** Always use `__dirname` to construct absolute paths when reading files! `fs.readFileSync(__dirname + '/config.json')` will always work, no matter where you launch the terminal from.

---



### Mistake 2: Polluting the `global` Object with Custom Application Variables

**The mistake:** Writing `global.currentUser = user` to pass data across modules.

**Why it's wrong:** Global object pollution creates invisible dependencies, memory leaks, and unpredictable bugs across concurrent requests. Use module exports or context scopes.

*Incorrect:*
```javascript
global.dbConnection = db; // ❌ Global variable pollution anti-pattern!
```

*Fix:*
```javascript
// Export connection cleanly from dedicated module file:
module.exports = db;
```

### Mistake 3: Assuming `__dirname` and `__filename` Exist in ES Modules

**The mistake:** Using `__dirname` inside an ES Module file (`type: module` in package.json).

**Why it's wrong:** `__dirname` and `__filename` are CommonJS-only globals! They are `undefined` in ES Modules. Use `import.meta.url` with `fileURLToPath`.

*Incorrect:*
```javascript
// Inside ES module file (mjs):
console.log(__dirname); // ❌ ReferenceError: __dirname is not defined in ES module scope!
```

*Fix:*
```javascript
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
```

## 5. Practice Exercises

### Exercise 1: Finding the Global equivalent

**Problem:** In the browser, you use `setTimeout()` and `console.log()`. If `window` doesn't exist in Node.js, how are these functions globally available?

**Expected output:**
> [!check]- Answer
> ```text
> They are attached to the `global` object! 
> In Node.js, `console.log` is actually `global.console.log`, and `setTimeout` is actually `global.setTimeout`. Node just hides the `global.` part to make it easier to write, exactly like the browser hides the `window.` part.
> ```
> - What is the Node.js equivalent of the `window` object?
> 
---



### Exercise 2: Identifying Node.js Globals

**Problem:** Which 3 of these are built-in Node.js global objects?
1. `process`
2. `window`
3. `Buffer`
4. `global`

**Expected output:**
> [!check]- Answer
> ```text
> 1. process, 3. Buffer, 4. global
> ```
> ```text
> 1. process, 3. Buffer, 4. global
> ```
>
> **Explanation:** `process`, `Buffer`, and `global` are available everywhere in Node.js without requiring `require()`.
> 
---

### Exercise 3: ES Module __dirname Equivalent

**Problem:** Write code to resolve `__dirname` in an ES Module using `import.meta.url`.

**Expected output:**
> [!check]- Answer
> ```text
> const __dirname = path.dirname(fileURLToPath(import.meta.url));
> ```
> ```javascript
> import { fileURLToPath } from 'url';
> import path from 'path';
> const __dirname = path.dirname(fileURLToPath(import.meta.url));
> ```
>
> **Explanation:** `import.meta.url` provides the file URL in ES Modules, convertible to local paths via `fileURLToPath`.
> 
## 6. Related Terms
- [The process Object](process_object.md) — The most powerful global object in Node.js.
- [The path Module](path_module.md) — The module you use in conjunction with `__dirname` to build file paths safely.
- [The Node.js REPL](repl.md) — Related concept: The Node.js REPL.

---

## 7. Key Takeaways
- Node.js doesn't have a `window` object. It uses the **`global`** object instead.
- **`__dirname`** gives you the absolute path to the current folder.
- **`__filename`** gives you the absolute path to the current file.
- Always use `__dirname` when reading files to avoid relative path routing bugs.
