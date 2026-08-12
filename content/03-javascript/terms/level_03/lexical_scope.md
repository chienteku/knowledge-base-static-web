# Lexical (Static) Scope / Environment

> **Level 3 — Functions & Scope**
> Scope determined by *where* code is written, not called.

---

## 1. Prerequisites
- [Scope](scope.md) — The context in which values and expressions are visible.
- [Block Scope](block_scope.md) — Variables declared inside a `{ }` block, accessible only within that block.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Lexical (Static) Scope / Environment is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Nested Scope Chain Variable Lookup Engine

**Scenario:** A state management framework resolves nested scope variable lookups, demonstrating how inner functions access variables from outer lexical environments.

**Requirements:**
1. Create outer, middle, and inner nested functions.
2. Access outer and middle variables inside inner function.
3. Return combined string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function outerScope(globalTag) {
>   const outerVar = "OUTER";
>
>   return function middleScope(middleTag) {
>     const middleVar = "MIDDLE";
>
>     return function innerScope() {
>       return `${globalTag}:${outerVar}:${middleTag}:${middleVar}:INNER`;
>     };
>   };
> }
>
> // Verification tests
> const innerFn = outerScope("APP")("ENV");
> console.assert(innerFn() === "APP:OUTER:ENV:MIDDLE:INNER", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Lexical Scope Definition**: Lexical scope means variable accessibility is determined by physical code structure placement at compile time.
> 2. **Scope Chain Resolution**: Identifier lookup searches current scope first, then moves sequentially upward along outer enclosing scope chains.
> 3. **Static Scope Resolution**: Lexical scope is static; it depends on where functions are declared, NOT where they are invoked.
> 
---

### Exercise 2: Lexical Scope vs Dynamic Invocation Context

**Scenario:** An event handling library demonstrates that lexical scope bindings remain fixed even when functions are invoked from different execution contexts.

**Requirements:**
1. Declare function inside outerScope returning local variable.
2. Invoke function from separate object context.
3. Verify return value reads static lexical scope.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createScopeBoundFn() {
>   const secretKey = "LEXICAL_SECRET";
>
>   return function() {
>     return secretKey;
>   };
> }
>
> const externalObj = {
>   secretKey: "DYNAMIC_OVERRIDE",
>   getSecret: createScopeBoundFn()
> };
>
> // Verification tests
> console.assert(externalObj.getSecret() === "LEXICAL_SECRET", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Static vs Dynamic Scope**: JavaScript uses lexical scoping for variables, ignoring dynamic caller invocation contexts.
> 2. **Lexical Scope Stability**: Inner functions retain access to their birth lexical environment permanently.
> 3. **Closure Foundation**: Lexical scope is the underlying language rule that powers JavaScript closures.
> 
---

### Exercise 3: Outer Scope Variable Shadowing Analysis

**Scenario:** A compiler AST parser analyzes variable shadowing where an inner lexical scope declares a variable with the same name as an outer scope variable.

**Requirements:**
1. Declare outer const theme = "LIGHT".
2. Declare inner block scope containing const theme = "DARK".
3. Verify inner scope shadows outer variable without mutating outer scope.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function testScopeShadowing() {
>   const theme = "LIGHT";
>   let innerTheme = "";
>
>   if (true) {
>     const theme = "DARK";
>     innerTheme = theme;
>   }
>
>   return { outerTheme: theme, innerTheme: innerTheme };
> }
>
> // Verification tests
> const res = testScopeShadowing();
> console.assert(res.outerTheme === "LIGHT", "Test 1 Failed");
> console.assert(res.innerTheme === "DARK", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Variable Shadowing**: Declaring an identifier in an inner scope masks (shadows) identical identifiers in outer scopes during lookup.
> 2. **Outer Scope Preservation**: Shadowing creates an independent local binding without altering or mutating outer scope variables.
> 3. **Lookup Short-Circuit**: Scope chain search terminates immediately upon finding the first matching identifier.
---

## 6. Related Terms
- [Closure](closure.md) — The mechanism where a function retains access to its lexical scope even when executed outside that scope.
- [Hoisting](hoisting.md) — The compiler behavior of moving declarations to the top of their lexical scopes.
- [Arrow Function](arrow_function.md) — Functions that lack their own `this` binding, resolving it lexically.

---

## 7. Key Takeaways
- Lexical Scope (Static Scope) means a variable's visibility is determined by its physical location in the written code structure.
- JavaScript resolves variables by scanning the local scope first, and then stepping outwards through nested parent scopes (the scope chain) until it reaches the global scope.
- The location where a function is called (the call site) has no effect on which variable values the function has access to.
