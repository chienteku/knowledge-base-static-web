# The os & util Modules

> **Level 2 — Core Modules & Globals**
> Reading CPU/memory info and helpers like `util.promisify` (already relied on in Level 5).

---

## 1. Prerequisites
- [Global Objects (global, __dirname, __filename)](global_objects.md) — Built-in variables in the Node execution context.
- [The process Object](process_object.md) — Node.js OS and utility core modules.

---

## 2. Term Category

**Core Module (Node.js Core Architecture .)**: The os & util Modules is a fundamental concept in this technology stack. **Level 2 — Core Modules & Globals**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: System Resource Health Monitor

**Scenario:** A health check endpoint inspects system CPU load, total memory, and free memory via the Node.js `os` core module.

**Requirements:**
1. Write getSystemMetrics(mockOs).
2. Calculate free memory percentage.
3. Retrieve system uptime and CPU count.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function getSystemMetrics(mockOs) {
>   const osLib = mockOs || require("os");
>
>   const totalMem = osLib.totalmem();
>   const freeMem = osLib.freemem();
>   const freeMemPct = Number(((freeMem / totalMem) * 100).toFixed(2));
>
>   return {
>     cpusCount: osLib.cpus().length,
>     uptimeSec: osLib.uptime(),
>     totalMemBytes: totalMem,
>     freeMemBytes: freeMem,
>     freeMemPct,
>     isHealthy: freeMemPct >= 10.0 // Warning if free memory < 10%
>   };
> }
>
> // Verification tests
> const mockOs = {
>   totalmem: () => 16_000_000_000,
>   freemem: () => 4_000_000_000,
>   cpus: () => [{}, {}, {}, {}],
>   uptime: () => 3600
> };
>
> const metrics = getSystemMetrics(mockOs);
> console.assert(metrics.cpusCount === 4, "Test 1 Failed");
> console.assert(metrics.freeMemPct === 25.0, "Test 2 Failed");
> console.assert(metrics.isHealthy === true, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Node.js `os` Module**: Provides access to operating system information (CPUs, memory, uptime, network interfaces, load averages).
> 2. **Memory Health Monitoring**: Monitoring `os.freemem()` protects servers against OS Out-Of-Memory (OOM) process kills.
> 3. **CPU Count for Clustering**: Use `os.cpus().length` to determine optimal worker count when configuring Node.js `cluster` mode.
> 
---

### Exercise 2: Custom util.promisify Adapter Factory

**Scenario:** Implements a custom promisify wrapper to convert legacy Node.js callback functions `(err, result) => {}` into ES6 Promises.

**Requirements:**
1. Write promisifyCustom(callbackBasedFn).
2. Return function returning Promise.
3. Handle err and result parameters.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function promisifyCustom(callbackBasedFn) {
>   return function (...args) {
>     return new Promise((resolve, reject) => {
>       callbackBasedFn(...args, (err, result) => {
>         if (err) return reject(err);
>         resolve(result);
>       });
>     });
>   };
> }
>
> // Verification tests
> const legacyFn = (x, y, cb) => {
>   if (x < 0) return cb(new Error("Negative value"));
>   cb(null, x + y);
> };
>
> const asyncFn = promisifyCustom(legacyFn);
>
> asyncFn(10, 20).then(sum => {
>   console.assert(sum === 30, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Node.js `util.promisify`**: Core utility converting standard Node.js error-first callback functions into Promises.
> 2. **Error-First Callback Convention**: Node.js standard: first callback parameter is always `err` (null if success).
> 3. **util.promisify.custom Symbol**: Custom functions can override promisify behavior by defining `[util.promisify.custom]` symbol.
> 
---

### Exercise 3: Complex Object Formatter with util.inspect

**Scenario:** An APM error logger formats deeply nested objects and Circular references cleanly using `util.inspect()`.

**Requirements:**
1. Write formatComplexObject(obj, maxDepth, mockUtil).
2. Format object with util.inspect.
3. Handle circular references.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function formatComplexObject(obj, maxDepth = 2, mockUtil) {
>   const utilLib = mockUtil || require("util");
>
>   return utilLib.inspect(obj, {
>     showHidden: false,
>     depth: maxDepth,
>     colors: false,
>     compact: true
>   });
> }
>
> // Verification tests
> const circular = { name: "test" };
> circular.self = circular;
>
> const mockUtil = {
>   inspect: (target, opts) => `[Formatted Object depth=${opts.depth}]`
> };
>
> const formatted = formatComplexObject(circular, 3, mockUtil);
> console.assert(formatted.includes("depth=3"), "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **util.inspect Utility**: Debugging utility stringifying objects with configurable depth and circular reference safety.
> 2. **Circular Reference Handling**: Prevents `JSON.stringify` crashes when objects reference themselves (`TypeError: Converting circular structure to JSON`).
> 3. **Custom Inspection**: Objects can implement custom `[util.inspect.custom]()` method to customize string format.
## 6. Related Terms
- [Promisification (util.promisify)](../level_05/promisification.md) — The concept behind async callback conversion.
- [PM2 (Process Manager)](../level_10/pm2.md) — Multiple processes that scale dynamically based on CPU core counts.

---

## 7. Key Takeaways
- The built-in `os` and `util` modules query system hardware and translate legacy APIs.
- Use `os.cpus()` to find the number of logical cores, which is critical for process clustering.
- `os.freemem()` and `os.totalmem()` calculate available system memory.
- `util.promisify()` converts standard Node-style callback functions into clean Promises.
- Avoid hardcoding thread or fork counts; query resources dynamically using `os` instead.
