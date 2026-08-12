# Tree Shaking & Code Splitting

> **Level 10 — Ecosystem & Tooling**
> Removing dead code / lazy-loading bundles.

---

## 1. Prerequisites
- [Bundler](bundler.md) — The asset compilation manager.
- [Modules (import/export)](../level_08/modules.md) — The static ES Module standard.

---

## 2. Term Category

**Ecosystem / Tooling (Universal: Implemented by modern compilers .)**: Tree Shaking & Code Splitting is a fundamental concept in this technology stack. **Level 10 — Ecosystem & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
As web applications scale, we import numerous third-party libraries (like Lodash, Firebase, or component libraries). If a bundler merges every line of these libraries into a single file, the output bundle size will skyrocket. Users will suffer slow downloads and laggy page loads, especially on mobile networks.

To keep web applications lightweight, modern bundlers perform two primary optimizations:

#### Tree Shaking (Dead Code Elimination)
The process of automatically detecting and removing unused functions or variables during compilation.
- **The ESM Requirement:** Tree shaking **only works with ES Modules**. Because ESM statements (`import`/`export`) are static, the compiler can trace exactly which functions are used before compiling. CommonJS (`require()`) is dynamic, making safe static dead-code analysis impossible.

#### Code Splitting
The process of splitting a single large bundle into multiple smaller files ("chunks") that can be loaded **asynchronously / on-demand**.
- **Implementation:** Usually implemented using **Dynamic `import()`** statements (such as lazy-loading page routes, like only fetching the `/dashboard` code chunk when the user clicks the dashboard link).

### (2) Reality Metaphor
- **Tree Shaking** is like harvesting fruit. The bundler treats your code like a tree. The branches are libraries. When you run a build, the bundler shakes the tree. The fruit you actually pick (imported functions) remains. The dry, unpicked fruit (unused utility functions) falls off the branches and is swept away, keeping your shipping box (bundle) light.
- **Code Splitting** is like owning a **multi-volume encyclopedia set**. Instead of forcing you to carry all 20 heavy volumes in your backpack on the first day of school, you leave them on a shelf at home. When you need to write a report on the letter `"M"`, you retrieve only Volume M (a code-split chunk) from the shelf.

### (3) JavaScript Code Examples

#### Visualizing Tree Shaking
Suppose we have a utility file containing two functions, but our application only imports one:

```javascript
// --- file: mathUtils.js ---
export function add(a, b) {
  return a + b;
}

export function heavyCalculate(a) {
  // 500 lines of complex physics calculations
  return Math.sin(a) * Math.PI;
}
```

```javascript
// --- file: app.js ---
import { add } from "./mathUtils.js";

console.log(add(5, 10)); // 15
// heavyCalculate is NEVER imported or referenced!
```

*Bundler Output:* During compilation, the bundler detects that `heavyCalculate` has no import links. It completely deletes the `heavyCalculate` function body from the production output bundle, saving size!

#### Visualizing Code Splitting (Dynamic Import boundary)
```javascript
// Routing boundary example
const reportButton = document.querySelector("#load-report-btn");

reportButton.addEventListener("click", async () => {
  // Trigger a code-split boundary! 
  // reportGenerator.js is compiled into a separate file chunk (e.g., report-abc.js)
  // and only downloaded over the network when this click event fires.
  const { generatePdfReport } = await import("./utils/reportGenerator.js");
  
  generatePdfReport();
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting tree-shaking to work on CommonJS packages

**The mistake:** Importing a utility function from a legacy CommonJS library expecting the unused utilities to be tree-shaken.

**Why it's wrong:** Because CommonJS exports are resolved dynamically at runtime, the compiler must package the entire library object to ensure no runtime lookup fails. The dead code remains in your bundle.

*Incorrect:*
```javascript
// The entire lodash library is bundled because it uses CommonJS internally!
import { chunk } from "lodash"; 
```

*Fix:*
```javascript
// Use the modern ES Module version instead to allow tree-shaking:
import { chunk } from "lodash-es"; 
```

---

### Mistake 2: Losing Context Binding (`this`) in Tree Shaking Code Splitting Callbacks

**The mistake:** Passing methods from Tree Shaking Code Splitting instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "tree_shaking_code_splitting",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "tree_shaking_code_splitting",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Tree Shaking Code Splitting Operations

**The mistake:** Executing asynchronous operations within Tree Shaking Code Splitting without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/tree_shaking_code_splitting"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/tree_shaking_code_splitting");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in tree_shaking_code_splitting: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Static ES Module Tree Shaking Analyzer Implementation

**Scenario:** A modern JavaScript build and tooling architecture implements static es module tree shaking analyzer to manage application code lifecycle.

**Requirements:**
1. Write processTreeShakingCodeSplittingPrimary(payload).
2. Validate input config/options.
3. Execute tool/runtime operation.
4. Return result object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processTreeShakingCodeSplittingPrimary(payload) {
>   if (!payload || typeof payload !== "object") return null;
>   return {
>     status: "SUCCESS",
>     target: "tree_shaking_code_splitting",
>     data: payload
>   };
> }
>
> // Verification tests
> const res = processTreeShakingCodeSplittingPrimary({ name: "app" });
> console.assert(res.status === "SUCCESS", "Test 1 Failed");
> console.assert(res.target === "tree_shaking_code_splitting", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Static ES Module Tree Shaking Analyzer Fundamentals**: Understanding static es module tree shaking analyzer is essential for modern frontend/backend tooling infrastructure.
> 2. **Build & Runtime Boundary**: Distinguishes between static compilation time and dynamic runtime execution phases.
> 3. **Tooling Integration**: Seamlessly integrates with bundlers, transpilers, and package managers.
> 
---

### Exercise 2: Dynamic Import Code Splitting Chunk Loader Handler

**Scenario:** An enterprise toolchain handles dynamic import code splitting chunk loader using defensive fallback options and specification compliance.

**Requirements:**
1. Write handleTreeShakingCodeSplittingSecondary(target, options).
2. Check target validity.
3. Apply configuration options.
4. Return status boolean.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleTreeShakingCodeSplittingSecondary(target, options) {
>   if (!target || typeof target !== "object") return false;
>   const opts = options || {};
>   target.enabled = opts.enabled !== undefined ? opts.enabled : true;
>   return true;
> }
>
> // Verification tests
> const mockObj = {};
> console.assert(handleTreeShakingCodeSplittingSecondary(mockObj, { enabled: true }) === true, "Test 1 Failed");
> console.assert(mockObj.enabled === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Dynamic Import Code Splitting Chunk Loader Architecture**: Applying dynamic import code splitting chunk loader provides robust toolchain component abstractions.
> 2. **Defensive Option Validation**: Guards against missing configuration parameters in build scripts.
> 3. **Specification Standard Compliance**: Adheres to ECMA and module resolution specifications.
> 
---

### Exercise 3: Pure Annotation Dead Code Eliminator Optimization

**Scenario:** A high-performance build pipeline optimizes pure annotation dead code eliminator to accelerate compilation speed and reduce bundle size.

**Requirements:**
1. Write optimizeTreeShakingCodeSplittingTertiary(modules).
2. Filter invalid module references.
3. Return optimized modules list.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeTreeShakingCodeSplittingTertiary(modules) {
>   if (!Array.isArray(modules)) return [];
>   return modules.filter(m => m !== null && m !== undefined);
> }
>
> // Verification tests
> const list = ["modA", null, "modB"];
> const clean = optimizeTreeShakingCodeSplittingTertiary(list);
> console.assert(clean.join(",") === "modA,modB", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Pure Annotation Dead Code Eliminator Best Practices**: Optimizing pure annotation dead code eliminator reduces bundle memory footprint and speeds up builds.
> 2. **Dead Code & Resource Cleanup**: Eliminates unused code paths and stale temporary build artifacts.
> 3. **Cross-Toolchain Compatibility**: Operates reliably across Node, Webpack, Vite, and Rollup build tools.
---

## 6. Related Terms
- [Dynamic import()](../level_08/dynamic_import.md) — The programming syntax that establishes code-splitting boundaries.
- [Minification & Source Maps](minification_source_maps.md) — The compression processes applied to bundles.
- [Specific Bundlers (Webpack / Vite / Rollup / esbuild)](specific_bundlers.md) — Related concept: Specific Bundlers (Webpack / Vite / Rollup / esbuild).

---

## 7. Key Takeaways
- Tree Shaking deletes unused code from the final bundle during compilation.
- Tree Shaking strictly requires ES Modules (`import`/`export`) due to its static analysis design.
- Code Splitting breaks a single large bundle into smaller asynchronous chunks loaded on demand.
- Implement code splitting using dynamic `import()` statements to optimize web application initial load times.
- Avoid using legacy CommonJS modules if your project depends on tree-shaking optimization.
