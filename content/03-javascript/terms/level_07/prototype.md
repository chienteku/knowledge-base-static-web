# Prototype

> **Level 7 — Objects & Prototypes**
> An internal object from which other objects inherit properties and methods.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — A collection of properties and methods.
- [this Keyword](this_keyword.md) — Refers to the current object.

---

## 2. Term Category

**Architecture Concept / Engine Concept (Universal: This is the fundamental architecture of JavaScript itself.)**: Prototype is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are building a game with 1,000 enemy spaceships. They all need a `.shoot()` method. If you attach a brand new `shoot` function directly to every single spaceship object, you will create 1,000 separate copies of the exact same function in the computer's memory. Your game will quickly run out of memory and crash.

Brendan Eich (the creator of JavaScript) solved this using **Prototypes**. Instead of giving every spaceship its own `shoot` function, he created one hidden "Master Object" (the Prototype). He put the `shoot` function on that Master Object. Then, he secretly linked all 1,000 spaceships to that Master Object. When a spaceship tries to shoot, it realizes it doesn't have the function, so it instantly checks the Master Object, finds the function, and uses it. This saves massive amounts of memory.

### (2) Reality Metaphor
A Prototype is like a public library.
Instead of every citizen buying their own personal copy of an encyclopedia (wasting money and space in their house), the city buys *one* encyclopedia and puts it in the public library. When a citizen needs information, they check their own house first. If they don't have it, they automatically walk to the library (the Prototype) to read the shared copy.

### (3) JavaScript Code Examples

#### Short Snippet: Seeing the Prototype
```javascript
const numbers = [1, 2, 3];

// Did you ever wonder where '.push()' and '.forEach()' come from?
// You never wrote those methods on 'numbers'!
numbers.push(4); 

// They come from the hidden Array Prototype!
console.log(Object.getPrototypeOf(numbers)); 
// Prints a massive object containing push, pop, map, filter, etc.
```

#### Fuller Example: Creating a shared Prototype
```javascript
// The "Library" (Prototype)
const spaceshipMethods = {
  shoot() {
    console.log(`${this.name} fires a laser!`);
  }
};

// A factory function to create ships
function createShip(name) {
  // Object.create builds a NEW object, but secretly links it to the provided Prototype!
  const newShip = Object.create(spaceshipMethods);
  newShip.name = name; // Give it unique local data
  return newShip;
}

const ship1 = createShip("Apollo");
const ship2 = createShip("Gemini");

// They both have access to the shared method!
ship1.shoot(); // "Apollo fires a laser!"

// But they don't physically own it themselves!
console.log(ship1.hasOwnProperty("shoot")); // false
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Prototype Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Prototype blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "prototype";
```

*Fix:*
```javascript
let value = "prototype";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Prototype Callbacks

**The mistake:** Passing methods from Prototype instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "prototype",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "prototype",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Prototype Operations

**The mistake:** Executing asynchronous operations within Prototype without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/prototype"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/prototype");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in prototype: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Adding Shared Methods to Constructor .prototype

**Scenario:** A math utility attaches shared processing methods to Constructor.prototype to optimize memory usage across thousands of instances.

**Requirements:**
1. Write Vector(x, y) constructor.
2. Attach getMagnitude() method to Vector.prototype.
3. Verify method is shared across instances.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function Vector(x, y) {
>   this.x = x;
>   this.y = y;
> }
>
> Vector.prototype.getMagnitude = function() {
>   return Math.sqrt(this.x * this.x + this.y * this.y);
> };
>
> // Verification tests
> const v1 = new Vector(3, 4);
> const v2 = new Vector(6, 8);
>
> console.assert(v1.getMagnitude() === 5, "Test 1 Failed");
> console.assert(v1.getMagnitude === v2.getMagnitude, "Test 2 Failed: Prototype method should be shared reference");
> ```
>
> #### Technical Explanation
>
> 1. **prototype Property**: Function objects possess a .prototype property used as the [[Prototype]] for instances created via 'new'.
> 2. **Memory Optimization**: Attaching methods to .prototype allocates one single function reference shared by all instances.
> 3. **Dynamic Method Addition**: Adding methods to a prototype at runtime makes them instantly available to all existing instances.
> 
---

### Exercise 2: Prototype Advanced Context Handler

**Scenario:** A web application component processes prototype data operations within enterprise workflows.

**Requirements:**
1. Write handlePrototypeSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handlePrototypeSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handlePrototypeSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Prototype Architecture**: Applying prototype patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Prototype Performance Optimization

**Scenario:** An application utility optimizes prototype execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizePrototypeTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizePrototypeTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizePrototypeTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Prototype Optimization**: Optimizing prototype improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Prototypal Inheritance](prototypal_inheritance.md) — The process of inheriting from these prototypes.
- [Prototype Chain](prototype_chain.md) — The series of links connecting objects to multiple prototypes.
- [Class](class.md) — ES6 Classes.
- [Object](../level_02/object.md) — Related concept: Object.

---

## 7. Key Takeaways
- A Prototype is a hidden, shared object that other objects link to.
- It is JavaScript's solution for memory efficiency and code reuse.
- When you call a method on an object (like `.map()` on an array), the engine checks the object first, then automatically checks its Prototype.
- Do not modify global, built-in prototypes like `Array.prototype`.
