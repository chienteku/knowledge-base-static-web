# ES Modules in TypeScript

> **Level 11 — Modules, Declaration Files & Configuration**
> How TypeScript implements the standardized ECMAScript module system (`import` and `export`) to share code and types between different files.

---

## 1. Prerequisites
- [Modules (import/export)](../../../03-javascript/terms/level_08/modules.md) — The fundamental standard that TypeScript is built upon.

---

## 2. Term Category
TypeScript Module System

---

## 3. Core Definition
TypeScript fully embraces the modern JavaScript **ES Modules** standard. You use `export` to expose functions, classes, and variables from one file, and `import` to bring them into another.

The unique aspect of Modules in TypeScript is that you can also `export` and `import` purely TypeScript-specific constructs, like **Interfaces** and **Type Aliases**, which are entirely erased during compilation and do not exist in the final JavaScript output.

---

## 4. Key Characteristics / Rules
- **File Scope:** In TypeScript, any file containing a top-level `import` or `export` is considered a Module. Files without them are treated as global scripts.
- **Type-Only Imports:** TypeScript offers the `import type` syntax specifically for importing interfaces. This guarantees the import is erased during the build process, preventing potential runtime dependency loops.

---

## 5. Typical Usage / Common Patterns

### Exporting and Importing Types
```typescript
// types.ts
export interface User {
  id: number;
  name: string;
}

export type Role = "Admin" | "Guest";

// app.ts
// Using 'import type' ensures no JS is generated for this import
import type { User, Role } from './types';

const admin: User = { id: 1, name: "Alice" };
```

---

## 6. Common Pitfalls
- **Missing File Extensions:** When configuring TypeScript to output native ES Modules for the browser or Node.js (`"moduleResolution": "nodenext"`), you must explicitly include the `.js` extension in your import statements (e.g., `import { func } from './file.js'`), even though the file you are writing is `.ts`. This confuses many developers.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Treating Files Without `import` or `export` Statements as Independent Modules

**The mistake:** Writing variables in a `.ts` file without `export {}` expecting them to be private to that file.

**Why it's wrong:** Files without top-level `import` or `export` are treated as GLOBAL scripts! Variables pollute global scope and collide with other files.

*Incorrect:*
```typescript
// fileA.ts (No imports/exports!)
const name = "Alice"; // ❌ Global collision: Cannot redeclare block-scoped variable 'name'
```

*Fix:*
```typescript
// fileA.ts
export const name = "Alice"; // Converts file into isolated ES module
```

### Mistake 2: Mixing CommonJS `require()` and ESM `import` Syntax Inconsistently

**The mistake:** Writing `import x = require('pkg')` in standard ESM projects.

**Why it's wrong:** Use standard ES module `import x from 'pkg'` syntax when `"module": "esnext"` or `"type": "module"` is configured.

*Incorrect:*
```typescript
import x = require('express'); // CommonJS import syntax
```

*Fix:*
```typescript
import express from 'express'; // Standard ESM import syntax
```

### Mistake 3: Expecting Dynamic `import()` to Evaluate Synchronously

**The mistake:** Writing `const mod = import('./math'); mod.add(1, 2);`.

**Why it's wrong:** Dynamic `import(path)` returns a `Promise` resolving to the module namespace object. Await the import or chain `.then()`.

*Incorrect:*
```typescript
const mod = import('./math');
// mod.add(1, 2); // ❌ Property 'add' does not exist on type 'Promise<any>'
```

*Fix:*
```typescript
const mod = await import('./math');
mod.add(1, 2); // Correct: Awaited module instance
```

## 6. Practice Exercises



### Exercise 1: Module Isolation Verification

**Problem:** Add `export {}` to convert script file into an isolated ES module.

**Expected output:**
> [!check]- Answer
> ```text
> File converted to isolated ES module
> ```
> ```typescript
> export {};
> console.log("File converted to isolated ES module");
> ```
>
> **Explanation:** Top-level `export {}` informs TS parser that the file is an ES module.

---

### Exercise 2: Exporting Type Aliases and Interfaces

**Problem:** Write `export type UserID = string` and `export interface User { id: UserID }`.

**Expected output:**
> [!check]- Answer
> ```text
> Type exports created
> ```
> ```typescript
> export type UserID = string;
> export interface User { id: UserID }
> console.log("Type exports created");
> ```
>
> **Explanation:** Modules export both runtime JavaScript values and compile-time TypeScript types.

---

### Exercise 3: Re-Exporting Modules

**Problem:** Re-export all exports from `./user` using `export * from './user'`.

**Expected output:**
> [!check]- Answer
> ```text
> Module re-exported
> ```
> ```typescript
> export * from './user';
> console.log("Module re-exported");
> ```
>
> **Explanation:** Barrel files use `export * from` to aggregate multiple sub-module exports.

## 7. Related Terms
- [Namespaces](namespaces.md) — TypeScript's outdated, legacy module system that was used before ES Modules became the standard.

---

