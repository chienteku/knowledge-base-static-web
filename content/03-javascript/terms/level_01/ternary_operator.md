# Ternary / Conditional Operator (? :)

> **Level 1 — Foundations**
> Inline one-expression `if/else`.

---

## 1. Prerequisites
- [Expression](expression.md) — Any valid unit of code that resolves to a single value.
- [if / else](../level_02/if_else.md) — Conditional branching statement.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Ternary / Conditional Operator (? :) is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: E-Commerce Dynamic Shipping Fee Calculator

**Scenario:** A checkout system calculates shipping fees based on order total thresholds and customer VIP status using a concise ternary expression (? :).

**Requirements:**
1. Write calculateShippingFee(orderTotal, isVip).
2. Free shipping (0) applies if isVip is true OR orderTotal >= 100.
3. Otherwise shipping is 15.
4. Return shipping fee via ternary expression.

> [!check]- Answer
> #### Implementation
> ```javascript
> function calculateShippingFee(orderTotal, isVip) {
>   return (isVip || orderTotal >= 100) ? 0 : 15;
> }
> // Verification tests
> console.assert(calculateShippingFee(120, false) === 0, "Test 1 Failed");
> console.assert(calculateShippingFee(50, true) === 0, "Test 2 Failed");
> console.assert(calculateShippingFee(50, false) === 15, "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Ternary Arity**: The ternary operator is JavaScript's only operator that takes three operands: condition ? expr1 : expr2.
> 2. **Expression Evaluation**: Unlike an if/else statement, the ternary operator is an expression that evaluates directly to a value.
> 3. **Short-Circuit Operand Execution**: Only the selected branch expression is evaluated; the unselected branch is skipped.
> 
---

### Exercise 2: Dynamic UI Theme CSS Class Selector

**Scenario:** A frontend component computes CSS theme class names dynamically inside a template interpolation expression.

**Requirements:**
1. Write getThemeClass(isDarkMode, isHighContrast).
2. Use inline ternary expressions.
3. Return theme string (e.g. "theme-dark-hc", "theme-dark", "theme-light").

> [!check]- Answer
> #### Implementation
> ```javascript
> function getThemeClass(isDarkMode, isHighContrast) {
>   const baseTheme = isDarkMode ? "theme-dark" : "theme-light";
>   const contrastSuffix = isHighContrast ? "-hc" : "";
>   return baseTheme + contrastSuffix;
> }
> // Verification tests
> console.assert(getThemeClass(true, false) === "theme-dark", "Test 1 Failed");
> console.assert(getThemeClass(true, true) === "theme-dark-hc", "Test 2 Failed");
> console.assert(getThemeClass(false, false) === "theme-light", "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Expression Embeddability**: Because ternary operators are expressions, they can be embedded directly inside template literals and JSX.
> 2. **Truthy / Falsy Conditions**: The condition operand undergoes implicit boolean coercion.
> 3. **Concise Syntax**: Replaces verbose 5-line if/else blocks with single-line conditional assignments.
> 
---

### Exercise 3: Chained Ternary Status Resolver

**Scenario:** A server monitoring dashboard maps HTTP status code ranges to human-readable status labels using chained ternary expressions.

**Requirements:**
1. Return "SUCCESS" for 2xx status.
2. Return "CLIENT_ERROR" for 4xx status.
3. Return "SERVER_ERROR" for 5xx status.
4. Return "UNKNOWN" for other status codes.

> [!check]- Answer
> #### Implementation
> ```javascript
> function resolveStatusLabel(code) {
>   return (code >= 200 && code < 300)
>     ? "SUCCESS"
>     : (code >= 400 && code < 500)
>     ? "CLIENT_ERROR"
>     : (code >= 500 && code < 600)
>     ? "SERVER_ERROR"
>     : "UNKNOWN";
> }
> // Verification tests
> console.assert(resolveStatusLabel(200) === "SUCCESS", "Test 1 Failed");
> console.assert(resolveStatusLabel(404) === "CLIENT_ERROR", "Test 2 Failed");
> console.assert(resolveStatusLabel(500) === "SERVER_ERROR", "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Right-Associativity**: The ternary operator is right-associative; chained ternaries parse as a ? b : (c ? d : e).
> 2. **Readability Formatting**: Formatting chained ternaries on separate indented lines maintains visual readability.
> 3. **Return Value Precision**: Evaluates strictly to the single selected outcome string.
---

## 6. Related Terms
- [Truthy / Falsy](../level_02/truthy_falsy.md) — Concept of truthy and falsy values.
- [Logical Operators](../level_02/logical_operators.md) — Logic combinators (`&&`, `||`, `!`).
- [if / else](../level_02/if_else.md) — General purpose control flow statements.

---

## 7. Key Takeaways
- The conditional/ternary operator (`? :`) is the only JavaScript operator that takes three operands.
- It is an expression, meaning it evaluates to a single value and can be assigned directly to variables.
- Keep ternaries simple; do not nest them, and do not use them to execute side-effect logic.
