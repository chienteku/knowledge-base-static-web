# Dynamic & Weak Typing

> **Level 1 — Foundations**
> Types attach to values at runtime; JS auto-coerces.

---

## 1. Prerequisites
- [Type Coercion](type_coercion.md) — Automatic or implicit conversion of types.
- [typeof](typeof.md) — Checking type of values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Dynamic & Weak Typing is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When JavaScript was created in 1995, it was designed for web designers and amateur programmers who wanted to add simple scripts to web pages. Forcing these users to learn static type systems (declaring every variable with `int`, `float`, or `String` like in Java or C++) would make writing scripts slow and intimidating. 

To solve this, the language was built with two typing characteristics:
1. **Dynamic Typing:** Variables do not have types; only values do. A variable can hold a string, and then be reassigned to hold a number later.
2. **Weak Typing:** If a developer performs an operation on mixed types, the engine does not throw a compile-time or runtime error immediately. Instead, it implicitly converts (coerces) the types so that the operation can complete.

While this makes writing small scripts fast, it can lead to silent, hard-to-track bugs in large applications, which is why tools like TypeScript were created later.

### (2) Reality Metaphor
- **Dynamic Typing** is like a generic cardboard box. You can put a toy in it, take it out, and put a book in it. The box itself is just a container; it has no restrictions on what type of item it can hold. (Static typing is like a custom molded case that only fits a specific camera).
- **Weak Typing** is like a highly forgiving vending machine. If a snack costs $1.00 and you insert a 1-dollar bill, a button, and a token, the machine tries its best to translate those items into currency to make the purchase go through, rather than showing a red error light and refusing to work.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Dynamic typing: variable changes type based on its value
let userContainer = "Brendan"; 
console.log(typeof userContainer); // "string"

userContainer = 42; 
console.log(typeof userContainer); // "number"

// Weak typing: implicit coercion to make the operation succeed
const coercedResult = "Age: " + 25; 
console.log(coercedResult); // "Age: 25" (Number coerced to String)
```

#### Fuller Example
```javascript
// A simple data processor showing the pros and cons of dynamic and weak typing
function calculateTax(price, taxRate) {
  // If the user inputs a string representation of numbers, weak typing forces it to resolve
  // but it can lead to unexpected behaviors!
  return price * taxRate;
}

// Case A: Ideal inputs
console.log(calculateTax(100, 0.08)); // 8

// Case B: String representation of numbers
// Weak typing coerces "100" to number 100 because of multiplication (*)
console.log(calculateTax("100", 0.08)); // 8

// Case C: Invalid inputs (silent failure)
// Multiplication of string and number results in NaN instead of throwing an error
const badResult = calculateTax("banana", 0.08);
console.log(badResult); // NaN
console.log(typeof badResult); // "number"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Dynamic Weak Typing Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Dynamic Weak Typing blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "dynamic_weak_typing";
```

*Fix:*
```javascript
let value = "dynamic_weak_typing";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Dynamic Weak Typing Callbacks

**The mistake:** Passing methods from Dynamic Weak Typing instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "dynamic_weak_typing",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "dynamic_weak_typing",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Dynamic Weak Typing Operations

**The mistake:** Executing asynchronous operations within Dynamic Weak Typing without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/dynamic_weak_typing"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/dynamic_weak_typing");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in dynamic_weak_typing: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Polymorphic Input Payload Sanitizer

**Scenario:** A data ingestion endpoint accepts flex-typed payloads where fields can arrive as strings, numbers, or boolean values due to JavaScript's dynamic typing. The sanitizer must normalize incoming values safely.

**Requirements:**
1. Inspect runtime input types using typeof.
2. Convert valid string numbers to numeric primitives.
3. Handle boolean primitives explicitly.
4. Return a normalized structure.

> [!check]- Answer
> #### Implementation
> ```javascript
> function sanitizePayload(input) {
>   if (typeof input === "number") {
>     return { type: "number", value: input };
>   }
> if (typeof input === "string") {
>     const parsed = Number(input);
>     if (!Number.isNaN(parsed) && input.trim() !== "") {
>       return { type: "number", value: parsed };
>     }
>     return { type: "string", value: input.trim() };
>   }
> if (typeof input === "boolean") {
>     return { type: "boolean", value: input };
>   }
> return { type: "unknown", value: null };
> }
> // Verification tests
> console.assert(sanitizePayload(42).value === 42, "Test 1 Failed");
> console.assert(sanitizePayload("100").value === 100, "Test 2 Failed");
> console.assert(sanitizePayload("hello").value === "hello", "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Dynamic Typing**: In JavaScript, variables hold values of dynamic types, and type bindings can change at runtime.
> 2. **Weak Typing Hazards**: Weak typing allows implicit type coercion during operations (e.g. "100" - 50 = 50), requiring explicit validation guards.
> 3. **Runtime Type Inspection**: Using typeof allows developers to guard code execution paths against unexpected runtime types.
> 
---

### Exercise 2: Implicit Coercion Addition Guard

**Scenario:** A financial reporting tool calculates user balances. Due to weak typing, adding a string number "500" to a number 100 produces "500100" via concatenation instead of numeric addition 600.

**Requirements:**
1. Demonstrate the weak typing bug with +.
2. Fix the bug using explicit type coercion (Number()).
3. Ensure additions are strictly numeric.

> [!check]- Answer
> #### Implementation
> ```javascript
> function addBalances(currentBalance, depositAmount) {
>   const numCurrent = Number(currentBalance);
>   const numDeposit = Number(depositAmount);
> if (Number.isNaN(numCurrent) || Number.isNaN(numDeposit)) {
>     throw new Error("Invalid numeric input");
>   }
> return numCurrent + numDeposit;
> }
> // Verification tests
> console.assert(addBalances("500", 100) === 600, "Test 1 Failed: Implicit string concatenation occurred");
> console.assert(addBalances(200, "300") === 500, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Weak Typing Operator Dualities**: The + operator performs both numeric addition and string concatenation based on runtime operand types.
> 2. **Implicit Coercion Priority**: If either operand in a + expression is a string, JavaScript implicitly coerces the other operand to a string.
> 3. **Defensive Explicit Conversion**: Explicitly converting values using Number() neutralizes weak typing concatenation pitfalls.
> 
---

### Exercise 3: Dynamic Property Type Parser

**Scenario:** An application framework parses environment variables from string pairs into dynamic primitive types (booleans, numbers, or strings).

**Requirements:**
1. Parse string "true" / "false" into boolean primitives.
2. Parse numeric strings into numbers.
3. Fallback to raw string for text.

> [!check]- Answer
> #### Implementation
> ```javascript
> function parseEnvValue(raw) {
>   if (raw === "true") return true;
>   if (raw === "false") return false;
> if (raw !== "" && !Number.isNaN(Number(raw))) {
>     return Number(raw);
>   }
> return raw;
> }
> // Verification tests
> console.assert(parseEnvValue("true") === true, "Test 1 Failed");
> console.assert(parseEnvValue("8080") === 8080, "Test 2 Failed");
> console.assert(parseEnvValue("postgres") === "postgres", "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Dynamic Return Types**: JavaScript functions can return different primitive types dynamically based on runtime branching.
> 2. **Type Flexibility**: Dynamic typing allows writing flexible parsing utilities without requiring generic class boilerplate.
> 3. **Type Rigor**: While dynamic typing offers flexibility, explicit type checks preserve system predictability.
---

## 6. Related Terms
- [Primitive Types](primitive_types.md) — Foundational data types.
- [Type Coercion](type_coercion.md) — The mechanism enabling weak typing.
- [ECMAScript](ecmascript.md) — Related concept: ECMAScript.

---

## 7. Key Takeaways
- JavaScript is dynamically typed: variables are just references; they do not have fixed types. Value types are evaluated at runtime.
- JavaScript is weakly typed: the engine implicitly converts types (coercion) to allow mixed-type operations to succeed instead of throwing errors.
- Dynamic, weak typing allows fast prototyping but requires disciplined testing to avoid silent runtime errors.
