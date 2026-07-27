# Higher-Order Function

> **Level 3 — Functions & Scope**
> A function that takes one or more functions as arguments, or returns a function.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — A reusable block of code.
- [Arguments](../level_03/arguments.md) — Values passed to a function.

---

## 2. Term Category
- **Functional Programming**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In many older programming languages, functions are rigid blocks of code. You can pass numbers or strings into them, but you can't pass *behaviors* into them.

JavaScript treats functions as "first-class citizens", meaning they are just objects that can be passed around like any other data type. A "Higher-Order Function" (HOF) is simply a function that takes advantage of this feature. By allowing developers to pass a function *into* a function, or return a function *from* a function, developers can create highly abstract, flexible, and composable code. This is the cornerstone of Functional Programming in JavaScript.

### (2) Reality Metaphor
Imagine a generic "Assembly Line" machine (the Higher-Order Function). By itself, it just moves items down a conveyor belt. But it has a slot where you can plug in different robot arms (the Callback Functions). 
- Plug in the "Painter" arm, and the machine paints cars. 
- Plug in the "Welder" arm, and the machine welds metal. 
The machine itself doesn't know *how* to paint or weld; it delegates that specific behavior to the function you pass into it.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// This is a Higher-Order Function because it accepts a function as an argument
function doTwice(actionFunction) {
  actionFunction(); // Call it once
  actionFunction(); // Call it twice
}

function sayHi() {
  console.log("Hi!");
}

// We pass the sayHi function IN as data (no parentheses!)
doTwice(sayHi); 
// Output: "Hi!" "Hi!"
```

#### Fuller Example
```javascript
// A Higher-Order Function that RETURNS a function
function createMultiplier(multiplier) {
  // It returns a brand new function!
  return function(num) {
    return num * multiplier;
  };
}

// 'double' is now a function that multiplies by 2
const double = createMultiplier(2);
// 'triple' is a function that multiplies by 3
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Invoking the function when passing it

**The mistake:** Adding parentheses `()` to the function name when trying to pass it as an argument into a Higher-Order Function.

**Why it's wrong:** If you add `()`, the engine immediately executes the function on that line, and passes the *return value* (often `undefined`) into the Higher-Order Function, instead of passing the function itself.

*Incorrect:*
```javascript
function runLater(func) {
  // Tries to execute 'undefined' and crashes!
  setTimeout(func, 1000); 
}

function explode() { console.log("Boom!"); }

// Executes instantly, does NOT wait 1 second!
runLater(explode()); 
```

*Fix:*
```javascript
// Pass the NAME of the function, no parentheses!
runLater(explode); 
```

---

### Mistake 2: Losing Context Binding (`this`) in Higher Order Function Callbacks

**The mistake:** Passing methods from Higher Order Function instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "higher_order_function",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "higher_order_function",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Higher Order Function Operations

**The mistake:** Executing asynchronous operations within Higher Order Function without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/higher_order_function"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/higher_order_function");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in higher_order_function: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Build a Logger HOF

**Problem:** Write a HOF called `withLogging` that takes a function `fn` as an argument. It should return a *new* function that logs `"Executing..."` to the console, and then calls `fn()`.

**Expected output:**
```text
const loggedSayHi = withLogging(sayHi);
loggedSayHi(); // Logs: "Executing..." then "Hi!"
```

> [!check]- Answer
> - `function withLogging(fn) { return function() { console.log("Executing..."); fn(); } }`

---

### Exercise 2: Custom Array Filter Higher-Order Function

**Problem:** Write a custom HOF `myFilter(arr, predicate)` duplicating `Array.prototype.filter` logic.

**Expected output:**
```text
[ 2, 4 ]
```

> [!check]- Answer
> ```javascript
> function myFilter(arr, predicate) {
>   const result = [];
>   for (let item of arr) {
>     if (predicate(item)) result.push(item);
>   }
>   return result;
> }
> console.log(myFilter([1, 2, 3, 4], x => x % 2 === 0));
> ```
>
> **Explanation:** Higher-order functions accept functions as arguments to customize execution behavior.

### Exercise 3: Function Composition HOF

**Problem:** Write `compose(f, g)` that returns a new function executing `f(g(x))`.

**Expected output:**
```text
21
```

> [!check]- Answer
> ```javascript
> const add1 = x => x + 1;
> const double = x => x * 2;
> const compose = (f, g) => (x) => f(g(x));
> const addThenDouble = compose(double, add1);
> console.log(addThenDouble(10)); // double(add1(10)) = double(11) = 21
> ```
>
> **Explanation:** Higher-order functions combine smaller functions into composite data pipelines.

---

---

## 7. Related Terms
- [Callback Function](../level_03/callback_function.md) — The function that gets passed *into* the Higher-Order Function.
- [Closure](../level_03/closure.md) — Often used when a HOF returns a new function.

---

## 8. Key Takeaways
- A function is a Higher-Order Function if it meets at least one of two criteria: (1) It accepts a function as an argument. (2) It returns a function.
- They allow developers to abstract over *actions*, not just values.
- Built-in array methods like `.map()`, `.filter()`, and `.reduce()` are the most common Higher-Order Functions in JavaScript.
