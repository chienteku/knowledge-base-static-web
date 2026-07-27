# Comments

> **Level 1 — Foundations**
> Notes in code ignored by the engine: Line (`//`) and Block (`/* */`).

---

## 1. Prerequisites
*(None — this is a foundational programming concept)*

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Disabling Code

**Problem:** You have a function call `launchMissiles();` that you want to temporarily prevent from running while you test something else. How do you do it?

**Expected output:**
```text
The function should not run.
```

> [!check]- Answer
> - Just place `//` at the very beginning of the line. This is called "commenting out" code.

---

### Exercise 2: JSDoc Comment Syntax

**Problem:** Write a JSDoc comment for a function `add(a, b)` describing parameter types `@param {number}` and return type `@returns {number}`.

**Expected output:**
```text
3
```

> [!check]- Answer
> ```javascript
> /**
>  * Adds two numbers together.
>  * @param {number} a
>  * @param {number} b
>  * @returns {number}
>  */
> function add(a, b) {
>   return a + b;
> }
> console.log(add(1, 2));
> ```
>
> **Explanation:** JSDoc comments start with `/**` and provide structured metadata for documentation generators and IDE type checkers.

### Exercise 3: Multi-Line Comment Edge Cases

**Problem:** Demonstrate commenting out code containing string literals with `*/` safely using single-line `//` comments.

**Expected output:**
```text
Commented safely
```

> [!check]- Answer
> // const regex = /*/; 
> console.log("Commented safely");
> ```
>
> **Explanation:** Using single line `//` avoids accidental termination by embedded `*/` text in regex or strings.

---

---

## 7. Related Terms
*(No related terms yet)*

---

## 8. Key Takeaways
- Use `//` for single-line comments.
- Use `/* */` for multi-line block comments.
- The JavaScript engine completely ignores comments when executing the code.
- Write comments to explain *why* the code does something, not *what* it is doing.
