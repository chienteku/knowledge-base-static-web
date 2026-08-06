# Logical Operators

> **Level 2 — Control Flow & Data Structures**
> Operators (`&&`, `||`, `!`) used to combine or negate boolean values.

---

## 1. Prerequisites
- [Boolean](../level_01/boolean.md) — The fundamental `true` or `false` values these operators work with.
- [Truthy / Falsy](truthy_falsy.md) — How JavaScript interprets non-boolean values in logical operations.

---

## 2. Term Category
Language Core, Operators

---

## 3. Core Definition
**Logical Operators** are symbols used to connect two or more expressions such that the value of the compound expression depends on the original expressions and on the meaning of the operator.

JavaScript has three main logical operators:
1. **`&&` (Logical AND):** Returns true if *both* operands are true.
2. **`||` (Logical OR):** Returns true if *at least one* operand is true.
3. **`!` (Logical NOT):** Reverses the boolean value of its operand.

---

## 4. Key Characteristics / Rules
- **Short-Circuit Evaluation:** `&&` and `||` evaluate from left to right and will "short-circuit" (stop evaluating) as soon as the outcome is certain.
  - For `A && B`: If `A` is false, it returns `A` immediately without checking `B`.
  - For `A || B`: If `A` is true, it returns `A` immediately without checking `B`.
- **Returning Values:** Unlike in some other languages, JS logical operators don't strictly return `true` or `false`. They return the *actual value* of one of the specified operands.

---

## 5. Typical Usage / Common Patterns

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

---

### Exercise 1: Short-Circuit Operator Evaluation

**Problem:** Predict outputs of `0 || "default"`, `"value" && "fallback"`, `null ?? "valid"`, and `false || 0`.

**Expected output:**
> [!check]- Answer
> ```text
> default
> fallback
> valid
> 0
> ```
> ```javascript
> console.log(0 || "default");       // "default"
> console.log("value" && "fallback");// "fallback"
> console.log(null ?? "valid");      // "valid"
> console.log(false || 0);           // 0
> ```
>
> **Explanation:** `||` evaluates to the first truthy operand; `&&` evaluates to the first falsy operand (or last operand); `??` evaluates to the first non-nullish operand.
> 
---

### Exercise 2: Guarding Function Execution with Short-Circuit `&&`

**Problem:** Execute `fn()` only if `callback` is defined using `callback && callback()`.

**Expected output:**
> [!check]- Answer
> ```text
> Callback executed
> ```
> ```javascript
> function run(cb) {
>   cb && cb();
> }
> run(() => console.log("Callback executed"));
> ```
>
> **Explanation:** `A && B()` evaluates `B()` only if `A` is truthy.
> 
---

### Exercise 3: Nullish Coalescing vs Logical OR Defaults

**Problem:** Compare `0 || 100` vs `0 ?? 100`.

**Expected output:**
> [!check]- Answer
> ```text
> 100
> 0
> ```
> ```javascript
> console.log(0 || 100);
> console.log(0 ?? 100);
> ```
>
> **Explanation:** `||` evaluates `0` as falsy; `??` treats `0` as a valid non-nullish value.
> 
---

## 7. Related Terms
- [Nullish Coalescing (??)](../level_08/nullish_coalescing.md) — A newer operator designed to safely handle default values better than `||`.
- [if / else](if_else.md) — The primary control structures that rely on logical operators.

---

