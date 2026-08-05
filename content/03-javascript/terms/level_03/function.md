# Function

> **Level 3 — Functions & Scope**
> A reusable block of code designed to perform a particular task.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
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
If you need to calculate the tax on an item, you write the math logic once. But what if you have 1,000 different items in a shopping cart? Copying and pasting the exact same math logic 1,000 times violates the DRY (Don't Repeat Yourself) principle, makes the file massive, and makes fixing bugs a nightmare. 

Functions were designed to wrap a sequence of statements into a single, reusable "sub-program." You write the logic once, give it a name, and then you can "call" (or "invoke") that name as many times as you want, passing in different data each time.

### (2) Reality Metaphor
A Function is like a factory machine. 
1. You pour raw materials into the top (the **input** or arguments).
2. The machine hums and processes the materials according to its internal blueprint (the **code block**).
3. It spits out a finished product at the end (the **return** value).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Defining the function (building the machine)
function sayHello() {
  console.log("Hello, world!");
}

// Invoking the function (turning the machine on)
sayHello();
sayHello(); // Can be reused infinitely
```

#### Fuller Example
```javascript
// A function that takes inputs (parameters) and returns an output
function calculateTotal(price, taxRate) {
  const taxAmount = price * taxRate;
  const total = price + taxAmount;
  
  return total; // The "finished product" sent back to the caller
}

const shirtPrice = calculateTotal(20, 0.05); // 21
const pantsPrice = calculateTotal(50, 0.05); // 52.5

console.log(`Cart Total: $${shirtPrice + pantsPrice}`);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to invoke the function

**The mistake:** Writing the function name without parentheses `()` and expecting it to run.

**Why it's wrong:** In JavaScript, functions are objects. If you reference `sayHello` without parentheses, you are simply asking the engine "What is `sayHello`?", and it will return the function's raw code. To actually *execute* the code, you must append `()` to tell the engine to invoke it.

*Incorrect:*
```javascript
function blastOff() {
  console.log("Rocket launched!");
}

const status = blastOff; // Assigns the function itself, does NOT run it!
console.log(status); // Logs: [Function: blastOff]
```

*Fix:*
```javascript
function blastOff() {
  console.log("Rocket launched!");
}

blastOff(); // The () actually runs the function
```

---

### Mistake 2: Losing Context Binding (`this`) in Function Callbacks

**The mistake:** Passing methods from Function instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "function",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "function",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Function Operations

**The mistake:** Executing asynchronous operations within Function without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/function"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/function");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in function: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Build a Multiplier

**Problem:** Write a function named `multiply` that takes two numbers, multiplies them together, and logs the result to the console. Call the function twice with different numbers.

**Expected output:**
*(Depends on inputs, e.g., 50 and 12)*

> [!check]- Answer
> - `function multiply(a, b) { ... }`
> - Use `console.log(a * b);` inside the block.
> - Call it using `multiply(5, 10);`

---

### Exercise 2: Function Arity Property (`.length`)

**Problem:** Inspect `.length` on `function sum(a, b, c = 0) {}`.

**Expected output:**
> [!check]- Answer
> ```text
> 2
> ```
> ```javascript
> function sum(a, b, c = 0) {}
> console.log(sum.length);
> ```
>
> **Explanation:** `fn.length` measures positional expected parameters prior to default parameters.

---

### Exercise 3: Function Constructor Prototype Property

**Problem:** Check `typeof function(){}.prototype`.

**Expected output:**
> [!check]- Answer
> ```text
> object
> ```
> ```javascript
> function Demo() {}
> console.log(typeof Demo.prototype);
> ```
>
> **Explanation:** Standard function declarations automatically instantiate prototype object references.


---

## 7. Related Terms
- [Parameters](parameters.md) — The variables listed in the function definition.
- [return Statement](return_statement.md) — Ends execution and outputs a value.
- [Arrow Function](arrow_function.md) — A shorter syntax for writing functions.
- [Arguments](arguments.md) — Related concept: Arguments.
- [Generator (function*)](../level_09/generator.md) — Related concept: Generator (function*).
- [Function Declaration](function_declaration.md) — Function declaration.
- [Function Expression](function_expression.md) — Function expression.
---

## 8. Key Takeaways
- Functions are reusable blocks of code that perform specific tasks.
- You must use parentheses `()` to invoke (execute) a function.
- Functions allow you to adhere to the DRY (Don't Repeat Yourself) principle.
- In JavaScript, functions are "first-class", meaning they can be passed around like any other data type.
