# Garbage Collection

> **Level 9 — Advanced Concepts & Patterns**
> The engine's automatic memory management process that removes unreachable objects.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The things that take up memory.
- [Call Stack](../level_06/call_stack.md) — Determines when things are no longer needed.
---

## 2. Term Category
- **Engine Feature / Architecture**

---

## 3. Environment Context
- **Universal** (V8, SpiderMonkey, WebKit all implement this)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In lower-level languages like C or C++, developers must manually manage computer memory. When they create an object, they write code to request RAM. When they are done with the object, they must write code to release the RAM. If they forget, the computer runs out of memory and crashes (a "Memory Leak").

JavaScript was designed to be easier. The creators implemented a background robot called the **Garbage Collector (GC)**. When you create objects or arrays, the engine automatically claims RAM for you. Periodically, the Garbage Collector wakes up, scans your entire application, and asks: "Is this object still being used?" If the answer is no, it automatically deletes it and frees up the RAM.

### (2) Reality Metaphor
Imagine a restaurant table. 
In C++, you must explicitly tell the waiter to bring a plate, and when you finish eating, you must explicitly tell the waiter to take the plate away. If you forget, plates pile up to the ceiling.
In JavaScript, you just ask for a plate. When you finish eating and walk away from the table, a busboy (the Garbage Collector) notices the table is abandoned and automatically clears the plates for you.

### (3) How it works: "Reachability"

The Garbage Collector uses a specific algorithm called **Mark-and-Sweep**. It starts at the "Roots" (global variables and currently executing functions). It follows every single variable reference like a spiderweb. 

If an object is attached to the web (it is "reachable"), it survives.
If an object is cut off from the web (it is "unreachable"), it is destroyed.

#### Code Example
```javascript
// 1. We create an object. 
// It is reachable via the global variable 'user'.
let user = { name: "Alice" };

// 2. We create another reference to the SAME object.
let admin = user;

// 3. We cut the first reference!
user = null;

// Is the object destroyed? 
// NO! It is still reachable via the 'admin' variable.

// 4. We cut the final reference!
admin = null;

// Is the object destroyed?
// YES! The object { name: "Alice" } is now floating in the void.
// It is completely unreachable. The next time the Garbage Collector runs,
// it will delete it and free the memory.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Garbage Collection Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Garbage Collection blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "garbage_collection";
```

*Fix:*
```javascript
let value = "garbage_collection";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Garbage Collection Callbacks

**The mistake:** Passing methods from Garbage Collection instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "garbage_collection",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "garbage_collection",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Garbage Collection Operations

**The mistake:** Executing asynchronous operations within Garbage Collection without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/garbage_collection"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/garbage_collection");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in garbage_collection: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Island of Isolation

**Problem:** Look at the following code. Two objects reference *each other*, but nothing else references them. Will they be garbage collected?
```javascript
function marry(man, woman) {
  woman.husband = man;
  man.wife = woman;
  
  return {
    father: man,
    mother: woman
  }
}

let family = marry({ name: "John" }, { name: "Ann" });

// We delete the entire family object
family = null; 
```

**Expected output:**
> [!check]- Answer
> ```text
> Yes, they will be destroyed!
> Even though John points to Ann, and Ann points to John, neither of them are connected to the "Root" (the global scope) anymore. They form an "Island of Isolation". The Garbage Collector sweeps away the entire island.
> ```
> - The algorithm only cares if an object can be reached from the ROOT.

---

### Exercise 2: Identifying Common Memory Leak Sources

**Problem:** Name 3 common causes of memory leaks in web applications (global variables, forgotten timers/listeners, detached DOM nodes).

**Expected output:**
> [!check]- Answer
> ```text
> Globals, Timers/Listeners, Detached DOM nodes
> ```
> ```javascript
> console.log("Globals, Timers/Listeners, Detached DOM nodes");
> ```
>
> **Explanation:** Retaining unneeded object references in active scope trees prevents GC cleanup.

---

### Exercise 3: Weak References with `WeakMap`

**Problem:** Explain why `WeakMap` keys do not prevent garbage collection of metadata objects.

**Expected output:**
> [!check]- Answer
> ```text
> WeakMap keys allow GC collection
> ```
> ```javascript
> console.log("WeakMap keys allow GC collection");
> ```
>
> **Explanation:** `WeakMap` stores weak key pointers that do not count as reachability roots.


---

## 7. Related Terms
- [Closure](../level_03/closure.md) — Closures deliberately prevent garbage collection by keeping references to variables in parent scopes alive.
- [Object](../level_02/object.md) — The primary consumers of heap memory.
- [WeakMap / WeakSet](../level_08/weakmap_weakset.md) — Related concept: WeakMap / WeakSet.
- [Proxy](proxy.md) — Related concept: Proxy.
---

## 8. Key Takeaways
- Garbage Collection is an automatic background process that frees up RAM.
- It uses a "Mark-and-Sweep" algorithm based on **Reachability**.
- If an object cannot be reached by following references from the global root, it is deleted.
- You can still cause Memory Leaks in JS by accidentally leaving data attached to global variables, closures, or active event listeners.
```
