# Method

> **Level 2 — Control Flow & Data Structures**
> A function that is stored as a property of an object.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — A collection of key-value pairs.
- [Property](../level_02/property.md) — An association between a key and a value in an object.
- *Note: Familiarity with Functions is helpful, though they are fully covered in Level 3.*

---

## 2. Term Category
- **Object-Oriented Programming**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Objects are great for storing passive data (like `name` and `age`). But in Object-Oriented Programming, entities usually have behaviors, too. A `Dog` object shouldn't just have a `breed` property; it should also be able to `bark()`. 

Because functions in JavaScript are "first-class citizens" (meaning they can be passed around and assigned to variables just like strings or numbers), we can easily assign a function as the *value* of an object's property. When a function lives inside an object, we give it a special name: a "Method".

### (2) Reality Metaphor
If an Object is a smart speaker (like an Amazon Echo):
- Its **Properties** are its static data: `color: "black"`, `volume: 5`.
- Its **Methods** are its actions: `playMusic()`, `setAlarm()`.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const calculator = {
  brand: "Casio",          // Property (static data)
  add: function(a, b) {    // Method (action)
    return a + b;
  }
};

console.log(calculator.add(5, 10)); // 15
```

#### Fuller Example
```javascript
const player = {
  name: "Hero",
  health: 100,
  
  // Modern ES6 Method Syntax (shorthand, no 'function' keyword needed)
  takeDamage(amount) {
    // The `this` keyword refers to the object that owns the method!
    this.health = this.health - amount;
    console.log(`${this.name} took ${amount} damage! Health is now ${this.health}.`);
  }
};

player.takeDamage(20); // Hero took 20 damage! Health is now 80.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Losing `this` in Arrow Functions

**The mistake:** Using an ES6 Arrow Function (`() => {}`) to define a method inside an object, and expecting `this` to point to the object.

**Why it's wrong:** Arrow functions do not have their own `this` context; they inherit `this` from the surrounding lexical scope (usually the global window object). If you use `this.health` inside an arrow function method, it will likely return `undefined`.

*Incorrect:*
```javascript
const player = {
  health: 100,
  // Arrow function!
  takeDamage: (amount) => {
    this.health -= amount; // `this` is NOT the player object here!
  }
};
```

*Fix:*
```javascript
const player = {
  health: 100,
  // Use standard function syntax or ES6 method shorthand
  takeDamage(amount) {
    this.health -= amount; // Works perfectly!
  }
};
```

---

### Mistake 2: Losing Context Binding (`this`) in Method Callbacks

**The mistake:** Passing methods from Method instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "method",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "method",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Method Operations

**The mistake:** Executing asynchronous operations within Method without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/method"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/method");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in method: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Build a Greeter

**Problem:** Create an object called `robot` with a property `name` set to `"R2D2"`. Add a method called `greet` that logs `"Beep boop, I am R2D2"` using the `this` keyword to access the robot's name. Call the method.

**Expected output:**
> [!check]- Answer
> ```text
> Beep boop, I am R2D2
> ```
> - `const robot = { name: "R2D2", greet() { console.log(`Beep boop, I am ${this.name}`); } }`
> - Don't forget to call it: `robot.greet();`

---

### Exercise 2: Method Shorthand Syntax in Objects

**Problem:** Define an object `calculator` with method shorthand `add(a, b) { return a + b; }`.

**Expected output:**
> [!check]- Answer
> ```text
> 15
> ```
> ```javascript
> const calculator = {
>   add(a, b) {
>     return a + b;
>   }
> };
> console.log(calculator.add(10, 5));
> ```
>
> **Explanation:** ES6 method shorthand syntax `methodName() {}` defines clean object methods.

---

### Exercise 3: Binding Method `this` Context

**Problem:** Bind detached method `user.getName` to `user` using `.bind(user)`.

**Expected output:**
> [!check]- Answer
> ```text
> Alice
> ```
> ```javascript
> const user = {
>   name: "Alice",
>   getName() { return this.name; }
> };
> const unbound = user.getName;
> const bound = user.getName.bind(user);
> console.log(bound());
> ```
>
> **Explanation:** `Function.prototype.bind()` locks the explicit `this` target of functions regardless of how they are invoked.


---

## 7. Related Terms
- [Object](../level_02/object.md) — The container that holds the method.
- [Property](../level_02/property.md) — A key-value pair (a method is just a property where the value is a function).
- Function (Level 3) — A reusable block of code.

---

## 8. Key Takeaways
- A Method is simply a function that belongs to an object.
- You execute a method using dot notation followed by parentheses (e.g., `console.log()`).
- Inside a method, the `this` keyword refers to the object the method belongs to.
- Do not use Arrow Functions for object methods if you need to use the `this` keyword.
