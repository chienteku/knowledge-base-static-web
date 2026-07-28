# Namespaces

> **Level 11 — Modules, Declaration Files & Configuration**
> TypeScript's legacy module system (originally called "Internal Modules") used to group related code and prevent global naming collisions before ES Modules existed.

---

## 1. Prerequisites
- [ES Modules in TypeScript](../level_11/modules.md) — The modern standard that has largely replaced Namespaces.

---

## 2. Term Category
TypeScript Legacy Architecture

---

## 3. Core Definition
Before JavaScript had a native way to `import` and `export` files (ES Modules), everything shared the same global window object. If two different files defined a `function validate()`, they would clash and overwrite each other.

TypeScript invented **Namespaces** to solve this. A Namespace creates a massive invisible wrapper object around your code, ensuring that variables inside the namespace don't leak into the global scope.

---

## 4. Key Characteristics / Rules
- **Declaring:** You use the `namespace` keyword to define it.
- **Exporting Internals:** Everything inside a namespace is private by default. You must use `export` inside the namespace to make it accessible outside.
- **Triple-Slash Directives:** You historically linked namespace files together using `/// <reference path="..." />` comments at the top of the file.

---

## 5. Typical Usage / Common Patterns

### Grouping Related Logic
```typescript
namespace Validation {
  const lettersRegexp = /^[A-Za-z]+$/;

  // We must export the function so it can be accessed outside the namespace
  export function isString(s: string): boolean {
    return lettersRegexp.test(s);
  }
}

// Accessing the namespace
const isValid = Validation.isString("Hello");
```

---

## 6. Common Pitfalls
- **Using Namespaces in Modern Apps:** Do not use namespaces for structuring new applications. ES Modules are the industry standard. Namespaces are now primarily used by library maintainers to write complex Declaration Files (`.d.ts`) to describe global objects like jQuery.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Using Legacy `namespace` Keywords in Modern ES Module Codebases

**The mistake:** Writing `namespace Validation { export function isEmail() {} }` in modern TS apps.

**Why it's wrong:** Namespaces are a legacy pre-ES6 TypeScript grouping mechanism. Modern TypeScript codebases should use standard ES modules (`export`/`import`).

*Incorrect:*
```typescript
namespace Util {
    export function log() {}
} // Legacy internal module syntax
```

*Fix:*
```typescript
// util.ts
export function log() {} // Modern ES module export
```

### Mistake 2: Forgetting `export` Keyword inside `namespace` Declarations

**The mistake:** Declaring functions inside a namespace without `export`.

**Why it's wrong:** Members declared inside namespaces are private to that namespace by default unless marked with `export`.

*Incorrect:*
```typescript
namespace App {
    function secret() {} // Private to App namespace!
}
// App.secret(); // ❌ Property 'secret' does not exist on type 'typeof App'
```

*Fix:*
```typescript
namespace App {
    export function secret() {} // Accessible externally
}
```

### Mistake 3: Nesting Deep Namespaces Creating Complex Global Hierarchy Path Trees

**The mistake:** Declaring `namespace A.B.C.D.E` creating verbose global call paths.

**Why it's wrong:** Deeply nested namespaces complicate code readability and hinder bundler tree shaking optimization.

*Incorrect:*
```typescript
namespace Company.Project.Module.Feature {
    export class Runner {}
}
```

*Fix:*
```typescript
// Use clean modular files with ES module imports
import { Runner } from './feature';
```

## 6. Practice Exercises



### Exercise 1: Namespace Export Usage

**Problem:** Create `namespace Geometry { export const PI = 3.14; }` and access `Geometry.PI`.

**Expected output:**
> [!check]- Answer
> ```text
> 3.14
> ```
> ```typescript
> namespace Geometry {
>   export const PI = 3.14;
> }
> console.log(Geometry.PI);
> ```
>
> **Explanation:** `export` makes namespace properties accessible on the namespace object.

---

### Exercise 2: Multi-File Namespace Merging

**Problem:** Explain how multiple `.ts` files declaring `namespace App` merge their exported members together.

**Expected output:**
> [!check]- Answer
> ```text
> Namespaces with matching names across files merge automatically
> ```
> ```typescript
> console.log("Namespaces with matching names across files merge automatically");
> ```
>
> **Explanation:** TS declaration merging merges namespace blocks across multiple files.

---

### Exercise 3: ES Modules vs Namespaces Rule

**Problem:** Which module system is recommended for modern TypeScript development? (ES Modules)

**Expected output:**
> [!check]- Answer
> ```text
> ES Modules (import / export)
> ```
> ```typescript
> console.log("ES Modules (import / export)");
> ```
>
> **Explanation:** ES Modules are standardized JavaScript module specifications supported natively by modern runtimes.

## 7. Related Terms
- [Declaration Files](../level_11/declaration_files.md) — The main place where you will still see the `namespace` keyword used heavily today.

---
