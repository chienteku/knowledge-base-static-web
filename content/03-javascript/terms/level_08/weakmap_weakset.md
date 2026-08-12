# WeakMap / WeakSet

> **Level 8 — Modern JavaScript (ES6+)**
> Collections with garbage-collectable keys.

---

## 1. Prerequisites
- [Map](map.md) — Key-value dictionary collections.
- [Set](set.md) — Collections storing unique values.
- [Reference vs Value (copy semantics)](../level_07/reference_vs_value.md) — The nature of object heap storage pointers.
- [Garbage Collection](../level_09/garbage_collection.md) — The automated memory reclamation system.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: WeakMap / WeakSet is a fundamental concept in this technology stack. **Level 8 — Modern JavaScript (ES6+)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard `Map` and `Set` collections hold **strong references** to their contents. If you use a large object as a key in a standard `Map` (e.g., storing user metadata against a DOM element), that object will **never** be cleaned up by the garbage collector—even if the user leaves the page or the element is deleted from the HTML tree. The `Map` itself keeps the key-object alive in memory, creating a memory leak.

To solve this, ES6 introduced **`WeakMap`** and **`WeakSet`**:
- **`WeakMap`:** A collection of key-value pairs where the **keys must be objects** (or in recent ES versions, non-registered Symbols) and values can be any type.
- **`WeakSet`:** A collection of unique values where **all values must be objects**.
- **Weak References:** References to key-objects in a `WeakMap`/`WeakSet` are held **weakly**. If there are no other active references pointing to a key-object elsewhere in the program, the engine automatically reclaims the object's memory during garbage collection and purges the key-value entry from the collection.
- **Non-Iterability:** Because garbage collection is non-deterministic (you cannot predict exactly when the browser runs memory cleanups), `WeakMap` and `WeakSet` are **not iterable**. They do not possess `.size`, `.forEach()`, or `.keys()` methods; you can only read, write, check, or delete entries directly using `.get()`, `.set()`, `.has()`, and `.delete()`.

### (2) Reality Metaphor
- **Standard Map (Strong)** is like a **secure coat-check room**. You hand the attendant your coat (an object key) and they hang it up. Even if you lose your receipt and completely forget the coat exists, the check-room is legally bound to store the coat in their closet forever, occupying physical space.
- **WeakMap (Weak)** is like sticking a **temporary yellow sticky note** onto your coat. The note stores metadata: `Owner: Brendan Eich`. If you take the coat home, throw it in a woodchipper, or lose it (deleting all strong references), the coat is gone. Because the sticky note was stuck to the coat, it automatically goes into the trash with the coat, leaving no leaked items behind.

### (3) JavaScript Code Examples

#### Preventing Memory Leaks with DOM Metadata
```javascript
// A cache tracking if a DOM element has been clicked
const clickTrackers = new WeakMap();

function registerElement(element) {
  // Store metadata directly against the DOM element object key
  clickTrackers.set(element, { count: 0 });
}

function recordClick(element) {
  if (clickTrackers.has(element)) {
    const data = clickTrackers.get(element);
    data.count++;
    console.log(`Element clicked ${data.count} times.`);
  }
}

// 1. Create a mock DOM element
let button = { id: "submit-btn", type: "button" };

registerElement(button);
recordClick(button); // "Element clicked 1 times."

// 2. The button is removed from the DOM and its reference is deleted
button = null; 

// Because we used WeakMap, the button object is now eligible for 
// Garbage Collection, and its click count entry is automatically purged!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use primitive values as WeakMap keys

**The mistake:** Calling `weakMap.set("user_id_101", data)` using a string or number key.

**Why it's wrong:** Primitives copy by value and are not subject to heap garbage collection reference rules. `WeakMap` keys and `WeakSet` values must strictly be objects (or symbols).

*Incorrect:*
```javascript
const registry = new WeakMap();
registry.set("config", { port: 8080 }); // TypeError: Invalid value used as weak map key
```

*Fix:*
```javascript
const registry = new WeakMap();
const configKey = { name: "config" }; // Create an object wrapper key

registry.set(configKey, { port: 8080 }); // Correct!
```

### Mistake 2: Losing Context Binding (`this`) in Weakmap Weakset Callbacks

**The mistake:** Passing methods from Weakmap Weakset instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "weakmap_weakset",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "weakmap_weakset",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Weakmap Weakset Operations

**The mistake:** Executing asynchronous operations within Weakmap Weakset without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/weakmap_weakset"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/weakmap_weakset");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in weakmap_weakset: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Private Class Metadata Storage via WeakMap & WeakSet

**Scenario:** A framework uses a WeakMap to store private instance metadata and a WeakSet to track visited DOM nodes without causing memory leaks.

**Requirements:**
1. Write createPrivateMetadataStore().
2. Use WeakMap for object private data.
3. Use WeakSet for object tracking.
4. Verify garbage-collection friendly storage.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createPrivateMetadataStore() {
>   const privateMap = new WeakMap();
>   const visitedSet = new WeakSet();
>
>   return {
>     setPrivateData(obj, data) {
>       if (typeof obj !== "object" || obj === null) return;
>       privateMap.set(obj, data);
>       visitedSet.add(obj);
>     },
>     getPrivateData(obj) {
>       return privateMap.get(obj);
>     },
>     isVisited(obj) {
>       return visitedSet.has(obj);
>     }
>   };
> }
>
> // Verification tests
> const store = createPrivateMetadataStore();
> let targetObj = { id: "node-1" };
>
> store.setPrivateData(targetObj, { secret: "123" });
> console.assert(store.getPrivateData(targetObj).secret === "123", "Test 1 Failed");
> console.assert(store.isVisited(targetObj) === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **WeakMap & WeakSet Concept**: Collections holding WEAK references to object keys/members; keys can be garbage-collected if no other references exist.
> 2. **Must Use Object Keys**: WeakMap keys and WeakSet members MUST be non-null Objects (or non-registered Symbols).
> 3. **Non-Iterable Nature**: WeakMap and WeakSet are NOT iterable and do not have .size or .clear() methods to prevent exposing GC non-determinism.
> 
---

### Exercise 2: Weakmap Weakset Advanced Context Handler

**Scenario:** A web application component processes weakmap weakset data operations within enterprise workflows.

**Requirements:**
1. Write handleWeakmapWeaksetSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleWeakmapWeaksetSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleWeakmapWeaksetSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Weakmap Weakset Architecture**: Applying weakmap weakset patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Weakmap Weakset Performance Optimization

**Scenario:** An application utility optimizes weakmap weakset execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeWeakmapWeaksetTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeWeakmapWeaksetTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeWeakmapWeaksetTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Weakmap Weakset Optimization**: Optimizing weakmap weakset improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Garbage Collection](../level_09/garbage_collection.md) — The automated memory reclamation pipeline.

---

## 7. Key Takeaways
- `WeakMap` and `WeakSet` hold weak references to their key-objects, enabling garbage collection to reclaim memory.
- `WeakMap` keys must be objects; values can be any type. `WeakSet` values must be objects.
- If there are no other strong references to a key-object, it is garbage collected, and its entry is purged from the WeakMap automatically.
- Neither `WeakMap` nor `WeakSet` are iterable; they lack `.size`, `.forEach()`, or loops.
- Use `WeakMap` to store metadata or cache relationships against external object life-cycles (like DOM nodes) to prevent memory leaks.
