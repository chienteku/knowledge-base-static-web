# Memoization

> **Level 9 — Advanced Concepts & Patterns**
> An optimization technique that caches the results of expensive function calls to avoid recalculation.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The process being optimized.
- [Closure](../level_03/closure.md) — Used to keep the "cache" hidden and persistent.
- [Object](../level_02/object.md) — 

---

## 2. Term Category

**Design Pattern / Optimization (Universal)**: Memoization is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Generic Multi-Argument Cache Memoizer

**Scenario:** A heavy math engine provides a generic `memoize(fn, resolver)` utility that caches function results based on argument signature keys.

**Requirements:**
1. Write memoize(fn, resolver).
2. Maintain internal Map cache.
3. Construct cache key from resolver or arguments.
4. Return cached or freshly computed result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function memoize(fn, resolver) {
>   const cache = new Map();
>
>   return function(...args) {
>     const key = typeof resolver === "function" 
>       ? resolver.apply(this, args) 
>       : JSON.stringify(args);
>
>     if (cache.has(key)) {
>       return cache.get(key);
>     }
>
>     const result = fn.apply(this, args);
>     cache.set(key, result);
>     return result;
>   };
> }
>
> // Verification tests
> let computations = 0;
> const slowSquare = memoize((n) => {
>   computations++;
>   return n * n;
> });
>
> console.assert(slowSquare(4) === 16, "Test 1 Failed");
> console.assert(slowSquare(4) === 16, "Test 2 Failed");
> console.assert(computations === 1, "Test 3 Failed: Second call must use memoized cache");
> ```
>
> #### Technical Explanation
>
> 1. **Memoization Concept**: An optimization technique that speeds up function execution by caching computed results for specific inputs.
> 2. **Cache Key Serializer**: Serializing arguments (e.g. via JSON.stringify or custom resolver) generates unique keys for multi-argument functions.
> 3. **Space vs Time Trade-off**: Trades memory storage space (Map cache) to save CPU execution time on expensive computations.
> 
---

### Exercise 2: Recursive Fibonacci Memoization Optimizer

**Scenario:** An algorithm suite speeds up exponential-time recursive Fibonacci calculations ($O(2^n)$) to linear time ($O(n)$) using memoization.

**Requirements:**
1. Write memoizedFibonacci().
2. Use closure Map cache.
3. Recursively calculate fib(n) using cached values.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createFibonacci() {
>   const cache = new Map([[0, 0], [1, 1]]);
>
>   function fib(n) {
>     if (cache.has(n)) {
>       return cache.get(n);
>     }
>     const result = fib(n - 1) + fib(n - 2);
>     cache.set(n, result);
>     return result;
>   }
>
>   return fib;
> }
>
> // Verification tests
> const fib = createFibonacci();
>
> console.assert(fib(10) === 55, "Test 1 Failed");
> console.assert(fib(50) === 12586269025, "Test 2 Failed: Fast computation of fib(50)");
> ```
>
> #### Technical Explanation
>
> 1. **Dynamic Programming via Memoization**: Transforms overlapping subproblems in recursive algorithms from exponential to linear complexity.
> 2. **Top-Down Computation**: Computes subproblems on demand and stores results in cache for subsequent recursive branches.
> 3. **Stack Overflow Prevention for Moderate N**: Reduces recursive call depth by reusing previously cached values instantly.
> 
---

### Exercise 3: LRU-Bounded Memoization Cache Registry

**Scenario:** A graphics rendering engine limits memoization cache size using a Least Recently Used (LRU) eviction strategy to prevent unbounded memory growth.

**Requirements:**
1. Write memoizeLRU(fn, capacity = 3).
2. Use Map insertion order behavior.
3. Evict oldest key when cache size exceeds capacity.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function memoizeLRU(fn, capacity = 3) {
>   const cache = new Map();
>
>   return function(...args) {
>     const key = JSON.stringify(args);
>
>     if (cache.has(key)) {
>       const val = cache.get(key);
>       cache.delete(key);
>       cache.set(key, val); // Re-insert to mark as recently used
>       return val;
>     }
>
>     const result = fn.apply(this, args);
>     cache.set(key, result);
>
>     if (cache.size > capacity) {
>       const firstKey = cache.keys().next().value;
>       cache.delete(firstKey); // Evict least recently used entry
>     }
>
>     return result;
>   };
> }
>
> // Verification tests
> let runs = 0;
> const calc = memoizeLRU(x => { runs++; return x * 2; }, 2);
>
> calc(1); // cache: [1]
> calc(2); // cache: [1, 2]
> calc(1); // cache: [2, 1] (re-ordered)
> calc(3); // cache: [1, 3] (2 evicted)
>
> console.assert(runs === 3, "Test 1 Failed");
> calc(2); // Must re-compute because 2 was evicted
> console.assert(runs === 4, "Test 2 Failed: Evicted key must be recomputed");
> ```
>
> #### Technical Explanation
>
> 1. **Map Keys Insertion Order**: JavaScript Map maintains key insertion order; Map.keys().next().value yields the oldest inserted key.
> 2. **LRU Eviction Strategy**: Re-inserting accessed keys keeps active entries fresh and evicts least recently used items when capacity is exceeded.
> 3. **Bounded Memory Footprint**: Prevents memory leak vulnerabilities caused by unbounded memoization caches in long-running applications.
---

## 6. Related Terms
- [Closure](../level_03/closure.md) — The mechanic that keeps the cache alive without making it a global variable.
- [Higher-Order Function](../level_03/higher_order_function.md) — `memoize()` takes a function and returns a new function.

---

## 7. Key Takeaways
- Memoization caches the output of expensive functions based on their input.
- It provides massive performance boosts by skipping redundant calculations.
- It should ONLY be used on **Pure Functions** (functions that always return the same output for the same input).
- Modern frameworks (like React's `useMemo`) use this concept heavily to prevent unnecessary UI rendering.
```
