# Closure

> **Level 3 — Functions & Scope**
> A function bundled together with references to its surrounding lexical environment, allowing it to "remember" variables from its parent scope.

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code.
- [Scope](scope.md) — The current context of execution.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Normally, when a function finishes executing, all of its local variables are destroyed to free up memory. However, JavaScript allows you to return a *new* function from inside a function. If that inner function relies on variables from the outer function, destroying those variables would break the inner function.

To solve this, JavaScript created "Closures". A Closure is a feature where an inner function essentially "takes a snapshot" or "packs a backpack" of all the outer variables it needs to survive. Even after the outer function finishes and dies, the inner function continues to hold onto that backpack of data. This allows developers to create private, persistent state.

### (2) Reality Metaphor
Imagine you go to a bank (the outer function) to open a safety deposit box. You put $100 inside the box (a local variable). When you leave the bank, the bank locks its doors (the outer function finishes). However, the bank gave you a specific, unique key (the returned inner function). Even though the bank is closed to the public, you can use your key at any time to access your specific $100. The key "remembers" the box it belongs to.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
function createCounter() {
  let count = 0; // Local variable in outer function
  
  // Returning an inner function (Closure)
  return function() {
    count++; // It still has access to 'count'!
    return count;
  };
}

const myCounter = createCounter();
// The outer function has finished, but 'myCounter' remembers 'count'!
console.log(myCounter()); // 1
console.log(myCounter()); // 2
```

#### Fuller Example
```javascript
function createSecretAgent(name, startingHealth) {
  // These variables are completely private. 
  // No one outside the function can directly modify them!
  const agentName = name;
  let health = startingHealth;
  
  // We return an object full of methods (Closures) that interact with the private data
  return {
    takeDamage(amount) {
      health -= amount;
      console.log(`${agentName} took ${amount} damage. Health: ${health}`);
    },
    getHealth() {
      return health;
    }
  };
}

const jamesBond = createSecretAgent("007", 100);

// We interact with the closures
jamesBond.takeDamage(20); // 007 took 20 damage. Health: 80.

// We CANNOT access the variables directly! This is the power of Encapsulation via Closures.
console.log(jamesBond.health); // undefined
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Closure Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Closure blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "closure";
```

*Fix:*
```javascript
let value = "closure";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Closure Callbacks

**The mistake:** Passing methods from Closure instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "closure",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "closure",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Closure Operations

**The mistake:** Executing asynchronous operations within Closure without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/closure"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/closure");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in closure: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Build a Greeter

**Problem:** Write a function `createGreeter(greeting)` that returns an inner function. The inner function should accept a `name` and log `"[greeting], [name]!"`. 
Create two greeters: `sayHello = createGreeter("Hello")` and `sayHowdy = createGreeter("Howdy")`.

**Expected output:**
> [!check]- Answer
> ```text
> sayHello("Alice") -> "Hello, Alice!"
> sayHowdy("Bob") -> "Howdy, Bob!"
> ```
> - `function createGreeter(greeting) { return function(name) { console.log(...) } }`
> - Each time you call `createGreeter`, it creates a *new*, independent closure backpack.

---

### Exercise 2: Private Variable Counter Closure

**Problem:** Create `createCounter()` returning `{ inc(), dec(), get() }` wrapping a private `count` variable.

**Expected output:**
> [!check]- Answer
> ```text
> 1
> 2
> 1
> ```
> ```javascript
> function createCounter() {
>   let count = 0;
>   return {
>     inc() { count++; return count; },
>     dec() { count--; return count; },
>     get() { return count; }
>   };
> }
> const c = createCounter();
> console.log(c.inc());
> console.log(c.inc());
> console.log(c.dec());
> ```
>
> **Explanation:** Closures retain access to outer function scope variables even after parent functions return.

---

### Exercise 3: Function Factory with Closures

**Problem:** Write `multiplier(factor)` returning a function multiplying inputs by `factor`.

**Expected output:**
> [!check]- Answer
> ```text
> 30
> ```
> ```javascript
> function multiplier(factor) {
>   return (num) => num * factor;
> }
> const triple = multiplier(3);
> console.log(triple(10));
> ```
>
> **Explanation:** Closures capture configuration arguments (`factor`) across multiple subsequent invocations.

---

## 7. Related Terms
- [Scope](scope.md) — The rules defining variable visibility.
- [Higher-Order Function](higher_order_function.md) — A function that returns another function.
- [Lexical (Static) Scope / Environment](lexical_scope.md) — Related concept: Lexical (Static) Scope / Environment.
- [Reference vs Value (copy semantics)](../level_07/reference_vs_value.md) — Related concept: Reference vs Value (copy semantics).
- [Currying](../level_09/currying.md) — Related concept: Currying.
- [Debounce](../level_09/debounce.md) — Related concept: Debounce.
- [Garbage Collection](../level_09/garbage_collection.md) — Related concept: Garbage Collection.
- [Memoization](../level_09/memoization.md) — Related concept: Memoization.
- [Throttle](../level_09/throttle.md) — Related concept: Throttle.

---

## 8. Key Takeaways
- A Closure happens automatically when a function is defined inside another function.
- The inner function "remembers" the variables from the outer function, even after the outer function finishes executing.
- Closures are widely used in JavaScript to create private variables and encapsulate logic.
