# Execution Context

> **Level 5 — DOM & Browser Environment**
> The abstract environment where JavaScript code is evaluated and executed.

---

## 1. Prerequisites
- [Scope](../level_03/scope.md) — Closely related to the execution context.
- [Call Stack](../level_06/call_stack.md) — Managing JavaScript function execution contexts.

---

## 2. Term Category

**Architecture, Advanced Core (core concept)**: Execution Context is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The **Execution Context** is an abstract concept describing the environment in which JavaScript code is evaluated and executed. Whenever any code is run in JavaScript, it is run inside an execution context.

Think of it as a "box" or "wrapper" that the JS engine builds around your code. Inside this box, the engine stores variables, sets the value of `this`, and manages the scope chain.

### (2) Key Characteristics

There are two main types of Execution Contexts:
1. **Global Execution Context:** The default, base context. Any code not inside a function runs here. It creates the Global Object (`window` in browsers) and sets `this` to the global object. There is only *one* Global Context per page.
2. **Function Execution Context:** Every time a function is invoked, a brand new execution context is created specifically for that function. It contains the function's local variables, arguments, and its own `this` binding.

**The Creation Phase:** Before executing code, the engine scans the context, allocates memory for variables (Hoisting), and sets up the Scope Chain.

### (3) Code Examples & Typical Usage

Execution Contexts are pushed onto the Call Stack as they are created, and popped off when they finish.

```javascript
let a = 10; // Global Execution Context

function first() {
  let b = 20; // 'first' Function Execution Context
  second();
}

function second() {
  let c = 30; // 'second' Function Execution Context
}

first(); 
// The engine creates the Global Context, then the 'first' Context, 
// then the 'second' Context.
```



---



---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Execution Context Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Execution Context blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "execution_context";
```

*Fix:*
```javascript
let value = "execution_context";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Execution Context Callbacks

**The mistake:** Passing methods from Execution Context instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "execution_context",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "execution_context",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Execution Context Operations

**The mistake:** Executing asynchronous operations within Execution Context without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/execution_context"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/execution_context");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in execution_context: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Execution Call Stack Depth Inspector

**Scenario:** A debugging tool simulates JavaScript execution context creation and Call Stack push/pop operations.

**Requirements:**
1. Write simulateCallStack(fnArray).
2. Push execution context objects onto call stack array.
3. Pop context upon completion.
4. Return execution log.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function simulateCallStack(fnNames) {
>   const stack = [];
>   const log = [];
>
>   for (const name of fnNames) {
>     const context = { name, phase: "CREATION" };
>     stack.push(context);
>     context.phase = "EXECUTION";
>     log.push(`Entered ${name}`);
>   }
>
>   while (stack.length > 0) {
>     const exited = stack.pop();
>     log.push(`Exited ${exited.name}`);
>   }
>   return log;
> }
>
> // Verification tests
> const log = simulateCallStack(["global", "main", "calculate"]);
> console.assert(log[0] === "Entered global", "Test 1 Failed");
> console.assert(log[log.length - 1] === "Exited global", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Execution Context Concept**: An abstract environment created by JS engine to evaluate and execute code.
> 2. **Creation Phase vs Execution Phase**: Creation phase sets up Variable Environment and scope chain; Execution phase executes code line-by-line.
> 3. **Call Stack Management**: Single-threaded Call Stack manages active execution contexts using LIFO stack order.
> 
---

### Exercise 2: Execution Context Advanced Context Handler

**Scenario:** A web application component processes execution context data operations within enterprise workflows.

**Requirements:**
1. Write handleExecutionContextSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleExecutionContextSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleExecutionContextSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Execution Context Architecture**: Applying execution context patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Execution Context Performance Optimization

**Scenario:** An application utility optimizes execution context execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeExecutionContextTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeExecutionContextTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeExecutionContextTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Execution Context Optimization**: Optimizing execution context improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Call Stack](../level_06/call_stack.md) — The stack data structure that physically holds and manages all active Execution Contexts.
- [Hoisting](../level_03/hoisting.md) — A behavior that occurs during the "Creation Phase" of an Execution Context.

---

## 7. Key Takeaways
- An Execution Context is the internal environment created by the JS engine to evaluate and execute JavaScript code.
- Global Execution Context (GEC) is created on startup; Function Execution Context (FEC) is created whenever a function is called.
- Execution Context lifecycle has two phases: Creation Phase (allocating memory, hoisting) and Execution Phase (evaluating lines of code).
- Active contexts are managed on the Call Stack in Last-In, First-Out (LIFO) order.


