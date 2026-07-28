# Local / Function Scope

> **Level 3 — Functions & Scope**
> Variables declared within a function, accessible only inside that function.

---

## 1. Prerequisites
- [Scope](../level_03/scope.md) — The current context of execution.
- [Function](../level_03/function.md) — A reusable block of code.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If all variables lived in the Global Scope, functions wouldn't be able to safely do their jobs without accidentally overwriting data from other parts of the application. 

Local Scope (specifically Function Scope in older JavaScript) was designed as a "sandbox" for a function. When a function starts executing, it creates a temporary bubble of memory. Any variables declared inside that bubble belong *only* to that function. When the function finishes its job and returns, the bubble bursts, and all those local variables are destroyed to free up memory (Garbage Collection).

### (2) Reality Metaphor
If a function is a private meeting room in an office building, Local Scope represents the notes written on the whiteboard inside that room. Only the people actively sitting inside the room can read or modify those notes. Once the meeting ends and everyone leaves, the janitor wipes the whiteboard clean, completely destroying the information.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
function greet() {
  // 'message' is trapped inside this function's Local Scope
  const message = "Hello from the inside!";
  console.log(message);
}

greet();

// Trying to access it from the outside will crash the program
// console.log(message); // ReferenceError: message is not defined
```

#### Fuller Example
```javascript
const globalCount = 100;

function performCalculation() {
  // Local variables can share names with global variables (Shadowing)
  // Or they can be completely unique.
  const localCount = 5;
  const tempMultiplier = 2;
  
  // Functions can look OUT into the global scope
  const result = (globalCount + localCount) * tempMultiplier;
  
  return result;
}

const finalAnswer = performCalculation();
console.log(finalAnswer); // 210

// None of the temporary variables exist out here!
// console.log(localCount); // ReferenceError
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Local Scope Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Local Scope blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "local_scope";
```

*Fix:*
```javascript
let value = "local_scope";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Local Scope Callbacks

**The mistake:** Passing methods from Local Scope instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "local_scope",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "local_scope",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Local Scope Operations

**The mistake:** Executing asynchronous operations within Local Scope without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/local_scope"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/local_scope");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in local_scope: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Inner Workings

**Problem:** Look at the following code. Which variables belong strictly to the `processData` Local Scope?
```javascript
const tax = 0.05;

function processData(price) {
  const discount = 10;
  return (price - discount) + tax;
}
```

**Expected output:**
> [!check]- Answer
> ```text
> `price` (parameter) and `discount` are strictly local to processData.
> ```
> - Parameters are always local.
> - Anything declared inside the `{}` of the function is local.
> - `tax` is declared outside, so it is global.

---

### Exercise 2: Function Parameter Local Scoping

**Problem:** Demonstrate that function parameters `(a, b)` reside strictly within local scope.

**Expected output:**
> [!check]- Answer
> ```text
> ReferenceError caught
> ```
> function add(a, b) { return a + b; }
> add(1, 2);
> try {
>   console.log(a);
> } catch (err) {
>   console.log("ReferenceError caught");
> }
> ```
>
> **Explanation:** Function parameters are initialized as local scope variables inside function execution contexts.

---

### Exercise 3: Local Scope Shadowing Outer Variables

**Problem:** Shadow global variable `let name = "Global"` inside function `test()` with local `let name = "Local"`.

**Expected output:**
> [!check]- Answer
> ```text
> Local
> Global
> ```
> ```javascript
> let name = "Global";
> function test() {
>   let name = "Local";
>   console.log(name);
> }
> test();
> console.log(name);
> ```
>
> **Explanation:** Declaring identical variable names in local scopes shadows outer scope variables without mutating them.


---

## 7. Related Terms
- [Scope](../level_03/scope.md) — The general concept of variable visibility.
- [Global Scope](../level_03/global_scope.md) — The outermost scope.

---

## 8. Key Takeaways
- Variables declared inside a function are in the Local Scope.
- Local variables cannot be accessed from outside the function.
- Local variables are created when the function starts and destroyed when the function finishes.
- Function parameters are automatically treated as local variables.
