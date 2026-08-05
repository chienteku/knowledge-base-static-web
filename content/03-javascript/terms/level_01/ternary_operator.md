# Ternary / Conditional Operator (? :)

> **Level 1 — Foundations**
> Inline one-expression `if/else`.

---

## 1. Prerequisites
- [Expression](expression.md) — Any valid unit of code that resolves to a single value.
- [if / else](../level_02/if_else.md) — Conditional branching statement.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Conditional logic is the heart of programming. When a developer wants to choose between two values based on a condition, they would traditionally write an `if...else` block:
```javascript
let greeting;
if (isLoggedIn) {
  greeting = "Welcome back!";
} else {
  greeting = "Please log in.";
}
```
While this works, it is verbose, requires a reassignable variable (`let`), and takes up several lines of code. Additionally, `if...else` is a *statement* (an instruction that does not yield a value), which means it cannot be used directly inside another expression or assignment.

To solve this, the TC39 committee implemented the **conditional (ternary) operator** (`? :`). It is the only operator in JavaScript that takes three operands. Because it is an *expression*, it evaluates directly to a value, allowing developers to write compact, inline conditions and use `const` for variable declarations instead of `let`.

### (2) Reality Metaphor
A ternary operator is like a digital ticket machine at a parking garage. 
- You insert your ticket (the **condition**).
- The machine asks: "Is this ticket validated?" (the `?`).
- If **yes** (first branch before the `:`), open the gate for free.
- If **no** (second branch after the `:`), prompt for payment.

The machine outputs exactly one outcome based on your ticket state.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const userAge = 20;
// Condition ? ValueIfTrue : ValueIfFalse
const accessMessage = userAge >= 18 ? "Access Granted" : "Access Denied";

console.log(accessMessage); // "Access Granted"
```

#### Fuller Example
```javascript
// A simple e-commerce checkout page demonstrating ternary expressions
const userStatus = "premium";
const cartTotal = 45;

// 1. Calculate discount inline based on user membership status
const discount = userStatus === "premium" ? 10 : 0;
const discountedTotal = cartTotal - discount;

// 2. Inline check inside a console.log statement
console.log(`Your discount is: $${discount}`); // Your discount is: $10

// 3. Conditional message checking for free shipping (minimum $40 threshold)
const shippingMessage = discountedTotal >= 40 
  ? "You qualify for free shipping!" 
  : "Add more items to get free shipping.";

console.log(shippingMessage); // "You qualify for free shipping!"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Nesting Ternary Operators

**The mistake:** Chaining multiple ternary operators inside each other to handle complex multi-step conditions.

**Why it's wrong:** Nesting ternaries creates highly unreadable code ("write-only code") that is extremely difficult to debug, audit, or modify. If you have more than two branches, standard `if...else` or `switch` statements are much cleaner.

*Incorrect:*
```javascript
const score = 85;
const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "F";
// Extremely hard to read at a glance!
```

*Fix:*
```javascript
const score = 85;
let grade;

// Clean, readable branching
if (score >= 90) {
  grade = "A";
} else if (score >= 80) {
  grade = "B";
} else if (score >= 70) {
  grade = "C";
} else {
  grade = "F";
}
```

### Mistake 2: Using Ternaries for Side-Effects

**The mistake:** Using a ternary operator to execute function calls or commands rather than evaluating a value.

**Why it's wrong:** Ternaries are expressions designed to return a value. If you don't care about the returned value and just want to run different logic blocks, use a standard `if/else` statement.

*Incorrect:*
```javascript
const isRaining = true;
isRaining ? openUmbrella() : wearSunglasses(); // Bad practice!
```

*Fix:*
```javascript
const isRaining = true;
if (isRaining) {
  openUmbrella();
} else {
  wearSunglasses();
}
```

---

### Mistake 3: Unhandled Asynchronous Failures in Ternary Operator Operations

**The mistake:** Executing asynchronous operations within Ternary Operator without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/ternary_operator"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/ternary_operator");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in ternary_operator: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Format Login Button Label

**Problem:** Complete the code to print the correct button text. If `isUserLoggedIn` is `true`, set `buttonLabel` to `"Logout"`. Otherwise, set it to `"Login"`.

```javascript
const isUserLoggedIn = false;
const buttonLabel = // Write ternary here

console.log("Button label:", buttonLabel);
```

**Expected output:**
> [!check]- Answer
> ```text
> Button label: Login
> ```
> - The condition is `isUserLoggedIn`.
> - If true, the value is `"Logout"`.
> - If false, the value is `"Login"`.

---

### Exercise 2: Ternary Default Value Selection

**Problem:** Write a ternary statement returning `name` if non-empty string, else `"Anonymous"`.

**Expected output:**
> [!check]- Answer
> ```text
> Alice
> Anonymous
> ```
> ```javascript
> function getName(n) { return n ? n : "Anonymous"; }
> console.log(getName("Alice"));
> console.log(getName(""));
> ```
>
> **Explanation:** Ternary expressions evaluate truthy/falsy condition arms concisely.

---

### Exercise 3: Multi-Condition Ternary Status Check

**Problem:** Return `"High"` if score >= 80, `"Medium"` if score >= 50, else `"Low"` using ternary operators.

**Expected output:**
> [!check]- Answer
> ```text
> High
> Medium
> Low
> ```
> ```javascript
> function getStatus(s) { return s >= 80 ? "High" : s >= 50 ? "Medium" : "Low"; }
> console.log(getStatus(85));
> console.log(getStatus(60));
> console.log(getStatus(30));
> ```
>
> **Explanation:** Chained ternary expressions evaluate conditions sequentially.

---

## 7. Related Terms
- [Truthy / Falsy](../level_02/truthy_falsy.md) — Concept of truthy and falsy values.
- [Logical Operators](../level_02/logical_operators.md) — Logic combinators (`&&`, `||`, `!`).
- [if / else](../level_02/if_else.md) — General purpose control flow statements.

---

## 8. Key Takeaways
- The conditional/ternary operator (`? :`) is the only JavaScript operator that takes three operands.
- It is an expression, meaning it evaluates to a single value and can be assigned directly to variables.
- Keep ternaries simple; do not nest them, and do not use them to execute side-effect logic.
