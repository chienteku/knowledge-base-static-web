# Statement

> **Level 1 — Foundations**
> An instruction that performs an action (e.g., `let x = 5;`).

---

## 1. Prerequisites
None (Entry-level term)
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Every programming language needs a way to tell the computer *what to do*. A JavaScript program is essentially a sequence of instructions executed by the engine. These individual instructions are called "Statements". 

If a program is a recipe, statements are the individual steps: "Preheat the oven", "Mix the flour", "Bake for 30 minutes". A statement performs an action, changes the state of the program, or dictates the flow of execution, but it doesn't necessarily produce a tangible value that you can store in a variable.

### (2) Reality Metaphor
A statement is like a direct command given to a soldier: "Drop and give me twenty!" or "March forward!" The soldier performs the action, but the command itself doesn't "return" a physical object to the commander.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// This entire line is a statement
let maxUsers = 100;

// This is an if statement
if (maxUsers > 50) {
  console.log("Capacity reached"); // Another statement
}
```

#### Fuller Example
```javascript
// A sequence of statements executed top-to-bottom
function initializeApp() {
  // Statement 1: Variable declaration
  const dbStatus = "Connected";
  
  // Statement 2: Control flow (if statement)
  if (dbStatus === "Connected") {
    // Statement 3: Function call
    console.log("App is ready to go!");
  }
}

// Statement 4: Calling the function
initializeApp();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to assign a statement to a variable

**The mistake:** Confusing statements (actions) with expressions (values) and trying to capture a statement's result in a variable.

**Why it's wrong:** An `if` statement doesn't evaluate to a value. You cannot assign an `if` block to a variable.

*Incorrect:*
```javascript
// SyntaxError: Unexpected token 'if'
// const result = if (true) { "Yes" } else { "No" };
```

*Fix:*
```javascript
// Use a ternary expression instead (expressions resolve to values!)
const result = true ? "Yes" : "No";
```

---

### Mistake 2: Losing Context Binding (`this`) in Statement Callbacks

**The mistake:** Passing methods from Statement instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "statement",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "statement",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Statement Operations

**The mistake:** Executing asynchronous operations within Statement without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/statement"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/statement");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in statement: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Counting Statements

**Problem:** Look at the code below. How many statements are there?

```javascript
let score = 0;
score = score + 10;
console.log(score);
```

**Expected output:**
> [!check]- Answer
> ```text
> 3 statements
> ```
> - Look for the semicolons! In JavaScript, semicolons generally mark the end of a statement.

---

### Exercise 2: Distinguishing Statements from Expressions

**Problem:** Classify `let x = 5;`, `5 + 5`, `if (true) {}`, and `x > 0 ? 1 : 0` as Statements or Expressions.

**Expected output:**
> [!check]- Answer
> ```text
> Statement
> Expression
> Statement
> Expression
> ```
> ```javascript
> // let x = 5;         -> Statement
> // 5 + 5              -> Expression
> // if (true) {}       -> Statement
> // x > 0 ? 1 : 0      -> Expression
> console.log("Statement\nExpression\nStatement\nExpression");
> ```
>
> **Explanation:** Statements perform control flow actions; expressions evaluate to concrete values.

---

### Exercise 3: Expression Statements with Side Effects

**Problem:** Turn an expression `counter++` into a valid statement line with semicolon.

**Expected output:**
> [!check]- Answer
> ```text
> 1
> ```
> ```javascript
> let counter = 0;
> counter++; // Expression statement
> console.log(counter);
> ```
>
> **Explanation:** Adding a semicolon to an expression forms an expression statement executed for its side effect.


---

## 7. Related Terms
- [Expression](expression.md) — Any valid unit of code that resolves to a single value.
- [Automatic Semicolon Insertion (ASI)](asi.md) — Related concept: Automatic Semicolon Insertion (ASI).
---

## 8. Key Takeaways
- A statement is an instruction to the engine to *do something*.
- Declarations (`let x;`), assignments (`x = 5;`), and control flows (`if`, `for`) are all statements.
- By convention, standard statements in JavaScript end with a semicolon (`;`).
