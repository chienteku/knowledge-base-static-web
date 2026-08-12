# Regular Expressions (RegExp)

> **Level 9 — Advanced Concepts & Patterns**
> Pattern matching for strings.

---

## 1. Prerequisites
- [String](../level_01/string.md) — The sequence of characters text type.
- [String Methods](../level_02/string_methods.md) — Text manipulation helpers.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Regular Expressions (RegExp) is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Validating strings using custom loops, `indexOf` checks, or split methods is tedious and error-prone when handling complex requirements—such as verifying email structures, parsing log files, or formatting phone numbers.

To solve this, JavaScript implements **Regular Expressions (RegExp)**—a specialized syntax imported from computer science theory that defines string search patterns.
- **Syntax:** Literal slashes `/pattern/flags` (e.g., `/\d+/g`) or the constructor `new RegExp("pattern", "flags")`.
- **RegExp methods:**
  - `regex.test(string)` returns `true` if the pattern matches anywhere in the target string.
  - `regex.exec(string)` executes a search, returning detailed match groupings or `null`.
- **String methods using RegExp:** `.match()`, `.replace()`, `.search()`, and `.split()`.

#### Key Flags:
- **`g` (global):** Matches all occurrences instead of stopping after the first match.
- **`i` (ignoreCase):** Performs case-insensitive matching.
- **`m` (multiline):** Treats start/end characters (`^`/`$`) as spanning across multiple lines.

### (2) Reality Metaphor
- Standard string checks (`indexOf`) are like looking for a **specific lost copper coin** inside a room. You must look for that exact item.
- A **Regular Expression** is like scanning the room with a **metal detector wand**. The detector doesn't care if a coin is copper, silver, or gold; it emits a beep whenever it encounters *any* material matching the general metallic density pattern.

### (3) JavaScript Code Examples

#### Validating Form Formats
```javascript
// Simple regex to check if a string contains 3 digits, a dash, and 4 digits
const phonePattern = /^\d{3}-\d{4}$/;

console.log(phonePattern.test("123-4567")); // true
console.log(phonePattern.test("12-34567")); // false
```

#### Global Replacements and Group Extracting
```javascript
const text = "The cost is $10 for ticket A, and $25 for ticket B.";

// Extract all numbers preceded by a dollar sign
// Capture group () isolates the numeric value
const pricePattern = /\$(\d+)/g;

// 1. String.prototype.match
console.log(text.match(pricePattern)); // [ '$10', '$25' ]

// 2. String.prototype.replace with pattern
const hiddenPrices = text.replace(pricePattern, "$XX");
console.log(hiddenPrices); 
// "The cost is $XX for ticket A, and $XX for ticket B."

// 3. RegExp.prototype.exec loop for extraction
let match;
while ((match = pricePattern.exec(text)) !== null) {
  // match[0] is the full match, match[1] is the captured group
  console.log(`Found Price: ${match[0]} (Value: ${match[1]})`);
}
// Logs:
// Found Price: $10 (Value: 10)
// Found Price: $25 (Value: 25)
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the Global `g` Flag on String Replacements

**The mistake:** Calling `str.replace(/pattern/, replacement)` expecting it to update all matches.

**Why it's wrong:** Without the `g` flag, the replacement engine stops immediately after mutating the very first match it finds, leaving subsequent targets untouched.

*Incorrect:*
```javascript
const str = "apple banana apple";
const clean = str.replace(/apple/, "orange");
console.log(clean); // "orange banana apple" (Second apple remained!)
```

*Fix:*
```javascript
const str = "apple banana apple";
const clean = str.replace(/apple/g, "orange"); // Added global 'g' flag
console.log(clean); // "orange banana orange"
```

### Mistake 2: The Stateful `lastIndex` Trap with Global Regexes

**The mistake:** Reusing a single RegExp object containing the `g` flag for multiple `.test()` calls on different strings, leading to alternating `false` results.

**Why it's wrong:** Global regular expressions maintain state. They store a `.lastIndex` property tracking where the previous match succeeded. The next test starts scanning from `.lastIndex` instead of index `0`.

*Incorrect:*
```javascript
const validator = /admin/g;

console.log(validator.test("admin")); // true (lastIndex set to 5)
console.log(validator.test("admin")); // false! (Scans starting from index 5)
```

*Fix:*
```javascript
const validator = /admin/g;

console.log(validator.test("admin")); // true
validator.lastIndex = 0; // Manually reset pointer before reuse
console.log(validator.test("admin")); // true
```

---

### Mistake 3: Unhandled Asynchronous Failures in Regexp Operations

**The mistake:** Executing asynchronous operations within Regexp without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/regexp"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/regexp");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in regexp: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Strict Email & Username Validator Engine

**Scenario:** An authentication module validates user input against robust regular expression patterns using RegExp.prototype.test().

**Requirements:**
1. Write validateUsername(username).
2. Must be 3-16 alphanumeric characters or underscores.
3. Write validateEmail(email).
4. Return boolean validation results.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateUsername(username) {
>   const userRegex = /^[a-zA-0-9_]{3,16}$/;
>   return userRegex.test(username);
> }
>
> function validateEmail(email) {
>   const emailRegex = /^[a-zA-0-9._%+-]+@[a-zA-0-9.-]+\.[a-zA-0-9]{2,}$/i;
>   return emailRegex.test(email);
> }
>
> // Verification tests
> console.assert(validateUsername("alice_99") === true, "Test 1 Failed");
> console.assert(validateUsername("a") === false, "Test 2 Failed: Too short");
> console.assert(validateEmail("user@example.com") === true, "Test 3 Failed");
> console.assert(validateEmail("invalid-email") === false, "Test 4 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **RegExp Anchors (^ and $)**: ^ asserts start of string; $ asserts end of string, enforcing exact pattern matches.
> 2. **Character Classes ([a-z0-9])**: Matches any single character within specified ranges.
> 3. **Case-Insensitive Flag (/i)**: The i flag enables case-insensitive matching across uppercase and lowercase letters.
> 
---

### Exercise 2: Extracting Named Capture Groups from Log Lines

**Scenario:** A server log parser uses ES2018 RegExp named capture groups (`(?<name>...)`) to parse structured log metrics.

**Requirements:**
1. Write parseLogLine(logLine).
2. Use regex with named groups (?<timestamp>\S+), (?<level>\w+), (?<message>.+).
3. Return match.groups object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseLogLine(logLine) {
>   const logRegex = /^\[(?<timestamp>[^\]]+)\] \[(?<level>\w+)\] (?<message>.+)$/;
>   const match = logRegex.exec(logLine);
>
>   if (!match || !match.groups) {
>     return null;
>   }
>
>   return {
>     timestamp: match.groups.timestamp,
>     level: match.groups.level,
>     message: match.groups.message
>   };
> }
>
> // Verification tests
> const line = "[2026-08-12T10:00:00Z] [ERROR] Database connection lost";
> const parsed = parseLogLine(line);
>
> console.assert(parsed.timestamp === "2026-08-12T10:00:00Z", "Test 1 Failed");
> console.assert(parsed.level === "ERROR", "Test 2 Failed");
> console.assert(parsed.message === "Database connection lost", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Named Capture Groups Syntax**: (?<name>pattern) assigns a string key to match groups, accessible via match.groups.
> 2. **RegExp.prototype.exec()**: Executes search for a match in string, returning detailed match array with groups property.
> 3. **Self-Documenting Regular Expressions**: Named capture groups improve code readability compared to numbered index groups ($1, $2).
> 
---

### Exercise 3: Safe Dynamic Regex Escaper Utility

**Scenario:** A text search highlighter sanitizes raw user search strings by escaping special RegExp characters (`.*+?^${}()|[]\`) before building dynamic patterns.

**Requirements:**
1. Write escapeRegExp(string).
2. Replace special characters with backslash escapes.
3. Create dynamic RegExp for highlight matching.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function escapeRegExp(string) {
>   return string.replace(/[.*+?^${}()|[\]\]/g, "\$&");
> }
>
> function searchHighlight(text, query) {
>   if (!query) return text;
>   const escapedQuery = escapeRegExp(query);
>   const regex = new RegExp(escapedQuery, "gi");
>   return text.replace(regex, match => `<mark>${match}</mark>`);
> }
>
> // Verification tests
> const text = "Price is $5.00 (discounted)";
> const query = "$5.00"; // Contains regex special chars $ and .
>
> const highlighted = searchHighlight(text, query);
> console.assert(highlighted === "Price is <mark>$5.00</mark> (discounted)", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **RegExp Injection Vulnerabilities**: Unescaped user input passed to new RegExp() can cause syntax errors or ReDoS performance attacks.
> 2. **Escaping Special Characters**: Characters like ., *, +, ?, ^, $, (, ), [, ], {, }, |, \ carry special regex meaning and must be escaped.
> 3. **Replacement Pattern $&**: In String.prototype.replace(), $& represents the exact matched substring.
---

## 6. Related Terms
- [String Methods](../level_02/string_methods.md) — RegExp string methods.
- [Tagged Template Literals](../level_08/tagged_template_literals.md) — String manipulation.

---

## 7. Key Takeaways
- RegExp compiles string matching patterns inside literal slashes `/pattern/flags` or constructor functions.
- `regex.test(str)` is the fastest method to verify format validity.
- String methods like `.match()` and `.replace()` process patterns natively.
- Use the `g` flag to match all occurrences globally.
- Avoid using stateful global regex objects repeatedly without resetting `regex.lastIndex = 0`.
