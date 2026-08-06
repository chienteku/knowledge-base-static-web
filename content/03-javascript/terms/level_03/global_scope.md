# Global Scope

> **Level 3 — Functions & Scope**
> Variables declared outside of any function or block, accessible from anywhere.

---

## 1. Prerequisites
- [Scope](scope.md) — The current context of execution.
- [Variable](../level_01/variable.md) — A named container for storing data values.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere, but the "Global Object" differs (it's `window` in Browsers, and `global` in Node.js).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Every application needs a baseline level of memory—a starting point where core settings, major libraries, or environmental data are stored so that any part of the program can access them instantly. 

The Global Scope is the outermost environment in JavaScript. Any variable declared here is not restricted by function walls or block brackets. While powerful, heavily relying on the Global Scope is dangerous. If hundreds of functions are all reading and writing to the same global variables, the application state becomes unpredictable, leading to bugs known as "Global Namespace Pollution."

### (2) Reality Metaphor
The Global Scope is like the PA (Public Address) system in a massive high school. Anyone in the building, no matter what classroom they are in, can hear an announcement made over the PA system. If the principal announces "It's raining," every classroom knows it's raining.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// This is declared in the Global Scope
const appName = "My Cool App";

function displayHeader() {
  // Functions can easily access global variables
  console.log(`Welcome to ${appName}!`); 
}

displayHeader();
```

#### Fuller Example
```javascript
let currentUser = null; // Global state

function login(name) {
  // Modifying the global variable from inside a local scope
  currentUser = name;
  console.log(`${currentUser} has logged in.`);
}

function printStatus() {
  if (currentUser) {
    console.log(`System is currently being used by: ${currentUser}`);
  } else {
    console.log("System is idle.");
  }
}

printStatus();    // System is idle.
login("Alice");   // Alice has logged in.
printStatus();    // System is currently being used by: Alice
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accidental Global Variables

**The mistake:** Forgetting to use `let`, `const`, or `var` when assigning a value to a new variable inside a function.

**Why it's wrong:** In non-strict mode, if you assign a value to a variable name that hasn't been declared, JavaScript assumes you meant to create a Global Variable and attaches it to the global object. This causes massive, silent bugs where inner functions unintentionally overwrite global data.

*Incorrect:*
```javascript
function calculateScore() {
  // Forgot 'let' or 'const'!
  finalScore = 100; 
}

calculateScore();
// wait, finalScore leaked out of the function!
console.log(finalScore); // 100 
```

*Fix:*
```javascript
// Always use "use strict"; at the top of your files!
"use strict";

function calculateScore() {
  const finalScore = 100; // Properly scoped to the function
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Global Scope Callbacks

**The mistake:** Passing methods from Global Scope instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "global_scope",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "global_scope",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Global Scope Operations

**The mistake:** Executing asynchronous operations within Global Scope without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/global_scope"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/global_scope");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in global_scope: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Identify the Scope

**Problem:** In the code below, which variables are in the Global Scope?
```javascript
const a = 1;
function run() {
  const b = 2;
  if (true) {
    const c = 3;
  }
}
const d = 4;
```

**Expected output:**
> [!check]- Answer
> ```text
> `a` and `d` are in the Global Scope.
> (`b` is function scope, `c` is block scope).
> ```
> - Look for variables that are not surrounded by any curly braces `{}`.
> 
---

### Exercise 2: Inspecting Global Scope Objects across Environments

**Problem:** Use `globalThis` to access environment-agnostic global objects across Browser/Node.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> console.log(typeof globalThis !== "undefined");
> ```
>
> **Explanation:** `globalThis` provides a unified standard identifier for global scope objects across browsers (`window`), Node (`global`), and Workers (`self`).
> 
---

### Exercise 3: Var Global Window Property Creation

**Problem:** Demonstrate that top-level `var x = 10` creates a property on global objects in script contexts.

**Expected output:**
> [!check]- Answer
> ```text
> Property attached to global scope
> ```
> ```javascript
> var globalVarTest = 100;
> console.log("Property attached to global scope");
> ```
>
> **Explanation:** Top-level `var` declarations create configurable properties on global environment objects.
> 
> 
---

## 7. Related Terms
- [Scope](scope.md) — The general concept of variable visibility.
- [Local / Function Scope](local_scope.md) — Scope restricted to a function.

---

## 8. Key Takeaways
- Variables declared outside of all functions and blocks are in the Global Scope.
- Global variables can be read and modified by any code anywhere in the file.
- Avoid overusing global variables! It leads to "Global Namespace Pollution" and spaghetti code.
- Always declare variables with `let` or `const` to prevent accidental globals.
