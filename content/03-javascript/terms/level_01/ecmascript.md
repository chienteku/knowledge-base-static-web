# ECMAScript

> **Level 1 — Foundations**
> The official specification that defines the JavaScript language standard.

---

## 1. Prerequisites
- None!

---

## 2. Term Category

**Language Core, Specification (core concept)**: ECMAScript is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

**ECMAScript** (often abbreviated as ES) is the official, standardized specification for a scripting language. **JavaScript** is the most popular implementation of that specification.

Think of ECMAScript as a blueprint or a rulebook. It dictates exactly how the language should behave, what syntax is valid, and what built-in objects (like `Math` or `Date`) should exist. Browser vendors (like Google for Chrome or Apple for Safari) then take this rulebook and write a JavaScript engine that follows those rules.

### (2) Key Characteristics

- **Versioning:** ECMAScript has versions. ES5 (released in 2009) and ES6 (released in 2015, also known as ES2015) are the most famous. ES6 introduced massive changes to the language (like `let`, `const`, and arrow functions).
- **Annual Updates:** Since ES6, new versions of ECMAScript are released every year (ES2016, ES2017, etc.), adding small, incremental features.
- **TC39:** The committee responsible for evolving the ECMAScript standard. They review proposals for new features and decide if they should be added to the official specification.

### (3) Code Examples & Typical Usage

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



---

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: ECMAScript Polyfill Feature Detector

**Scenario:** A web application support script detects whether the host JavaScript engine implements modern ECMAScript standard features (such as globalThis or Object.hasOwn) to conditionally apply polyfills.

**Requirements:**
1. Write checkEcmaFeatureSupport(featureName).
2. Check if the specified feature property exists on globalThis or Object.
3. Return a boolean indication of native engine specification support.

> [!check]- Answer
> #### Implementation
> ```javascript
> function checkEcmaFeatureSupport(featureName) {
>   switch (featureName) {
>     case "globalThis":
>       return typeof globalThis !== "undefined";
>     case "Object.hasOwn":
>       return typeof Object.hasOwn === "function";
>     case "Promise":
>       return typeof Promise === "function";
>     default:
>       return false;
>   }
> }
> // Verification tests
> console.assert(checkEcmaFeatureSupport("globalThis") === true, "Test 1 Failed");
> console.assert(checkEcmaFeatureSupport("Promise") === true, "Test 2 Failed");
> console.assert(checkEcmaFeatureSupport("NonExistentFeature") === false, "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Specification vs Implementation**: ECMAScript defines the official language specification (TC39 standard); JavaScript engines (V8, SpiderMonkey) implement that specification.
> 2. **Runtime Feature Detection**: Feature detection checks for runtime object property availability, enabling graceful fallback for older engine environments.
> 3. **TC39 Evolution**: As TC39 approves new ECMAScript editions, engine vendors incrementally roll out native feature support.
> 
---

### Exercise 2: Modern ECMAScript Syntax Refactoring

**Scenario:** Refactor legacy ES5 code using modern ECMAScript specification features (ES6+ template literals, arrow functions, and default parameters).

**Requirements:**
1. Convert function declarations to ES6 arrow functions.
2. Replace string concatenation with ES6 template literals.
3. Use ES6 default parameter values.

> [!check]- Answer
> #### Implementation
> ```javascript
> const createWelcomeMessage = (name = "Guest", role = "User") => {
>   return `Welcome ${name}, your role is ${role}.`;
> };
> // Verification tests
> const msg1 = createWelcomeMessage("Alice", "Admin");
> console.assert(msg1 === "Welcome Alice, your role is Admin.", "Test 1 Failed");
> const msg2 = createWelcomeMessage();
> console.assert(msg2 === "Welcome Guest, your role is User.", "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **ES6 (ES2015) Landmark Edition**: ES6 introduced major modern additions to the ECMAScript standard, including arrow functions, template literals, and default parameters.
> 2. **Default Parameters**: Default parameter syntax (param = default) evaluates when arguments are explicitly undefined.
> 3. **Template Literal Specifications**: Backtick syntax provides built-in multi-line support and string interpolation.
> 
---

### Exercise 3: Strict Mode Standard Enforcement

**Scenario:** An application entry module enforces ECMAScript Strict Mode ("use strict") to prevent legacy hazards like undeclared variable assignments.

**Requirements:**
1. Enable strict mode using "use strict";.
2. Demonstrate that assigning to an undeclared variable throws a ReferenceError.
3. Catch the error and return a validation status.

> [!check]- Answer
> #### Implementation
> ```javascript
> function testStrictModeEnforcement() {
>   "use strict";
> let caughtError = false;
>   try {
>     // @ts-ignore
>     undeclaredVar = 42;
>   } catch (err) {
>     caughtError = err instanceof ReferenceError;
>   }
> return caughtError;
> }
> // Verification tests
> console.assert(testStrictModeEnforcement() === true, "Test 1 Failed: Strict mode should throw ReferenceError");
> ```
> #### Technical Explanation
> 1. **ECMAScript Strict Mode**: Introduced in ES5, "use strict" opts into a restricted variant of JavaScript, turning silent errors into thrown exceptions.
> 2. **Global Leak Prevention**: Strict mode disallows assigning values to undeclared variables, preventing global scope pollution.
> 3. **ES Modules Implicit Strict Mode**: All modern ECMAScript ES Modules (import/export) automatically operate in strict mode by default.
---

## 6. Related Terms
- [Babel](../level_10/babel.md) — A tool used to translate modern ECMAScript code into older ECMAScript code so older browsers can understand it.
- [JavaScript Engine](../level_05/javascript_engine.md) — The software that reads and executes your ECMAScript code.

---

## 7. Key Takeaways
- **ECMAScript** is the official specification standard for the JavaScript programming language.
- JavaScript is an implementation of ECMAScript created by browser vendors and runtimes.
- TC39 evolves ECMAScript with annual releases introducing modern language features.
- Transpilers like Babel compile newer ECMAScript syntax to older standards for legacy compatibility.


