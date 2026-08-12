# Global Scope

> **Level 3 — Functions & Scope**
> Variables declared outside of any function or block, accessible from anywhere.

---

## 1. Prerequisites
- [Scope](scope.md) — The current context of execution.
- [Variable](../level_01/variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere, but the "Global Object" differs .)**: Global Scope is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Global Configuration Singleton Registry

**Scenario:** A web application component initializes a global configuration object on globalThis to share global constants across modules.

**Requirements:**
1. Write initializeGlobalConfig(configObj).
2. Assign configObj to globalThis.__APP_CONFIG__.
3. Verify global property access.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function initializeGlobalConfig(configObj) {
>   globalThis.__APP_CONFIG__ = Object.freeze({ ...configObj });
>   return globalThis.__APP_CONFIG__;
> }
>
> // Verification tests
> const cfg = initializeGlobalConfig({ env: "production", version: "2.0" });
> console.assert(globalThis.__APP_CONFIG__.env === "production", "Test 1 Failed");
> console.assert(cfg.version === "2.0", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Global Scope Definition**: The global scope is the outermost execution context accessible by all scripts and nested scopes.
> 2. **Cross-Environment globalThis**: Modern standard globalThis provides unified access to global scope across Browsers (window) and Node.js (global).
> 3. **Global Namespace Pollution**: Overusing global variables risks naming collisions and unexpected global mutation bugs.
> 
---

### Exercise 2: Global Scope Variable Pollution Audit & Remediation

**Scenario:** A code security linter audits legacy code to detect accidental global variable creation (assigning to undeclared variables) and refactors them.

**Requirements:**
1. Demonstrate legacy global variable leakage without var/let/const in non-strict mode.
2. Refactor to local block scope.
3. Verify global scope is clean.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function cleanGlobalScopeRefactor() {
>   const localSecret = "sensitive_data";
>
>   return {
>     isGlobalPolluted: typeof globalThis.localSecret !== "undefined",
>     localValue: localSecret
>   };
> }
>
> // Verification tests
> const res = cleanGlobalScopeRefactor();
> console.assert(res.isGlobalPolluted === false, "Test 1 Failed: Global scope polluted");
> console.assert(res.localValue === "sensitive_data", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Accidental Global Leakage**: In non-strict mode, assigning a value to an undeclared variable creates a property on global scope.
> 2. **Strict Mode Protection**: Enabling "use strict" turns undeclared assignments into runtime ReferenceError exceptions.
> 3. **Global Lifetime**: Global variables persist in memory for the lifetime of the application host process.
> 
---

### Exercise 3: Global Execution Context Inspection

**Scenario:** A host environment checker inspects global scope properties to detect host capabilities (Browser DOM vs Node.js runtime).

**Requirements:**
1. Write detectHostEnvironment().
2. Check properties on globalThis.
3. Return environment string ("BROWSER", "NODE", "UNKNOWN").

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function detectHostEnvironment() {
>   if (typeof globalThis.window !== "undefined" && typeof globalThis.document !== "undefined") {
>     return "BROWSER";
>   } else if (typeof globalThis.process !== "undefined" && globalThis.process.versions?.node) {
>     return "NODE";
>   } else {
>     return "UNKNOWN";
>   }
> }
>
> // Verification tests
> const env = detectHostEnvironment();
> console.assert(typeof env === "string" && env.length > 0, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Host Global Objects**: Host environments attach platform APIs (document, process) to global scope.
> 2. **Top-Level Visibility**: Variables declared with var in top-level script scopes attach to the global object.
> 3. **const/let Global Scoping**: Top-level let and const create global scope bindings but do NOT attach properties to globalThis.
---

## 6. Related Terms
- [Scope](scope.md) — The general concept of variable visibility.
- [Local / Function Scope](local_scope.md) — Scope restricted to a function.

---

## 7. Key Takeaways
- Variables declared outside of all functions and blocks are in the Global Scope.
- Global variables can be read and modified by any code anywhere in the file.
- Avoid overusing global variables! It leads to "Global Namespace Pollution" and spaghetti code.
- Always declare variables with `let` or `const` to prevent accidental globals.
