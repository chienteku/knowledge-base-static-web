# Synchronous

> **Level 6 — Asynchronous JavaScript**
> Execution of code sequentially, one line at a time, blocking subsequent execution until finished.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — Storing data.
- [Function](../level_03/function.md) — A reusable block of code.

---

## 2. Term Category
- **Computer Science Concept**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When programming languages were first invented, the simplest and most logical way for a computer to read instructions was exactly how a human reads a book: top to bottom, one sentence at a time. 

This is "Synchronous" execution. The computer reads line 1, finishes line 1. Reads line 2, finishes line 2. This makes code extremely predictable and easy to debug, because you always know exactly what order things will happen in. By default, almost all JavaScript code you write is synchronous.

### (2) Reality Metaphor
Synchronous execution is like standing in line at a single-register coffee shop. 
The barista takes Customer 1's order, makes Customer 1's coffee, and hands it to them. Only *after* Customer 1 is completely finished does the barista turn to Customer 2. If Customer 1 orders a complicated drink that takes 5 minutes to make, the entire line is "blocked" and has to stand there waiting.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Synchronous code runs exactly in order.
console.log("1. I happen first");
console.log("2. I happen second");
console.log("3. I happen third");
```

#### Fuller Example: Blocking Code
```javascript
console.log("Start of program");

function complexMath() {
  // A heavy synchronous task
  let sum = 0;
  for (let i = 0; i < 1_000_000_000; i++) {
    sum += i;
  }
  return sum;
}

// The program FREEZES here until the math is completely done!
const result = complexMath(); 
console.log(`Math result: ${result}`);

// This line will not run until the heavy math finishes
console.log("End of program"); 
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Synchronous Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Synchronous blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "synchronous";
```

*Fix:*
```javascript
let value = "synchronous";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Synchronous Callbacks

**The mistake:** Passing methods from Synchronous instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "synchronous",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "synchronous",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Synchronous Operations

**The mistake:** Executing asynchronous operations within Synchronous without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/synchronous"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/synchronous");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in synchronous: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Prediction

**Problem:** Predict the exact output order of the following synchronous code:
```javascript
let name = "Alice";
name = "Bob";
console.log(name);
function sayHi() {
  console.log("Hi!");
}
sayHi();
```

**Expected output:**
> [!check]- Answer
> ```text
> "Bob"
> "Hi!"
> ```
> - Variables update sequentially. Function calls execute exactly when they are invoked.

---

### Exercise 2: Synchronous Execution Order

**Problem:** Trace synchronous execution lines `1` -> `2` -> `3`.

**Expected output:**
> [!check]- Answer
> ```text
> Line 1
> Line 2
> Line 3
> ```
> ```javascript
> console.log("Line 1");
> console.log("Line 2");
> console.log("Line 3");
> ```
>
> **Explanation:** Synchronous JavaScript code executes line-by-line in sequential order.

---

### Exercise 3: Blocking Call Stack Execution

**Problem:** Demonstrate that synchronous function execution blocks subsequent statements until complete.

**Expected output:**
> [!check]- Answer
> ```text
> Sync computation complete
> Next line executed
> ```
> ```javascript
> function syncWork() { for(let i=0; i<1000000; i++){} }
> syncWork();
> console.log("Sync computation complete");
> console.log("Next line executed");
> ```
>
> **Explanation:** Synchronous calls occupy the call stack, pausing outer code execution.


---

## 7. Related Terms
- [Asynchronous](./asynchronous.md) — The opposite! Non-blocking code.
- [Call Stack](./call_stack.md) — The mechanism that keeps track of synchronous execution.

---

## 8. Key Takeaways
- Synchronous code runs top-to-bottom, one line at a time.
- It "blocks" the thread. The next line cannot start until the current line finishes.
- JavaScript is synchronous by default.
- Heavy synchronous tasks in the browser will freeze the webpage.
