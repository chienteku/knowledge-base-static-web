# Infinity / -Infinity

> **Level 1 — Foundations**
> Numeric value beyond the max representable number.

---

## 1. Prerequisites
- [Number](number.md) — Represents both integer and floating-point numbers.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Computers represent numbers using binary bits. Because memory is finite, JavaScript's default numeric type (IEEE 754 64-bit float) has an upper boundary: `1.7976931348623157e+308`. Any calculation that exceeds this threshold overflows. 

In many programming languages, dividing a number by zero or overflowing a variable throws a critical error and stops execution. However, JavaScript was designed to run inside web browsers, where crashing the page is highly undesirable. 

To handle mathematical overflow safely, the TC39 committee implemented global variables: `Infinity` and `-Infinity`. Instead of crashing, operations that exceed bounds or divide by zero resolve to these special infinite numbers, allowing the program to continue running.

### (2) Reality Metaphor
`Infinity` is like a speedometer in a car that has a physical needle limit (e.g., 200 km/h). If you somehow attach rocket boosters to the car and go faster, the needle doesn't break the dashboard; it simply stays pinned at 200. No matter how much faster you go, the display remains pegged at the maximum limit.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
console.log(1 / 0);   // Infinity
console.log(-1 / 0);  // -Infinity
console.log(1.8e308); // Infinity (Overflow)
console.log(typeof Infinity); // "number"
```

#### Fuller Example
```javascript
// A simple temperature threshold and range check
function checkSensorReadings(value) {
  // Check if a reading is finite or has overflowed/errored
  if (!isFinite(value)) {
    console.log("Warning: Sensor reading is infinite or invalid!");
    return;
  }
  console.log(`Current sensor reading: ${value}`);
}

checkSensorReadings(150); // Current sensor reading: 150
checkSensorReadings(Infinity); // Warning: Sensor reading is infinite or invalid!

// Infinite values behave mathematically in standard ways:
console.log(Infinity + 1); // Infinity
console.log(Infinity - Infinity); // NaN (Undefined mathematical calculation)
console.log(10 / Infinity); // 0 (Limit approaches zero)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting Division by Zero to Throw an Error

**The mistake:** Assuming a division-by-zero check is unnecessary because the engine will throw an exception automatically.

**Why it's wrong:** In JavaScript, dividing any non-zero number by zero returns `Infinity` or `-Infinity`. It does not throw an error. If you write code expecting an error block to catch this, the program will silently propagate `Infinity` down the pipeline, leading to calculation bugs.

*Incorrect:*
```javascript
function divide(a, b) {
  try {
    return a / b;
  } catch (error) {
    // This catch block will NEVER run for division by zero!
    return "Error: Cannot divide by zero";
  }
}

console.log(divide(10, 0)); // Logs Infinity (not the error message)
```

*Fix:*
```javascript
function divide(a, b) {
  if (b === 0) {
    return "Error: Cannot divide by zero";
  }
  return a / b;
}

console.log(divide(10, 0)); // "Error: Cannot divide by zero"
```

---

### Mistake 2: Losing Context Binding (`this`) in Infinity Callbacks

**The mistake:** Passing methods from Infinity instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "infinity",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "infinity",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Infinity Operations

**The mistake:** Executing asynchronous operations within Infinity without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/infinity"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/infinity");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in infinity: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Infinity Check

**Problem:** Complete the code to check if a math multiplication result overflows the maximum safe integer limit.

```javascript
const initial = 1e308;
const doubled = initial * 2;

// Check if doubled is Infinite
const isInfinite = // Write code here

console.log("Is infinite:", isInfinite);
```

**Expected output:**
> [!check]- Answer
> ```text
> Is infinite: true
> ```
> - You can check if a value is strictly equal to `Infinity`.
> - Alternatively, you can use the global `isFinite(value)` function (which returns false for infinity).
> 
---

### Exercise 2: Division by Zero & Infinity Sign

**Problem:** Calculate `1 / 0`, `-1 / 0`, and `0 / 0`.

**Expected output:**
> [!check]- Answer
> ```text
> Infinity
> -Infinity
> NaN
> ```
> ```javascript
> console.log(1 / 0);   // Infinity
> console.log(-1 / 0);  // -Infinity
> console.log(0 / 0);   // NaN
> ```
>
> **Explanation:** Division by zero in JS yields positive or negative `Infinity` for non-zero numerators, and `NaN` for zero numerators.
> 
---

### Exercise 3: Checking Falsy vs Finite Numbers

**Problem:** Use `Number.isFinite()` to check `100`, `Infinity`, `"100"`, and `NaN`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> false
> false
> false
> ```
> ```javascript
> console.log(Number.isFinite(100));     // true
> console.log(Number.isFinite(Infinity));// false
> console.log(Number.isFinite("100"));   // false (no coercion)
> console.log(Number.isFinite(NaN));    // false
> ```
>
> **Explanation:** `Number.isFinite()` checks if a value is of type `number` and is neither `Infinity`, `-Infinity`, nor `NaN`.
> 
> 
---

## 7. Related Terms
- [NaN](nan.md) — Not-a-Number, another mathematical sentinel.
- [Arithmetic Operators](arithmetic_operators.md) — Standard symbols used for math calculations.

---

## 8. Key Takeaways
- `Infinity` and `-Infinity` are numeric representations of values that exceed bounds or involve division by zero.
- Division by zero in JavaScript does not throw an error; it returns `Infinity` (or `-Infinity` if dividing a negative number).
- Use `isFinite()` or compare directly with `Infinity` to detect overflows in calculations.
