# The os & util Modules

> **Level 2 — Core Modules & Globals**
> Reading CPU/memory info and helpers like `util.promisify` (already relied on in Level 5).

---

## 1. Prerequisites
- [Global Objects (global, __dirname, __filename)](./global_objects.md) — Built-in variables in the Node execution context.

---

## 2. Term Category
- **Core Module**

---

## 3. Environment Context
- **Node.js Core Architecture** (Provides interfaces linking JavaScript to the host operating system resources).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Node.js applications often need to query details about the host machine's hardware (e.g. checking how many CPU cores are available to determine clustering strategies, or checking available memory). They also require helper utilities for code conversion (like converting legacy error-first callbacks into Promises).

Instead of requiring developers to write complex native C++ code to communicate with the host hardware, Node.js provides two built-in standard modules:

#### 1. The `os` Module
Provides access to operating system information and host hardware details.
-   **`os.cpus()`:** Returns an array of objects describing each logical CPU core. This is essential for calculating the optimal number of process forks in cluster environments.
-   **`os.freemem()` / `os.totalmem()`:** Returns the amount of free and total system RAM in bytes.
-   **`os.homedir()`:** Resolves the path of the current user's home directory.
-   **`os.platform()`:** Identifies the OS platform (e.g. `darwin` for macOS, `win32` for Windows, `linux` for Linux).

#### 2. The `util` Module
Provides helper functions for debugging, formatting, and API modernization.
-   **`util.promisify()`:** A utility that accepts a standard Node-style callback function (which expects a callback like `(err, result) => {}` as its final parameter) and wraps it, returning a clean JavaScript Promise.

---

### (2) Reality Metaphor
Imagine driving a vehicle.
- **The `os` Module** is the **vehicle's dashboard**. It shows you how many cylinders are in the engine (**CPU cores**), how much fuel is in the tank (**RAM**), and whether you are driving on asphalt or mud (**platform OS**).
- **The `util` Module** is a **handy multi-tool on your belt**. For example, `util.promisify` is like a converter socket. It takes an old star-shaped screw (**legacy callback function**) and wraps it with a magnetic cap so it can be driven by a modern electric drill (**async/await Promises**).

---

### (3) Code Implementation Examples

#### 1. Checking Hardware Details using the `os` Module
```javascript
const os = require('os');

const cpus = os.cpus().length;
const totalRamGb = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
const freeRamGb = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);

console.log(`OS Platform: ${os.platform()}`);
console.log(`Available CPU Cores: ${cpus}`);
console.log(`RAM: ${freeRamGb} GB free out of ${totalRamGb} GB total`);
```

#### 2. Promisifying Callbacks using the `util` Module
Before `fs.promises` was introduced, developers converted standard callbacks into Promises using `util.promisify`:
```javascript
const fs = require('fs');
const util = require('util');

// Convert standard callback fs.readFile into a Promise-returning function
const readFilePromise = util.promisify(fs.readFile);

async function run() {
  try {
    const data = await readFilePromise('./config.json', 'utf8');
    console.log("File content:", data);
  } catch (err) {
    console.error("Read failed:", err);
  }
}
run();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Hardcoding CPU core workers in clustering strategies

**The mistake:** Hardcoding a cluster script to spin up exactly 8 worker server processes.

**Why it's wrong:** If this code is deployed to a cheap single-core virtual machine in the cloud, Node will spin up 8 workers that will compete for CPU time. This results in heavy context-switching overhead, slowing down the server.

*Fix:* Dynamically query `os.cpus().length` to match the exact core count of the host machine:
```javascript
const os = require('os');
const numCPUs = os.cpus().length; // Scale dynamically!
```

---



### Mistake 2: Using `util.promisify()` on Custom Callback Functions That Don't Follow Error-First Conventions

**The mistake:** Wrapping a function `function (data, callback)` with `util.promisify()`.

**Why it's wrong:** `util.promisify()` expects Node's standard error-first callback signature `(err, value) => {}`. Non-standard callback signatures yield broken promise rejections.

*Incorrect:*
```javascript
function custom(cb) { cb('result'); } // ❌ Missing error parameter in 1st position!
const promiseFn = util.promisify(custom);
```

*Fix:*
```javascript
function custom(cb) { cb(null, 'result'); } // Error-first callback format
const promiseFn = util.promisify(custom);
```

### Mistake 3: Assuming `os.cpus().length` Returns Physical CPU Cores (Hyperthreading Count)

**The mistake:** Assuming `os.cpus().length` equals physical hardware CPU core count.

**Why it's wrong:** `os.cpus().length` returns the number of logical thread cores (including Hyper-Threading / SMT threads), not physical cores.

*Incorrect:*
```javascript
// Assuming 8 logical CPUs means 8 physical hardware core chips
```

*Fix:*
```javascript
const logicalCores = os.cpus().length; // Understand logical threads vs physical cores
```

## 6. Practice Exercises

### Exercise 1: Custom Promisifier

**Problem:** Using `util.promisify`, convert this callback-based delay function into a Promise-based function, then run it using `async/await`:

```javascript
const util = require('util');

// Legacy Callback Function
function delayCallback(ms, callback) {
  setTimeout(() => {
    callback(null, `Delayed for ${ms}ms`);
  }, ms);
}

// Convert
const delay = util.promisify(delayCallback);

async function execute() {
  console.log("Start");
  const message = await delay(1000);
  console.log(message);
  console.log("End");
}
execute();
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Checking Server Memory with OS Module

**Problem:** Calculate free memory percentage using `os.freemem()` and `os.totalmem()`.

**Expected output:**
```text
const freePct = (os.freemem() / os.totalmem()) * 100;
```

> [!check]- Answer
> ```javascript
> const os = require('os');
> const freePct = (os.freemem() / os.totalmem()) * 100;
> console.log(`Free RAM: ${freePct.toFixed(2)}%`);
> ```
>
> **Explanation:** `os.freemem()` and `os.totalmem()` return system memory stats in bytes.

### Exercise 3: Promisifying Legacy setTimeout

**Problem:** Convert legacy `setTimeout(cb, ms)` into a promise-returning function using `util.promisify`.

**Expected output:**
```text
const sleep = util.promisify(setTimeout); await sleep(1000);
```

> [!check]- Answer
> ```javascript
> const util = require('util');
> const sleep = util.promisify(setTimeout);
> await sleep(1000);
> ```
>
> **Explanation:** `util.promisify` converts callback functions into Promise-based functions.

## 7. Related Terms
- [Promisification (util.promisify)](../level_05/promisification.md) — The concept behind async callback conversion.
- [Clustering](../level_10/pm2.md) — Multiple processes that scale dynamically based on CPU core counts.

---

## 8. Key Takeaways
- The built-in `os` and `util` modules query system hardware and translate legacy APIs.
- Use `os.cpus()` to find the number of logical cores, which is critical for process clustering.
- `os.freemem()` and `os.totalmem()` calculate available system memory.
- `util.promisify()` converts standard Node-style callback functions into clean Promises.
- Avoid hardcoding thread or fork counts; query resources dynamically using `os` instead.
