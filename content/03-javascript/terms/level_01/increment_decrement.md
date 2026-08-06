# Increment / Decrement (++ / --)

> **Level 1 — Foundations**
> Add/subtract one; prefix vs postfix.

---

## 1. Prerequisites
- [Number](number.md) — Represents both integer and floating-point numbers.
- [Variable](variable.md) — A named container for storing data values.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In programming, loops and iteration are fundamental. We frequently need to increment or decrement a counter by exactly `1` (e.g., `count = count + 1` or `count += 1`). To make this extremely common operation concise, JavaScript inherited the increment (`++`) and decrement (`--`) operators from languages like C and Java. 

These operators can be placed *before* the variable (**prefix**) or *after* the variable (**postfix**). While they both change the value of the variable by 1, they return different values during expression evaluation, providing fine-grained control when managing loops.

### (2) Reality Metaphor
The increment operator is like a manual tally clicker (like the ones bouncers use to count people entering a club). Every click increments the total by 1. 

- **Postfix (`x++`)** is like reading the counter screen first, and then pressing the clicker.
- **Prefix (`++x`)** is like pressing the clicker first, and then reading the new count on the screen.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
let count = 5;

// Postfix increment
console.log(count++); // Logs 5 (evaluates first, then adds 1)
console.log(count);   // Logs 6

// Prefix increment
console.log(++count); // Logs 7 (adds 1 first, then evaluates)
console.log(count);   // Logs 7
```

#### Fuller Example
```javascript
// Managing a loop count and list indexing demonstrating postfix increment
const shoppingList = ["Apples", "Bananas", "Cherries"];
let index = 0;

// The postfix pattern is commonly used in access-then-increment logic
console.log("Item:", shoppingList[index++]); // Item: Apples (reads index 0, index becomes 1)
console.log("Item:", shoppingList[index++]); // Item: Bananas (reads index 1, index becomes 2)
console.log("Item:", shoppingList[index++]); // Item: Cherries (reads index 2, index becomes 3)

// Managing inventory stock count with prefix decrement
let widgetsInStock = 3;

function purchaseWidget() {
  if (widgetsInStock > 0) {
    // Decrement stock and inform the user of remaining items
    console.log(`Purchase successful! Items left: ${--widgetsInStock}`);
  } else {
    console.log("Out of stock!");
  }
}

purchaseWidget(); // Purchase successful! Items left: 2
purchaseWidget(); // Purchase successful! Items left: 1
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Increment Values directly (Literals)

**The mistake:** Placing the `++` or `--` operator directly on a numeric literal instead of a variable.

**Why it's wrong:** The increment and decrement operators perform a reassignment under the hood. For example, `x++` means `x = x + 1`. A number literal (like `5`) is not a container and cannot have its value reassigned. This results in a SyntaxError.

*Incorrect:*
```javascript
console.log(5++); // SyntaxError: Invalid left-hand side expression in postfix operation
```

*Fix:*
```javascript
let num = 5;
num++; // Correctly modifies the variable 'num'
console.log(num); // 6
```

### Mistake 2: Mixing Prefix and Postfix in Complex Statements

**The mistake:** Using `++` inside a math formula or comparison where the execution order affects the final result, making it difficult to read and debug.

**Why it's wrong:** Relying on the evaluation side-effects of prefix/postfix makes code hard to understand for others. It is better to write the increment on a separate line.

*Incorrect:*
```javascript
let total = 10;
let multiplier = 2;
let result = total++ * ++multiplier; // Confusing and error-prone!
```

*Fix:*
```javascript
let total = 10;
let multiplier = 2;

// Keep calculations clean and readable on separate lines
multiplier += 1;
let result = total * multiplier;
total += 1;
```

---

### Mistake 3: Unhandled Asynchronous Failures in Increment Decrement Operations

**The mistake:** Executing asynchronous operations within Increment Decrement without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/increment_decrement"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/increment_decrement");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in increment_decrement: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Tracking Operations

**Problem:** Trace the value of the variables `a`, `b`, and `result` in the code below.

```javascript
let a = 10;
let b = 20;
const result = a++ + --b;
```

**Expected output:**
> [!check]- Answer
> ```text
> a: 11
> b: 19
> result: 29
> ```
> - `a++` returns the current value `10` first, then increments `a` to `11`.
> - `--b` decrements `b` to `19` first, and returns `19`.
> - Add the returned values: `10 + 19`.
> 
---

### Exercise 2: Prefix vs Postfix Evaluation Trace

**Problem:** Trace variables `a` and `b`: `let x = 5; let a = x++; let b = ++x;`.

**Expected output:**
> [!check]- Answer
> ```text
> a: 5, b: 7, x: 7
> ```
> ```javascript
> let x = 5;
> let a = x++; // a gets 5, x becomes 6
> let b = ++x; // x becomes 7, b gets 7
> console.log(`a: ${a}, b: ${b}, x: ${x}`);
> ```
>
> **Explanation:** `x++` evaluates to `5` before mutating `x` to `6`; `++x` mutates `x` to `7` before evaluating to `7`.
> 
---

### Exercise 3: Incrementing String Numbers

**Problem:** Predict `let str = "5"; str++; console.log(typeof str, str);`.

**Expected output:**
> [!check]- Answer
> ```text
> number 6
> ```
> ```javascript
> let str = "5";
> str++;
> console.log(typeof str, str);
> ```
>
> **Explanation:** The `++` operator automatically coerces string operands to numbers before incrementing.
> 
---

## 7. Related Terms
- [Arithmetic Operators](arithmetic_operators.md) — General mathematical operators.
- [Assignment Operators](assignment_operators.md) — Shorthand operators to update variable values.
- [for Loop](../level_02/for_loop.md) — Repetitive execution blocks that typically rely on increment counters.

---

## 8. Key Takeaways
- The increment (`++`) and decrement (`--`) operators increase or decrease a variable's value by 1.
- Postfix (`x++`) returns the value *before* changing it.
- Prefix (`++x`) returns the value *after* changing it.
- These operators can only be used on references (variables/object properties), not directly on raw numbers.
