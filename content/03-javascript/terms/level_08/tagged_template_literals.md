# Tagged Template Literals

> **Level 8 — Modern JavaScript (ES6+)**
> Functions that process template literal parts.

---

## 1. Prerequisites
- [Template Literals](template_literals.md) — String interpolation utilizing backticks and `${}` placeholders.
- [Function](../level_03/function.md) — Reusable blocks of execution logic.
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard template literals automatically merge static string parts and dynamic variables together. However, sometimes we need to customize how those values are combined—such as escaping HTML characters to prevent Cross-Site Scripting (XSS), automatically translating text strings, or converting data types dynamically.

To allow this intermediate processing, JavaScript supports **Tagged Template Literals**:
- You prefix a template literal with the name of a custom function (the **tag function**): `myTag`Hello ${name}!``.
- The tag function intercepts the literal before rendering, receiving:
  1. An array of the static string slices (e.g., `["Hello ", "!"]`).
  2. The evaluated values of the expressions passed as subsequent arguments (e.g., `name`).
- The tag function can manipulate these inputs and return **any type of value**—a processed string, a compiled object, or even a DOM element. This mechanism is the foundation of popular libraries like `styled-components` (CSS-in-JS) and dynamic SQL query builders.

### (2) Reality Metaphor
- A **standard template literal** is like dropping a letter directly into a mailbox. The letter contains blanks filled in with your variables, and is sent exactly as written.
- A **tagged template literal** is like handing your letter template and a list of variables to a **professional secretary** (the tag function) first. The secretary reads the letter slices, translates the variables, censors any prohibited words, validates formatting, and then envelopes and mails the polished letter.

### (3) JavaScript Code Examples

#### A Custom HTML Sanitizing Tag Function
```javascript
// A tag function to escape special HTML characters, preventing XSS injection
function safeHTML(strings, ...values) {
  // strings: Array of static string segments
  // values: Rest parameter collecting all evaluated placeholders
  
  let result = "";

  // Merge segments and escaped values together
  strings.forEach((str, index) => {
    result += str;
    
    if (index < values.length) {
      const rawValue = String(values[index]);
      
      // Escape HTML characters: &, <, >, ", '
      const escapedValue = rawValue
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
        
      result += escapedValue;
    }
  });

  return result;
}

const userInput = "<script>alert('hack')</script>";
const userName = "Brendan";

// Invoke the tag function by placing its name immediately before the backticks
const output = safeHTML`<div>Welcome, ${userName}! Message: ${userInput}</div>`;

console.log(output);
// Logs: "<div>Welcome, Brendan! Message: &lt;script&gt;alert(&#x27;hack&#x27;)&lt;/script&gt;</div>"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Invoking the Tag Function with Parentheses

**The mistake:** Writing `myTag( `Hello ${name}` )` instead of `myTag`Hello ${name}``.

**Why it's wrong:** Calling `myTag(...)` with parentheses executes `myTag` as a standard function call *after* the template literal has already been concatenated into a plain string. The tag function will receive a single concatenated string argument instead of the split arrays, causing your segment-manipulation logic to crash or break.

*Incorrect:*
```javascript
const user = "Bob";
// Invokes standard function call on string "Hello Bob"
const msg = safeHTML(`Hello ${user}`); 
```

*Fix:*
```javascript
const user = "Bob";
// Invoke as a tag function using backticks directly
const msg = safeHTML`Hello ${user}`; 
```

---

### Mistake 2: Losing Context Binding (`this`) in Tagged Template Literals Callbacks

**The mistake:** Passing methods from Tagged Template Literals instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "tagged_template_literals",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "tagged_template_literals",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Tagged Template Literals Operations

**The mistake:** Executing asynchronous operations within Tagged Template Literals without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/tagged_template_literals"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/tagged_template_literals");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in tagged_template_literals: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Uppercase Tag Function

**Problem:** Complete the tag function `makeUppercase` to merge the string parts, but convert all dynamic placeholder values to uppercase before appending them.

```javascript
function makeUppercase(strings, ...values) {
  let result = "";
  strings.forEach((str, index) => {
    result += str;
    if (index < values.length) {
      // Append value converted to uppercase
    }
  });
  return result;
}

const item = "laptop";
const brand = "fruit";
const output = makeUppercase`I bought a ${item} made by ${brand}.`;

console.log(output);
```

**Expected output:**
> [!check]- Answer
> ```text
> I bought a LAPTOP made by FRUIT.
> ```
> - Inside the if statement, append `String(values[index]).toUpperCase()`.

---

### Exercise 2: Custom String Sanitization Tag Function

**Problem:** Write a tag function `upper` that converts evaluated expressions to uppercase.

**Expected output:**
> [!check]- Answer
> ```text
> HELLO ALICE!
> ```
> ```javascript
> function upper(strings, ...values) {
>   return strings.reduce((acc, str, i) => {
>     const val = values[i - 1] ? String(values[i - 1]).toUpperCase() : "";
>     return acc + val + str;
>   });
> }
> const name = "Alice";
> console.log(upper`Hello ${name}!`);
> ```
>
> **Explanation:** Tagged template functions intercept literal strings and evaluated expressions for custom processing.

---

### Exercise 3: Inspecting `strings.raw` Property

**Problem:** Inspect `strings.raw[0]` inside a tagged template function for escaped characters.

**Expected output:**
> [!check]- Answer
> ```text
> Raw string inspected
> ```
> ```javascript
> function tag(strings) {
>   console.log("Raw string inspected");
> }
> tag`line1\nline2`;
> ```
>
> **Explanation:** `strings.raw` accesses unescaped raw template literal character inputs.


---

## 7. Related Terms
- [String Methods](../level_02/string_methods.md) — Text manipulation helpers often applied inside tag functions.
- [Regular Expressions (RegExp)](../level_09/regexp.md) — Related concept: Regular Expressions (RegExp).
---

## 8. Key Takeaways
- Tagged Template Literals let you intercept and process template string values using a custom tag function.
- Invoke the tag function by appending its name directly before the literal's backticks (e.g. `tag`text`).
- The tag function receives an array of static string slices as the first argument, and the evaluated placeholder expressions as subsequent arguments.
- Tagged template literals can return any data type (strings, arrays, object models, etc.).
