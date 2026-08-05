# Operator

> **Level 1 — Foundations**
> Symbol that performs an operation on operands (umbrella concept).

---

## 1. Prerequisites
- [Statement](statement.md) — An instruction that performs an action.
- [Expression](expression.md) — Any valid unit of code that resolves to a value.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In programming, we need to manipulate data. If variables and values are the nouns of our language, **operators** are the verbs. Without operators, we could declare variables like `const x = 5;` and `const y = 10;`, but we would have no way to add them, compare them, or assign new values to them. The TC39 committee designed operators as lightweight, symbolic syntax to perform common computations efficiently without needing the overhead of writing full function calls (like `add(x, y)`) for basic tasks.

### (2) Reality Metaphor
An operator is like a kitchen tool. The food ingredients you work on are the **operands**, and the tool itself is the **operator**. For example, a knife (operator) performs a slicing action on a carrot (operand). A blender (operator) performs a mixing action on fruit and milk (operands).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const x = 5; // "=" is an assignment operator; "5" is the operand
const y = x + 3; // "+" is an arithmetic operator; "x" and "3" are operands
const isGreater = y > 5; // ">" is a comparison operator; "y" and "5" are operands

console.log(isGreater); // true
```

#### Fuller Example
```javascript
// A simple discount calculator demonstrating multiple operator types
const originalPrice = 100;
const discountRate = 0.2; // 20% discount

// Arithmetic operator (*) to calculate discount amount
const discountAmount = originalPrice * discountRate;

// Arithmetic operator (-) to calculate final price
const finalPrice = originalPrice - discountAmount;

// Comparison operator (<) returning a boolean
const isBargain = finalPrice < 50;

console.log("Final Price:", finalPrice); // Final Price: 80
console.log("Is it a bargain?", isBargain); // Is it a bargain? false
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing Operator Symbols with English Words

**The mistake:** Using words like `and` or `or` instead of symbolic operators like `&&` or `||`.

**Why it's wrong:** JavaScript does not support word-based logical operators. Using them will result in a syntax error because the parser doesn't recognize them as operations.

*Incorrect:*
```javascript
const hasKey = true;
const hasCode = true;

if (hasKey and hasCode) { // SyntaxError: Unexpected identifier
  console.log("Open door");
}
```

*Fix:*
```javascript
const hasKey = true;
const hasCode = true;

if (hasKey && hasCode) {
  console.log("Open door");
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Operator Callbacks

**The mistake:** Passing methods from Operator instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "operator",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "operator",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Operator Operations

**The mistake:** Executing asynchronous operations within Operator without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/operator"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/operator");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in operator: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Identify the Operands

**Problem:** In the expression `const result = (a * b) + c;`, list all the operands for the multiplication (`*`) and addition (`+`) operators.

**Expected output:**
> [!check]- Answer
> ```text
> Operands of '*': a, b
> Operands of '+': (a * b), c
> ```
> - An operand is the target of the operator's action.
> - The result of `a * b` becomes a single value, which then acts as an operand for `+`.

---

### Exercise 2: Ternary Operator Expression Evaluation

**Problem:** Use a nested ternary operator to return `"Positive"`, `"Negative"`, or `"Zero"` for input number `x`.

**Expected output:**
> [!check]- Answer
> ```text
> Positive
> Negative
> Zero
> ```
> ```javascript
> function checkSign(x) {
>   return x > 0 ? "Positive" : x < 0 ? "Negative" : "Zero";
> }
> console.log(checkSign(5));
> console.log(checkSign(-3));
> console.log(checkSign(0));
> ```
>
> **Explanation:** The ternary operator `cond ? expr1 : expr2` evaluates and yields values as an inline expression.

---

### Exercise 3: In Operator Property Existence

**Problem:** Use the `in` operator to check if property `"age"` exists in `{ name: "Alice", age: undefined }`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> const user = { name: "Alice", age: undefined };
> console.log("age" in user);
> ```
>
> **Explanation:** Property checks using `"prop" in obj` return `true` if property keys exist on objects or prototype chains regardless of value.


---

## 7. Related Terms
- [Arithmetic Operators](arithmetic_operators.md) — Operators used to perform mathematical calculations.
- [Assignment Operators](assignment_operators.md) — Operators used to store or update values in variables.
- [Comparison Operators](comparison_operators.md) — Operators used to compare two values.

---

## 8. Key Takeaways
- An operator is a symbol (like `+`, `=`, `>`) that performs an action on one or more operands.
- Operands are the values or variables that the operator acts upon.
- Operators are built into the JavaScript engine's grammar, providing shorthand syntax for operations that would otherwise require functions.
