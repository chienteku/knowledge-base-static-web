# Number Methods & Parsing

> **Level 2 — Control Flow & Data Structures**
> `parseInt`, `parseFloat`, `toFixed`, `Number()`.

---

## 1. Prerequisites
- [Number](../level_01/number.md) — Represents both integer and floating-point numbers.
- [Type Coercion](../level_01/type_coercion.md) — Automatic or implicit conversion of types.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In web development, data received from the outside world (such as HTML form text fields, query parameters in URLs, or API responses) is almost always formatted as a `String`. If you attempt to run math calculations on these strings directly, JavaScript's weak typing will either concatenate them (e.g. `"10" + 5` becomes `"105"`) or fail with `NaN`. 

To solve this, the TC39 committee provided built-in utilities to extract and format numbers:
- **`Number()`** performs strict coercion.
- **`parseInt()`** and **`parseFloat()`** parse numbers leniently by reading strings left-to-right and stopping at the first non-numeric character.
- **`.toFixed()`** is an instance method on numbers used to round decimal places and format numeric outputs for displays.

### (2) Reality Metaphor
- **`Number()`** is like a strict ticket scanner. If your ticket has a tiny speck of mud or an extra letter, it is rejected entirely as invalid.
- **`parseInt()`** is like a cashier at a ticket counter who manually reads your ticket. If it has extra characters like `"50px"` or `"$5.00"`, the cashier ignores the units and just extracts the first valid number they see.
- **`.toFixed()`** is like rounding a receipt total to two decimal places (cents) for customer readability, even if the database has more fractional values.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const textPrice = "19.99";

const parsedNum = Number(textPrice); // 19.99 (strict conversion)
const integerPart = parseInt(textPrice, 10); // 19 (lenient parsing to base 10 integer)
const floatPart = parseFloat(textPrice); // 19.99 (lenient parsing to decimal)

console.log(parsedNum, integerPart, floatPart); // 19.99 19 19.99
```

#### Fuller Example
```javascript
// Processing CSS styling heights and dynamic discount calculation
const elementHeight = "250px"; // String unit representation
const itemPrice = 14.56789;

// 1. Leniently extract number from units using parseInt
const numericHeight = parseInt(elementHeight, 10); // "10" dictates radix 10 (decimal system)
console.log("Numeric height:", numericHeight); // 250 (Units "px" successfully ignored!)

// 2. Strict check vs Lenient check
console.log(Number(elementHeight)); // NaN (strictly invalid number)
console.log(parseInt(elementHeight, 10)); // 250

// 3. Format total cost display using toFixed()
// CRITICAL: toFixed() returns a STRING representation of the number!
const formattedPrice = itemPrice.toFixed(2);
console.log("Formatted Price: $", formattedPrice); // "Formatted Price: $ 14.57" (Rounded up!)
console.log("Type of formattedPrice:", typeof formattedPrice); // "string"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting `.toFixed()` to Return a Number

**The mistake:** Performing mathematical addition on the result of `.toFixed()`.

**Why it's wrong:** `.toFixed()` returns a `String`, not a `Number`. Adding a number to it will trigger string concatenation rather than numeric addition.

*Incorrect:*
```javascript
const tax = 5.2345;
const formattedTax = tax.toFixed(2); // "5.23" (String!)

const total = formattedTax + 10;
console.log(total); // "5.2310" (Concatenation!)
```

*Fix:*
```javascript
const tax = 5.2345;
const formattedTax = tax.toFixed(2); // "5.23"

// Explicitly coerce the formatted string back to a number before math
const total = Number(formattedTax) + 10;
console.log(total); // 15.23
```

---

### Mistake 2: Losing Context Binding (`this`) in Number Methods Callbacks

**The mistake:** Passing methods from Number Methods instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "number_methods",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "number_methods",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Number Methods Operations

**The mistake:** Executing asynchronous operations within Number Methods without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/number_methods"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/number_methods");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in number_methods: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Format and Sum Price

**Problem:** Complete the code to parse the string input `"39.90USD"`, apply a 20% discount (multiply by 0.8), and format the output to exactly 2 decimal places.

```javascript
const rawInput = "39.90USD";

// Parse number
// Apply discount
// Format to 2 decimal places
const finalOutput = // Write code here

console.log(finalOutput);
```

**Expected output:**
> [!check]- Answer
> ```text
> 31.92
> ```
> - Use `parseFloat(rawInput)` to extract the decimal value.
> - Multiply the result by `0.8`.
> - Call `.toFixed(2)` to format the output.
> 
---

### Exercise 2: Formatting Currency Numbers with `toFixed`

**Problem:** Format `19.999` to 2 decimal places string.

**Expected output:**
> [!check]- Answer
> ```text
> 20.00
> ```
> ```javascript
> const price = 19.999;
> console.log(price.toFixed(2));
> ```
>
> **Explanation:** `toFixed(digits)` rounds numbers to fixed decimal places and returns a formatted string.
> 
---

### Exercise 3: Checking Integer Status with `Number.isInteger`

**Problem:** Check `Number.isInteger(10)` vs `Number.isInteger(10.5)` vs `Number.isInteger("10")`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> false
> false
> ```
> ```javascript
> console.log(Number.isInteger(10));
> console.log(Number.isInteger(10.5));
> console.log(Number.isInteger("10"));
> ```
>
> **Explanation:** `Number.isInteger` returns `true` strictly if input is of type `number` without fractional components.
> 
> 
---

## 7. Related Terms
- [NaN](../level_01/nan.md) — Sentinels returned when parsing completely invalid inputs.
- [Math object](math_object.md) — Built-in object for more advanced math operations.

---

## 8. Key Takeaways
- Use `Number(str)` for strict type conversion (returns `NaN` if any character is invalid).
- Use `parseInt(str, radix)` or `parseFloat(str)` for lenient parsing (reads left-to-right, ignores trailing letters/units).
- Always include the radix parameter (usually `10`) in `parseInt` to specify the numbering base system.
- Use `number.toFixed(digits)` to round and format decimal places; remember that it returns a string.
