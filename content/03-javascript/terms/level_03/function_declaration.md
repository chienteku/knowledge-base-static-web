# Function Declaration

> **Level 3 — Functions & Scope**
> Defines a named function using the `function` keyword (hoisted).

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Function Declaration is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When building a JavaScript file, developers needed a clear, standard way to define the primary sub-programs that make up their application. The Function Declaration is the oldest and most traditional way to create a function. 

It was designed with a special feature called "Hoisting". The JavaScript engine reads the entire file before executing it, and it pulls all Function Declarations to the very top of memory. This allows developers to organize their files naturally: they can call a function at the top of the script, and define how that function works at the bottom, keeping the main logic clean and readable.

### (2) Reality Metaphor
A Function Declaration is like putting a prominent recipe card into your kitchen's central recipe box before you start cooking. Because it's officially registered in the central box, you can ask for the "Pancake" recipe at any time during the cooking process—even if the card physically sits at the back of the box.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// This is a Function Declaration
function greet() {
  console.log("Welcome to the application!");
}

greet();
```

#### Fuller Example
```javascript
// Look! We are calling the function BEFORE it is defined in the code!
// This works perfectly because of "Hoisting".
initializeDatabase(); 

// ... hundreds of lines of code ...

// The actual Function Declaration
function initializeDatabase() {
  console.log("Connecting to the database...");
  // connection logic...
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Function Declaration Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Function Declaration blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "function_declaration";
```

*Fix:*
```javascript
let value = "function_declaration";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Function Declaration Callbacks

**The mistake:** Passing methods from Function Declaration instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "function_declaration",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "function_declaration",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Function Declaration Operations

**The mistake:** Executing asynchronous operations within Function Declaration without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/function_declaration"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/function_declaration");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in function_declaration: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Top-Level Module Function Hoisting

**Scenario:** A backend API gateway declares top-level service functions using Function Declarations, allowing functions to be called anywhere in the module due to hoisting.

**Requirements:**
1. Write code where invokeService() is called BEFORE its function declaration line.
2. Declare function invokeService() below caller.
3. Verify function executes cleanly due to hoisting.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // Function call BEFORE declaration statement (supported via hoisting)
> const serviceResult = invokeService("AUTH_CHECK");
>
> function invokeService(action) {
>   return "EXECUTED: " + action;
> }
>
> // Verification tests
> console.assert(serviceResult === "EXECUTED: AUTH_CHECK", "Test 1 Failed: Hoisting failed");
> ```
>
> #### Technical Explanation
>
> 1. **Function Declaration Hoisting**: Function declarations are completely hoisted (both name and body implementation) during context creation phase.
> 2. **Invocation Priority**: Can be safely invoked anywhere within their enclosing scope, even before declaration lines.
> 3. **Declaration Syntax**: Starts with the function keyword followed by mandatory identifier name: function name() {}.
> 
---

### Exercise 2: Recursive Mathematical Function Declaration

**Scenario:** A math algorithm package uses named Function Declarations to support self-referential recursive calculations like factorial.

**Requirements:**
1. Declare function calculateFactorial(n).
2. Use recursive self-invocation.
3. Return factorial result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateFactorial(n) {
>   if (n <= 1) return 1;
>   return n * calculateFactorial(n - 1);
> }
>
> // Verification tests
> console.assert(calculateFactorial(5) === 120, "Test 1 Failed");
> console.assert(calculateFactorial(1) === 1, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Named Binding**: Function declarations bind their identifier name in the current enclosing scope.
> 2. **Recursive Self-Reference**: The function name identifier is available inside its own body for recursive invocations.
> 3. **Statement Context**: Function declarations operate as standalone statements rather than expressions.
> 
---

### Exercise 3: Declarative API Service Module Contracts

**Scenario:** A microservice suite uses Function Declarations to define clean, declarative public API utility functions.

**Requirements:**
1. Declare function parseApiKey(headerStr).
2. Extract API key.
3. Return formatted key.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseApiKey(headerStr) {
>   if (typeof headerStr !== "string" || !headerStr.startsWith("Bearer ")) {
>     return null;
>   }
>   return headerStr.slice(7).trim();
> }
>
> // Verification tests
> console.assert(parseApiKey("Bearer secret-xyz") === "secret-xyz", "Test 1 Failed");
> console.assert(parseApiKey("invalid") === null, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Declarative Clarity**: Function declarations provide clear visual structure for top-level module utility suites.
> 2. **Scope Binding**: Declared in enclosing script or module scope.
> 3. **Strict Mode Enforcement**: In block scopes under strict mode, function declarations are scoped strictly to their block.
---

## 6. Related Terms
- [Function Expression](function_expression.md) — A function assigned to a variable (which is *not* hoisted).
- [Hoisting](hoisting.md) — The behavior of moving declarations to the top of the scope.
- [Function](function.md) — Related concept: Function.

---

## 7. Key Takeaways
- A Function Declaration starts with the `function` keyword as the very first word of the statement.
- They must have a name.
- They are **hoisted**, meaning you can invoke them before they appear in the source code.
