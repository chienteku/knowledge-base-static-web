# TypeScript

> **Level 1 — Core Concepts & Environment Setup**
> A strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It is a strict syntactical superset of JavaScript.

---

## 1. Prerequisites
- JavaScript — The foundation that TypeScript is built upon.

---

## 2. Term Category
- **Language / Core Concept**

---

## 3. Environment Context
- **Build-Time (Development Only)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript is a dynamically typed language. If you pass an object instead of a string to a function, JavaScript won't complain until the code actually runs in the user's browser, leading to a fatal crash (`undefined is not a function`).
As web applications grew from tiny scripts into massive enterprise applications with millions of lines of code, this lack of safety became a nightmare. Developers spent hours tracing stupid typos.
Microsoft created **TypeScript** to solve this. It adds a "Type System" on top of JavaScript. It acts as an insanely smart spellchecker that yells at you *while you are typing in your editor*, long before the code ever reaches the browser.

### (2) The "Superset" Concept
TypeScript is a **superset** of JavaScript. This means that every valid JavaScript program is already a valid TypeScript program! 
TypeScript just adds new, optional syntax (like `interface` and `type` annotations) on top. 

### (3) The Erasure Concept
Browsers (like Chrome or Safari) and Node.js *cannot* run TypeScript natively. They only understand plain JavaScript.
Therefore, TypeScript is purely a **Development Tool**. Before your code runs, you must run it through the TypeScript Compiler. The compiler checks your code for errors, and then completely **erases** all the TypeScript-specific syntax, spitting out standard JavaScript. 

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing TypeScript guarantees runtime safety

**The mistake:** A developer writes an API fetch: `const user: User = await fetch('/api/user').then(r => r.json())`. They assume that because they typed it as `User`, TypeScript will magically protect them if the backend sends bad data.

**Why it's wrong:** TypeScript is *erased* during compilation. It does absolutely nothing at Runtime. If the backend API sends `{ error: "Not Found" }` instead of a User object, the browser will not throw a Type Error. It will just fail silently or crash later.
**Golden Rule:** TypeScript only protects you from your own code at compile-time. It does NOT validate incoming data at runtime. (Use a library like Zod for runtime validation).

---



### Mistake 2: Expecting TypeScript Type Annotations to Validate Data at Runtime

**The mistake:** Writing `const data: User = JSON.parse(str);` expecting TS to validate JSON fields.

**Why it's wrong:** TypeScript types are erased during compilation. `JSON.parse` returns raw objects without runtime validation.

*Incorrect:*
```typescript
interface User { name: string; }
const u: User = JSON.parse('{"invalid": 123}'); // Compiles, but u.name is undefined at runtime!
```

*Fix:*
```typescript
interface User { name: string; }
const u = JSON.parse('{"name": "Alice"}');
if (typeof u?.name === "string") { /* Safely validated */ }
```

### Mistake 3: Importing Type Declarations into Non-TypeScript Build Environments

**The mistake:** Executing raw `.ts` files directly in Node.js without `ts-node`, `tsx`, or compilation.

**Why it's wrong:** Node.js (without experimental flags) does not natively execute TypeScript syntax. Compile first with `tsc` or run with `tsx`.

*Incorrect:*
```typescript
$ node src/index.ts # ❌ SyntaxError: Unexpected token ':'
```

*Fix:*
```typescript
$ npx tsx src/index.ts # Runs TS directly via transparent transpile
```

## 6. Practice Exercises

### Exercise 1: Valid TypeScript?

**Problem:** Is this perfectly valid TypeScript code?
```javascript
function greet(name) {
  console.log("Hello, " + name);
}
```

**Expected output:**
```text
Yes!
Because TypeScript is a superset of JavaScript, standard JS is perfectly valid TS. However, if you turn on "Strict Mode" (which you always should), TypeScript will warn you that `name` is implicitly an `any` type, and it will ask you to add an explicit type annotation.
```

> [!check]- Answer
> - Remember the definition of a "Superset".

---



### Exercise 2: TypeScript Erasure Verification

**Problem:** State what happens to `interface User {}` after `tsc` compilation to JavaScript.

**Expected output:**
```text
Completely erased; zero runtime JS code emitted
```

> [!check]- Answer
> ```typescript
> console.log("Completely erased; zero runtime JS code emitted");
> ```
>
> **Explanation:** Type annotations, interfaces, and type aliases produce zero runtime code.

### Exercise 3: TypeScript Superset Principle

**Problem:** Is standard ES6 JavaScript valid TypeScript source code?

**Expected output:**
```text
Yes, valid TypeScript source code
```

> [!check]- Answer
> ```typescript
> console.log("Yes, valid TypeScript source code");
> ```
>
> **Explanation:** TypeScript is a syntactic superset of JavaScript.

## 7. Related Terms
- [The TypeScript Compiler (tsc)](../level_01/tsc.md) — The engine that strips the types away.
- [Static Typing vs Dynamic Typing](../level_01/static_dynamic_typing.md) — The fundamental difference between TS and JS.

---

## 8. Key Takeaways
- **TypeScript** is a strict syntactical superset of JavaScript created by Microsoft.
- It catches errors at **Compile-Time** (in your editor) rather than at Runtime (in the browser).
- Browsers cannot run TypeScript natively; it must be compiled down to plain JavaScript.
- All TypeScript types and annotations are completely erased during the build step.
- TypeScript provides zero safety or validation at Runtime.
