# String

> **Level 1 — Foundations**
> A sequence of characters representing text, enclosed in quotes (`"`, `'`, or `` ` ``).

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
Computers fundamentally process numbers, but humans communicate using text. We needed a data type that allows developers to store, manipulate, and display human-readable characters—everything from letters and numbers to punctuation and emojis. 

In JavaScript, a String is a primitive data type that represents a sequence of 16-bit code units (UTF-16). To make strings easy to work with, the language wraps string primitives in an invisible `String` object whenever you try to access a property, giving you access to powerful built-in methods like `.length`, `.toUpperCase()`, and `.split()`.

### (2) Reality Metaphor
A string is like a beaded necklace. The necklace as a whole is the string, and each individual bead is a character. You can count the beads (the string's length), look at a specific bead by its position, or combine two necklaces to make a longer one (concatenation). But because primitives are immutable, you can't swap a single bead; you have to string a completely new necklace if you want to make a change.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Strings can be created using single quotes, double quotes, or backticks
const firstName = 'Alice';
const lastName = "Smith";
const greeting = `Hello, ${firstName} ${lastName}!`; // Template literal

console.log(greeting);
```

#### Fuller Example
```javascript
const rawInput = '   user@EXAMPLE.com   ';

// We can chain string methods to clean up the data
// Note: Each method returns a NEW string. The original remains unchanged.
const cleanEmail = rawInput.trim().toLowerCase();

console.log(`Original: "${rawInput}"`);
console.log(`Cleaned: "${cleanEmail}"`);

// Checking if a string contains specific characters
if (cleanEmail.includes('@')) {
  console.log('Valid email format.');
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mismatched Quotes

**The mistake:** Starting a string with one type of quote and ending it with another, or failing to escape a quote character inside the string.

**Why it's wrong:** The JavaScript engine looks for the exact matching quote to determine where the string ends. If it finds a quote inside the string of the same type, it thinks the string has ended prematurely, causing a Syntax Error.

*Incorrect:*
```javascript
// const badMsg = 'It's a beautiful day'; // SyntaxError
```

*Fix:*
```javascript
// Escape the quote with a backslash
const goodMsg = 'It\'s a beautiful day';

// Or use a different type of quote for the outer boundary
const betterMsg = "It's a beautiful day";

// Or use template literals (recommended for modern JS)
const bestMsg = `It's a beautiful day`;
```

---

### Mistake 2: Losing Context Binding (`this`) in String Callbacks

**The mistake:** Passing methods from String instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "string",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "string",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in String Operations

**The mistake:** Executing asynchronous operations within String without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/string"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/string");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in string: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Extracting Substrings

**Problem:** Given the string `const url = "https://www.example.com";`, extract just the domain name `"example.com"` using string methods and log it to the console.

**Expected output:**
> [!check]- Answer
> ```text
> example.com
> ```
> - Check out the `.slice()` or `.substring()` methods.
> - You can find the starting position by looking at the index after `"www."`.
> - `.slice(12)` will extract everything from the 12th character to the end.
> 
---

### Exercise 2: String Immutability & Method Returns

**Problem:** Call `str.toUpperCase()` on `let str = "hello"` and demonstrate that `str` remains unchanged unless reassigned.

**Expected output:**
> [!check]- Answer
> ```text
> Original: hello, Upper: HELLO
> ```
> ```javascript
> let str = "hello";
> let upper = str.toUpperCase();
> console.log(`Original: ${str}, Upper: ${upper}`);
> ```
>
> **Explanation:** String methods do not mutate strings in-place; they return brand new primitive string values.
> 
---

### Exercise 3: String UTF-16 Code Points vs Length

**Problem:** Print `"hello".length` vs `"👍".length` and explain why the emoji length is `2`.

**Expected output:**
> [!check]- Answer
> ```text
> 5
> 2
> ```
> ```javascript
> console.log("hello".length);
> console.log("👍".length); // Surrogate pair (2 UTF-16 code units)
> ```
>
> **Explanation:** String `.length` measures 16-bit code units, not Unicode grapheme clusters. Emoji outside BMP take 2 surrogate code units.
> 
> 
---

## 7. Related Terms
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [Number](number.md) — Related concept: Number.
- [Type Coercion](type_coercion.md) — Related concept: Type Coercion.
- [Template Literals](../level_08/template_literals.md) — Related concept: Template Literals.

---

## 8. Key Takeaways
- Strings are immutable primitives; methods that manipulate strings always return a new string.
- You can create strings using single quotes (`'`), double quotes (`"`), or backticks (`` ` ``).
- Backticks (Template Literals) are preferred in modern JavaScript because they allow multi-line strings and easy variable interpolation using `${}`.
