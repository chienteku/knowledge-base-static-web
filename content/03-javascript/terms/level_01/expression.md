# Expression

> **Level 1 — Foundations**
> Any valid unit of code that resolves to a single value (e.g., `5 + 5`).

---

## 1. Prerequisites
- [Statement](statement.md) — An instruction that performs an action.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Expression is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Dynamic Pricing Formula Evaluator

**Scenario:** An e-commerce pricing engine calculates the final checkout price by evaluating a compound expression that incorporates base price, percentage discounts, volume multipliers, and fixed tax.

**Requirements:**
1. Write a function evaluatePriceExpression(base, qty, discountRate, taxRate).
2. Construct a single expression calculating discounted subtotal and tax.
3. Return the evaluated total value.

> [!check]- Answer
> #### Implementation
> ```javascript
> function evaluatePriceExpression(base, qty, discountRate, taxRate) {
>   const total = (base * qty * (1 - discountRate)) * (1 + taxRate);
>   return Number(total.toFixed(2));
> }
> // Verification tests
> const finalPrice = evaluatePriceExpression(50, 2, 0.1, 0.08);
> console.assert(finalPrice === 97.20, "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Expression Definition**: An expression is any valid unit of code that evaluates to a single value.
> 2. **Expression Composition**: Expressions can be nested and combined using operators; sub-expressions evaluate first according to operator precedence.
> 3. **Side-Effect Free Evaluation**: Pure mathematical expressions produce a value without modifying external application state.
> 
---

### Exercise 2: Short-Circuit Permission Expression Evaluator

**Scenario:** An API router determines resource access permissions by evaluating a short-circuit logical expression without using if statements.

**Requirements:**
1. Evaluate user permission using logical AND (&&) and logical OR (||) expressions.
2. Ensure user isAdmin grants instant access (short-circuit).
3. Ensure non-admins require both isSubscriber AND hasActiveToken.

> [!check]- Answer
> #### Implementation
> ```javascript
> function evaluateAccessExpression(user) {
>   return Boolean(user && (user.isAdmin || (user.isSubscriber && user.hasActiveToken)));
> }
> // Verification tests
> console.assert(evaluateAccessExpression({ isAdmin: true }) === true, "Test 1 Failed");
> console.assert(evaluateAccessExpression({ isAdmin: false, isSubscriber: true, hasActiveToken: true }) === true, "Test 2 Failed");
> console.assert(evaluateAccessExpression({ isAdmin: false, isSubscriber: true, hasActiveToken: false }) === false, "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Logical Expressions**: Logical expressions evaluate operands and return the value of the deciding operand.
> 2. **Short-Circuiting**: In A || B, if A evaluates to truthy, B is never evaluated; in A && B, if A is falsy, B is skipped.
> 3. **Expression As Operand**: Expressions can serve as operands inside larger containing expressions.
> 
---

### Exercise 3: Immediately Invoked Function Expression (IIFE) Config Module

**Scenario:** A frontend component uses an Immediately Invoked Function Expression (IIFE) to encapsulate private setup logic and evaluate an initial state configuration object.

**Requirements:**
1. Create an IIFE using expression syntax (function() { ... })().
2. Calculate private setup variables inside the IIFE body.
3. Return a frozen configuration object.

> [!check]- Answer
> #### Implementation
> ```javascript
> const appConfig = (function() {
>   const env = "production";
>   const maxConnections = 100;
> return Object.freeze({
>     endpoint: `https://${env}.example.com/api`,
>     maxConnections: maxConnections
>   });
> })();
> // Verification tests
> console.assert(appConfig.endpoint === "https://production.example.com/api", "Test 1 Failed");
> console.assert(appConfig.maxConnections === 100, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Function Expressions**: A function defined within an expression context (such as parenthetical wrapping) is a Function Expression rather than a Function Declaration.
> 2. **Immediate Invocation**: Appending () to a function expression executes it immediately, returning its evaluated return value.
> 3. **Encapsulation**: IIFEs create an isolated lexical scope, keeping temporary setup variables from polluting the outer scope.
---

## 6. Related Terms
- [Statement](statement.md) — An instruction that performs an action.
- [Operator Precedence & Associativity](operator_precedence.md) — Related concept: Operator Precedence & Associativity.
- [Template Literals](../level_08/template_literals.md) — Related concept: Template Literals.

---

## 7. Key Takeaways
- An expression is any code that resolves to a value.
- Expressions can be used anywhere JavaScript expects a value (e.g., passing arguments to a function, assigning a variable).
- An expression can be as simple as a primitive value (`42`) or highly complex (`getUser().profile.age + 5`).
