# Constructor Function

> **Level 7 — Objects & Prototypes**
> A standard function invoked with the `new` keyword used to create multiple instances of an object.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — A block of code.
- [this Keyword](this_keyword.md) — Used heavily inside constructors.
- [Prototypal Inheritance](prototypal_inheritance.md) — How constructors share methods.

---

## 2. Term Category

**Design Pattern / Language Core (Universal)**: Constructor Function is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: ES5 Prototype-Based Constructor Function with New Guard

**Scenario:** A legacy JavaScript library implements constructor functions using function User(name) and attaches shared methods to User.prototype.

**Requirements:**
1. Write function User(name, role).
2. Enforce new keyword guard using new.target or instanceof.
3. Attach getRole() to User.prototype.
4. Return instance.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function User(name, role) {
>   if (!new.target && !(this instanceof User)) {
>     return new User(name, role);
>   }
>   this.name = name;
>   this.role = role;
> }
>
> User.prototype.getRole = function() {
>   return `${this.name}: ${this.role}`;
> };
>
> // Verification tests
> // @ts-ignore
> const u1 = User("Alice", "Admin"); // Auto-corrects missing 'new'
> console.assert(u1 instanceof User, "Test 1 Failed");
> console.assert(u1.getRole() === "Alice: Admin", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Constructor Functions**: Standard functions invoked with 'new' act as constructor functions instantiating new objects.
> 2. **prototype Method Sharing**: Attaching methods to Constructor.prototype avoids creating duplicate method functions for every instance.
> 3. **new.target Guard**: Checking new.target detects whether a constructor function was called with or without 'new'.
> 
---

### Exercise 2: Constructor Function Advanced Context Handler

**Scenario:** A web application component processes constructor function data operations within enterprise workflows.

**Requirements:**
1. Write handleConstructorFunctionSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleConstructorFunctionSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleConstructorFunctionSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Constructor Function Architecture**: Applying constructor function patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Constructor Function Performance Optimization

**Scenario:** An application utility optimizes constructor function execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeConstructorFunctionTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeConstructorFunctionTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeConstructorFunctionTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Constructor Function Optimization**: Optimizing constructor function improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [new Keyword](new_keyword.md) — The magic word that makes Constructors work.
- [Class](class.md) — The modern ES6 syntax that completely replaces Constructor Functions.
- [Default this Binding Rules](default_this_binding.md) — Related concept: Default this Binding Rules.

---

## 7. Key Takeaways
- Constructor Functions are templates used to generate multiple similar objects.
- They are capitalized by convention.
- They must be invoked with the `new` keyword.
- Local data goes inside the constructor (`this.name = ...`).
- Shared methods go on the constructor's prototype (`Constructor.prototype.method = ...`).
