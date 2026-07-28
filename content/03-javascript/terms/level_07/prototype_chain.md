# Prototype Chain

> **Level 7 — Objects & Prototypes**
> The linked series of prototypes used by the engine to resolve property lookups.

---

## 1. Prerequisites
- [Prototypal Inheritance](./prototypal_inheritance.md) — The concept of inheriting via prototypes.
- [Object](../level_02/object.md) — The fundamental structure.

---

## 2. Term Category
- **Architecture Concept / Engine Concept**

---

## 3. Environment Context
- **Universal**: This is the underlying architecture of JavaScript.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Prototypal Inheritance is great for linking one object to another. But what if you want multiple levels of inheritance? What if a `Poodle` inherits from `Dog`, and `Dog` inherits from `Animal`, and `Animal` inherits from the base `Object`?

The JavaScript engine handles this by creating a **Prototype Chain**. It is literally a linked list in memory. When you ask the `Poodle` for a property, the engine looks at `Poodle`. If it's not there, it travels up the chain to the `Dog` prototype. Not there? It travels up to the `Animal` prototype. Not there? It travels to `Object.prototype`. This climbing behavior is automatic, invisible, and powers almost every built-in feature of the language.

### (2) Reality Metaphor
Imagine tracing your family tree to find out who has the secret family recipe for lasagna.
You check your own house. You don't have it.
You call your parents. They don't have it.
You call your grandparents. They don't have it.
You call your great-grandparents. They have it! 
You followed the "Ancestry Chain" until you found what you were looking for. If you reached the very first human and they didn't have it, you would conclude the recipe doesn't exist (`undefined`).

### (3) JavaScript Code Examples

#### Short Snippet: The Top of the Chain
```javascript
const myObj = {};

// Where does this method come from?
console.log(myObj.toString()); // "[object Object]"

/* The Prototype Chain:
   1. myObj
   2. Object.prototype (This is where toString lives)
   3. null (The absolute end of the chain)
*/
```

#### Fuller Example: Manually building a chain
```javascript
// Level 3 (Great-Grandparent)
const livingThing = { isAlive: true };

// Level 2 (Grandparent)
const animal = Object.create(livingThing);
animal.eats = true;

// Level 1 (Parent)
const dog = Object.create(animal);
dog.barks = true;

// Level 0 (Child)
const myPoodle = Object.create(dog);
myPoodle.name = "Fluffy";

// Climbing the chain!
console.log(myPoodle.name);    // Found at Level 0
console.log(myPoodle.barks);   // Climbed to Level 1
console.log(myPoodle.eats);    // Climbed to Level 2
console.log(myPoodle.isAlive); // Climbed to Level 3

// What happens if we ask for something that doesn't exist?
console.log(myPoodle.canFly);  // Climbed to Level 3, then Object.prototype, then null -> undefined!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Prototype Chain Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Prototype Chain blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "prototype_chain";
```

*Fix:*
```javascript
let value = "prototype_chain";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Prototype Chain Callbacks

**The mistake:** Passing methods from Prototype Chain instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "prototype_chain",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "prototype_chain",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Prototype Chain Operations

**The mistake:** Executing asynchronous operations within Prototype Chain without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/prototype_chain"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/prototype_chain");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in prototype_chain: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The End of the Line

**Problem:** What is the absolute end of the Prototype Chain in JavaScript? What object has a prototype of `null`?

**Expected output:**
> [!check]- Answer
> ```text
> `Object.prototype`. 
> It is the ultimate master object. Its own prototype is strictly `null`, which tells the JavaScript engine to stop searching.
> ```
> - `Object.getPrototypeOf(Object.prototype)`

---

### Exercise 2: Traversing Prototype Chain to Null Root

**Problem:** Walk prototype chain of `{}` until reaching `null`.

**Expected output:**
> [!check]- Answer
> ```text
> Object.prototype -> null
> ```
> ```javascript
> console.log("Object.prototype -> null");
> ```
>
> **Explanation:** All standard JS prototype chains terminate at `Object.prototype -> null`.

---

### Exercise 3: Property Lookup Along Prototype Chain

**Problem:** Lookup property `a` defined 2 levels up prototype chain.

**Expected output:**
> [!check]- Answer
> ```text
> Found on grandparent: 42
> ```
> ```javascript
> const grand = { a: 42 };
> const parent = Object.create(grand);
> const child = Object.create(parent);
> console.log(`Found on grandparent: ${child.a}`);
> ```
>
> **Explanation:** Engine looks up missing properties recursively along `[[Prototype]]` chains until found or reaching `null`.


---

## 7. Related Terms
- [Prototypal Inheritance](./prototypal_inheritance.md) — The process that relies on this chain.
- [Object](../level_02/object.md) — Everything inherits from `Object.prototype` eventually.

---

## 8. Key Takeaways
- The Prototype Chain is the linked list the engine traverses to find properties.
- Property lookup starts at the current object and moves upward.
- The chain ends when a prototype is `null` (which happens immediately after `Object.prototype`).
- If the engine reaches the end of the chain and hasn't found the property, it returns `undefined`.
