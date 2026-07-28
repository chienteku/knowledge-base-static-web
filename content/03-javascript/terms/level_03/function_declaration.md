# Function Declaration

> **Level 3 — Functions & Scope**
> Defines a named function using the `function` keyword (hoisted).

---

## 1. Prerequisites
- [Function](../level_03/function.md) — A reusable block of code.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building a JavaScript file, developers needed a clear, standard way to define the primary sub-programs that make up their application. The Function Declaration is the oldest and most traditional way to create a function. 

It was designed with a special feature called "Hoisting". The JavaScript engine reads the entire file before executing it, and it pulls all Function Declarations to the very top of memory. This allows developers to organize their files naturally: they can call a function at the top of the script, and define how that function works at the bottom, keeping the main logic clean and readable.

### (2) Reality Metaphor
A Function Declaration is like putting a prominent recipe card into your kitchen's central recipe box before you start cooking. Because it's officially registered in the central box, you can ask for the "Pancake" recipe at any time during the cooking process—even if the card physically sits at the back of the box.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// This is a Function Declaration
function greet() {
  console.log("Welcome to the application!");
}

greet();
```

#### Fuller Example
```javascript
// Look! We are calling the function BEFORE it is defined in the code!
// This works perfectly because of "Hoisting".
initializeDatabase(); 

// ... hundreds of lines of code ...

// The actual Function Declaration
function initializeDatabase() {
  console.log("Connecting to the database...");
  // connection logic...
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Function Declaration Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Function Declaration blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "function_declaration";
```

*Fix:*
```javascript
let value = "function_declaration";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Function Declaration Callbacks

**The mistake:** Passing methods from Function Declaration instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "function_declaration",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "function_declaration",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Function Declaration Operations

**The mistake:** Executing asynchronous operations within Function Declaration without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/function_declaration"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/function_declaration");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in function_declaration: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Hoisting Test

**Problem:** Write a function call `sayGoodbye();` on line 1. On line 3, write the Function Declaration for `sayGoodbye` that logs `"See ya!"`. Run the code to prove it works.

**Expected output:**
> [!check]- Answer
> ```text
> See ya!
> ```
> - Just write the call at the top, and `function sayGoodbye() { ... }` at the bottom.

---

### Exercise 2: Hoisting Invocation Before Declaration Line

**Problem:** Call `greet()` before its `function greet() {}` declaration line.

**Expected output:**
> [!check]- Answer
> ```text
> Hello!
> ```
> ```javascript
> greet();
> function greet() {
>   console.log("Hello!");
> }
> ```
>
> **Explanation:** Function declarations hoist both identifier names and function bodies to scope top.

---

### Exercise 3: Function Declaration Scope Isolation

**Problem:** Demonstrate that nested function declarations are contained within parent scopes.

**Expected output:**
> [!check]- Answer
> ```text
> ReferenceError caught
> ```
> function outer() {
>   function inner() { return "secret"; }
> }
> outer();
> try {
>   inner();
> } catch (err) {
>   console.log("ReferenceError caught");
> }
> ```
>
> **Explanation:** Function declarations create local lexical scope boundaries.


---

## 7. Related Terms
- [Function Expression](../level_03/function_expression.md) — A function assigned to a variable (which is *not* hoisted).
- [Hoisting](../level_03/hoisting.md) — The behavior of moving declarations to the top of the scope.

---

## 8. Key Takeaways
- A Function Declaration starts with the `function` keyword as the very first word of the statement.
- They must have a name.
- They are **hoisted**, meaning you can invoke them before they appear in the source code.
