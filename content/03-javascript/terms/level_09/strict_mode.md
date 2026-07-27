# Strict Mode ("use strict")

> **Level 9 — Advanced Concepts & Patterns**
> An opt-in mode that enforces stricter parsing and error handling in JavaScript.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — Variables behave differently in strict mode.
- [Scope](../level_03/scope.md) — Scope rules are tightened.

---

## 2. Term Category
- **Engine Feature / Pragma** *(Introduced in ES5 / 2009)*

---

## 3. Environment Context
- **Universal** (Note: ES6 Modules and ES6 Classes have Strict Mode enabled automatically!)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript was famously created in 10 days in 1995. Because of this rush, the language had some "sloppy" rules. If you made a typo and assigned a value to a variable you never declared (e.g., typing `myVar = 5` instead of `let myVar = 5`), the engine wouldn't crash. Instead, it would secretly create a global variable for you. This "forgiving" nature caused thousands of silent, untraceable bugs.

In 2009 (ES5), the TC39 committee couldn't just change the rules, because it would break millions of old websites. Instead, they introduced an *opt-in* feature called **Strict Mode**. By placing the exact string `"use strict";` at the top of a file, you tell the engine: "Stop being forgiving. If I make a sloppy mistake, crash immediately and show me an error."

### (2) Reality Metaphor
Normal JavaScript is like a very relaxed teacher. If you forget to write your name on a test, the teacher just guesses it's yours and writes it in for you. It's nice, but sometimes they guess wrong, and you fail the class without knowing why.
Strict Mode is like a drill sergeant. If you forget to write your name on a test, they immediately tear up the paper and yell at you to do it correctly. It feels harsher, but it ensures you never make a catastrophic mistake.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Turning on Strict Mode for the entire file
"use strict";

function doSomething() {
  // If we were NOT in strict mode, this would silently create window.age = 25!
  // In strict mode, it throws a fatal error: ReferenceError: age is not defined
  age = 25; 
}

doSomething();
```

#### Fuller Example: The many rules of Strict Mode
```javascript
"use strict";

// 1. You cannot use undeclared variables.
// x = 10; // Crash!

// 2. You cannot delete variables or functions.
const myVar = 10;
// delete myVar; // Crash! (You can only delete object properties)

// 3. You cannot duplicate parameter names in a function.
// function sum(a, a, b) { ... } // Crash!

// 4. 'this' in global functions is undefined, not the Window object.
function checkThis() {
  console.log(this); 
}
checkThis(); // undefined (In sloppy mode, it would be 'Window')
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Strict Mode Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Strict Mode blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "strict_mode";
```

*Fix:*
```javascript
let value = "strict_mode";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Strict Mode Callbacks

**The mistake:** Passing methods from Strict Mode instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "strict_mode",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "strict_mode",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Strict Mode Operations

**The mistake:** Executing asynchronous operations within Strict Mode without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/strict_mode"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/strict_mode");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in strict_mode: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Function-level Strictness

**Problem:** Can you turn on Strict Mode for just a *single function* without affecting the rest of the file?

**Expected output:**
```text
Yes! You can put `"use strict";` as the very first line INSIDE a function block.
```
```javascript
function strictFunction() {
  "use strict";
  // Strict rules apply here
}
function sloppyFunction() {
  // Normal rules apply here
}
```

> [!check]- Answer
> - The string just needs to be the very first statement in the scope.

---

### Exercise 2: Undeclared Variable Assignment Protection in Strict Mode

**Problem:** Catch `ReferenceError` when assigning `x = 10` without declaration in strict mode.

**Expected output:**
```text
ReferenceError caught
```

> [!check]- Answer
> ```javascript
> "use strict";
> try {
>   x = 10;
> } catch (err) {
>   console.log("ReferenceError caught");
> }
> ```
>
> **Explanation:** Strict mode prevents implicit creation of undeclared global variables.

### Exercise 3: Duplicate Parameter Name Rejection

**Problem:** State whether `function dup(a, a) {}` is permitted in strict mode.

**Expected output:**
```text
Forbidden in strict mode
```

> [!check]- Answer
> ```javascript
> console.log("Forbidden in strict mode");
> ```
>
> **Explanation:** Strict mode throws early syntax errors on duplicate parameter names.

---

---

## 7. Related Terms
- [`this` Keyword](../level_07/this_keyword.md) — Behaves differently in strict mode.
- [Modules](../level_08/modules.md) — Automatically enforce strict mode.

---

## 8. Key Takeaways
- `"use strict";` opts your code into a stricter set of rules.
- It prevents accidental global variables, duplicate parameters, and throws errors instead of failing silently.
- It changes the global `this` keyword from `window` to `undefined`.
- Modern ES6 Modules and Classes use Strict Mode automatically.
```
