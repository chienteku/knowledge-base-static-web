# extends

> **Level 7 — Objects & Prototypes**
> Keyword used in class declarations to create a child class that inherits from a parent class.

---

## 1. Prerequisites
- [Class](class.md) — The blueprint syntax used in ES6.
- [Prototypal Inheritance](prototypal_inheritance.md) — What `extends` is secretly doing under the hood.
---

## 2. Term Category
- **Language Core** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before ES6, if you wanted one object (like a `Dog`) to inherit the properties and methods of another object (like an `Animal`), you had to manually write complex, confusing code using `Object.create(Animal.prototype)` and manually re-bind constructor functions. 

The `extends` keyword was introduced as part of the ES6 Class syntax to make inheritance incredibly simple. By simply typing `class Dog extends Animal`, the JavaScript engine automatically wires up the entire Prototype Chain for you. The `Dog` class instantly gains access to every method defined in the `Animal` class.

### (2) Reality Metaphor
Imagine a master architect draws a blueprint for a basic "House" with 4 walls and a roof.
Instead of drawing a brand new blueprint from scratch for a "Mansion", the architect takes the "House" blueprint and simply writes `extends House` at the top. The builders instantly know to include the 4 walls and roof, leaving the architect free to only draw the *new* additions, like a pool and a home theater.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// The Parent Class
class Animal {
  sleep() {
    console.log("Zzzzz...");
  }
}

// The Child Class INHERITS the Parent Class
class Cat extends Animal {
  meow() {
    console.log("Meow!");
  }
}

const myCat = new Cat();

// It has its own methods...
myCat.meow(); // "Meow!"

// AND it has the parent's methods!
myCat.sleep(); // "Zzzzz..."
```

#### Fuller Example: Overriding Methods
```javascript
class Employee {
  calculatePay() {
    return 1000;
  }
}

class Manager extends Employee {
  // The Manager class provides its OWN version of calculatePay.
  // This is called "Method Overriding" or "Shadowing".
  calculatePay() {
    return 5000;
  }
}

const basicWorker = new Employee();
const boss = new Manager();

console.log(basicWorker.calculatePay()); // 1000
console.log(boss.calculatePay());        // 5000
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Extends Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Extends blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "extends";
```

*Fix:*
```javascript
let value = "extends";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Extends Callbacks

**The mistake:** Passing methods from Extends instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "extends",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "extends",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Extends Operations

**The mistake:** Executing asynchronous operations within Extends without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/extends"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/extends");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in extends: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Prototype Link

**Problem:** If `class Square extends Shape`, and you check `Object.getPrototypeOf(Square.prototype)`, what will the engine return?

**Expected output:**
> [!check]- Answer
> ```text
> `Shape.prototype`. 
> The `extends` keyword secretly wires the child's prototype to point directly to the parent's prototype, establishing the Prototype Chain!
> ```
> - `extends` is just syntactic sugar for `Object.setPrototypeOf()`.

---

### Exercise 2: Class Inheritance with `extends`

**Problem:** Create subclass `class Dog extends Animal` overriding `speak()` method.

**Expected output:**
> [!check]- Answer
> ```text
> Woof!
> ```
> ```javascript
> class Animal {
>   speak() { return "Noise"; }
> }
> class Dog extends Animal {
>   speak() { return "Woof!"; }
> }
> console.log(new Dog().speak());
> ```
>
> **Explanation:** `extends` sets up prototype inheritance between parent and child classes.

---

### Exercise 3: Super Constructor Delegation

**Problem:** Pass parent arguments via `super(name)` in derived subclass constructor.

**Expected output:**
> [!check]- Answer
> ```text
> Buddy
> ```
> ```javascript
> class Base { constructor(name) { this.name = name; } }
> class Derived extends Base {
>   constructor(name, age) {
>     super(name);
>     this.age = age;
>   }
> }
> console.log(new Derived("Buddy", 3).name);
> ```
>
> **Explanation:** `super(args)` forwards arguments to parent class constructors.


---

## 7. Related Terms
- [Class](class.md) — The structure used with `extends`.
- [super](super.md) — The keyword required inside a child class's constructor.
- [Error object & Error Types](../level_06/error_object.md) — Related concept: Error object & Error Types.
- [Static Methods & Properties](static_methods_properties.md) — Related concept: Static Methods & Properties.
---

## 8. Key Takeaways
- `extends` is the modern way to create a child class that inherits from a parent class.
- It automatically wires up the underlying Prototype Chain.
- Child classes can use the parent's methods without rewriting them.
- Child classes can "override" parent methods by defining a method with the exact same name.
