# Number

> **Level 1 — Foundations**
> Represents both integer and floating-point numbers.

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — Basic immutable data types.
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
In many programming languages like C or Java, developers must explicitly choose between integers (whole numbers) and floating-point numbers (decimals). This requires understanding memory allocation and hardware limits. Brendan Eich designed JavaScript to be accessible. To simplify things, JavaScript uses a single `Number` type for all numerical values.

Under the hood, JavaScript represents all numbers as 64-bit floating-point numbers (specifically, the IEEE 754 standard). While this simplifies code writing, it introduces famous quirks with floating-point math (like `0.1 + 0.2` not exactly equaling `0.3`).

### (2) Reality Metaphor
Think of the `Number` type as an incredibly precise digital scale that works for everything from measuring a truckload of bricks (integers) to a microscopic speck of dust (decimals). You don't need a different scale for different objects, but sometimes reading the tiniest decimals gets slightly fuzzy.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const integerNum = 42;
const floatNum = 3.14159;
const negativeNum = -10;

console.log(integerNum + floatNum); // 45.14159
```

#### Fuller Example
```javascript
// Examples of Number features and operations
const score = 100;
const multiplier = 1.5;
const finalScore = score * multiplier;

// Special numeric values
const notANumber = NaN; // Occurs when a math operation fails
const infinity = Infinity; // Division by zero

console.log(`Final Score: ${finalScore}`);

// A classic floating point quirk
const a = 0.1;
const b = 0.2;
const sum = a + b;
console.log(`0.1 + 0.2 = ${sum}`); // 0.30000000000000004
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Floating Point Math Precision

**The mistake:** Assuming that `0.1 + 0.2 === 0.3` evaluates to `true`.

**Why it's wrong:** Because of the IEEE 754 standard, some decimal fractions cannot be represented exactly in binary floating-point. The result is a number extremely close to 0.3, but not exactly 0.3.

*Incorrect:*
```javascript
const price = 0.1 + 0.2;
if (price === 0.3) {
  // This block will never run!
  console.log("Discount applied!");
}
```

*Fix:*
```javascript
// One common fix is to work with integers (e.g. cents instead of dollars)
const priceInCents = 10 + 20; 
if (priceInCents === 30) {
  console.log("Discount applied!");
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Number Callbacks

**The mistake:** Passing methods from Number instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "number",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "number",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Number Operations

**The mistake:** Executing asynchronous operations within Number without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/number"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/number");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in number: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Math Operations

**Problem:** Calculate the area of a circle with a radius of 5. Use `Math.PI` for Pi, and log the result rounded to two decimal places.

**Expected output:**
> [!check]- Answer
> ```text
> 78.54
> ```
> - Area = Pi * radius^2
> - To round a number to a specific number of decimal places, you can use `Number.prototype.toFixed(2)`, but remember that `.toFixed()` returns a *string*, so you may need to convert it back or just log it.

---

### Exercise 2: Safe Integer Boundaries

**Problem:** Print `Number.MAX_SAFE_INTEGER` and explain why `9007199254740991 + 1 === 9007199254740991 + 2`.

**Expected output:**
> [!check]- Answer
> ```text
> 9007199254740991
> true
> ```
> ```javascript
> console.log(Number.MAX_SAFE_INTEGER);
> console.log((9007199254740991 + 1) === (9007199254740991 + 2));
> ```
>
> **Explanation:** Double precision floats lose 1-unit integer precision beyond $2^{53} - 1$ (`9007199254740991`).

---

### Exercise 3: Parsing Numbers with `parseInt` and `parseFloat`

**Problem:** Parse `"100px"`, `"10.5em"`, and `"abc100"` using `parseInt` and `parseFloat`.

**Expected output:**
> [!check]- Answer
> ```text
> 100
> 10.5
> NaN
> ```
> ```javascript
> console.log(parseInt("100px", 10));
> console.log(parseFloat("10.5em"));
> console.log(parseInt("abc100", 10));
> ```
>
> **Explanation:** `parseInt` and `parseFloat` read leading numeric characters until encountering non-numeric characters.


---

## 7. Related Terms
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [String](string.md) — A sequence of characters representing text.
- [BigInt](bigint.md) — Related concept: BigInt.
- [Type Coercion](type_coercion.md) — Related concept: Type Coercion.
- [Math object](../level_02/math_object.md) — Related concept: Math object.
---

## 8. Key Takeaways
- JavaScript uses a single `Number` type for both integers and decimals.
- All numbers are 64-bit floating-point numbers.
- Watch out for precision issues when doing math with decimals.
- Special number values include `NaN` (Not a Number) and `Infinity`.
