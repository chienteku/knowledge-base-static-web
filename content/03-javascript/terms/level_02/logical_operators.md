# Logical Operators

> **Level 2 — Control Flow & Data Structures**
> Operators (`&&`, `||`, `!`) used to combine or negate boolean values.

---

## 1. Prerequisites
- [Boolean](../level_01/boolean.md) — The fundamental `true` or `false` values these operators work with.
- [Truthy / Falsy](truthy_falsy.md) — How JavaScript interprets non-boolean values in logical operations.

---

## 2. Term Category

**Language Core, Operators (core concept)**: Logical Operators is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

**Logical Operators** are symbols used to connect two or more expressions such that the value of the compound expression depends on the original expressions and on the meaning of the operator.

JavaScript has three main logical operators:
1. **`&&` (Logical AND):** Returns true if *both* operands are true.
2. **`||` (Logical OR):** Returns true if *at least one* operand is true.
3. **`!` (Logical NOT):** Reverses the boolean value of its operand.

### (2) Key Characteristics

- **Short-Circuit Evaluation:** `&&` and `||` evaluate from left to right and will "short-circuit" (stop evaluating) as soon as the outcome is certain.
  - For `A && B`: If `A` is false, it returns `A` immediately without checking `B`.
  - For `A || B`: If `A` is true, it returns `A` immediately without checking `B`.
- **Returning Values:** Unlike in some other languages, JS logical operators don't strictly return `true` or `false`. They return the *actual value* of one of the specified operands.

### (3) Code Examples & Typical Usage

```javascript
const isAdult = true;
const hasTicket = false;

// AND (&&) - both must be true
if (isAdult && hasTicket) {
  console.log("Welcome to the movie!");
} else {
  console.log("You cannot enter."); // This runs
}

// OR (||) - used for default values (older pattern)
const userGreeting = undefined;
const defaultGreeting = "Hello Guest";
// If userGreeting is falsy, return defaultGreeting
console.log(userGreeting || defaultGreeting); 

// NOT (!) - flipper
const isHidden = true;
console.log(!isHidden); // false
```



---



---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Logical Operators Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Logical Operators blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "logical_operators";
```

*Fix:*
```javascript
let value = "logical_operators";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Logical Operators Callbacks

**The mistake:** Passing methods from Logical Operators instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "logical_operators",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "logical_operators",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Logical Operators Operations

**The mistake:** Executing asynchronous operations within Logical Operators without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/logical_operators"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/logical_operators");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in logical_operators: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Short-Circuit Feature Flag & Permission Guard

**Scenario:** A feature flag evaluator checks if a feature is enabled and verifies user permissions using logical AND (&&) short-circuiting to avoid calling expensive permission checks when disabled.

**Requirements:**
1. Write checkFeatureAccess(isFeatureEnabled, userPermissionCheckFn).
2. Use logical AND (&&) to evaluate permissions only if isFeatureEnabled is truthy.
3. Return boolean result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function checkFeatureAccess(isFeatureEnabled, userPermissionCheckFn) {
>   // Logical AND (&&) short-circuits: userPermissionCheckFn is skipped if isFeatureEnabled is falsy
>   return Boolean(isFeatureEnabled && userPermissionCheckFn());
> }
>
> // Verification tests
> let fnCalled = false;
> const mockFn = () => { fnCalled = true; return true; };
>
> const disabledRes = checkFeatureAccess(false, mockFn);
> console.assert(disabledRes === false && fnCalled === false, "Test 1 Failed: Short-circuit failed");
>
> const enabledRes = checkFeatureAccess(true, mockFn);
> console.assert(enabledRes === true && fnCalled === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Logical AND Short-Circuiting**: In expr1 && expr2, if expr1 is falsy, JavaScript returns expr1 immediately without evaluating expr2.
> 2. **Operand Return Value**: Logical operators return the value of the deciding operand, not necessarily a boolean primitive.
> 3. **Execution Guard Pattern**: Using && guards against invoking functions or accessing nested properties when prerequisites are missing.
> 
---

### Exercise 2: Default Configuration Fallback Evaluator

**Scenario:** An application options resolver combines user settings, environment defaults, and global fallbacks using logical OR (||) and nullish coalescing (??).

**Requirements:**
1. Write resolveConfig(userOpts).
2. Set timeout using userOpts.timeout ?? 5000.
3. Set appTitle using userOpts.appTitle || "Default App".
4. Return resolved configuration object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function resolveConfig(userOpts = {}) {
>   const timeout = userOpts.timeout ?? 5000;
>   const appTitle = userOpts.appTitle || "Default App";
>   return { timeout, appTitle };
> }
>
> // Verification tests
> const cfg1 = resolveConfig({ timeout: 0, appTitle: "" });
> console.assert(cfg1.timeout === 0, "Test 1 Failed: 0 should not trigger ?? fallback");
> console.assert(cfg1.appTitle === "Default App", "Test 2 Failed: empty string should trigger || fallback");
> ```
>
> #### Technical Explanation
>
> 1. **Logical OR Short-Circuiting**: In expr1 || expr2, if expr1 is truthy, expr1 is returned immediately without evaluating expr2.
> 2. **Falsy vs Nullish Fallback**: Logical OR (||) treats all 8 falsy values as fallback triggers; Nullish Coalescing (??) triggers only on null or undefined.
> 3. **Short-Circuit Optimization**: Prevents unnecessary right-hand side evaluation when default criteria are satisfied.
> 
---

### Exercise 3: Multi-Condition Security Firewall Validator

**Scenario:** A security firewall evaluates incoming network request metadata using logical NOT (!), AND (&&), and OR (||) operators with parenthetical grouping.

**Requirements:**
1. Write validateFirewallRules(request).
2. Request is allowed if !request.isBlacklisted AND (request.isInternal OR request.hasValidToken).
3. Return boolean access decision.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateFirewallRules(request) {
>   if (!request || typeof request !== "object") return false;
>
>   const isNotBlacklisted = !request.isBlacklisted;
>   const isAuthorizedSource = Boolean(request.isInternal || request.hasValidToken);
>
>   return isNotBlacklisted && isAuthorizedSource;
> }
>
> // Verification tests
> console.assert(validateFirewallRules({ isBlacklisted: false, isInternal: true }) === true, "Test 1 Failed");
> console.assert(validateFirewallRules({ isBlacklisted: false, isInternal: false, hasValidToken: true }) === true, "Test 2 Failed");
> console.assert(validateFirewallRules({ isBlacklisted: true, isInternal: true }) === false, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Logical NOT Inversion**: The unary ! operator converts its operand to an inverted boolean primitive.
> 2. **Operator Precedence Hierarchy**: Logical NOT (!) evaluates before logical AND (&&), which evaluates before logical OR (||).
> 3. **Explicit Parentheses**: Using parentheses () overrides default precedence and guarantees intended evaluation sequence.
---

## 6. Related Terms
- [Nullish Coalescing (??)](../level_08/nullish_coalescing.md) — A newer operator designed to safely handle default values better than `||`.
- [if / else](if_else.md) — The primary control structures that rely on logical operators.

---

## 7. Key Takeaways
- Logical operators (`&&`, `||`, `!`) evaluate expressions and control conditional execution flow.
- Logical `&&` and `||` perform short-circuit evaluation, returning operand values directly rather than booleans.
- Logical NOT `!` coerces values to booleans and inverts their truthiness (`!!` coerces to boolean).
- Prefer nullish coalescing `??` over `||` when zero `0` or empty string `""` are valid non-default values.


