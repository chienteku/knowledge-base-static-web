# Object.create

> **Level 7 — Objects & Prototypes**
> Create an object with an explicit prototype.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.
- [Prototype](prototype.md) — The internal object container from which other objects inherit features.
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Normally, when we create an object literal `{}` or call `new Object()`, JavaScript automatically links its internal prototype reference (`[[Prototype]]`) to the global `Object.prototype`. This gives the new object access to utility methods like `.toString()` and `.hasOwnProperty()`.

However, what if we want to create an object that inherits directly from a custom object *without* defining a Constructor Function or ES6 Class? Or what if we want to build a pure dictionary map that inherits absolutely nothing, protecting our code from prototype pollution bugs?

To provide this control, JavaScript implements **`Object.create(proto)`**:
- It instantiates a new object and sets its internal prototype link directly to the provided `proto` argument.
- If you pass a parent object, the child object gains access to all parent properties via the Prototype Chain.
- If you pass **`null`** (`Object.create(null)`), the engine creates a completely pure dictionary object with **no prototype at all**. It has no parent link, no standard methods (like `.toString()`), and is completely immune to prototype pollution.

### (2) Reality Metaphor
- A standard object literal `{}` is like a baby born into the standard human family tree, inheriting standard human traits (like talking, eating) from the human prototype (`Object.prototype`).
- **`Object.create(parent)`** is like drafting a custom adoption contract specifying: "This new person starts life immediately inheriting the DNA and legacy characteristics of `parent`."
- **`Object.create(null)`** is like creating a robot. It has no parents or ancestors (no prototype). It doesn't know any human behaviors (has no `.toString()` or `.hasOwnProperty()` methods), but it acts as a clean slate, doing only what you program it to do without inheriting any family history.

### (3) JavaScript Code Examples

#### Explicit Prototype Inheritance
```javascript
const animal = {
  makeSound: function() {
    console.log(`${this.name} says: ${this.sound}`);
  }
};

// Create a new object linking animal as its prototype
const dog = Object.create(animal);
dog.name = "Rex";
dog.sound = "Woof!";

// dog does not have makeSound directly, but finds it in the prototype chain:
dog.makeSound(); // "Rex says: Woof!"
```

#### Creating a Prototype-less Object
```javascript
// 1. Create a pure map dictionary with no prototype
const pureMap = Object.create(null);

pureMap.username = "Alice";

console.log("username in map?", "username" in pureMap); // true

// 2. PITFALL: Calling standard Object.prototype methods crashes!
try {
  // Throws TypeError: pureMap.toString is not a function
  console.log(pureMap.toString()); 
} catch (error) {
  console.warn("Caught Error:", error.message);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting standard Object methods on prototype-less objects

**The mistake:** Creating an object with `Object.create(null)` and calling `.hasOwnProperty(key)` directly on it.

**Why it's wrong:** An object created with a `null` prototype has no link to `Object.prototype` where `.hasOwnProperty` resides. Calling it throws a TypeError. To check properties safely, use the static method `Object.hasOwn(obj, key)`.

*Incorrect:*
```javascript
const map = Object.create(null);
map.port = 8080;

if (map.hasOwnProperty("port")) { // TypeError: map.hasOwnProperty is not a function
  console.log("Port exists.");
}
```

*Fix:*
```javascript
const map = Object.create(null);
map.port = 8080;

// Correct static method way:
if (Object.hasOwn(map, "port")) { 
  console.log("Port exists."); // Correct and safe
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Object Create Callbacks

**The mistake:** Passing methods from Object Create instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "object_create",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "object_create",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Object Create Operations

**The mistake:** Executing asynchronous operations within Object Create without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/object_create"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/object_create");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in object_create: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Custom Prototype Link

**Problem:** Complete the code using `Object.create` to create a `child` object that inherits from the `parent` object, and verify inheritance.

```javascript
const parent = { familyName: "Smith" };

// Create child inheriting from parent
const child = // Write code
child.firstName = "John";

console.log("Full Name:", child.firstName, child.familyName);
```

**Expected output:**
> [!check]- Answer
> ```text
> Full Name: John Smith
> ```
> - Call `Object.create(parent)` to create the child.

---

### Exercise 2: Creating Prototype-less Dictionary Objects

**Problem:** Create a pure dictionary object `Object.create(null)` without prototype overhead.

**Expected output:**
> [!check]- Answer
> ```text
> null
> ```
> ```javascript
> const dict = Object.create(null);
> console.log(Object.getPrototypeOf(dict));
> ```
>
> **Explanation:** `Object.create(null)` instantiates pure dictionary objects with zero inherited properties.

---

### Exercise 3: Explicit Prototype Inheritance Setup

**Problem:** Inherit `protoObj = { greet() { return "Hi"; } }` using `Object.create(protoObj)`.

**Expected output:**
> [!check]- Answer
> ```text
> Hi
> ```
> ```javascript
> const protoObj = { greet() { return "Hi"; } };
> const obj = Object.create(protoObj);
> console.log(obj.greet());
> ```
>
> **Explanation:** `Object.create(proto)` assigns `proto` directly as the new object's `[[Prototype]]`.


---

## 7. Related Terms
- [Prototypal Inheritance](prototypal_inheritance.md) — The mechanism enabling objects to inherit features.
- [new Keyword](new_keyword.md) — The constructor instantiation operator.
---

## 8. Key Takeaways
- `Object.create(proto)` instantiates a new object with an explicit prototype parent.
- If you pass `null` (`Object.create(null)`), it creates a pure dictionary object with no prototype chain.
- Prototype-less objects lack standard methods like `.toString()` and `.hasOwnProperty()`.
- Use prototype-less objects as safe, clean data maps to prevent prototype pollution exploits.
