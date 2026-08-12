# Function Expression

> **Level 3 — Functions & Scope**
> A function assigned to a variable (not hoisted).

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code.
- [Variable](../level_01/variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Function Expression is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Because JavaScript treats functions as "first-class citizens" (like strings or numbers), you don't *have* to declare them globally using the `function` keyword. You can create a function on the fly and shove it directly into a variable. 

This is called a Function Expression. It is incredibly useful when you want to pass a function as an argument to another function, or when you want strict control over when a function becomes available in memory. Unlike Function Declarations, Function Expressions are **not hoisted**.

### (2) Reality Metaphor
If a Function Declaration is a permanent recipe stored in your kitchen's central recipe box, a Function Expression is like hastily scribbling a recipe on a napkin and handing it to your friend (a variable). That recipe only exists at the exact moment you hand over the napkin; nobody could have read it before you wrote it down.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// The function has no name of its own (it is "anonymous")
// It is assigned to the variable 'sayHi'
const sayHi = function() {
  console.log("Hi there!");
};

// We invoke the variable name
sayHi();
```

#### Fuller Example
```javascript
// This will throw a ReferenceError!
// Function Expressions are NOT hoisted.
// calculateArea(); 

const calculateArea = function(width, height) {
  return width * height;
};

// Now it works, because the variable has been initialized.
console.log(calculateArea(5, 10)); // 50

// We can also reassign it if we used `let` (though `const` is safer)
let mathOperation = function(a, b) { return a + b; };
console.log(mathOperation(2, 2)); // 4

mathOperation = function(a, b) { return a * b; };
console.log(mathOperation(2, 2)); // 4
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to invoke before initialization

**The mistake:** Attempting to call the function before the line of code where the variable is assigned.

**Why it's wrong:** While the *variable declaration* (`const myFunc`) might be hoisted, its *assignment* (the actual function logic) is not. The engine doesn't know the variable holds a function until it executes that specific line.

*Incorrect:*
```javascript
// doMath(); // ReferenceError for const/let

const doMath = function() {
  console.log("Calculating...");
};
```

*Fix:*
```javascript
const doMath = function() {
  console.log("Calculating...");
};

doMath(); // Always call AFTER the expression!
```

---

### Mistake 2: Losing Context Binding (`this`) in Function Expression Callbacks

**The mistake:** Passing methods from Function Expression instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "function_expression",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "function_expression",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Function Expression Operations

**The mistake:** Executing asynchronous operations within Function Expression without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/function_expression"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/function_expression");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in function_expression: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Conditional Feature Strategy Assignment

**Scenario:** A runtime feature toggle engine assigns function expressions to variables conditionally, creating distinct algorithm strategies based on environment settings.

**Requirements:**
1. Assign function expression const calcTax = isVat ? function(amt) { ... } : function(amt) { ... }.
2. Execute variable as function.
3. Verify conditional assignment.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createTaxCalculator(isVatRegion) {
>   // Function Expression assigned conditionally to a variable
>   const calcTax = isVatRegion
>     ? function(amount) { return amount * 0.20; }
>     : function(amount) { return amount * 0.05; };
>
>   return calcTax;
> }
>
> // Verification tests
> const vatCalc = createTaxCalculator(true);
> const stdCalc = createTaxCalculator(false);
> console.assert(vatCalc(100) === 20, "Test 1 Failed");
> console.assert(stdCalc(100) === 5, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Function Expression Syntax**: A Function Expression creates a function as part of a larger expression (e.g. variable assignment).
> 2. **No Function Hoisting**: Variables holding Function Expressions are hoisted as let/const (TDZ) or var (undefined), preventing execution before assignment.
> 3. **Anonymous vs Named Expressions**: Function expressions can be anonymous or named for stack trace identification.
> 
---

### Exercise 2: Named Function Expression for Self-Referential Debugging

**Scenario:** A performance profiling library uses Named Function Expressions to ensure clear function names display in error stack traces.

**Requirements:**
1. Create named function expression const fib = function fibonacci(n) { ... }.
2. Use internal name for recursive calls.
3. Verify execution.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const computeFib = function fibonacci(n) {
>   if (n <= 0) return 0;
>   if (n === 1) return 1;
>   return fibonacci(n - 1) + fibonacci(n - 2);
> };
>
> // Verification tests
> console.assert(computeFib(6) === 8, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Named Function Expressions**: Adding an identifier name (function foo() {}) makes the name available strictly inside the function's local scope.
> 2. **Stack Trace Clarity**: Named function expressions display explicit names in debugging stack traces instead of (anonymous).
> 3. **Scope Isolation of Name**: The name identifier (fibonacci) is NOT bound in the outer scope; outer scope uses variable name (computeFib).
> 
---

### Exercise 3: Encapsulated Function Expression State Reducer

**Scenario:** A state manager assigns function expressions to action lookup tables for dynamic state transitions.

**Requirements:**
1. Define action map object with function expression values.
2. Dispatch action key.
3. Return evaluated state.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createReducer() {
>   const handlers = {
>     INCREMENT: function(state, action) {
>       return { ...state, count: state.count + action.payload };
>     },
>     DECREMENT: function(state, action) {
>       return { ...state, count: state.count - action.payload };
>     }
>   };
>
>   return function(state, action) {
>     const handler = handlers[action.type];
>     return handler ? handler(state, action) : state;
>   };
> }
>
> // Verification tests
> const reducer = createReducer();
> const s1 = reducer({ count: 10 }, { type: "INCREMENT", payload: 5 });
> console.assert(s1.count === 15, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Expression Assignment**: Function expressions fit naturally into object literal values and array elements.
> 2. **Runtime Evaluation**: Evaluates to a function object when execution reaches the assignment statement.
> 3. **First-Class Integration**: Combines seamlessly with higher-order functions and closures.
---

## 6. Related Terms
- [Function Declaration](function_declaration.md) — The traditional way to define a function (which is hoisted).
- [Arrow Function](arrow_function.md) — A modern, shorter syntax for writing Function Expressions.
- [Hoisting](hoisting.md) — Related concept: Hoisting.
- [Function](function.md) — Related concept: Function.

---

## 7. Key Takeaways
- A Function Expression creates a function and assigns it to a variable.
- They are usually "anonymous" (the function itself has no name after the `function` keyword).
- They are **not hoisted**. You cannot call them before they are defined in the code.
- They reinforce the concept that functions are just values that can be passed around.
