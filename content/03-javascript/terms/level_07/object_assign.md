# Object.assign

> **Level 7 — Objects & Prototypes**
> Copy own enumerable props into a target object.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.
- [Reference vs Value (copy semantics)](reference_vs_value.md) — Reference vs value storage.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Object.assign is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In web development, we often need to merge objects together—such as combining a default configuration object with custom user overrides, or batch-updating a profile object with modifications. 

Before ES6, developers had to write custom loops to copy keys one-by-one. To simplify this, the TC39 committee standard library built **`Object.assign(target, ...sources)`**:
- It copies all **own enumerable properties** (properties directly declared on the object, not inherited from prototypes) from one or more source objects into a designated `target` object.
- It returns the modified `target` object.
- **Side Effect Warning:** The target object is modified **in-place**. To copy properties without mutating original objects, you must pass a fresh, empty object `{}` as the target first argument.
- **Shallow Copy Warning:** Just like spread syntax (`...`), `Object.assign` performs a **shallow copy**. Nested objects are copied by reference pointer.

### (2) Reality Metaphor
Imagine a shipping cardboard box.
- The **`target`** object is the main shipping box.
- The **`sources`** objects are secondary envelopes.
- **`Object.assign`** is the act of peeling shipping label stickers off the envelopes and sticking them onto the main shipping box. 
- If a sticker from a source envelope has the exact same name as a sticker already on the box, the new sticker is stuck directly on top, **overwriting** the old value.
- If you use an existing box as the target, that box is permanently modified. If you want to keep your boxes clean, you fetch a brand-new box (**`{}`**) from the lobby, stick all labels onto it, and leave the old boxes untouched.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const defaults = { theme: "light", volume: 50 };
const overrides = { volume: 80 };

// Create a merged clone without mutating defaults
const config = Object.assign({}, defaults, overrides);

console.log(config);   // { theme: "light", volume: 80 }
console.log(defaults); // { theme: "light", volume: 50 } (Untouched!)
```

#### Fuller Example
```javascript
// Simulating an application state updater using Object.assign
const appState = {
  user: "Alice",
  settings: { notifications: true } // Nested object!
};

function updateState(currentState, updates) {
  // Merge updates into state safely by creating a new target object
  return Object.assign({}, currentState, updates);
}

// 1. Successful merging of top-level keys
const nextState = updateState(appState, { user: "Bob", version: 1.2 });
console.log("Next state user:", nextState.user); // "Bob"
console.log("Original state user:", appState.user); // "Alice" (Untouched)

// 2. PITFALL: Shallow copy nested mutations
const mutatedState = updateState(appState, { user: "Charlie" });
// Modifying nested settings inside mutatedState:
mutatedState.settings.notifications = false;

// Check the original state settings:
console.log("Original notifications:", appState.settings.notifications); 
// false! (The nested settings object was copied by reference pointer!)
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accidentally Mutating the First Parameter (Target)

**The mistake:** Omitting the empty object `{}` as the first argument, which permanently mutates the source configuration defaults.

**Why it's wrong:** The first argument is the target object. It gets modified in-place and returned.

*Incorrect:*
```javascript
const defaults = { host: "localhost" };
const userConfig = { host: "127.0.0.1" };

// defaults is mutated directly!
const finalConfig = Object.assign(defaults, userConfig); 

console.log(defaults.host); // "127.0.0.1" (Defaults has been modified!)
```

*Fix:*
```javascript
const defaults = { host: "localhost" };
const userConfig = { host: "127.0.0.1" };

// Pass {} as the target to keep defaults clean
const finalConfig = Object.assign({}, defaults, userConfig); 

console.log(defaults.host); // "localhost" (Safe!)
```

---

### Mistake 2: Losing Context Binding (`this`) in Object Assign Callbacks

**The mistake:** Passing methods from Object Assign instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "object_assign",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "object_assign",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Object Assign Operations

**The mistake:** Executing asynchronous operations within Object Assign without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/object_assign"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/object_assign");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in object_assign: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Shallow Object Merging & Default Config Overrides

**Scenario:** A application configuration loader merges default options with user-provided overrides using Object.assign().

**Requirements:**
1. Write mergeConfig(defaultOpts, userOpts).
2. Use Object.assign({}, defaultOpts, userOpts).
3. Return merged config object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function mergeConfig(defaultOpts, userOpts) {
>   const defaults = { host: "localhost", port: 8080, debug: false };
>   return Object.assign({}, defaults, defaultOpts, userOpts);
> }
>
> // Verification tests
> const merged = mergeConfig({ port: 3000 }, { debug: true });
> console.assert(merged.host === "localhost", "Test 1 Failed");
> console.assert(merged.port === 3000, "Test 2 Failed");
> console.assert(merged.debug === true, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Object.assign() Purpose**: Object.assign(target, ...sources) copies all own enumerable properties from source objects into target object.
> 2. **Shallow Copy Behavior**: Object.assign() performs shallow copies; nested object references are shared rather than deep cloned.
> 3. **In-Place Target Mutation**: Mutates and returns the target object (first argument).
> 
---

### Exercise 2: Object Assign Advanced Context Handler

**Scenario:** A web application component processes object assign data operations within enterprise workflows.

**Requirements:**
1. Write handleObjectAssignSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleObjectAssignSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleObjectAssignSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Object Assign Architecture**: Applying object assign patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Object Assign Performance Optimization

**Scenario:** An application utility optimizes object assign execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeObjectAssignTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeObjectAssignTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeObjectAssignTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Object Assign Optimization**: Optimizing object assign improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Shallow Copy vs Deep Copy](shallow_vs_deep_copy.md) — The copy behaviors defining reference replication.
- [Spread Syntax (...)](../level_08/spread_syntax.md) — The modern, alternative syntax used to copy and merge objects.

---

## 7. Key Takeaways
- `Object.assign(target, ...sources)` copies all own enumerable properties from sources into the target object.
- The target object is modified in-place.
- To prevent mutating original objects, always pass an empty object `{}` as the first parameter.
- Properties from source objects later in the argument list overwrite properties with the same keys from objects earlier in the list.
- `Object.assign` performs a shallow copy; nested objects are copied by reference pointer.
