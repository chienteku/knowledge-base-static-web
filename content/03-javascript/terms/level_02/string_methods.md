# String Methods

> **Level 2 — Control Flow & Data Structures**
> `slice`, `split`, `toUpperCase`, `includes`, `trim`, …

---

## 1. Prerequisites
- [String](../level_01/string.md) — A sequence of characters representing text, enclosed in quotes.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, strings are primitive values, meaning they are immutable (they cannot be changed once created). However, developers frequently need to manipulate text—cleaning up trailing whitespace from a user signup form, converting an email to lowercase for consistent database storage, or searching for keywords inside a paragraph. 

To allow this without changing the raw primitive itself, the TC39 committee built **string methods**. When you call a method on a string, the engine temporarily wraps the primitive string in an object, performs the operation, returns a *brand-new* modified string, and then discards the wrapper.

### (2) Reality Metaphor
A string method is like a photocopier with editing filters. You insert an original document (the immutable string). The copier prints out a new, edited copy (e.g., in black and white, or cropped, or magnified). The original document you put in remains completely untouched on the glass screen.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const text = "   JavaScript is Cool!   ";

// Methods return NEW strings; they do not alter the original variable
console.log(text.trim()); // "JavaScript is Cool!" (removes outer spaces)
console.log(text.toUpperCase()); // "   JAVASCRIPT IS COOL!   "
console.log(text.includes("Cool")); // true (checks substring case-sensitively)
```

#### Fuller Example
```javascript
// Processing and cleaning up email user registration data
const rawEmailInput = "  BrendanEich@mozilla.org  ";

// 1. Clean the email: trim spaces and convert to lowercase for database comparison
const cleanEmail = rawEmailInput.trim().toLowerCase();
console.log("Cleaned Email:", cleanEmail); // "brendaneich@mozilla.org"

// 2. Validate email structure using includes()
const hasAtSymbol = cleanEmail.includes("@");
console.log("Is email valid?", hasAtSymbol); // true

// 3. Extract the username and domain name using split()
const emailParts = cleanEmail.split("@"); // splits string into an array of strings
const username = emailParts[0];
const domain = emailParts[1];

console.log("Username:", username); // "brendaneich"
console.log("Domain:", domain);     // "mozilla.org"

// 4. Extract first 3 characters of the username using slice()
const usernameAbbreviation = username.slice(0, 3); // extracts from index 0 up to (but not including) index 3
console.log("Abbreviation:", usernameAbbreviation); // "bre"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting String Methods to Mutate the Original String

**The mistake:** Calling a string method and assuming the original variable's content has changed.

**Why it's wrong:** Strings are immutable. String methods never change the original string in place. They return a new string. If you don't assign the returned value to a variable, it is discarded and the operation does nothing.

*Incorrect:*
```javascript
let nickname = "  alex  ";
nickname.trim(); // Resolves to "alex" but is not saved anywhere!

console.log(nickname); // Logs "  alex  " (still has spaces!)
```

*Fix:*
```javascript
let nickname = "  alex  ";
nickname = nickname.trim(); // Reassign the result back to the variable

console.log(nickname); // "alex"
```

---

### Mistake 2: Losing Context Binding (`this`) in String Methods Callbacks

**The mistake:** Passing methods from String Methods instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "string_methods",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "string_methods",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in String Methods Operations

**The mistake:** Executing asynchronous operations within String Methods without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/string_methods"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/string_methods");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in string_methods: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Extract and Format URL

**Problem:** Complete the code to extract the domain name from the string `"https://google.com"` by slicing off the `"https://"` part (first 8 characters) and printing it.

```javascript
const url = "https://google.com";
const domainOnly = // Write slice here

console.log(domainOnly);
```

**Expected output:**
> [!check]- Answer
> ```text
> google.com
> ```
> - The `"https://"` substring is 8 characters long (indices 0 through 7).
> - Use `.slice(startIndex)` to extract text from a starting index to the end of the string.

---

### Exercise 2: Replacing All Occurrences with `replaceAll`

**Problem:** Replace all spaces with dashes in `"a b c"` using `replaceAll`.

**Expected output:**
> [!check]- Answer
> ```text
> a-b-c
> ```
> ```javascript
> const str = "a b c";
> console.log(str.replaceAll(" ", "-"));
> ```
>
> **Explanation:** `replaceAll(target, replacement)` replaces all non-overlapping substring occurrences.

---

### Exercise 3: Extracting Substrings with `slice`

**Problem:** Extract the last 4 characters of string `"JavaScript"` using `slice(-4)`.

**Expected output:**
> [!check]- Answer
> ```text
> ript
> ```
> ```javascript
> const str = "JavaScript";
> console.log(str.slice(-4));
> ```
>
> **Explanation:** Passing negative start offsets to `.slice()` extracts characters relative to string end.


---

## 7. Related Terms
- [Template Literals](../level_08/template_literals.md) — Dynamic strings embedding expressions.
- [Array Index & .length](array_index_length.md) — Index access, which also applies to string characters (e.g. `str[0]`).
- [concat / join / split](../level_04/concat_join_split.md) — Related concept: concat / join / split.
- [Tagged Template Literals](../level_08/tagged_template_literals.md) — Related concept: Tagged Template Literals.
- [Regular Expressions (RegExp)](../level_09/regexp.md) — Related concept: Regular Expressions (RegExp).

---

## 8. Key Takeaways
- String methods perform operations on text, returning new values while leaving the original string unchanged due to immutability.
- Common utility methods include: `.trim()` (removes outer spaces), `.toLowerCase()` / `.toUpperCase()` (case conversion), `.includes()` (substring check).
- Use `.slice(start, end)` to extract a substring, and `.split(separator)` to break a string into an array of strings.
