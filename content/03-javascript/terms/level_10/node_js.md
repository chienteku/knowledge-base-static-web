# Node.js

> **Level 10 — Ecosystem & Tooling**
> A cross-platform JavaScript runtime environment that executes code outside a web browser (e.g., servers).

---

## 1. Prerequisites
- [JavaScript Engine](../level_05/javascript_engine.md) — What Node.js is built on top of (specifically V8).
- api — Node.js provides APIs for file systems and networking instead of DOM manipulation.
---

## 2. Term Category
- **Runtime Environment**

---

## 3. Environment Context
- **Node.js** (This is the definition of the environment itself!)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
For the first 14 years of its existence, JavaScript was physically trapped inside the web browser. It could manipulate HTML buttons, but it could not read a file on your computer's hard drive, and it could not listen to a network port to act as a web server. If you wanted to build the "backend" of a website, you had to learn a completely different language like PHP, Python, or Java.

In 2009, Ryan Dahl took the V8 JavaScript Engine out of the Google Chrome browser, bundled it with a bunch of low-level C++ libraries for file access and networking, and called it **Node.js**. Suddenly, developers could use the exact same language (JavaScript) to write both the frontend UI and the backend server. This sparked a massive revolution in web development.

### (2) Reality Metaphor
A web browser is like a children's playroom. JavaScript is the child. Inside the playroom, the child can play with blocks (the DOM) safely, but the doors are locked. They cannot access the house's electrical panel or the plumbing (the operating system).
Node.js took the child out of the playroom, handed them a toolkit, and put them in the basement. Now, the child can't play with blocks (there is no DOM/HTML in Node.js), but they have full access to the electrical panel, the plumbing, and the front door (files, networks, databases).

### (3) JavaScript Code Examples

#### Short Snippet: A simple web server
```javascript
// This code will NOT work in a browser! 
// It requires the Node.js runtime.

// We import Node's built-in 'http' module
const http = require('http');

// We create a server that listens for incoming requests
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Hello from the Node.js Backend!');
});

// We tell it to listen on port 3000
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

#### Fuller Example: Reading a file
```javascript
// We import Node's built-in File System ('fs') module
const fs = require('fs');

console.log("1. Starting file read...");

// Node.js is famous for being Asynchronous!
// It reads the file in the background so it doesn't block the thread.
fs.readFile('database.txt', 'utf8', (err, data) => {
  if (err) {
    console.error("Failed to read file!");
    return;
  }
  console.log("3. File content: ", data);
});

console.log("2. Doing other things while waiting...");

/* Output:
1. Starting file read...
2. Doing other things while waiting...
3. File content: "Secret User Data"
*/
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Node Js Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Node Js blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "node_js";
```

*Fix:*
```javascript
let value = "node_js";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Node Js Callbacks

**The mistake:** Passing methods from Node Js instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "node_js",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "node_js",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Node Js Operations

**The mistake:** Executing asynchronous operations within Node Js without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/node_js"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/node_js");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in node_js: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Global Object

**Problem:** In the browser, the highest-level object is called `window` (which holds things like `setTimeout`). What is the equivalent top-level object called in Node.js?

**Expected output:**
> [!check]- Answer
> ```text
> `global`.
> In Node.js, you can type `global.setTimeout`.
> *(Note: Modern JS introduced `globalThis` to provide a single name that works in both environments!)*
> ```
> - Think universally!

---

### Exercise 2: Node.js Core Modules (`fs`, `path`, `http`)

**Problem:** Import core Node.js `fs` module using `import fs from 'node:fs'` syntax.

**Expected output:**
> [!check]- Answer
> ```text
> Core node:fs module loaded
> ```
> ```javascript
> console.log("Core node:fs module loaded");
> ```
>
> **Explanation:** `node:` prefixes explicitly identify built-in Node.js runtime core modules.

---

### Exercise 3: Reading Environment Variables via `process.env`

**Problem:** Read `process.env.NODE_ENV` defaulting to `"development"`.

**Expected output:**
> [!check]- Answer
> ```text
> development
> ```
> ```javascript
> const env = process.env.NODE_ENV || "development";
> console.log(env);
> ```
>
> **Explanation:** `process.env` exposes system environment key-value pairs to Node.js applications.


---

## 7. Related Terms
- [JavaScript Engine](../level_05/javascript_engine.md) — Node uses the V8 engine to actually execute the code.
- [npm](npm.md) — The package manager installed automatically alongside Node.js.
- [globalThis](../level_08/globalthis.md) — Related concept: globalThis.
- [package.json](package_json.md) — Related concept: package.json.
---

## 8. Key Takeaways
- Node.js is a runtime environment that allows JavaScript to run on servers and local computers.
- It is built on Google Chrome's V8 engine.
- It provides access to the File System, Operating System, and Network (things browsers forbid for security).
- It does NOT have access to the DOM (`document`) or `window`.
```
