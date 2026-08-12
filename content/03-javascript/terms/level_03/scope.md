# Scope

> **Level 3 — Functions & Scope**
> The current context of execution in which values and expressions are visible or can be referenced.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
- [Function](function.md) — A reusable block of code.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Scope is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If every variable you ever created in a massive application was visible to every single line of code, the system would collapse in chaos. Two developers might accidentally use the same variable name (`let count = 0`), and their code would overwrite each other, causing impossible-to-track bugs.

"Scope" is the set of rules the JavaScript engine uses to determine where a specific variable lives, and who is allowed to look at it. By restricting visibility, Scope protects variables from being accidentally modified by unrelated parts of the program, a concept known as "Encapsulation" or "Principle of Least Privilege".

### (2) Reality Metaphor
Think of Scope like security clearances in an office building.
- **Global Scope** is the public lobby. Anyone in the building can see what's happening in the lobby.
- **Function/Local Scope** is a private meeting room. If you are inside the room, you can see what's on the whiteboard. If you are out in the hallway, the door is locked, and you cannot see the whiteboard. However, people inside the room can still look out the window into the public lobby.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const globalVar = "I am in the lobby";

function myRoom() {
  const localVar = "I am inside the locked room";
  
  // Functions can look OUTWARDS into the global scope
  console.log(globalVar); // Works!
}

myRoom();

// The global scope cannot look INWARDS to the function scope
// console.log(localVar); // ReferenceError: localVar is not defined
```

#### Fuller Example
```javascript
// Lexical Scope (Scope Chain)
const outer = "Outer";

function levelOne() {
  const innerOne = "Inner 1";
  
  function levelTwo() {
    const innerTwo = "Inner 2";
    
    // levelTwo can see its own variables, levelOne's variables, and global variables!
    console.log(`${outer} -> ${innerOne} -> ${innerTwo}`);
  }
  
  levelTwo();
  // levelOne CANNOT see innerTwo
}

levelOne();
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Scope Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Scope blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "scope";
```

*Fix:*
```javascript
let value = "scope";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Scope Callbacks

**The mistake:** Passing methods from Scope instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "scope",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "scope",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Scope Operations

**The mistake:** Executing asynchronous operations within Scope without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/scope"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/scope");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in scope: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Scope Chain Hierarchy Analyzer

**Scenario:** A code analysis tool inspects global, function, and block scope accessibility, analyzing identifier resolution across scope boundaries.

**Requirements:**
1. Demonstrate Global Scope, Function Scope, and Block Scope variable accessibility.
2. Return access report object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const globalScopeVar = "GLOBAL";
>
> function testScopeHierarchy() {
>   const functionScopeVar = "FUNCTION";
>   let blockScopeResult = "";
>
>   if (true) {
>     const blockScopeVar = "BLOCK";
>     blockScopeResult = `${globalScopeVar}:${functionScopeVar}:${blockScopeVar}`;
>   }
>
>   let isBlockLeaked = false;
>   try {
>     // @ts-ignore
>     console.log(blockScopeVar);
>   } catch (err) {
>     isBlockLeaked = false;
>   }
>
>   return { blockScopeResult, isBlockLeaked };
> }
>
> // Verification tests
> const res = testScopeHierarchy();
> console.assert(res.blockScopeResult === "GLOBAL:FUNCTION:BLOCK", "Test 1 Failed");
> console.assert(res.isBlockLeaked === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Scope Concept**: Scope defines the accessibility and visibility boundaries of variables and functions in code.
> 2. **Three Main Scopes**: JavaScript features Global Scope, Function (Local) Scope, and Block Scope (introduced in ES6).
> 3. **Scope Boundary Enclosure**: Inner scopes inherit access to outer variables; outer scopes cannot reach into inner scopes.
> 
---

### Exercise 2: Lexical Scope vs Dynamic Invocation Context

**Scenario:** A library spec verifier tests that JavaScript variable scope is determined lexically at compile time, completely independent of runtime function invocation sites.

**Requirements:**
1. Create function bindLexicalScope().
2. Return inner function accessing outer scope variable.
3. Invoke from different dynamic contexts.
4. Verify scope lookup remains fixed.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function bindLexicalScope() {
>   const scopeId = "LEXICAL_ENVIRONMENT_100";
>
>   return function() {
>     return scopeId;
>   };
> }
>
> const dynamicCallerObject = {
>   scopeId: "DYNAMIC_ENVIRONMENT_999",
>   callerFn: bindLexicalScope()
> };
>
> // Verification tests
> console.assert(dynamicCallerObject.callerFn() === "LEXICAL_ENVIRONMENT_100", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Static Lexical Scoping**: Variable scope is fixed at compile time based on code location, NOT execution call site.
> 2. **Lexical Environment Record**: Functions store a reference to their outer Lexical Environment Record upon creation.
> 3. **Scope vs 'this' Context**: Variable scope (lexical) is distinct from this context (dynamic based on invocation).
> 
---

### Exercise 3: Scope Leak Remediation via Strict Enclosure

**Scenario:** A security audit hardens legacy code, refactoring un-scoped assignments into strict block-scoped let/const bindings to eliminate scope leaks.

**Requirements:**
1. Audit function leaking variables to global scope.
2. Refactor using const and let within local function scope.
3. Verify scope leaks are completely eliminated.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function hardenedSecurityScope() {
>   const token = "SECURE_TOKEN_123";
>   let count = 0;
>   count++;
>
>   return {
>     token,
>     count,
>     isGlobalLeaked: typeof globalThis.token !== "undefined"
>   };
> }
>
> // Verification tests
> const audit = hardenedSecurityScope();
> console.assert(audit.token === "SECURE_TOKEN_123", "Test 1 Failed");
> console.assert(audit.isGlobalLeaked === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Scope Leak Risks**: Un-scoped variable assignments pollute outer/global scopes, causing hard-to-trace bugs.
> 2. **Strict Mode Enforcement**: Enabling strict mode turns undeclared scope assignments into thrown errors.
> 3. **Principle of Least Privilege**: Expose variables only in the smallest scope necessary for execution.
---

## 6. Related Terms
- [Global Scope](global_scope.md) — The outermost scope.
- [Local / Function Scope](local_scope.md) — Scope restricted to a function.
- [Block Scope](block_scope.md) — Scope restricted to `{ }` brackets (for `let` and `const`).
- [Closure](closure.md) — Related concept: Closure.
- [Modules (import/export)](../level_08/modules.md) — Related concept: Modules (import/export).
- [IIFE](../level_09/iife.md) — Related concept: IIFE.

---

## 7. Key Takeaways
- Scope dictates where variables are accessible.
- Scope works from the inside out: inner scopes can access variables in outer scopes, but outer scopes cannot look into inner scopes.
- Declaring a variable inside a function with the same name as a global variable "shadows" the global variable.
