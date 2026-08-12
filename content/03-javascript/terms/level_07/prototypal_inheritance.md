# Prototypal Inheritance

> **Level 7 — Objects & Prototypes**
> JavaScript's mechanism for objects to inherit features from one another via the prototype chain.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — A collection of properties and methods.
- [Prototype](prototype.md) — A shared master object.

---

## 2. Term Category

**Architecture Concept (Universal: This is the core object-oriented model of JavaScript.)**: Prototypal Inheritance is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Connecting Prototype Chains via Object.setPrototypeOf()

**Scenario:** A behavioral library links prototype chains between legacy constructor objects using Object.setPrototypeOf().

**Requirements:**
1. Write linkPrototypes(childObj, parentObj).
2. Use Object.setPrototypeOf(childObj, parentObj).
3. Verify child inherits parent methods.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function linkPrototypes(childObj, parentObj) {
>   Object.setPrototypeOf(childObj, parentObj);
>   return childObj;
> }
>
> const animal = {
>   makeSound() { return "Generic Sound"; }
> };
>
> const dog = {
>   bark() { return "Woof"; }
> };
>
> linkPrototypes(dog, animal);
>
> // Verification tests
> console.assert(dog.bark() === "Woof", "Test 1 Failed");
>
> console.assert(dog.makeSound() === "Generic Sound", "Test 2 Failed: Prototype inheritance failed");
> ```
>
> #### Technical Explanation
>
> 1. **Prototypal Inheritance Mechanics**: Objects inherit properties directly from other objects via their [[Prototype]] link.
> 2. **Delegation Model**: When a property is accessed, JavaScript searches the object first, then delegates up its prototype chain.
> 3. **Object.setPrototypeOf() Note**: Modifying an existing object's prototype at runtime impacts JIT optimization; prefer Object.create().
> 
---

### Exercise 2: Prototypal Inheritance Advanced Context Handler

**Scenario:** A web application component processes prototypal inheritance data operations within enterprise workflows.

**Requirements:**
1. Write handlePrototypalInheritanceSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handlePrototypalInheritanceSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handlePrototypalInheritanceSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Prototypal Inheritance Architecture**: Applying prototypal inheritance patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Prototypal Inheritance Performance Optimization

**Scenario:** An application utility optimizes prototypal inheritance execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizePrototypalInheritanceTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizePrototypalInheritanceTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizePrototypalInheritanceTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Prototypal Inheritance Optimization**: Optimizing prototypal inheritance improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Prototype](prototype.md) — The master object being inherited from.
- [Prototype Chain](prototype_chain.md) — The visual linkage of this inheritance.
- [hasOwnProperty / Object.getPrototypeOf](hasownproperty_getprototypeof.md) — Related concept: hasOwnProperty / Object.getPrototypeOf.
- [Object.create](object_create.md) — Related concept: Object.create.

---

## 7. Key Takeaways
- Prototypal Inheritance is JavaScript's way of sharing properties and methods between objects.
- It works by secretly linking objects together (delegation), rather than copying blueprints.
- If an object doesn't have a property, it asks its prototype.
- If you give a child a property with the exact same name as a parent's property, the child's property "shadows" (hides) the parent's.
