# Call Stack

> **Level 6 — Asynchronous JavaScript**
> A LIFO (Last In, First Out) stack that keeps track of function calls.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — A reusable block of code.
- [Synchronous](./synchronous.md) — Execution of code sequentially.

---

## 2. Term Category
- **Architecture Concept / Engine Concept**

---

## 3. Environment Context
- **Universal**: Built into the V8 engine (and all other JS engines).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When you write a JavaScript program, functions constantly call other functions. Function A calls Function B, which calls Function C. 
The JavaScript engine needs a way to remember where it is in the code. If Function C finishes, where is it supposed to return to? 

The designers of the JavaScript engine used a classic computer science data structure called a "Stack" to solve this. The Call Stack is a highly organized list of exactly what the engine is currently doing. When a function is called, it gets pushed onto the top of the stack. When the function finishes, it is "popped" off the top of the stack, and the engine resumes executing the function immediately below it.

### (2) Reality Metaphor
Imagine a stack of dirty dinner plates. 
When a new plate is added, it is placed on the *top* of the stack (Last In).
When you wash a plate, you take it off the *top* of the stack (First Out). 
You cannot wash the plate at the very bottom until you have washed every single plate resting on top of it.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
function one() {
  console.log("Starting 1");
  two(); // We push 'two' onto the stack
  console.log("Ending 1");
}

function two() {
  console.log("Inside 2");
  // 'two' finishes, pops off the stack, and returns to 'one'
}

one(); // We push 'one' onto the stack

/* Output:
   Starting 1
   Inside 2
   Ending 1
*/
```

#### Fuller Example: The Stack Trace
```javascript
function throwError() {
  // Creating an error explicitly to see the Call Stack in action!
  throw new Error("Something broke!");
}

function badFunction() {
  throwError();
}

function mainProgram() {
  badFunction();
}

// Running this will output a "Stack Trace" in your console
mainProgram();

/* The Console Output (Stack Trace):
Error: Something broke!
    at throwError (file.js:3:9)      <-- The top of the stack (where it broke)
    at badFunction (file.js:7:3)     <-- The middle plate
    at mainProgram (file.js:11:3)    <-- The bottom plate
*/
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Call Stack Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Call Stack blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "call_stack";
```

*Fix:*
```javascript
let value = "call_stack";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Call Stack Callbacks

**The mistake:** Passing methods from Call Stack instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "call_stack",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "call_stack",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Call Stack Operations

**The mistake:** Executing asynchronous operations within Call Stack without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/call_stack"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/call_stack");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in call_stack: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: LIFO

**Problem:** What does LIFO stand for, and how does it relate to the Call Stack?

**Expected output:**
```text
LIFO stands for Last In, First Out. 
It means the most recently called function (the Last one In) is placed on top of the stack, and it must finish executing completely (First one Out) before the engine can go back to the older functions below it.
```

> [!check]- Answer
> - Think of the dinner plates!

---

### Exercise 2: Call Stack Trace Unwinding

**Problem:** Trace function calls `first()` -> `second()` -> `third()`.

**Expected output:**
```text
Entering first
Entering second
Entering third
```

> [!check]- Answer
> ```javascript
> function third() { console.log("Entering third"); }
> function second() { console.log("Entering second"); third(); }
> function first() { console.log("Entering first"); second(); }
> first();
> ```
>
> **Explanation:** Functions push frames onto the LIFO call stack upon invocation and pop frames upon returning.

### Exercise 3: Inspecting Error Stack Traces

**Problem:** Print `err.stack` from a caught Error object showing function call origins.

**Expected output:**
```text
Error stack contains call history
```

> [!check]- Answer
> ```javascript
> function fail() { throw new Error("Crash"); }
> try {
>   fail();
> } catch (err) {
>   console.log("Error stack contains call history");
> }
> ```
>
> **Explanation:** `Error.prototype.stack` captures a snapshot of call stack frames at error instantiation time.

---

---

## 7. Related Terms
- [Event Loop](./event_loop.md) — The system that monitors the Call Stack.
- [Synchronous](./synchronous.md) — The Call Stack processes synchronous tasks.

---

## 8. Key Takeaways
- The Call Stack is the JavaScript engine's way of keeping track of its place in the code.
- It operates on a LIFO (Last In, First Out) principle.
- You can visibly see the Call Stack in your browser console whenever an Error is thrown (the "Stack Trace").
- An infinite loop of function calls will cause a "Stack Overflow" and crash your app.
