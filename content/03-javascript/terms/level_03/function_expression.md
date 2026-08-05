# Function Expression

> **Level 3 — Functions & Scope**
> A function assigned to a variable (not hoisted).

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code.
- [Variable](../level_01/variable.md) — A named container for storing data values.
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Because JavaScript treats functions as "first-class citizens" (like strings or numbers), you don't *have* to declare them globally using the `function` keyword. You can create a function on the fly and shove it directly into a variable. 

This is called a Function Expression. It is incredibly useful when you want to pass a function as an argument to another function, or when you want strict control over when a function becomes available in memory. Unlike Function Declarations, Function Expressions are **not hoisted**.

### (2) Reality Metaphor
If a Function Declaration is a permanent recipe stored in your kitchen's central recipe box, a Function Expression is like hastily scribbling a recipe on a napkin and handing it to your friend (a variable). That recipe only exists at the exact moment you hand over the napkin; nobody could have read it before you wrote it down.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// The function has no name of its own (it is "anonymous")
// It is assigned to the variable 'sayHi'
const sayHi = function() {
  console.log("Hi there!");
};

// We invoke the variable name
sayHi();
```

#### Fuller Example
```javascript
// This will throw a ReferenceError!
// Function Expressions are NOT hoisted.
// calculateArea(); 

const calculateArea = function(width, height) {
  return width * height;
};

// Now it works, because the variable has been initialized.
console.log(calculateArea(5, 10)); // 50

// We can also reassign it if we used `let` (though `const` is safer)
let mathOperation = function(a, b) { return a + b; };
console.log(mathOperation(2, 2)); // 4

mathOperation = function(a, b) { return a * b; };
console.log(mathOperation(2, 2)); // 4
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to invoke before initialization

**The mistake:** Attempting to call the function before the line of code where the variable is assigned.

**Why it's wrong:** While the *variable declaration* (`const myFunc`) might be hoisted, its *assignment* (the actual function logic) is not. The engine doesn't know the variable holds a function until it executes that specific line.

*Incorrect:*
```javascript
// doMath(); // ReferenceError for const/let

const doMath = function() {
  console.log("Calculating...");
};
```

*Fix:*
```javascript
const doMath = function() {
  console.log("Calculating...");
};

doMath(); // Always call AFTER the expression!
```

---

### Mistake 2: Losing Context Binding (`this`) in Function Expression Callbacks

**The mistake:** Passing methods from Function Expression instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "function_expression",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "function_expression",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Function Expression Operations

**The mistake:** Executing asynchronous operations within Function Expression without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/function_expression"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/function_expression");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in function_expression: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Anonymous Assignment

**Problem:** Create a Function Expression that takes one parameter `name` and logs `"Goodbye, [name]"`. Assign it to a `const` variable called `farewell`. Call `farewell("Alice")`.

**Expected output:**
> [!check]- Answer
> ```text
> Goodbye, Alice
> ```
> - `const farewell = function(name) { ... };`

---

### Exercise 2: Anonymous vs Named Function Expressions

**Problem:** Create a named function expression `const fn = function myName() { return myName.name; };` and print `fn()`.

**Expected output:**
> [!check]- Answer
> ```text
> myName
> ```
> ```javascript
> const fn = function myName() {
>   return myName.name;
> };
> console.log(fn());
> ```
>
> **Explanation:** Named function expressions bind function names internally for diagnostic tracing and recursion.

---

### Exercise 3: Conditional Function Expression Assignment

**Problem:** Assign `const logger` dynamically using ternary expression based on boolean `debug` flag.

**Expected output:**
> [!check]- Answer
> ```text
> Log: hello
> ```
> ```javascript
> const debug = true;
> const logger = debug ? (msg) => console.log(`Log: ${msg}`) : () => {};
> logger("hello");
> ```
>
> **Explanation:** Function expressions permit conditional, dynamic assignment at runtime.


---

## 7. Related Terms
- [Function Declaration](function_declaration.md) — The traditional way to define a function (which is hoisted).
- [Arrow Function](arrow_function.md) — A modern, shorter syntax for writing Function Expressions.
- [Hoisting](hoisting.md) — Related concept: Hoisting.
- [Function](function.md) — Related concept: Function.
---

## 8. Key Takeaways
- A Function Expression creates a function and assigns it to a variable.
- They are usually "anonymous" (the function itself has no name after the `function` keyword).
- They are **not hoisted**. You cannot call them before they are defined in the code.
- They reinforce the concept that functions are just values that can be passed around.
