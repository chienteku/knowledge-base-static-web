# Operator

> **Level 1 — Foundations**
> Symbol that performs an operation on operands (umbrella concept).

---

## 1. Prerequisites
- [Statement](statement.md) — An instruction that performs an action.
- [Expression](expression.md) — Any valid unit of code that resolves to a value.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Operator is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Multi-Operator Customer Qualification Evaluator

**Scenario:** An e-commerce promotion engine evaluates user eligibility for free shipping using unary (!), binary (>=, +), and ternary (? :) operators.

**Requirements:**
1. Check if user is NOT restricted using unary !.
2. Add cart subtotal and tax using binary +.
3. Compare against free shipping threshold using binary >=.
4. Return shipping cost using ternary operator.

> [!check]- Answer
> #### Implementation
> ```javascript
> function computeShippingFee(user, subtotal, tax) {
>   const isEligibleUser = !user.isRestricted;
>   const total = subtotal + tax;
>   const qualifiesForFreeShipping = isEligibleUser && total >= 100;
>   return qualifiesForFreeShipping ? 0 : 15;
> }
> // Verification tests
> console.assert(computeShippingFee({ isRestricted: false }, 95, 10) === 0, "Test 1 Failed");
> console.assert(computeShippingFee({ isRestricted: false }, 50, 5) === 15, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Operator Arity**: Operators are categorized by arity: Unary (1 operand, e.g. !), Binary (2 operands, e.g. +), and Ternary (3 operands, ? :).
> 2. **Operand Evaluation**: Operators take input operands, evaluate them, and return a single output value.
> 3. **Side-Effect Free Operators**: Arithmetic and comparison operators evaluate values without mutating their input variables.
> 
---

### Exercise 2: Pipeline Transformation with Operator Composition

**Scenario:** A data analytics engine processes numerical metric streams, applying multiplication, comparison, and ternary fallback operators in a composition pipeline.

**Requirements:**
1. Scale metric by multiplier using *.
2. Check if scaled metric exceeds max cap using >.
3. Return capped value or scaled value.

> [!check]- Answer
> #### Implementation
> ```javascript
> function processMetric(value, multiplier, cap) {
>   const scaled = value * multiplier;
>   return scaled > cap ? cap : scaled;
> }
> // Verification tests
> console.assert(processMetric(10, 2, 50) === 20, "Test 1 Failed");
> console.assert(processMetric(30, 2, 50) === 50, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Expression Composition**: Operators can be composed into expressions where sub-expression values serve as operands for outer operators.
> 2. **Precedence Hierarchy**: Higher-precedence operators (e.g. *) evaluate before lower-precedence operators (e.g. >).
> 3. **Deterministic Evaluation**: Operators execute in a specified, deterministic evaluation order.
> 
---

### Exercise 3: Type & Property Operator Inspector

**Scenario:** A framework module inspects entity objects at runtime using specialized JS operators (typeof, instanceof, in).

**Requirements:**
1. Check property existence using in operator.
2. Check type using typeof.
3. Return inspection summary object.

> [!check]- Answer
> #### Implementation
> ```javascript
> function inspectEntity(entity) {
>   const hasId = entity !== null && typeof entity === "object" && "id" in entity;
>   const valueType = typeof entity;
>   return { hasId, valueType };
> }
> // Verification tests
> console.assert(inspectEntity({ id: 101 }).hasId === true, "Test 1 Failed");
> console.assert(inspectEntity(42).hasId === false, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Property Operator (in)**: The in operator checks if a specified property key exists in an object or its prototype chain.
> 2. **Type Operator (typeof)**: Unary operator typeof returns a string identifying the primitive or object type of its operand.
> 3. **Operator Built-ins**: Operators are built directly into language syntax rather than function library calls.
---

## 6. Related Terms
- [Arithmetic Operators](arithmetic_operators.md) — Operators used to perform mathematical calculations.
- [Assignment Operators](assignment_operators.md) — Operators used to store or update values in variables.
- [Comparison Operators](comparison_operators.md) — Operators used to compare two values.

---

## 7. Key Takeaways
- An operator is a symbol (like `+`, `=`, `>`) that performs an action on one or more operands.
- Operands are the values or variables that the operator acts upon.
- Operators are built into the JavaScript engine's grammar, providing shorthand syntax for operations that would otherwise require functions.
