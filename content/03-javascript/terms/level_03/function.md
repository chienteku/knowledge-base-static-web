# Function

> **Level 3 — Functions & Scope**
> A reusable block of code designed to perform a particular task.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
- [Statement](../level_01/statement.md) — An instruction that performs an action.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Function is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Modular Business Logic Unit Encapsulation

**Scenario:** An e-commerce order service encapsulates pricing calculation logic inside reusable, parameterized function units.

**Requirements:**
1. Write calculateOrderTotal(subtotal, taxRate).
2. Encapsulate arithmetic inside function body.
3. Return calculated value.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateOrderTotal(subtotal, taxRate) {
>   const tax = subtotal * taxRate;
>   const total = subtotal + tax;
>   return Number(total.toFixed(2));
> }
>
> // Verification tests
> const res = calculateOrderTotal(100, 0.08);
> console.assert(res === 108.00, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Function Encapsulation**: Functions encapsulate blocks of reusable code designed to perform specific tasks.
> 2. **Parameters & Arguments**: Functions accept input parameters and execute logic within local scopes.
> 3. **Return Values**: Functions evaluate logic and return results to caller invocation sites.
> 
---

### Exercise 2: Scope Isolation in Function Bodies

**Scenario:** An authentication module demonstrates that variables declared inside function bodies remain isolated from external scope pollution.

**Requirements:**
1. Write authenticateUser(username, password).
2. Declare local variables inside function body.
3. Verify local variables are not accessible globally.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function authenticateUser(username, password) {
>   const isUserValid = username === "admin";
>   const isPassValid = password === "secret123";
>   return isUserValid && isPassValid;
> }
>
> // Verification tests
> console.assert(authenticateUser("admin", "secret123") === true, "Test 1 Failed");
> // @ts-ignore
> console.assert(typeof isUserValid === "undefined", "Test 2 Failed: Local variable leaked");
> ```
>
> #### Technical Explanation
>
> 1. **Function Scope**: Functions create local scope boundaries isolating internal variables.
> 2. **Reusability**: Functions allow executing identical logic multiple times with different argument inputs.
> 3. **Callable Objects**: Functions are specialized objects that possess a [[Call]] internal method.
> 
---

### Exercise 3: State Machine Execution Functions

**Scenario:** A workflow engine uses dedicated functions to transition states and return updated status descriptors.

**Requirements:**
1. Write transitionState(currentState, action).
2. Process state transitions in function logic.
3. Return new state descriptor.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function transitionState(currentState, action) {
>   if (action === "START" && currentState === "IDLE") {
>     return "RUNNING";
>   } else if (action === "STOP" && currentState === "RUNNING") {
>     return "STOPPED";
>   }
>   return currentState;
> }
>
> // Verification tests
> console.assert(transitionState("IDLE", "START") === "RUNNING", "Test 1 Failed");
> console.assert(transitionState("RUNNING", "STOP") === "STOPPED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Deterministic Functions**: Given identical arguments, pure state transition functions return predictable output states.
> 2. **Control Flow**: Functions combine conditional statements and logic into structured units.
> 3. **Interface Abstraction**: Hides internal computation steps behind clean function invocation interfaces.
---

## 6. Related Terms
- [Parameters](parameters.md) — The variables listed in the function definition.
- [return Statement](return_statement.md) — Ends execution and outputs a value.
- [Arrow Function](arrow_function.md) — A shorter syntax for writing functions.
- [Arguments](arguments.md) — Related concept: Arguments.
- [Generator (function*)](../level_09/generator.md) — Related concept: Generator (function*).
- [Function Declaration](function_declaration.md) — Function declaration.
- [Function Expression](function_expression.md) — Function expression.

---

## 7. Key Takeaways
- Functions are reusable blocks of code that perform specific tasks.
- You must use parentheses `()` to invoke (execute) a function.
- Functions allow you to adhere to the DRY (Don't Repeat Yourself) principle.
- In JavaScript, functions are "first-class", meaning they can be passed around like any other data type.
