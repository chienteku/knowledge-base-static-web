# Promisification (util.promisify)

> **Level 5 — Asynchronous Patterns**
> The process of wrapping an old, legacy "Error-First" callback function into a modern JavaScript Promise, allowing you to use `async/await` with ancient Node.js libraries.

---

## 1. Prerequisites
- [Callbacks & Callback Hell](callbacks.md) — The legacy system you are trying to escape.

---

## 2. Term Category

**Node.js Core Utility / Design Pattern (Node.js Only .)**: Promisification (util.promisify) is a fundamental concept in this technology stack. **Level 5 — Asynchronous Patterns**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In 2015, JavaScript introduced **Promises** to fix Callback Hell. In 2017, they introduced **`async/await`** to make asynchronous code read like synchronous code.
But Node.js was created in 2009! There were already millions of lines of code and thousands of NPM packages written using the old `(err, data)` callback system. 
You cannot use `await` on a callback function. If you try `await fs.readFile(...)`, it won't work.
To bridge this gap, Node.js introduced **Promisification**. It is a tool that takes an old callback function and magically upgrades it into a modern Promise-returning function.

### (2) The Built-in `util.promisify`
Node.js provides a core module called `util` that does the heavy lifting for you.
```javascript
const fs = require('fs');
const util = require('util');

// 1. Take the old legacy callback function
const oldReadFile = fs.readFile;

// 2. Wrap it in promisify to create a modern function
const modernReadFile = util.promisify(oldReadFile);

// 3. Now you can use async/await!
async function readMyFile() {
  try {
    const data = await modernReadFile('poem.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error("Failed!", err);
  }
}
```

### (3) The Modern Era
You rarely have to use `util.promisify` yourself today. The Node.js core team realized how important this was, so they manually Promisified the entire Node standard library for you! 
Instead of requiring `fs` and Promisifying it, you can just require the pre-promisified version: `const fs = require('fs/promises');`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Promisifying functions that don't follow the rules

**The mistake:** A developer tries to use `util.promisify` on a third-party function `fetchData(callback)`. The code completely breaks.

**Why it's wrong:** `util.promisify` is not magic. It relies on a very strict rule: **The original callback MUST use the Error-First convention (`err, data`)**. If the third-party library uses a callback like `callback(data, err)`, the Promisify tool will get confused and throw the data away, thinking it was an error.
**Golden Rule:** Only use `util.promisify` on strict Error-First callback functions.

---



### Mistake 2: Attempting to Promisify Callback Functions That Pass Multiple Success Values

**The mistake:** Using `util.promisify()` on a callback `(err, val1, val2) => {}` expecting a tuple array.

**Why it's wrong:** `util.promisify` resolves to the 1st result argument (`val1`) by default, discarding subsequent arguments (`val2`) unless custom `util.promisify.custom` symbol is configured.

*Incorrect:*
```javascript
function multi(cb) { cb(null, 'res1', 'res2'); }
const fn = util.promisify(multi);
const val = await fn(); // ❌ Only receives 'res1', 'res2' is lost!
```

*Fix:*
```javascript
function multi() {
  return new Promise((resolve) => resolve(['res1', 'res2'])); // Custom Promise wrapper
}
```

### Mistake 3: Creating Unnecessary 'Explicit Promise Construction Antipattern'

**The mistake:** Wrapping already-promised functions inside `new Promise((resolve, reject) => ...)`.

**Why it's wrong:** Explicitly wrapping promise functions in `new Promise` adds redundant boilerplate and complicates error propagation.

*Incorrect:*
```javascript
function get() {
  return new Promise((resolve, reject) => {
    fs.promises.readFile('a.txt').then(resolve).catch(reject); // ❌ Redundant Promise wrapper!
  });
}
```

*Fix:*
```javascript
function get() {
  return fs.promises.readFile('a.txt'); // Return promise directly
}
```

## 5. Practice Exercises

### Exercise 1: Custom Promisify Converter with util.promisify.custom Symbol

**Scenario:** Converts error-first callback APIs into Promise-returning functions, supporting custom promisified implementations via `util.promisify.custom`.

**Requirements:**
1. Write promisifyCustom(originalFn).
2. Check for custom symbol override.
3. Return Promise-wrapped function.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const CUSTOM_PROMISIFY_SYMBOL = Symbol.for("util.promisify.custom");
>
> function promisifyCustom(originalFn) {
>   if (originalFn[CUSTOM_PROMISIFY_SYMBOL]) {
>     return originalFn[CUSTOM_PROMISIFY_SYMBOL];
>   }
>
>   return function (...args) {
>     return new Promise((resolve, reject) => {
>       originalFn(...args, (err, result) => {
>         if (err) return reject(err);
>         resolve(result);
>       });
>     });
>   };
> }
>
> // Verification tests
> const legacyFn = (cb) => cb(null, "LEGACY_DATA");
> const customFn = () => Promise.resolve("CUSTOM_OVERRIDE");
> legacyFn[CUSTOM_PROMISIFY_SYMBOL] = customFn;
>
> const promisified = promisifyCustom(legacyFn);
> promisified().then(res => {
>   console.assert(res === "CUSTOM_OVERRIDE", "Test 1 Failed: Custom symbol took precedence");
> });
> ```
>
> #### Technical Explanation
>
> 1. **util.promisify Core Function**: Built-in Node.js utility converting error-first callback functions into Promise-returning functions.
> 2. **Custom Promisify Symbol**: Functions can attach `[util.promisify.custom]` to supply optimized Promise implementations.
> 3. **Modernizing Legacy Libraries**: Eliminates writing raw Promise wrappers around Node.js `fs`, `child_process`, and `zlib` callback functions.
> 
---

### Exercise 2: Multi-Argument Callback Promisification

**Scenario:** Promisifies legacy callbacks returning multiple result arguments `(err, res1, res2)` into an array/object Promise resolution.

**Requirements:**
1. Write promisifyMultiArg(legacyFn).
2. Resolve Promise with array of result arguments.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function promisifyMultiArg(legacyFn) {
>   return function (...args) {
>     return new Promise((resolve, reject) => {
>       legacyFn(...args, (err, ...results) => {
>         if (err) return reject(err);
>         resolve(results.length === 1 ? results[0] : results);
>       });
>     });
>   };
> }
>
> // Verification tests
> const multiArgFn = (a, b, cb) => cb(null, a * 2, b * 2);
> const asyncMulti = promisifyMultiArg(multiArgFn);
>
> asyncMulti(5, 10).then(([r1, r2]) => {
>   console.assert(r1 === 10 && r2 === 20, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Multi-Argument Callback Challenge**: Standard util.promisify only returns the first success argument unless custom promisify is used.
> 2. **Array Result Packaging**: Packaging multiple callback parameters into a result array preserves all output values.
> 3. **Flexible Resolution**: Returns scalar for single output, array for multi-parameter output.
> 
---

### Exercise 3: Promisifying Core fs Legacy Callback APIs

**Scenario:** Wraps legacy `fs.readFile` callback signatures into Promise-based functions.

**Requirements:**
1. Write promisifyFsReadFile(mockFs).
2. Return async function reading file.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function promisifyFsReadFile(mockFs) {
>   const fsLib = mockFs || require("fs");
>
>   return function (filePath, encoding) {
>     return new Promise((resolve, reject) => {
>       fsLib.readFile(filePath, encoding, (err, data) => {
>         if (err) return reject(err);
>         resolve(data);
>       });
>     });
>   };
> }
>
> // Verification tests
> const mockFs = {
>   readFile: (p, enc, cb) => cb(null, "MOCK_FILE_CONTENT")
> };
>
> const readFileAsync = promisifyFsReadFile(mockFs);
> readFileAsync("/test.txt", "utf-8").then(content => {
>   console.assert(content === "MOCK_FILE_CONTENT", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Legacy fs Module Wrapping**: Legacy Node.js fs codebases relied heavily on `(err, data)` callbacks.
> 2. **fs.promises Alternative**: Modern Node.js provides `require('fs').promises` natively.
> 3. **Backwards Compatibility**: Promisifying legacy APIs allows upgrading codebases incrementally.
## 6. Related Terms
- [Callbacks & Callback Hell](callbacks.md) — The problem this tool solves.
- [The fs Module (File System)](../level_02/fs_module.md) — The most common module that was historically Promisified.
- [The os & util Modules](../level_02/os_util_modules.md) — Related concept: The os & util Modules.
- [async / await in Node](async_await.md) — Related concept: async / await in Node.

---

## 7. Key Takeaways
- **Promisification** converts legacy Callback functions into modern Promises.
- It allows you to use modern **`async/await`** syntax with ancient Node.js libraries.
- Node provides the built-in **`util.promisify`** method to do this automatically.
- It only works if the legacy function strictly follows the `(err, data)` Error-First convention.
