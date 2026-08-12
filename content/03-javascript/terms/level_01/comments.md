# Comments

> **Level 1 — Foundations**
> Notes in code ignored by the engine: Line (`//`) and Block (`/* */`).

---

## 1. Prerequisites
- None!

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Comments is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Code is read by humans far more often than it is executed by machines. While modern languages aim for readable syntax, complex logic often requires context that code alone cannot provide: *Why* was this algorithm chosen? *What* is the purpose of this bizarre workaround? 

Comments allow developers to embed plain human language directly into the source code. The JavaScript engine completely strips out or ignores these characters during the parsing phase, meaning they have zero impact on how the program runs.

### (2) Reality Metaphor
Comments are like the director's commentary track on a movie, or the sticky notes attached to a legal document. They don't change the actual movie or the legal binding of the document, but they provide invaluable context for whoever is studying it.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// This is a single-line comment. It explains the next line.
const taxRate = 0.07; 

/* 
   This is a multi-line block comment.
   It is useful for longer explanations or 
   temporarily disabling chunks of code.
*/
const total = 100 * taxRate;
```

#### Fuller Example
```javascript
function calculateDiscount(price, userType) {
  // We apply a massive discount for admins because of the 2024 holiday promo
  if (userType === 'admin') {
    return price * 0.5;
  }
  
  /* 
   TODO: Implement the 'vip' user tier logic here next week.
   For now, everyone else pays full price.
  */
  return price;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Commenting the "What" instead of the "Why"

**The mistake:** Writing comments that simply translate the code into English, rather than explaining the reasoning behind the code.

**Why it's wrong:** It clutters the codebase and becomes rapidly outdated. Code should be self-documenting through good variable names. Comments should explain the business logic or edge cases that aren't obvious.

*Incorrect:*
```javascript
// Declare a variable named userAge and set it to 25
const userAge = 25; 

// If userAge is greater than 18
if (userAge > 18) {
  // Grant access
  grantAccess();
}
```

*Fix:*
```javascript
const userAge = 25; 

// Legal requirement: users must be adults to view this content (Ticket #402)
if (userAge > 18) {
  grantAccess();
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Comments Callbacks

**The mistake:** Passing methods from Comments instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "comments",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "comments",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Comments Operations

**The mistake:** Executing asynchronous operations within Comments without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/comments"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/comments");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in comments: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: JSDoc Documentation for Financial Interest Engine

**Scenario:** A financial software library requires structured JSDoc comments to document parameter types, return values, and mathematical formulas for automated documentation generators and IDE IntelliSense.

**Requirements:**
1. Add JSDoc block comments (/** ... */) to calculateCompoundInterest.
2. Document parameters (@param) and return type (@returns).
3. Include inline single-line comments (//) explaining non-obvious steps.

> [!check]- Answer
> #### Implementation
> ```javascript
> /**
>  * Calculates compound interest for a principal amount.
>  * 
>  * @param {number} principal - Initial investment amount.
>  * @param {number} rate - Annual interest rate (e.g. 0.05 for 5%).
>  * @param {number} years - Duration in years.
>  * @returns {number} Final accumulated balance.
>  */
> function calculateCompoundInterest(principal, rate, years) {
>   // Formula: A = P(1 + r)^t
>   const growthFactor = (1 + rate) ** years;
>   const totalAmount = principal * growthFactor;
> return Number(totalAmount.toFixed(2));
> }
> // Verification tests
> const total = calculateCompoundInterest(1000, 0.05, 2);
> console.assert(total === 1102.50, "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **JSDoc Syntax**: JSDoc comments start with /** and provide structured metadata tags (@param, @returns) for IDE autocompletion.
> 2. **Ignored at Runtime**: Comments are completely ignored by the JS engine parser and do not impact runtime performance.
> 3. **Inline Comments**: Single-line comments (//) explain internal implementation details and business logic intent.
> 
---

### Exercise 2: Intent Clarification & Compliance Guard Comments

**Scenario:** A payment gateway integration handles regulatory compliance checks. Non-obvious compliance rules require inline comments explaining 'why' specific validations occur.

**Requirements:**
1. Use single-line comments (//) to document compliance mandates (e.g. PCI-DSS regulations).
2. Use multi-line comments (/* ... */) for complex multi-step transaction policies.
3. Write clean, working code implementing transaction validations.

> [!check]- Answer
> #### Implementation
> ```javascript
> function validatePaymentTransaction(cardDetails) {
>   /* 
>    * Multi-line Compliance Note:
>    * PCI-DSS Requirement 3.4 requires PAN masking before log output.
>    * Never store or log raw 16-digit primary account numbers.
>    */
> if (!cardDetails || !cardDetails.cardNumber) {
>     return false;
>   }
> // Validate length is exactly 16 digits
>   const isValidLength = cardDetails.cardNumber.length === 16;
> return isValidLength;
> }
> // Verification tests
> console.assert(validatePaymentTransaction({ cardNumber: "1234567812345678" }) === true, "Test 1 Failed");
> console.assert(validatePaymentTransaction({ cardNumber: "123" }) === false, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Single-Line Comments (//)**: Terminate at the end of the line; useful for brief inline annotations.
> 2. **Multi-Line Comments (/* ... */)**: Span multiple lines; ideal for architectural notes and regulatory documentation.
> 3. **Documentation Best Practices**: Effective comments document non-obvious business requirements ('why') rather than restating self-explanatory code ('what').
> 
---

### Exercise 3: Build Pipeline Minification & Comment Preservation

**Scenario:** A production build pipeline strips comments during minification. However, legal license notices must be preserved using copyright comment markers (/*! ... */).

**Requirements:**
1. Create a legal license header comment using the /*! preservation syntax.
2. Implement a simple utility function below the comment.
3. Verify that the function executes normally.

> [!check]- Answer
> #### Implementation
> ```javascript
> /*!
>  * @license MIT
>  * Core Utility Module v1.0.0
>  * Copyright (c) 2026 Acme Corp.
>  */
> function formatCurrency(amount) {
>   return "$" + Number(amount).toFixed(2);
> }
> // Verification tests
> console.assert(formatCurrency(49.9) === "$49.90", "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Minifier Preservation (/*!)**: Build minifiers (Terser, Esbuild) recognize /*! comments as legal copyright blocks and preserve them in output bundles.
> 2. **Zero Runtime Footprint**: In unminified code, comments are skipped by the lexical scanner without generating AST nodes or bytecode.
> 3. **Clean Code Hygiene**: Stale or commented-out code blocks should be deleted rather than left in source files, relying on version control for history.
---

## 6. Related Terms
- [Automatic Semicolon Insertion (ASI)](asi.md) — Related concept: Automatic Semicolon Insertion (ASI).

---

## 7. Key Takeaways
- Use `//` for single-line comments.
- Use `/* */` for multi-line block comments.
- The JavaScript engine completely ignores comments when executing the code.
- Write comments to explain *why* the code does something, not *what* it is doing.
