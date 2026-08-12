# Alternative Runtimes (Deno / Bun)

> **Level 10 — Ecosystem & Tooling**
> Modern JS/TS runtimes beyond Node.js.

---

## 1. Prerequisites
- [Node.js](node_js.md) — The original server-side JavaScript runtime environment.

---

## 2. Term Category

**Ecosystem / Tooling (Universal: Applicable to server environments, edge runtimes, and local scripts.)**: Alternative Runtimes (Deno / Bun) is a fundamental concept in this technology stack. **Level 10 — Ecosystem & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
For over a decade, Node.js was the only runtime environment for executing JavaScript on servers. However, because Node.js was created in 2009, it has structural legacy constraints. It was designed before Promises, TypeScript, ES Modules, or standard browser Web APIs (like `fetch`) existed. 

To address these limitations, two modern alternative runtimes were built:

#### Deno
Created by Ryan Dahl (the original creator of Node.js) to fix his design regrets:
- **Secure by Default:** Deno runs scripts inside a sandboxed environment. Code cannot read files, access the network, or read environment variables unless you pass explicit authorization flags (e.g. `deno run --allow-net app.ts`).
- **First-Class TypeScript:** Natively compiles and executes TypeScript and JSX files out of the box without requiring manual build tools.
- **Web Standard Alignment:** Implements standard browser Web APIs (like `fetch`, `Headers`, `Request`, `Response`).
- **URL Imports:** Imports modules directly via URLs (`import { serve } from "https://deno.land/..."`), bypassing `node_modules` entirely.

#### Bun
Built from scratch with a focus on performance and development speed:
- **Engine Swap:** Built on WebKit's **JavaScriptCore (JSC)** engine (the fast Safari engine) rather than Google Chrome's V8 engine used by Node and Deno.
- **Extreme Speed:** Starts, executes, and installs dependencies up to 10x faster than Node.
- **All-in-One Toolkit:** Acts as a runtime, a package manager (replacing `npm`), a test runner (replacing `jest`), and a bundler (replacing `esbuild`).
- **Dual Module Support:** Natively supports both CommonJS (`require`) and ES Modules (`import`) in the same file.

### (2) Reality Metaphor
- **Node.js** is like a **classic gasoline-powered station wagon**. It is sturdy and has transported cargo for years. However, it requires constant custom add-ons (Babel, ts-node) to get modern features, and only accepts old fuel caps (CommonJS default).
- **Deno** is like a **high-security electric car**. The doors are locked tight with biometric security (security flags). It comes with built-in sensors (TS support) and plugs directly into standard global electric chargers (Web APIs).
- **Bun** is like a **jet-propelled racing kart**. It goes from 0 to 60 in milliseconds. It has a built-in kitchen, GPS, and tool rack (all-in-one toolkit) and has a hybrid engine that burns gas and electricity simultaneously (CJS and ESM).

### (3) JavaScript Code Examples

#### Native Fetch compared across runtimes
In older Node.js versions, developers had to install third-party libraries (like `node-fetch`) just to fetch data. In Deno and Bun, standard browser APIs are global variables.

```javascript
// Native code: runs directly in Deno or Bun (and Node 18+) without npm installs!
async function getGitHubProfile(username) {
  // fetch, Response, and headers are built-in globals!
  const response = await fetch(`https://api.github.com/users/${username}`);
  
  if (!response.ok) {
    throw new Error(`User not found: ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`GitHub User: ${data.name} (Bio: ${data.bio})`);
}

getGitHubProfile("ry"); 
```

#### Deno Security Model Command Example
```bash
# Attempting to run a script that calls a network API:
$ deno run app.ts
# Result: PermissionDenied: Requires net access to "api.github.com", run again with the --allow-net flag

# The secure, correct command:
$ deno run --allow-net app.ts
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Alternative Runtimes Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Alternative Runtimes blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "alternative_runtimes";
```

*Fix:*
```javascript
let value = "alternative_runtimes";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Alternative Runtimes Callbacks

**The mistake:** Passing methods from Alternative Runtimes instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "alternative_runtimes",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "alternative_runtimes",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Alternative Runtimes Operations

**The mistake:** Executing asynchronous operations within Alternative Runtimes without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/alternative_runtimes"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/alternative_runtimes");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in alternative_runtimes: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Cross-Runtime Environment Classifier (Node vs Deno vs Bun)

**Scenario:** A cross-platform library detects the active JavaScript runtime environment (Node.js, Deno, or Bun) using runtime-specific global identifiers.

**Requirements:**
1. Write detectRuntime().
2. Inspect globalThis.process, globalThis.Deno, and globalThis.Bun.
3. Return runtime name string ("NODE", "DENO", "BUN", or "UNKNOWN").

> [!check]- Answer
>
> #### Implementation
>
> > ```javascript
> function detectRuntime() {
>   if (typeof globalThis.Deno !== "undefined") {
>     return "DENO";
>   }
>   if (typeof globalThis.Bun !== "undefined") {
>     return "BUN";
>   }
>   if (typeof globalThis.process !== "undefined" && globalThis.process.versions && globalThis.process.versions.node) {
>     return "NODE";
>   }
>   return "UNKNOWN";
> }
>
> // Verification tests
> const currentRuntime = detectRuntime();
> console.assert(["NODE", "DENO", "BUN", "UNKNOWN"].includes(currentRuntime), "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Runtime Global Inspection**: Deno defines globalThis.Deno, Bun defines globalThis.Bun, and Node defines process.versions.node.
> 2. **Cross-Runtime Standardization**: Modern runtimes adopt web standard APIs (Fetch, Streams, Crypto) for cross-compatibility.
> 3. **Engine Architecture Differences**: Node and Deno run on V8; Bun runs on JavaScriptCore (JSC) for faster startup times.

---

### Exercise 2: Unified Web Standard Fetch Client across Runtimes

**Scenario:** An API SDK uses native Web Standard Fetch (`fetch()`) supported uniformly across Node 18+, Deno, and Bun runtimes.

**Requirements:**
1. Write fetchApiData(url, mockFetchFn).
2. Execute fetch request.
3. Parse JSON payload.
4. Return result data.

> [!check]- Answer
>
> #### Implementation
>
> > ```javascript
> async function fetchApiData(url, fetchFn = globalThis.fetch) {
>   if (typeof fetchFn !== "function") {
>     throw new Error("Native fetch is not supported in this runtime environment.");
>   }
>   const response = await fetchFn(url);
>   if (!response.ok) {
>     throw new Error(`HTTP Error: ${response.status}`);
>   }
>   return await response.json();
> }
>
> // Verification tests
> const mockFetch = async (url) => ({
>   ok: true,
>   status: 200,
>   json: async () => ({ status: "OK", url })
> });
>
> fetchApiData("https://api.example.com/status", mockFetch).then(data => {
>   console.assert(data.status === "OK", "Test 1 Failed");
>   console.assert(data.url === "https://api.example.com/status", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Web Standards Convergence**: Modern alternative runtimes standardize on Web APIs (Fetch, Request, Response, Headers).
> 2. **Elimination of Polyfills**: Node 18+, Deno, and Bun eliminate third-party fetch libraries in favor of built-ins.
> 3. **Asynchronous Stream Parsing**: response.json() returns a promise parsing the streaming HTTP response body asynchronously.

---

### Exercise 3: High-Performance Runtime File System Abstraction

**Scenario:** A CLI tool provides an abstracted file reading utility that routes file read operations to the fastest runtime-specific file system API available.

**Requirements:**
1. Write readFileAbstract(filePath, fsMock).
2. Check for Bun.file(), Deno.readTextFile(), or fs.promises.readFile().

> [!check]- Answer
>
> #### Implementation
>
> > ```javascript
> async function readFileAbstract(filePath, fsMock) {
>   if (fsMock && typeof fsMock.bunFile === "function") {
>     return await fsMock.bunFile(filePath).text();
>   }
>   if (fsMock && typeof fsMock.denoReadTextFile === "function") {
>     return await fsMock.denoReadTextFile(filePath);
>   }
>   if (fsMock && typeof fsMock.nodeReadFile === "function") {
>     return await fsMock.nodeReadFile(filePath, "utf-8");
>   }
>   throw new Error("No compatible file system API found");
> }
>
> // Verification tests
> const mockFS = {
>   nodeReadFile: async (path, enc) => `content of ${path}`
> };
>
> readFileAbstract("/etc/config.json", mockFS).then(content => {
>   console.assert(content === "content of /etc/config.json", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Runtime File System APIs**: Bun uses Bun.file(path).text(), Deno uses Deno.readTextFile(path), Node uses fs.promises.readFile().
> 2. **Performance Trade-offs**: Bun's file I/O leverages zero-copy system calls for higher throughput than legacy Node callbacks.
> 3. **Abstract Adapter Pattern**: Wraps runtime-specific APIs inside a single unified asynchronous interface.
---

## 6. Related Terms
- [TypeScript](typescript.md) — The typed language natively executed by Deno and Bun.
- [globalThis](../level_08/globalthis.md) — The universal global scope wrapper shared across all three runtimes.

---

## 7. Key Takeaways
- Deno and Bun are modern JavaScript/TypeScript runtimes designed to address Node.js's legacy limitations.
- Deno focuses on secure-by-default execution, native TypeScript support, and web standards.
- Bun focuses on extreme execution speed, package installation performance, and an all-in-one toolbelt.
- Deno compiles TS out-of-the-box and imports via URLs; Bun compiles TS out-of-the-box and replaces npm/jest/esbuild.
- Both runtimes natively implement browser Web APIs like `fetch` as global variables.
