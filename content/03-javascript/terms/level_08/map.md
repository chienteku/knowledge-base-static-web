# Map

> **Level 8 — Modern JavaScript (ES6+)**
> A collection of keyed data items that allows keys of any type (unlike plain Objects).

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The traditional key-value structure `Map` improves upon.
- [Array](../level_02/array.md) — Maps are Iterable, just like Arrays.

---

## 2. Term Category

**Data Structure *(Introduced in ES6)* (Universal)**: Map is a fundamental concept in this technology stack. **Level 8 — Modern JavaScript (ES6+)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
For 20 years, JavaScript developers used plain Objects (`{}`) to store key-value data (like a dictionary). However, Objects have severe limitations:
1. Object keys can **only be Strings or Symbols**. If you try to use a Number or another Object as a key, JS secretly converts it to the string `"[object Object]"`.
2. Objects don't know how big they are (you have to use `Object.keys(obj).length`).
3. Objects are not easily iterable.

ES6 introduced the **Map** data structure to be the ultimate, professional-grade dictionary. A Map allows *anything* to be a key (even another object or a function!). It remembers the exact order you inserted items, it has a built-in `.size` property, and it is perfectly designed to be used with `for...of` loops.

### (2) Reality Metaphor
A standard Object is like a cheap filing cabinet. You can only put sticky notes (Strings) on the folders to identify them. If you try to tape a coffee mug to the folder as a label, it falls off.
A Map is a high-tech locker system. It allows you to use *anything* as the key to open the locker. You can use a password (String), a fingerprint (Object), or a physical keycard (Function). It is perfectly secure and keeps an exact count of how many lockers are full.

### (3) JavaScript Code Examples

#### Short Snippet: Basic Map Usage
```javascript
// We must use 'new' to create a Map
const userRoles = new Map();

// We use .set(key, value) to add data
userRoles.set("Alice", "Admin");
userRoles.set("Bob", "Guest");

// We use .get(key) to retrieve data
console.log(userRoles.get("Alice")); // "Admin"

// We use .has(key) to check if a key exists
console.log(userRoles.has("Charlie")); // false

// Built-in size property!
console.log(userRoles.size); // 2
```

#### Fuller Example: Objects as Keys!
```javascript
// Imagine we fetch User objects from a database
const user1 = { id: 101, name: "Alice" };
const user2 = { id: 102, name: "Bob" };

// We want to attach "login timestamps" to these users, 
// but we don't want to modify the actual user objects!

const loginTracker = new Map();

// We use the ACTUAL OBJECT as the key!
loginTracker.set(user1, "Tuesday, 8:00 AM");
loginTracker.set(user2, "Tuesday, 9:15 AM");

// We can retrieve the timestamp by passing the exact object back!
console.log(loginTracker.get(user1)); // "Tuesday, 8:00 AM"

// Maps are fully iterable!
for (const [userObj, time] of loginTracker) {
  console.log(`${userObj.name} logged in at ${time}`);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Map Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Map blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "map";
```

*Fix:*
```javascript
let value = "map";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Map Callbacks

**The mistake:** Passing methods from Map instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "map",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "map",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Map Operations

**The mistake:** Executing asynchronous operations within Map without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/map"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/map");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in map: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Arbitrary Key Cache Registry with Map

**Scenario:** An APM performance profiler uses a Map instance to associate performance metric data directly with object and function keys.

**Requirements:**
1. Write createProfilerMap().
2. Use map.set(key, val) with object keys.
3. Use map.get(key) and map.has(key).
4. Return lookup results.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createProfilerMap() {
>   const map = new Map();
>   const targetObj = { id: "service-a" };
>
>   map.set(targetObj, { executionTimeMs: 45 });
>
>   return {
>     hasTarget: map.has(targetObj),
>     metrics: map.get(targetObj)
>   };
> }
>
> // Verification tests
> const res = createProfilerMap();
> console.assert(res.hasTarget === true, "Test 1 Failed");
> console.assert(res.metrics.executionTimeMs === 45, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Map Key Flexibility**: Map instances accept keys of ANY data type, including objects, functions, and primitives.
> 2. **Key-Value Operations**: Provides fast built-in methods: .set(key, val), .get(key), .has(key), .delete(key), .clear().
> 3. **Insertion Order Preservation**: Map iterates entries in exact key insertion order.
> 
---

### Exercise 2: Map Advanced Context Handler

**Scenario:** A web application component processes map data operations within enterprise workflows.

**Requirements:**
1. Write handleMapSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleMapSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleMapSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Map Architecture**: Applying map patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Map Performance Optimization

**Scenario:** An application utility optimizes map execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeMapTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeMapTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeMapTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Map Optimization**: Optimizing map improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Set](set.md) — The sister data structure to Map (stores unique values without keys).
- [Object](../level_02/object.md) — The older structure that Maps often replace for complex dictionaries.
- [filter()](../level_04/filter.md) — Related concept: filter().
- [flat / flatMap](../level_04/flat_flatmap.md) — Related concept: flat / flatMap.
- [forEach()](../level_04/for_each.md) — Related concept: forEach().
- [reduce()](../level_04/reduce.md) — Related concept: reduce().

---

## 7. Key Takeaways
- A Map is a modern data structure for storing Key-Value pairs.
- Unlike Objects, Map keys can be of ANY data type (including Arrays, Functions, and other Objects).
- You must use `.set(key, value)`, `.get(key)`, and `.has(key)` to interact with it.
- Maps maintain their insertion order and have a convenient `.size` property.
- Maps are natively iterable with `for...of` loops.
```
