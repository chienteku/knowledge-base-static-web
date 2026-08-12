# Arithmetic Operators

> **Level 1 — Foundations**
> `+ - * / % **` for math on numbers.

---

## 1. Prerequisites
- [Number](number.md) — Represents both integer and floating-point numbers.
- [Operator](operator.md) — Symbol that performs an operation on operands.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Arithmetic Operators is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: E-Commerce Shopping Cart Discount & Tax Calculator

**Scenario:** An e-commerce checkout service needs to compute an order's subtotal, apply a percentage promotional discount, calculate regional sales tax, and add a flat shipping fee in strict financial sequence.

**Requirements:**
1. Write a function calculateOrderTotal(subtotal, discountPercent, taxRate, shippingFee).
2. Compute the discounted subtotal using multiplication * and subtraction -.
3. Compute the tax amount on the discounted subtotal using multiplication *.
4. Return the final total by adding + the discounted subtotal, tax amount, and shipping fee.

> [!check]- Answer
> #### Implementation
> ```javascript
> function calculateOrderTotal(subtotal, discountPercent, taxRate, shippingFee) {
>   const discountAmount = subtotal * (discountPercent / 100);
>   const discountedSubtotal = subtotal - discountAmount;
>   const taxAmount = discountedSubtotal * taxRate;
>   const finalTotal = discountedSubtotal + taxAmount + shippingFee;
>   return Number(finalTotal.toFixed(2));
> }
> // Verification tests
> console.assert(calculateOrderTotal(100, 10, 0.08, 5) === 102.20, "Test 1 Failed");
> console.assert(calculateOrderTotal(200, 20, 0.05, 10) === 178.00, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Operator Precedence**: Division and multiplication operations evaluate before addition and subtraction. Parentheses () explicitly override default precedence.
> 2. **Floating-Point Precision**: Binary floating-point arithmetic (IEEE 754) can introduce decimal imprecisions. Using .toFixed(2) rounds values to exact cent values.
> 3. **Binary Arithmetic Operations**: Arithmetic operators (+, -, *, /) take two numeric operands and produce a new primitive number without mutating inputs.
> 
---

### Exercise 2: Game Engine Experience & Leveling Algorithm

**Scenario:** A game engine backend determines a player's level based on accumulated experience points (XP). Higher levels require exponentially more XP, and leftover XP carries over to the progress bar.

**Requirements:**
1. Write calculateLevelAndRemainder(totalXp, levelCost).
2. Compute full levels earned using division / and Math.floor().
3. Compute remaining XP using the remainder operator %.
4. Return an object containing { level, remainderXp }.

> [!check]- Answer
> #### Implementation
> ```javascript
> function calculateLevelAndRemainder(totalXp, levelCost) {
>   const level = Math.floor(totalXp / levelCost);
>   const remainderXp = totalXp % levelCost;
>   return { level, remainderXp };
> }
> // Verification tests
> const res1 = calculateLevelAndRemainder(250, 100);
> console.assert(res1.level === 2 && res1.remainderXp === 50, "Test 1 Failed");
> const res2 = calculateLevelAndRemainder(95, 100);
> console.assert(res2.level === 0 && res2.remainderXp === 95, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Remainder Operator (%)**: The % operator calculates the integer remainder resulting from dividing the dividend by the divisor.
> 2. **Integer Partitioning**: Combining division / with Math.floor() separates whole completed level units from fractional remainder progress.
> 3. **Exponentiation Operator (**)**: The ** operator provides a concise infix syntax for power calculations, evaluating from right to left.
> 
---

### Exercise 3: Financial Micro-Transaction Remainder Splitter

**Scenario:** A payroll system splits a pool of money in integer cents evenly among N contractor accounts and computes the leftover undistributed cents so they can be assigned to a reserve buffer.

**Requirements:**
1. Write splitPayoutCents(totalCents, accountCount).
2. Calculate the equal share per account using integer division.
3. Calculate leftover undistributed cents using remainder %.
4. Return an object { sharePerAccount, reserveCents }.

> [!check]- Answer
> #### Implementation
> ```javascript
> function splitPayoutCents(totalCents, accountCount) {
>   if (accountCount <= 0) throw new Error("Account count must be positive");
>   const sharePerAccount = Math.floor(totalCents / accountCount);
>   const reserveCents = totalCents % accountCount;
>   return { sharePerAccount, reserveCents };
> }
> // Verification tests
> const result = splitPayoutCents(1005, 4);
> console.assert(result.sharePerAccount === 251, "Test 1 Failed");
> console.assert(result.reserveCents === 1, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Integer Cent Arithmetic**: Converting currency amounts to integer cents before running division or remainder avoids floating-point inaccuracies.
> 2. **Exact Dividend Partitioning**: The invariant total = (share * count) + remainder holds true across all positive integer splits.
> 3. **Immutability of Operands**: Arithmetic evaluation produces new primitive values without altering the original input argument bindings.
---

## 6. Related Terms
- [Type Coercion](type_coercion.md) — Implicit conversion of values from one data type to another.
- [Increment / Decrement (++ / --)](increment_decrement.md) — Operators to add or subtract exactly one.
- [NaN](nan.md) — The special "Not-a-Number" value returned by invalid mathematical operations.
- [Assignment Operators](assignment_operators.md) — Related concept: Assignment Operators.
- [Infinity / -Infinity](infinity.md) — Related concept: Infinity / -Infinity.
- [Operator](operator.md) — Related concept: Operator.
- [Operator Precedence & Associativity](operator_precedence.md) — Related concept: Operator Precedence & Associativity.

---

## 7. Key Takeaways
- JavaScript includes standard math operators: `+`, `-`, `*`, `/`, `%` (remainder), and `**` (exponentiation).
- All numbers in JavaScript are represented as double-precision floating-point values (there is no separate integer type at the operator level).
- The `+` operator will trigger string concatenation if either operand is a string.
