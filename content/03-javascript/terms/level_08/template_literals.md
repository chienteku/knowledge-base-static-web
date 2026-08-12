# Template Literals

> **Level 8 — Modern JavaScript (ES6+)**
> String literals enclosed by backticks (`` ` ``) allowing embedded expressions via `${}`.

---

## 1. Prerequisites
- [String](../level_01/string.md) — The standard text data type.
- [Expression](../level_01/expression.md) — The type of code you can embed inside them.

---

## 2. Term Category

**Syntax Feature *(Introduced in ES6)* (Universal)**: Template Literals is a fundamental concept in this technology stack. **Level 8 — Modern JavaScript (ES6+)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Dynamic Multi-Line Template Interpolation

**Scenario:** A notification service constructs multi-line email template strings using backtick template literals and expression placeholders.

**Requirements:**
1. Write formatEmail(userName, orderId, total).
2. Use multi-line backtick string `...`.
3. Interpolate expressions via ${...}.
4. Return formatted email body.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function formatEmail(userName, orderId, total) {
>   return `Hello ${userName},
>
> Your order #${orderId} has been confirmed.
> Total Amount: $${Number(total).toFixed(2)}
>
> Thank you for shopping with us!`;
> }
>
> // Verification tests
> const body = formatEmail("Alice", "1001", 49.99);
> console.assert(body.includes("Hello Alice,"), "Test 1 Failed");
> console.assert(body.includes("Total Amount: $49.99"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Template Literal Syntax**: Backtick delimiters (``) allow embedding string placeholders and multi-line strings.
> 2. **Expression Interpolation (${expr})**: Evaluates JavaScript expressions inside ${} and converts results to strings.
> 3. **Multi-Line Support**: Preserves literal line breaks and whitespace formatting cleanly without string concatenation (+).
> 
---

### Exercise 2: Template Literals Advanced Context Handler

**Scenario:** A web application component processes template literals data operations within enterprise workflows.

**Requirements:**
1. Write handleTemplateLiteralsSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleTemplateLiteralsSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleTemplateLiteralsSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Template Literals Architecture**: Applying template literals patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Template Literals Performance Optimization

**Scenario:** An application utility optimizes template literals execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeTemplateLiteralsTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeTemplateLiteralsTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeTemplateLiteralsTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Template Literals Optimization**: Optimizing template literals improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [String](../level_01/string.md) — The base data type.
- [Expression](../level_01/expression.md) — What you put inside the `${}`.
- [String Methods](../level_02/string_methods.md) — Related concept: String Methods.
- [JSX](../level_10/jsx.md) — Related concept: JSX.

---

## 7. Key Takeaways
- Template Literals use backticks (`` ` ``).
- They allow multi-line strings without escape characters.
- They allow String Interpolation (injecting variables/expressions) using `${expression}`.
- They are infinitely easier to read and write than traditional string concatenation.
```
