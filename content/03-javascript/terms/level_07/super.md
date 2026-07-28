# super

> **Level 7 — Objects & Prototypes**
> Keyword used to call the constructor or methods of an object's parent class.

---

## 1. Prerequisites
- [Class](./class.md) — The ES6 blueprint.
- [`extends`](./extends.md) — Used to create the parent-child relationship.

---

## 2. Term Category
- **Language Core** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When a child class `extends` a parent class, the child often needs its own custom `constructor` to handle specific data. However, the parent class *also* has a `constructor` that handles the base data! How do we run both?

The designers introduced the `super` keyword to solve this. `super` is a direct reference to the Parent Class. 
Inside the child's constructor, calling `super()` actually invokes the parent's constructor, ensuring the base setup is completed before the child adds its specific setup. Furthermore, you can use `super.methodName()` anywhere in the child class to explicitly call a function from the parent class.

### (2) Reality Metaphor
Imagine building a Custom Sports Car based on a standard Car chassis.
You are the engineer for the Custom Sports Car (the Child Class). Before you can install the turbo engine and racing tires, you MUST call the main factory floor (the `super` Parent Class) and say: "Please build the base chassis first." Once the factory finishes building the base chassis, they hand it to you, and you can add your custom parts.

### (3) JavaScript Code Examples

#### Short Snippet: The Constructor Rule
```javascript
class Animal {
  constructor(name) {
    this.name = name; // The base setup
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    // RULE: You MUST call super() before using 'this'!
    super(name); // Passes the name up to the Animal constructor
    
    this.breed = breed; // Now we can do Dog-specific setup
  }
}

const myDog = new Dog("Rex", "German Shepherd");
console.log(myDog.name); // "Rex"
```

#### Fuller Example: Calling Parent Methods
```javascript
class BankAccount {
  deposit(amount) {
    console.log(`Deposited $${amount} securely.`);
  }
}

class VIPAccount extends BankAccount {
  // We want to override the deposit method, but we STILL want 
  // the secure logic from the parent to run!
  deposit(amount) {
    console.log("VIP Bonus! Adding 10 extra dollars!");
    
    // We use super.methodName() to call the parent's version of the function!
    super.deposit(amount + 10);
  }
}

const vip = new VIPAccount();
vip.deposit(100); 
// Output: 
// "VIP Bonus! Adding 10 extra dollars!"
// "Deposited $110 securely."
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accessing `this` before calling `super()`

**The mistake:** Writing `this.color = "red"` in a child class constructor *before* calling `super()`.

**Why it's wrong:** In JavaScript, the parent class is responsible for actually creating the `this` object! If you try to attach properties to `this` before calling `super()`, the `this` object physically does not exist yet. The engine will throw a `ReferenceError`.

*Incorrect:*
```javascript
class Car extends Vehicle {
  constructor(wheels) {
    this.wheels = wheels; // Crash! 'this' doesn't exist yet!
    super(); 
  }
}
```

*Fix:*
```javascript
class Car extends Vehicle {
  constructor(wheels) {
    super(); // Let the parent create 'this' first!
    this.wheels = wheels; // Safe to use.
  }
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Super Callbacks

**The mistake:** Passing methods from Super instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "super",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "super",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Super Operations

**The mistake:** Executing asynchronous operations within Super without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/super"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/super");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in super: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Implicit Super

**Problem:** What happens if you create a child class using `extends`, but you simply *don't write a constructor at all*? Will it crash because you didn't call `super()`?

**Expected output:**
> [!check]- Answer
> ```text
> It will NOT crash. If you leave the constructor out entirely, the JavaScript engine automatically creates a hidden constructor that simply calls `super(...args)` for you! You only need to manually write `super()` if you are explicitly writing a `constructor` block.
> ```
> - JavaScript is helpful when you leave the constructor blank.

---

### Exercise 2: Overriding and Calling Parent Methods with `super.method()`

**Problem:** Call `super.greet()` inside derived class `greet()` method.

**Expected output:**
> [!check]- Answer
> ```text
> Base Greet + Derived Extra
> ```
> ```javascript
> class Base { greet() { return "Base Greet"; } }
> class Child extends Base {
>   greet() { return `${super.greet()} + Derived Extra`; }
> }
> console.log(new Child().greet());
> ```
>
> **Explanation:** `super.method()` invokes parent prototype implementations within overridden subclass methods.

---

### Exercise 3: Mandatory `super()` Constructor Invocation

**Problem:** Demonstrate that referencing `this` before `super()` in a derived constructor throws `ReferenceError`.

**Expected output:**
> [!check]- Answer
> ```text
> ReferenceError caught
> ```
> ```javascript
> class Parent {}
> class Child extends Parent {
>   constructor() {
>     try {
>       this.name = "test";
>     } catch (err) {
>       console.log("ReferenceError caught");
>     }
>     super();
>   }
> }
> new Child();
> ```
>
> **Explanation:** Derived class constructors must call `super()` before accessing instance `this` bindings.


---

## 7. Related Terms
- [`extends`](./extends.md) — The keyword that creates the relationship requiring `super`.
- [Class](./class.md) — The parent structure.

---

## 8. Key Takeaways
- `super` is used to access and call functions on an object's parent.
- If a child class has a `constructor`, it MUST call `super()` before it is allowed to use the `this` keyword.
- `super()` calls the parent's constructor.
- `super.methodName()` calls a specific method on the parent, which is very useful when overriding methods.
