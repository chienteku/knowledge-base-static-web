# Default Parameters

> **Level 8 — Modern JavaScript (ES6+)**
> Allows named function parameters to be initialized with default values if no value or `undefined` is passed.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The structure that uses parameters.
- [undefined](../level_01/undefined.md) — The value that triggers the default fallback.

---

## 2. Term Category
- **Syntax Feature** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, if you define a function that expects 3 arguments, but the user only passes 2, the engine doesn't crash. It simply sets the missing 3rd argument to `undefined`. 
Before ES6, developers had to write clunky `if` statements inside every function to check for `undefined` and assign fallback values manually (e.g., `if (color === undefined) color = "black";`).

ES6 introduced **Default Parameters**, allowing developers to assign fallback values directly inside the function signature `(color = "black")`. It makes the code instantly readable, self-documenting, and eliminates boilerplate checks.

### (2) Reality Metaphor
Imagine ordering a hamburger at a restaurant.
The waiter asks: "What kind of cheese do you want?" 
If you specify "Swiss", they give you Swiss.
If you say nothing at all (undefined), they automatically give you "American", because that is the Default Parameter established by the restaurant.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// We assign a default value right in the parameter list!
function greet(name = "Guest") {
  console.log(`Welcome, ${name}!`);
}

greet("Alice"); // "Welcome, Alice!"
greet();        // "Welcome, Guest!" (Fell back to default)
```

#### Fuller Example: Multiple Parameters and Expressions
```javascript
// Default parameters can be complex expressions or function calls!
function calculatePrice(price, taxRate = 0.05, discount = 0) {
  const total = price + (price * taxRate) - discount;
  return total;
}

// 1. Using all provided values
console.log(calculatePrice(100, 0.10, 5)); // 105

// 2. Omitting the last two (falling back to defaults)
console.log(calculatePrice(100)); // 105 (tax is 0.05, discount is 0)

// 3. Omitting the middle one? 
// You MUST pass explicitly 'undefined' to trigger the default!
console.log(calculatePrice(100, undefined, 20)); // 85
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Default Parameters Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Default Parameters blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "default_parameters";
```

*Fix:*
```javascript
let value = "default_parameters";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Default Parameters Callbacks

**The mistake:** Passing methods from Default Parameters instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "default_parameters",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "default_parameters",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Default Parameters Operations

**The mistake:** Executing asynchronous operations within Default Parameters without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/default_parameters"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/default_parameters");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in default_parameters: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Using previous parameters

**Problem:** Can a default parameter reference a parameter that comes *before* it in the same function signature?
```javascript
function makeGreeting(name, message = `Hello ${name}`) {
  console.log(message);
}
makeGreeting("Bob");
```

**Expected output:**
> [!check]- Answer
> ```text
> Yes! It will print `"Hello Bob"`.
> Default parameters are evaluated sequentially from left to right, so later parameters have full access to earlier ones.
> ```
> - The parameters exist in their own little mini-scope.
> 
---

### Exercise 2: Default Parameters Evaluation Timing

**Problem:** Demonstrate that default parameters evaluate at invocation time: `function add(a, b = a * 2)`.

**Expected output:**
> [!check]- Answer
> ```text
> 15
> ```
> ```javascript
> function add(a, b = a * 2) { return a + b; }
> console.log(add(5));
> ```
>
> **Explanation:** Default parameter expressions evaluate in parameter scope at runtime when invoked.
> 
---

### Exercise 3: Destructured Parameter Defaults

**Problem:** Provide defaults `{ port = 8080 } = {}` for destructured object parameters.

**Expected output:**
> [!check]- Answer
> ```text
> 8080
> ```
> ```javascript
> function start({ port = 8080 } = {}) { return port; }
> console.log(start());
> ```
>
> **Explanation:** Combining parameter destructuring with default initializers safely handles omitted arguments.
> 
> 
---

## 7. Related Terms
- [undefined](../level_01/undefined.md) — The *only* value that triggers a default parameter.
- [Destructuring](destructuring.md) — You can also use default parameters inside destructuring assignments!

---

## 8. Key Takeaways
- Default Parameters allow you to assign fallback values in the function signature using `=`.
- They are ONLY triggered if the argument is omitted entirely, or if you explicitly pass `undefined`.
- Falsy values like `null`, `0`, or `""` will *not* trigger the default.
- They make code cleaner by removing manual `undefined` checks.
```
