# if / else

> **Level 2 — Control Flow & Data Structures**
> Conditional branching; executes code blocks based on truthy or falsy conditions.

---

## 1. Prerequisites
- [Boolean](../level_01/boolean.md) — A logical entity having two values: `true` or `false`.
- [Statement](../level_01/statement.md) — An instruction that performs an action.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Without conditional branching, a program is just a rigid script that executes from top to bottom, doing the exact same thing every single time it runs. To make software truly useful, it needs to be able to make decisions based on dynamic input (e.g., "If the user is an admin, show the dashboard; else, show the login screen"). 

The `if...else` statement is the most fundamental way to introduce logic and branching paths into code. It evaluates a condition, and depending on whether that condition is true or false, it runs a specific block of code.

### (2) Reality Metaphor
Think of an `if / else` statement like a fork in a road with a toll booth operator. The operator asks you a yes/no question: "Are you a local resident?" 
- **If** you say "Yes" (`true`), the operator opens the left gate, and you drive down the resident road.
- **Else** (you say "No", `false`), the operator opens the right gate, and you drive down the visitor road.
You can never drive down both roads at the same time.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const userAge = 20;

if (userAge >= 18) {
  console.log("You are an adult.");
} else {
  console.log("You are a minor.");
}
```

#### Fuller Example
```javascript
function getDiscountMessage(purchaseAmount, isPremiumMember) {
  // You can chain multiple conditions using `else if`
  if (purchaseAmount > 100 && isPremiumMember) {
    return "You get a 20% discount!";
  } else if (purchaseAmount > 100) {
    return "You get a 10% discount!";
  } else if (isPremiumMember) {
    return "You get free shipping!";
  } else {
    return "No discounts applied.";
  }
}

console.log(getDiscountMessage(120, false)); // "You get a 10% discount!"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing assignment (`=`) with equality (`===`)

**The mistake:** Using a single equals sign inside the `if` condition.

**Why it's wrong:** A single equals sign assigns a value. `if (user = "admin")` will actually assign `"admin"` to `user`, which returns a truthy string, making the condition *always* evaluate to true! You must use strict equality (`===`) to compare values.

*Incorrect:*
```javascript
let role = "guest";
// This assigns 'admin' to role, which is truthy, so the block always runs!
if (role = "admin") {
  console.log("Access granted to sensitive data!"); 
}
```

*Fix:*
```javascript
let role = "guest";
// Use strict equality to compare
if (role === "admin") {
  console.log("Access granted to sensitive data!"); 
}
```

---

### Mistake 2: Losing Context Binding (`this`) in If Else Callbacks

**The mistake:** Passing methods from If Else instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "if_else",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "if_else",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in If Else Operations

**The mistake:** Executing asynchronous operations within If Else without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/if_else"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/if_else");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in if_else: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Even or Odd?

**Problem:** Write an `if / else` statement that checks if a variable `const num = 7;` is even or odd. Log "Even" if it's even, and "Odd" if it's odd.

**Expected output:**
> [!check]- Answer
> ```text
> Odd
> ```
> - Use the modulo operator `%` to find the remainder of division.
> - If `num % 2 === 0`, the number is even.

---

### Exercise 2: Chained Conditional Guarding

**Problem:** Write an `if...else if...else` structure classifying grade numbers into `"A"` (>=90), `"B"` (>=80), `"C"` (>=70), or `"F"`.

**Expected output:**
> [!check]- Answer
> ```text
> B
> ```
> ```javascript
> const score = 85;
> let grade;
> if (score >= 90) grade = "A";
> else if (score >= 80) grade = "B";
> else if (score >= 70) grade = "C";
> else grade = "F";
> console.log(grade);
> ```
>
> **Explanation:** `else if` chains evaluate conditions top-to-bottom, executing the first matching condition block.

---

### Exercise 3: Early Return Pattern Refactoring

**Problem:** Refactor nested `if` statements using early `return` guards.

**Expected output:**
> [!check]- Answer
> ```text
> Invalid user
> ```
> ```javascript
> function processUser(user) {
>   if (!user) return "Invalid user";
>   if (!user.active) return "Inactive user";
>   return "User processed";
> }
> console.log(processUser(null));
> ```
>
> **Explanation:** Early returns eliminate deeply nested `if...else` blocks, improving code readability.

---

## 7. Related Terms
- [switch](switch.md) — Evaluates an expression against multiple cases.
- [Truthy / Falsy](truthy_falsy.md) — Values that evaluate to `true` or `false`.
- [Comparison Operators](../level_01/comparison_operators.md) — Related concept: Comparison Operators.
- [Ternary / Conditional Operator (? :)](../level_01/ternary_operator.md) — Related concept: Ternary / Conditional Operator (? :).
- [Logical Operators](logical_operators.md) — Related concept: Logical Operators.

---

## 8. Key Takeaways
- The `if` block executes if the condition evaluates to a truthy value.
- The `else` block executes if the condition evaluates to a falsy value.
- You can chain multiple conditions together using `else if`.
- Always use strict equality (`===`) when checking conditions to avoid accidental reassignment or type coercion bugs.
