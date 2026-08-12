# Number

> **Level 1 — Foundations**
> Represents both integer and floating-point numbers.

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [Variable](variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Number is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Precision Financial Tax & Rounding Engine

**Scenario:** A checkout system calculates sales tax on item prices. Because JavaScript numbers are IEEE 754 double-precision floats, rounding errors must be handled using Number.EPSILON and fixed precision rounding.

**Requirements:**
1. Write a function calculateRoundedTax(price, taxRate).
2. Multiply price by tax rate.
3. Round cleanly to 2 decimal places using Math.round() and scaling.
4. Return rounded number.

> [!check]- Answer
> #### Implementation
> ```javascript
> function calculateRoundedTax(price, taxRate) {
>   const rawTax = price * taxRate;
>   const rounded = Math.round((rawTax + Number.EPSILON) * 100) / 100;
>   return rounded;
> }
> // Verification tests
> console.assert(calculateRoundedTax(10.05, 0.08) === 0.80, "Test 1 Failed");
> console.assert(calculateRoundedTax(100, 0.075) === 7.50, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **IEEE 754 Floating-Point Format**: All numbers in JS are 64-bit binary floating-point numbers (double precision), leading to precision artifacts like 0.1 + 0.2 !== 0.3.
> 2. **Number.EPSILON**: Represents the difference between 1 and the smallest floating-point number greater than 1; used to neutralize rounding errors.
> 3. **Unified Number Type**: JavaScript does not have separate integer and float primitive types; both are instances of the number primitive.
> 
---

### Exercise 2: Safe Integer Boundary Guard

**Scenario:** A database migration tool handles 64-bit primary key values. It must verify that numeric IDs do not exceed Number.MAX_SAFE_INTEGER ($2^{53} - 1$) to prevent silent truncation.

**Requirements:**
1. Write validateSafeIntegerId(id).
2. Check if ID is a safe integer using Number.isSafeInteger().
3. Return boolean indication.

> [!check]- Answer
> #### Implementation
> ```javascript
> function validateSafeIntegerId(id) {
>   return Number.isSafeInteger(id);
> }
> // Verification tests
> console.assert(validateSafeIntegerId(9007199254740991) === true, "Test 1 Failed");
> console.assert(validateSafeIntegerId(9007199254740992) === false, "Test 2 Failed: Unsafe integer passed");
> ```
> #### Technical Explanation
> 1. **Safe Integer Range**: Integers between -(2^53 - 1) and 2^53 - 1 can be represented exactly without rounding precision loss.
> 2. **Number.isSafeInteger()**: Validates that a value is of type number, is an integer, and falls within the safe precision range.
> 3. **Overflow Behavior**: Numbers exceeding safe integer bounds silently lose precision during arithmetic operations.
> 
---

### Exercise 3: String to Number Parsing Pipeline

**Scenario:** An HTTP API query parser parses string parameters into integer page numbers and floating-point price filters using parseInt() and parseFloat().

**Requirements:**
1. Parse page number string using parseInt(str, 10) with explicit radix 10.
2. Parse price string using parseFloat(str).
3. Return object { page, price }.

> [!check]- Answer
> #### Implementation
> ```javascript
> function parseQueryParams(pageStr, priceStr) {
>   const page = parseInt(pageStr, 10);
>   const price = parseFloat(priceStr);
> const validPage = Number.isNaN(page) ? 1 : page;
>   const validPrice = Number.isNaN(price) ? 0.0 : price;
> return { page: validPage, price: validPrice };
> }
> // Verification tests
> const res = parseQueryParams("5", "19.99");
> console.assert(res.page === 5 && res.price === 19.99, "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Radix Enforcement**: Always specify radix 10 in parseInt(str, 10) to prevent unexpected octal/hexadecimal parsing.
> 2. **parseFloat Parsing**: Extracts leading floating-point numbers from strings, stopping at the first non-numeric character.
> 3. **NaN Validation**: Invalid conversions return NaN, which should be checked using Number.isNaN().
---

## 6. Related Terms
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [String](string.md) — A sequence of characters representing text.
- [BigInt](bigint.md) — Related concept: BigInt.
- [Type Coercion](type_coercion.md) — Related concept: Type Coercion.
- [Math object](../level_02/math_object.md) — Related concept: Math object.

---

## 7. Key Takeaways
- JavaScript uses a single `Number` type for both integers and decimals.
- All numbers are 64-bit floating-point numbers.
- Watch out for precision issues when doing math with decimals.
- Special number values include `NaN` (Not a Number) and `Infinity`.
