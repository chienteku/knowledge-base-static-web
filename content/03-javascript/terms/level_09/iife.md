# IIFE

> **Level 9 — Advanced Concepts & Patterns**
> Immediately Invoked Function Expression; a function that runs as soon as it is defined.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The core structure.
- [Scope](../level_03/scope.md) — The problem IIFEs solve.

---

## 2. Term Category
- **Design Pattern**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In older versions of JavaScript (before `let`, `const`, and ES6 Modules), the only way to create a private scope was to create a function. If you declared a `var` inside a function, the outside world couldn't see it.
But what if you just wanted to run some initialization code on page load, and you wanted to throw away the variables immediately so they didn't pollute the global scope? If you wrote a normal function, you'd have to name it, and that name itself would pollute the global scope!

Developers invented the **IIFE** (pronounced "iffy"). It is an anonymous function wrapped in parentheses (turning it into an Expression), followed immediately by another pair of parentheses `()` to execute it. It runs instantly, does its job, and disappears, leaving the global scope completely clean.

### (2) Reality Metaphor
An IIFE is like a self-destructing message from a spy movie.
You open the briefcase, the tape recorder immediately plays the message ("Your mission is..."), and then it instantly self-destructs. The information was processed, but there is zero trace left behind for anyone else to find.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// The outer parentheses () turn the function into an expression.
// The final () invokes it immediately!

(function() {
  var secretMessage = "Hello World";
  console.log(secretMessage);
})();

// Because the function finished, the variable is gone!
// console.log(secretMessage); // ReferenceError!
```

#### Fuller Example: The Module Pattern (Pre-ES6)
```javascript
// Before we had the 'export' keyword, IIFEs were used to simulate Modules!

const bankAccount = (function() {
  // PRIVATE VARIABLES (Hidden inside the IIFE closure)
  let balance = 1000;
  
  // PUBLIC METHODS (Returned as an object)
  return {
    deposit: function(amount) {
      balance += amount;
      console.log(`Deposited ${amount}. New balance: ${balance}`);
    },
    getBalance: function() {
      return balance;
    }
  };
})(); // Instantly invoked!

// We can use the public methods
bankAccount.deposit(500); 

// But we absolutely cannot touch the private variable!
console.log(bankAccount.balance); // undefined
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the leading semicolon

**The mistake:** Putting an IIFE directly after another line of code that doesn't have a semicolon.

**Why it's wrong:** If the previous line doesn't have a semicolon, the JavaScript compiler thinks the `(` of your IIFE is actually trying to call the previous line as a function! This causes bizarre `TypeError` crashes.

*Incorrect:*
```javascript
const x = 10
(function() {
  console.log("IIFE");
})()
// The engine reads this as: const x = 10(function() {...})()
// Error: 10 is not a function!
```

*Fix:*
```javascript
const x = 10; // MUST HAVE SEMICOLON
(function() { ... })();

// Or use the defensive semicolon trick used by many libraries:
;(function() { ... })();
```

---

### Mistake 2: Losing Context Binding (`this`) in Iife Callbacks

**The mistake:** Passing methods from Iife instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "iife",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "iife",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Iife Operations

**The mistake:** Executing asynchronous operations within Iife without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/iife"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/iife");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in iife: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Arrow IIFEs

**Problem:** Can you write an IIFE using the modern Arrow Function syntax? Write a simple one that logs "Arrow IIFE!".

**Expected output:**
> [!check]- Answer
> ```javascript
> (() => {
>   console.log("Arrow IIFE!");
> })();
> ```
> - Just replace `function()` with `() =>`.

---

### Exercise 2: Private Scope Isolation with IIFE

**Problem:** Use an IIFE `(function() { var privateVal = 42; })()` to isolate temporary variables.

**Expected output:**
> [!check]- Answer
> ```text
> ReferenceError caught
> ```
> ```javascript
> (function() {
>   var privateVal = 42;
> })();
> try {
>   console.log(privateVal);
> } catch (err) {
>   console.log("ReferenceError caught");
> }
> ```
>
> **Explanation:** IIFEs (Immediately Invoked Function Expressions) create private scope closures immediately.

---

### Exercise 3: IIFE Module Pattern

**Problem:** Return a public API `{ getCount() }` from an IIFE closing over private state.

**Expected output:**
> [!check]- Answer
> ```text
> 10
> ```
> ```javascript
> const CounterModule = (function() {
>   let count = 10;
>   return { getCount() { return count; } };
> })();
> console.log(CounterModule.getCount());
> ```
>
> **Explanation:** IIFEs form the foundation of classic JavaScript module patterns.


---

## 7. Related Terms
- [Scope](../level_03/scope.md) — What an IIFE creates to protect variables.
- [Modules (import/export)](../level_08/modules.md) — The modern ES6 feature that largely replaced the need for IIFEs.
- [Anonymous Function](../level_03/anonymous_function.md) — Related concept: Anonymous Function.

---

## 8. Key Takeaways
- An IIFE (Immediately Invoked Function Expression) is a function that runs the moment it is defined.
- It is created by wrapping a function in `()` and adding `()` at the end.
- It was historically used to keep variables out of the global scope.
- While less common today due to ES6 Modules and Block Scope (`let`/`const`), they are still widely used in older codebases and specific design patterns.
```
