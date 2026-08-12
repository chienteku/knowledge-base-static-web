# hasOwnProperty / Object.getPrototypeOf

> **Level 7 — Objects & Prototypes**
> Distinguish own vs inherited properties.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.
- [Prototype Chain](prototype_chain.md) — The linked series of prototypes resolving property searches.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: hasOwnProperty / Object.getPrototypeOf is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Because JavaScript uses prototypal inheritance, reading a property on an object (e.g. `obj.name`) checks both the object itself and all of its ancestors in the prototype chain. While this inheritance is powerful, it creates challenges when we want to serialize data, count keys, or loop over properties. For example, a `for...in` loop traverses both own and inherited properties, which can introduce unexpected parent traits into your child algorithms.

To differentiate between own and inherited features, JavaScript implements specialized methods:
- **`obj.hasOwnProperty(key)` / `Object.hasOwn(obj, key)`:** Returns `true` if the property exists directly on the object itself as an **own property**, and `false` if the property is inherited from the prototype chain (or doesn't exist). `Object.hasOwn` is the modern ES2022 standard which is preferred because it works safely even on objects created with a null prototype.
- **`Object.getPrototypeOf(obj)`:** Returns the direct parent prototype object (`[[Prototype]]`) of the specified target. This is the official, standard getter to inspect prototypes, replacing the legacy and deprecated `__proto__` property getter.

### (2) Reality Metaphor
Imagine a family workshop.
- An **own property** is a tool that you bought yourself and own inside your personal toolkit box (e.g., a modern electric screwdriver).
- An **inherited property** is a tool owned by your grandfather, sitting on a high shelf in the back garage (e.g., an old iron hammer). You can reach and use it whenever you want because it is in the family workspace (the prototype chain), but it doesn't belong to your personal toolbox.
- **`Object.hasOwn(you, "hammer")`** asks: "Is the hammer in *your* personal toolbox?" (Returns `false`).
- **`Object.getPrototypeOf(you)`** is checking your family records to find the official name of your father.

### (3) JavaScript Code Examples

#### Own vs Inherited Properties
```javascript
const grandparent = { surname: "Hamilton" };
const parent = Object.create(grandparent);
parent.hometown = "Boston";

// parent has hometown (own) and surname (inherited)
console.log(Object.hasOwn(parent, "hometown")); // true
console.log(Object.hasOwn(parent, "surname"));  // false (inherited!)

// Inspecting prototypes
const proto = Object.getPrototypeOf(parent);
console.log(proto === grandparent); // true
```

#### Safe Loop Filter Example
```javascript
const defaults = { format: "HD", volume: 50 };
const userConfig = Object.create(defaults);
userConfig.volume = 90; // Overrides volume (own property)

console.log("--- Loop including prototype keys (for...in) ---");
for (const key in userConfig) {
  // prints both own and inherited properties!
  console.log(`${key}: ${userConfig[key]}`); 
}
// Logs:
// volume: 90
// format: HD

console.log("\n--- Loop filtering own keys only (hasOwn) ---");
for (const key in userConfig) {
  // Filter out inherited prototype keys
  if (Object.hasOwn(userConfig, key)) { 
    console.log(`${key}: ${userConfig[key]}`);
  }
}
// Logs:
// volume: 90
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Reading prototypes using the deprecated `__proto__` getter

**The mistake:** Using `obj.__proto__` to inspect or write an object's prototype.

**Why it's wrong:** The `__proto__` property was a non-standard browser extension that was only added to the official ES6 spec for compatibility reasons. Using it in modern code causes performance penalties because it interferes with engine optimization paths. Always use standard static methods.

*Incorrect:*
```javascript
const parent = myObj.__proto__; // Deprecated and slow!
```

*Fix:*
```javascript
const parent = Object.getPrototypeOf(myObj); // Standard and optimized
```

### Mistake 2: Calling `obj.hasOwnProperty()` directly on unsafe objects

**The mistake:** Calling `obj.hasOwnProperty("key")` on untrusted objects (like parsed JSON payloads or objects created with `Object.create(null)`).

**Why it's wrong:** If the object has a null prototype, it lacks the method, causing a crash. Similarly, if an attacker provides a malicious payload containing the key `"hasOwnProperty": true`, calling the method directly will execute the attacker's value instead of the native function.

*Incorrect:*
```javascript
const data = Object.create(null);
data.hasOwnProperty("id"); // TypeError: data.hasOwnProperty is not a function
```

*Fix:*
```javascript
const data = Object.create(null);

// Use the ES2022 static wrapper:
Object.hasOwn(data, "id"); // false (Safe!)
```

---

### Mistake 3: Unhandled Asynchronous Failures in Hasownproperty Getprototypeof Operations

**The mistake:** Executing asynchronous operations within Hasownproperty Getprototypeof without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/hasownproperty_getprototypeof"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/hasownproperty_getprototypeof");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in hasownproperty_getprototypeof: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Safe Own Property Guard with Object.hasOwn()

**Scenario:** A JSON serializer checks whether an object property is an own property using Object.hasOwn() and inspects its prototype via Object.getPrototypeOf().

**Requirements:**
1. Write inspectObjectStructure(obj, key).
2. Use Object.hasOwn(obj, key) to verify own property.
3. Use Object.getPrototypeOf(obj) to inspect prototype.
4. Return inspection report.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function inspectObjectStructure(obj, key) {
>   if (!obj || typeof obj !== "object") return null;
>
>   const isOwn = Object.hasOwn(obj, key);
>   const proto = Object.getPrototypeOf(obj);
>
>   return {
>     isOwn,
>     hasPrototype: proto !== null
>   };
> }
>
> // Verification tests
> const parent = { inherited: true };
> const child = Object.create(parent);
> child.own = "data";
>
> const report = inspectObjectStructure(child, "own");
> console.assert(report.isOwn === true, "Test 1 Failed");
> console.assert(inspectObjectStructure(child, "inherited").isOwn === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Object.hasOwn() Standard**: Object.hasOwn(obj, key) is the modern replacement for obj.hasOwnProperty(key), working safely on objects created with Object.create(null).
> 2. **Object.getPrototypeOf()**: Object.getPrototypeOf(obj) retrieves the [[Prototype]] internal property of an object.
> 3. **Prototype Chain Boundary**: Returns null when reaching the end of the prototype chain (Object.prototype.__proto__).
> 
---

### Exercise 2: Hasownproperty Getprototypeof Advanced Context Handler

**Scenario:** A web application component processes hasownproperty getprototypeof data operations within enterprise workflows.

**Requirements:**
1. Write handleHasownpropertyGetprototypeofSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleHasownpropertyGetprototypeofSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleHasownpropertyGetprototypeofSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Hasownproperty Getprototypeof Architecture**: Applying hasownproperty getprototypeof patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Hasownproperty Getprototypeof Performance Optimization

**Scenario:** An application utility optimizes hasownproperty getprototypeof execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeHasownpropertyGetprototypeofTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeHasownpropertyGetprototypeofTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeHasownpropertyGetprototypeofTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Hasownproperty Getprototypeof Optimization**: Optimizing hasownproperty getprototypeof improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [for...in](../level_04/for_in.md) — The loop statement that traverses both own and inherited properties.
- [Prototypal Inheritance](prototypal_inheritance.md) — The inheritance mechanism that creates the distinction between own and inherited keys.

---

## 7. Key Takeaways
- Own properties are declared directly on the object; inherited properties are resolved via the Prototype Chain.
- `for...in` loops walk the entire prototype chain; use `Object.hasOwn()` to filter out inherited parent properties.
- `Object.hasOwn(obj, key)` (ES2022) is the standard, safe replacement for the legacy `obj.hasOwnProperty()` method.
- `Object.getPrototypeOf(obj)` retrieves the prototype of an object; avoid using the deprecated `__proto__` getter.
