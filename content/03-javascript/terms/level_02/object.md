# Object

> **Level 2 — Control Flow & Data Structures**
> A collection of key-value pairs representing properties and methods.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
- [Primitive Types](../level_01/primitive_types.md) — Basic immutable data types.

---

## 2. Term Category

**Data Structure (Universal: Works everywhere)**: Object is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While Primitives (like Strings and Numbers) are great for storing single values, real-world entities are complex. A "User" isn't just a string; a User has a name, an age, an email, and an active status. 

Instead of creating four separate variables (`userName`, `userAge`, `userEmail`, `userStatus`), JavaScript provides Objects. Objects allow you to group related data and functionality together into a single, cohesive package using a system of "key-value pairs." Almost everything in JavaScript that is not a Primitive is an Object (including Arrays and Functions).

### (2) Reality Metaphor
An Object is like a physical dictionary. The whole book is the Object. 
- The words you look up are the **Keys** (or property names). 
- The definitions you read are the **Values**. 
If you want to know what "Apple" means, you flip to the key "Apple" and read the associated value.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Creating an object literal using curly braces {}
const user = {
  name: "Alice",     // Key: 'name', Value: "Alice"
  age: 28,           // Key: 'age', Value: 28
  isAdmin: true      // Key: 'isAdmin', Value: true
};

// Accessing data using "dot notation"
console.log(user.name); // "Alice"
```

#### Fuller Example
```javascript
const spaceship = {
  name: "Apollo",
  crewSize: 3,
  "registration-number": "N-1701", // Keys with hyphens MUST be strings
};

// 1. Dot Notation (Most common)
spaceship.crewSize = 4; // Updating a value

// 2. Bracket Notation (Required for variables or invalid identifier names)
const keyIWant = "name";
console.log(spaceship[keyIWant]); // "Apollo"
console.log(spaceship["registration-number"]); // "N-1701"

// Adding a new property dynamically
spaceship.isReadyForLaunch = true;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Dot Notation with Bracket Notation

**The mistake:** Trying to use a variable with dot notation.

**Why it's wrong:** When you use `object.key`, JavaScript literally looks for a property named the exact string `"key"`. If you have a variable `let myVar = "age";` and you do `user.myVar`, it looks for the property `"myVar"`, not `"age"`. To evaluate a variable, you MUST use bracket notation `user[myVar]`.

*Incorrect:*
```javascript
const person = { age: 30 };
const propertyToFind = "age";

console.log(person.propertyToFind); // undefined! Looks for literally "propertyToFind"
```

*Fix:*
```javascript
const person = { age: 30 };
const propertyToFind = "age";

console.log(person[propertyToFind]); // 30 (Evaluates variable, looks up "age")
```

---

### Mistake 2: Losing Context Binding (`this`) in Object Callbacks

**The mistake:** Passing methods from Object instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "object",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "object",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Object Operations

**The mistake:** Executing asynchronous operations within Object without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/object"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/object");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in object: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: User Account Profile Manager

**Scenario:** A user management system creates, updates, and inspects user profile objects containing nested address properties using object literal syntax {}.

**Requirements:**
1. Write createUserProfile(id, email, options).
2. Construct object literal with id, email, and nested options.
3. Return created object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createUserProfile(id, email, options = {}) {
>   const profile = {
>     id: id,
>     email: email,
>     role: options.role || "USER",
>     settings: {
>       theme: options.theme || "light",
>       notifications: Boolean(options.notifications)
>     }
>   };
>   return profile;
> }
>
> // Verification tests
> const p = createUserProfile(101, "alice@example.com", { role: "ADMIN", notifications: true });
> console.assert(p.id === 101 && p.role === "ADMIN", "Test 1 Failed");
> console.assert(p.settings.notifications === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Object Literal Syntax**: Objects are created using curly brace literals {} containing key: value property pairs.
> 2. **Key Representation**: Object property keys are strings or symbols mapping to any valid JavaScript value.
> 3. **Heap Reference Memory**: Objects are stored in heap memory and accessed via reference variables.
> 
---

### Exercise 2: Shallow Copy & Default Configuration Merger

**Scenario:** A service initializer merges user options with default configuration objects using Object.assign() and object spread syntax { ...defaults, ...options }.

**Requirements:**
1. Write mergeServiceOptions(defaultOpts, userOpts).
2. Merge defaultOpts and userOpts into a new object.
3. Ensure user values override default values.
4. Return merged object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function mergeServiceOptions(defaultOpts, userOpts) {
>   // Merging options using object spread
>   const merged = { ...defaultOpts, ...userOpts };
>   return merged;
> }
>
> // Verification tests
> const defaults = { port: 8080, host: "localhost", timeout: 5000 };
> const user = { port: 3000 };
> const result = mergeServiceOptions(defaults, user);
> console.assert(result.port === 3000, "Test 1 Failed: User option should override default");
> console.assert(result.host === "localhost", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Object Spread Operator**: Expression { ...a, ...b } shallow-copies properties, with later properties overriding earlier ones.
> 2. **Object.assign() Equivalent**: Object.assign({}, a, b) performs identical shallow property copies into a target object.
> 3. **Shallow Copy Limitations**: Nested objects inside merged objects retain their original reference addresses.
> 
---

### Exercise 3: Locked Registry Key Inspector & Freezing

**Scenario:** A security registry inspects object keys using Object.keys() and locks the object using Object.freeze() to prevent property modification.

**Requirements:**
1. Write createLockedRegistry(initialData).
2. Inspect keys using Object.keys().
3. Freeze registry object using Object.freeze().
4. Return object { registry, keysCount, isFrozen }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createLockedRegistry(initialData) {
>   const registry = Object.assign({}, initialData);
>   const keysCount = Object.keys(registry).length;
>   Object.freeze(registry);
>
>   return {
>     registry,
>     keysCount,
>     isFrozen: Object.isFrozen(registry)
>   };
> }
>
> // Verification tests
> const res = createLockedRegistry({ env: "production", version: "1.0.0" });
> console.assert(res.keysCount === 2, "Test 1 Failed");
> console.assert(res.isFrozen === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Object.keys() Utility**: Returns an array of an object's own enumerable string property names.
> 2. **Object.freeze() Mechanics**: Prevents adding, deleting, or mutating properties on an object.
> 3. **Object.isFrozen() Validation**: Returns boolean indicating whether an object has been frozen.
---

## 6. Related Terms
- [Property](property.md) — An association between a key and a value in an object.
- [Method](method.md) — A function that is stored as a property of an object.
- [Array](array.md) — A specialized list-like object.
- [for...in](../level_04/for_in.md) — Related concept: for...in.
- [Map](../level_08/map.md) — Related concept: Map.
- [Prototype Chain](../level_07/prototype_chain.md) — Related concept: Prototype Chain.
- [this Keyword](../level_07/this_keyword.md) — Related concept: this Keyword.
- [Destructuring](../level_08/destructuring.md) — Related concept: Destructuring.
- [Garbage Collection](../level_09/garbage_collection.md) — Related concept: Garbage Collection.
- [Proxy](../level_09/proxy.md) — Related concept: Proxy.
- [Property Access (dot vs bracket notation)](property_access.md) — Dot vs bracket notation.
- [Prototype](../level_07/prototype.md) — Prototype chain.

---

## 7. Key Takeaways
- Objects are collections of key-value pairs enclosed in `{}`.
- Use **Dot Notation** (`user.name`) when you know the exact name of the property.
- Use **Bracket Notation** (`user["name"]` or `user[variable]`) when the property name contains special characters, or when you are using a variable to find the key.
