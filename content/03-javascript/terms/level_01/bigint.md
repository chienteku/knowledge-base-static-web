# BigInt

> **Level 1 — Foundations**
> Primitive for arbitrarily large integers (`123n`).

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [Number](number.md) — Represents both integer and floating-point numbers.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: BigInt is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Cryptographic 64-Bit Nonce Generator

**Scenario:** A security library generates 64-bit cryptographic nonces by shifting a 32-bit timestamp into high bits and combining it with a random 32-bit integer. Standard JavaScript Numbers lose integer precision past 53 bits ($2^{53} - 1$).

**Requirements:**
1. Convert integer inputs into BigInt primitives using n suffix or BigInt().
2. Shift the high-order bits 32 positions to the left using << 32n.
3. Combine high and low bits using bitwise OR |.
4. Return the combined 64-bit BigInt nonce.

> [!check]- Answer
> #### Implementation
> ```javascript
> function generate64BitNonce(high32, low32) {
>   const highBits = BigInt(high32);
>   const lowBits = BigInt(low32);
> const nonce = (highBits << 32n) | lowBits;
> return nonce;
> }
> // Verification tests
> const nonce = generate64BitNonce(1, 500);
> console.assert(typeof nonce === "bigint", "Test 1 Failed: Result must be a BigInt");
> console.assert(nonce === 4294967796n, "Test 2 Failed: Nonce calculation incorrect");
> ```
> #### Technical Explanation
> 1. **Arbitrary-Precision Integers**: BigInt represents arbitrary-precision integers, bypassing the 53-bit limit (Number.MAX_SAFE_INTEGER) of IEEE 754 floating-point numbers.
> 2. **BigInt Literals**: BigInt literals end with an n suffix (e.g. 32n) or are constructed via BigInt(value).
> 3. **Bitwise BigInt Operations**: Bitwise shift << and bitwise OR | work directly on BigInt operands without truncation to 32-bit integers.
> 
---

### Exercise 2: High-Precision Financial Ledger Balance Accumulator

**Scenario:** A cryptocurrency exchange ledger tracks transactions in sub-satoshi units (18 decimal places). Standard numbers introduce rounding errors. All balance calculations must use BigInt units.

**Requirements:**
1. Write calculateLedgerBalance(initialBalance, transactions).
2. Iterate through transaction amounts (BigInt values) and update total balance.
3. Prevent mixing BigInt and Number types in mathematical expressions.
4. Return final balance formatted as a string.

> [!check]- Answer
> #### Implementation
> ```javascript
> function calculateLedgerBalance(initialBalance, transactions) {
>   let balance = BigInt(initialBalance);
> for (const tx of transactions) {
>     balance += BigInt(tx);
>   }
> return balance.toString();
> }
> // Verification tests
> const initial = 1000000000000000000n; // 1 ETH in Wei
> const txs = [500000000000000000n, -200000000000000000n];
> const finalBal = calculateLedgerBalance(initial, txs);
> console.assert(finalBal === "1300000000000000000", "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Strict Type Separation**: BigInt and Number types cannot be mixed directly in arithmetic operations; implicit coercion throws a TypeError.
> 2. **Financial Precision**: Representing currency in sub-units via BigInt eliminates floating-point rounding errors completely.
> 3. **String Serialization**: BigInt values cannot be serialized directly by JSON.stringify() without explicit .toString() conversion.
> 
---

### Exercise 3: 64-Bit Primary Key Range Filter

**Scenario:** A database query engine receives 64-bit ID parameters as strings and must filter out records whose numeric IDs fall outside specified minimum and maximum bounds.

**Requirements:**
1. Parse string IDs into BigInt values.
2. Compare BigInt values using relational operators (>=, <=).
3. Return matching records.

> [!check]- Answer
> #### Implementation
> ```javascript
> function filterByBigIntRange(records, minIdStr, maxIdStr) {
>   const minId = BigInt(minIdStr);
>   const maxId = BigInt(maxIdStr);
> return records.filter(record => {
>     const recordId = BigInt(record.id);
>     return recordId >= minId && recordId <= maxId;
>   });
> }
> // Verification tests
> const recordsList = [
>   { id: "9007199254740993" },
>   { id: "9007199254740995" },
>   { id: "9007199254741000" }
> ];
> const filtered = filterByBigIntRange(recordsList, "9007199254740994", "9007199254740999");
> console.assert(filtered.length === 1 && filtered[0].id === "9007199254740995", "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Relational Operator Support**: Relational comparison operators (>, <, >=, <=) work seamlessly between BigInt values.
> 2. **Safe String Parsing**: Passing large numeric strings to BigInt(str) parses exact 64-bit integers without precision truncation.
> 3. **Type Identification**: typeof myBigInt evaluates strictly to "bigint".
---

## 6. Related Terms
- [Number](number.md) — Double-precision floating-point number.
- [Primitive Types](primitive_types.md) — Foundational immutable types.
- [typeof](typeof.md) — Operator to check type of values.

---

## 7. Key Takeaways
- `BigInt` is a primitive type designed to handle arbitrarily large integers beyond the `Number.MAX_SAFE_INTEGER` boundary.
- Declare a `BigInt` by appending `n` to the integer literal or using the `BigInt()` constructor.
- You cannot mix `BigInt` and standard `Number` values in calculations; they must be explicitly converted.
- BigInt division truncates decimals towards zero (yielding another BigInt integer).
