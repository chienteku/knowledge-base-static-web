# Expression

> **Level 1 — Foundations**
> Any valid unit of code that resolves to a single value (e.g., `5 + 5`).

---

## 1. Prerequisites
- [Statement](../level_01/statement.md) — An instruction that performs an action.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While statements are the "actions" a program takes, expressions are the "things" the program manipulates. A programming language needs a way to calculate new data from existing data. Expressions serve as the mechanism to evaluate code down to a single value so that the program can make decisions or store the result.

Every time JavaScript expects a value, you can provide an expression. It could be as simple as a raw number (`5`), or a complex equation involving function calls and math operators.

### (2) Reality Metaphor
If a statement is a complete sentence giving an order ("Bake the cake."), an expression is a phrase that describes a specific noun ("the chocolate cake with sprinkles"). You can't just shout "the chocolate cake with sprinkles!" as an instruction—it doesn't do anything on its own. But you can use it inside a statement: "Bake [the chocolate cake with sprinkles]."

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// '5 + 5' is an expression that resolves to 10
// The entire line is a statement
const total = 5 + 5; 

// A function call is also an expression if it returns a value
const greeting = getGreeting(); 
```

#### Fuller Example
```javascript
const price = 20;
const discount = 5;

// The part inside the parentheses (price - discount > 10) is an expression
// that resolves to a Boolean (true)
if (price - discount > 10) {
  // `price - discount` is an expression resolving to 15
  console.log(`Your final cost is $${price - discount}`);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing statements and expressions in Arrow Functions

**The mistake:** Wrapping an object literal in curly braces inside an implicit-return arrow function, making the engine think it's a block statement rather than an object expression.

**Why it's wrong:** In arrow functions, `{}` usually denotes a block of statements. If you want to return an object literal (an expression), you must wrap it in parentheses so the engine parses it as an expression.

*Incorrect:*
```javascript
// The engine thinks `{}` is a block statement, not an object. 
// It returns undefined!
// const getUser = () => { name: "Alice" }; 
```

*Fix:*
```javascript
// Wrapping it in () forces the engine to treat it as an expression
const getUser = () => ({ name: "Alice" }); 
```

---

### Mistake 2: Losing Context Binding (`this`) in Expression Callbacks

**The mistake:** Passing methods from Expression instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "expression",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "expression",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Expression Operations

**The mistake:** Executing asynchronous operations within Expression without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/expression"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/expression");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in expression: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Spot the Expression

**Problem:** Identify the expressions in the following line of code: `const result = addNumbers(10, 20) * 2;`

**Expected output:**
```text
Expressions:
1. `10` (resolves to 10)
2. `20` (resolves to 20)
3. `addNumbers(10, 20)` (resolves to whatever the function returns)
4. `2` (resolves to 2)
5. `addNumbers(10, 20) * 2` (resolves to the final calculated value)
```

> [!check]- Answer
> - Any piece of code that you could `console.log()` is an expression.

---

### Exercise 2: Evaluating Expressions inside Template Literals

**Problem:** Embed a ternary expression `${age >= 18 ? "Adult" : "Minor"}` inside a template literal string.

**Expected output:**
```text
Status: Adult
```

> [!check]- Answer
> ```javascript
> const age = 20;
> console.log(`Status: ${age >= 18 ? "Adult" : "Minor"}`);
> ```
>
> **Explanation:** Template literal interpolations `${expression}` accept any valid JavaScript expression.

### Exercise 3: Comma Operator Expression Evaluation

**Problem:** Evaluate `let x = (1 + 1, 2 + 2, 3 + 3);` and explain why `x` gets `6`.

**Expected output:**
```text
6
```

> [!check]- Answer
> ```javascript
> let x = (1 + 1, 2 + 2, 3 + 3);
> console.log(x);
> ```
>
> **Explanation:** The comma operator evaluates each operand left-to-right and yields the value of the final rightmost expression.

---

---

## 7. Related Terms
- [Statement](../level_01/statement.md) — An instruction that performs an action.

---

## 8. Key Takeaways
- An expression is any code that resolves to a value.
- Expressions can be used anywhere JavaScript expects a value (e.g., passing arguments to a function, assigning a variable).
- An expression can be as simple as a primitive value (`42`) or highly complex (`getUser().profile.age + 5`).
