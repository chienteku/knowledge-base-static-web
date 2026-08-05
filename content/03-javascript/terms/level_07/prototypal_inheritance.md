# Prototypal Inheritance

> **Level 7 — Objects & Prototypes**
> JavaScript's mechanism for objects to inherit features from one another via the prototype chain.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — A collection of properties and methods.
- [Prototype](prototype.md) — A shared master object.

---

## 2. Term Category
- **Architecture Concept**

---

## 3. Environment Context
- **Universal**: This is the core object-oriented model of JavaScript.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional Object-Oriented Programming (like Java or C++), inheritance is based on "Classes." A Class is a rigid blueprint, and objects are stamped out from that blueprint. If a `Dog` class inherits from an `Animal` class, the compiler physically copies the properties down.

JavaScript, however, was designed to be highly dynamic and memory-efficient for the early web. Instead of rigid blueprints, JavaScript uses "Prototypal Inheritance". Every object is simply a dynamic bag of properties, and every object has a secret link pointing to another object (its Prototype). If you ask an object for a property it doesn't have, it doesn't crash; it simply follows the secret link and asks the Prototype object if *it* has the property. This process of delegating requests up the chain is Prototypal Inheritance.

### (2) Reality Metaphor
Imagine a small startup company. 
An intern is asked to sign a legal contract. The intern (the Object) doesn't have the authority to sign it. Instead of giving up, they walk over to their Manager (the Prototype) and ask them to sign it. If the Manager doesn't have authority, the Manager walks over to the CEO (the next Prototype). 
The intern "inherits" the authority of the CEO, not because the intern physically *became* the CEO, but because the intern can dynamically *delegate* the task up the chain of command.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// The Parent Object (The Manager)
const animal = {
  eats: true,
  walk() {
    console.log("Animal walk");
  }
};

// The Child Object (The Intern)
const rabbit = {
  jumps: true
};

// We manually set 'animal' to be the Prototype of 'rabbit'
Object.setPrototypeOf(rabbit, animal);

// Prototypal Inheritance in action!
console.log(rabbit.jumps); // true (Found directly on the rabbit)
console.log(rabbit.eats);  // true (Not on rabbit! Delegated to animal)
rabbit.walk();             // "Animal walk" (Delegated to animal)
```

#### Fuller Example: Property Shadowing
What happens if the Intern and the Manager both have a pen, but the Intern's pen is red and the Manager's pen is blue? If you ask the Intern for a pen, which one do you get?
```javascript
const user = {
  role: "Guest",
  permissions: "Read-only"
};

const admin = Object.create(user); // 'admin' inherits from 'user'
admin.role = "Administrator";      // We give 'admin' its own local 'role'

console.log(admin.permissions); // "Read-only" (Inherited from user)

// Property Shadowing!
// The engine checks 'admin' first. It finds 'role', so it stops searching immediately.
// It never even looks at the 'user' prototype for 'role'.
console.log(admin.role); // "Administrator" 
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Prototypal Inheritance Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Prototypal Inheritance blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "prototypal_inheritance";
```

*Fix:*
```javascript
let value = "prototypal_inheritance";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Prototypal Inheritance Callbacks

**The mistake:** Passing methods from Prototypal Inheritance instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "prototypal_inheritance",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "prototypal_inheritance",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Prototypal Inheritance Operations

**The mistake:** Executing asynchronous operations within Prototypal Inheritance without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/prototypal_inheritance"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/prototypal_inheritance");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in prototypal_inheritance: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The For...In Loop

**Problem:** If `rabbit` inherits from `animal`, and you use a `for...in` loop to iterate over `rabbit`, will it print the properties of `animal` too?

**Expected output:**
> [!check]- Answer
> ```text
> Yes! A `for...in` loop iterates over both an object's own properties AND its inherited enumerable properties. (If you only want the object's own properties, you must use `Object.keys()` or `hasOwnProperty()`).
> ```
> - Prototypal inheritance makes properties feel like they belong to the child.

---

### Exercise 2: Linking Prototypes with `Object.create`

**Problem:** Link `Child.prototype` to `Parent.prototype` using `Object.create`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> function Parent() {}
> function Child() {}
> Child.prototype = Object.create(Parent.prototype);
> Child.prototype.constructor = Child;
> console.log(new Child() instanceof Parent);
> ```
>
> **Explanation:** `Object.create(Parent.prototype)` establishes prototypal inheritance chains.

---

### Exercise 3: Property Shadowing on Prototype Chains

**Problem:** Demonstrate that assigning property `x = 10` on an instance shadows prototype property `x = 5`.

**Expected output:**
> [!check]- Answer
> ```text
> Instance x: 10, Proto x: 5
> ```
> ```javascript
> const proto = { x: 5 };
> const inst = Object.create(proto);
> inst.x = 10;
> console.log(`Instance x: ${inst.x}, Proto x: ${proto.x}`);
> ```
>
> **Explanation:** Writing properties to instances shadows prototype properties without mutating prototype defaults.


---

## 7. Related Terms
- [Prototype](prototype.md) — The master object being inherited from.
- [Prototype Chain](prototype_chain.md) — The visual linkage of this inheritance.
- [hasOwnProperty / Object.getPrototypeOf](hasownproperty_getprototypeof.md) — Related concept: hasOwnProperty / Object.getPrototypeOf.
- [Object.create](object_create.md) — Related concept: Object.create.

---

## 8. Key Takeaways
- Prototypal Inheritance is JavaScript's way of sharing properties and methods between objects.
- It works by secretly linking objects together (delegation), rather than copying blueprints.
- If an object doesn't have a property, it asks its prototype.
- If you give a child a property with the exact same name as a parent's property, the child's property "shadows" (hides) the parent's.
