# Functional Programming & Composition

> **Level 9 — Advanced Concepts & Patterns**
> Composing pure functions; `compose`/`pipe`.

---

## 1. Prerequisites
- [Pure Function & Side Effects](../level_03/pure_function.md) — The function design pattern requiring immutability and no side-effects.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Functional Programming (FP), we construct software applications by combining small, single-purpose, **pure functions**. Rather than writing massive class structures, we create simple functions that take data, transform it, and return a new result.

However, nesting multiple function calls together makes code extremely hard to read:
```javascript
const result = slugify(lowercase(trim(userInput))); // Nested from right-to-left!
```

To solve this and create clean data pipelines, we use **Function Composition**:
- **Composition** merges multiple functions into a single unified function. When data is passed to the merged function, it flows through each underlying function in sequence.
- **`compose(...fns)`:** Combines functions to run from **right-to-left** (matching the mathematical nesting order: $f(g(x))$).
- **`pipe(...fns)`:** Combines functions to run from **left-to-right** (matching standard reading order and logical data streams: $x \to f \to g$).

In JavaScript, both helpers are commonly implemented using `Array.prototype.reduce()` and `reduceRight()`.

### (2) Reality Metaphor
Imagine a manufacturing factory producing wooden toys.
- **Nested Functions** are like putting a block of raw wood inside a box, placing that box inside a carving crate, and placing the crate inside a paint drum. You have a nested, confusing structure where it is difficult to inspect the intermediate steps.
- **Function Composition (`pipe`)** is a clean, sequential **conveyor belt assembly line**:
  - Station 1: Sand the wood (`sand`).
  - Station 2: Carve the shape (`carve`).
  - Station 3: Paint it blue (`paint`).
- You construct this assembly line: `const createToy = pipe(sand, carve, paint);`. When you drop raw wood onto the conveyor belt (`createToy(wood)`), it flows from left-to-right through each station, outputting a finished toy.

### (3) JavaScript Code Examples

#### Implementing `compose` and `pipe` Helpers
```javascript
// compose: executes from right-to-left
const compose = (...fns) => (initialVal) => 
  fns.reduceRight((acc, fn) => fn(acc), initialVal);

// pipe: executes from left-to-right (recommended for readability)
const pipe = (...fns) => (initialVal) => 
  fns.reduce((acc, fn) => fn(acc), initialVal);

// Simple math operations
const add5 = x => x + 5;
const double = x => x * 2;
const square = x => x * x;

// 1. Using pipe: (x + 5) -> (* 2) -> (squared)
const pipePipeline = pipe(add5, double, square);
console.log(pipePipeline(5)); // ((5+5) * 2)^2 = (20)^2 = 400

// 2. Using compose: (squared) <- (* 2) <- (x + 5)
const composePipeline = compose(square, double, add5);
console.log(composePipeline(5)); // 400
```

#### Practical Text Normalization Pipeline
```javascript
const trim = str => str.trim();
const lowercase = str => str.toLowerCase();
const slugify = str => str.replace(/\s+/g, "-");

const normalizeTitle = pipe(trim, lowercase, slugify);

const rawTitle = "  My First JavaScript Term  ";
console.log(normalizeTitle(rawTitle)); // "my-first-javascript-term"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing the Execution Order of `compose` and `pipe`

**The mistake:** Writing a pipeline using `compose` expecting it to run in the order the arguments are written.

**Why it's wrong:** `compose` runs functions from right-to-left. If your functions depend on the output of previous steps, running them in reverse order will crash or return incorrect results.

*Incorrect:*
```javascript
const trimAndLength = compose(trim, (str) => str.length); // Error!
// Evaluates: trim(str.length) -> tries to trim a number!
```

*Fix:*
```javascript
// Use pipe for left-to-right order:
const trimAndLength = pipe(trim, (str) => str.length); 

// Or reverse the order inside compose:
const trimAndLength2 = compose((str) => str.length, trim);
```

---

### Mistake 2: Losing Context Binding (`this`) in Functional Programming Callbacks

**The mistake:** Passing methods from Functional Programming instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "functional_programming",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "functional_programming",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Functional Programming Operations

**The mistake:** Executing asynchronous operations within Functional Programming without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/functional_programming"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/functional_programming");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in functional_programming: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Create a Math Pipeline

**Problem:** Complete the pipeline `mathPipeline` using the `pipe` helper to subtract `2`, multiply the result by `10`, and convert it to a string.

```javascript
const pipe = (...fns) => (val) => fns.reduce((acc, fn) => fn(acc), val);

const subtract2 = x => x - 2;
const multiply10 = x => x * 10;
const toString = x => String(x);

// Build the pipeline
const mathPipeline = // Write pipe code here

console.log(mathPipeline(12)); // should be "100" (string)
console.log(typeof mathPipeline(12)); // "string"
```

> [!check]- Answer
> - Call `pipe(subtract2, multiply10, toString)`.

---

### Exercise 2: Immutability and Pure Functions in FP

**Problem:** Write a pure function `updateUser(user, newRole)` returning a new updated user object without mutating original input.

**Expected output:**
```text
Original: user, Updated: admin
```

> [!check]- Answer
> ```javascript
> function updateUser(user, newRole) {
>   return { ...user, role: newRole };
> }
> const orig = { name: "Alice", role: "user" };
> const updated = updateUser(orig, "admin");
> console.log(`Original: ${orig.role}, Updated: ${updated.role}`);
> ```
>
> **Explanation:** FP emphasizes pure functions and immutable data structures.

### Exercise 3: Function Composition Pipeline

**Problem:** Pipe value `5` through `add2` (+2) then `square` (^2).

**Expected output:**
```text
49
```

> [!check]- Answer
> ```javascript
> const add2 = x => x + 2;
> const square = x => x * x;
> const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
> console.log(pipe(add2, square)(5)); // (5+2)^2 = 49
> ```
>
> **Explanation:** Pipelines pass data outputs into subsequent transformation functions.

---

---

## 7. Related Terms
- [Currying](./currying.md) — Splitting parameters to prepare functions for composition.
- [Partial Application](./partial_application.md) — Pre-filling function parameters.

---

## 8. Key Takeaways
- Function Composition combines multiple small, pure functions into a single pipeline.
- `compose()` executes functions from right-to-left (inside-out).
- `pipe()` executes functions from left-to-right (data flow).
- Custom `compose` and `pipe` functions are written using `reduce` and `reduceRight` array helper methods.
- Composition promotes highly reusable, modular, and testable code structures.
