# Math object

> **Level 2 — Control Flow & Data Structures**
> Built-in math utilities (`round`, `random`, `max`…).

---

## 1. Prerequisites
- [Number](../level_01/number.md) — Represents both integer and floating-point numbers.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In addition to basic arithmetic operators (like `+` and `-`), developers need ways to perform complex calculations, round numbers dynamically, and generate random values. Rather than forcing developers to write their own complex trigonometry, logarithm, or random number generator formulas, JavaScript provides a single built-in namespace object: **`Math`**. 

Unlike standard objects, `Math` is a static helper library built directly into the JavaScript engine. You do not instantiate it (using `new Math()`); instead, you access its mathematical constants (like `Math.PI`) and methods (like `Math.random()`) directly.

### (2) Reality Metaphor
The `Math` object is like a physical engineering toolbox kept in a workshop. It contains a collection of specialized calculators and tools: a protractor (`Math.sin`), a rounder (`Math.round`), a set of dice (`Math.random`), and reference sheets (`Math.PI`). You don't build a new toolbox; you just open the box on the shelf and pick the specific tool you need.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
console.log(Math.PI); // 3.141592653589793

// Standard rounding methods
console.log(Math.round(4.5)); // 5 (rounds to nearest)
console.log(Math.floor(4.9)); // 4 (rounds down)
console.log(Math.ceil(4.1));  // 5 (rounds up)

// Min and Max lookup
console.log(Math.max(10, 5, 20)); // 20
console.log(Math.min(10, 5, 20)); // 5
```

#### Fuller Example
```javascript
// A dice game roll generator and area calculator
const diceSides = 6;

// 1. Generate a random integer between 1 and 6
// Math.random() returns a decimal from 0 (inclusive) up to 1 (exclusive)
const randomFraction = Math.random();
const scaledValue = randomFraction * diceSides; // value between 0 and 5.999
const rolledValue = Math.floor(scaledValue) + 1; // round down and offset to make it 1-6

console.log("You rolled a:", rolledValue);

// 2. Calculate the area of a circle with a radius of 5
const radius = 5;
const circleArea = Math.PI * (radius ** 2);
console.log(`Circle Area: ${circleArea.toFixed(2)}`); // Circle Area: 78.54

// 3. Rounding financial entries
const rawPrice = 24.032;
console.log("Floor rounding:", Math.floor(rawPrice)); // 24
console.log("Ceil rounding:", Math.ceil(rawPrice));   // 25
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Instantiate the `Math` Object

**The mistake:** Writing `const myMath = new Math();` to use mathematical functions.

**Why it's wrong:** `Math` is a namespace object containing static properties and methods. It is not a constructor function and does not have a prototype. Trying to instantiate it throws a TypeError.

*Incorrect:*
```javascript
const calculator = new Math(); // TypeError: Math is not a constructor
const piVal = calculator.PI;
```

*Fix:*
```javascript
const piVal = Math.PI; // Access properties directly from the global Math object
```

### Mistake 2: Losing Context Binding (`this`) in Math Object Callbacks

**The mistake:** Passing methods from Math Object instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "math_object",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "math_object",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Math Object Operations

**The mistake:** Executing asynchronous operations within Math Object without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/math_object"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/math_object");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in math_object: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Range Randomizer

**Problem:** Complete the function `getRandomRange` to return a random integer between `min` (inclusive) and `max` (inclusive).

```javascript
function getRandomRange(min, max) {
  // Write formula here
}

console.log(getRandomRange(1, 10));
```

**Expected output:**
> [!check]- Answer
> ```text
> An integer between 1 and 10 (e.g. 7)
> ```
> - The size of the range is `(max - min + 1)`.
> - Multiply `Math.random()` by the range size.
> - Apply `Math.floor()` to round down, then add `min` to offset the starting number.
> 
---

### Exercise 2: Random Integer Generator in Range

**Problem:** Write a function `getRandomInt(min, max)` returning random inclusive integers between `min` and `max`.

**Expected output:**
> [!check]- Answer
> ```text
> Random integer in [1, 10]
> ```
> ```javascript
> function getRandomInt(min, max) {
>   return Math.floor(Math.random() * (max - min + 1)) + min;
> }
> const val = getRandomInt(1, 10);
> console.log(`Random integer in [1, 10]`);
> ```
>
> **Explanation:** `Math.random()` yields floats in $[0, 1)$. Multiplying by `(max - min + 1)` and flooring scales values into target integer ranges.
> 
---

### Exercise 3: Spreading Array Elements into `Math.max`

**Problem:** Find the maximum number in `[10, 50, 20]` using `Math.max(...nums)`.

**Expected output:**
> [!check]- Answer
> ```text
> 50
> ```
> ```javascript
> const nums = [10, 50, 20];
> console.log(Math.max(...nums));
> ```
>
> **Explanation:** `Math.max` accepts variable arguments, requiring the spread operator `...` when passing array elements.
> 
---

## 7. Related Terms
- [Number](../level_01/number.md) — The data type `Math` operates on.
- [Number Methods & Parsing](number_methods.md) — Standard methods for type parsing.

---

## 8. Key Takeaways
- The global `Math` object contains static properties and helper functions for mathematical operations.
- `Math` is not a constructor; call all constants and methods directly on `Math` (e.g. `Math.PI`, `Math.sqrt(9)`).
- Rounding methods: `Math.round()` (nearest), `Math.floor()` (down), and `Math.ceil()` (up).
- `Math.random()` returns a pseudo-random decimal number in the range `[0, 1)`.
