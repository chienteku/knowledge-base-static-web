# Declaration Files (`.d.ts`)

> **Level 11 — Modules, Declaration Files & Configuration**
> Special TypeScript files that contain *only* type information (Interfaces, Types, Signatures) and zero executable implementation code. They are the bridge that allows TypeScript to understand vanilla JavaScript libraries.

---

## 1. Prerequisites
- [The TypeScript Compiler (`tsc`)](../level_01/tsc.md) — The tool that generates or consumes these files.
- [Interfaces](../level_03/interfaces.md) — The primary content of these files.

---

## 2. Term Category

**TypeScript Ecosystem & Tooling** (Type Definition Files): Declaration files (`.d.ts`) provide ambient type definitions for untyped JavaScript libraries without emitting executable code.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
You install a popular npm package written entirely in pure, vanilla JavaScript (e.g., `lodash` or `express`).
Because it's pure JS, there are no Types. When you import it into your TypeScript project, the compiler has no idea what functions exist on it, so everything defaults to `any`, and you lose all type safety.
**Declaration Files** (`.d.ts`) solve this. They act like a "header" file in C++. They provide the TypeScript compiler with a map of all the types, classes, and function signatures that exist inside that vanilla JS library.

### (2) The `.d.ts` Extension
Any file ending in `.d.ts` is a Declaration File. 
- `d` stands for Declaration.
- You CANNOT put executable logic (like `const a = 1;` or `function add() { return 1; }`) inside these files. 
- You can ONLY put types (Interfaces, Type Aliases, and ambient function/class declarations without bodies).

### (3) DefinitelyTyped (`@types/`)
The TypeScript community maintains a massive open-source repository called DefinitelyTyped. It contains Declaration Files for almost every popular JavaScript library in existence.
If you install `npm install express` and TS complains about missing types, you simply run `npm install -D @types/express`. 
This downloads the `.d.ts` files created by the community, instantly providing perfect autocomplete for the vanilla JS library!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting logic in a `.d.ts` file

**The mistake:** A developer creates `globals.d.ts` to hold their global types, but they also try to declare a global helper function inside it: `export const format = (str) => str.trim();`

**Why it's wrong:** The TypeScript compiler completely ignores `.d.ts` files when emitting JavaScript. They are erased. If you put executable logic in a `.d.ts` file, that code will literally never be compiled into your final JS bundle, causing a `"format is not defined"` runtime crash!
**Golden Rule:** `.d.ts` files are strictly for **shapes and types**. If you need executable code, use a standard `.ts` file.

---



### Mistake 2: Writing Code Implementations inside `.d.ts` Declaration Files

**The mistake:** Writing function body implementations `function add(a, b) { return a + b; }` inside a `.d.ts` file.

**Why it's wrong:** Declaration files `.d.ts` specify type contracts ONLY and emit ZERO JavaScript output during compilation. Function implementations inside `.d.ts` cause build errors.

*Incorrect:*
```typescript
// mylib.d.ts
// function add(a: number, b: number) { return a + b; } // ❌ An implementation cannot be declared in ambient contexts
```

*Fix:*
```typescript
// mylib.d.ts
declare function add(a: number, b: number): number; // Correct ambient declaration
```

### Mistake 3: Forgetting Top-Level `export {}` in Global Ambient `.d.ts` Files

**The mistake:** Adding `import` statements to a `.d.ts` file expecting global `declare global` blocks to remain active.

**Why it's wrong:** Adding a top-level `import` or `export` transforms a global declaration file into an ES module! Wrap global extensions in `declare global { ... }`.

*Incorrect:*
```typescript
// mytypes.d.ts
import { User } from './user';
// declare var appConfig: any; // ❌ Now module-scoped instead of global!
```

*Fix:*
```typescript
// mytypes.d.ts
import { User } from './user';
declare global {
    var appConfig: any; // Correct global augmentation inside module file
}
```

## 5. Practice Exercises

### Exercise 1: Authoring Ambient Module Declarations (`.d.ts`)

**Scenario:**
Create an ambient declaration file `global.d.ts` declaring types for an un-typed legacy JavaScript module `my-legacy-lib`.

**Requirements:**
1. Declare module `"my-legacy-lib"`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // global.d.ts
> declare module "my-legacy-lib" {
>   export function init(apiKey: string): void;
>   export function track(eventName: string, payload?: object): void;
> }
> ```
> 
> #### Technical Explanation
>
> 1. `.d.ts` declaration files contain type definitions without any executable JavaScript code output.
> 2. `declare module "name"` provides ambient type intelligence for external untyped JavaScript libraries.
> 3. Allows TypeScript developers to import un-typed npm packages safely with IDE autocomplete.
> 
---

### Exercise 2: Declaring Ambient Global Variables and Window Extensions

**Scenario:**
Extend the global `Window` object interface in `env.d.ts` to include a custom `ENV_CONFIG` global object.

**Requirements:**
1. Declare `interface Window` inside `declare global`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // env.d.ts
> declare global {
>   interface Window {
>     ENV_CONFIG: {
>       apiHost: string;
>       debugMode: boolean;
>     };
>   }
> }
> 
> export {};
> ```
> 
> #### Technical Explanation
>
> 1. `declare global` grants access to the global scope within module files containing imports/exports.
> 2. Interface declaration merging appends `ENV_CONFIG` to the global `Window` interface.
> 3. Enables type-safe access to `window.ENV_CONFIG` across the codebase.
> 
---

### Exercise 3: Auditing Executable Code Restrictions in `.d.ts` Files

**Scenario:**
Explain why including executable code (`const x = 10;` or function bodies) inside `.d.ts` files triggers a compilation error.

**Requirements:**
1. Detail ambient-only code rules in `.d.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // ❌ INCORRECT (Executable function body in .d.ts):
> // export function add(a: number, b: number) { return a + b; }
> 
> // ✅ CORRECT (Ambient declaration only):
> export function add(a: number, b: number): number;
> ```
> 
> #### Technical Explanation
>
> 1. `.d.ts` files are stripped during build output and are NEVER transpiled to `.js` files.
> 2. Executable code in `.d.ts` files would result in missing runtime JavaScript functions.
> 3. `.d.ts` files must contain ambient declarations (`declare`) and type signatures only.
> 
---

## 6. Related Terms
- [`tsconfig.json`](../level_01/tsconfig.md) — Where you configure TS to emit declaration files.
- [Interfaces](../level_03/interfaces.md) — The core content of `.d.ts` files.
- [Namespaces](namespaces.md) — Related concept: Namespaces.
- [Type-Only Imports & Exports](type_only_imports.md) — Related concept: Type-Only Imports & Exports.
- [DefinitelyTyped](definitely_typed.md) — DefinitelyTyped / @types.

---

## 7. Key Takeaways
- **Declaration Files** (`.d.ts`) are files that contain purely TypeScript type definitions and zero executable logic.
- They are used to describe the "shape" of vanilla JavaScript libraries so the TS compiler can type-check them.
- You install community-maintained declaration files via the `@types/` npm scope.
- If you write a library in TS, you should configure `tsc` to emit `.d.ts` files alongside your `.js` files so consumers get type safety.
- Never write executable logic (like variable assignments or function bodies) inside a `.d.ts` file.
