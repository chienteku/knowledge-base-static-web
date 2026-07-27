# Dynamic & Weak Typing

> **Level 1 — Foundations**
> Types attach to values at runtime; JS auto-coerces.

---

## 1. Prerequisites
- [Type Coercion](../level_01/type_coercion.md) — Automatic or implicit conversion of types.
- [`typeof`](../level_01/typeof.md) — Checking type of values.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Identify Coercions

**Problem:** Predict the output and data type of each statement due to weak typing:

```javascript
console.log("5" - 2);
console.log("5" + 2);
console.log(true + 1);
```

**Expected output:**
```text
3 (type: number)
"52" (type: string)
2 (type: number)
```

> [!check]- Answer
> - The subtraction operator `-` is purely mathematical, coercing `"5"` to a number.
> - The addition operator `+` favors string concatenation if one operand is a string.
> - The boolean `true` coerces to `1` in mathematical operations.

---

### Exercise 2: Variable Type Mutation across Execution

**Problem:** Declare `let x = 10;`, reassign `x = "hello"`, then `x = true`. Print `typeof x` at each step.

**Expected output:**
```text
number
string
boolean
```

> [!check]- Answer
> ```javascript
> let x = 10;
> console.log(typeof x);
> x = "hello";
> console.log(typeof x);
> x = true;
> console.log(typeof x);
> ```
>
> **Explanation:** JavaScript is dynamically typed: variable bindings hold values of any type and can change types at runtime.

### Exercise 3: Safeguarding Dynamic Inputs

**Problem:** Write a function `safeAdd(a, b)` that validates both inputs are typeof `"number"` before adding, or returns `NaN`.

**Expected output:**
```text
15
NaN
```

> [!check]- Answer
> ```javascript
> function safeAdd(a, b) {
>   if (typeof a !== "number" || typeof b !== "number") return NaN;
>   return a + b;
> }
> console.log(safeAdd(10, 5));
> console.log(safeAdd("10", 5));
> ```
>
> **Explanation:** Type guards (`typeof a === "number"`) protect dynamic functions against unexpected runtime coercion.

---

## 7. Related Terms
- [Primitive Types](../level_01/primitive_types.md) — Foundational data types.
- [Type Coercion](../level_01/type_coercion.md) — The mechanism enabling weak typing.
- [TypeScript](../../../08-typescript/terms/level_01/typescript.md) — Statically typed superset of JavaScript.

---

## 8. Key Takeaways
- JavaScript is dynamically typed: variables are just references; they do not have fixed types. Value types are evaluated at runtime.
- JavaScript is weakly typed: the engine implicitly converts types (coercion) to allow mixed-type operations to succeed instead of throwing errors.
- Dynamic, weak typing allows fast prototyping but requires disciplined testing to avoid silent runtime errors.
