# Method

> **Level 2 — Control Flow & Data Structures**
> A function that is stored as a property of an object.

---

## 1. Prerequisites
- [Object](object.md) — A collection of key-value pairs.
- [Property](property.md) — An association between a key and a value in an object.

---

## 2. Term Category

**Object-Oriented Programming (Universal: Works everywhere)**: Method is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Bank Account Object with Mutation Methods

**Scenario:** A financial library implements a BankAccount object containing methods that mutate internal balance state using this binding.

**Requirements:**
1. Write createBankAccount(initialBalance).
2. Return object with methods deposit(amount), withdraw(amount), and getBalance().
3. Use this.balance inside methods.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createBankAccount(initialBalance) {
>   return {
>     balance: initialBalance,
>     deposit(amount) {
>       if (amount <= 0) return false;
>       this.balance += amount;
>       return true;
>     },
>     withdraw(amount) {
>       if (amount <= 0 || amount > this.balance) return false;
>       this.balance -= amount;
>       return true;
>     },
>     getBalance() {
>       return this.balance;
>     }
>   };
> }
>
> // Verification tests
> const account = createBankAccount(100);
> console.assert(account.deposit(50) === true, "Test 1 Failed");
> console.assert(account.getBalance() === 150, "Test 2 Failed");
> console.assert(account.withdraw(200) === false, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Method Definition**: A method is a function stored as a property of an object.
> 2. **Implicit 'this' Binding**: When a method is called via obj.method(), this implicitly binds to the invoking object obj.
> 3. **State Encapsulation**: Methods operate directly on an object's internal property states.
> 
---

### Exercise 2: Shopping Cart Aggregator & Formatter Methods

**Scenario:** A cart object manages an internal array of items, providing addItem(), getTotal(), and formatSummary() methods.

**Requirements:**
1. Write createShoppingCart().
2. Include items array and methods addItem(name, price), getTotal(), formatSummary().
3. Use shorthand method syntax.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createShoppingCart() {
>   return {
>     items: [],
>     addItem(name, price) {
>       this.items.push({ name, price });
>     },
>     getTotal() {
>       return this.items.reduce((sum, item) => sum + item.price, 0);
>     },
>     formatSummary() {
>       return `Items: ${this.items.length}, Total: $${this.getTotal().toFixed(2)}`;
>     }
>   };
> }
>
> // Verification tests
> const cart = createShoppingCart();
> cart.addItem("Book", 15);
> cart.addItem("Pen", 5);
> console.assert(cart.getTotal() === 20, "Test 1 Failed");
> console.assert(cart.formatSummary() === "Items: 2, Total: $20.00", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **ES6 Method Shorthand**: Syntax method() {} provides clean shorthand for method: function() {}.
> 2. **Inter-Method Invocation**: Methods can invoke sibling methods on the same object instance using this.otherMethod().
> 3. **Dynamic Invocation Context**: If a method is detached from its object (e.g. const fn = cart.getTotal), its this binding is lost.
> 
---

### Exercise 3: Fluent Calculator with Method Chaining

**Scenario:** A calculator utility implements methods (add, subtract, multiply) that return this to enable method chaining.

**Requirements:**
1. Write createFluentCalculator(initialVal).
2. Implement add(val), subtract(val), multiply(val), and getValue().
3. Return this from mutation methods.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createFluentCalculator(initialVal = 0) {
>   return {
>     value: initialVal,
>     add(val) {
>       this.value += val;
>       return this;
>     },
>     subtract(val) {
>       this.value -= val;
>       return this;
>     },
>     multiply(val) {
>       this.value *= val;
>       return this;
>     },
>     getValue() {
>       return this.value;
>     }
>   };
> }
>
> // Verification tests
> const calc = createFluentCalculator(10);
> const res = calc.add(5).subtract(2).multiply(3).getValue();
> console.assert(res === 39, "Test 1 Failed: Method chaining (10+5-2)*3 failed");
> ```
>
> #### Technical Explanation
>
> 1. **Method Chaining Pattern**: Returning this from mutation methods allows stringing sequential method calls together.
> 2. **Reference Preservation**: Each chained call operates on and returns the exact same object reference.
> 3. **Fluent Interface Design**: Improves code readability for stateful builder objects.
---

## 6. Related Terms
- [Object](object.md) — The container that holds the method.
- [Property](property.md) — A key-value pair (a method is just a property where the value is a function).
- [Property Access (dot vs bracket notation)](property_access.md) — Related concept: Property Access (dot vs bracket notation).
- [Arrow Function](../level_03/arrow_function.md) — Related concept: Arrow Function.

---

## 7. Key Takeaways
- A Method is simply a function that belongs to an object.
- You execute a method using dot notation followed by parentheses (e.g., `console.log()`).
- Inside a method, the `this` keyword refers to the object the method belongs to.
- Do not use Arrow Functions for object methods if you need to use the `this` keyword.
