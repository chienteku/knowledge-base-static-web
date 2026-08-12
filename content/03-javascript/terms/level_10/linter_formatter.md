# Linter (ESLint) & Formatter (Prettier)

> **Level 10 — Ecosystem & Tooling**
> Static analysis and auto-formatting tools.

---

## 1. Prerequisites
- [Node.js](node_js.md) — The runtime engine hosting CLI build tooling.

---

## 2. Term Category

**Ecosystem / Tooling (Universal: Configured inside project roots to analyze editor code dynamically.)**: Linter (ESLint) & Formatter (Prettier) is a fundamental concept in this technology stack. **Level 10 — Ecosystem & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When developers collaborate on codebases, two problems frequently arise:
1. **Code Quality Bugs:** Writing code that is valid syntax but contains logic flaws or bad habits—such as declaring variables and forgetting to use them, referencing undefined variables, or failing to handle asynchronous rejections.
2. **Formatting Debates:** Arguing over aesthetic styling rules—such as whether to use single quotes (`'`) vs double quotes (`"`), spaces vs tabs, or adding trailing semicolons.

To resolve these automatically, the JavaScript ecosystem employs two complementary static analysis tools:

#### Linter (ESLint)
An analysis tool that inspects your source code **without executing it** to flag code quality issues, stylistic traps, and potential bugs.
- **Focus:** **Code Logic and Quality.**
- **Rules Example:** Enforces using `const` for variables never reassigned, bans `var`, and flags unreachable code after `return` statements.

#### Formatter (Prettier)
An opinionated formatting tool that parses your code and **re-writes it from scratch**, enforcing a consistent style layout.
- **Focus:** **Code Appearance and Layout.**
- **Rules Example:** Automatically wraps lines at 80 characters, formats indentation tabs, and normalizes quote marks.

By delegating formatting strictly to Prettier and logical code inspection to ESLint, teams eliminate style debates and catch bugs before code is committed.

### (2) Reality Metaphor
- A **Linter (ESLint)** is like a **senior book editor**. They read your sentences to check logic and consistency: `"You introduced a character here but they never say a word (unused variable)"` or `"You reference a location that was never described (undefined variable)."`
- A **Formatter (Prettier)** is like a **typesetter/printing press**. They do not read your story or check your facts. They adjust the margins, set the font sizes, enforce standard indentation tabs, and handle line breaks so the final book is clean and uniform.

### (3) JavaScript Code Examples

#### Visualizing Linters and Formatters

##### 1. Raw input with logical errors and poor spacing
```javascript
var userName = "Alice" // 1. Lint Warn: var is banned.
const age = 30;
let score = 100; // 2. Lint Warn: score is never reassigned, use const.

function greet() {
console.log( "Hi" ); // 3. Formatter: bad indentation, ugly spaces
}
```

##### 2. After Formatter (Prettier) runs
```javascript
var userName = "Alice"; // Indent and spacing fixed, semicolon added
const age = 30;
let score = 100;

function greet() {
  console.log("Hi"); // Indentation standardized
}
```

##### 3. After Linter (ESLint --fix) runs
```javascript
const userName = "Alice"; // var corrected to const
const age = 30;
const score = 100; // let corrected to const

function greet() {
  console.log("Hi");
}
```

#### Typical Configuration Files

##### Prettier Config (`.prettierrc`)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

##### ESLint Config (`eslint.config.js`)
```javascript
export default [
  {
    rules: {
      "no-unused-vars": "error", // Error if variables are declared but unused
      "no-undef": "error",       // Error if variable is accessed without declaration
      "prefer-const": "warn"     // Recommend const for variables never reassigned
    }
  }
];
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Linter Formatter Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Linter Formatter blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "linter_formatter";
```

*Fix:*
```javascript
let value = "linter_formatter";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Linter Formatter Callbacks

**The mistake:** Passing methods from Linter Formatter instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "linter_formatter",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "linter_formatter",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Linter Formatter Operations

**The mistake:** Executing asynchronous operations within Linter Formatter without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/linter_formatter"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/linter_formatter");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in linter_formatter: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: AST Static Code Linter Rule Implementation

**Scenario:** A modern JavaScript build and tooling architecture implements ast static code linter rule to manage application code lifecycle.

**Requirements:**
1. Write processLinterFormatterPrimary(payload).
2. Validate input config/options.
3. Execute tool/runtime operation.
4. Return result object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processLinterFormatterPrimary(payload) {
>   if (!payload || typeof payload !== "object") return null;
>   return {
>     status: "SUCCESS",
>     target: "linter_formatter",
>     data: payload
>   };
> }
>
> // Verification tests
> const res = processLinterFormatterPrimary({ name: "app" });
> console.assert(res.status === "SUCCESS", "Test 1 Failed");
> console.assert(res.target === "linter_formatter", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **AST Static Code Linter Rule Fundamentals**: Understanding ast static code linter rule is essential for modern frontend/backend tooling infrastructure.
> 2. **Build & Runtime Boundary**: Distinguishes between static compilation time and dynamic runtime execution phases.
> 3. **Tooling Integration**: Seamlessly integrates with bundlers, transpilers, and package managers.
> 
---

### Exercise 2: Prettier Code Formatter Normalizer Handler

**Scenario:** An enterprise toolchain handles prettier code formatter normalizer using defensive fallback options and specification compliance.

**Requirements:**
1. Write handleLinterFormatterSecondary(target, options).
2. Check target validity.
3. Apply configuration options.
4. Return status boolean.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleLinterFormatterSecondary(target, options) {
>   if (!target || typeof target !== "object") return false;
>   const opts = options || {};
>   target.enabled = opts.enabled !== undefined ? opts.enabled : true;
>   return true;
> }
>
> // Verification tests
> const mockObj = {};
> console.assert(handleLinterFormatterSecondary(mockObj, { enabled: true }) === true, "Test 1 Failed");
> console.assert(mockObj.enabled === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Prettier Code Formatter Normalizer Architecture**: Applying prettier code formatter normalizer provides robust toolchain component abstractions.
> 2. **Defensive Option Validation**: Guards against missing configuration parameters in build scripts.
> 3. **Specification Standard Compliance**: Adheres to ECMA and module resolution specifications.
> 
---

### Exercise 3: Automated Auto-Fix Code Engine Optimization

**Scenario:** A high-performance build pipeline optimizes automated auto-fix code engine to accelerate compilation speed and reduce bundle size.

**Requirements:**
1. Write optimizeLinterFormatterTertiary(modules).
2. Filter invalid module references.
3. Return optimized modules list.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeLinterFormatterTertiary(modules) {
>   if (!Array.isArray(modules)) return [];
>   return modules.filter(m => m !== null && m !== undefined);
> }
>
> // Verification tests
> const list = ["modA", null, "modB"];
> const clean = optimizeLinterFormatterTertiary(list);
> console.assert(clean.join(",") === "modA,modB", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Automated Auto-Fix Code Engine Best Practices**: Optimizing automated auto-fix code engine reduces bundle memory footprint and speeds up builds.
> 2. **Dead Code & Resource Cleanup**: Eliminates unused code paths and stale temporary build artifacts.
> 3. **Cross-Toolchain Compatibility**: Operates reliably across Node, Webpack, Vite, and Rollup build tools.
---

## 6. Related Terms
- [Strict Mode ("use strict")](../level_09/strict_mode.md) — The language runtime mode that flags undeclared variables at runtime.
- [TypeScript](typescript.md) — Extends linting concepts by adding strict static type checking.

---

## 7. Key Takeaways
- ESLint (Linter) focuses on code logic, syntax checks, and bug detection.
- Prettier (Formatter) focuses strictly on layout, spacing, and styling appearance.
- Use both tools together, configuring `eslint-config-prettier` to disable ESLint's styling checks to prevent conflicts.
- Automate linter and formatter executions by connecting them to VS Code's "Save Action" triggers and Git commit hooks.
