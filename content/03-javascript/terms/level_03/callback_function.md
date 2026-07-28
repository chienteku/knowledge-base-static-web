# Callback Function

> **Level 3 — Functions & Scope**
> A function passed into another function as an argument to be executed later.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — A reusable block of code.
- [Higher-Order Function](../level_03/higher_order_function.md) — A function that accepts other functions as arguments.

---

## 2. Term Category
- **Functional Programming / Asynchronous Programming**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript is heavily reliant on "events" (like a user clicking a button) and "asynchronous tasks" (like downloading data from the internet). When you tell JavaScript to download an image, you don't want the entire program to freeze and wait. You want it to keep running other code, and then *call you back* when the image is finally ready.

To achieve this, developers pass a "Callback Function" to the downloading code. It's essentially saying: "Start downloading this file. I'm going to go do other things. Here is a set of instructions (the Callback Function). When the download finishes, execute these instructions."

### (2) Reality Metaphor
A Callback Function is exactly like leaving your phone number at a busy restaurant. 
- You ask for a table (the outer function call).
- The host says it will be a 30-minute wait.
- You give the host your phone number (the **Callback Function**).
- You leave the restaurant to go shopping. When the table is ready, the host executes your instructions by calling your number (executing the callback).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
function greetUser(name) {
  console.log(`Hello, ${name}!`);
}

// setTimeout is a built-in Higher-Order Function.
// 'greetUser' is the Callback Function.
// It says: "Wait 2 seconds, then execute the callback."
setTimeout(greetUser, 2000, "Alice"); 
```

#### Fuller Example
```javascript
// The generic process (Higher-Order Function)
function processPayment(amount, onSuccess, onError) {
  console.log(`Processing payment of $${amount}...`);
  
  if (amount > 0) {
    onSuccess(); // Execute the success callback
  } else {
    onError();   // Execute the error callback
  }
}

// Our specific callback functions
function handleSuccess() {
  console.log("Thank you for your purchase!");
}

function handleError() {
  console.log("Payment failed. Please check your card details.");
}

// Pass the callbacks IN to the processor
processPayment(50, handleSuccess, handleError);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Callback Function Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Callback Function blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "callback_function";
```

*Fix:*
```javascript
let value = "callback_function";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Callback Function Callbacks

**The mistake:** Passing methods from Callback Function instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "callback_function",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "callback_function",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Callback Function Operations

**The mistake:** Executing asynchronous operations within Callback Function without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/callback_function"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/callback_function");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in callback_function: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Anonymous Callbacks

**Problem:** Use the built-in `setTimeout` function. Instead of passing it a named function, pass it an anonymous Arrow Function that logs `"Time's up!"` after 1000 milliseconds.

**Expected output:**
*(Wait 1 second)*
> [!check]- Answer
> ```text
> Time's up!
> ```
> - `setTimeout(() => { console.log("Time's up!"); }, 1000);`
> - Passing anonymous arrow functions as callbacks is the most common pattern in modern React/JavaScript.

---

### Exercise 2: Higher-Order Function with Callback

**Problem:** Write `processData(val, callback)` that multiplies `val` by 2 and passes it to `callback`.

**Expected output:**
> [!check]- Answer
> ```text
> Result: 20
> ```
> ```javascript
> function processData(val, callback) {
>   const res = val * 2;
>   callback(res);
> }
> processData(10, (out) => console.log(`Result: ${out}`));
> ```
>
> **Explanation:** Callbacks are functions passed as arguments executed inside higher-order routines.

---

### Exercise 3: Error-First Callback Pattern (Node.js style)

**Problem:** Simulate Node.js error-first callback `callback(err, data)` handling success vs error.

**Expected output:**
> [!check]- Answer
> ```text
> Data received: Success
> ```
> ```javascript
> function fetchData(cb) {
>   cb(null, "Success");
> }
> fetchData((err, data) => {
>   if (err) return console.log(err);
>   console.log(`Data received: ${data}`);
> });
> ```
>
> **Explanation:** Error-first callbacks receive `err` as first argument and `data` as second.

---

## 7. Related Terms
- [Higher-Order Function](../level_03/higher_order_function.md) — The function that *receives* the callback.
- [Arrow Function](../level_03/arrow_function.md) — The most common syntax used to write inline callbacks.

---

## 8. Key Takeaways
- A Callback Function is passed into another function as an argument.
- It delegates the responsibility of *when* the function should be executed to the receiving function.
- Callbacks are fundamental to event listeners (like button clicks) and asynchronous programming in JavaScript.
- Avoid nesting them too deeply (Callback Hell).
