# Template Literals

> **Level 8 — Modern JavaScript (ES6+)**
> String literals enclosed by backticks (`` ` ``) allowing embedded expressions via `${}`.

---

## 1. Prerequisites
- [String](../level_01/string.md) — The standard text data type.
- [Expression](../level_01/expression.md) — The type of code you can embed inside them.

---

## 2. Term Category
- **Syntax Feature** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before ES6, combining text and variables (String Concatenation) was a nightmare. Developers had to use the `+` operator to stitch strings together, carefully opening and closing quotation marks, and manually inserting spaces. It was ugly, prone to syntax errors, and impossible to read. Additionally, traditional strings did not support multi-line text without ugly `\n` escape characters.

ES6 introduced **Template Literals**. By wrapping a string in backticks (`` ` ``) instead of quotes (`"` or `'`), you unlock superpowers. You can press "Enter" to create real multi-line strings, and you can "inject" JavaScript variables and expressions directly into the string using the `${}` syntax. The engine automatically evaluates the expression and converts the result into text.

### (2) Reality Metaphor
Standard strings are like writing a letter on a typewriter. If you want to leave a blank space for someone's name, you have to stop, roll the paper forward, manually type the name, and roll it back.
Template Literals are like a modern "Mail Merge" template. You write: "Dear `${FirstName}`, welcome to `${City}`!" The computer automatically fills in the blanks for you seamlessly.

### (3) JavaScript Code Examples

#### Short Snippet: The Old Way vs The New Way
```javascript
const name = "Alice";
const score = 95;

// The Old Way (Pre-ES6)
const oldGreeting = "Hello " + name + ", your score is " + score + " points.";

// The New Way (Template Literal)
const newGreeting = `Hello ${name}, your score is ${score} points.`;

console.log(newGreeting); // "Hello Alice, your score is 95 points."
```

#### Fuller Example: Multi-line and Math
```javascript
const price = 10;
const taxRate = 0.05;

// 1. Multi-line Strings
// Notice how we just press "Enter". No \n required!
const emailTemplate = `
Hi Customer,
Thank you for your purchase.

// 2. Expressions inside ${}
// We can do actual math, or call functions, right inside the string!
Your total with tax is: $${price + (price * taxRate)}.
Have a great day!
`;

console.log(emailTemplate);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Template Literals Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Template Literals blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "template_literals";
```

*Fix:*
```javascript
let value = "template_literals";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Template Literals Callbacks

**The mistake:** Passing methods from Template Literals instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "template_literals",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "template_literals",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Template Literals Operations

**The mistake:** Executing asynchronous operations within Template Literals without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/template_literals"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/template_literals");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in template_literals: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Function Calls

**Problem:** Can you put a function call inside a Template Literal? What happens if you do?
```javascript
function getMood() { return "happy"; }
const sentence = `I am feeling ${getMood().toUpperCase()} today.`;
```

**Expected output:**
> [!check]- Answer
> ```text
> `"I am feeling HAPPY today."`
> Because `${}` accepts ANY valid JavaScript expression, the engine will execute the function, run `.toUpperCase()`, and inject the final result!
> ```
> - If it returns a value, you can put it inside `${}`!

---

### Exercise 2: Tagged Template Literals Sanitization

**Problem:** Write a tagged template function `highlight` that wraps interpolated values in `<b>` tags.

**Expected output:**
> [!check]- Answer
> ```text
> Hello <b>Alice</b>!
> ```
> ```javascript
> function highlight(strings, ...values) {
>   return strings.reduce((acc, str, i) => {
>     const val = values[i - 1] ? `<b>${values[i - 1]}</b>` : "";
>     return acc + val + str;
>   });
> }
> const name = "Alice";
> console.log(highlight`Hello ${name}!`);
> ```
>
> **Explanation:** Tagged template functions receive raw string arrays and evaluated expression parameters for custom string parsing.

---

### Exercise 3: Raw String Access with `String.raw`

**Problem:** Use `String.raw` to print backslashes `"C:\Program Files\Node"` without escaping.

**Expected output:**
> [!check]- Answer
> ```text
> C:\Program Files\Node
> ```
> ```javascript
> console.log(String.raw`C:\Program Files\Node`);
> ```
>
> **Explanation:** `String.raw` renders escape sequences like `\n` or `\` as literal character text.

---

### Exercise 4: Multi-Line String Literals

**Problem:** Create a multi-line string using template literal backticks.

**Expected output:**
> [!check]- Answer
> ```text
> Line 1
> Line 2
> ```
> ```javascript
> const multi = `Line 1
> Line 2`;
> console.log(multi);
> ```
>
> **Explanation:** Backtick template literals support embedded multi-line text without concatenation.

---

### Exercise 5: Inline Mathematical Expression Evaluation

**Problem:** Evaluate `${2 + 2}` inside a template literal string.

**Expected output:**
> [!check]- Answer
> ```text
> Sum: 4
> ```
> ```javascript
> console.log(`Sum: ${2 + 2}`);
> ```
>
> **Explanation:** `${expression}` evaluates any valid JavaScript expression inline.

---

## 7. Related Terms
- [String](../level_01/string.md) — The base data type.
- [Expression](../level_01/expression.md) — What you put inside the `${}`.

---

## 8. Key Takeaways
- Template Literals use backticks (`` ` ``).
- They allow multi-line strings without escape characters.
- They allow String Interpolation (injecting variables/expressions) using `${expression}`.
- They are infinitely easier to read and write than traditional string concatenation.
```
