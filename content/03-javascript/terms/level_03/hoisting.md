# Hoisting

> **Level 3 — Functions & Scope**
> JavaScript's default behavior of moving variable and function declarations to the top of their scope before code execution.

---

## 1. Prerequisites
- [Scope](scope.md) — The current context of execution.
- [Function Declaration](function_declaration.md) — Defining a named function.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript execution actually happens in two distinct phases: the **Creation Phase** (parsing the code and setting up memory) and the **Execution Phase** (running the code line by line). 

During the Creation Phase, the engine sweeps through the code, finds all `var` variables and Function Declarations, and "hoists" them to the very top of their respective scopes in memory. This was originally designed to make coding easier for beginners, allowing them to call a function at the top of a file without worrying about where it was officially defined at the bottom.

### (2) Reality Metaphor
Imagine a theatrical play. Before the curtain opens (the Creation Phase), the stage manager reads the script, finds all the actors (variables/functions), and forces them to stand at the very back of the stage (Hoisting). When the play actually begins (Execution Phase), the actors step forward one by one. Even if an actor's line isn't until Act 3, they physically exist on the stage from the very first second of the play.

### (3) JavaScript Code Examples

#### Short Snippet: Function Hoisting
```javascript
// We are invoking the function BEFORE it is written!
sayHello(); // Output: "Hello!"

// The engine "hoisted" this entire block to the top during parsing
function sayHello() {
  console.log("Hello!");
}
```

#### Fuller Example: Variable Hoisting
```javascript
// What happens if we log a 'var' before it's assigned?
console.log(playerName); // Output: undefined (No crash!)

var playerName = "Alice";

console.log(playerName); // Output: "Alice"

/* 
Behind the scenes, the engine interprets the above code like this:
  var playerName;             <-- Declaration hoisted to the top!
  console.log(playerName);    <-- Value is currently undefined
  playerName = "Alice";       <-- Assignment stays exactly where it was written
  console.log(playerName);
*/
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming `let` and `const` aren't hoisted

**The mistake:** Thinking that `let` and `const` do not experience hoisting at all, and therefore won't cause issues if accessed early.

**Why it's wrong:** `let` and `const` **ARE** hoisted to the top of their block scope. However, unlike `var` (which is initialized with `undefined`), `let` and `const` remain uninitialized in a state called the **Temporal Dead Zone (TDZ)**. If you try to access them before their line of code runs, the engine throws a fatal `ReferenceError`.

*Incorrect:*
```javascript
// console.log(score); // ReferenceError! Cannot access 'score' before initialization
let score = 100;
```

*Fix:*
```javascript
let score = 100;
console.log(score); // Always declare and initialize BEFORE accessing!
```

---

### Mistake 2: Losing Context Binding (`this`) in Hoisting Callbacks

**The mistake:** Passing methods from Hoisting instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "hoisting",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "hoisting",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Hoisting Operations

**The mistake:** Executing asynchronous operations within Hoisting without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/hoisting"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/hoisting");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in hoisting: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Hoisting Chaos

**Problem:** Predict the output of this code snippet.
```javascript
greet();
console.log(age);

var age = 30;
function greet() {
  console.log("Welcome!");
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Welcome!
> undefined
> ```
> - The function declaration is hoisted completely, so `greet()` works perfectly.
> - Only the `var` *declaration* is hoisted, not the assignment (`= 30`). So `age` exists, but it is `undefined`.

---

### Exercise 2: Function vs Variable Hoisting Priority

**Problem:** Trace output of `console.log(typeof foo); function foo() {} var foo = 10;`.

**Expected output:**
> [!check]- Answer
> ```text
> function
> ```
> ```javascript
> console.log(typeof foo);
> function foo() {}
> var foo = 10;
> ```
>
> **Explanation:** Function declarations hoist before variable declarations (`var`), giving functions precedence during initial allocation.

---

### Exercise 3: Temporal Dead Zone Block Hoisting

**Problem:** Demonstrate that an outer `let x = 1` is shadowed by inner `let x = 2` TDZ inside an `if` block.

**Expected output:**
> [!check]- Answer
> ```text
> ReferenceError caught
> ```
> ```javascript
> let x = 1;
> if (true) {
>   try {
>     console.log(x); // Hits inner x in TDZ!
>     let x = 2;
>   } catch (err) {
>     console.log("ReferenceError caught");
>   }
> }
> ```
>
> **Explanation:** Inner block `let` declarations hoist to top of block scope, masking outer scope variables in TDZ.


---

## 7. Related Terms
- [Function Declaration](function_declaration.md) — Fully hoisted.
- [Function Expression](function_expression.md) — Not hoisted (only the variable declaration is).
- [var](../level_01/var.md) — Hoisted and initialized with `undefined`.
- [Lexical (Static) Scope / Environment](lexical_scope.md) — Related concept: Lexical (Static) Scope / Environment.
- [Execution Context](../level_05/execution_context.md) — Related concept: Execution Context.

---

## 8. Key Takeaways
- Hoisting is the engine moving declarations to the top of memory during the parsing phase.
- **Function Declarations** are fully hoisted (you can call them before they appear in code).
- **`var` Declarations** are hoisted, but their values are not. They evaluate to `undefined` if accessed early.
- **`let` and `const` Declarations** are hoisted into the Temporal Dead Zone (TDZ) and will crash if accessed early.
