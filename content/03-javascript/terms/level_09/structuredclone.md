# structuredClone

> **Level 9 — Advanced Concepts & Patterns**
> Built-in deep-cloning API.

---

## 1. Prerequisites
- [Reference vs Value (copy semantics)](../level_07/reference_vs_value.md) — Reference vs value memory structures.
- [Shallow Copy vs Deep Copy](../level_07/shallow_vs_deep_copy.md) — The copy strategies for nested data.

---

## 2. Term Category

**Language Core (Universal: Standardized globally. Supported in Node.js , modern browsers, and Deno.)**: structuredClone is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Deep copying nested objects in JavaScript historically required compromises. Developers had to import heavy utility libraries (like Lodash's `_.cloneDeep`), write custom recursive copy functions, or use the legacy JSON trick: `JSON.parse(JSON.stringify(obj))`. 

However, the JSON serialization approach has major flaws: it strips out functions, deletes `undefined` keys, fails on circular references, and coerces `Date` objects into strings and `Map`/`Set` objects into empty objects.

To solve this, the web platform standardized the global **`structuredClone(value)`** API:
- It creates a true deep copy of the value using the **Structured Clone Algorithm**.
- **Supported Types:** Unlike JSON, it preserves: `Map`, `Set`, `Date`, `RegExp`, `Error`, `ArrayBuffer`, typed arrays, and `Blob` structures.
- **Circular References:** It natively resolves circular references (where an object references itself directly or indirectly) without entering infinite loops or crashing.
- **Transferables:** It supports transferring the underlying memory of ArrayBuffers directly (using `{ transfer: [buffer] }`) for high-performance multithreading (e.g. sending data to Web Workers).

### (2) Critical Limitations
- **No Functions:** It cannot clone functions (methods or closures). Attempting to do so throws a `DOMException` error.
- **Prototype Stripping:** It strips the prototype chain of custom class instances. Cloning `new MyClass()` returns a plain, generic JavaScript `Object` containing only the class instance's own properties.

### (3) Reality Metaphor
- The **JSON copy trick** is like copying your desk contents on a **flatbed scanner**. It scans paper sheets (primitives) fine, but if you scan a physical calendar (Date object) or a drawer containing keys (a Map collection), the output is a flat, useless black-and-white picture. If you place a mirror facing another mirror on the scanner (circular reference), it gets stuck in an reflection loop.
- **`structuredClone`** is a **3D printing teleporter**. It maps the three-dimensional structures of your calendar, drawers, and keys, printing an exact independent replica on a separate desk. However, it still cannot teleport living workers (Functions).

### (4) JavaScript Code Examples

#### Deep Cloning Complex Data Types
```javascript
// A nested user profile containing Map, Set, and Date objects
const originalUser = {
  name: "Brendan",
  joined: new Date("2020-01-15"),
  tags: new Set(["creator", "pioneer"]),
  preferences: {
    theme: "dark"
  }
};

// 1. Deep clone using structuredClone
const clonedUser = structuredClone(originalUser);

// 2. Verify deep mutations do not affect the original object
clonedUser.preferences.theme = "light";
clonedUser.tags.add("developer");

console.log(originalUser.preferences.theme); // "dark" (Untouched!)
console.log(originalUser.tags.has("developer")); // false (Untouched!)

// 3. Verify Date object methods remain fully active
console.log(clonedUser.joined.getFullYear()); // 2020
```

#### Safe Circular Reference Handling
```javascript
const nodeA = { name: "Node A" };
const nodeB = { name: "Node B" };

// Create a circular loop reference
nodeA.sibling = nodeB;
nodeB.sibling = nodeA;

// Attempting to clone nodeA:
// JSON.stringify(nodeA) would throw TypeError: Converting circular structure to JSON
const clonedNode = structuredClone(nodeA);

console.log(clonedNode.sibling.name); // "Node B"
console.log(clonedNode.sibling.sibling === clonedNode); // true (Circular loop preserved!)
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Cloning objects containing Functions

**The mistake:** Passing a utility config containing helper methods directly into `structuredClone`.

**Why it's wrong:** The Structured Clone algorithm cannot serialize executable code. If the object contains a function anywhere in its tree, the API throws a `DOMException` error.

*Incorrect:*
```javascript
const user = {
  name: "Alice",
  greet() { return `Hello ${this.name}`; }
};

const copy = structuredClone(user); // Throws DOMException: greet could not be cloned
```

*Fix:*
```javascript
// Manual copy required for functions
const copy = { ...user }; // Shallow copy retains function reference
```

### Mistake 2: Losing Context Binding (`this`) in Structuredclone Callbacks

**The mistake:** Passing methods from Structuredclone instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "structuredclone",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "structuredclone",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Structuredclone Operations

**The mistake:** Executing asynchronous operations within Structuredclone without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/structuredclone"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/structuredclone");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in structuredclone: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Deep Cloning Complex & Circular Data via structuredClone()

**Scenario:** A state snapshot tool uses native `structuredClone()` to deep clone complex object graphs containing circular references, Maps, Sets, and Dates.

**Requirements:**
1. Write cloneStateSnapshot(stateObj).
2. Use native structuredClone().
3. Verify deep equality and reference independence.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function cloneStateSnapshot(stateObj) {
>   if (typeof globalThis.structuredClone !== "function") {
>     throw new Error("structuredClone API not supported in this runtime");
>   }
>   return globalThis.structuredClone(stateObj);
> }
>
> // Verification tests
> const original = {
>   date: new Date("2026-08-12"),
>   tags: new Set(["js", "es6"]),
>   map: new Map([["key", "val"]]),
>   nested: { count: 1 }
> };
> original.self = original; // Circular reference!
>
> const cloned = cloneStateSnapshot(original);
>
> console.assert(cloned !== original, "Test 1 Failed");
> console.assert(cloned.nested !== original.nested, "Test 2 Failed");
> console.assert(cloned.tags instanceof Set && cloned.tags.has("js"), "Test 3 Failed");
> console.assert(cloned.self === cloned, "Test 4 Failed: Circular reference must point to cloned object graph");
> ```
>
> #### Technical Explanation
>
> 1. **structuredClone API**: Native browser & Node.js global API for performing deep copies of JavaScript values.
> 2. **Support for Built-in Types**: Clones Maps, Sets, Dates, RegExps, TypedArrays, and ArrayBuffers natively.
> 3. **Circular Reference Handling**: Properly preserves circular references without entering infinite recursion stack overflows.
> 
---

### Exercise 2: Cloning & Transferring ArrayBuffer Memory

**Scenario:** A Web Workers messaging utility transfers binary memory buffers using the transfer option in `structuredClone()`.

**Requirements:**
1. Write transferMemoryBuffer(buffer).
2. Use structuredClone(buffer, { transfer: [buffer] }).
3. Verify original buffer is detached.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function transferMemoryBuffer(buffer) {
>   if (typeof globalThis.structuredClone !== "function") return null;
>
>   const cloned = globalThis.structuredClone(buffer, { transfer: [buffer] });
>   return {
>     cloned,
>     isOriginalDetached: buffer.byteLength === 0
>   };
> }
>
> // Verification tests
> if (typeof globalThis.structuredClone === "function" && typeof ArrayBuffer !== "undefined") {
>   const buffer = new ArrayBuffer(16);
>   const result = transferMemoryBuffer(buffer);
>
>   console.assert(result.cloned.byteLength === 16, "Test 1 Failed");
>   console.assert(result.isOriginalDetached === true, "Test 2 Failed: Transferred buffer must be detached");
> }
> ```
>
> #### Technical Explanation
>
> 1. **Transferable Objects Option**: Passing { transfer: [buffer] } moves underlying memory rather than copying, zeroing out original buffer.
> 2. **Zero-Copy Memory Transfers**: Provides high-performance data transfer for large WebAssembly or WebGL memory buffers.
> 3. **Detached State Invariant**: Transferred ArrayBuffers become detached and have byteLength set to 0.
> 
---

### Exercise 3: structuredClone vs JSON Serialization Edge Cases

**Scenario:** A data sanitizer tests `structuredClone()` limitations, verifying that functions, DOM nodes, and symbols throw DataCloneError.

**Requirements:**
1. Write safeCloneOrFallback(data).
2. Try structuredClone(data).
3. Catch DataCloneError and handle un-cloneable values.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safeCloneOrFallback(data) {
>   try {
>     return { success: true, data: globalThis.structuredClone(data) };
>   } catch (err) {
>     return { success: false, error: err.name || "DataCloneError" };
>   }
> }
>
> // Verification tests
> const validData = { nums: [1, 2, 3] };
> const res1 = safeCloneOrFallback(validData);
> console.assert(res1.success === true, "Test 1 Failed");
>
> const invalidData = { fn: () => {} }; // Functions cannot be cloned by structuredClone
> const res2 = safeCloneOrFallback(invalidData);
> console.assert(res2.success === false, "Test 2 Failed: Functions must fail structuredClone");
> ```
>
> #### Technical Explanation
>
> 1. **DataCloneError Exceptions**: Attempting to clone functions, DOM nodes, Proxy objects, or Symbols throws a DataCloneError.
> 2. **Limitations vs JSON.stringify**: JSON.stringify silently omits functions/undefined; structuredClone throws explicit errors.
> 3. **Prototype Dropping**: Class instances cloned via structuredClone lose custom prototype methods and become plain objects.
---

## 6. Related Terms
- [JSON / JSON.stringify / JSON.parse](../level_07/json.md) — The legacy string serialization copy alternative.

---

## 7. Key Takeaways
- `structuredClone()` is the native, built-in global standard API for deep cloning.
- It preserves `Map`, `Set`, `Date`, `RegExp`, `Error`, and typed arrays.
- It safely duplicates circular reference structures without crashing.
- It throws a `DOMException` if the input object contains functions or DOM nodes.
- Custom class instances lose their prototypes and constructor identities, turning into plain objects.
