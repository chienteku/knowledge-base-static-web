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
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Custom Object Tracker

**Problem:** Complete the code to track if an object instance has been registered inside the `WeakSet` called `activeConnections`.

```javascript
const activeConnections = new WeakSet();

function connect(clientObj) {
  // Add clientObj to activeConnections
}

function isConnected(clientObj) {
  // Return true if connected, false otherwise
}

const clientA = { ip: "192.168.1.1" };
connect(clientA);

console.log("Connected?", isConnected(clientA)); // true
```

> [!check]- Answer
> - Inside `connect`, write `activeConnections.add(clientObj)`.
> - Inside `isConnected`, return `activeConnections.has(clientObj)`.

---

### Exercise 2: Automatic Garbage Collection with `WeakMap`

**Problem:** Demonstrate that `WeakMap` keys do not prevent garbage collection when object references are dropped.

**Expected output:**
> [!check]- Answer
> ```text
> Weak reference GC enabled
> ```
> ```javascript
> let keyObj = { id: 1 };
> const wm = new WeakMap();
> wm.set(keyObj, "metadata");
> console.log("Weak reference GC enabled");
> ```
>
> **Explanation:** `WeakMap` holds weak references to object keys, allowing garbage collection when key references are cleared.

---

### Exercise 3: Checking Key Existence in `WeakSet`

**Problem:** Add object to `WeakSet`, test `.has(obj)`, and delete reference.

**Expected output:**
> [!check]- Answer
> ```text
> has: true
> ```
> ```javascript
> const ws = new WeakSet();
> const item = { active: true };
> ws.add(item);
> console.log(`has: ${ws.has(item)}`);
> ```
>
> **Explanation:** `WeakSet` maintains weak collections of unique object references.

---

## 7. Related Terms
- [Garbage Collection](../level_09/garbage_collection.md) — The automated memory reclamation pipeline.
---

## 8. Key Takeaways
- `WeakMap` and `WeakSet` hold weak references to their key-objects, enabling garbage collection to reclaim memory.
- `WeakMap` keys must be objects; values can be any type. `WeakSet` values must be objects.
- If there are no other strong references to a key-object, it is garbage collected, and its entry is purged from the WeakMap automatically.
- Neither `WeakMap` nor `WeakSet` are iterable; they lack `.size`, `.forEach()`, or loops.
- Use `WeakMap` to store metadata or cache relationships against external object life-cycles (like DOM nodes) to prevent memory leaks.
