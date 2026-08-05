# Named vs Default Exports

> **Level 8 — Modern JavaScript (ES6+)**
> Two module export styles and their import syntax.

---

## 1. Prerequisites
- [Modules (import/export)](modules.md) — The standard way to organize and share code between JavaScript files.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere modern JavaScript is supported (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
ES Modules provide two distinct mechanisms to export and import code across files. Choosing between them depends on whether you want to share a collection of utility functions or a single main entity:

#### Named Exports
Ideal for files that contain a collection of independent utilities, functions, or constants (like a math library).
- You can declare **multiple** named exports in a single file by adding the prefix keyword `export`.
- **Import Syntax:** You **must** wrap the imported names inside curly braces **`{}`** and match the exact names used in the export file.
- **Renaming:** Use the `as` keyword to prevent namespace collisions: `import { add as sum } from "./math.js"`.

#### Default Exports
Ideal for files that represent a single unified component, class, or primary function (like a class declaration).
- You can declare **at most one** default export per file using `export default`.
- **Import Syntax:** You **do not** use curly braces `{}`, and you can name the imported reference **whatever you want** at the call site.

### (2) Reality Metaphor
- **Named Exports** are like a **compartmentalized toolbox**. Each tool is individually stored and labeled (e.g. `"hammer"`, `"screwdriver"`, `"wrench"`). When you open the toolbox, you must request them by their exact names: `"Give me the hammer and wrench"` (`import { hammer, wrench }`). If you ask for a tool that doesn't exist, it fails.
- **Default Export** is like a **bakery cake box** containing a single custom birthday cake. You don't need a specific label to refer to it; you just say: `"Give me the cake from that box."` You can carry it home and name the cake whatever you want: `"MyCake"` or `"ChocolateTreat"` (`import MyCake from "./bakery.js"`).

### (3) JavaScript Code Examples

#### Declaring Exports (`mathUtils.js` & `UserService.js`)
```javascript
// --- file: mathUtils.js (Named Exports) ---
// We prefix individual declarations to export them
export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}


// --- file: UserService.js (Default Export) ---
// A file can have only ONE default export
export default class UserService {
  constructor(name) {
    this.name = name;
  }
  
  getUserRole() {
    return "guest";
  }
}
```

#### Consuming Imports (`app.js`)
```javascript
// --- file: app.js ---

// 1. Importing Named Exports: Braces {} are mandatory! Exact names required.
import { PI, add, subtract as minus } from "./mathUtils.js";

console.log("PI value:", PI);
console.log("Add sum:", add(5, 5)); // 10
console.log("Subtract result:", minus(10, 4)); // 6 (renamed)

// 2. Importing Default Export: No braces! We can choose any name we want.
import CustomUserService from "./UserService.js"; 

const service = new CustomUserService("Bob");
console.log(service.name); // "Bob"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Adding curly braces `{}` when importing a default export

**The mistake:** Writing `import { MyComponent } from "./MyComponent.js"` when `MyComponent.js` uses `export default`.

**Why it's wrong:** The braces tell the engine to search for a specific named export named `"MyComponent"`. If the target module only has a default export, the import returns `undefined` or throws a syntax error.

*Incorrect:*
```javascript
import { UserService } from "./UserService.js"; // Returns undefined!
```

*Fix:*
```javascript
import UserService from "./UserService.js"; // Correct
```

---

### Mistake 2: Losing Context Binding (`this`) in Named Vs Default Exports Callbacks

**The mistake:** Passing methods from Named Vs Default Exports instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "named_vs_default_exports",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "named_vs_default_exports",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Named Vs Default Exports Operations

**The mistake:** Executing asynchronous operations within Named Vs Default Exports without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/named_vs_default_exports"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/named_vs_default_exports");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in named_vs_default_exports: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Import Classifier

**Problem:** Complete the import statement in `app.js` to correctly import the named export `logInfo` and the default export `Logger` from `logger.js`.

```javascript
// --- logger.js ---
export function logInfo(msg) { console.log(msg); }
export default class Logger {}

// --- app.js ---
// Write the import statement here

const loggerInstance = new Logger();
logInfo("Logger initialized.");
```

> [!check]- Answer
> - The import statement should look like: `import Logger, { logInfo } from "./logger.js";`.

---

### Exercise 2: Combining Named and Default Imports

**Problem:** Import default `React` and named `{ useState }` in single import line syntax.

**Expected output:**
> [!check]- Answer
> ```text
> Combined import syntax verified
> ```
> ```javascript
> console.log("Combined import syntax verified");
> ```
>
> **Explanation:** `import DefaultItem, { NamedItem } from 'path'` combines default and named imports.

---

### Exercise 3: Renaming Named Exports on Import

**Problem:** Rename named export `import { calculateTax as calc } from './tax.js'`.

**Expected output:**
> [!check]- Answer
> ```text
> Renamed import verified
> ```
> ```javascript
> console.log("Renamed import verified");
> ```
>
> **Explanation:** `import { item as alias }` renames imported named exports locally.


---

## 7. Related Terms
- [Dynamic import()](dynamic_import.md) — Promise-based module loader.
- [Modules (import/export)](modules.md) — Related concept: Modules (import/export).

---

## 8. Key Takeaways
- Named exports permit multiple exported values per file; imports require matching name strings enclosed in curly braces `{}`.
- Default exports permit at most one exported value per file; imports omit curly braces `{}` and can be named arbitrarily.
- Use `as` inside named imports to rename them, avoiding namespace conflicts.
- Mix named and default exports in a single file by using: `import DefaultVal, { NamedVal1, NamedVal2 } from "./module.js"`.
