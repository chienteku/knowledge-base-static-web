# Arithmetic Operators

> **Level 1 — Foundations**
> `+ - * / % **` for math on numbers.

---

## 1. Prerequisites
- [Number](../level_01/number.md) — Represents both integer and floating-point numbers.
- [Operator](../level_01/operator.md) — Symbol that performs an operation on operands.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Computers were originally created to calculate numbers. To make mathematical calculations readable and accessible, JavaScript implements standard algebraic symbols. Rather than calling functions like `add(5, 3)` or `multiply(x, y)`, JavaScript developers use standard infixed arithmetic operators: `+` (addition), `-` (subtraction), `*` (multiplication), and `/` (division). Over time, ES6 and ES2016 introduced additional operators like `**` (exponentiation) to align with other modern languages and eliminate dependency on standard library objects like `Math.pow()`.

### (2) Reality Metaphor
Arithmetic operators are like the buttons on a basic pocket calculator. Each symbol takes two numeric inputs (operands), performs a specific mathematical formula, and produces a single output value on the screen.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const sum = 10 + 5; // 15
const difference = 10 - 5; // 5
const product = 10 * 5; // 50
const quotient = 10 / 5; // 2
const remainder = 10 % 3; // 1 (10 divided by 3 is 3, remainder 1)
const power = 2 ** 3; // 8 (2 raised to the power of 3)
```

#### Fuller Example
```javascript
// A simple cash register transaction calculating total price and change
const itemPrice = 15;
const itemQuantity = 3;
const taxRate = 0.08; // 8% sales tax

// Multiply quantities
const subtotal = itemPrice * itemQuantity;

// Calculate tax
const taxAmount = subtotal * taxRate;

// Add values to get total cost
const totalCost = subtotal + taxAmount;

const cashGiven = 50;

// Subtract to calculate change
const changeDue = cashGiven - totalCost;

console.log("Subtotal:", subtotal); // Subtotal: 45
console.log("Total Cost (with Tax):", totalCost); // Total Cost (with Tax): 48.6
console.log("Change Due:", changeDue); // Change Due: 1.4
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: String Concatenation Coercion with `+`

**The mistake:** Attempting to add a number to a string representation of a number using `+`.

**Why it's wrong:** The `+` operator serves a double purpose in JavaScript: addition and string concatenation. If *either* operand is a string, JavaScript converts the other operand to a string and glues them together. Other operators like `-` or `*` do not concatenate strings and will attempt to coerce the string back into a number.

*Incorrect:*
```javascript
const userBalance = "100";
const deposit = 50;

const newBalance = userBalance + deposit; 
console.log(newBalance); // "10050" (Concatenation!)
```

*Fix:*
```javascript
const userBalance = "100";
const deposit = 50;

// Explicitly convert string to a number first
const newBalance = Number(userBalance) + deposit;
console.log(newBalance); // 150
```

---

### Mistake 2: Losing Context Binding (`this`) in Arithmetic Operators Callbacks

**The mistake:** Passing methods from Arithmetic Operators instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "arithmetic_operators",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "arithmetic_operators",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Arithmetic Operators Operations

**The mistake:** Executing asynchronous operations within Arithmetic Operators without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/arithmetic_operators"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/arithmetic_operators");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in arithmetic_operators: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Modulus vs Division

**Problem:** Complete the code so that it prints if a given number `num` is even or odd by checking its remainder when divided by 2.

```javascript
const num = 17;
const isEven = (num % 2) === 0;

if (isEven) {
  console.log("Even");
} else {
  console.log("Odd");
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Odd
> ```
> - The remainder (modulus) operator is `%`.
> - If a number is perfectly divisible by 2, its remainder is `0`.

---

### Exercise 2: Predicting Arithmetic Coercion Results

**Problem:** Predict the output of `"10" - 5`, `"10" + 5`, `"10" * "2"`, and `"10" / "a"`.

**Expected output:**
> [!check]- Answer
> ```text
> 5
> 105
> 20
> NaN
> ```
> ```javascript
> console.log("10" - 5);  // 5 (coerces "10" to number)
> console.log("10" + 5);  // "105" (string concatenation)
> console.log("10" * "2"); // 20 (both coerced to numbers)
> console.log("10" / "a"); // NaN (cannot convert "a" to valid number)
> ```
>
> **Explanation:** The `+` operator prefers string concatenation if any operand is a string, whereas `-`, `*`, and `/` always coerce operands to numbers.

---

### Exercise 3: Remainder Operator Sign Behavior

**Problem:** Calculate `-10 % 3` and `10 % -3` and explain why the sign matches the dividend.

**Expected output:**
> [!check]- Answer
> ```text
> -1
> 1
> ```
> ```javascript
> console.log(-10 % 3);  // -1
> console.log(10 % -3);  // 1
> ```
>
> **Explanation:** In JavaScript, the sign of the `%` remainder result always matches the sign of the left-hand dividend operand.

---

## 7. Related Terms
- [Type Coercion](../level_01/type_coercion.md) — Implicit conversion of values from one data type to another.
- [Increment / Decrement (`++` / `--`)](../level_01/increment_decrement.md) — Operators to add or subtract exactly one.
- [`NaN`](../level_01/nan.md) — The special "Not-a-Number" value returned by invalid mathematical operations.

---

## 8. Key Takeaways
- JavaScript includes standard math operators: `+`, `-`, `*`, `/`, `%` (remainder), and `**` (exponentiation).
- All numbers in JavaScript are represented as double-precision floating-point values (there is no separate integer type at the operator level).
- The `+` operator will trigger string concatenation if either operand is a string.
