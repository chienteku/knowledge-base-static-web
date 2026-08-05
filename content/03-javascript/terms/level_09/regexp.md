# Regular Expressions (RegExp)

> **Level 9 — Advanced Concepts & Patterns**
> Pattern matching for strings.

---

## 1. Prerequisites
- [String](../level_01/string.md) — The sequence of characters text type.
- [String Methods](../level_02/string_methods.md) — Text manipulation helpers.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Extract Zip Codes

**Problem:** Complete the code to parse a string and return an array of all 5-digit zip codes using regular expressions.

```javascript
function extractZipCodes(text) {
  const zipRegex = // Write regex here
  return text.match(zipRegex) || [];
}

const input = "Deliver to 90210, then pick up at 02138 or 10001.";
console.log("Zip Codes:", extractZipCodes(input));
```

**Expected output:**
> [!check]- Answer
> ```text
> Zip Codes: [ '90210', '02138', '10001' ]
> ```
> - Match digit sequences of length 5: `/\b\d{5}\b/g`.

---

### Exercise 2: Matching Digits with Regular Expressions

**Problem:** Test string `"User123"` for digits using `\d+` regex.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> const regex = /\d+/;
> console.log(regex.test("User123"));
> ```
>
> **Explanation:** RegExp `.test(str)` tests whether regex patterns match target strings.

---

### Exercise 3: Extracting Named Capture Groups

**Problem:** Extract year, month, day from `"2026-01-15"` using named capture groups `/(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/`.

**Expected output:**
> [!check]- Answer
> ```text
> 2026
> ```
> ```javascript
> const match = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/.exec("2026-01-15");
> console.log(match.groups.year);
> ```
>
> **Explanation:** `(?<name>pattern)` captures regex match subgroups into `match.groups` objects.

---

## 7. Related Terms
- [String Methods](../level_02/string_methods.md) — RegExp string methods.
- [Tagged Template Literals](../level_08/tagged_template_literals.md) — String manipulation.

---

## 8. Key Takeaways
- RegExp compiles string matching patterns inside literal slashes `/pattern/flags` or constructor functions.
- `regex.test(str)` is the fastest method to verify format validity.
- String methods like `.match()` and `.replace()` process patterns natively.
- Use the `g` flag to match all occurrences globally.
- Avoid using stateful global regex objects repeatedly without resetting `regex.lastIndex = 0`.
