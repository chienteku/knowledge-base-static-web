# Named vs Default Exports

> **Level 8 — Modern JavaScript (ES6+)**
> Two module export styles and their import syntax.

---

## 1. Prerequisites
- [Modules (import/export)](modules.md) — The standard way to organize and share code between JavaScript files.

---

## 2. Term Category

**Language Core (Universal: Works everywhere modern JavaScript is supported)**: Named vs Default Exports is a fundamental concept in this technology stack. **Level 8 — Modern JavaScript (ES6+)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Structuring Utility Libraries with Named & Default Exports

**Scenario:** A UI component library exports a main Component class as default export and supplementary helper functions as named exports.

**Requirements:**
1. Simulate module export structure containing { default: Button, formatButtonText }.
2. Import and execute both exports.
3. Verify export signatures.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createComponentModule() {
>   class Button {
>     constructor(label) { this.label = label; }
>   }
>   const formatButtonText = (text) => text.toUpperCase();
>
>   return {
>     default: Button,
>     formatButtonText
>   };
> }
>
> // Verification tests
> const moduleExports = createComponentModule();
> const ButtonClass = moduleExports.default;
> const btn = new ButtonClass("Submit");
>
> console.assert(btn.label === "Submit", "Test 1 Failed");
> console.assert(moduleExports.formatButtonText("cancel") === "CANCEL", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Named Exports**: Export multiple bindings per module (export const foo = ...); importers must use matching export names.
> 2. **Default Export**: Export one primary fallback entity per module (export default class ...); importers can choose local name.
> 3. **Barrel Export Pattern**: Aggregates multiple module exports into a single index entry file.
> 
---

### Exercise 2: Named Vs Default Exports Advanced Context Handler

**Scenario:** A web application component processes named vs default exports data operations within enterprise workflows.

**Requirements:**
1. Write handleNamedVsDefaultExportsSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleNamedVsDefaultExportsSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleNamedVsDefaultExportsSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Named Vs Default Exports Architecture**: Applying named vs default exports patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Named Vs Default Exports Performance Optimization

**Scenario:** An application utility optimizes named vs default exports execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeNamedVsDefaultExportsTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeNamedVsDefaultExportsTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeNamedVsDefaultExportsTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Named Vs Default Exports Optimization**: Optimizing named vs default exports improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Dynamic import()](dynamic_import.md) — Promise-based module loader.
- [Modules (import/export)](modules.md) — Related concept: Modules (import/export).

---

## 7. Key Takeaways
- Named exports permit multiple exported values per file; imports require matching name strings enclosed in curly braces `{}`.
- Default exports permit at most one exported value per file; imports omit curly braces `{}` and can be named arbitrarily.
- Use `as` inside named imports to rename them, avoiding namespace conflicts.
- Mix named and default exports in a single file by using: `import DefaultVal, { NamedVal1, NamedVal2 } from "./module.js"`.
