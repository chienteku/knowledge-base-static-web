# Reflect

> **Level 9 — Advanced Concepts & Patterns**
> Methods mirroring Proxy trap operations.

---

## 1. Prerequisites
- [Proxy](./proxy.md) — The object interception API.
- [Object](../level_02/object.md) — The base key-value data structure.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before ES6, performing fundamental actions on JavaScript objects lacked syntax consistency:
- Checking a key: `key in obj` (operator syntax).
- Deleting a property: `delete obj.key` (statement syntax).
- Defining a descriptor: `Object.defineProperty(obj, key, desc)` (constructor method).

Furthermore, if some of these operations failed (like trying to redefine a non-configurable property), they would throw an exception, forcing developers to wrap basic object manipulations in noisy `try/catch` blocks.

To unify and standardize these actions, ES6 introduced **`Reflect`**:
- A global static namespace object (like `Math`) that groups together standard methods for object manipulation.
- **Proxy Traps Alignment:** Every method on `Reflect` (like `Reflect.get()`, `Reflect.set()`, `Reflect.has()`) has the exact same name, arguments, and return types as the handler traps of a `Proxy` object. This makes forwarding operations from inside a Proxy extremely clean.
- **Success Booleans:** Methods that update objects return a simple `true` (success) or `false` (failure) boolean instead of throwing errors, making the API safer.

### (2) Reality Metaphor
- **Old Object Manipulation** is like operating a warehouse using a **scattered collection of mixed controls**—some actions require pulling a mechanical lever (`delete`), some require typing commands on a terminal (`Object.defineProperty`), and some require scanning a barcode (`in`). If a command is invalid, the console crashes.
- **`Reflect`** is a **unified digital control panel**. Every action has a standard, identical button. Pushing a button performs the action on the warehouse shelf and flashes a green light (`true`) or red light (`false`) if it succeeds or fails, without crashing the building.
- Inside a **Proxy** (a security guard), the guard checks your credentials (the trap is triggered). Instead of manually moving the boxes, the guard simply turns around and presses the matching button on the **Reflect** control panel to forward your request.

### (3) JavaScript Code Examples

#### Forwarding Operations Inside a Proxy (The Receiver Parameter)
```javascript
const user = {
  firstName: "Brendan",
  lastName: "Eich",
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
};

const proxy = new Proxy(user, {
  // Trap property reading
  get(target, prop, receiver) {
    console.log(`Intercepted read on: "${prop}"`);
    
    // Using Reflect.get forwards the call to the target object.
    // The 'receiver' argument is critical: it guarantees that 'this' 
    // inside the fullName getter points to the proxy, not the raw user object!
    return Reflect.get(target, prop, receiver);
  }
});

console.log(proxy.fullName);
// Logs:
// Intercepted read on: "fullName"
// Intercepted read on: "firstName"
// Intercepted read on: "lastName"
// "Brendan Eich"
```

#### Safe Object Manipulations with Booleans
```javascript
const config = { port: 8080 };
Object.freeze(config); // Lock object

// 1. Legacy way of setting property
try {
  Object.defineProperty(config, "port", { value: 3000 });
} catch (e) {
  console.log("Legacy write failed and crashed!");
}

// 2. Reflect way returns a boolean without throwing exceptions
const success = Reflect.defineProperty(config, "port", { value: 3000 });
console.log("Write success?", success); // false (Fails safely!)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Reflect Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Reflect blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "reflect";
```

*Fix:*
```javascript
let value = "reflect";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Reflect Callbacks

**The mistake:** Passing methods from Reflect instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "reflect",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "reflect",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Reflect Operations

**The mistake:** Executing asynchronous operations within Reflect without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/reflect"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/reflect");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in reflect: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Proxy Logger

**Problem:** Complete the `get` trap inside the proxy handler to log `"Reading property [prop]"` and return the property value using `Reflect.get`.

```javascript
const item = { id: 101, name: "Screwdriver" };

const loggerProxy = new Proxy(item, {
  get(target, prop, receiver) {
    // 1. Log "Reading property [prop]"
    // 2. Return value using Reflect
  }
});

console.log(loggerProxy.name);
```

**Expected output:**
> [!check]- Answer
> ```text
> Reading property name
> Screwdriver
> ```
> - Inside the trap, write `console.log("Reading property " + prop);` and return `Reflect.get(target, prop, receiver);`.

---

### Exercise 2: Forwarding Proxy Traps with `Reflect`

**Problem:** Use `Reflect.get(target, prop, receiver)` inside Proxy `get` trap.

**Expected output:**
> [!check]- Answer
> ```text
> Reflect returned: Alice
> ```
> ```javascript
> const target = { name: "Alice" };
> const proxy = new Proxy(target, {
>   get(t, p, r) {
>     return Reflect.get(t, p, r);
>   }
> });
> console.log(`Reflect returned: ${proxy.name}`);
> ```
>
> **Explanation:** `Reflect` methods mirror internal engine operations, safely forwarding Proxy traps.

---

### Exercise 3: Safe Property Deletion with `Reflect.deleteProperty`

**Problem:** Delete property `a` using `Reflect.deleteProperty(obj, "a")`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> const obj = { a: 1 };
> console.log(Reflect.deleteProperty(obj, "a"));
> ```
>
> **Explanation:** `Reflect.deleteProperty` returns boolean success status indicators.


---

## 7. Related Terms
- [Proxy](./proxy.md) — The interception wrapper that mirrors Reflect method hooks.
- [`instanceof`](../level_07/instanceof.md) — The constructor check operator mirrored by `Reflect.construct()`.

---

## 8. Key Takeaways
- `Reflect` is a global static namespace object containing methods to manipulate JavaScript objects.
- It unifies object operations under a consistent functional API.
- Reflect methods map 1-to-1 with Proxy handler traps, making delegation simple.
- Update methods (like `Reflect.set()`, `Reflect.defineProperty()`) return success booleans instead of throwing errors.
- Always forward the `receiver` parameter inside Proxy getters/setters to ensure `this` bindings resolve correctly.
