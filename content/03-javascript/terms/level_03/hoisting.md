# Hoisting

> **Level 3 — Functions & Scope**
> JavaScript's default behavior of moving variable and function declarations to the top of their scope before code execution.

---

## 1. Prerequisites
- [Scope](scope.md) — The current context of execution.
- [Function Declaration](function_declaration.md) — Defining a named function.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Hoisting is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript execution actually happens in two distinct phases: the **Creation Phase** (parsing the code and setting up memory) and the **Execution Phase** (running the code line by line). 

During the Creation Phase, the engine sweeps through the code, finds all `var` variables and Function Declarations, and "hoists" them to the very top of their respective scopes in memory. This was originally designed to make coding easier for beginners, allowing them to call a function at the top of a file without worrying about where it was officially defined at the bottom.

### (2) Reality Metaphor
Imagine a theatrical play. Before the curtain opens (the Creation Phase), the stage manager reads the script, finds all the actors (variables/functions), and forces them to stand at the very back of the stage (Hoisting). When the play actually begins (Execution Phase), the actors step forward one by one. Even if an actor's line isn't until Act 3, they physically exist on the stage from the very first second of the play.

### (3) JavaScript Code Examples

#### Short Snippet: Function Hoisting
```javascript
// We are invoking the function BEFORE it is written!
sayHello(); // Output: "Hello!"

// The engine "hoisted" this entire block to the top during parsing
function sayHello() {
  console.log("Hello!");
}
```

#### Fuller Example: Variable Hoisting
```javascript
// What happens if we log a 'var' before it's assigned?
console.log(playerName); // Output: undefined (No crash!)

var playerName = "Alice";

console.log(playerName); // Output: "Alice"

/* 
Behind the scenes, the engine interprets the above code like this:
  var playerName;             <-- Declaration hoisted to the top!
  console.log(playerName);    <-- Value is currently undefined
  playerName = "Alice";       <-- Assignment stays exactly where it was written
  console.log(playerName);
*/
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming `let` and `const` aren't hoisted

**The mistake:** Thinking that `let` and `const` do not experience hoisting at all, and therefore won't cause issues if accessed early.

**Why it's wrong:** `let` and `const` **ARE** hoisted to the top of their block scope. However, unlike `var` (which is initialized with `undefined`), `let` and `const` remain uninitialized in a state called the **Temporal Dead Zone (TDZ)**. If you try to access them before their line of code runs, the engine throws a fatal `ReferenceError`.

*Incorrect:*
```javascript
// console.log(score); // ReferenceError! Cannot access 'score' before initialization
let score = 100;
```

*Fix:*
```javascript
let score = 100;
console.log(score); // Always declare and initialize BEFORE accessing!
```

---

### Mistake 2: Losing Context Binding (`this`) in Hoisting Callbacks

**The mistake:** Passing methods from Hoisting instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "hoisting",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "hoisting",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Hoisting Operations

**The mistake:** Executing asynchronous operations within Hoisting without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/hoisting"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/hoisting");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in hoisting: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Function Declaration Hoisting vs 'var' Hoisting Analysis

**Scenario:** A legacy codebase refactoring audit analyzes the difference between function declaration hoisting (hoists implementation body) and var hoisting (hoists undefined).

**Requirements:**
1. Demonstrate calling function declaration before declaration line.
2. Demonstrate accessing var variable before declaration line (evaluates to undefined).
3. Return analysis summary.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function analyzeLegacyHoisting() {
>   const fnResult = hoistedFunction();
>   const varBeforeDecl = hoistedVar;
>   var hoistedVar = "ASSIGNED";
>
>   function hoistedFunction() {
>     return "FUN_OK";
>   }
>
>   return { fnResult, varBeforeDecl, varAfterDecl: hoistedVar };
> }
>
> // Verification tests
> const res = analyzeLegacyHoisting();
> console.assert(res.fnResult === "FUN_OK", "Test 1 Failed");
> console.assert(res.varBeforeDecl === undefined, "Test 2 Failed: var hoisting should yield undefined");
> console.assert(res.varAfterDecl === "ASSIGNED", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Hoisting Mechanism**: During context creation, JS hoists declarations to top of scope before execution begins.
> 2. **Function Declaration Hoisting**: Function declarations hoist both identifier name AND function body implementation.
> 3. **var Hoisting**: var declarations hoist identifier names initialized with undefined; assignment remains at original line.
> 
---

### Exercise 2: Temporal Dead Zone (TDZ) Hoisting Guard

**Scenario:** A modern JavaScript linter verifies that let and const variables are hoisted but remain uninitialized in the Temporal Dead Zone (TDZ).

**Requirements:**
1. Access let variable before declaration line inside try...catch.
2. Verify accessing let in TDZ throws a ReferenceError.
3. Return boolean TDZ validation status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function testTdzHoistingGuard() {
>   let tdzCaught = false;
>   try {
>     // @ts-ignore
>     console.log(tdzVar);
>     let tdzVar = "SAFE";
>   } catch (err) {
>     tdzCaught = err instanceof ReferenceError;
>   }
>   return tdzCaught;
> }
>
> // Verification tests
> console.assert(testTdzHoistingGuard() === true, "Test 1 Failed: TDZ access must throw ReferenceError");
> ```
>
> #### Technical Explanation
>
> 1. **TDZ Definition**: The Temporal Dead Zone is the duration between scope entry and actual let/const declaration execution.
> 2. **Uninitialized Hoisting**: let and const are hoisted to top of block scope, but accessing them before initialization throws ReferenceError.
> 3. **Scope Safety**: TDZ eliminates bugs caused by accessing uninitialized undefined variables.
> 
---

### Exercise 3: Function Expression Hoisting Pitfall Remediation

**Scenario:** A code auditor refactors invalid code that attempted to invoke a Function Expression variable prior to its assignment line.

**Requirements:**
1. Demonstrate that invoking a Function Expression var before assignment line throws TypeError.
2. Refactor to declare before invocation.
3. Verify execution.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function testFunctionExpressionHoisting() {
>   let typeErrorCaught = false;
>
>   try {
>     // @ts-ignore
>     varFnExpr();
>   } catch (err) {
>     typeErrorCaught = err instanceof TypeError;
>   }
>
>   var varFnExpr = function() { return "EXPR_OK"; };
>
>   return { typeErrorCaught, validCall: varFnExpr() };
> }
>
> // Verification tests
> const res = testFunctionExpressionHoisting();
> console.assert(res.typeErrorCaught === true, "Test 1 Failed");
> console.assert(res.validCall === "EXPR_OK", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Function Expression Hoisting Trap**: Variables assigned to Function Expressions hoist variable declarations, NOT function body definitions.
> 2. **TypeError on Invocation**: Calling an unassigned var expression invokes undefined(), resulting in a TypeError.
> 3. **Best Practice Ordering**: Define function expressions and let/const bindings at top of scope prior to invocation.
---

## 6. Related Terms
- [Function Declaration](function_declaration.md) — Fully hoisted.
- [Function Expression](function_expression.md) — Not hoisted (only the variable declaration is).
- [var](../level_01/var.md) — Hoisted and initialized with `undefined`.
- [Lexical (Static) Scope / Environment](lexical_scope.md) — Related concept: Lexical (Static) Scope / Environment.
- [Execution Context](../level_05/execution_context.md) — Related concept: Execution Context.

---

## 7. Key Takeaways
- Hoisting is the engine moving declarations to the top of memory during the parsing phase.
- **Function Declarations** are fully hoisted (you can call them before they appear in code).
- **`var` Declarations** are hoisted, but their values are not. They evaluate to `undefined` if accessed early.
- **`let` and `const` Declarations** are hoisted into the Temporal Dead Zone (TDZ) and will crash if accessed early.
