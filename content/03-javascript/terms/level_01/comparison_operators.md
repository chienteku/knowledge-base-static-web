# Comparison Operators

> **Level 1 — Foundations**
> `> < >= <=` compare two values, yielding a Boolean.

---

## 1. Prerequisites
- [Boolean](boolean.md) — A logical entity having two values: `true` or `false`.
- [Operator](operator.md) — Symbol that performs an operation on operands.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Comparison Operators is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: E-Commerce Inventory Stock Level Guard

**Scenario:** An inventory management service evaluates customer order quantities against available warehouse stock and reorder thresholds using relational comparison operators (>, <, >=, <=).

**Requirements:**
1. Write a function checkInventoryState(availableStock, requestedQty, minThreshold).
2. Check if requested quantity exceeds available stock using >.
3. Check if available stock falls below reorder threshold using <=.
4. Return an object { canFulfill: boolean, needsReorder: boolean }.

> [!check]- Answer
> #### Implementation
> ```javascript
> function checkInventoryState(availableStock, requestedQty, minThreshold) {
>   const canFulfill = availableStock >= requestedQty;
>   const needsReorder = availableStock <= minThreshold;
> return { canFulfill, needsReorder };
> }
> // Verification tests
> const state1 = checkInventoryState(100, 20, 15);
> console.assert(state1.canFulfill === true && state1.needsReorder === false, "Test 1 Failed");
> const state2 = checkInventoryState(10, 15, 15);
> console.assert(state2.canFulfill === false && state2.needsReorder === true, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Relational Operators**: Comparison operators (>, <, >=, <=) compare two numeric operands and return a primitive boolean value.
> 2. **Boundary Testing**: Inclusive operators (>= and <=) evaluate equality along boundary thresholds.
> 3. **Operand Coercion**: If operands are different types, relational operators attempt implicit numeric coercion.
> 
---

### Exercise 2: User Age Tier Classifier

**Scenario:** An identity compliance service categorizes users into age tiers (minor, adult, senior) for content regulation using chained comparison conditions.

**Requirements:**
1. Write a function getAgeTier(age).
2. Return "minor" if age is less than 18.
3. Return "adult" if age is between 18 and 64 inclusive.
4. Return "senior" if age is 65 or greater.

> [!check]- Answer
> #### Implementation
> ```javascript
> function getAgeTier(age) {
>   if (typeof age !== "number" || age < 0) return "invalid";
> if (age < 18) {
>     return "minor";
>   } else if (age <= 64) {
>     return "adult";
>   } else {
>     return "senior";
>   }
> }
> // Verification tests
> console.assert(getAgeTier(15) === "minor", "Test 1 Failed");
> console.assert(getAgeTier(30) === "adult", "Test 2 Failed");
> console.assert(getAgeTier(70) === "senior", "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Numeric Comparison**: Comparing numbers evaluates standard mathematical order.
> 2. **Chained Evaluation**: Logical branch conditions evaluate comparisons in sequential top-down order.
> 3. **Type Guarding**: Verifying typeof age === "number" prevents unexpected comparisons against undefined or string values.
> 
---

### Exercise 3: Lexicographical String Identifier Comparator

**Scenario:** A database indexing engine compares string keys or semver build tags using relational comparison operators according to Unicode code point order.

**Requirements:**
1. Write a function compareStringKeys(keyA, keyB).
2. Return -1 if keyA comes before keyB lexicographically.
3. Return 1 if keyA comes after keyB.
4. Return 0 if keys are equal.

> [!check]- Answer
> #### Implementation
> ```javascript
> function compareStringKeys(keyA, keyB) {
>   if (keyA < keyB) {
>     return -1;
>   } else if (keyA > keyB) {
>     return 1;
>   } else {
>     return 0;
>   }
> }
> // Verification tests
> console.assert(compareStringKeys("alpha", "beta") === -1, "Test 1 Failed");
> console.assert(compareStringKeys("zone", "apple") === 1, "Test 2 Failed");
> console.assert(compareStringKeys("same", "same") === 0, "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Lexicographical Order**: When both operands are strings, relational operators compare character code points sequentially.
> 2. **Case Sensitivity**: Uppercase ASCII letters (e.g. "A" = 65) precede lowercase letters (e.g. "a" = 97) in code point comparison.
> 3. **Deterministic Sorting**: Relational operators provide deterministic string ordering compatible with sorting algorithms.
---

## 6. Related Terms
- [Strict vs Loose Equality (=== vs ==)](strict_vs_loose_equality.md) — Equality checking.
- [Truthy / Falsy](../level_02/truthy_falsy.md) — How non-boolean values evaluate in conditions.
- [if / else](../level_02/if_else.md) — Executing code blocks based on conditions.
- [Operator](operator.md) — Related concept: Operator.
- [sort / reverse](../level_04/sort_reverse.md) — Related concept: sort / reverse.

---

## 7. Key Takeaways
- Comparison operators (`>`, `<`, `>=`, `<=`) are binary operators that check mathematical relations.
- They always evaluate to a boolean primitive value (`true` or `false`).
- Relational operators will coerce strings to numbers if one operand is a number, but they perform alphabetic (lexicographical) sorting comparisons if both operands are strings.
