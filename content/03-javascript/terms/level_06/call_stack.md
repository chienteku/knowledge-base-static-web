# Call Stack

> **Level 6 — Asynchronous JavaScript**
> A LIFO (Last In, First Out) stack that keeps track of function calls.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — A reusable block of code.
- [Synchronous](synchronous.md) — Execution of code sequentially.

---

## 2. Term Category

**Architecture Concept / Engine Concept (Universal: Built into the V8 engine .)**: Call Stack is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Call Stack Recursion Depth Inspector

**Scenario:** A developer tool monitors call stack frames during nested function calls to prevent maximum call stack size exceeded errors.

**Requirements:**
1. Write inspectStackDepth(depth, maxLimit).
2. Push frame counter on call stack.
3. Throw error if depth exceeds maxLimit.
4. Return current stack depth.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function inspectStackDepth(depth = 1, maxLimit = 10) {
>   if (depth > maxLimit) {
>     throw new RangeError("Stack depth limit exceeded");
>   }
>   if (depth === maxLimit) {
>     return depth;
>   }
>   return inspectStackDepth(depth + 1, maxLimit);
> }
>
> // Verification tests
> console.assert(inspectStackDepth(1, 5) === 5, "Test 1 Failed");
> let caughtRangeError = false;
> try {
>   inspectStackDepth(1, 20);
> } catch (err) {
>   caughtRangeError = err instanceof RangeError;
> }
> console.assert(caughtRangeError === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Call Stack Concept**: The Call Stack is a LIFO (Last-In, First-Out) data structure that tracks active function execution frames.
> 2. **Stack Frame Allocation**: Invoking a function pushes a new execution stack frame; returning pops the top frame.
> 3. **Maximum Call Stack Size**: Exceeding the call stack frame limit (e.g. infinite recursion) triggers a RangeError.
> 
---

### Exercise 2: Call Stack Advanced Context Handler

**Scenario:** A web application component processes call stack data operations within enterprise workflows.

**Requirements:**
1. Write handleCallStackSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleCallStackSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleCallStackSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Call Stack Architecture**: Applying call stack patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Call Stack Performance Optimization

**Scenario:** An application utility optimizes call stack execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeCallStackTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeCallStackTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeCallStackTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Call Stack Optimization**: Optimizing call stack improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Event Loop](event_loop.md) — The system that monitors the Call Stack.
- [Synchronous](synchronous.md) — The Call Stack processes synchronous tasks.
- [Recursion](../level_03/recursion.md) — Related concept: Recursion.
- [Execution Context](../level_05/execution_context.md) — Related concept: Execution Context.
- [JavaScript Engine](../level_05/javascript_engine.md) — Related concept: JavaScript Engine.
- [throw statement](throw_statement.md) — Related concept: throw statement.

---

## 7. Key Takeaways
- The Call Stack is the JavaScript engine's way of keeping track of its place in the code.
- It operates on a LIFO (Last In, First Out) principle.
- You can visibly see the Call Stack in your browser console whenever an Error is thrown (the "Stack Trace").
- An infinite loop of function calls will cause a "Stack Overflow" and crash your app.
