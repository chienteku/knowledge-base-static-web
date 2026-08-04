# Execution Context

> **Level 5 — DOM & Browser Environment**
> The abstract environment where JavaScript code is evaluated and executed.

---

## 1. Prerequisites
- [Scope](../level_03/scope.md) — Closely related to the execution context.

---

## 2. Term Category
Architecture, Advanced Core

---

## 3. Core Definition
The **Execution Context** is an abstract concept describing the environment in which JavaScript code is evaluated and executed. Whenever any code is run in JavaScript, it is run inside an execution context.

Think of it as a "box" or "wrapper" that the JS engine builds around your code. Inside this box, the engine stores variables, sets the value of `this`, and manages the scope chain.

---

## 4. Key Characteristics / Rules
There are two main types of Execution Contexts:
1. **Global Execution Context:** The default, base context. Any code not inside a function runs here. It creates the Global Object (`window` in browsers) and sets `this` to the global object. There is only *one* Global Context per page.
2. **Function Execution Context:** Every time a function is invoked, a brand new execution context is created specifically for that function. It contains the function's local variables, arguments, and its own `this` binding.

**The Creation Phase:** Before executing code, the engine scans the context, allocates memory for variables (Hoisting), and sets up the Scope Chain.

---

## 5. Typical Usage / Common Patterns

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

---

### Exercise 1: Call Stack Execution Context Traversal

**Problem:** Describe how Global Execution Context (GEC) remains at stack base while Function Execution Contexts (FEC) push/pop.

**Expected output:**
> [!check]- Answer
> ```text
> GEC at bottom; FEC pushed on invoke, popped on return
> ```
> ```javascript
> console.log("GEC at bottom; FEC pushed on invoke, popped on return");
> ```
>
> **Explanation:** The JS call stack manages active execution contexts in LIFO order.

---

### Exercise 2: Execution Context Creation vs Execution Phase

**Problem:** State two phases of Execution Context creation (Creation: Hoisting/Environment Record, Execution: Line-by-line code evaluation).

**Expected output:**
> [!check]- Answer
> ```text
> Phase 1: Creation, Phase 2: Execution
> ```
> ```javascript
> console.log("Phase 1: Creation, Phase 2: Execution");
> ```
>
> **Explanation:** JS engines allocate variable memory during creation phase before executing code lines.

---

---

### Exercise 3: Lexical Environment Component

**Problem:** Explain what the Lexical Environment component of an Execution Context stores.

**Expected output:**
> [!check]- Answer
> ```text
> Identifier-variable mappings and outer environment reference
> ```
> ```javascript
> console.log("Identifier-variable mappings and outer environment reference");
> ```
>
> **Explanation:** Lexical Environment holds local variable bindings and pointer references to parent scopes.


---

## 7. Related Terms
- [Call Stack](../level_06/call_stack.md) — The stack data structure that physically holds and manages all active Execution Contexts.
- [Hoisting](../level_03/hoisting.md) — A behavior that occurs during the "Creation Phase" of an Execution Context.

---
