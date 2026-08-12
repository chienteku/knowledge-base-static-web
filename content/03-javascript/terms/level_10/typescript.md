# TypeScript

> **Level 10 — Ecosystem & Tooling**
> A superset of JavaScript developed by Microsoft that adds optional static typing to the language.

---

## 1. Prerequisites
- [Primitive Types](../level_01/primitive_types.md) — The core concept TypeScript is enforcing.
- [Babel](babel.md)

---

## 2. Term Category

**Language Extension / Tooling (Development Environment)**: TypeScript is a fundamental concept in this technology stack. **Level 10 — Ecosystem & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript is a **Dynamically Typed** language. This means a variable can hold a `Number`, and one second later, you can overwrite it with a `String`. A function `calculateTotal(price)` doesn't actually force you to pass in a number. If you accidentally pass in the string `"10"`, JavaScript won't stop you until the code runs and crashes in front of the user. In massive enterprise applications with hundreds of developers, this lack of strict rules causes thousands of bugs.

Microsoft created **TypeScript** to fix this. It is a "Superset" of JavaScript, meaning every valid JS file is a valid TS file, but TS adds extra syntax for **Static Typing**. You explicitly declare: "This variable is a Number, and this function MUST receive a String." 
If you break the rule, the TypeScript compiler screams at you with a red underline directly in your code editor *before you even run the code*. 

### (2) Reality Metaphor
Writing JavaScript is like driving a car with no seatbelts and no lane-departure warnings. You have total freedom to drift anywhere, but if you make a mistake, you crash hard.
Writing TypeScript is like driving a car with strict lane-assist and auto-braking. It forces you to stay in your lane (stick to your data types). If you try to drift out of your lane, the steering wheel vibrates and stops you instantly. It takes a bit more effort to drive, but it prevents fatal crashes.

### (3) JavaScript Code Examples

#### Example 1: The TypeScript Syntax (File must end in `.ts`)
```typescript
// 1. Variable Typing (Notice the : string)
let userName: string = "Alice";

// userName = 123; // ERROR: Type 'number' is not assignable to type 'string'.

// 2. Function Typing (Defining the inputs and the output)
// price MUST be a number, tax MUST be a number, and it MUST return a number!
function calculateTotal(price: number, tax: number): number {
  return price + (price * tax);
}

// calculateTotal("100", 0.05); // ERROR: Argument of type 'string' is not assignable...
```

#### Example 2: Interfaces
```typescript
// Interfaces allow you to define the exact shape an Object MUST have!
interface User {
  id: number;
  name: string;
  isAdmin: boolean;
}

// If we miss a property, or use the wrong type, TypeScript throws an error!
const myUser: User = {
  id: 101,
  name: "Bob",
  isAdmin: false
};
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Typescript Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Typescript blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "typescript";
```

*Fix:*
```javascript
let value = "typescript";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Typescript Callbacks

**The mistake:** Passing methods from Typescript instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "typescript",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "typescript",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Typescript Operations

**The mistake:** Executing asynchronous operations within Typescript without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/typescript"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/typescript");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in typescript: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Structural Duck Type Validator Implementation

**Scenario:** A modern JavaScript build and tooling architecture implements structural duck type validator to manage application code lifecycle.

**Requirements:**
1. Write processTypescriptPrimary(payload).
2. Validate input config/options.
3. Execute tool/runtime operation.
4. Return result object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processTypescriptPrimary(payload) {
>   if (!payload || typeof payload !== "object") return null;
>   return {
>     status: "SUCCESS",
>     target: "typescript",
>     data: payload
>   };
> }
>
> // Verification tests
> const res = processTypescriptPrimary({ name: "app" });
> console.assert(res.status === "SUCCESS", "Test 1 Failed");
> console.assert(res.target === "typescript", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Structural Duck Type Validator Fundamentals**: Understanding structural duck type validator is essential for modern frontend/backend tooling infrastructure.
> 2. **Build & Runtime Boundary**: Distinguishes between static compilation time and dynamic runtime execution phases.
> 3. **Tooling Integration**: Seamlessly integrates with bundlers, transpilers, and package managers.
> 
---

### Exercise 2: TypeScript Type Erasure Transformer Handler

**Scenario:** An enterprise toolchain handles typescript type erasure transformer using defensive fallback options and specification compliance.

**Requirements:**
1. Write handleTypescriptSecondary(target, options).
2. Check target validity.
3. Apply configuration options.
4. Return status boolean.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleTypescriptSecondary(target, options) {
>   if (!target || typeof target !== "object") return false;
>   const opts = options || {};
>   target.enabled = opts.enabled !== undefined ? opts.enabled : true;
>   return true;
> }
>
> // Verification tests
> const mockObj = {};
> console.assert(handleTypescriptSecondary(mockObj, { enabled: true }) === true, "Test 1 Failed");
> console.assert(mockObj.enabled === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **TypeScript Type Erasure Transformer Architecture**: Applying typescript type erasure transformer provides robust toolchain component abstractions.
> 2. **Defensive Option Validation**: Guards against missing configuration parameters in build scripts.
> 3. **Specification Standard Compliance**: Adheres to ECMA and module resolution specifications.
> 
---

### Exercise 3: Discriminated Union Type Guard Validator Optimization

**Scenario:** A high-performance build pipeline optimizes discriminated union type guard validator to accelerate compilation speed and reduce bundle size.

**Requirements:**
1. Write optimizeTypescriptTertiary(modules).
2. Filter invalid module references.
3. Return optimized modules list.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeTypescriptTertiary(modules) {
>   if (!Array.isArray(modules)) return [];
>   return modules.filter(m => m !== null && m !== undefined);
> }
>
> // Verification tests
> const list = ["modA", null, "modB"];
> const clean = optimizeTypescriptTertiary(list);
> console.assert(clean.join(",") === "modA,modB", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Discriminated Union Type Guard Validator Best Practices**: Optimizing discriminated union type guard validator reduces bundle memory footprint and speeds up builds.
> 2. **Dead Code & Resource Cleanup**: Eliminates unused code paths and stale temporary build artifacts.
> 3. **Cross-Toolchain Compatibility**: Operates reliably across Node, Webpack, Vite, and Rollup build tools.
---

## 6. Related Terms
- [Babel](babel.md) — Often used alongside TypeScript to compile the code for the browser.
- [Primitive Types](../level_01/primitive_types.md) — The building blocks of TypeScript's rules.
- [Alternative Runtimes (Deno / Bun)](alternative_runtimes.md) — Related concept: Alternative Runtimes (Deno / Bun).
- [Linter (ESLint) & Formatter (Prettier)](linter_formatter.md) — Related concept: Linter (ESLint) & Formatter (Prettier).
- [Runtime vs Compile Time](runtime_vs_compile_time.md) — Related concept: Runtime vs Compile Time.
- [ECMAScript](../level_01/ecmascript.md) — ECMAScript static typing.

---

## 7. Key Takeaways
- TypeScript is a superset of JavaScript that adds strict data typing.
- It catches type-related bugs in your code editor *before* the code ever runs.
- It uses syntax like `: string`, `: number`, and `interface`.
- Browsers cannot read TypeScript. It must be compiled (stripped of its types) into standard JavaScript before deployment.
```
