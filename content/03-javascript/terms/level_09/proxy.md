# Proxy

> **Level 9 — Advanced Concepts & Patterns**
> An object used to intercept and define custom behavior for fundamental operations (e.g., property lookup).

---

## 1. Prerequisites
- [Object](../level_02/object.md) — What the Proxy wraps around.
- [Class](../level_07/class.md) — The Proxy is a built-in class.

---

## 2. Term Category
- **Design Pattern / Engine Feature** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Default Behavior

**Problem:** What happens if you create a Proxy with an empty handler object `{}`? Does it break the object?

**Expected output:**
> [!check]- Answer
> ```text
> No! If you don't provide a specific Trap (like `get` or `set`), the Proxy acts as a perfectly transparent window. It just forwards the request directly to the target object without doing anything.
> ```
> - The Proxy only intercepts what you explicitly tell it to intercept.

---

### Exercise 2: Property Access Validation Proxy Trap

**Problem:** Use `Proxy` `get` trap to return default `"N/A"` for missing property keys.

**Expected output:**
> [!check]- Answer
> ```text
> N/A
> ```
> ```javascript
> const target = { name: "Alice" };
> const proxy = new Proxy(target, {
>   get(target, prop) {
>     return prop in target ? target[prop] : "N/A";
>   }
> });
> console.log(proxy.missing);
> ```
>
> **Explanation:** Proxy `get(target, prop)` intercepts property access calls.

---

### Exercise 3: Property Mutation Validation with `set` Trap

**Problem:** Use Proxy `set` trap to enforce numeric `age` assignment.

**Expected output:**
> [!check]- Answer
> ```text
> TypeError caught
> ```
> ```javascript
> const person = {};
> const proxy = new Proxy(person, {
>   set(target, prop, val) {
>     if (prop === "age" && typeof val !== "number") throw new TypeError("Age must be a number");
>     target[prop] = val;
>     return true;
>   }
> });
> try { proxy.age = "thirty"; } catch (err) { console.log("TypeError caught"); }
> ```
>
> **Explanation:** Proxy `set` traps validate property assignment values before mutating targets.


---

## 7. Related Terms
- [Object](../level_02/object.md) — The entity being proxied.

---

## 8. Key Takeaways
- A Proxy wraps around an Object to intercept and customize fundamental operations.
- Intercepted operations (like reading, writing, or deleting properties) are called **Traps**.
- They are incredibly powerful for Data Validation, Logging, and Reactive Programming (like Vue 3).
- Always interact with the Proxy instance, never the original target object.
```
