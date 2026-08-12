# Infinity / -Infinity

> **Level 1 — Foundations**
> Numeric value beyond the max representable number.

---

## 1. Prerequisites
- [Number](number.md) — Represents both integer and floating-point numbers.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Infinity / -Infinity is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: IoT Temperature Sensor Boundary Accumulator

**Scenario:** An IoT telemetry service tracks minimum and maximum temperature readings over time. It initializes minimum and maximum tracker variables using Infinity and -Infinity to guarantee any real sensor reading updates the boundaries.

**Requirements:**
1. Initialize minTemp to Infinity and maxTemp to -Infinity.
2. Process an array of numeric readings.
3. Return an object { min, max }.

> [!check]- Answer
> #### Implementation
> ```javascript
> function findSensorExtremes(readings) {
>   if (!Array.isArray(readings) || readings.length === 0) {
>     return { min: null, max: null };
>   }
> let minTemp = Infinity;
>   let maxTemp = -Infinity;
> for (const temp of readings) {
>     if (temp < minTemp) minTemp = temp;
>     if (temp > maxTemp) maxTemp = temp;
>   }
> return { min: minTemp, max: maxTemp };
> }
> // Verification tests
> const res = findSensorExtremes([21.5, -4.2, 38.0, 15.1]);
> console.assert(res.min === -4.2, "Test 1 Failed");
> console.assert(res.max === 38.0, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Mathematical Identity Neutrality**: Infinity is greater than any finite number, and -Infinity is smaller than any finite number, making them ideal baseline initializers.
> 2. **Special Primitive Values**: Infinity and -Infinity are global numeric property values representing positive and negative infinity.
> 3. **Type Identification**: typeof Infinity evaluates to "number".
> 
---

### Exercise 2: Division by Zero Safety Sentinel

**Scenario:** A financial analytics risk calculator detects division by zero operations that produce Infinity and sanitizes values before sending JSON responses to clients.

**Requirements:**
1. Write a function calculateFinancialRatio(numerator, denominator).
2. Check if the division produces an infinite value using Number.isFinite().
3. Return null for non-finite results, or the calculated ratio.

> [!check]- Answer
> #### Implementation
> ```javascript
> function calculateFinancialRatio(numerator, denominator) {
>   const ratio = numerator / denominator;
> if (!Number.isFinite(ratio)) {
>     return null;
>   }
> return ratio;
> }
> // Verification tests
> console.assert(calculateFinancialRatio(100, 2) === 50, "Test 1 Failed");
> console.assert(calculateFinancialRatio(100, 0) === null, "Test 2 Failed: Division by zero should return null");
> console.assert(calculateFinancialRatio(-50, 0) === null, "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Division by Zero Behavior**: In JavaScript, dividing a non-zero number by zero does not throw an error; it returns Infinity (or -Infinity).
> 2. **Finite Validation**: Number.isFinite(val) strictly checks if a value is a primitive number that is neither Infinity, -Infinity, nor NaN.
> 3. **JSON Serialization Safeguard**: JSON.stringify() converts Infinity and -Infinity into null, making explicit validation essential.
> 
---

### Exercise 3: Graph Unreachable Node Distance Initializer

**Scenario:** A routing algorithm populates a distance array for graph nodes, initializing unvisited node distances to Infinity to represent infinite path cost.

**Requirements:**
1. Create a distance matrix for N nodes.
2. Initialize all node distances to Infinity, except starting node (set to 0).
3. Update distance if a shorter path is found.

> [!check]- Answer
> #### Implementation
> ```javascript
> function initializeNodeDistances(nodeCount, startNode) {
>   const distances = new Array(nodeCount).fill(Infinity);
> if (startNode >= 0 && startNode < nodeCount) {
>     distances[startNode] = 0;
>   }
> return distances;
> }
> // Verification tests
> const dists = initializeNodeDistances(4, 0);
> console.assert(dists[0] === 0, "Test 1 Failed");
> console.assert(dists[1] === Infinity && dists[2] === Infinity, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Pathfinding Identity**: Setting unvisited nodes to Infinity guarantees that any real edge weight comparison (newDist < distances[v]) evaluates to true.
> 2. **Global Constants**: Infinity is equivalent to Number.POSITIVE_INFINITY.
> 3. **Relational Consistency**: Infinity > 1e308 evaluates to true.
---

## 6. Related Terms
- [NaN](nan.md) — Not-a-Number, another mathematical sentinel.
- [Arithmetic Operators](arithmetic_operators.md) — Standard symbols used for math calculations.

---

## 7. Key Takeaways
- `Infinity` and `-Infinity` are numeric representations of values that exceed bounds or involve division by zero.
- Division by zero in JavaScript does not throw an error; it returns `Infinity` (or `-Infinity` if dividing a negative number).
- Use `isFinite()` or compare directly with `Infinity` to detect overflows in calculations.
