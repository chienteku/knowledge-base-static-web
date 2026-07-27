# Declaration Files (`.d.ts`)

> **Level 11 — Modules, Declaration Files & Configuration**
> Special TypeScript files that contain *only* type information (Interfaces, Types, Signatures) and zero executable implementation code. They are the bridge that allows TypeScript to understand vanilla JavaScript libraries.

---

## 1. Prerequisites
- [The TypeScript Compiler (`tsc`)](../level_01/tsc.md) — The tool that generates or consumes these files.
- [Interfaces](../level_03/interfaces.md) — The primary content of these files.

---

## 2. Term Category
- **TypeScript Architecture / Tooling**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Generating Declaration Files

**Problem:** You are writing a library in TypeScript, and you want to publish it to NPM so other people can use it. How do you generate the `.d.ts` files automatically so developers who download your library get autocomplete?

**Expected output:**
```text
You enable the `"declaration": true` flag in your `tsconfig.json`!
When you run `tsc`, it will compile your `.ts` files into `.js` files (for runtime), AND it will automatically generate `.d.ts` files alongside them (for compile-time typing).
```

> [!check]- Answer
> - Check the `tsconfig.json` options!

---



### Exercise 2: Declaring Module Augmentation for External Package

**Problem:** Augment external module `'express'` to add `user: User` property to `Request` interface.

**Expected output:**
```text
Express Request augmented
```

> [!check]- Answer
> ```typescript
> declare module 'express' {
>   interface Request {
>     user?: { id: string; name: string };
>   }
> }
> console.log("Express Request augmented");
> ```
>
> **Explanation:** `declare module 'pkg'` extends type definitions for third-party libraries.

### Exercise 3: Ambient Window Global Property Declaration

**Problem:** Declare global variable `declare const __VERSION__: string`.

**Expected output:**
```text
Ambient global variable declared
```

> [!check]- Answer
> ```typescript
> declare const __VERSION__: string;
> console.log("Ambient global variable declared");
> ```
>
> **Explanation:** `declare const` informs TS about global variables provided by script tags or bundler defines.

## 7. Related Terms
- [`tsconfig.json`](../level_01/tsconfig.md) — Where you configure TS to emit declaration files.
- [Interfaces](../level_03/interfaces.md) — The core content of `.d.ts` files.

---

## 8. Key Takeaways
- **Declaration Files** (`.d.ts`) are files that contain purely TypeScript type definitions and zero executable logic.
- They are used to describe the "shape" of vanilla JavaScript libraries so the TS compiler can type-check them.
- You install community-maintained declaration files via the `@types/` npm scope.
- If you write a library in TS, you should configure `tsc` to emit `.d.ts` files alongside your `.js` files so consumers get type safety.
- Never write executable logic (like variable assignments or function bodies) inside a `.d.ts` file.
