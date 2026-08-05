# Web APIs vs the Language

> **Level 10 — Ecosystem & Tooling**
> Distinguishing engine (ECMAScript) from host APIs.

---

## 1. Prerequisites
- [ECMAScript](../level_01/ecmascript.md) — The official specification defining the core JavaScript language standards.
- [JavaScript Engine](../level_05/javascript_engine.md) — The interpreter executing JS code.

---

## 2. Term Category
- **Ecosystem / Tooling**

---

## 3. Environment Context
- **Universal**: Crucial for understanding browser and server execution boundaries.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Developers often confuse what features belong to the core JavaScript language itself versus what features are supplied by the surrounding host environment (the web browser or Node.js). For example, beginners are often surprised to learn that `fetch()`, `document.querySelector()`, and `setTimeout()` are not defined anywhere in the official JavaScript language specifications, and will crash if executed in a bare-minimum JS interpreter.

To build clean, multi-platform applications, you must separate JavaScript into two layers:

#### 1. Core JavaScript (ECMAScript)
The absolute syntax, rules, and core classes defined by the TC39 committee.
- **Includes:** Keywords (`if`, `for`, `class`, `function`), variable declarations (`let`, `const`), primitives (String, Number, Symbol), and built-in namespace classes (`Array`, `Promise`, `Object`, `Math`, `JSON`, `Map`, `Date`).
- **Availability:** Works **everywhere** identically (Browsers, Node.js, Deno, IoT devices).

#### 2. Host Web APIs (Browser Context)
Dials, knobs, and interfaces injected into the global context by the host environment (the web browser) to allow the JavaScript engine to interact with the webpage and the computer's OS.
- **Includes:** DOM manipulation (`document`, `window`), the Fetch API (`fetch`), Web Storage (`localStorage`), Timers (`setTimeout`, `setInterval`), Audio/Canvas APIs, and Geolocation.
- **Availability:** Works **only inside browsers**. These APIs do not exist in standard server Node.js contexts. 

*Node.js APIs:* Node.js injects its own, separate host APIs instead—such as `fs` (File System access), `path`, and `http` modules, which are absent in browsers for security reasons.

### (2) Reality Metaphor
- **Core JavaScript (ECMAScript)** is like the **internal combustion engine** under a car's hood. It burns fuel (execution flow), moves pistons, and generates raw kinetic energy. The engine operates identically whether you mount it inside a sedan car (the browser), a motorboat (Node.js), or a stationary emergency generator (Deno).
- **Host APIs (Web APIs)** are like the **steering wheel, windshield wipers, and seats** built inside the sedan car. The steering wheel (`document`) lets the engine turn the tires (change HTML). If you take the engine out and bolt it onto a boat, the steering wheel is useless; you throw it away and connect the engine to a rudder handle (Node's `fs` module) instead, but the engine itself runs exactly the same.

### (3) JavaScript Code Examples

#### Environmental Boundary Crossings

##### 1. Pure ECMAScript: Runs Everywhere
```javascript
// This script uses only core language features. 
// It executes perfectly in Chrome, Safari, Node.js, Bun, or Deno.
const numbers = [1, 2, 3];
const double = numbers.map(n => n * 2);
const today = new Date();

console.log(`Doubles: ${double}. Date: ${today.toISOString()}`);
```

##### 2. Browser Host APIs: Crashes in Node.js
```javascript
// This script utilizes Web APIs provided by the browser environment.
// Running this in Node.js triggers "ReferenceError: document is not defined"
const header = document.querySelector("h1");
header.textContent = "Welcome to the Web!";

localStorage.setItem("theme", "dark");
```

##### 3. Node.js Host APIs: Crashes in Browsers
```javascript
// This script utilizes Node's host filesystem API.
// Running this in a browser console triggers "Module not found" or compile-time crashes
import fs from "fs";

fs.writeFileSync("log.txt", "Execution logs...", "utf8");
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accessing Browser Globals in Server Environments (SSR)

**The mistake:** Accessing `window`, `document`, or `localStorage` directly in React/Next.js component code that is pre-rendered on a Node.js server.

**Why it's wrong:** When the server pre-renders the page, Node.js executes the component script. Because Node lacks browser Web APIs, it crashes immediately on `window`, throwing a ReferenceError.

*Incorrect:*
```javascript
function MyComponent() {
  // Crashes on the server during pre-rendering!
  const theme = localStorage.getItem("theme"); 
  return <div>Current theme: {theme}</div>;
}
```

*Fix:*
```javascript
import { useEffect, useState } from "react";

function MyComponent() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // useEffect runs strictly on the client (browser runtime) after mounting!
    // It is safe to access Web APIs here.
    setTheme(localStorage.getItem("theme") || "light");
  }, []);

  return <div>Current theme: {theme}</div>;
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Web Apis Vs Language Callbacks

**The mistake:** Passing methods from Web Apis Vs Language instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "web_apis_vs_language",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "web_apis_vs_language",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Web Apis Vs Language Operations

**The mistake:** Executing asynchronous operations within Web Apis Vs Language without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/web_apis_vs_language"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/web_apis_vs_language");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in web_apis_vs_language: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Context Classifier

**Problem:** Classify the feature as belonging to **ECMAScript Core**, **Web APIs (Browser)**, or **Node.js Host APIs**:

1. The `Array.prototype.filter()` method.
2. The `fetch()` function used to request data.
3. The `fs.readFile()` method.
4. The `Math.random()` utility function.
5. The `document.addEventListener()` event hook.

> [!check]- Answer
> - 1. **ECMAScript Core** (Standard array helper).
> - 2. **Web APIs** (WHATWG standard browser network client, though modern runtimes like Deno/Node 18+ now polyfill it globally).
> - 3. **Node.js Host APIs** (Server filesystem module).
> - 4. **ECMAScript Core** (Standard mathematical namespace helper).
> - 5. **Web APIs** (W3C standard event handler for web pages).


---

### Exercise 2: Distinguishing Core ECMAScript from Host Web APIs

**Problem:** Classify `Math` (ECMAScript) vs `fetch` (Web API) vs `fs` (Node.js API).

**Expected output:**
> [!check]- Answer
> ```text
> Math: ECMAScript, fetch: Web API, fs: Node.js API
> ```
> ```javascript
> console.log("Math: ECMAScript, fetch: Web API, fs: Node.js API");
> ```
>
> **Explanation:** Host environments supply platform-specific APIs extending core ECMAScript specifications.

---

### Exercise 3: Standardization Bodies Overview

**Problem:** Match specification bodies: ECMA TC39 (ECMAScript) vs WHATWG (HTML/DOM/Fetch).

**Expected output:**
> [!check]- Answer
> ```text
> TC39: ECMAScript, WHATWG: Web APIs
> ```
> ```javascript
> console.log("TC39: ECMAScript, WHATWG: Web APIs");
> ```
>
> **Explanation:** TC39 standardizes language syntax; WHATWG standardizes web platform host APIs.


---

## 7. Related Terms
- [window object / BOM](../level_05/window_bom.md) — The browser host global wrapper object.
- [DOM (Document Object Model)](../level_05/dom.md) — The browser page tree representation host API.

---

## 8. Key Takeaways
- ECMAScript defines core JavaScript grammar, keywords, types, and standard library classes (e.g. `Promise`, `JSON`).
- Host APIs are injected by execution environments (browsers, Node.js) to connect the engine to external systems.
- Web APIs (DOM, Web Storage, fetch) are supplied by browsers and do not exist natively in Node.js.
- Node.js APIs (fs, path) are supplied by the server runtime and do not exist in browsers.
- Guard against accessing browser-only globals (like `window`) when writing server-side rendering (SSR) web applications.
