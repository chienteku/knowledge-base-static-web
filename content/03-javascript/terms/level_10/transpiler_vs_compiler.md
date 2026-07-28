# Transpiler vs Compiler

> **Level 10 — Ecosystem & Tooling**
> Source-to-source vs source-to-machine translation.

---

## 1. Prerequisites
- [Babel](./babel.md) — The standard JavaScript syntax transpilation tool.
- [Runtime vs Compile Time](./runtime_vs_compile_time.md) — The two phases of application development.

---

## 2. Term Category
- **Ecosystem / Tooling**

---

## 3. Environment Context
- **Universal**: Applicable across all programming languages and platforms.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript conversations, you will hear words like "compiling" and "transpiling" used frequently—for example, "Babel compiles modern JS" or "TypeScript transpiles to plain JS." While they both transform code, there is a clear distinction between their abstraction levels:

#### Compiler (Source-to-Machine)
A compiler translates high-level source code (readable by humans, like Rust or C++) down into a **lower-level language** (like assembly code, machine code binary bytes, or bytecode) that a CPU or VM executes directly.
- **Goal:** Shift abstraction levels downward (from human text to machine commands).

#### Transpiler (Source-to-Source Compiler)
A transpiler translates source code from one high-level language into another high-level language at a **similar level of abstraction**.
- **Goal:** Modernize or compile syntax dialects into standard code without changing the abstraction height (remains human-readable text files).
- **Examples in Web Development:**
  - **Babel:** Transpiles modern ES6+ JavaScript code into backwards-compatible ES5 JavaScript code (translates JS to JS).
  - **TypeScript Compiler (`tsc`):** Transpiles TypeScript into plain JavaScript, stripping away type annotations.
  - **Sass/SCSS:** Transpiles nesting stylesheet files into standard CSS.

### (2) Critical Limit: Syntax vs. APIs
Transpilers only transform **syntax**—such as converting arrow functions `() => {}` into `function() {}` or destructuring into index lookups. They **cannot** inject missing runtime global objects or methods (like `Promise`, `fetch`, or `Array.prototype.includes`). To support missing APIs on older browsers, you must pair your transpiler with a **Polyfill**.

### (3) Reality Metaphor
- A **Compiler** is like translating an English baking cookbook into **electronic signaling pulses** that drive a robotic arm in a commercial kitchen to mix batter. You go from human sentences to raw machine motions.
- A **Transpiler** is like translating a modern English baking cookbook into **older English** (or into Spanish). The output is still a human-readable cookbook at the exact same level of communication; it has simply been adapted so a reader who doesn't speak modern English can understand the instructions.

### (4) JavaScript Code Examples

#### Visualizing Transpilation (Babel output)
Observe how a transpiler translates modern syntax into compatible ES5 code without compiling it to machine bytecode:

```javascript
// --- 1. Modern ES6+ Source Input ---
const greetUser = (user) => {
  console.log(`Hello, ${user?.name ?? "Guest"}`);
};

// --- 2. Transpiled ES5 Output ---
// Arrow functions are translated to standard functions
// Optional chaining and nullish coalescing are converted to conditional ternary checks
var greetUser = function (user) {
  console.log(
    "Hello, " + (user !== null && user !== void 0 && user.name ? user.name : "Guest")
  );
};
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Transpiler Vs Compiler Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Transpiler Vs Compiler blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "transpiler_vs_compiler";
```

*Fix:*
```javascript
let value = "transpiler_vs_compiler";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Transpiler Vs Compiler Callbacks

**The mistake:** Passing methods from Transpiler Vs Compiler instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "transpiler_vs_compiler",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "transpiler_vs_compiler",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Transpiler Vs Compiler Operations

**The mistake:** Executing asynchronous operations within Transpiler Vs Compiler without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/transpiler_vs_compiler"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/transpiler_vs_compiler");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in transpiler_vs_compiler: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Classifier Challenge

**Problem:** Classify each action as either **Compilation** or **Transpilation**:

1. Translating a Rust file `.rs` into a WebAssembly binary file `.wasm`.
2. Translating a TypeScript file `.ts` into a plain JavaScript file `.js`.
3. Translating a Java file `.java` into JVM bytecode `.class`.
4. Translating a modern CSS file containing custom variables into an older CSS layout.

> [!check]- Answer
> - If the output is a binary file or bytecode read by a CPU/VM, it is a compilation.
> - If the output is a text file read by a developer or browser parser, it is transpilation.

> [!check]- Answer
> - 1. **Compilation** (WebAssembly is a binary bytecode format).
> - 2. **Transpilation** (TS to JS are both high-level text formats).
> - 3. **Compilation** (Java bytecode is a lower-level VM format).
> - 4. **Transpilation** (CSS to CSS are both high-level stylesheets).


---

### Exercise 2: Classifying Babel vs GCC/Clang

**Problem:** Classify Babel (Transpiler: JS -> JS) vs GCC (Compiler: C -> Machine Code).

**Expected output:**
> [!check]- Answer
> ```text
> Babel: Transpiler, GCC: Compiler
> ```
> ```javascript
> console.log("Babel: Transpiler, GCC: Compiler");
> ```
>
> **Explanation:** Transpilers convert source code to another high-level source language; compilers generate low-level machine code.

---

### Exercise 3: TypeScript Compiler (`tsc`) Source Generation

**Problem:** Explain how `tsc` transpiles TypeScript source into JavaScript output.

**Expected output:**
> [!check]- Answer
> ```text
> tsc transpiles TS into target JS
> ```
> ```javascript
> console.log("tsc transpiles TS into target JS");
> ```
>
> **Explanation:** `tsc` performs type checking before generating clean target JavaScript output.


---

## 7. Related Terms
- [Babel](./babel.md) — The primary JavaScript transpiler.
- [Polyfill](./polyfill.md) — The library code that supplements transpilers by injecting missing global APIs.

---

## 8. Key Takeaways
- Compilers translate high-level code to lower-level languages (binary, machine code, VM bytecode).
- Transpilers perform source-to-source translation between languages at similar levels of abstraction.
- Babel and the TypeScript Compiler (`tsc`) are transpilers that output plain JavaScript.
- Transpilers only translate syntax; they do not implement missing global APIs.
- Use polyfills to supplement transpilers, injecting missing runtime classes and functions into older environments.
