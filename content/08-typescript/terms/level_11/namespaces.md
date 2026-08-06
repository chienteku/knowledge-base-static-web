# Namespaces

> **Level 11 — Modules, Declaration Files & Configuration**
> TypeScript's legacy module system (originally called "Internal Modules") used to group related code and prevent global naming collisions before ES Modules existed.

---

## 1. Prerequisites
- [ES Modules in TypeScript](modules.md) — The modern standard that has largely replaced Namespaces.

---

## 2. Term Category

**TypeScript Module System** (Legacy Internal Namespace Organization): Namespaces (`namespace`) provide legacy internal module grouping for organizing code across global script boundaries.

---

## 3. Explanation



---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Namespaces in New Projects Instead of ES Modules

```typescript
// ❌ INCORRECT (Using legacy namespaces in new TS codebases):
namespace Utilities {
  export function format() {}
}

// ✅ CORRECT (Use standard ES modules):
export function format() {}
```

**Why it's wrong:** Namespaces are a legacy pre-ES6 TypeScript feature that generates IIFE objects, hindering tree-shaking and modern bundler optimization.

**Golden Rule:** Prefer standard ES modules (`import`/`export`) over namespaces in all modern code.

---

### Mistake 2: Forgetting `export` Keyword Inside Namespaces

```typescript
namespace MathUtils {
  function add(a: number, b: number) { return a + b; } // Private to namespace!
}

// MathUtils.add(1, 2); // ❌ Compile Error: Property 'add' does not exist on type 'typeof MathUtils'.
```

**Why it's wrong:** Members inside a namespace are private to that namespace by default unless explicitly exported with `export`.

**Golden Rule:** Prefix namespace members with `export` if they need to be accessible outside the namespace.

---

### Mistake 3: Combining Namespaces with Top-Level ES Module Imports

```typescript
import fs from "fs";

// ❌ INCORRECT: Mixing ES module imports with internal namespaces
namespace FileHandler {
  export function read() { return fs.readFileSync("test.txt"); }
}
```

**Why it's wrong:** Mixing top-level ES module `import`/`export` with `namespace` declarations creates confusing module structures that complicate bundler compilation.

**Golden Rule:** Keep namespace usage isolated to legacy `.d.ts` ambient declarations.



## 5. Practice Exercises

### Exercise 1: Organizing Legacy Code with Namespaces

**Scenario:**
Group utility validation functions inside a `Validation` namespace.

**Requirements:**
1. Declare `namespace Validation`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> namespace Validation {
>   export function isEmail(val: string): boolean {
>     return val.includes("@");
>   }
> 
>   export function isZipCode(val: string): boolean {
>     return /^\d{5}$/.test(val);
>   }
> }
> 
> console.log(Validation.isEmail("test@example.com"));
> ```
> 
> #### Technical Explanation
>
> 1. `namespace Name { ... }` creates a named JavaScript IIFE object grouping exported functions and types.
> 2. Legacy mechanism used before ES modules (`import`/`export`) were standardized.
> 3. Exposes members explicitly marked with `export`.
> 
---

### Exercise 2: Multi-File Namespace Merging

**Scenario:**
Merge a `Validation` namespace split across two separate source files.

**Requirements:**
1. Declare `namespace Validation` in file1 and file2.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // StringValidation.ts
> namespace Validation {
>   export const isString = (val: any): boolean => typeof val === "string";
> }
> 
> // NumberValidation.ts
> namespace Validation {
>   export const isNumber = (val: any): boolean => typeof val === "number";
> }
> ```
> 
> #### Technical Explanation
>
> 1. Namespaces automatically merge declarations sharing the same identifier across files.
> 2. Requires compiling with `--outFile` or script concatenation.
> 3. Obsolete in modern TypeScript; replaced by ES modules.
> 
---

### Exercise 3: Comparative Analysis: ES Modules vs Legacy Namespaces

**Scenario:**
Formulate an architectural selection decision matrix comparing ES Modules (`import`/`export`) against TypeScript Namespaces.

**Requirements:**
1. Contrast standardization, tree-shaking, static analysis, and tooling support.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> ES Modules vs Namespaces Matrix:
> - ES Modules (import / export): Official ECMAScript standard. Supported natively by browsers & Node.js, supports tree-shaking, bundlers, and static analysis. PREFERRED.
> - Namespaces (namespace N): Legacy TypeScript-only feature. Generates IIFE objects, poor tree-shaking, non-standard. AVOID for new code.
> ```
> 
> #### Technical Explanation
>
> 1. ES modules are the standardized, industry-wide module system for JavaScript and TypeScript.
> 2. Namespaces are considered legacy and should be avoided in modern codebases.
> 3. Important architectural migration directive.
> 
---




## 6. Related Terms
- [Declaration Files (`.d.ts`)](declaration_files.md) — The main place where you will still see the `namespace` keyword used heavily today.

---


## 7. Key Takeaways

- `namespace` is a legacy pre-ES6 TypeScript feature generating IIFE objects.
- Prefer standard ES modules (`import`/`export`) for all modern TypeScript code.
- Namespace members require `export` to be accessible outside the namespace block.
- Reserve namespace usage for legacy ambient `.d.ts` declaration merging.
