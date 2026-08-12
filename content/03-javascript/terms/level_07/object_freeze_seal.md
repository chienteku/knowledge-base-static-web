# Object.freeze / Object.seal

> **Level 7 — Objects & Prototypes**
> Make objects immutable / non-extensible.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Object.freeze / Object.seal is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, JavaScript objects are open and mutable: any script running on the page can add new properties, delete existing properties, or modify values. However, when defining application configurations, constant lookup dictionaries, or state structures, you need to guarantee that this data cannot be modified or corrupted.

To protect objects, the language provides two static security methods:

#### `Object.freeze(obj)`
Provides the highest level of protection, making the object completely **immutable**:
- Prevents adding new properties.
- Prevents deleting existing properties.
- Prevents changing the values of existing properties.
- Prevents changing property descriptors (configurable, writable).
- **Result:** The object becomes read-only.

#### `Object.seal(obj)`
Provides a medium level of protection, locking down the structure of the object:
- Prevents adding new properties.
- Prevents deleting existing properties.
- **However, you CAN modify the values of existing properties** (provided they are writable).

*Note on Error Behavior:* Attempting to modify a frozen or sealed object fails silently in non-strict mode. However, in **Strict Mode** (`"use strict"`), the engine throws a `TypeError` immediately.

### (2) Critical Limit: Shallow Protection
Just like copying, `Object.freeze()` and `Object.seal()` only protect **top-level properties**. If the frozen object contains a nested object or array, the properties of that nested structure can still be modified normally.

### (3) Reality Metaphor
- **`Object.freeze`** is like carving a contract onto a **solid block of stone**. Once carved, you cannot write new letters, erase existing lines, or change any of the text. It is locked forever.
- **`Object.seal`** is like placing a printed form inside a **sealed glass container**. You cannot add new pages, and you cannot tear any pages out. However, if the pages inside have erasable marker blanks (existing writable properties), you can reach through a small slot to wipe away a number and write a new value in its place.

### (4) JavaScript Code Examples

#### Standard `Object.freeze` (Strict Mode)
```javascript
"use strict"; // Enable strict mode to throw errors on violations

const appConfig = {
  apiEndpoint: "https://api.example.com",
  timeout: 5000
};

// 1. Freeze the configuration object
Object.freeze(appConfig);

console.log("Is frozen?", Object.isFrozen(appConfig)); // true

// 2. Attempt violations:
// appConfig.timeout = 10000; // TypeError: Cannot assign to read only property 'timeout'
// appConfig.version = 1.0;   // TypeError: Cannot add property version, object is not extensible
// delete appConfig.timeout;  // TypeError: Cannot delete property 'timeout'
```

#### Standard `Object.seal`
```javascript
const userProfile = {
  username: "Brendan",
  role: "guest"
};

// 1. Seal the profile
Object.seal(userProfile);

console.log("Is sealed?", Object.isSealed(userProfile)); // true

// 2. Values CAN be updated
userProfile.role = "admin";
console.log(userProfile.role); // "admin" (Modification allowed!)

// 3. Structural additions fail (silently in non-strict mode)
userProfile.age = 50; 
console.log(userProfile.age); // undefined (Addition blocked!)
```

#### The Shallow Freeze Pitfall
```javascript
const user = {
  name: "Alice",
  details: { role: "user" } // Nested object!
};

Object.freeze(user);

// Modifying nested object properties is STILL allowed:
user.details.role = "admin"; 
console.log(user.details.role); // "admin" (Mutated despite freeze!)
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing `const` with `Object.freeze`

**The mistake:** Believing that declaring an object with `const` protects its properties from modification.

**Why it's wrong:** `const` only prevents the variable *binding* from being reassigned to a new value (i.e. you cannot do `myConst = {}`). However, the object itself remains fully mutable; you can change, add, or delete its properties at will. To make the object's properties immutable, you must call `Object.freeze()`.

*Incorrect:*
```javascript
const myConfig = { host: "localhost" };
myConfig.host = "remote"; // Fully allowed! const does not freeze objects!
```

*Fix:*
```javascript
const myConfig = Object.freeze({ host: "localhost" });
// myConfig.host = "remote"; // Blocks modification!
```

---

### Mistake 2: Losing Context Binding (`this`) in Object Freeze Seal Callbacks

**The mistake:** Passing methods from Object Freeze Seal instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "object_freeze_seal",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "object_freeze_seal",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Object Freeze Seal Operations

**The mistake:** Executing asynchronous operations within Object Freeze Seal without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/object_freeze_seal"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/object_freeze_seal");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in object_freeze_seal: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Immutable Configuration Singleton via Object.freeze()

**Scenario:** A system configuration module freezes config constants using Object.freeze() to prevent property mutation, addition, or deletion.

**Requirements:**
1. Write createFrozenConfig(configData).
2. Freeze object with Object.freeze().
3. Verify Object.isFrozen() is true and mutations throw or fail.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createFrozenConfig(configData) {
>   const config = Object.assign({}, configData);
>   return Object.freeze(config);
> }
>
> // Verification tests
> const cfg = createFrozenConfig({ env: "production", version: 1.0 });
> console.assert(Object.isFrozen(cfg) === true, "Test 1 Failed");
>
> try {
>   // @ts-ignore
>   cfg.env = "staging";
> } catch (e) {}
> console.assert(cfg.env === "production", "Test 2 Failed: Mutation occurred on frozen object");
> ```
>
> #### Technical Explanation
>
> 1. **Object.freeze() Immunity**: Object.freeze() prevents adding, deleting, or reassigning own properties of an object.
> 2. **Object.seal() Contrast**: Object.seal() prevents adding/deleting properties, but permits reassigning existing writable properties.
> 3. **Shallow Freezing**: Object.freeze() is shallow; nested objects remain mutable unless recursively frozen.
> 
---

### Exercise 2: Object Freeze Seal Advanced Context Handler

**Scenario:** A web application component processes object freeze seal data operations within enterprise workflows.

**Requirements:**
1. Write handleObjectFreezeSealSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleObjectFreezeSealSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleObjectFreezeSealSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Object Freeze Seal Architecture**: Applying object freeze seal patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Object Freeze Seal Performance Optimization

**Scenario:** An application utility optimizes object freeze seal execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeObjectFreezeSealTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeObjectFreezeSealTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeObjectFreezeSealTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Object Freeze Seal Optimization**: Optimizing object freeze seal improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Immutability](../level_09/immutability.md) — The design philosophy of preventing data mutation.
- [const](../level_01/const.md) — The variable binding keyword that prevents variable reassignment.

---

## 7. Key Takeaways
- `Object.freeze(obj)` makes an object read-only: properties cannot be added, deleted, or updated.
- `Object.seal(obj)` prevents adding or deleting properties, but permits modifying existing writable properties.
- Both methods operate **shallowly**—nested objects inside frozen or sealed objects remain mutable.
- In strict mode (`"use strict"`), any attempt to modify frozen or sealed objects throws a `TypeError`.
- `const` protects variable reference reassignments; `Object.freeze()` protects object property mutations.
