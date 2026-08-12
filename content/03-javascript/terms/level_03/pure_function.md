# Pure Function & Side Effects

> **Level 3 — Functions & Scope**
> Output depends only on input; no external mutation.

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code designed to perform a particular task.
- [Parameters](parameters.md) — The named variables listed in the function definition.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Pure Function & Side Effects is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Side-Effect Free Financial Tax & Discount Calculator

**Scenario:** A financial calculation engine implements pure functions that compute price subtotals and discounts without mutating external variables or accessing non-deterministic state.

**Requirements:**
1. Write computePureInvoice(basePrice, taxRate, discount).
2. Compute total purely from arguments.
3. Ensure no external variables are modified.
4. Return computed total.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function computePureInvoice(basePrice, taxRate, discount) {
>   const discounted = basePrice - discount;
>   const tax = discounted * taxRate;
>   const finalTotal = discounted + tax;
>   return Number(finalTotal.toFixed(2));
> }
>
> // Verification tests
> const total1 = computePureInvoice(100, 0.10, 10);
> const total2 = computePureInvoice(100, 0.10, 10);
> console.assert(total1 === 99.00, "Test 1 Failed");
> console.assert(total1 === total2, "Test 2 Failed: Determinism check failed");
> ```
>
> #### Technical Explanation
>
> 1. **Pure Function Criteria**: A pure function is deterministic (given identical inputs, always returns identical outputs) and produces zero side-effects.
> 2. **Zero Side-Effects**: Does not mutate input arguments, global variables, or outer object states.
> 3. **Referential Transparency**: Pure function calls can be replaced by their evaluated values without altering program behavior.
> 
---

### Exercise 2: Pure State Transition Reducer

**Scenario:** An application state architecture implements pure reducer functions to derive new state objects using immutable update patterns.

**Requirements:**
1. Write pureReducer(state, action).
2. Return new state object via spread operator without mutating original input state.
3. Handle "ADD_ITEM" action.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function pureReducer(state, action) {
>   switch (action.type) {
>     case "ADD_ITEM":
>       return {
>         ...state,
>         items: [...state.items, action.payload]
>       };
>     default:
>       return state;
>   }
> }
>
> // Verification tests
> const initialState = Object.freeze({ items: ["Item 1"] });
> const nextState = pureReducer(initialState, { type: "ADD_ITEM", payload: "Item 2" });
>
> console.assert(initialState.items.length === 1, "Test 1 Failed: Original state mutated");
> console.assert(nextState.items.length === 2, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Immutable Data Updates**: Pure state reducers construct and return new state object copies rather than mutating inputs.
> 2. **Testability**: Pure functions are easy to unit-test because they rely exclusively on passed argument inputs.
> 3. **Predictable State Architecture**: Eliminates unexpected bugs caused by shared mutable state references.
> 
---

### Exercise 3: Pure Array Transformation Engine

**Scenario:** A data processing library implements pure utility functions that transform numeric arrays without mutating the source array.

**Requirements:**
1. Write pureSquareArray(numbers).
2. Return new array with squared values using .map().
3. Verify source numbers array remains un-mutated.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function pureSquareArray(numbers) {
>   return numbers.map(x => x * x);
> }
>
> // Verification tests
> const original = [1, 2, 3];
> const squared = pureSquareArray(original);
> console.assert(original.join(",") === "1,2,3", "Test 1 Failed: Input array mutated");
> console.assert(squared.join(",") === "1,4,9", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Non-Mutating Array Methods**: Methods like .map(), .filter(), and .reduce() return new array instances, supporting pure function patterns.
> 2. **Determinism**: Relies strictly on passed argument arrays without inspecting external non-deterministic data.
> 3. **Parallelization Safety**: Pure functions can be safely executed concurrently or memoized for performance.
---

## 6. Related Terms
- [Immutability](../level_09/immutability.md) — The practice of creating new data structures rather than modifying existing ones.
- [Functional Programming & Composition](../level_09/functional_programming.md) — A coding paradigm built on pure functions.
- [Method Chaining](../level_04/method_chaining.md) — Related concept: Method Chaining.
- [Unit Testing (Jest / Vitest)](../level_10/unit_testing.md) — Related concept: Unit Testing (Jest / Vitest).

---

## 7. Key Takeaways
- A pure function is deterministic: identical arguments always yield identical return values.
- Pure functions perform no side effects: they do not modify global variables, mutate passed objects, or write to standard outputs/APIs.
- Writing pure functions makes code predictable, modular, and extremely easy to test and debug.
