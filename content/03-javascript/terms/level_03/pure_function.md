# Pure Function & Side Effects

> **Level 3 — Functions & Scope**
> Output depends only on input; no external mutation.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — A reusable block of code designed to perform a particular task.
- [Parameters](../level_03/parameters.md) — The named variables listed in the function definition.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In software development, debugging logic errors is a major time sink. If functions frequently modify global variables, read system times, write to databases, or mutate array arguments in-place, the application state becomes unpredictable. Such external changes are called **Side Effects**. 

To make programs easier to test, run, and reason about, developers use **Pure Functions**. A pure function is a mathematical concept:
1. **Determinism:** Given the exact same inputs (arguments), it will *always* return the exact same output.
2. **Zero Side Effects:** It does not read or modify any state outside its own scope, nor does it mutate its input parameters.

By writing pure functions, you eliminate unpredictable bugs, making your code thread-safe and trivial to unit test.

### (2) Reality Metaphor
- A **Pure Function** is like a standard soda vending machine. You insert $2.00 and press the "Cola" button (inputs). The machine always drops a cold can of Cola (output). It does not change the price of shoes in the store next door, write on your bank card, or clean the floor (no side effects).
- An **Impure Function** is like a human restaurant waiter. You order a Cola. The waiter notes it on your bill (modifying external state), walks to the kitchen, changes the restaurant's inventory count, and might accidentally spill some water on the floor (side effects).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Impure Function (depends on and mutates external state)
let taxMultiplier = 0.08;
function calculateTaxImpure(amount) {
  return amount * taxMultiplier; // If taxMultiplier changes, output changes! (Impure)
}

// Pure Function (output depends solely on inputs, no side effects)
function calculateTaxPure(amount, rate) {
  return amount * rate; 
}
console.log(calculateTaxPure(100, 0.08)); // Always 8
```

#### Fuller Example
```javascript
// A shopping cart update scenario demonstrating impurity vs purity
const originalCart = ["Book", "Pen"];

// IMPURE APPROACH: Modifies the array passed in (Side Effect!)
function addToCartImpure(cart, item) {
  cart.push(item); // Mutates the original array in place!
  return cart;
}

const updatedCartImpure = addToCartImpure(originalCart, "Notebook");
console.log("Original Cart:", originalCart); // [ 'Book', 'Pen', 'Notebook' ] (changed!)

// PURE APPROACH: Produces a new copy without modifying inputs
const freshCart = ["Book", "Pen"];

function addToCartPure(cart, item) {
  // Use spread syntax to copy array, then append item
  return [...cart, item]; 
}

const updatedCartPure = addToCartPure(freshCart, "Notebook");
console.log("Fresh Cart:", freshCart); // [ 'Book', 'Pen' ] (unchanged - pure!)
console.log("Updated Cart:", updatedCartPure); // [ 'Book', 'Pen', 'Notebook' ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mutating Object Parameters

**The mistake:** Assuming a function is pure because it doesn't touch global variables, but it mutates properties of objects passed as arguments.

**Why it's wrong:** Objects are passed by reference in JavaScript. If you modify a property of a passed object, that change affects the parent context, creating a side effect.

*Incorrect:*
```javascript
const userProfile = { name: "Brendan", score: 10 };

function updateScoreImpure(user) {
  user.score += 5; // Mutates original object!
  return user;
}

updateScoreImpure(userProfile);
console.log(userProfile.score); // 15
```

*Fix:*
```javascript
const userProfile = { name: "Brendan", score: 10 };

function updateScorePure(user) {
  // Return a new copy of the object using spread syntax
  return {
    ...user,
    score: user.score + 5
  };
}

const newProfile = updateScorePure(userProfile);
console.log(userProfile.score); // 10 (original safe!)
console.log(newProfile.score);  // 15
```

---

### Mistake 2: Losing Context Binding (`this`) in Pure Function Callbacks

**The mistake:** Passing methods from Pure Function instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "pure_function",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "pure_function",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Pure Function Operations

**The mistake:** Executing asynchronous operations within Pure Function without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/pure_function"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/pure_function");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in pure_function: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Identify Pure vs Impure Functions

**Problem:** Determine whether each function is pure or impure and explain why.

```javascript
// Function A
function greet(name) {
  return `Hello, ${name}!`;
}

// Function B
function logMessage(msg) {
  console.log(msg);
  return msg;
}

// Function C
function getMidnightTime() {
  return new Date().setHours(0, 0, 0, 0);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Function A: Pure (Deterministic, no side effects).
> Function B: Impure (console.log is a side effect that writes to standard output).
> Function C: Impure (Depends on new Date(), which reads the external system clock).
> ```
> - Any write operation (to console, disk, screen, network) is a side effect.
> - Any reliance on non-arguments (like time, random numbers) breaks determinism.

---

### Exercise 2: Refactoring Impure Array Mutator to Pure Function

**Problem:** Refactor `function addGuest(arr, guest) { arr.push(guest); return arr; }` into a pure function using `concat` or spread.

**Expected output:**
> [!check]- Answer
> ```text
> Original len: 1, New len: 2
> ```
> ```javascript
> function addGuestPure(arr, guest) {
>   return [...arr, guest];
> }
> const orig = ["Alice"];
> const updated = addGuestPure(orig, "Bob");
> console.log(`Original len: ${orig.length}, New len: ${updated.length}`);
> ```
>
> **Explanation:** Pure functions return new data structures without mutating original input references.

---

### Exercise 3: Testing Function Determinism

**Problem:** Demonstrate that calling pure function `add(2, 3)` multiple times always returns identical output `5`.

**Expected output:**
> [!check]- Answer
> ```text
> 5
> 5
> 5
> ```
> ```javascript
> const add = (a, b) => a + b;
> console.log(add(2, 3));
> console.log(add(2, 3));
> console.log(add(2, 3));
> ```
>
> **Explanation:** Pure functions are deterministic: identical inputs produce identical outputs unconditionally.


---

## 7. Related Terms
- [Immutability](../level_09/immutability.md) — The practice of creating new data structures rather than modifying existing ones.
- [Functional Programming & Composition](../level_09/functional_programming.md) — A coding paradigm built on pure functions.

---

## 8. Key Takeaways
- A pure function is deterministic: identical arguments always yield identical return values.
- Pure functions perform no side effects: they do not modify global variables, mutate passed objects, or write to standard outputs/APIs.
- Writing pure functions makes code predictable, modular, and extremely easy to test and debug.
