# `useCallback` Hook

> **Level 4 — Advanced Hooks**
> A performance optimization hook that "memorizes" a function definition so that its memory address does not change during a Re-render.

---

## 1. Prerequisites
- [`useMemo` Hook](use_memo.md) — `useCallback` is basically identical, but exclusively for Functions.
- [React.memo](../level_08/react_memo.md) — The primary reason `useCallback` exists.

---

## 2. Term Category
- **React Hook / Performance Optimization**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, functions are objects. If you define a function inside a component, React creates a brand new function in a brand new memory address every single time the component Re-renders.
```javascript
function Parent() {
  const [count, setCount] = useState(0);

  // A brand new memory address is created for this function on EVERY render!
  const handleSubmit = () => { console.log("Submitting") };

  // If we pass this function to a child...
  return <ExpensiveChild onSubmit={handleSubmit} />;
}
```
If `<ExpensiveChild>` is wrapped in `React.memo` (meaning it only re-renders if its props change), the optimization is DESTROYED! The child sees that the `onSubmit` prop has a new memory address, assumes the prop changed, and forces a re-render anyway.

### (2) How it works
You wrap your function in **`useCallback`**. React will cache the function. On the next re-render, instead of creating a new function, React hands back the exact same function from the exact same memory address.
```javascript
import { useState, useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);

  // This function's memory address is frozen. It will never change.
  const handleSubmit = useCallback(() => { 
    console.log("Submitting") 
  }, []); // Dependency array!

  // Now, ExpensiveChild will properly skip re-renders!
  return <ExpensiveChild onSubmit={handleSubmit} />;
}
```

### (3) `useMemo` vs `useCallback`
They are almost identical. 
- `useMemo` caches the **Result** of a function (like a sorted array).
- `useCallback` caches the **Function Itself**.
In fact, `useCallback(fn, deps)` is literally just syntactic sugar for `useMemo(() => fn, deps)`.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Stale State Closures

**The mistake:** A developer writes a `useCallback` that references a state variable, but forgets to put that variable in the dependency array.
```javascript
const [count, setCount] = useState(0);

const logCount = useCallback(() => {
  console.log("Count is:", count); 
}, []); // FORGOT to add `count` here!
```

**Why it's wrong:** The function is frozen in time at the exact moment of the first render. At that moment, `count` was 0. Even if the user clicks a button and `count` becomes 50, calling `logCount()` will still print `0`! It is trapped in a "Stale Closure." 
**Golden Rule:** Any state or prop used inside the `useCallback` MUST be listed in the dependency array.

---



### Mistake 2: Using `useCallback` Without Passing Function to a `React.memo` Child Component

**The mistake:** Wrapping `const handleClick = useCallback(...)` when `handleClick` is passed to a standard HTML `<button onClick={handleClick}>`.

**Why it's wrong:** `useCallback` does NOT make function execution faster! Its ONLY purpose is preserving function reference equality to prevent re-rendering `React.memo` child components. Standard HTML elements do not benefit.

*Incorrect:*
```javascript
// Using useCallback for callback passed only to standard HTML <button>
```

*Fix:*
```javascript
Use plain functions unless passing callbacks to memoized React.memo child components
```

### Mistake 3: Omitting Referenced Variables from `useCallback` Dependency Arrays

**The mistake:** Writing `useCallback(() => sendData(query), [])` omitting `query` from dependencies.

**Why it's wrong:** Omitting `query` creates a stale closure! The callback locks onto the initial `query` value and sends outdated query string data on execution.

*Incorrect:*
```javascript
const handleSearch = useCallback(() => sendData(query), []); // ❌ Stale query closure!
```

*Fix:*
```javascript
const handleSearch = useCallback(() => sendData(query), [query]);
```

## 6. Practice Exercises

### Exercise 1: When NOT to use it

**Problem:** You have a simple `<button onClick={handleClick}>` element. Should you wrap `handleClick` in `useCallback`?

**Expected output:**
> [!check]- Answer
> ```text
> No! 
> Creating a new function in JavaScript is incredibly fast. Wrapping it in `useCallback` actually makes it slower due to the overhead.
> You ONLY use `useCallback` when you are passing the function down as a Prop to a Child component that has been explicitly optimized with `React.memo`.
> ```
> - Does the standard HTML `<button>` care about memory addresses?
> 
---



### Exercise 2: Memoizing Event Callback for React.memo Child

**Problem:** Memoize `handleDelete` callback using `useCallback` to prevent re-rendering `<MemoizedItem onDelete={handleDelete} />`.

**Expected output:**
> [!check]- Answer
> ```text
> const handleDelete = useCallback((id) => { setItems(prev => prev.filter(i => i.id !== id)); }, []);
> ```
> ```javascript
> const handleDelete = useCallback((id) => {
>   setItems(prev => prev.filter(i => i.id !== id));
> }, []);
> ```
>
> **Explanation:** Using `setItems(prev => ...)` eliminates the need to list `items` in `useCallback` dependencies.
> 
---

### Exercise 3: useCallback vs useMemo Relationship

**Problem:** Express `useCallback(fn, deps)` in terms of `useMemo` (`useMemo(() => fn, deps)`).

**Expected output:**
> [!check]- Answer
> ```text
> useCallback(fn, deps) is syntax shorthand for useMemo(() => fn, deps)
> ```
> ```javascript
> useCallback(fn, deps) === useMemo(() => fn, deps);
> ```
>
> **Explanation:** `useCallback` is a specialized `useMemo` helper for memoizing function references.
> 
## 7. Related Terms
- [`useMemo` Hook](use_memo.md) — The sister hook for caching values instead of functions.
- [React.memo](../level_08/react_memo.md) — The primary reason you need `useCallback`.
- [Dependency Array](../level_03/dependency_array.md) — Related concept: Dependency Array.
- [Stale Closures](../level_03/stale_closures.md) — Related concept: Stale Closures.
- [Memoization (the concept)](memoization.md) — Related concept: Memoization (the concept).
- [Referential Equality](referential_equality.md) — Related concept: Referential Equality.

---

## 8. Key Takeaways
- **`useCallback`** memorizes a function's memory address across re-renders.
- It prevents optimized Child components from unnecessarily re-rendering.
- It requires a Dependency Array. If state variables used inside the function are not in the array, the function will execute with old, stale data.
- Do not use it on every function. Only use it when passing functions as props to heavily optimized child components.
