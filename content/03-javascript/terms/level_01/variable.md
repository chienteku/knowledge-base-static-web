# Variable

> **Level 1 — Foundations**
> A named container for storing data values.

---

## 1. Prerequisites
- None!

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In early programming and the dawn of JavaScript, we needed a way to keep track of information in memory as a program runs. Without variables, you'd have to hardcode every single piece of data, making programs rigid and incapable of responding to user input or changing states. A variable acts as a symbolic name for a location in the computer's memory, allowing developers to store, retrieve, and manipulate data dynamically.

### (2) Reality Metaphor
Think of a variable like a labeled storage box in a warehouse. You write a name on the outside of the box (the variable name), and you can put an item inside it (the value). When you need the item, you just look for the box with that label.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Declare a variable and assign it a string value
let greeting = 'Hello, World!';
console.log(greeting); 
```

#### Fuller Example
```javascript
// Managing user state in a simple program
let userName = 'Alice';
let userAge = 28;
let isLoggedIn = true;

if (isLoggedIn === true) {
  console.log(`Welcome back, ${userName}! You are ${userAge} years old.`);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not Initializing Variables

**The mistake:** Declaring a variable but forgetting to give it an initial value before using it, which results in `undefined`.

**Why it's wrong:** It can lead to unexpected bugs, like printing `undefined` or causing math operations to result in `NaN` (Not a Number).

*Incorrect:*
```javascript
let totalCost;
console.log(`The total is ${totalCost}`); // "The total is undefined"
```

*Fix:*
```javascript
let totalCost = 0;
console.log(`The total is ${totalCost}`); // "The total is 0"
```

---

### Mistake 2: Losing Context Binding (`this`) in Variable Callbacks

**The mistake:** Passing methods from Variable instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "variable",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "variable",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Variable Operations

**The mistake:** Executing asynchronous operations within Variable without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/variable"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/variable");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in variable: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Create and Update a Variable

**Problem:** Declare a variable named `score`, set its initial value to 10, then update its value to 25 and log it.

**Expected output:**
> [!check]- Answer
> ```text
> 25
> ```
> - Use `let` to declare the variable so it can be updated.
> - Use `=` to assign and reassign values.
> 
---

### Exercise 2: Variable Scope Differences (`var` vs `let`)

**Problem:** Demonstrate that `var` leaks outside `if` blocks while `let` remains block-scoped.

**Expected output:**
> [!check]- Answer
> ```text
> varLeak: 10
> ReferenceError caught
> ```
> ```javascript
> if (true) {
>   var varLeak = 10;
>   let letScoped = 20;
> }
> console.log(`varLeak: ${varLeak}`);
> try {
>   console.log(letScoped);
> } catch (err) {
>   console.log("ReferenceError caught");
> }
> ```
>
> **Explanation:** `var` is function/globally scoped; `let` and `const` enforce strict block scoping (`{}`).
> 
---

### Exercise 3: Variable Hoisting Comparison

**Problem:** Compare `console.log(a); var a = 1;` vs `console.log(b); let b = 2;`.

**Expected output:**
> [!check]- Answer
> ```text
> undefined
> ReferenceError caught
> ```
> ```javascript
> console.log(a);
> var a = 1;
> try {
>   console.log(b);
>   let b = 2;
> } catch (err) {
>   console.log("ReferenceError caught");
> }
> ```
>
> **Explanation:** `var` hoists with `undefined` initialization; `let` hoists uninitialized in the Temporal Dead Zone.
> 
> 
---

## 7. Related Terms
- [let](let.md) — The modern way to declare a reassignable variable.
- [const](const.md) — The way to declare a variable that cannot be reassigned.
- [var](var.md) — The legacy way to declare variables.
- [console.log()](console_log.md) — Related concept: console.log().
- [ECMAScript](ecmascript.md) — Related concept: ECMAScript.

---

## 8. Key Takeaways
- A variable is a named reference to a value stored in memory.
- Use meaningful, descriptive names for your variables.
- Variables allow your programs to be dynamic and handle changing data over time.
