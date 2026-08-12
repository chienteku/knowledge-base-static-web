# Reflect

> **Level 9 — Advanced Concepts & Patterns**
> Methods mirroring Proxy trap operations.

---

## 1. Prerequisites
- [Proxy](proxy.md) — The object interception API.
- [Object](../level_02/object.md) — The base key-value data structure.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Reflect is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Safe Dynamic Property Definition via Reflect.defineProperty

**Scenario:** A framework metaprogramming module uses `Reflect.defineProperty()` to define non-enumerable object properties safely without try...catch blocks.

**Requirements:**
1. Write definePrivateMeta(target, propName, value).
2. Use Reflect.defineProperty().
3. Return boolean success status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function definePrivateMeta(target, propName, value) {
>   if (typeof target !== "object" || target === null) return false;
>
>   return Reflect.defineProperty(target, propName, {
>     value: value,
>     writable: true,
>     enumerable: false,
>     configurable: true
>   });
> }
>
> // Verification tests
> const obj = { id: 101 };
> const success = definePrivateMeta(obj, "_secret", "abc-123");
>
> console.assert(success === true, "Test 1 Failed");
> console.assert(obj._secret === "abc-123", "Test 2 Failed");
> console.assert(Object.keys(obj).includes("_secret") === false, "Test 3 Failed: Must be non-enumerable");
> ```
>
> #### Technical Explanation
>
> 1. **Reflect API Purpose**: Reflect is a built-in ES6 object providing static methods for interceptable JavaScript operations.
> 2. **Boolean Return Values**: Reflect.defineProperty returns boolean true/false indicating success instead of throwing errors like Object.defineProperty.
> 3. **Proxy Trap Mirroring**: Every Proxy handler trap has a corresponding static Reflect method with identical arguments.
> 
---

### Exercise 2: Interpreting Dynamic Constructor Instantiation via Reflect.construct

**Scenario:** A dependency injection container dynamically instantiates target classes with variadic arguments using `Reflect.construct()`.

**Requirements:**
1. Write instantiateService(TargetClass, argsArray).
2. Use Reflect.construct(TargetClass, argsArray).
3. Return created instance.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class UserService {
>   constructor(name, role) {
>     this.name = name;
>     this.role = role;
>   }
> }
>
> function instantiateService(TargetClass, argsArray) {
>   if (typeof TargetClass !== "function") return null;
>   return Reflect.construct(TargetClass, argsArray);
> }
>
> // Verification tests
> const user = instantiateService(UserService, ["Alice", "ADMIN"]);
>
> console.assert(user instanceof UserService, "Test 1 Failed");
> console.assert(user.name === "Alice" && user.role === "ADMIN", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Reflect.construct Method**: Evaluates new TargetClass(...argsArray) programmatically with variadic argument arrays.
> 2. **Alternative to Function.prototype.apply with new**: Replaces complex ES5 new (Function.prototype.bind.apply(...)) workarounds cleanly.
> 3. **New Target Customization**: Optional third newTarget argument allows customizing prototype inheritance during construction.
> 
---

### Exercise 3: Method Invocation & Receiver Binding via Reflect.get & Reflect.apply

**Scenario:** An object proxy delegate invokes inherited prototype methods while ensuring the proper receiver target is bound during property lookup.

**Requirements:**
1. Write safeGetAndApply(target, methodName, receiver, args).
2. Use Reflect.get(target, methodName, receiver).
3. Use Reflect.apply(fn, receiver, args).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const person = {
>   firstName: "Jane",
>   lastName: "Doe",
>   getFullName() {
>     return `${this.firstName} ${this.lastName}`;
>   }
> };
>
> const customContext = { firstName: "John", lastName: "Smith" };
>
> function safeGetAndApply(target, methodName, receiver, args = []) {
>   const method = Reflect.get(target, methodName, receiver);
>   if (typeof method !== "function") return null;
>   return Reflect.apply(method, receiver, args);
> }
>
> // Verification tests
> const fullName = safeGetAndApply(person, "getFullName", customContext);
> console.assert(fullName === "John Smith", "Test 1 Failed: Method must execute with customContext receiver");
> ```
>
> #### Technical Explanation
>
> 1. **Reflect.get Receiver Parameter**: The third receiver argument sets the internal `this` binding if the property accessor is a getter.
> 2. **Reflect.apply Method**: Reflect.apply(targetFn, thisArgument, argumentsList) provides a clean static wrapper for function invocation.
> 3. **Robust Metaprogramming**: Eliminates potential method shadowing bugs (e.g. if target overrides .apply or .call).
---

## 6. Related Terms
- [Proxy](proxy.md) — The interception wrapper that mirrors Reflect method hooks.
- [instanceof](../level_07/instanceof.md) — The constructor check operator mirrored by `Reflect.construct()`.

---

## 7. Key Takeaways
- `Reflect` is a global static namespace object containing methods to manipulate JavaScript objects.
- It unifies object operations under a consistent functional API.
- Reflect methods map 1-to-1 with Proxy handler traps, making delegation simple.
- Update methods (like `Reflect.set()`, `Reflect.defineProperty()`) return success booleans instead of throwing errors.
- Always forward the `receiver` parameter inside Proxy getters/setters to ensure `this` bindings resolve correctly.
