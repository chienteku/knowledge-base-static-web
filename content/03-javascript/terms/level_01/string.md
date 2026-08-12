# String

> **Level 1 — Foundations**
> A sequence of characters representing text, enclosed in quotes (`"`, `'`, or `` ` ``).

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [Variable](variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: String is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: User Profile Display Name Sanitizer

**Scenario:** A user onboarding service formats and truncates raw profile names using string manipulation methods (trim(), slice(), toUpperCase(), template literals).

**Requirements:**
1. Trim leading and trailing whitespace using .trim().
2. Capitalize the first letter using .toUpperCase().
3. Truncate name if it exceeds maxLen using .slice().
4. Return formatted string using template literals.

> [!check]- Answer
> #### Implementation
> ```javascript
> function formatDisplayName(rawName, maxLen = 10) {
>   if (typeof rawName !== "string") return "";
>   const trimmed = rawName.trim();
>   if (trimmed.length === 0) return "";
> const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
>   if (capitalized.length > maxLen) {
>     return capitalized.slice(0, maxLen) + "...";
>   }
>   return capitalized;
> }
> // Verification tests
> console.assert(formatDisplayName("  alice  ") === "Alice", "Test 1 Failed");
> console.assert(formatDisplayName("alexander", 5) === "Alexa...", "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **String Immutability**: Strings in JavaScript are immutable primitive values; methods return brand new strings without modifying the original.
> 2. **UTF-16 Character Encoding**: JavaScript strings are sequences of 16-bit code units.
> 3. **Template Literals**: Backtick syntax enables expressions inside placeholders.
> 
---

### Exercise 2: URL Query Parameter Extractor

**Scenario:** A web router utility parses key-value pairs from raw URL query strings using .indexOf(), .substring(), and .split().

**Requirements:**
1. Remove leading ? character if present.
2. Split parameter pairs using .split("&").
3. Split keys and values using .split("=").
4. Return a key-value dictionary object.

> [!check]- Answer
> #### Implementation
> ```javascript
> function parseQueryString(queryString) {
>   const result = {};
>   if (!queryString || typeof queryString !== "string") return result;
> let cleanQuery = queryString.startsWith("?") ? queryString.slice(1) : queryString;
>   const pairs = cleanQuery.split("&");
>   for (const pair of pairs) {
>     if (!pair) continue;
>     const [key, val] = pair.split("=");
>     if (key) {
>       result[decodeURIComponent(key)] = val ? decodeURIComponent(val) : "";
>     }
>   }
>   return result;
> }
> // Verification tests
> const parsed = parseQueryString("?user=alice&role=admin");
> console.assert(parsed.user === "alice" && parsed.role === "admin", "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **String Searching & Extraction**: Methods like .startsWith(), .slice(), and .split() enable string parsing.
> 2. **Immutability Protection**: String operations create new string segments in memory without modifying source text.
> 3. **Primitive Status**: Primitive strings use memory-efficient stack representation with auto-boxing when calling methods.
> 
---

### Exercise 3: Dynamic Email Template Interpolator

**Scenario:** A notification service generates dynamic email body content by replacing template placeholders using .replaceAll().

**Requirements:**
1. Accept template string and variables dictionary object.
2. Replace all {{key}} placeholders with corresponding dictionary values.
3. Return populated message text.

> [!check]- Answer
> #### Implementation
> ```javascript
> function populateEmailTemplate(template, vars) {
>   let message = template;
>   for (const key of Object.keys(vars)) {
>     const placeholder = "{{" + key + "}}";
>     message = message.replaceAll(placeholder, String(vars[key]));
>   }
>   return message;
> }
> // Verification tests
> const tpl = "Hello {{name}}, your order {{orderId}} is confirmed.";
> const msg = populateEmailTemplate(tpl, { name: "Bob", orderId: "10042" });
> console.assert(msg === "Hello Bob, your order 10042 is confirmed.", "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **ES2021 replaceAll()**: Replaces all matching substring instances across a target string.
> 2. **Sequential Immutability**: Each .replaceAll() step returns a new string version, leaving intermediate strings for garbage collection.
> 3. **Template Composition**: Clean text substitution separates markup templates from dynamic runtime data.
---

## 6. Related Terms
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [Number](number.md) — Related concept: Number.
- [Type Coercion](type_coercion.md) — Related concept: Type Coercion.
- [Template Literals](../level_08/template_literals.md) — Related concept: Template Literals.

---

## 7. Key Takeaways
- Strings are immutable primitives; methods that manipulate strings always return a new string.
- You can create strings using single quotes (`'`), double quotes (`"`), or backticks (`` ` ``).
- Backticks (Template Literals) are preferred in modern JavaScript because they allow multi-line strings and easy variable interpolation using `${}`.
