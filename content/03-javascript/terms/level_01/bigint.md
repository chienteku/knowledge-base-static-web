# BigInt

> **Level 1 — Foundations**
> Primitive for arbitrarily large integers (`123n`).

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [Number](number.md) — Represents both integer and floating-point numbers.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, the standard `Number` type is represented as double-precision floating-point values. This format has a strict limit on integer accuracy: `Number.MAX_SAFE_INTEGER` (`2^53 - 1` or `9,007,199,254,740,991`). Any math performed on integers larger than this limit loses precision (e.g., `9007199254740991 + 1` and `9007199254740991 + 2` both evaluate to `9007199254740992`).

With the rise of high-precision timestamps, large database unique identifiers (like Snowflake IDs), and cryptographic applications, losing precision became a major blocker. In ES2020, the TC39 committee introduced `BigInt`—a new primitive type capable of representing integers with arbitrary precision. BigInts can grow as large as the computer's memory allows, ensuring that mathematical calculations remain perfectly accurate.

### (2) Reality Metaphor
A standard `Number` is like a standard calculator screen that can only display up to 16 digits. If you try to add numbers that exceed 16 digits, the display rounds the numbers or switches to scientific notation (like `9.007e+15`), losing the exact end digits. 

`BigInt` is like writing math on a scroll of paper. You can make the numbers as long as the scroll allows, and you will never lose precision because you can write down every single digit manually.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Creating a BigInt: append 'n' to the integer literal or use BigInt()
const bigIntNum = 9007199254740991n;
const parsedBigInt = BigInt("9007199254740995");

console.log(bigIntNum + 10n); // 9007199254741001n (Perfect precision!)
console.log(typeof bigIntNum); // "bigint"
```

#### Fuller Example
```javascript
// Demonstrating the safe integer limit bug vs BigInt precision
const maxSafe = Number.MAX_SAFE_INTEGER; // 9007199254740991

const numA = maxSafe + 1; // 9007199254740992
const numB = maxSafe + 2; // 9007199254740992 (Oops! Precision lost)
console.log("Standard number precision loss:", numA === numB); // true

// Same calculation using BigInt
const bigSafe = BigInt(Number.MAX_SAFE_INTEGER); // 9007199254740991n
const bigA = bigSafe + 1n; // 9007199254740992n
const bigB = bigSafe + 2n; // 9007199254740993n
console.log("BigInt precision check:", bigA === bigB); // false (Perfect accuracy!)

// BigInt division truncates decimals (integer division)
const quotient = 5n / 2n;
console.log("BigInt division:", quotient); // 2n (Not 2.5n!)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mixing `BigInt` and `Number` in Operations

**The mistake:** Attempting to perform calculations using a mixture of `Number` and `BigInt` values.

**Why it's wrong:** JavaScript does not allow implicit coercion between standard `Number` and `BigInt` because doing so could lead to accidental precision loss. Mixing them directly throws a `TypeError`. You must explicitly convert one type to match the other.

*Incorrect:*
```javascript
const count = 10n;
const multiplier = 2;

const total = count * multiplier; // TypeError: Cannot mix BigInt and other types
```

*Fix:*
```javascript
const count = 10n;
const multiplier = 2;

// Explicitly convert standard Number to BigInt first
const total = count * BigInt(multiplier); 
console.log(total); // 20n
```

### Mistake 2: Losing Context Binding (`this`) in Bigint Callbacks

**The mistake:** Passing methods from Bigint instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "bigint",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "bigint",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Bigint Operations

**The mistake:** Executing asynchronous operations within Bigint without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/bigint"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/bigint");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in bigint: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: BigInt Division Truncation

**Problem:** Predict the output of the following calculation and write code to confirm it.

```javascript
const dividend = 100n;
const divisor = 3n;
const result = dividend / divisor;

console.log(result);
```

**Expected output:**
> [!check]- Answer
> ```text
> 33n
> ```
> - BigInt represents integers only.
> - Divisions that produce decimals are always rounded down (truncated) to the nearest integer.
> 
---

### Exercise 2: Creating BigInt Values

**Problem:** Create a BigInt value representing `9007199254740993n` using `n` suffix syntax and `BigInt()` constructor from string.

**Expected output:**
> [!check]- Answer
> ```text
> 9007199254740993n
> 9007199254740993n
> ```
> ```javascript
> const b1 = 9007199254740993n;
> const b2 = BigInt("9007199254740993");
> console.log(b1);
> console.log(b2);
> ```
>
> **Explanation:** BigInt literals require an `n` suffix or string parsing in `BigInt("...")` to avoid Number precision limits.
> 
---

### Exercise 3: BigInt Division Truncation

**Problem:** Divide `7n / 2n` and explain why the result is `3n` instead of `3.5`.

**Expected output:**
> [!check]- Answer
> ```text
> 3n
> ```
> ```javascript
> console.log(7n / 2n); // 3n
> ```
>
> **Explanation:** BigInt division operates on integers exclusively, truncating fractional remainder components.
> 
---

## 7. Related Terms
- [Number](number.md) — Double-precision floating-point number.
- [Primitive Types](primitive_types.md) — Foundational immutable types.
- [typeof](typeof.md) — Operator to check type of values.

---

## 8. Key Takeaways
- `BigInt` is a primitive type designed to handle arbitrarily large integers beyond the `Number.MAX_SAFE_INTEGER` boundary.
- Declare a `BigInt` by appending `n` to the integer literal or using the `BigInt()` constructor.
- You cannot mix `BigInt` and standard `Number` values in calculations; they must be explicitly converted.
- BigInt division truncates decimals towards zero (yielding another BigInt integer).
