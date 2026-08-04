# Memoization (the concept)

> **Level 4 — Advanced Hooks**
> Caching a computed result keyed on dependency inputs to skip redundant calculations.

---

## 1. Prerequisites
- [`useMemo` Hook](../level_04/use_memo.md) — The primary hook implementing this concept for values.
- [`useCallback` Hook](../level_04/use_callback.md) — The hook implementing this concept for function references.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In computer science, **Memoization** is an optimization technique used to speed up programs by caching the results of expensive function calls and returning the cached result when the same inputs occur again.

Because React functional components execute their entire function body on every render, any calculation written inside them is re-evaluated from scratch. If your component performs a heavy operation (such as sorting a large list of 5,000 objects, filtering data, or performing complex date calculations), running it repeatedly on unrelated state updates wastes CPU cycles and can cause frames to drop.

To resolve this, React implements memoization across three distinct APIs:
1.  **`useMemo`:** Caches the *return value* of a calculation function.
2.  **`useCallback`:** Caches the *function definition (reference)* itself to preserve identity across renders.
3.  **`React.memo`:** Caches the rendered *JSX output* of a component, skipping rendering entirely if incoming props have not changed.

#### The Tradeoff: Memoization is not free
Memoization requires CPU cycles to store caches in memory, allocate storage keys, and run comparison checks on dependency arrays on every single render. If a calculation is simple (like basic string concatenation or adding numbers), the overhead of checking dependencies and managing caches is more expensive than running the calculation itself.

---

### (2) Reality Metaphor
Imagine a student solving math problems.
- **Without Memoization (Re-work):** The teacher asks: *"What is 342 multiplied by 45?"* The student writes the math on paper, calculates the answer (15,390), and says it aloud. One minute later, the teacher asks the exact same question. The student pulls out a new sheet of paper, works out the long multiplication again, and answers 15,390. They waste time and paper (**CPU cycles and memory**).
- **With Memoization (Reference Card):** The first time the teacher asks the question, the student solves it and writes it on a flashcard: `342 * 45 = 15,390` (**caching the value**). The next time the teacher asks the same question, the student checks their cards, finds the matching card, and instantly reads the answer without recalculating. If the teacher asks a new question, the student calculates the answer and creates a new card (**re-calculating on dependency change**).

---

### (3) JavaScript Conceptual Implementation

To understand how React's caching works under the hood, here is a pure JavaScript implementation of a memoization utility function:

```javascript
// A simple memoization wrapper function
function memoize(fn) {
  const cache = new Map(); // Store calculation results

  return function (...args) {
    const key = JSON.stringify(args); // Create a cache key from inputs
    
    if (cache.has(key)) {
      console.log('Cache hit! Returning cached result.');
      return cache.get(key); // Return cached output
    }
    
    // Cache miss: execute the calculation and cache the result
    console.log('Cache miss. Executing calculation...');
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// 1. Define an expensive calculation
const expensiveMultiply = (a, b) => {
  let result = 0;
  for (let i = 0; i < 1_000_000; i++) { result += (a * b) / 1000000; }
  return Math.round(result);
};

// 2. Wrap it with our memoize cache utility
const memoizedCalculation = memoize(expensiveMultiply);

console.log(memoizedCalculation(10, 20)); // Output: Cache miss. Executing... 200
console.log(memoizedCalculation(10, 20)); // Output: Cache hit! Returning... 200
console.log(memoizedCalculation(5, 5));   // Output: Cache miss. Executing... 25
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Memoizing cheap, fast calculations

**The mistake:** Wrapping simple arithmetic operations or basic object mappings inside `useMemo` out of precaution:

```javascript
// BAD: Memoization overhead is more expensive than the calculation!
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);
```

**Why it's wrong:** Comparing `firstName` and `lastName` inside the dependency array on every render takes more CPU work than concatenating two strings.

*Fix:* Do not memoize simple operations. Write them as standard inline variables. Only use `useMemo` when:
1.  The calculation is slow (e.g. loops, filtering, sorting, matrix transformations).
2.  You need to preserve referential equality of an object or array to prevent child components from re-rendering.

---



### Mistake 2: Prematurely Wrapping Every Single Function and Component in `useCallback` / `React.memo`

**The mistake:** Wrapping tiny 2-line components and basic event handlers in `React.memo` and `useCallback` indiscriminately.

**Why it's wrong:** Memoization adds memory overhead (storing previous props, dependency comparison overhead). If props change on every render anyway, memoization makes performance WORSE. Benchmark before memoizing.

*Incorrect:*
```javascript
// Wrapping every simple component in React.memo prematurely
```

*Fix:*
```javascript
Apply memoization to heavy calculations or components rendering large DOM subtrees
```

### Mistake 3: Memoizing Components Without Memoizing Object/Function Props (Bypassing Memoization)

**The mistake:** Wrapping `<Child />` in `React.memo` but passing `<Child onClick={() => doSomething()} />`.

**Why it's wrong:** Inline function `() => doSomething()` creates a NEW reference on every render! `React.memo` detects changed prop references and re-renders the child anyway. Memoize callback props with `useCallback`.

*Incorrect:*
```javascript
const MemoChild = React.memo(Child);
// In parent:
<MemoChild onClick={() => alert('hi')} /> // ❌ Re-renders every time!
```

*Fix:*
```javascript
const handleClick = useCallback(() => alert('hi'), []);
<MemoChild onClick={handleClick} />
```

## 6. Practice Exercises

### Exercise 1: Evaluating Memoization Candidates

**Problem:** Review the three scenarios below and determine if they are good candidates for memoization (`useMemo`):

1.  Capitalizing an input string for display: `const text = name.toUpperCase()`.
    *   **Answer:** **No**. String capitalization is extremely fast; memoization adds unnecessary overhead.
2.  Searching and filtering a list of 10,000 products based on user search queries:
    *   **Answer:** **Yes**. Loop-filtering thousands of items on every render can cause UI stuttering and is a prime candidate for `useMemo`.
3.  Generating a constant theme object configuration passed to a Context Provider:
    *   **Answer:** **Yes**. While the object is small, memoizing it preserves **Referential Equality**, preventing child components subscribed to Context from re-rendering on unrelated updates.

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: 3 Core Memoization APIs in React

**Problem:** List 3 core memoization tools in React (1. `React.memo`: Component memoization; 2. `useMemo`: Value calculation memoization; 3. `useCallback`: Function reference memoization).

**Expected output:**
> [!check]- Answer
> ```text
> 1. React.memo (component), 2. useMemo (value), 3. useCallback (function)
> ```
> ```text
> 1. React.memo (component), 2. useMemo (value), 3. useCallback (function)
> ```
>
> **Explanation:** React memoization APIs cache components, computed values, and callback references.

---

### Exercise 3: React Compiler (React 19) Auto-Memoization

**Problem:** What is the primary role of the React Compiler in React 19? (Automatically memoizes values, functions, and components at compile-time without manual `useMemo`/`useCallback`).

**Expected output:**
> [!check]- Answer
> ```text
> Automatically memoizes values, functions, and components at compile-time without manual hooks
> ```
> ```text
> Automatically memoizes values, functions, and components at compile-time without manual hooks
> ```
>
> **Explanation:** React Compiler eliminates manual memoization boilerplate.

## 7. Related Terms
- [`useMemo` Hook](../level_04/use_memo.md) — The hook implementation of value memoization.
- [`useCallback` Hook](../level_04/use_callback.md) — The hook implementation of function reference memoization.
- [React.memo](../level_08/react_memo.md) — Component render caching.

---

## 8. Key Takeaways
- Memoization is an optimization technique that caches results to avoid recalculation.
- React uses memoization via `useMemo`, `useCallback`, and `React.memo`.
- Checking dependencies and managing caches has its own CPU and memory overhead.
- Do not memoize cheap operations; the overhead can exceed the performance benefits.
- Use memoization for heavy calculations or to preserve referential equality.
