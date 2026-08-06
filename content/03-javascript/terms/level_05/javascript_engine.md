# JavaScript Engine

> **Level 5 — DOM & Browser Environment**
> The program (like V8) that actually parses, compiles, and executes JavaScript code.

---

## 1. Prerequisites
- [ECMAScript](../level_01/ecmascript.md) — The rulebook the engine is programmed to follow.
- [Execution Context](execution_context.md) — What the engine creates to run your code.

---

## 2. Term Category
Environment, Architecture

---

## 3. Core Definition
A **JavaScript Engine** is a specialized computer program that takes the raw JavaScript text you wrote, understands it, translates it into machine code (1s and 0s), and executes it on the computer's processor.

You do not install a JS engine manually; it comes built into your web browser. 

---

## 4. Key Characteristics / Rules
- **V8 (Google Chrome & Node.js):** The most famous and widely used JavaScript engine. It powers Chrome and was extracted to run Node.js.
- **SpiderMonkey (Firefox):** The very first JavaScript engine, originally created by Brendan Eich (the creator of JS) at Netscape.
- **JavaScriptCore (Safari):** The engine used by Apple's Safari browser.
- **JIT Compilation:** Modern engines use "Just-In-Time" compilation. They don't just interpret code line-by-line; they analyze it as it runs and compile heavily used pieces into highly optimized machine code on the fly.

---

## 5. Typical Usage / Common Patterns

You never interact with the engine directly in your code. However, understanding it helps you write performant code.

```javascript
// The Engine executes this code.
function add(a, b) {
  return a + b;
}

// If you call this function 10,000 times with numbers,
// the V8 Engine will optimize it by compiling it directly to machine code!
for (let i = 0; i < 10000; i++) {
  add(i, i);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Javascript Engine Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Javascript Engine blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "javascript_engine";
```

*Fix:*
```javascript
let value = "javascript_engine";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Javascript Engine Callbacks

**The mistake:** Passing methods from Javascript Engine instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "javascript_engine",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "javascript_engine",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Javascript Engine Operations

**The mistake:** Executing asynchronous operations within Javascript Engine without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/javascript_engine"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/javascript_engine");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in javascript_engine: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

---

### Exercise 1: JIT Compiler Optimization Concepts

**Problem:** Explain how V8 JIT compilers optimize monomorphic function call sites.

**Expected output:**
> [!check]- Answer
> ```text
> Monomorphic functions optimized inline
> ```
> ```javascript
> console.log("Monomorphic functions optimized inline");
> ```
>
> **Explanation:** Passing consistent object hidden classes (shapes) allows JIT compilers to inline property offsets.
> 
---

### Exercise 2: Call Stack & Memory Heap Roles

**Problem:** Identify where primitives (Call Stack) vs objects (Memory Heap) are stored in JS engines.

**Expected output:**
> [!check]- Answer
> ```text
> Primitives: Stack, Objects: Heap
> ```
> ```javascript
> console.log("Primitives: Stack, Objects: Heap");
> ```
>
> **Explanation:** Call stacks store execution frames and primitive variables; memory heap stores dynamic object allocations.
> 
---


### Exercise 3: V8 Hidden Classes (Shapes)

**Problem:** Explain why initializing object properties in the same order optimizes V8 hidden classes.

**Expected output:**
> [!check]- Answer
> ```text
> Identical property order shares hidden class shapes
> ```
> ```javascript
> console.log("Identical property order shares hidden class shapes");
> ```
>
> **Explanation:** V8 creates inline caches based on predictable object shapes.
> 
> 
---

## 7. Related Terms
- [Call Stack](../level_06/call_stack.md) — A specific data structure managed by the engine to keep track of function calls.
- [Node.js](../level_10/node_js.md) — A server runtime built by ripping the V8 engine out of Chrome and giving it file system access.

---

