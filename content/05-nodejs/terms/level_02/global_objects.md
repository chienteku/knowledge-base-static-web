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

### Exercise 1: Cross-Environment Global Object Resolver

**Scenario:** A universal library identifies the runtime global object (`globalThis`, `global`, `window`) across Node.js and browser contexts.

**Requirements:**
1. Write getGlobalObject().
2. Detect globalThis, global, or window.
3. Return resolved global instance.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function getGlobalObject() {
>   if (typeof globalThis !== "undefined") return globalThis;
>   if (typeof global !== "undefined") return global;
>   if (typeof window !== "undefined") return window;
>   return {};
> }
>
> // Verification tests
> const g = getGlobalObject();
> console.assert(g !== null && typeof g === "object", "Test 1 Failed");
> console.assert(g === globalThis || g === global, "Test 2 Failed: Must resolve Node.js global object");
> ```
>
> #### Technical Explanation
>
> 1. **globalThis Standard**: ES2020 standard providing unified access to global object across Node.js, browsers, and Web Workers.
> 2. **Node.js `global` Object**: Node.js top-level global namespace containing core utilities (`Buffer`, `process`, `console`, `setTimeout`).
> 3. **No `window` in Node.js**: Browser `window` and `document` do not exist in Node.js backend environment.
> 
---

### Exercise 2: Managed Global Interval Registry

**Scenario:** A background task scheduler registers intervals on the global scope with automatic cleanup handles to prevent memory leaks.

**Requirements:**
1. Write createManagedIntervalRegistry(mockGlobal).
2. Track interval timer IDs.
3. Provide clearAll() handle.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createManagedIntervalRegistry(mockGlobal) {
>   const targetGlobal = mockGlobal || global;
>   const activeTimerIds = new Set();
>
>   return {
>     setInterval(callbackFn, intervalMs) {
>       const id = targetGlobal.setInterval(() => {
>         callbackFn();
>       }, intervalMs);
>       activeTimerIds.add(id);
>       return id;
>     },
>     clearInterval(id) {
>       targetGlobal.clearInterval(id);
>       activeTimerIds.delete(id);
>     },
>     clearAll() {
>       activeTimerIds.forEach(id => {
>         targetGlobal.clearInterval(id);
>       });
>       activeTimerIds.clear();
>     },
>     getActiveCount: () => activeTimerIds.size
>   };
> }
>
> // Verification tests
> let timerCount = 0;
> const mockGlobal = {
>   setInterval: (cb) => ++timerCount,
>   clearInterval: (id) => {}
> };
>
> const reg = createManagedIntervalRegistry(mockGlobal);
> const t1 = reg.setInterval(() => {}, 100);
> const t2 = reg.setInterval(() => {}, 200);
>
> console.assert(reg.getActiveCount() === 2, "Test 1 Failed");
> reg.clearAll();
> console.assert(reg.getActiveCount() === 0, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Uncleared Timers Leak Memory**: Active setInterval timers keep the Node.js event loop alive and prevent process exit.
> 2. **Global Timer Functions**: global.setTimeout, global.setInterval, global.setImmediate, global.queueMicrotask.
> 3. **Graceful Cleanup**: Always clear intervals when server components unmount or shut down.
> 
---

### Exercise 3: Cross-Module Shared Global Namespace Container

**Scenario:** A plugin architecture attaches a namespaced shared container to `globalThis` to exchange state across isolated bundles.

**Requirements:**
1. Write registerGlobalState(namespace, key, value).
2. Retrieve state via getGlobalState(namespace, key).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function registerGlobalState(namespace, key, value) {
>   const root = typeof globalThis !== "undefined" ? globalThis : global;
>
>   if (!root[namespace]) {
>     Object.defineProperty(root, namespace, {
>       value: {},
>       writable: true,
>       configurable: true,
>       enumerable: false
>     });
>   }
>
>   root[namespace][key] = value;
>   return root[namespace][key];
> }
>
> function getGlobalState(namespace, key) {
>   const root = typeof globalThis !== "undefined" ? globalThis : global;
>   return root[namespace]?.[key];
> }
>
> // Verification tests
> registerGlobalState("__APP_CONFIG__", "dbUrl", "postgres://localhost:5432");
> const url = getGlobalState("__APP_CONFIG__", "dbUrl");
>
> console.assert(url === "postgres://localhost:5432", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Global State Pollution Warning**: Attaching properties to global object should be minimized to avoid naming collisions.
> 2. **Non-Enumerable Properties**: Using Object.defineProperty with `enumerable: false` keeps global namespaces clean.
> 3. **Module Singleton Pattern**: CommonJS/ES Modules cache exported module instances, making global state unnecessary in most cases.
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
