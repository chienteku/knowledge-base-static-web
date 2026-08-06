# ECMAScript

> **Level 1 — Foundations**
> The official specification that defines the JavaScript language standard.

---

## 1. Prerequisites
- None!

---

## 2. Term Category
Language Core, Specification

---

## 3. Core Definition
**ECMAScript** (often abbreviated as ES) is the official, standardized specification for a scripting language. **JavaScript** is the most popular implementation of that specification.

Think of ECMAScript as a blueprint or a rulebook. It dictates exactly how the language should behave, what syntax is valid, and what built-in objects (like `Math` or `Date`) should exist. Browser vendors (like Google for Chrome or Apple for Safari) then take this rulebook and write a JavaScript engine that follows those rules.

---

## 4. Key Characteristics / Rules
- **Versioning:** ECMAScript has versions. ES5 (released in 2009) and ES6 (released in 2015, also known as ES2015) are the most famous. ES6 introduced massive changes to the language (like `let`, `const`, and arrow functions).
- **Annual Updates:** Since ES6, new versions of ECMAScript are released every year (ES2016, ES2017, etc.), adding small, incremental features.
- **TC39:** The committee responsible for evolving the ECMAScript standard. They review proposals for new features and decide if they should be added to the official specification.

---

## 5. Typical Usage / Common Patterns

When you read documentation or tutorials, you will often see features referred to by the ECMAScript version that introduced them.

```javascript
// ES5 Syntax (Older)
var name = "John";
function greet() {
  console.log("Hello " + name);
}

// ES6 Syntax (Modern ECMAScript)
const name = "John";
const greet = () => {
  console.log(`Hello ${name}`);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Ecmascript Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Ecmascript blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "ecmascript";
```

*Fix:*
```javascript
let value = "ecmascript";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Ecmascript Callbacks

**The mistake:** Passing methods from Ecmascript instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "ecmascript",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "ecmascript",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Ecmascript Operations

**The mistake:** Executing asynchronous operations within Ecmascript without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/ecmascript"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/ecmascript");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in ecmascript: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

---

### Exercise 1: Identifying ECMAScript Built-in Objects

**Problem:** Filter a list `["Array", "document", "Promise", "window", "Map"]` to include only core ECMAScript global objects.

**Expected output:**
> [!check]- Answer
> ```text
> ["Array", "Promise", "Map"]
> ```
> ```javascript
> const globals = ["Array", "document", "Promise", "window", "Map"];
> const esBuiltins = globals.filter(g => typeof globalThis[g] !== "undefined" && g !== "document" && g !== "window");
> console.log(JSON.stringify(esBuiltins));
> ```
>
> **Explanation:** `Array`, `Promise`, and `Map` are defined in the ECMAScript standard, whereas `document` and `window` are host environment DOM APIs.
> 
---

### Exercise 2: ES6+ Feature Detection with `globalThis`

**Problem:** Check if `globalThis.BigInt` and `globalThis.globalThis` exist in the current environment.

**Expected output:**
> [!check]- Answer
> ```text
> true
> true
> ```
> ```javascript
> console.log(typeof globalThis.BigInt === "function");
> console.log(typeof globalThis.globalThis !== "undefined");
> ```
>
> **Explanation:** Feature detection checks global scope properties defined by specific ECMAScript edition specifications.
> 
---

### Exercise 3: ES Specifications

**Problem:** State which organization standardizes ECMAScript.

**Expected output:**
> [!check]- Answer
> ```text
> TC39 / ECMA International
> ```
> ```javascript
> console.log("TC39 / ECMA International");
> ```
>
> **Explanation:** Technical Committee 39 (TC39) standardizes ECMAScript.
> 
> 
---

## 7. Related Terms
- [Babel](../level_10/babel.md) — A tool used to translate modern ECMAScript code into older ECMAScript code so older browsers can understand it.
- [JavaScript Engine](../level_05/javascript_engine.md) — The software that reads and executes your ECMAScript code.

---

