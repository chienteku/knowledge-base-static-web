# var

> **Level 1 — Foundations**
> Function-scoped or globally-scoped variable declaration (legacy, pre-ES6).

---

## 1. Prerequisites
- [Variable](variable.md) — A named container for storing data values.
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the very first version of JavaScript, written in 10 days by Brendan Eich, `var` was the only way to declare variables. The language was intended to be simple and forgiving for amateur webmasters. To achieve this, `var` was designed with function scope rather than block scope, and it allowed the same variable to be redeclared multiple times without error.

Over time, as JavaScript applications grew from simple scripts into massive applications, these "forgiving" features became major sources of bugs. The behavior of `var`—specifically hoisting and lack of block scope—made it incredibly hard to reason about where a variable lived and what its value was at any given time. This eventually led to the introduction of `let` and `const` in ES6, relegating `var` to legacy status.

### (2) Reality Metaphor
Using `var` is like whispering a secret in a completely open-plan office (a function). Even if you try to whisper it inside a small cubicle (a block, like an `if` statement), the walls don't reach the ceiling, so everyone in the office can hear it. `let` and `const`, on the other hand, give you a soundproof room.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
var greeting = 'Hello';
var greeting = 'Hi'; // No error! Redeclaration is allowed.
console.log(greeting);
```

#### Fuller Example
```javascript
function processData() {
  var count = 10;
  
  if (count === 10) {
    // This looks like a new, local variable, but it's NOT.
    // It's modifying the `var count` from outside the if block!
    var count = 50; 
    console.log(`Inside block: ${count}`); // 50
  }
  
  console.log(`Outside block: ${count}`); // 50 (Wait, what?! `var` ignores the `{}`)
}

processData();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Var Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Var blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "var";
```

*Fix:*
```javascript
let value = "var";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Var Callbacks

**The mistake:** Passing methods from Var instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "var",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "var",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Var Operations

**The mistake:** Executing asynchronous operations within Var without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/var"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/var");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in var: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Hoisting Quirks

**Problem:** Try to `console.log()` a `var` variable *before* you declare it in the code. Then do the same thing with a `let` variable. Note the difference in the errors (or lack thereof).

**Expected output:**
> [!check]- Answer
> ```text
> undefined (for var)
> ReferenceError (for let)
> ```
> - `var` declarations are "hoisted" to the top of their scope, but their assignments are not. The engine knows the variable exists, but its value is `undefined`.
> - `let` is also hoisted, but resides in a "Temporal Dead Zone" until execution reaches the declaration.

---

### Exercise 2: Var Hoisting Behavior

**Problem:** Demonstrate that `var` hoists declaration with `undefined` value.

**Expected output:**
> [!check]- Answer
> ```text
> undefined
> 10
> ```
> ```javascript
> console.log(x);
> var x = 10;
> console.log(x);
> ```
>
> **Explanation:** `var` declarations hoist to top of function/global scope initialized as `undefined`.

---

### Exercise 3: Function Scope of Var

**Problem:** Demonstrate that `var` inside a function does not leak to outer scope.

**Expected output:**
> [!check]- Answer
> ```text
> ReferenceError caught
> ```
> ```javascript
> function test() { var inner = 42; }
> test();
> try {
>   console.log(inner);
> } catch (err) {
>   console.log("ReferenceError caught");
> }
> ```
>
> **Explanation:** `var` is scoped strictly to containing functions.

---

## 7. Related Terms
- [let](let.md) — The modern, block-scoped way to declare variables.
- [Variable](variable.md) — A named container for storing data values.
- [Block Scope](../level_03/block_scope.md) — Related concept: Block Scope.
- [Hoisting](../level_03/hoisting.md) — Related concept: Hoisting.
---

## 8. Key Takeaways
- Avoid using `var` in modern JavaScript. Stick to `let` and `const`.
- `var` is function-scoped, not block-scoped.
- `var` permits redeclarations of the same variable name within the same scope.
- Variables declared with `var` are hoisted to the top of their function scope and initialized with `undefined`.
