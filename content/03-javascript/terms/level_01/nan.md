# NaN

> **Level 1 — Foundations**
> "Not-a-Number"; result of invalid math; not equal to itself.

---

## 1. Prerequisites
- [Number](../level_01/number.md) — Represents both integer and floating-point numbers.
- [Type Coercion](../level_01/type_coercion.md) — Automatic or implicit conversion of types.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: NaN Checker

**Problem:** Complete the function `isValidScore` to check if a score input is a valid numeric score (not `NaN` and is of type `number`).

```javascript
function isValidScore(score) {
  // Return true if score is a valid number, false if it's NaN or not a number
}

console.log(isValidScore(95));
console.log(isValidScore(NaN));
console.log(isValidScore("95"));
```

**Expected output:**
```text
true
false
false
```

> [!check]- Answer
> - First check if `typeof score === "number"`.
> - Then check if it is not `NaN` using `!Number.isNaN(score)`.

---

### Exercise 2: Number.isNaN Validation

**Problem:** Validate user input `"abc"` to check if `Number(input)` yields `NaN`.

**Expected output:**
```text
Is NaN: true
```

> [!check]- Answer
> ```javascript
> const val = Number("abc");
> console.log(`Is NaN: ${Number.isNaN(val)}`);
> ```
>
> **Explanation:** `Number.isNaN()` accurately detects `NaN` values without implicit type coercion.

---

### Exercise 3: Parsing Non-Numeric Strings to NaN

**Problem:** Show that `parseInt("abc")` returns `NaN` and verify with `Number.isNaN()`.

**Expected output:**
```text
true
```

> [!check]- Answer
> ```javascript
> const res = parseInt("abc", 10);
> console.log(Number.isNaN(res));
> ```
>
> **Explanation:** `parseInt` returns `NaN` when parsing invalid numeric strings.

---

## 7. Related Terms
- [Strict vs Loose Equality (`===` vs `==`)](../level_01/strict_vs_loose_equality.md) — Equality operations.
- [Number Methods & Parsing](../level_02/number_methods.md) — Methods like `parseInt` that can yield `NaN`.

---

## 8. Key Takeaways
- `NaN` stands for "Not-a-Number", representing an invalid mathematical result.
- Despite its name, the type of `NaN` is `"number"`.
- `NaN` is not equal to itself or any other value; you must use `Number.isNaN()` to check for it.
- Operations involving `NaN` will propagate, always returning `NaN`.
