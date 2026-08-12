# let

> **Level 1 — Foundations**
> Block-scoped variable declaration. Allows reassignment and prevents redeclaration in the same scope.

---

## 1. Prerequisites
- [Variable](variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: let is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Before ES6 (ECMAScript 2015), JavaScript only had `var` for declaring variables. `var` had confusing scoping rules (it was function-scoped, not block-scoped) and allowed developers to accidentally redeclare the same variable multiple times without throwing an error. This led to unpredictable bugs, especially in loops and complex logic blocks. 

To fix this, the committee introduced `let`. It restricts the variable's scope strictly to the block `{}` it was defined in, and throws a loud error if you try to redeclare it in the same scope.

### (2) Reality Metaphor
Imagine a hotel room key (`let`). It only works for a specific room (its block scope). If you step outside that room, the key is useless. Also, the front desk won't issue two active keys with the exact same ID for the same room (preventing redeclaration).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
let counter = 0;
counter = 1; // Reassignment is perfectly fine with `let`
console.log(counter);
```

#### Fuller Example
```javascript
const maxScore = 100;

if (maxScore === 100) {
  // `bonus` only exists inside this `if` block
  let bonus = 20;
  console.log(`Score with bonus: ${maxScore + bonus}`);
}

try {
  // ReferenceError: bonus is not defined
  console.log(bonus); 
} catch (error) {
  console.error("Error caught:", error.message);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Redeclaring in the same scope

**The mistake:** Using `let` to declare the same variable name twice in the same block.

**Why it's wrong:** `let` strictly forbids redeclaration to protect you from accidentally overwriting variables.

*Incorrect:*
```javascript
let user = 'Alice';
let user = 'Bob'; // SyntaxError: Identifier 'user' has already been declared
```

*Fix:*
```javascript
let user = 'Alice';
user = 'Bob'; // Just reassign it without the `let` keyword
```

---

### Mistake 2: Losing Context Binding (`this`) in Let Callbacks

**The mistake:** Passing methods from Let instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "let",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "let",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Let Operations

**The mistake:** Executing asynchronous operations within Let without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/let"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/let");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in let: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Shopping Cart Reassignable Discount Accumulator

**Scenario:** An e-commerce checkout calculation applies step-by-step promo codes, updating a running total variable that requires reassignment across conditional blocks using let.

**Requirements:**
1. Declare a running total using let.
2. Reassign the total as discounts and taxes are applied.
3. Return the final calculated total.

> [!check]- Answer
> #### Implementation
> ```javascript
> function calculateCartTotal(initialSubtotal, couponCode) {
>   let total = initialSubtotal;
> if (couponCode === "SAVE10") {
>     total -= 10;
>   } else if (couponCode === "HALF") {
>     total /= 2;
>   }
> total *= 1.08;
> return Number(total.toFixed(2));
> }
> // Verification tests
> console.assert(calculateCartTotal(100, "SAVE10") === 97.20, "Test 1 Failed");
> console.assert(calculateCartTotal(100, "HALF") === 54.00, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Variable Reassignment**: Variables declared with let permit value reassignment (total = ...), unlike const.
> 2. **Block Scoping**: let bindings are scoped to the nearest enclosing block {}, avoiding variable leaks to outer scopes.
> 3. **Explicit Intent**: Using let explicitly communicates to developers that a variable's value will change over its lifecycle.
> 
---

### Exercise 2: Async Loop Index Scope Isolation

**Scenario:** A batch notification processor dispatches asynchronous tasks inside a loop. Using let creates an isolated lexical scope for each iteration, avoiding closure bugs.

**Requirements:**
1. Iterate over a list of items using a for loop with let i = 0.
2. Schedule asynchronous tasks referencing i.
3. Verify that each callback captures its corresponding iteration index.

> [!check]- Answer
> #### Implementation
> ```javascript
> function processBatchIndices(count) {
>   const capturedIndices = [];
> for (let i = 0; i < count; i++) {
>     capturedIndices.push(() => i);
>   }
> return capturedIndices.map(fn => fn());
> }
> // Verification tests
> const indices = processBatchIndices(3);
> console.assert(indices.join(",") === "0,1,2", "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Per-Iteration Scope**: In for (let i = 0; ...) loops, JavaScript creates a new i variable binding for every loop iteration.
> 2. **Closure Capture**: Functions created inside the loop capture the unique per-iteration let binding rather than a single shared variable.
> 3. **Contrast with var**: Unlike var (which shares one function-scoped variable across all iterations), let prevents async loop index bugs automatically.
> 
---

### Exercise 3: Temporal Dead Zone (TDZ) Inspection

**Scenario:** A developer refactors code to ensure let variables are not accessed before their declaration line, avoiding Temporal Dead Zone errors.

**Requirements:**
1. Demonstrate that accessing a let variable before declaration throws a ReferenceError.
2. Catch the TDZ exception safely.
3. Declare and initialize the variable properly.

> [!check]- Answer
> #### Implementation
> ```javascript
> function testTdzBehavior() {
>   let tdzTriggered = false;
> try {
>     // @ts-ignore
>     console.log(value);
>     let value = 100;
>   } catch (err) {
>     tdzTriggered = err instanceof ReferenceError;
>   }
> return tdzTriggered;
> }
> // Verification tests
> console.assert(testTdzBehavior() === true, "Test 1 Failed: Accessing let in TDZ must throw ReferenceError");
> ```
> #### Technical Explanation
> 1. **Temporal Dead Zone (TDZ)**: The period between scope entry and a let variable's actual declaration line is the TDZ.
> 2. **Reference Error**: Accessing a let variable while in the TDZ throws a runtime ReferenceError.
> 3. **Hoisting Behavior**: let variables are hoisted to top of block scope, but remain uninitialized until execution reaches the declaration statement.
---

## 6. Related Terms
- [Variable](variable.md) — A named container for storing data values.
- [const](const.md) — A block-scoped variable that cannot be reassigned.
- [Assignment Operators](assignment_operators.md) — Related concept: Assignment Operators.
- [var](var.md) — Related concept: var.
- [Block Scope](../level_03/block_scope.md) — Block scoping.

---

## 7. Key Takeaways
- Use `let` when you know a variable's value will change (e.g., counters in loops, state updates).
- `let` is block-scoped, meaning it only exists within the nearest set of curly braces `{}`.
- You can reassign a `let` variable, but you cannot redeclare it in the same scope.
