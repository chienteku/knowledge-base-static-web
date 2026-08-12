# Number Methods & Parsing

> **Level 2 — Control Flow & Data Structures**
> `parseInt`, `parseFloat`, `toFixed`, `Number()`.

---

## 1. Prerequisites
- [Number](../level_01/number.md) — Represents both integer and floating-point numbers.
- [Type Coercion](../level_01/type_coercion.md) — Automatic or implicit conversion of types.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Number Methods & Parsing is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Invoice Line Item Price Formatter

**Scenario:** An invoicing service formats floating-point prices into currency strings using Number.prototype.toFixed(2) and validates numbers using Number.isFinite().

**Requirements:**
1. Write formatInvoiceItem(rawPrice, quantity).
2. Validate inputs using Number.isFinite().
3. Compute subtotal.
4. Return subtotal formatted using .toFixed(2).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function formatInvoiceItem(rawPrice, quantity) {
>   if (!Number.isFinite(rawPrice) || !Number.isFinite(quantity)) {
>     throw new Error("Invalid numeric payload");
>   }
>   const subtotal = rawPrice * quantity;
>   return subtotal.toFixed(2);
> }
>
> // Verification tests
> console.assert(formatInvoiceItem(19.99, 3) === "59.97", "Test 1 Failed");
> console.assert(typeof formatInvoiceItem(10, 2) === "string", "Test 2 Failed: toFixed must return string");
> ```
>
> #### Technical Explanation
>
> 1. **toFixed() Return Type**: Number.prototype.toFixed(digits) formats numbers into fixed-point decimal strings.
> 2. **Number.isFinite() Security**: Static method Number.isFinite() rejects Infinity, -Infinity, and NaN.
> 3. **Auto-Boxing Primitives**: Calling prototype methods on primitive numbers triggers temporary auto-boxing.
> 
---

### Exercise 2: Precision Metric Exponent Formatter

**Scenario:** A telemetry service formats large scientific measurement values into exponential notation using .toExponential() and custom precision using .toPrecision().

**Requirements:**
1. Write formatTelemetryMetric(value, precision).
2. Format using .toExponential() and .toPrecision().
3. Return object { expString, precString }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function formatTelemetryMetric(value, precision) {
>   const num = Number(value);
>   if (!Number.isFinite(num)) {
>     return { expString: "Invalid", precString: "Invalid" };
>   }
>   return {
>     expString: num.toExponential(2),
>     precString: num.toPrecision(precision)
>   };
> }
>
> // Verification tests
> const res = formatTelemetryMetric(123456, 4);
> console.assert(res.expString === "1.23e+5", "Test 1 Failed");
> console.assert(res.precString === "1.235e+5", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **toExponential() Method**: Formats numbers in scientific exponential notation with specified decimal places.
> 2. **toPrecision() Method**: Formats numbers to a specified total count of significant digits.
> 3. **String Conversion**: All Number prototype formatting methods return string primitive values.
> 
---

### Exercise 3: Numeric String Parser with Radix Validation

**Scenario:** An API data parser parses integer IDs and floating point metrics from string payloads using Number.parseInt() and Number.parseFloat().

**Requirements:**
1. Write parsePayloadNumbers(idStr, priceStr).
2. Parse id using Number.parseInt(idStr, 10).
3. Parse price using Number.parseFloat(priceStr).
4. Return object { id, price, isIdInteger }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parsePayloadNumbers(idStr, priceStr) {
>   const id = Number.parseInt(idStr, 10);
>   const price = Number.parseFloat(priceStr);
>   const isIdInteger = Number.isInteger(id);
>
>   return { id, price, isIdInteger };
> }
>
> // Verification tests
> const parsed = parsePayloadNumbers("42", "19.95");
> console.assert(parsed.id === 42, "Test 1 Failed");
> console.assert(parsed.price === 19.95, "Test 2 Failed");
> console.assert(parsed.isIdInteger === true, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Number.parseInt() Radix**: Always pass explicit radix 10 to Number.parseInt(str, 10) to specify decimal parsing.
> 2. **Number.parseFloat()**: Parses floating-point number values from string inputs until non-numeric characters occur.
> 3. **Number.isInteger()**: Validates whether a number is a finite integer without fractional components.
---

## 6. Related Terms
- [NaN](../level_01/nan.md) — Sentinels returned when parsing completely invalid inputs.
- [Math object](math_object.md) — Built-in object for more advanced math operations.

---

## 7. Key Takeaways
- Use `Number(str)` for strict type conversion (returns `NaN` if any character is invalid).
- Use `parseInt(str, radix)` or `parseFloat(str)` for lenient parsing (reads left-to-right, ignores trailing letters/units).
- Always include the radix parameter (usually `10`) in `parseInt` to specify the numbering base system.
- Use `number.toFixed(digits)` to round and format decimal places; remember that it returns a string.
