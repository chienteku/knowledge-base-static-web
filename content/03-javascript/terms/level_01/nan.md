# NaN

> **Level 1 — Foundations**
> "Not-a-Number"; result of invalid math; not equal to itself.

---

## 1. Prerequisites
- [Number](number.md) — Represents both integer and floating-point numbers.
- [Type Coercion](type_coercion.md) — Automatic or implicit conversion of types.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: NaN is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In programming, computer programs must execute mathematical instructions. What happens when a user attempts to multiply a string by a number (e.g., `"apple" * 10`) or compute the square root of a negative number? The operation is mathematically invalid, but the program cannot simply crash. 

To prevent runtime crashes while staying compliant with the IEEE 754 floating-point standard, JavaScript includes a special numeric value: `NaN` (which stands for **Not-a-Number**). Crucially, even though it represents an invalid calculation, `NaN` is still technically a type of `Number` in the engine. It acts as a sentinel value, propagating through mathematical operations to signal that an error occurred.

### (2) Reality Metaphor
`NaN` is like the "ERROR" screen on a pocket calculator. If you try to divide a word by zero, the calculator doesn't explode; it displays "ERROR". The calculator is still functioning and displaying a state, but that state represents a mathematical impossibility.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const invalidMath = "hello" * 5; // NaN
console.log(invalidMath); // NaN
console.log(typeof invalidMath); // "number" (A classic JS gotcha!)

// NaN is contagious: any math on NaN yields NaN
console.log(invalidMath + 10); // NaN
```

#### Fuller Example
```javascript
// Processing input from a user form field
const rawUserInput = "45px";

// Attempt to parse input into a number
const userAge = Number(rawUserInput); // Cannot cleanly coerce "45px" to a number -> NaN

console.log("Parsed Age:", userAge); // Parsed Age: NaN

// CRITICAL GOTCHA: You cannot check for NaN using strict equality (===)!
// NaN is the ONLY value in JavaScript that is NOT equal to itself.
if (userAge === NaN) {
  console.log("This will NEVER run!");
}

// Correct approach: Use Number.isNaN() to check if a value is NaN
if (Number.isNaN(userAge)) {
  console.log("Validation Failed: The input is not a valid number.");
} else {
  console.log(`User age is ${userAge}`);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Comparing with `NaN` directly using `===`

**The mistake:** Writing `if (value === NaN)` to detect a `NaN` value.

**Why it's wrong:** According to the IEEE 754 spec, `NaN` is not equal to anything, including another `NaN`. Thus, `NaN === NaN` evaluates to `false`. Any equality check against `NaN` will always return `false`.

*Incorrect:*
```javascript
const result = parseInt("abc"); // NaN

if (result === NaN) { // Always false!
  console.log("Calculation failed.");
}
```

*Fix:*
```javascript
const result = parseInt("abc"); // NaN

// Use the dedicated Number.isNaN() method
if (Number.isNaN(result)) {
  console.log("Calculation failed.");
}
```

### Mistake 2: Confusing Global `isNaN()` with `Number.isNaN()`

**The mistake:** Using the global `isNaN()` function instead of `Number.isNaN()`.

**Why it's wrong:** The global `isNaN()` function implicitly coerces its input to a number *before* checking if it's NaN. For example, `isNaN("hello")` returns `true` because `"hello"` is coerced to `NaN`. This can lead to false positives. `Number.isNaN()` does not perform coercion and only returns `true` if the value is currently `NaN` and of type `number`.

*Incorrect:*
```javascript
console.log(isNaN("hello")); // true (coerces "hello" to NaN)
```

*Fix:*
```javascript
console.log(Number.isNaN("hello")); // false (type is String, not Number.isNaN)
console.log(Number.isNaN(NaN));      // true
```

---

### Mistake 3: Unhandled Asynchronous Failures in Nan Operations

**The mistake:** Executing asynchronous operations within Nan without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/nan"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/nan");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in nan: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Form Input Numeric Sanitizer

**Scenario:** A Web API parses numeric input strings from HTTP requests. Invalid numeric conversions produce NaN. The handler must detect NaN using Number.isNaN() and return a fallback default.

**Requirements:**
1. Parse string input using Number().
2. Check for NaN using Number.isNaN().
3. Return parsed number or default fallback value 0.

> [!check]- Answer
> #### Implementation
> ```javascript
> function parseNumericInput(rawInput, fallback = 0) {
>   const parsed = Number(rawInput);
>   if (Number.isNaN(parsed)) {
>     return fallback;
>   }
>   return parsed;
> }
> // Verification tests
> console.assert(parseNumericInput("42") === 42, "Test 1 Failed");
> console.assert(parseNumericInput("invalid") === 0, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Origin of NaN**: NaN ("Not-a-Number") is a special primitive numeric value returned when mathematical operations or type conversions fail.
> 2. **Strict Number.isNaN()**: Number.isNaN(val) strictly checks if val is of type number AND equals NaN, avoiding false positives from global isNaN().
> 3. **Type Identity**: typeof NaN evaluates to "number".
> 
---

### Exercise 2: Toxic NaN Propagation Filter in Transaction Totals

**Scenario:** A financial reporting tool sums array transaction amounts. A single NaN entry will infect the entire calculation result, making the total NaN. The aggregator must filter out NaN entries.

**Requirements:**
1. Write sumValidAmounts(amounts).
2. Filter out NaN entries using Number.isNaN().
3. Return the sum of valid numbers.

> [!check]- Answer
> #### Implementation
> ```javascript
> function sumValidAmounts(amounts) {
>   if (!Array.isArray(amounts)) return 0;
>   return amounts.reduce((sum, val) => {
>     const num = Number(val);
>     if (Number.isNaN(num)) return sum;
>     return sum + num;
>   }, 0);
> }
> // Verification tests
> console.assert(sumValidAmounts([10, 20, "invalid", 30]) === 60, "Test 1 Failed");
> console.assert(sumValidAmounts([5, NaN, 15]) === 20, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Toxic Propagation**: Any arithmetic operation involving NaN (e.g. 5 + NaN) results in NaN.
> 2. **Reflexivity Failure**: NaN is the only value in JavaScript that is NOT equal to itself (NaN === NaN is false).
> 3. **Defensive Filtering**: Filtering out NaN prior to summation preserves calculation integrity.
> 
---

### Exercise 3: Safe Square Root Calculation Engine

**Scenario:** A mathematical engine calculates square roots. Passing negative numbers to Math.sqrt() produces NaN. The engine must detect NaN and return a complex number indicator object.

**Requirements:**
1. Compute Math.sqrt(val).
2. Detect NaN result.
3. Return { value: number, isReal: boolean }.

> [!check]- Answer
> #### Implementation
> ```javascript
> function safeSquareRoot(val) {
>   const result = Math.sqrt(val);
>   if (Number.isNaN(result)) {
>     return { value: 0, isReal: false };
>   }
>   return { value: result, isReal: true };
> }
> // Verification tests
> const r1 = safeSquareRoot(16);
> console.assert(r1.value === 4 && r1.isReal === true, "Test 1 Failed");
> const r2 = safeSquareRoot(-9);
> console.assert(r2.value === 0 && r2.isReal === false, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Domain Errors**: Invalid domain operations (like square root of negative numbers) return NaN.
> 2. **Self-Comparison Check**: Alternatively, val !== val evaluates to true if and only if val is NaN.
> 3. **Object.is() Support**: Object.is(NaN, NaN) evaluates to true, fixing standard === reflexivity limits.
---

## 6. Related Terms
- [Strict vs Loose Equality (=== vs ==)](strict_vs_loose_equality.md) — Equality operations.
- [Number Methods & Parsing](../level_02/number_methods.md) — Methods like `parseInt` that can yield `NaN`.
- [Arithmetic Operators](arithmetic_operators.md) — Related concept: Arithmetic Operators.
- [Infinity / -Infinity](infinity.md) — Related concept: Infinity / -Infinity.

---

## 7. Key Takeaways
- `NaN` stands for "Not-a-Number", representing an invalid mathematical result.
- Despite its name, the type of `NaN` is `"number"`.
- `NaN` is not equal to itself or any other value; you must use `Number.isNaN()` to check for it.
- Operations involving `NaN` will propagate, always returning `NaN`.
