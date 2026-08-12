# Math object

> **Level 2 — Control Flow & Data Structures**
> Built-in math utilities (`round`, `random`, `max`…).

---

## 1. Prerequisites
- [Number](../level_01/number.md) — Represents both integer and floating-point numbers.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Math object is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Financial Currency Rounding & Cent Calculator

**Scenario:** A financial ledger formats currency values using Math.floor(), Math.ceil(), and Math.round() to compute tax rounding, tip allocations, and cent conversions.

**Requirements:**
1. Write calculateCurrencyRounding(amount).
2. Compute floorVal using Math.floor(amount).
3. Compute ceilVal using Math.ceil(amount).
4. Compute roundVal using Math.round(amount).
5. Return object with computed values.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateCurrencyRounding(amount) {
>   return {
>     floorVal: Math.floor(amount),
>     ceilVal: Math.ceil(amount),
>     roundVal: Math.round(amount)
>   };
> }
>
> // Verification tests
> const res = calculateCurrencyRounding(12.75);
> console.assert(res.floorVal === 12, "Test 1 Failed");
> console.assert(res.ceilVal === 13, "Test 2 Failed");
> console.assert(res.roundVal === 13, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Math Namespace Object**: Math is a built-in static object; it is not a constructor and cannot be instantiated with new Math().
> 2. **Rounding Functions**: Math.floor() rounds down, Math.ceil() rounds up, and Math.round() rounds to nearest integer.
> 3. **Static Method Execution**: Methods on Math are invoked directly as static properties (Math.floor(x)).
> 
---

### Exercise 2: Geometric 2D Distance & Vector Magnitude Calculator

**Scenario:** A 2D game physics engine computes Euclidean distance between two spatial coordinates using Math.hypot(), Math.pow(), and Math.sqrt().

**Requirements:**
1. Write calculateDistance(x1, y1, x2, y2).
2. Compute dx = x2 - x1 and dy = y2 - y1.
3. Calculate distance using Math.hypot(dx, dy).
4. Return rounded distance value.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateDistance(x1, y1, x2, y2) {
>   const dx = x2 - x1;
>   const dy = y2 - y1;
>   const distance = Math.hypot(dx, dy);
>   return Number(distance.toFixed(2));
> }
>
> // Verification tests
> const dist = calculateDistance(0, 0, 3, 4);
> console.assert(dist === 5.00, "Test 1 Failed: Pythagorean distance 3-4-5 failed");
> ```
>
> #### Technical Explanation
>
> 1. **Math.hypot() Method**: Math.hypot(...args) computes square root of sum of squares, preventing intermediate overflow/underflow errors.
> 2. **Mathematical Constants**: Static properties like Math.PI and Math.E provide high-precision mathematical constants.
> 3. **Floating-Point Inputs**: Math methods accept numeric primitives and implicitly coerce string numbers via ToNumber.
> 
---

### Exercise 3: Bounded Random Integer PIN Generator

**Scenario:** A security utility generates random numeric PIN codes within a specified min/max range using Math.random() and Math.floor().

**Requirements:**
1. Write generateRandomPin(min, max).
2. Compute random integer using Math.floor(Math.random() * (max - min + 1)) + min.
3. Return generated integer PIN.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function generateRandomPin(min, max) {
>   if (min > max) throw new Error("Min cannot exceed max");
>   const randomFloat = Math.random();
>   const scaledPin = Math.floor(randomFloat * (max - min + 1)) + min;
>   return scaledPin;
> }
>
> // Verification tests
> const pin = generateRandomPin(1000, 9999);
> console.assert(pin >= 1000 && pin <= 9999, "Test 1 Failed: PIN out of range");
> console.assert(Number.isInteger(pin), "Test 2 Failed: PIN must be an integer");
> ```
>
> #### Technical Explanation
>
> 1. **Math.random() Behavior**: Math.random() generates a pseudo-random floating-point number in range [0, 1) (inclusive of 0, exclusive of 1).
> 2. **Range Scaling Formula**: Formula Math.floor(Math.random() * (max - min + 1)) + min maps uniform distribution across integer boundaries.
> 3. **Math Object Immutability**: Built-in Math object properties are non-configurable and read-only.
---

## 6. Related Terms
- [Number](../level_01/number.md) — The data type `Math` operates on.
- [Number Methods & Parsing](number_methods.md) — Standard methods for type parsing.

---

## 7. Key Takeaways
- The global `Math` object contains static properties and helper functions for mathematical operations.
- `Math` is not a constructor; call all constants and methods directly on `Math` (e.g. `Math.PI`, `Math.sqrt(9)`).
- Rounding methods: `Math.round()` (nearest), `Math.floor()` (down), and `Math.ceil()` (up).
- `Math.random()` returns a pseudo-random decimal number in the range `[0, 1)`.
