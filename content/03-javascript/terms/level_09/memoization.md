# Memoization

> **Level 9 — Advanced Concepts & Patterns**
> An optimization technique that caches the results of expensive function calls to avoid recalculation.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The process being optimized.
- [Closure](../level_03/closure.md) — Used to keep the "cache" hidden and persistent.
- [Object](../level_02/object.md) / [Map](../level_08/map.md) — The structures typically used as the cache.

---

## 2. Term Category
- **Design Pattern / Optimization**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes, functions perform incredibly heavy calculations (like processing a large image, running complex math formulas, or searching through a million records). If a user clicks a button that runs an expensive function `calculate(50)`, the computer might freeze for 3 seconds. If the user accidentally clicks the button *again* with the exact same input of `50`, the computer freezes for *another* 3 seconds to do the exact same math it just did.

**Memoization** (from the Latin word *memorandum*, meaning "to be remembered") is a programming technique to solve this. It creates a secret "cache" (memory) attached to the function. When the function runs, it checks: "Have I seen this exact input before?" If yes, it instantly returns the saved answer from the cache (0 milliseconds). If no, it does the hard work, saves the answer to the cache for next time, and then returns it.

### (2) Reality Metaphor
Imagine a student taking a math test. They are asked: "What is 482 * 193?"
They spend 3 minutes doing long multiplication on scratch paper to find the answer: `93026`.
If the next question on the test is again "What is 482 * 193?", they don't do the math again! They just look at their scratch paper, see the answer they already found, and write it down instantly.

### (3) JavaScript Code Examples

#### Short Snippet: A basic memoized function
```javascript
// A higher-order function that adds a cache to ANY function you give it!
function memoize(fn) {
  const cache = {}; // The secret backpack (Closure)
  
  return function(arg) {
    // 1. Check if we already have the answer
    if (cache[arg]) {
      console.log("Fetching from cache...");
      return cache[arg];
    }
    
    // 2. We don't have it. Do the hard work!
    console.log("Calculating for the first time...");
    const result = fn(arg);
    
    // 3. Save it for next time
    cache[arg] = result;
    return result;
  };
}

// A fake "expensive" function
const square = (n) => n * n;

// We wrap it!
const fastSquare = memoize(square);

console.log(fastSquare(10)); // "Calculating for the first time..." -> 100
console.log(fastSquare(10)); // "Fetching from cache..." -> 100 (Instant!)
```

#### Fuller Example: Recursive Fibonacci
```javascript
// The standard recursive Fibonacci is notoriously slow. 
// fib(40) takes seconds. fib(50) might crash your browser.
function slowFib(n) {
  if (n <= 1) return n;
  return slowFib(n - 1) + slowFib(n - 2);
}

// By memoizing it, the time drops from several seconds down to 1 millisecond!
const fastFib = memoize(function(n) {
  if (n <= 1) return n;
  // Note: For full optimization, the internal calls must also call the memoized version!
  return fastFib(n - 1) + fastFib(n - 2); 
});

console.log(fastFib(50)); // Instantly returns 12586269025
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Memoization Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Memoization blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "memoization";
```

*Fix:*
```javascript
let value = "memoization";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Memoization Callbacks

**The mistake:** Passing methods from Memoization instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "memoization",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "memoization",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Memoization Operations

**The mistake:** Executing asynchronous operations within Memoization without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/memoization"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/memoization");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in memoization: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Multi-argument Memoization

**Problem:** The basic `memoize` function above only handles a single argument `arg`. How would you modify it to handle a function that takes multiple arguments, like `add(a, b)`?

**Expected output:**
```javascript
function memoize(fn) {
  const cache = {};
  // Use the Rest Parameter to gather all arguments!
  return function(...args) {
    // Stringify the arguments to use as a single cache key
    const key = JSON.stringify(args); 
    if (cache[key]) return cache[key];
    
    // Use Spread Syntax to pass them to the function
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
}
```

> [!check]- Answer
> - Object keys must be strings. You need to combine `a` and `b` into a single string key!

---

### Exercise 2: Implementing Memoize Cache Function

**Problem:** Write a generic `memoize(fn)` wrapper using a `Map` cache.

**Expected output:**
```text
Computed: 10
Cached: 10
```

> [!check]- Answer
> ```javascript
> function memoize(fn) {
>   const cache = new Map();
>   return function(...args) {
>     const key = JSON.stringify(args);
>     if (cache.has(key)) return cache.get(key);
>     const res = fn(...args);
>     cache.set(key, res);
>     return res;
>   };
> }
> const add = memoize((a, b) => a + b);
> console.log(`Computed: ${add(5, 5)}`);
> console.log(`Cached: ${add(5, 5)}`);
> ```
>
> **Explanation:** Memoization caches function computation results mapped to argument keys.

### Exercise 3: Cache Memory Size Management

**Problem:** Explain why unbounded memoization caches cause memory leaks in long-running applications.

**Expected output:**
```text
Unbounded caches retain memory indefinitely
```

> [!check]- Answer
> ```javascript
> console.log("Unbounded caches retain memory indefinitely");
> ```
>
> **Explanation:** Caching every unique input argument without eviction policies (e.g. LRU) causes memory growth.

---

---

## 7. Related Terms
- [Closure](../level_03/closure.md) — The mechanic that keeps the cache alive without making it a global variable.
- [Higher-Order Function](../level_03/higher_order_function.md) — `memoize()` takes a function and returns a new function.

---

## 8. Key Takeaways
- Memoization caches the output of expensive functions based on their input.
- It provides massive performance boosts by skipping redundant calculations.
- It should ONLY be used on **Pure Functions** (functions that always return the same output for the same input).
- Modern frameworks (like React's `useMemo`) use this concept heavily to prevent unnecessary UI rendering.
```
