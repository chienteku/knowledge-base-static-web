# Garbage Collection

> **Level 9 — Advanced Concepts & Patterns**
> The engine's automatic memory management process that removes unreachable objects.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The things that take up memory.
- [Call Stack](../level_06/call_stack.md) — Determines when things are no longer needed.

---

## 2. Term Category

**Engine Feature / Architecture (Universal)**: Garbage Collection is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Circular Reference Memory Leak Prevention with WeakMap

**Scenario:** An object metadata registry uses WeakMap to associate private metadata with DOM nodes without creating circular retention memory leaks.

**Requirements:**
1. Write createWeakNodeCache().
2. Store metadata using WeakMap.prototype.set(node, meta).
3. Verify entries are garbage collected when node references drop.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createWeakNodeCache() {
>   const cache = new WeakMap();
>
>   return {
>     setMeta(node, meta) {
>       if (typeof node !== "object" || node === null) return;
>       cache.set(node, meta);
>     },
>     getMeta(node) {
>       return cache.get(node);
>     },
>     hasMeta(node) {
>       return cache.has(node);
>     }
>   };
> }
>
> // Verification tests
> const cache = createWeakNodeCache();
> let domNode = { tag: "div", id: "app" };
>
> cache.setMeta(domNode, { renderedAt: Date.now() });
> console.assert(cache.hasMeta(domNode) === true, "Test 1 Failed");
> console.assert(cache.getMeta(domNode).renderedAt > 0, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Garbage Collection (GC) Mechanics**: Browsers use Mark-and-Sweep garbage collection to reclaim memory occupied by unreachable objects.
> 2. **Weak Reference Semantics**: WeakMap holds WEAK references to object keys; if no other references to key exist, key/value is eligible for GC.
> 3. **Circular Reference Prevention**: Prevents memory leaks caused by circular references between JavaScript objects and DOM nodes.
> 
---

### Exercise 2: Detached DOM Node Reference Cleaning

**Scenario:** A single-page app widget cleanup routine detaches DOM nodes and clears external array references to ensure memory can be reclaimed.

**Requirements:**
1. Write WidgetContainer class.
2. Maintain array of child nodes.
3. Implement destroy() to clear references and unbind DOM nodes.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class WidgetContainer {
>   constructor() {
>     this.nodes = [];
>   }
>
>   addNode(node) {
>     this.nodes.push(node);
>   }
>
>   destroy() {
>     // Clear array references to release memory for GC
>     this.nodes.length = 0;
>     this.nodes = null;
>   }
> }
>
> // Verification tests
> const widget = new WidgetContainer();
> widget.addNode({ id: "btn-1" });
> widget.addNode({ id: "btn-2" });
>
> console.assert(widget.nodes.length === 2, "Test 1 Failed");
> widget.destroy();
> console.assert(widget.nodes === null, "Test 2 Failed: Destroy must clear references");
> ```
>
> #### Technical Explanation
>
> 1. **Detached DOM Node Memory Leaks**: If a DOM node is removed from DOM tree but retained in JS variables, GC cannot free its memory.
> 2. **Explicit Nullification**: Setting arrays or variables to null breaks reference retention paths for Mark-and-Sweep GC.
> 3. **Lifecycle Cleanup Methods**: Providing explicit destroy() or unmount() methods is critical for memory hygiene in SPAs.
> 
---

### Exercise 3: Mark-and-Sweep Reachability Inspector Simulation

**Scenario:** A memory profiler simulator implements a Mark-and-Sweep reachability algorithm to detect reachable vs unreachable memory nodes.

**Requirements:**
1. Write markAndSweep(rootNode).
2. Traverse reachable objects starting from rootNode using Breadth-First Search.
3. Return set of reachable object IDs.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function markAndSweep(rootNode) {
>   const reachableIds = new Set();
>   const queue = [rootNode];
>
>   while (queue.length > 0) {
>     const current = queue.shift();
>     if (!current || !current.id || reachableIds.has(current.id)) {
>       continue;
>     }
>
>     reachableIds.add(current.id);
>
>     if (Array.isArray(current.references)) {
>       for (const ref of current.references) {
>         queue.push(ref);
>       }
>     }
>   }
>
>   return reachableIds;
> }
>
> // Verification tests
> const nodeC = { id: "C", references: [] };
> const nodeB = { id: "B", references: [nodeC] };
> const root = { id: "ROOT", references: [nodeB] };
> const leakedNodeD = { id: "D", references: [] }; // Unreachable from root
>
> const reachable = markAndSweep(root);
> console.assert(reachable.has("ROOT") === true, "Test 1 Failed");
> console.assert(reachable.has("C") === true, "Test 2 Failed");
> console.assert(reachable.has("D") === false, "Test 3 Failed: Unreachable node must be swept");
> ```
>
> #### Technical Explanation
>
> 1. **Mark-and-Sweep Algorithm**: GC algorithm that marks all objects reachable from roots (globals, call stack), then sweeps unreachable objects.
> 2. **Root Object Traversal**: Starts traversal from roots: global variables, active function call frames, and DOM document.
> 3. **Reachability Criterion**: An object is memory-retained ONLY if it can be reached via a chain of references from a root.
---

## 6. Related Terms
- [Closure](../level_03/closure.md) — Closures deliberately prevent garbage collection by keeping references to variables in parent scopes alive.
- [Object](../level_02/object.md) — The primary consumers of heap memory.
- [WeakMap / WeakSet](../level_08/weakmap_weakset.md) — Related concept: WeakMap / WeakSet.
- [Proxy](proxy.md) — Related concept: Proxy.

---

## 7. Key Takeaways
- Garbage Collection is an automatic background process that frees up RAM.
- It uses a "Mark-and-Sweep" algorithm based on **Reachability**.
- If an object cannot be reached by following references from the global root, it is deleted.
- You can still cause Memory Leaks in JS by accidentally leaving data attached to global variables, closures, or active event listeners.
```
