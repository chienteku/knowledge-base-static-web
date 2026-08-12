# if / else

> **Level 2 — Control Flow & Data Structures**
> Conditional branching; executes code blocks based on truthy or falsy conditions.

---

## 1. Prerequisites
- [Boolean](../level_01/boolean.md) — A logical entity having two values: `true` or `false`.
- [Statement](../level_01/statement.md) — An instruction that performs an action.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: if / else is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: E-Commerce Customer Discount Tier Evaluator

**Scenario:** A checkout engine calculates customer discount percentages based on membership tier and total spending using nested if / else if / else conditional branches.

**Requirements:**
1. Write calculateDiscount(userTier, cartTotal).
2. If userTier === "VIP", return 0.20.
3. Else if userTier === "GOLD" or cartTotal >= 200, return 0.15.
4. Else if cartTotal >= 100, return 0.10.
5. Else return 0.0.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateDiscount(userTier, cartTotal) {
>   if (userTier === "VIP") {
>     return 0.20;
>   } else if (userTier === "GOLD" || cartTotal >= 200) {
>     return 0.15;
>   } else if (cartTotal >= 100) {
>     return 0.10;
>   } else {
>     return 0.0;
>   }
> }
>
> // Verification tests
> console.assert(calculateDiscount("VIP", 50) === 0.20, "Test 1 Failed");
> console.assert(calculateDiscount("STANDARD", 250) === 0.15, "Test 2 Failed");
> console.assert(calculateDiscount("STANDARD", 150) === 0.10, "Test 3 Failed");
> console.assert(calculateDiscount("STANDARD", 50) === 0.0, "Test 4 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Conditional Branching**: if...else if...else statements execute different code blocks depending on truthy or falsy evaluations.
> 2. **First Match Short-Circuiting**: JavaScript evaluates branch conditions top-down and executes only the first matching truthy branch.
> 3. **Default Else Fallback**: The final else block provides a fallback execution path when all preceding conditions evaluate to falsy.
> 
---

### Exercise 2: Resource Access Authorizer Guard

**Scenario:** An API security gateway evaluates user access permissions, returning access decisions based on role ownership and account status.

**Requirements:**
1. Write authorizeAccess(user, resource).
2. If user is null or suspended, return false.
3. If user.role === "ADMIN" or resource.ownerId === user.id, return true.
4. Else return false.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function authorizeAccess(user, resource) {
>   if (!user || user.isSuspended) {
>     return false;
>   } else if (user.role === "ADMIN" || (resource && resource.ownerId === user.id)) {
>     return true;
>   } else {
>     return false;
>   }
> }
>
> // Verification tests
> console.assert(authorizeAccess({ id: 1, role: "ADMIN", isSuspended: false }, {}) === true, "Test 1 Failed");
> console.assert(authorizeAccess({ id: 2, role: "USER", isSuspended: false }, { ownerId: 2 }) === true, "Test 2 Failed");
> console.assert(authorizeAccess({ id: 3, role: "USER", isSuspended: true }, { ownerId: 3 }) === false, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Guard Condition Branching**: Placing rejection checks in initial if blocks prevents invalid property access in subsequent branches.
> 2. **Boolean Truthy Evaluation**: Conditions inside if (...) are implicitly coerced to boolean primitives.
> 3. **Explicit Return Scoping**: Returning values directly from conditional blocks eliminates unnecessary mutable variables.
> 
---

### Exercise 3: System Server Load Alert Resolver

**Scenario:** A cloud monitoring dashboard maps CPU load percentages to operational alert levels ("CRITICAL", "WARNING", "HEALTHY").

**Requirements:**
1. Write resolveLoadAlert(cpuPercent).
2. If cpuPercent >= 90, return "CRITICAL".
3. Else if cpuPercent >= 70, return "WARNING".
4. Else if cpuPercent >= 0, return "HEALTHY".
5. Else return "UNKNOWN".

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function resolveLoadAlert(cpuPercent) {
>   if (typeof cpuPercent !== "number" || Number.isNaN(cpuPercent)) {
>     return "UNKNOWN";
>   }
>
>   if (cpuPercent >= 90) {
>     return "CRITICAL";
>   } else if (cpuPercent >= 70) {
>     return "WARNING";
>   } else if (cpuPercent >= 0) {
>     return "HEALTHY";
>   } else {
>     return "UNKNOWN";
>   }
> }
>
> // Verification tests
> console.assert(resolveLoadAlert(95) === "CRITICAL", "Test 1 Failed");
> console.assert(resolveLoadAlert(75) === "WARNING", "Test 2 Failed");
> console.assert(resolveLoadAlert(30) === "HEALTHY", "Test 3 Failed");
> console.assert(resolveLoadAlert("invalid") === "UNKNOWN", "Test 4 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Sequential Threshold Testing**: Arranging thresholds in descending order ensures correct classification without complex logical AND chains.
> 2. **Input Validation Defensive Path**: Initial type checks guard against NaN or non-numeric arguments.
> 3. **Block Scope Isolation**: Variables declared inside an if block are scoped strictly to that block.
---

## 6. Related Terms
- [switch](switch.md) — Evaluates an expression against multiple cases.
- [Truthy / Falsy](truthy_falsy.md) — Values that evaluate to `true` or `false`.
- [Comparison Operators](../level_01/comparison_operators.md) — Related concept: Comparison Operators.
- [Ternary / Conditional Operator (? :)](../level_01/ternary_operator.md) — Related concept: Ternary / Conditional Operator (? :).
- [Logical Operators](logical_operators.md) — Related concept: Logical Operators.

---

## 7. Key Takeaways
- The `if` block executes if the condition evaluates to a truthy value.
- The `else` block executes if the condition evaluates to a falsy value.
- You can chain multiple conditions together using `else if`.
- Always use strict equality (`===`) when checking conditions to avoid accidental reassignment or type coercion bugs.
