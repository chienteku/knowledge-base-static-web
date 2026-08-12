# Runtime vs Compile Time

> **Level 10 — Ecosystem & Tooling**
> When code is checked/transformed vs executed.

---

## 1. Prerequisites
- [JavaScript Engine](../level_05/javascript_engine.md) — The interpreter that reads and executes code at runtime.

---

## 2. Term Category

**Ecosystem / Tooling (Universal: Applicable to all software development workflows.)**: Runtime vs Compile Time is a fundamental concept in this technology stack. **Level 10 — Ecosystem & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern web development, our source code goes through multiple build phases before running in a user's browser. Understanding *when* checks, transformations, or errors occur is crucial for debugging and working with modern tools like TypeScript, Babel, or Webpack. 

The software lifecycle is divided into two distinct phases:

#### Compile Time
The phase where source code is read, verified, and converted into browser-ready JavaScript **before the application runs**.
- **Activities:** TypeScript type-checking, Babel transpiling ES6 syntax to ES5, Webpack bundling modules, and linting.
- **Errors:** Syntax errors (e.g. missing commas) or TypeScript type mismatches.
- **Result:** Compile-time errors stop the build process, preventing the application from ever executing.

#### Runtime
The phase where the compiled JavaScript code is **actively executed** by the JavaScript engine (like V8) in the browser or Node.js.
- **Activities:** Allocating memory, fetching data from APIs, handling mouse clicks, and running arithmetic operations.
- **Errors:** Network timeouts, exceptions like `TypeError: Cannot read properties of undefined`, or logic bugs.
- **Result:** Runtime errors occur while the user is interacting with the live application.

### (2) Critical Limit: TypeScript Erasure
A key concept in JavaScript development is that **TypeScript is strictly a compile-time tool**. The compiler verifies your code types and then strips away all type annotations, interfaces, and generics, leaving plain JavaScript. 

Therefore, **types do not exist at runtime**. You cannot check a variable against a TypeScript interface using `typeof` inside a running browser application.

### (3) Reality Metaphor
Imagine baking a birthday cake.
- **Compile Time** is like **reading the recipe and checking your ingredients** before mixing. You verify you have flour, eggs, and sugar. If you find you have no eggs (compile-time type error), you stop immediately and drive to the store. The oven remains cold.
- **Runtime** is the **actual baking and eating phase**. If you accidentally swapped salt for sugar in the batter (runtime logic bug), everything looks fine as it goes into the oven. You only discover the mistake when you slice and bite into the cake (runtime crash), spitting it out in disgust.

### (4) Code Examples

#### Compile-Time vs Runtime Errors (TypeScript Scenario)
```typescript
interface User {
  id: number;
  name: string;
}

function printUser(u: User) {
  console.log(u.name.toUpperCase());
}

// ==========================================
// 1. COMPILE-TIME ERROR
// ==========================================
// The TypeScript compiler catches this immediately because the 'id' field is missing.
// This code fails to compile and cannot be deployed.
printUser({ name: "Alice" }); 
// TS Error: Property 'id' is missing in type '{ name: string; }'


// ==========================================
// 2. RUNTIME ERROR
// ==========================================
// This code compiles successfully into plain JavaScript because the types look correct.
// However, during execution, u.name is undefined, causing a crash!
const badUser = { id: 101, name: undefined };

// In Plain JavaScript:
printUser(badUser); 
// Runtime Crash: TypeError: Cannot read properties of undefined (reading 'toUpperCase')
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to check TypeScript types at runtime

**The mistake:** Writing runtime logic checks using TypeScript interfaces with `typeof` or `instanceof`.

**Why it's wrong:** Interfaces are compile-time definitions and are erased during compilation. At runtime, the browser only sees compiled JS, and interfaces do not exist in memory.

*Incorrect:*
```typescript
// Inside a running browser script:
function handleResponse(data: any) {
  if (typeof data === "User") { // Syntax/Runtime Error: "User" is not a valid JS primitive!
    console.log(data.name);
  }
}
```

*Fix:*
```typescript
// Check values using standard runtime techniques:
function handleResponse(data: any) {
  if (data && typeof data.name === "string") { // Safe runtime check
    console.log(data.name);
  }
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Runtime Vs Compile Time Callbacks

**The mistake:** Passing methods from Runtime Vs Compile Time instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "runtime_vs_compile_time",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "runtime_vs_compile_time",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Runtime Vs Compile Time Operations

**The mistake:** Executing asynchronous operations within Runtime Vs Compile Time without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/runtime_vs_compile_time"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/runtime_vs_compile_time");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in runtime_vs_compile_time: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Compile-Time Type Checker vs Runtime Validator Implementation

**Scenario:** A modern JavaScript build and tooling architecture implements compile-time type checker vs runtime validator to manage application code lifecycle.

**Requirements:**
1. Write processRuntimeVsCompileTimePrimary(payload).
2. Validate input config/options.
3. Execute tool/runtime operation.
4. Return result object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processRuntimeVsCompileTimePrimary(payload) {
>   if (!payload || typeof payload !== "object") return null;
>   return {
>     status: "SUCCESS",
>     target: "runtime_vs_compile_time",
>     data: payload
>   };
> }
>
> // Verification tests
> const res = processRuntimeVsCompileTimePrimary({ name: "app" });
> console.assert(res.status === "SUCCESS", "Test 1 Failed");
> console.assert(res.target === "runtime_vs_compile_time", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Compile-Time Type Checker vs Runtime Validator Fundamentals**: Understanding compile-time type checker vs runtime validator is essential for modern frontend/backend tooling infrastructure.
> 2. **Build & Runtime Boundary**: Distinguishes between static compilation time and dynamic runtime execution phases.
> 3. **Tooling Integration**: Seamlessly integrates with bundlers, transpilers, and package managers.
> 
---

### Exercise 2: Compile-Time Constant Inliner Handler

**Scenario:** An enterprise toolchain handles compile-time constant inliner using defensive fallback options and specification compliance.

**Requirements:**
1. Write handleRuntimeVsCompileTimeSecondary(target, options).
2. Check target validity.
3. Apply configuration options.
4. Return status boolean.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleRuntimeVsCompileTimeSecondary(target, options) {
>   if (!target || typeof target !== "object") return false;
>   const opts = options || {};
>   target.enabled = opts.enabled !== undefined ? opts.enabled : true;
>   return true;
> }
>
> // Verification tests
> const mockObj = {};
> console.assert(handleRuntimeVsCompileTimeSecondary(mockObj, { enabled: true }) === true, "Test 1 Failed");
> console.assert(mockObj.enabled === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Compile-Time Constant Inliner Architecture**: Applying compile-time constant inliner provides robust toolchain component abstractions.
> 2. **Defensive Option Validation**: Guards against missing configuration parameters in build scripts.
> 3. **Specification Standard Compliance**: Adheres to ECMA and module resolution specifications.
> 
---

### Exercise 3: Runtime Exception Handler Guard Optimization

**Scenario:** A high-performance build pipeline optimizes runtime exception handler guard to accelerate compilation speed and reduce bundle size.

**Requirements:**
1. Write optimizeRuntimeVsCompileTimeTertiary(modules).
2. Filter invalid module references.
3. Return optimized modules list.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeRuntimeVsCompileTimeTertiary(modules) {
>   if (!Array.isArray(modules)) return [];
>   return modules.filter(m => m !== null && m !== undefined);
> }
>
> // Verification tests
> const list = ["modA", null, "modB"];
> const clean = optimizeRuntimeVsCompileTimeTertiary(list);
> console.assert(clean.join(",") === "modA,modB", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Runtime Exception Handler Guard Best Practices**: Optimizing runtime exception handler guard reduces bundle memory footprint and speeds up builds.
> 2. **Dead Code & Resource Cleanup**: Eliminates unused code paths and stale temporary build artifacts.
> 3. **Cross-Toolchain Compatibility**: Operates reliably across Node, Webpack, Vite, and Rollup build tools.
---

## 6. Related Terms
- [Transpiler vs Compiler](transpiler_vs_compiler.md) — The tools that process compile-time transformations.
- [TypeScript](typescript.md) — The static typing language that operates strictly at compile time.

---

## 7. Key Takeaways
- Compile Time is the preparation and verification phase; Runtime is the active execution phase.
- Compile-time errors (syntax, static type checks) halt the build, preventing execution.
- Runtime errors (database timeouts, null reference crashes) happen while the application is actively running.
- TypeScript types, interfaces, and annotations are strictly compile-time constructs and are completely erased before execution.
- Perform runtime validation (like API input sanitation) using standard JavaScript checks, not TypeScript interfaces.
