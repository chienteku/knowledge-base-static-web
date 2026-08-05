# Class

> **Level 7 — Objects & Prototypes**
> ES6 syntactic sugar over constructor functions and prototypal inheritance.

---

## 1. Prerequisites
- [Constructor Function](constructor_function.md) — The older, underlying logic Classes replace.
- [Prototypal Inheritance](prototypal_inheritance.md) — How Classes secretly share data.
---

## 2. Term Category
- **Language Core** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before ES6 (2015), creating objects and setting up inheritance using traditional [Constructor Functions](./constructor_function.md) and manually linking `Object.create(Prototype)` was messy, confusing, and completely alien to developers coming from other languages like Java, C#, or Python.

To make JavaScript more approachable and to clean up the code, the TC39 committee introduced the `class` keyword. However, they did *not* change the underlying engine. JavaScript is still inherently Prototypal! The `class` syntax is simply "syntactic sugar" — a beautiful wrapper that secretly compiles down to the exact same Constructor Functions and Prototype links developers used to write by hand. 

### (2) Reality Metaphor
Imagine a baker who manually mixes flour, water, and yeast every single day to bake a loaf of bread. It's messy and takes a lot of manual steps.
The `class` keyword is like buying an automated Bread Maker machine. You press one button, and it makes the bread for you. The machine didn't invent a new type of bread; it is still secretly mixing flour, water, and yeast inside the box. It just hides the messy details from you.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
class User {
  // The 'constructor' method replaces the old Constructor Function
  constructor(name) {
    this.name = name;
  }

  // Any methods written here are secretly placed on User.prototype!
  greet() {
    console.log(`Hello, I am ${this.name}`);
  }
}

// You MUST use the 'new' keyword to instantiate a class!
const alice = new User("Alice");
alice.greet(); // "Hello, I am Alice"
```

#### Fuller Example: Getters and Setters
```javascript
class BankAccount {
  constructor(owner, balance) {
    this.owner = owner;
    this._balance = balance; // The underscore is a convention for "private"
  }

  // A Getter allows you to access a method as if it were a property
  get balance() {
    console.log("Checking balance...");
    return `$${this._balance}`;
  }

  // A Setter allows you to run logic when someone tries to assign a value
  set deposit(amount) {
    if (amount <= 0) {
      console.log("Deposit must be positive!");
      return;
    }
    this._balance += amount;
  }
}

const myAccount = new BankAccount("Bob", 100);

// We don't use () for getters!
console.log(myAccount.balance); 

// We use = for setters!
myAccount.deposit = 50; 
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Class Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Class blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "class";
```

*Fix:*
```javascript
let value = "class";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Class Callbacks

**The mistake:** Passing methods from Class instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "class",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "class",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Class Operations

**The mistake:** Executing asynchronous operations within Class without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/class"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/class");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in class: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Secret Truth

**Problem:** If you run `typeof User` (assuming `User` is a class), what does the console print?

**Expected output:**
> [!check]- Answer
> ```text
> "function"
> Because under the hood, a class is literally just a Constructor Function!
> ```
> - Classes are just syntactic sugar. They didn't add a new data type to JS.

---

### Exercise 2: Defining ES6 Classes with Constructors

**Problem:** Define `class Person` with `constructor(name)` and method `greet()`.

**Expected output:**
> [!check]- Answer
> ```text
> Hi, I am Alice
> ```
> ```javascript
> class Person {
>   constructor(name) {
>     this.name = name;
>   }
>   greet() {
>     return `Hi, I am ${this.name}`;
>   }
> }
> const p = new Person("Alice");
> console.log(p.greet());
> ```
>
> **Explanation:** ES6 class syntax provides clean object-oriented constructor and prototype method structures.

---

### Exercise 3: Class Field Initializers

**Problem:** Use class field declaration `count = 0;` inside class body.

**Expected output:**
> [!check]- Answer
> ```text
> 0
> ```
> ```javascript
> class Counter {
>   count = 0;
> }
> console.log(new Counter().count);
> ```
>
> **Explanation:** Class field initializers assign properties directly on new instance object creations.

---

## 7. Related Terms
- [extends](extends.md) — Used to create child classes.
- [super](super.md) — Used inside child classes to call the parent.
- [Constructor Function](constructor_function.md) — Related concept: Constructor Function.
- [Getters & Setters](getters_setters.md) — Related concept: Getters & Setters.
- [instanceof](instanceof.md) — Related concept: instanceof.
- [new Keyword](new_keyword.md) — Related concept: new Keyword.
- [Design Patterns (Module, Singleton, Observer, Factory)](../level_09/design_patterns.md) — Related concept: Design Patterns (Module, Singleton, Observer, Factory).
- [Prototype](prototype.md) — Related concept: Prototype.
---

## 8. Key Takeaways
- `class` is a modern, clean syntax for creating objects and setting up inheritance.
- It is "syntactic sugar" over JavaScript's existing Prototypal Inheritance model.
- You must always use the `new` keyword to create an instance of a class.
- The `constructor()` method is run automatically when the class is instantiated.
- Methods written inside the class block are automatically placed on the Prototype.
