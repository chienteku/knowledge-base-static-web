# Comparison Operators

> **Level 1 — Foundations**
> `> < >= <=` compare two values, yielding a Boolean.

---

## 1. Prerequisites
- [Boolean](../level_01/boolean.md) — A logical entity having two values: `true` or `false`.
- [Operator](../level_01/operator.md) — Symbol that performs an operation on operands.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Programs cannot make decisions in a vacuum; they must react to data. To determine if a user is old enough to log in, if a cart value is high enough for free shipping, or if a game character has run out of health, we need a way to evaluate relative numeric relationships. The TC39 committee implemented standard mathematical comparison operators: `>` (greater than), `<` (less than), `>=` (greater than or equal to), and `<=` (less than or equal to). These operators compare two operands and resolve to a boolean value (`true` or `false`), which then feeds directly into control flow statements like `if/else`.

### (2) Reality Metaphor
A comparison operator is like a balance scale. You place one item on the left and another on the right, and the scale determines which side is heavier (or if they are balanced). The result is binary: either the left side is heavier, or it isn't.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const valueA = 10;
const valueB = 15;

console.log(valueA > valueB);  // false
console.log(valueA < valueB);  // true
console.log(valueA >= 10);     // true
console.log(valueB <= 15);     // true
```

#### Fuller Example
```javascript
// A simple age gate and height requirement checker for an amusement park ride
const riderAge = 12;
const riderHeightCm = 135;

const minimumAge = 10;
const minimumHeightCm = 140;

// Relational comparisons returning booleans
const isOldEnough = riderAge >= minimumAge;
const isTallEnough = riderHeightCm >= minimumHeightCm;

console.log("Rider is old enough:", isOldEnough); // true
console.log("Rider is tall enough:", isTallEnough); // false

// Standard if-else decision branching using the comparison results
if (isOldEnough && isTallEnough) {
  console.log("Rider is allowed on the roller coaster!");
} else {
  console.log("Rider does not meet the safety requirements.");
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Chaining Comparisons Incorrectly

**The mistake:** Writing a range check in algebraic notation like `a < b < c`.

**Why it's wrong:** JavaScript evaluates expressions from left to right. It evaluates `a < b` first, resulting in a boolean (`true` or `false`). It then compares that boolean value to `c`, which triggers type coercion (converting `true` to `1` or `false` to `0`). This does not check if `b` is between `a` and `c`.

*Incorrect:*
```javascript
const x = 15;

// We want to check if x is between 10 and 20
if (10 < x < 20) {
  // Evaluates: (10 < 15) -> true
  // Then evaluates: true < 20 -> 1 < 20 -> true (this seems correct, but...)
}

const y = 5;
if (10 < y < 20) {
  // Evaluates: (10 < 5) -> false
  // Then evaluates: false < 20 -> 0 < 20 -> true! (Incorrect evaluation!)
  console.log("5 is between 10 and 20."); 
}
```

*Fix:*
```javascript
const y = 5;

// Explicitly join two separate comparisons using the logical AND operator (&&)
if (y > 10 && y < 20) {
  console.log("5 is between 10 and 20."); // This will not run
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Comparison Operators Callbacks

**The mistake:** Passing methods from Comparison Operators instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "comparison_operators",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "comparison_operators",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Comparison Operators Operations

**The mistake:** Executing asynchronous operations within Comparison Operators without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/comparison_operators"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/comparison_operators");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in comparison_operators: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Shipping Cost Calculator

**Problem:** Complete the code to check if a user is eligible for free shipping. Free shipping is granted if their `cartTotal` is greater than or equal to 50.

```javascript
const cartTotal = 45.99;
const isEligibleForFreeShipping = // Write comparison here

console.log("Eligible:", isEligibleForFreeShipping);
```

**Expected output:**
> [!check]- Answer
> ```text
> Eligible: false
> ```
> - Use the `>=` operator to test if a value is greater than or equal to a target.

---

### Exercise 2: Relational Comparison Type Coercion

**Problem:** Predict `5 > "3"`, `"5" > 3`, `null >= 0`, `null > 0`, and `undefined >= 0`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> true
> true
> false
> false
> ```
> ```javascript
> console.log(5 > "3");     // true ("3" -> 3)
> console.log("5" > 3);     // true ("5" -> 5)
> console.log(null >= 0);  // true (null -> 0)
> console.log(null > 0);   // false (0 > 0 is false)
> console.log(undefined >= 0); // false (undefined -> NaN)
> ```
>
> **Explanation:** Relational operators (`>`, `>=`, `<`, `<=`) coerce nullish/string operands to numbers. `null` becomes `0`, while `undefined` becomes `NaN` (making all comparisons `false`).

---

### Exercise 3: Object Relational ValueOf Coercion

**Problem:** Create an object `{ valueOf() { return 10; } }` and compare it with number `5` using `>`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> const obj = { valueOf() { return 10; } };
> console.log(obj > 5);
> ```
>
> **Explanation:** Comparison operators call `.valueOf()` or `.toString()` to convert objects into primitives before comparing.

---

## 7. Related Terms
- [Strict vs Loose Equality (`===` vs `==`)](../level_01/strict_vs_loose_equality.md) — Equality checking.
- [Truthy / Falsy](../level_02/truthy_falsy.md) — How non-boolean values evaluate in conditions.
- [`if` / `else`](../level_02/if_else.md) — Executing code blocks based on conditions.

---

## 8. Key Takeaways
- Comparison operators (`>`, `<`, `>=`, `<=`) are binary operators that check mathematical relations.
- They always evaluate to a boolean primitive value (`true` or `false`).
- Relational operators will coerce strings to numbers if one operand is a number, but they perform alphabetic (lexicographical) sorting comparisons if both operands are strings.
