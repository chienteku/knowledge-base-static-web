# Promisification (util.promisify)

> **Level 5 — Asynchronous Patterns**
> The process of wrapping an old, legacy "Error-First" callback function into a modern JavaScript Promise, allowing you to use `async/await` with ancient Node.js libraries.

---

## 1. Prerequisites
- [Callbacks & Callback Hell](../level_05/callbacks.md) — The legacy system you are trying to escape.

---

## 2. Term Category
- **Node.js Core Utility / Design Pattern**

---

## 3. Environment Context
- **Node.js Only** (Though the concept exists in browsers, the `util` module is Node-specific).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Manual Promisification

**Problem:** How does `util.promisify` actually work under the hood? Write a function that takes an old callback function `getUser(id, callback)` and manually wraps it in a Promise.

**Expected output:**
> [!check]- Answer
> ```javascript
> function getUserPromise(id) {
>   // 1. Return a new Promise
>   return new Promise((resolve, reject) => {
>     // 2. Call the old function
>     getUser(id, (err, data) => {
>       // 3. Reject if error, Resolve if success
>       if (err) return reject(err);
>       resolve(data);
>     });
>   });
> }
> ```
> - You need to return `new Promise(...)`.
> - If `err` exists, what do you call? `resolve` or `reject`?

---



### Exercise 2: Promisifying Legacy Callback Function

**Problem:** Promisify `fs.readFile` using `util.promisify`.

**Expected output:**
> [!check]- Answer
> ```text
> const readFileAsync = util.promisify(fs.readFile); const data = await readFileAsync('file.txt', 'utf-8');
> ```
> ```javascript
> const util = require('util');
> const fs = require('fs');
> const readFileAsync = util.promisify(fs.readFile);
> const data = await readFileAsync('file.txt', 'utf-8');
> ```
>
> **Explanation:** `util.promisify` converts standard Node error-first callback functions into Promise functions.

---

### Exercise 3: Native Promise Alternatives in Node.js Core

**Problem:** Which built-in Node.js module namespace provides pre-promisified file system methods?

**Expected output:**
> [!check]- Answer
> ```text
> node:fs/promises (or fs.promises)
> ```
> ```text
> node:fs/promises
> ```
>
> **Explanation:** Modern Node.js core modules (`fs/promises`, `dns/promises`, `timers/promises`) provide native promises out-of-the-box.

## 7. Related Terms
- [Callbacks & Callback Hell](../level_05/callbacks.md) — The problem this tool solves.
- [The `fs` Module](../level_02/fs_module.md) — The most common module that was historically Promisified.

---

## 8. Key Takeaways
- **Promisification** converts legacy Callback functions into modern Promises.
- It allows you to use modern **`async/await`** syntax with ancient Node.js libraries.
- Node provides the built-in **`util.promisify`** method to do this automatically.
- It only works if the legacy function strictly follows the `(err, data)` Error-First convention.
