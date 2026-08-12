# var

> **Level 1 — Foundations**
> Function-scoped or globally-scoped variable declaration (legacy, pre-ES6).

---

## 1. Prerequisites
- [Variable](variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: var is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Refactoring Legacy var Function Scope to Block Scope

**Scenario:** A code modernization audit identifies legacy functions using var inside if and for blocks. Because var ignores block scope, variables leak out into the enclosing function. The code must be refactored to let and const.

**Requirements:**
1. Demonstrate how var declared inside an if block leaks to the outer function scope.
2. Refactor the variable declarations to let and const.
3. Verify that block-scoped variables remain isolated inside the block.

> [!check]- Answer
> #### Implementation
> ```javascript
> function demonstrateVarScopeLeak() {
>   if (true) {
>     var leakedVar = "I leak to function scope!";
>     let blockScopedLet = "I am block scoped";
>   }
>   const canAccessVar = typeof leakedVar === "string";
>   let letLeaked = false;
>   try {
>     // @ts-ignore
>     console.log(blockScopedLet);
>   } catch (err) {
>     letLeaked = false;
>   }
>   return { canAccessVar, letLeaked };
> }
> // Verification tests
> const res = demonstrateVarScopeLeak();
> console.assert(res.canAccessVar === true, "Test 1 Failed");
> console.assert(res.letLeaked === false, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Function Scoping**: Variables declared with var are scoped to their enclosing function, completely ignoring if, for, and while block boundaries {}.
> 2. **Block Scoping (let / const)**: Introduced in ES6, let and const respect block scope {}, preventing variable pollution.
> 3. **Refactoring Best Practice**: Replace all var declarations with const (for immutable bindings) or let (for reassignable bindings).
> 
---

### Exercise 2: Legacy Async Loop Closure Bug Fix

**Scenario:** A legacy asynchronous task queue dispatches timers inside a for loop using var i. Because var shares a single function-scoped binding, all callbacks print the final loop index instead of their iteration index.

**Requirements:**
1. Demonstrate the classic var loop closure bug.
2. Fix the closure bug by replacing var with let.
3. Verify each callback captures its distinct iteration index.

> [!check]- Answer
> #### Implementation
> ```javascript
> function fixLegacyLoopClosure() {
>   const callbacks = [];
>   for (let i = 0; i < 3; i++) {
>     callbacks.push(() => i);
>   }
>   return callbacks.map(fn => fn());
> }
> // Verification tests
> const values = fixLegacyLoopClosure();
> console.assert(values.join(",") === "0,1,2", "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Single Binding Leak**: A for loop with var i creates one single i variable shared across all loop iterations.
> 2. **Closure Reference Capture**: Callbacks created inside the loop capture a reference to the shared var i variable, reading its final value when invoked later.
> 3. **Iteration Scope (let)**: for (let i = 0; ...) creates a distinct lexical environment and variable binding for every loop iteration.
> 
---

### Exercise 3: var Hoisting with Undefined Initialization

**Scenario:** A legacy application relies on var hoisting behavior. Variables declared with var are hoisted to the top of their function scope and automatically initialized with undefined.

**Requirements:**
1. Demonstrate accessing a var variable before its declaration line.
2. Show that it evaluates to undefined without throwing a ReferenceError.
3. Compare against let which throws in the TDZ.

> [!check]- Answer
> #### Implementation
> ```javascript
> function testVarHoisting() {
>   const valueBeforeDeclaration = hoistedVar;
>   var hoistedVar = "Initialized Value";
>   return {
>     valueBeforeDeclaration,
>     valueAfterDeclaration: hoistedVar
>   };
> }
> // Verification tests
> const res = testVarHoisting();
> console.assert(res.valueBeforeDeclaration === undefined, "Test 1 Failed");
> console.assert(res.valueAfterDeclaration === "Initialized Value", "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Hoisting & Initializer**: var declarations are hoisted to the top of their enclosing function scope and initialized with undefined during the creation phase.
> 2. **No TDZ for var**: Unlike let and const (which throw ReferenceError in the Temporal Dead Zone), var can be accessed before declaration without error.
> 3. **Duplicate Declarations**: var permits declaring the same variable multiple times in the same scope without syntax errors.
---

## 6. Related Terms
- [let](let.md) — The modern, block-scoped way to declare variables.
- [Variable](variable.md) — A named container for storing data values.
- [Block Scope](../level_03/block_scope.md) — Related concept: Block Scope.
- [Hoisting](../level_03/hoisting.md) — Related concept: Hoisting.

---

## 7. Key Takeaways
- Avoid using `var` in modern JavaScript. Stick to `let` and `const`.
- `var` is function-scoped, not block-scoped.
- `var` permits redeclarations of the same variable name within the same scope.
- Variables declared with `var` are hoisted to the top of their function scope and initialized with `undefined`.
