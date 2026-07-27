# structuredClone

> **Level 9 — Advanced Concepts & Patterns**
> Built-in deep-cloning API.

---

## 1. Prerequisites
- [Reference vs Value (copy semantics)](../level_07/reference_vs_value.md) — Reference vs value memory structures.
- [Shallow Copy vs Deep Copy](../level_07/shallow_vs_deep_copy.md) — The copy strategies for nested data.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Standardized globally. Supported in Node.js (v17+), modern browsers, and Deno.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Config Cloner

**Problem:** Complete the function `cloneConfig` to return a deep copy of `systemConfig`. If cloning fails due to a `DOMException` (e.g. due to functions), catch the error and fallback to a shallow spread copy.

```javascript
function cloneConfig(config) {
  try {
    // Write deep clone code
  } catch (error) {
    console.warn("Fallback to shallow copy.");
    return { ...config };
  }
}

const conf = { port: 8080, log: () => "Logs" };
const result = cloneConfig(conf);

console.log("Port:", result.port);
console.log("Log method exists?", typeof result.log === "function");
```

**Expected output:**
```text
Fallback to shallow copy.
Port: 8080
Log method exists? true
```

> [!check]- Answer
> - Inside `try`, return `structuredClone(config)`.

---

### Exercise 2: Deep Cloning Complex Objects with `structuredClone`

**Problem:** Deep clone object `{ date: new Date(), set: new Set([1, 2]) }`.

**Expected output:**
```text
True deep copy with Date and Set intact
```

> [!check]- Answer
> ```javascript
> const orig = { date: new Date(), set: new Set([1, 2]) };
> const copy = structuredClone(orig);
> console.log("True deep copy with Date and Set intact");
> ```
>
> **Explanation:** `structuredClone` natively handles complex built-in types like `Date`, `Set`, `Map`, `RegExp`, `ArrayBuffer`.

### Exercise 3: Transferring ArrayBuffer Ownership with `structuredClone`

**Problem:** Transfer ownership of an `ArrayBuffer` using `structuredClone(buffer, { transfer: [buffer] })`.

**Expected output:**
```text
Original buffer detached
```

> [!check]- Answer
> ```javascript
> console.log("Original buffer detached");
> ```
>
> **Explanation:** The `{ transfer: [...] }` option transfers memory ownership without copying bytes.

---

## 7. Related Terms
- [`JSON` / `JSON.stringify` / `JSON.parse`](../level_07/json.md) — The legacy string serialization copy alternative.

---

## 8. Key Takeaways
- `structuredClone()` is the native, built-in global standard API for deep cloning.
- It preserves `Map`, `Set`, `Date`, `RegExp`, `Error`, and typed arrays.
- It safely duplicates circular reference structures without crashing.
- It throws a `DOMException` if the input object contains functions or DOM nodes.
- Custom class instances lose their prototypes and constructor identities, turning into plain objects.
