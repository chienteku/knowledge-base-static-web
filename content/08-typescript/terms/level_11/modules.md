# ES Modules in TypeScript

> **Level 11 — Modules, Declaration Files & Configuration**
> How TypeScript implements the standardized ECMAScript module system (`import` and `export`) to share code and types between different files.

---

## 1. Prerequisites
- [Modules (import/export)](../../../03-javascript/terms/level_08/modules.md) — The fundamental standard that TypeScript is built upon.

---

## 2. Term Category

**TypeScript Module System** (ES Module Import & Export Syntax): Modules scope variable and type declarations locally, requiring explicit `import` and `export` statements to share code.

---

## 3. Explanation



---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting File Extensions in Relative Imports under `NodeNext`

```typescript
// ❌ INCORRECT under NodeNext:
// import { helper } from "./helper"; // Compile Error!

// ✅ CORRECT (Must include .js extension even in .ts source files):
import { helper } from "./helper.js";
```

**Why it's wrong:** Modern Node.js ES Module resolution (`NodeNext`) requires explicit `.js` file extensions in relative import paths.

**Golden Rule:** Always append `.js` file extensions to relative import paths when targetting `NodeNext`.

---

### Mistake 2: Accidental Global Script Pollution by Omitting `import` / `export`

```typescript
// script.ts (Contains no top-level import/export)
const globalConfig = { port: 8080 }; // Leaks into global scope across project!
```

**Why it's wrong:** TypeScript treats files without top-level `import` or `export` statements as global scripts, polluting global scope.

**Golden Rule:** Add `export {}` at the top or bottom of standalone files to enforce module scoping.

---

### Mistake 3: Mixing CommonJS `require()` with ES Module `import`

```typescript
// ❌ INCORRECT: Mixing require with ES module syntax
// const fs = require("fs");
// export function readFile() {}

// ✅ CORRECT (Use ES module import syntax throughout):
import fs from "fs";
export function readFile() {}
```

**Why it's wrong:** Mixing CommonJS `require()` and ES `import`/`export` leads to module resolution ambiguity and bundler compilation warnings.

**Golden Rule:** Use standard ES `import`/`export` syntax consistently across TypeScript modules.





## 5. Practice Exercises

### Exercise 1: Exporting and Importing Named & Default Module Members

**Scenario:**
Export named and default functions from `mathUtils.ts` and import them in `app.ts`.

**Requirements:**
1. Use `export default` and `export const`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // mathUtils.ts
> export const PI = 3.14159;
> export function add(a: number, b: number): number { return a + b; }
> export default function multiply(a: number, b: number): number { return a * b; }
> ```

> ```typescript
> // app.ts
> import multiply, { PI, add } from "./mathUtils.js";

console.log(add(5, 10));
console.log(multiply(2, 4));
```

> #### Technical Explanation
>
> 1. Named exports (`export const PI`) require exact curly brace matching during import (`import { PI }`).
> 2. Default exports (`export default`) are imported without curly braces and can be renamed freely at import sites.
> 3. Standard ES module syntax.

---

### Exercise 2: Re-Exporting Modules from Index Barrel Files

**Scenario:**
Create an `index.ts` barrel file that re-exports all components from sub-modules.

**Requirements:**
1. Use `export * from "./Component.js"`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // components/index.ts
> export * from "./Button.js";
> export * from "./Card.js";
> export { default as Modal } from "./Modal.js";
> ```

> #### Technical Explanation
>
> 1. Barrel export files (`index.ts`) consolidate exports from multiple internal sub-modules into a single public import entry point.
> 2. Simplifies import paths for external consumers (`import { Button, Card } from "./components"`).
> 3. Standard module architecture pattern.

---

### Exercise 3: Auditing Global Script vs Module Scope

**Scenario:**
Explain why a TypeScript file containing NO `import` or `export` statements is treated as a global script instead of a module.

**Requirements:**
1. Show why top-level variables leak into global scope without `export {}`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // script.ts (Contains NO import/export):
> const globalVar = "I leak into global scope!";
> 
> // Fix: Add empty export to force ES module scoping:
> export {};
> ```

> #### Technical Explanation
>
> 1. Files without top-level `import` or `export` statements are evaluated as global scripts by TypeScript.
> 2. Top-level variables in global scripts collide across files sharing the same project context.
> 3. Adding `export {}` forces TypeScript to treat the file as a scoped ES module.

---





---



## 6. Related Terms
- [Namespaces](namespaces.md) — TypeScript's outdated, legacy module system that was used before ES Modules became the standard.

---

---

## 7. Key Takeaways

- ES Modules (`import`/`export`) scope variables locally within files.
- `NodeNext` module resolution requires explicit `.js` extensions in relative import paths.
- Add `export {}` to force module scoping on standalone TypeScript files.
- Use index barrel files (`index.ts`) to clean up public module exports.
