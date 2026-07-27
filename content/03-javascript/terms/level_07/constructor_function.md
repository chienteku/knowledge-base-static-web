# Constructor Function

> **Level 7 — Objects & Prototypes**
> A standard function invoked with the `new` keyword used to create multiple instances of an object.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — A block of code.
- [`this` Keyword](./this_keyword.md) — Used heavily inside constructors.
- [Prototypal Inheritance](./prototypal_inheritance.md) — How constructors share methods.

---

## 2. Term Category
- **Design Pattern / Language Core**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you need to create 100 `User` objects, typing out `{ name: "...", age: ... }` 100 times is terrible. You need a "factory" to generate them. 

While you could write a normal factory function that returns an object, JavaScript designers wanted to mimic the feel of traditional "Classes" found in languages like Java. They introduced the **Constructor Function** pattern. By convention, a Constructor Function is capitalized (e.g., `User`). When you call it using the special `new` keyword, the engine automatically creates a fresh, empty object, assigns that object to `this`, runs your setup code, and automatically links the new object to the Constructor's prototype!

### (2) Reality Metaphor
A Constructor Function is like a car manufacturing robot.
You don't build a car by hand. You just press a button (`new`), tell the robot what color you want ("Red"), and the robot automatically grabs an empty chassis (`this = {}`), paints it red (`this.color = "Red"`), attaches it to the standard car manual (the Prototype), and rolls the finished car off the assembly line (`return this`).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// By convention, Constructors are Capitalized!
function Car(make, model) {
  // 'this' is automatically created for us as an empty object {}
  this.make = make;
  this.model = model;
  this.wheels = 4;
  // It automatically returns 'this' at the end!
}

// We MUST use the 'new' keyword!
const myCar = new Car("Toyota", "Corolla");
console.log(myCar.make); // "Toyota"
```

#### Fuller Example: Adding Methods to the Prototype
```javascript
function User(username, age) {
  this.username = username;
  this.age = age;
  
  // WARNING: Don't put methods inside the constructor!
  // It will create a physical copy of the function for every user!
  // this.login = function() { ... }
}

// CORRECT WAY: Put methods on the Constructor's Prototype!
// Now, all 10,000 users will share this single function in memory.
User.prototype.login = function() {
  console.log(`${this.username} has logged in.`);
};

const user1 = new User("Alice123", 28);
const user2 = new User("Bob456", 34);

user1.login(); // "Alice123 has logged in."
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Constructor Function Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Constructor Function blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "constructor_function";
```

*Fix:*
```javascript
let value = "constructor_function";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Constructor Function Callbacks

**The mistake:** Passing methods from Constructor Function instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "constructor_function",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "constructor_function",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Constructor Function Operations

**The mistake:** Executing asynchronous operations within Constructor Function without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/constructor_function"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/constructor_function");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in constructor_function: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Capitalization Convention

**Problem:** Does the JavaScript engine *require* Constructor Functions to start with a capital letter? What happens if you use lowercase?

**Expected output:**
```text
No, the engine doesn't care about capitalization. It will work perfectly fine. 
However, it is a strict community convention to capitalize them so that human developers instantly know they MUST use the `new` keyword when calling it.
```

> [!check]- Answer
> - Capitalization is for humans, not for the compiler!

---

### Exercise 2: Constructor Function Prototype Methods

**Problem:** Create constructor `function Car(make)` and attach `Car.prototype.getMake = function() { return this.make; }`.

**Expected output:**
```text
Toyota
```

> [!check]- Answer
> ```javascript
> function Car(make) {
>   this.make = make;
> }
> Car.prototype.getMake = function() {
>   return this.make;
> };
> const c = new Car("Toyota");
> console.log(c.getMake());
> ```
>
> **Explanation:** Attaching methods to constructor `.prototype` shares 1 function instance across all created instances.

### Exercise 3: Guarding Constructors Against Omitted `new`

**Problem:** Write a self-correcting constructor `function Point(x)` using `new.target`.

**Expected output:**
```text
10
```

> [!check]- Answer
> ```javascript
> function Point(x) {
>   if (!new.target) return new Point(x);
>   this.x = x;
> }
> const p = Point(10);
> console.log(p.x);
> ```
>
> **Explanation:** `new.target` evaluates to the constructor function if called with `new`, and `undefined` if called normally.

---

---

## 7. Related Terms
- [`new` Keyword](./new_keyword.md) — The magic word that makes Constructors work.
- [Class](./class.md) — The modern ES6 syntax that completely replaces Constructor Functions.

---

## 8. Key Takeaways
- Constructor Functions are templates used to generate multiple similar objects.
- They are capitalized by convention.
- They must be invoked with the `new` keyword.
- Local data goes inside the constructor (`this.name = ...`).
- Shared methods go on the constructor's prototype (`Constructor.prototype.method = ...`).
