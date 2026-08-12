# Proxy

> **Level 9 — Advanced Concepts & Patterns**
> An object used to intercept and define custom behavior for fundamental operations (e.g., property lookup).

---

## 1. Prerequisites
- [Object](../level_02/object.md) — What the Proxy wraps around.
- [Class](../level_07/class.md) — The Proxy is a built-in class.

---

## 2. Term Category

**Design Pattern / Engine Feature *(Introduced in ES6)* (Universal)**: Proxy is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Usually, when you read a property from an object (`obj.name`) or write to it (`obj.age = 30`), the JavaScript engine just does exactly what you ask. But what if you wanted to run a security check *before* allowing someone to change the age? Or what if you wanted to trigger an automatic UI update on the screen the exact millisecond the data changed? 

Before ES6, developers had to write clunky "Getter" and "Setter" methods for every single property they wanted to track. ES6 introduced the **Proxy**. A Proxy is an invisible "wrapper" that you place around an Object. It intercepts *every single interaction* with that object (reading, writing, deleting) and allows you to run custom code (called "Traps") before the action completes. It is the secret magic that powers modern reactive frameworks like Vue 3.

### (2) Reality Metaphor
Imagine a famous Celebrity (the target Object). 
If you want to talk to the Celebrity, you can't just walk up to them. You have to talk to their Manager (the Proxy). 
If you ask the Manager for the Celebrity's phone number (a "Get" Trap), the Manager intercepts the request, runs a security check on you, and decides whether to hand you the number or throw an error. The Celebrity doesn't do anything; the Manager handles all interactions.

### (3) JavaScript Code Examples

#### Short Snippet: A Simple Interceptor
```javascript
const targetObject = {
  message: "Hello World"
};

// We define "Traps" in a Handler object
const handler = {
  // Intercepting READ operations
  get: function(target, property) {
    console.log(`Someone is asking for ${property}!`);
    return target[property]; 
  }
};

// We wrap the Target inside the Proxy
const proxyUser = new Proxy(targetObject, handler);

// Now we interact with the Proxy, NOT the original object!
console.log(proxyUser.message); 
// 1. Prints: "Someone is asking for message!"
// 2. Prints: "Hello World"
```

#### Fuller Example: Data Validation
```javascript
const user = { name: "Alice", age: 25 };

const validatorHandler = {
  // Intercepting WRITE operations
  set: function(target, property, value) {
    if (property === 'age') {
      if (typeof value !== 'number') {
        throw new TypeError('Age must be a number!');
      }
      if (value < 0) {
        throw new RangeError('Age cannot be negative!');
      }
    }
    
    // If it passes validation, we allow the save!
    target[property] = value;
    return true; // The engine requires set traps to return true on success
  }
};

const secureUser = new Proxy(user, validatorHandler);

secureUser.age = 30; // Works perfectly
// secureUser.age = -5; // Crash! RangeError: Age cannot be negative!
// secureUser.age = "thirty"; // Crash! TypeError: Age must be a number!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Proxy Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Proxy blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "proxy";
```

*Fix:*
```javascript
let value = "proxy";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Proxy Callbacks

**The mistake:** Passing methods from Proxy instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "proxy",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "proxy",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Proxy Operations

**The mistake:** Executing asynchronous operations within Proxy without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/proxy"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/proxy");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in proxy: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Defensive Object Access Validation Proxy

**Scenario:** A schema validation library wraps configuration objects inside an ES6 Proxy trap to throw errors on missing or non-existent property access.

**Requirements:**
1. Write createStrictProxy(targetObj).
2. Implement get(target, prop, receiver) handler trap.
3. Throw Error if property does not exist in target.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createStrictProxy(targetObj) {
>   if (typeof targetObj !== "object" || targetObj === null) return targetObj;
>
>   return new Proxy(targetObj, {
>     get(target, prop, receiver) {
>       if (!(prop in target)) {
>         throw new Error(`Property "${String(prop)}" does not exist on target object.`);
>       }
>       return Reflect.get(target, prop, receiver);
>     }
>   });
> }
>
> // Verification tests
> const config = createStrictProxy({ env: "production", port: 8080 });
>
> console.assert(config.env === "production", "Test 1 Failed");
> console.assert(config.port === 8080, "Test 2 Failed");
>
> try {
>   const missing = config.databaseUrl; // Should throw
>   console.assert(false, "Test 3 Failed: Must throw error on missing property");
> } catch (err) {
>   console.assert(err.message.includes("databaseUrl"), "Test 4 Failed");
> }
> ```
>
> #### Technical Explanation
>
> 1. **Proxy Traps Concept**: An ES6 Proxy wraps a target object and intercepts fundamental object operations (get, set, has, deleteProperty).
> 2. **get Trap Interception**: The get(target, prop, receiver) handler intercepts all property access operations.
> 3. **Reflect Interoperability**: Using Reflect.get inside proxy traps ensures proper default behavior and receiver context forwarding.
> 
---

### Exercise 2: Reactive State Observer Proxy

**Scenario:** A reactive UI framework wraps application state in a Proxy to trigger change notifications whenever properties are mutated.

**Requirements:**
1. Write createObservableStore(initialState, onChange).
2. Implement set(target, prop, value, receiver) handler trap.
3. Invoke onChange(prop, value) on change.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createObservableStore(initialState, onChange) {
>   return new Proxy(initialState, {
>     set(target, prop, value, receiver) {
>       const oldValue = target[prop];
>       if (oldValue !== value) {
>         const success = Reflect.set(target, prop, value, receiver);
>         if (success) {
>           onChange(prop, value, oldValue);
>         }
>         return success;
>       }
>       return true;
>     }
>   });
> }
>
> // Verification tests
> let changedProp = null;
> let newValue = null;
>
> const store = createObservableStore({ count: 0 }, (prop, val) => {
>   changedProp = prop;
>   newValue = val;
> });
>
> store.count = 5;
> console.assert(changedProp === "count" && newValue === 5, "Test 1 Failed");
> console.assert(store.count === 5, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **set Trap Interception**: The set(target, prop, value, receiver) trap intercepts property mutation assignments.
> 2. **Strict Mode Trap Return**: Proxy set traps MUST return true to indicate successful assignment; returning false throws TypeError in strict mode.
> 3. **Reactivity Foundation**: Used by modern web frameworks (e.g. Vue 3) to build fine-grained reactive state systems.
> 
---

### Exercise 3: Negative Index Array Access Proxy Trap

**Scenario:** A utility library wraps standard JavaScript arrays in a Proxy to enable Python-style negative index element access (e.g. `arr[-1]`).

**Requirements:**
1. Write createNegativeArrayProxy(array).
2. Implement get trap.
3. If prop is numeric string < 0, calculate index from array.length.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createNegativeArrayProxy(array) {
>   if (!Array.isArray(array)) return array;
>
>   return new Proxy(array, {
>     get(target, prop, receiver) {
>       if (typeof prop === "string") {
>         const index = Number(prop);
>         if (Number.isInteger(index) && index < 0) {
>           const positiveIndex = target.length + index;
>           return Reflect.get(target, positiveIndex, receiver);
>         }
>       }
>       return Reflect.get(target, prop, receiver);
>     }
>   });
> }
>
> // Verification tests
> const items = createNegativeArrayProxy(["apple", "banana", "cherry"]);
>
> console.assert(items[-1] === "cherry", "Test 1 Failed: -1 should return last element");
> console.assert(items[-2] === "banana", "Test 2 Failed: -2 should return second to last element");
> console.assert(items[0] === "apple", "Test 3 Failed: Positive index must work normally");
> ```
>
> #### Technical Explanation
>
> 1. **Custom Property Normalization**: Proxy traps can intercept string property keys and normalize negative numbers into valid array indices.
> 2. **Transparent Array Interoperability**: The returned proxy preserves all standard Array methods (.push, .map, .length).
> 3. **Non-Destructive Augmentation**: Extends array access syntax without modifying Array.prototype globally.
---

## 6. Related Terms
- [Object](../level_02/object.md) — The entity being proxied.
- [Reflect](reflect.md) — Related concept: Reflect.
- [Garbage Collection](garbage_collection.md) — WeakMap & GC.

---

## 7. Key Takeaways
- A Proxy wraps around an Object to intercept and customize fundamental operations.
- Intercepted operations (like reading, writing, or deleting properties) are called **Traps**.
- They are incredibly powerful for Data Validation, Logging, and Reactive Programming (like Vue 3).
- Always interact with the Proxy instance, never the original target object.
```
