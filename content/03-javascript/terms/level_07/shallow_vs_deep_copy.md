# Shallow Copy vs Deep Copy

> **Level 7 — Objects & Prototypes**
> Copying top-level vs fully nested structures.

---

## 1. Prerequisites
- [Reference vs Value (copy semantics)](./reference_vs_value.md) — The nature of memory storage pointers.
- [Object](../level_02/object.md) — The base data structure.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Since standard assignments (`let copy = original`) copy only reference pointers, developers need ways to create genuine duplicates of objects to avoid mutating original state (highly critical in frameworks like React). However, objects often contain nested arrays or other objects. 

To duplicate objects, we must choose between two copy semantics:

#### Shallow Copy
A shallow copy duplicates **only the top-level properties** of the object. If the object contains nested objects or arrays, the shallow copy copies their *reference pointers*. Therefore, the copy and the original share the same nested structures.
- **Methods:** Spread syntax (`const copy = { ...original }`) or `Object.assign({}, original)`.

#### Deep Copy
A deep copy recursively traverses the entire object tree and duplicates **every nested object and array** at every level, creating a completely independent data clone. Modifying any nested element in the copy has no effect on the original.
- **Methods:** `JSON.parse(JSON.stringify(original))` (legacy helper) or the modern built-in **`structuredClone(original)`** Web API (supported globally in Node.js 17+ and modern browsers).

### (2) Reality Metaphor
Imagine a house blueprint.
- **Shallow Copy** is like copying the blueprint page. You change the front door color (top-level property) on the copy. But the blueprint has a drawing label pointing to a "Community Swimming Pool" down the street (nested object reference). If you draw a slide on the pool drawing, the physical shared pool changes for both blueprints.
- **Deep Copy** is like building a completely new replica house in a different town, including a brand new replica swimming pool. Drawing a slide on the new pool has no effect on the original community pool.

### (3) JavaScript Code Examples

#### Shallow Copy Nesting Bug
```javascript
const userA = {
  name: "Alice",
  details: { age: 25 } // Nested object!
};

// 1. Create a shallow copy using spread syntax
const userB = { ...userA };

userB.name = "Bob"; // Modify top level
userB.details.age = 30; // Modify nested level

console.log(userA.name);        // "Alice" (Top-level copy worked!)
console.log(userA.details.age); // 30! (Nested object was shared by reference!)
```

#### Deep Copy Solution (Modern `structuredClone`)
```javascript
const userA = {
  name: "Alice",
  details: { age: 25 }
};

// 2. Create a true deep copy using structuredClone
const userB = structuredClone(userA);

userB.name = "Bob";
userB.details.age = 30;

console.log(userA.name);        // "Alice" (Untouched)
console.log(userA.details.age); // 25 (Untouched! Nested object was duplicated)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on Spread Syntax `...` for Deep Nesting (e.g. state updates)

**The mistake:** Using `{ ...state }` in React or state managers, and modifying nested fields directly.

**Why it's wrong:** Spread syntax is strictly a shallow copy. Modifying nested properties directly mutates the original parent state, which breaks component state tracking.

*Incorrect:*
```javascript
const state = { list: ["taskA", "taskB"], user: "Admin" };
const copy = { ...state };
copy.list.push("taskC"); // Mutates state.list!
```

*Fix:*
```javascript
const state = { list: ["taskA", "taskB"], user: "Admin" };
// Option A: Spread at every nested level
const copy1 = { ...state, list: [...state.list] }; 

// Option B: Deep clone
const copy2 = structuredClone(state); 
```

### Mistake 2: Losing Context Binding (`this`) in Shallow Vs Deep Copy Callbacks

**The mistake:** Passing methods from Shallow Vs Deep Copy instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "shallow_vs_deep_copy",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "shallow_vs_deep_copy",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Shallow Vs Deep Copy Operations

**The mistake:** Executing asynchronous operations within Shallow Vs Deep Copy without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/shallow_vs_deep_copy"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/shallow_vs_deep_copy");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in shallow_vs_deep_copy: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Copy Investigator

**Problem:** Complete the code to make a deep copy of `databaseConfig` using modern APIs, modify a nested database port key, and log both ports.

```javascript
const databaseConfig = {
  host: "localhost",
  settings: { port: 5432 }
};

// Make deep copy
const configCopy = // Write deep copy code
configCopy.settings.port = 8080;

console.log("Original Port:", databaseConfig.settings.port);
console.log("Copy Port:", configCopy.settings.port);
```

**Expected output:**
```text
Original Port: 5432
Copy Port: 8080
```

> [!check]- Answer
> - Call `structuredClone(databaseConfig)` to duplicate the config.

---

### Exercise 2: Deep Copying with `structuredClone`

**Problem:** Perform a deep copy of `{ a: [1, 2] }` using `structuredClone()`.

**Expected output:**
```text
Original array length: 2, Copy array length: 3
```

> [!check]- Answer
> ```javascript
> const orig = { a: [1, 2] };
> const copy = structuredClone(orig);
> copy.a.push(3);
> console.log(`Original array length: ${orig.a.length}, Copy array length: ${copy.a.length}`);
> ```
>
> **Explanation:** `structuredClone` recursively clones nested objects and arrays into fresh memory allocations.

### Exercise 3: JSON Serialization Deep Copy Limitations

**Problem:** Explain why `JSON.parse(JSON.stringify(obj))` drops Functions, Symbols, and `undefined` properties.

**Expected output:**
```text
JSON drops functions, undefined, and symbols
```

> [!check]- Answer
> ```javascript
> console.log("JSON drops functions, undefined, and symbols");
> ```
>
> **Explanation:** JSON format does not support non-serializable JavaScript types like functions or symbols.

---

## 7. Related Terms
- [`Object.assign`](./object_assign.md) — The legacy shallow copy method.
- [`JSON` / `JSON.stringify` / `JSON.parse`](./json.md) — The classic serialization deep copy fallback.
- [Spread Syntax](../level_08/spread_syntax.md) — The modern array/object shallow copy operator.

---

## 8. Key Takeaways
- Shallow copies only copy top-level properties; nested objects/arrays are shared by reference.
- Deep copies duplicate all properties recursively, creating entirely independent objects.
- Spread syntax `...` and `Object.assign` perform shallow copies.
- `structuredClone()` is the modern, built-in standard API for performing deep copies.
- Avoid using `JSON.stringify` serialization on objects containing Dates, functions, or custom class instances, as they will get coerced or deleted.
