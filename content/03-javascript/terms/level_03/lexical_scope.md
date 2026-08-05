# Lexical (Static) Scope / Environment

> **Level 3 — Functions & Scope**
> Scope determined by *where* code is written, not called.

---

## 1. Prerequisites
- [Scope](scope.md) — The context in which values and expressions are visible.
- [Block Scope](block_scope.md) — Variables declared inside a `{ }` block, accessible only within that block.
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In programming, we need to know exactly which variable a function accesses when multiple variables share the same name across nested functions. If scope lookup were dynamic (determined by *where* a function is called at runtime), code would be incredibly unpredictable, hard to analyze, and highly insecure. 

To prevent this, JavaScript utilizes **Lexical Scope** (also known as **Static Scope**). The word "lexical" refers to the physical text of the source code. Under lexical scope rules, the scope of a variable is decided entirely during the parsing phase (compile-time) based on where functions and blocks are nested *physically* in the written code. Once the code is written, its scope layout is frozen, completely ignoring where the function is executed later.

### (2) Reality Metaphor
Lexical scope is like a nested corporate office building with one-way glass windows. 
- A manager working in a private inner office (inner scope) can look out of their window to see what is happening in the outer department floor, and look out further to see the main lobby (global scope). 
- However, someone standing in the main lobby cannot see through the walls into the private inner office. 
- The manager's viewing access is determined by the physical blueprint of the building (where the office walls were built), not where the manager walks or stands during a phone call.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const globalName = "Alice";

function outerFunction() {
  const outerName = "Bob";
  
  function innerFunction() {
    // innerFunction can see variables in its parent scopes due to lexical structure
    console.log(globalName); // "Alice"
    console.log(outerName);  // "Bob"
  }
  
  innerFunction();
}

outerFunction();
```

#### Fuller Example
```javascript
// Demonstrating that scope is static and ignores the call site
const message = "Global Message";

function printMessage() {
  // printMessage's lexical parent is the global scope.
  // It resolves 'message' to the global constant, ignoring where it is called!
  console.log(message);
}

function containerFunction() {
  const message = "Container Message"; // Local variable
  
  // Call printMessage here
  printMessage(); 
}

containerFunction(); // Logs: "Global Message" (NOT "Container Message"!)

// Traversal Lookup Chain:
// When printMessage executes, the engine searches:
// 1. Inside printMessage's local scope -> not found.
// 2. Step out to printMessage's lexical parent scope (Global Scope) -> found "Global Message".
// It completely ignores 'containerFunction' scope, even though that is where printMessage was called.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Lexical Scope Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Lexical Scope blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "lexical_scope";
```

*Fix:*
```javascript
let value = "lexical_scope";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Lexical Scope Callbacks

**The mistake:** Passing methods from Lexical Scope instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "lexical_scope",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "lexical_scope",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Lexical Scope Operations

**The mistake:** Executing asynchronous operations within Lexical Scope without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/lexical_scope"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/lexical_scope");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in lexical_scope: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Trace the Scope Chain

**Problem:** Predict the output of the following code snippet and explain which scopes are traversed to look up the variable `count`.

```javascript
let count = 5;

function stepOne() {
  console.log(count);
}

function stepTwo() {
  let count = 10;
  stepOne();
}

stepTwo();
```

**Expected output:**
> [!check]- Answer
> ```text
> Output: 5
> Explanation: When stepOne is invoked inside stepTwo, the engine executes stepOne.
> The scope lookup chain for 'count' in stepOne starts in stepOne's local scope (not found)
> and immediately jumps to the global scope (where stepOne was defined), resolving to '5'.
> stepTwo's local scope is bypassed entirely.
> ```
> - Remember that scope in JavaScript is determined by where the function is written in the code.
> - `stepOne` is defined in the global scope, not inside `stepTwo`.

---

### Exercise 2: Lexical Scope Chain Trace

**Problem:** Trace `val` inside nested functions where `val` exists in global, outer, and inner scopes.

**Expected output:**
> [!check]- Answer
> ```text
> inner
> outer
> global
> ```
> ```javascript
> const val = "global";
> function outer() {
>   const val = "outer";
>   function inner() {
>     const val = "inner";
>     console.log(val);
>   }
>   inner();
>   console.log(val);
> }
> outer();
> console.log(val);
> ```
>
> **Explanation:** Scope resolution walks outward from local scope to parent scopes along the static lexical structure.

---

### Exercise 3: Lexical Scope Closure Preservation

**Problem:** Demonstrate a function `makeGetter()` returning a closure that reads `secret` defined in `makeGetter` scope.

**Expected output:**
> [!check]- Answer
> ```text
> top secret
> ```
> ```javascript
> function makeGetter() {
>   const secret = "top secret";
>   return () => secret;
> }
> const getSecret = makeGetter();
> console.log(getSecret());
> ```
>
> **Explanation:** Functions retain lifetime references to their parent lexical environment.


---

## 7. Related Terms
- [Closure](closure.md) — The mechanism where a function retains access to its lexical scope even when executed outside that scope.
- [Hoisting](hoisting.md) — The compiler behavior of moving declarations to the top of their lexical scopes.
- [Arrow Function](arrow_function.md) — Functions that lack their own `this` binding, resolving it lexically.
---

## 8. Key Takeaways
- Lexical Scope (Static Scope) means a variable's visibility is determined by its physical location in the written code structure.
- JavaScript resolves variables by scanning the local scope first, and then stepping outwards through nested parent scopes (the scope chain) until it reaches the global scope.
- The location where a function is called (the call site) has no effect on which variable values the function has access to.
