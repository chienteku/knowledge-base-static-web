# IIFE

> **Level 9 — Advanced Concepts & Patterns**
> Immediately Invoked Function Expression; a function that runs as soon as it is defined.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The core structure.
- [Scope](../level_03/scope.md) — The problem IIFEs solve.

---

## 2. Term Category

**Design Pattern (Universal)**: IIFE is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Encapsulated Private Module via IIFE

**Scenario:** A legacy JavaScript module wraps state inside an Immediately Invoked Function Expression (IIFE) to create private scope variables and expose a public API.

**Requirements:**
1. Write IIFE returning counter module API.
2. Private variable #count.
3. Expose increment(), decrement(), getCount().

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const CounterModule = (function() {
>   let count = 0; // Private variable hidden inside IIFE closure
>
>   return {
>     increment() {
>       count++;
>       return count;
>     },
>     decrement() {
>       count--;
>       return count;
>     },
>     getCount() {
>       return count;
>     }
>   };
> })();
>
> // Verification tests
> console.assert(CounterModule.getCount() === 0, "Test 1 Failed");
> console.assert(CounterModule.increment() === 1, "Test 2 Failed");
> console.assert(CounterModule.increment() === 2, "Test 3 Failed");
> console.assert(typeof count === "undefined", "Test 4 Failed: Private variable must not pollute global scope");
> ```
>
> #### Technical Explanation
>
> 1. **IIFE Definition**: Immediately Invoked Function Expression: a function defined and executed immediately upon creation: (function() { ... })().
> 2. **Module Pattern Encapsulation**: Creates a private scope using function closures, exposing only returned public properties.
> 3. **Global Namespace Protection**: Prevents temporary variables from polluting global window or globalThis namespaces.
> 
---

### Exercise 2: Avoiding Loop Var Closure Scope Bugs via IIFE

**Scenario:** A widget renderer uses an IIFE inside a loop to capture distinct index scope copies when using var declarations.

**Requirements:**
1. Write createButtonHandlersVar(count).
2. Use var inside for loop.
3. Wrap callback creation in IIFE to capture current index value.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createButtonHandlersVar(count) {
>   const handlers = [];
>   for (var i = 0; i < count; i++) {
>     // IIFE creates a distinct scope per loop iteration
>     (function(capturedIndex) {
>       handlers.push(() => capturedIndex);
>     })(i);
>   }
>   return handlers;
> }
>
> // Verification tests
> const handlers = createButtonHandlersVar(3);
> console.assert(handlers[0]() === 0, "Test 1 Failed");
> console.assert(handlers[1]() === 1, "Test 2 Failed");
> console.assert(handlers[2]() === 2, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Scope Capture via IIFE**: Passing loop variables as IIFE parameters creates isolated scope bindings for each iteration.
> 2. **Historical ES5 Significance**: Standard ES5 solution for fixing var function-scoping closure bugs before block-scoped `let` existed.
> 3. **Parameter Shadowing**: The parameter capturedIndex shadows outer variables within the IIFE execution context.
> 
---

### Exercise 3: Self-Executing Initialization Singleton

**Scenario:** A web application configuration loader runs an IIFE to detect the active runtime environment (Node.js vs Browser) and set up global defaults.

**Requirements:**
1. Write IIFE detecting environment.
2. Return configuration object with env type ("BROWSER" vs "NODE").

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const AppConfig = (function(globalScope) {
>   const isBrowser = typeof globalScope.window !== "undefined";
>   const isNode = typeof globalScope.process !== "undefined";
>
>   return Object.freeze({
>     environment: isBrowser ? "BROWSER" : (isNode ? "NODE" : "UNKNOWN"),
>     version: "1.0.0"
>   });
> })(typeof globalThis !== "undefined" ? globalThis : this);
>
> // Verification tests
> console.assert(AppConfig.version === "1.0.0", "Test 1 Failed");
> console.assert(["BROWSER", "NODE", "UNKNOWN"].includes(AppConfig.environment), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Environment Auto-Detection**: IIFEs run immediately during script parse time, ideal for environment detection.
> 2. **Dependency Injection via IIFE Arguments**: Passing globalThis into IIFE parameters allows explicit dependency injection.
> 3. **Immutable Configuration Output**: Combining IIFE return values with Object.freeze() yields tamper-proof singleton configurations.
---

## 6. Related Terms
- [Scope](../level_03/scope.md) — What an IIFE creates to protect variables.
- [Modules (import/export)](../level_08/modules.md) — The modern ES6 feature that largely replaced the need for IIFEs.
- [Anonymous Function](../level_03/anonymous_function.md) — Related concept: Anonymous Function.

---

## 7. Key Takeaways
- An IIFE (Immediately Invoked Function Expression) is a function that runs the moment it is defined.
- It is created by wrapping a function in `()` and adding `()` at the end.
- It was historically used to keep variables out of the global scope.
- While less common today due to ES6 Modules and Block Scope (`let`/`const`), they are still widely used in older codebases and specific design patterns.
```
