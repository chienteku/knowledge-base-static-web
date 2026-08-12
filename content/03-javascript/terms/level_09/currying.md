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

**Design Pattern / Functional Programming (Universal)**: Currying is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Universal Function Currying Utility

**Scenario:** A functional programming library provides a generic `curry(fn)` utility that transforms multi-parameter functions into unary curried function chains.

**Requirements:**
1. Write curry(fn).
2. Inspect fn.length for arity.
3. Return curried function accumulating arguments until arity is met.
4. Support partial parameter invocation.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function curry(fn) {
>   return function curried(...args) {
>     if (args.length >= fn.length) {
>       return fn.apply(this, args);
>     }
>     return function(...nextArgs) {
>       return curried.apply(this, args.concat(nextArgs));
>     };
>   };
> }
>
> // Verification tests
> const sum3 = (a, b, c) => a + b + c;
> const curriedSum = curry(sum3);
>
> console.assert(curriedSum(1)(2)(3) === 6, "Test 1 Failed");
> console.assert(curriedSum(1, 2)(3) === 6, "Test 2 Failed");
> console.assert(curriedSum(1)(2, 3) === 6, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Currying Definition**: Currying translates a function with N arguments into N nested functions taking 1 argument each.
> 2. **Arity Inspection via fn.length**: Function.length reports the expected number of formal parameters defined in function signatures.
> 3. **Closure Argument Accumulation**: Nested closures retain previously supplied arguments until sufficient parameters exist to execute original function.
> 
---

### Exercise 2: Discount & Tax Price Calculator Pipeline

**Scenario:** An enterprise checkout system uses currying to create specialized tax and discount calculation functions for different store locations.

**Requirements:**
1. Write calculatePrice(taxRate)(discount)(basePrice).
2. Apply discount to basePrice.
3. Apply taxRate to discounted price.
4. Return total price rounded to 2 decimals.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const calculatePrice = (taxRate) => (discount) => (basePrice) => {
>   const discounted = basePrice * (1 - discount);
>   const total = discounted * (1 + taxRate);
>   return Number(total.toFixed(2));
> };
>
> // Verification tests
> const nyPriceCalc = calculatePrice(0.08); // 8% NY tax
> const nyBlackFriday = nyPriceCalc(0.20);   // 20% discount
>
> console.assert(nyBlackFriday(100) === 86.40, "Test 1 Failed: $100 -> $80 + 8% tax = $86.40");
> console.assert(calculatePrice(0.05)(0.10)(50) === 47.25, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Specialized Function Creation**: Currying allows fixing higher-order configuration parameters (e.g., tax rate) to produce reusable domain utilities.
> 2. **Functional Reusability**: nyBlackFriday can be passed directly into array mapping functions without passing configuration options again.
> 3. **Concise Arrow Syntax**: ES6 arrow functions provide syntax for nested curried function signatures: a => b => c => result.
> 
---

### Exercise 3: Structured Logger Context Partial Currier

**Scenario:** A logging framework uses curried functions to attach application layer names and log severity levels to log messages.

**Requirements:**
1. Write log(severity)(component)(message).
2. Return formatted string `[SEVERITY] [Component]: Message`.
3. Create specialized logger for "AUTH" component.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const log = (severity) => (component) => (message) => {
>   return `[${severity.toUpperCase()}] [${component}]: ${message}`;
> };
>
> // Verification tests
> const errorLog = log("error");
> const authErrorLog = errorLog("AUTH");
>
> console.assert(authErrorLog("Invalid credentials") === "[ERROR] [AUTH]: Invalid credentials", "Test 1 Failed");
> console.assert(log("info")("DB")("Connected") === "[INFO] [DB]: Connected", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Layered Context Composition**: Currying separates generic log levels, component scopes, and specific message strings into distinct invocations.
> 2. **Partial Application Alignment**: Curried functions act as natural partial application pipelines when invoked step-by-step.
> 3. **Zero Side-Effect Pure Functions**: Pure curried loggers return structured strings without mutating external global context.
---

## 6. Related Terms
- [Closure](../level_03/closure.md) — The mechanic powering currying.
- [Arrow Function](../level_03/arrow_function.md) — The cleanest syntax for writing curried functions.
- [Functional Programming & Composition](functional_programming.md) — Related concept: Functional Programming & Composition.
- [Partial Application](partial_application.md) — Related concept: Partial Application.

---

## 7. Key Takeaways
- Currying transforms a function of `n` arguments into `n` functions of 1 argument.
- It is heavily used in Functional Programming to create reusable, "preset" functions.
- You invoke them using chained parentheses: `func(a)(b)(c)`.
- It relies entirely on JavaScript Closures to remember the previously passed arguments.
```
