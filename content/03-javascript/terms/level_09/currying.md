# Currying

> **Level 9 — Advanced Concepts & Patterns**
> Transforming a function that takes multiple arguments into a sequence of nested functions taking one argument each.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The structure being transformed.
- [Closure](../level_03/closure.md) — The fundamental mechanic that makes Currying possible.
- [First-Class Function](../level_03/first_class_function.md) — Returning functions from functions.
---

## 2. Term Category
- **Design Pattern / Functional Programming**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Functional Programming, developers often want to create highly reusable "utility" functions. 
Imagine a `multiply(a, b)` function. If you frequently need to multiply numbers by 10, you might get tired of constantly writing `multiply(10, 5)`, `multiply(10, 8)`, `multiply(10, 12)`.

**Currying** (named after mathematician Haskell Curry) solves this by taking a function with multiple arguments, and splitting it up so that it takes only *one* argument at a time. It returns a new function that waits for the next argument. 
This allows you to "partially apply" the first argument, essentially creating a custom "preset" function that you can use over and over again!

### (2) Reality Metaphor
Normal function: Ordering a custom pizza. You must tell the chef the crust, the sauce, and the topping all at exactly the same time: `order("Thin", "Tomato", "Pepperoni")`.
Curried function: Ordering at a Subway assembly line. You give the first worker the bread type. They hand the sandwich to the second worker. You give the second worker the sauce. They hand it to the third. `order("Thin")("Tomato")("Pepperoni")`.
The benefit? The Subway shop can pre-make 100 "Thin/Tomato" sandwiches, and keep them in the fridge ready for whenever a customer walks in to just add the final topping.

### (3) JavaScript Code Examples

#### Short Snippet: The Transformation
```javascript
// A Standard Function (Requires both arguments at once)
function standardMultiply(a, b) {
  return a * b;
}
console.log(standardMultiply(10, 5)); // 50

// A Curried Function (Takes one argument, returns a new function!)
function curriedMultiply(a) {
  return function(b) {
    return a * b;
  };
}
// You call them back-to-back!
console.log(curriedMultiply(10)(5)); // 50
```

#### Fuller Example: Creating Presets (Partial Application)
```javascript
// Using modern Arrow Functions makes currying look incredibly clean!
const buildUrl = (protocol) => (domain) => (path) => `${protocol}://${domain}/${path}`;

// 1. We provide the first argument. It returns a function waiting for the domain!
const withHttps = buildUrl("https");

// 2. We provide the domain. It returns a function waiting for the path!
const myWebsite = withHttps("mycoolsite.com");

// 3. We can now use our customized "preset" function over and over!
console.log(myWebsite("about"));   // "https://mycoolsite.com/about"
console.log(myWebsite("contact")); // "https://mycoolsite.com/contact"
console.log(myWebsite("store"));   // "https://mycoolsite.com/store"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Currying Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Currying blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "currying";
```

*Fix:*
```javascript
let value = "currying";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Currying Callbacks

**The mistake:** Passing methods from Currying instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "currying",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "currying",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Currying Operations

**The mistake:** Executing asynchronous operations within Currying without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/currying"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/currying");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in currying: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Magic of Closure

**Problem:** In the `curriedMultiply` example above, when the inner function `function(b)` finally runs, how does it still remember what `a` was?

**Expected output:**
> [!check]- Answer
> ```text
> Through Closure! 
> Even though the outer function finished executing, the inner function maintains a "backpack" of memory containing the variables (like `a`) from its parent's scope.
> ```
> - Currying relies 100% on this memory mechanic.

---

### Exercise 2: Writing a 3-Level Curried Add Function

**Problem:** Write a curried function `curriedAdd(a)(b)(c)` returning the sum.

**Expected output:**
> [!check]- Answer
> ```text
> 6
> ```
> ```javascript
> const curriedAdd = a => b => c => a + b + c;
> console.log(curriedAdd(1)(2)(3));
> ```
>
> **Explanation:** Currying transforms multi-argument functions into unary function chains.

---

### Exercise 3: Auto-Currying Utility Function

**Problem:** Write a generic `curry(fn)` wrapper that auto-curries any $N$-arity function.

**Expected output:**
> [!check]- Answer
> ```text
> 10
> ```
> ```javascript
> function curry(fn) {
>   return function curried(...args) {
>     if (args.length >= fn.length) return fn(...args);
>     return (...nextArgs) => curried(...args, ...nextArgs);
>   };
> }
> const mult = (a, b) => a * b;
> const curriedMult = curry(mult);
> console.log(curriedMult(2)(5));
> ```
>
> **Explanation:** Auto-currying checks argument length against `fn.length` arity.


---

## 7. Related Terms
- [Closure](../level_03/closure.md) — The mechanic powering currying.
- [Arrow Function](../level_03/arrow_function.md) — The cleanest syntax for writing curried functions.
- [Functional Programming & Composition](functional_programming.md) — Related concept: Functional Programming & Composition.
- [Partial Application](partial_application.md) — Related concept: Partial Application.
---

## 8. Key Takeaways
- Currying transforms a function of `n` arguments into `n` functions of 1 argument.
- It is heavily used in Functional Programming to create reusable, "preset" functions.
- You invoke them using chained parentheses: `func(a)(b)(c)`.
- It relies entirely on JavaScript Closures to remember the previously passed arguments.
```
