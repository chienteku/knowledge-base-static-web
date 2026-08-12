# Higher-Order Function

> **Level 3 — Functions & Scope**
> A function that takes one or more functions as arguments, or returns a function.

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code.
- [Arguments](arguments.md) — Values passed to a function.

---

## 2. Term Category

**Functional Programming (Universal: Works everywhere)**: Higher-Order Function is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Custom Higher-Order Map/Filter Implementation

**Scenario:** A functional utility package implements custom higher-order functions (HOFs) that take processing callback functions as parameters.

**Requirements:**
1. Write customMap(array, transformFn).
2. Write customFilter(array, predicateFn).
3. Execute callback for each array item.
4. Return transformed/filtered array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function customMap(array, transformFn) {
>   const result = [];
>   for (let i = 0; i < array.length; i++) {
>     result.push(transformFn(array[i], i, array));
>   }
>   return result;
> }
>
> function customFilter(array, predicateFn) {
>   const result = [];
>   for (let i = 0; i < array.length; i++) {
>     if (predicateFn(array[i], i, array)) {
>       result.push(array[i]);
>     }
>   }
>   return result;
> }
>
> // Verification tests
> const nums = [1, 2, 3, 4];
> const doubled = customMap(nums, x => x * 2);
> const evens = customFilter(nums, x => x % 2 === 0);
> console.assert(doubled.join(",") === "2,4,6,8", "Test 1 Failed");
> console.assert(evens.join(",") === "2,4", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Higher-Order Function Definition**: A Higher-Order Function (HOF) is a function that accepts one or more functions as arguments, returns a function, or both.
> 2. **Abstraction over Actions**: HOFs abstract execution iteration and action details using callback parameters.
> 3. **First-Class Integration**: HOFs rely on JavaScript functions being first-class objects.
> 
---

### Exercise 2: Performance Profiler & Logger Decorator HOF

**Scenario:** An APM monitoring library implements a higher-order decorator function that wraps target functions with timing logging.

**Requirements:**
1. Write withProfiling(targetFn, logFn).
2. Return wrapped function.
3. Measure execution time and invoke logFn.
4. Return targetFn result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function withProfiling(targetFn, logFn) {
>   return function(...args) {
>     const start = Date.now();
>     const result = targetFn(...args);
>     const duration = Date.now() - start;
>     logFn(duration);
>     return result;
>   };
> }
>
> // Verification tests
> let loggedDuration = -1;
> const mockLog = (dur) => { loggedDuration = dur; };
> const heavyMath = (a, b) => a + b;
>
> const profiledMath = withProfiling(heavyMath, mockLog);
> const sum = profiledMath(10, 20);
>
> console.assert(sum === 30, "Test 1 Failed");
> console.assert(loggedDuration >= 0, "Test 2 Failed: Profiler log not invoked");
> ```
>
> #### Technical Explanation
>
> 1. **Decorator Pattern**: HOFs can accept functions and return enhanced wrapped function instances.
> 2. **Transparent Delegation**: Wrapped functions accept rest parameters (...args) and return original target results.
> 3. **Aspect-Oriented Programming**: Allows injecting cross-cutting concerns (logging, timing, auth) cleanly.
> 
---

### Exercise 3: Function Composition & Pipeline Factory HOF

**Scenario:** A data processing library provides a compose() HOF that combines multiple single-argument functions into a unified pipeline function.

**Requirements:**
1. Write compose(...fns).
2. Return inner function accepting initial value.
3. Execute functions right-to-left.
4. Return final result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function compose(...fns) {
>   return function(initialValue) {
>     return fns.reduceRight((acc, fn) => fn(acc), initialValue);
>   };
> }
>
> // Verification tests
> const addTwo = x => x + 2;
> const multiplyThree = x => x * 3;
>
> const compute = compose(multiplyThree, addTwo);
> console.assert(compute(5) === 21, "Test 1 Failed: Composition failed");
> ```
>
> #### Technical Explanation
>
> 1. **Function Composition**: Combining multiple HOF functions creates declarative data processing pipelines.
> 2. **Right-to-Left Evaluation**: Mathematical composition evaluates rightmost function first, then leftwards.
> 3. **Functional Reusability**: Composed pipelines build complex functionality from small pure functions.
---

## 6. Related Terms
- [Callback Function](callback_function.md) — The function that gets passed *into* the Higher-Order Function.
- [Closure](closure.md) — Often used when a HOF returns a new function.
- [First-Class Function](first_class_function.md) — Related concept: First-Class Function.
- [Recursion](recursion.md) — Related concept: Recursion.
- [Event Listener](../level_05/event_listener.md) — Related concept: Event Listener.
- [Memoization](../level_09/memoization.md) — Related concept: Memoization.

---

## 7. Key Takeaways
- A function is a Higher-Order Function if it meets at least one of two criteria: (1) It accepts a function as an argument. (2) It returns a function.
- They allow developers to abstract over *actions*, not just values.
- Built-in array methods like `.map()`, `.filter()`, and `.reduce()` are the most common Higher-Order Functions in JavaScript.
