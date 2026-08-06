# Referential Equality

> **Level 4 — Advanced Hooks**
> Why React compares objects/functions by reference, breaking naive memoization.

---

## 1. Prerequisites
- [Immutability](../level_02/immutability.md) — Modifying reference variables requires creating copy instances.
- [`useMemo` Hook](use_memo.md) — The hook used to preserve reference identities.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, data comparison behaviors are split into two categories:
1.  **Primitives (Strings, Numbers, Booleans):** Compared by **value**. Two identical values are equal.
    `"hello" === "hello"` evaluates to `true`.
2.  **References (Objects, Arrays, Functions):** Compared by **reference** (their address in memory). Two objects are only equal if they point to the exact same location in RAM.
    `{ a: 1 } === { a: 1 }` evaluates to `false`, even though the keys and values look identical.

Because React functional components execute their entire function body on every render, any object, array, or function declared directly inside the component body is **re-allocated a new memory address on every render cycle**.

This behavior causes issues with React hooks and optimizations:
-   **Dependency Mismatch:** If you pass a local object or function as a dependency to a `useEffect` hook, React uses shallow reference comparison (`Object.is`) to check for changes. Because the object's reference address is new on every render, React detects a change and executes the effect repeatedly, which can lead to infinite loops.
-   **Broken Component Memoization:** If you pass a fresh object or function as a prop to a child component optimized with `React.memo`, the child will always re-render. This occurs because the prop reference address changes on every render, rendering the memoization useless.

To preserve reference identity between renders, developers wrap local objects and arrays in `useMemo`, and wrap local callback functions in `useCallback`.

---

### (2) Reality Metaphor
Imagine keys and locks.
- **Primitive Value (Key Combination):** You lock a cabinet using a digital combination lock set to `1-2-3-4` (**a primitive string**). Anyone who knows the code can open the cabinet. If you write the code on two different sticky notes, both notes represent the exact same value.
- **Reference Identity (Physical Keys):** You lock a cabinet using a physical brass key (**an object reference**). You hold Key A in your pocket, and your roommate holds an identical Key B. Even though they look identical and perform the same action, they are two separate physical keys. If a security system requires you to present the exact physical key you registered at check-in (**reference validation**), presenting the copy will trigger an alarm because it is not the exact same physical object in space.

---

### (3) React Code Examples

#### 1. The Infinite Loop Bug (Referential Inequality)
```jsx
import React, { useState, useEffect } from 'react';

function UserLogs() {
  const [logs, setLogs] = useState([]);
  
  // BUG: Options is re-allocated a new memory reference on every render!
  const fetchOptions = { limit: 10 }; 

  useEffect(() => {
    fetch(`/api/logs?limit=${fetchOptions.limit}`)
      .then(res => res.json())
      .then(data => setLogs(data));
      
    // React compares fetchOptions on every render. Reference changed -> Re-runs!
  }, [fetchOptions]); // Triggers infinite rendering loops!

  return <div>Logs Count: {logs.length}</div>;
}
```

#### 2. The Fix (Preserving Reference via `useMemo`)
```jsx
// GOOD: useMemo ensures fetchOptions keeps the same memory address between renders
const fetchOptions = useMemo(() => ({ limit: 10 }), []); 

useEffect(() => {
  fetch(`/api/logs?limit=${fetchOptions.limit}`)
    .then(res => res.json())
    .then(data => setLogs(data));
}, [fetchOptions]); // Reference stays stable; runs only once on mount!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Declaring inline functions as props for memoized child components

**The mistake:** Passing a raw arrow function directly inside JSX to a child component optimized with `React.memo`:

```jsx
// BAD: The inline onClick function is re-created on every render, breaking memoization!
const MemoizedButton = React.memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>;
});

function App() {
  return <MemoizedButton onClick={() => console.log('Clicked!')} />;
}
```

**Why it's wrong:** Every time `App` renders, the inline arrow function `() => console.log('Clicked!')` is re-created at a new memory address. When `MemoizedButton` compares its props, it detects a new reference for the `onClick` function and re-renders, bypassing the optimization.

*Fix:* Wrap the callback handler in `useCallback` inside the parent component to preserve its reference:

```jsx
// GOOD: useCallback keeps the callback reference stable across renders
const handleClick = useCallback(() => {
  console.log('Clicked!');
}, []);

return <MemoizedButton onClick={handleClick} />;
```

---



### Mistake 2: Comparing Objects or Arrays with Direct Equality (`===`) Expecting Deep Value Comparison

**The mistake:** Comparing `{ id: 1 } === { id: 1 }` expecting `true`.

**Why it's wrong:** In JavaScript, object and array comparisons compare MEMORY ADDRESSES, not values! `{ id: 1 } === { id: 1 }` evaluates to `false`.

*Incorrect:*
```javascript
const a = { role: 'admin' };
const b = { role: 'admin' };
console.log(a === b); // ❌ false! Different memory references!
```

*Fix:*
```javascript
Compare primitive values (a.role === b.role) or use deep equality comparison
```

### Mistake 3: Creating Inline Callback Functions in Component Render Passed to Dependency Arrays

**The mistake:** Defining `const fetchData = () => { ... };` inside render and passing `[fetchData]` to `useEffect`.

**Why it's wrong:** `fetchData` is re-created on every render with a new memory address. Including it in `useEffect` dependencies triggers an infinite re-render loop! Wrap in `useCallback`.

*Incorrect:*
```javascript
const fetchData = () => { ... };
useEffect(() => { fetchData(); }, [fetchData]); // ❌ Infinite loop!
```

*Fix:*
```javascript
const fetchData = useCallback(() => { ... }, []);
useEffect(() => { fetchData(); }, [fetchData]);
```

## 6. Practice Exercises

### Exercise 1: Finding Infinite Loops

**Problem:** Find the referential equality bug that causes the component below to trigger an infinite render loop, and fix it using standard JavaScript styling best practices:

```jsx
// Before (Infinite Loop):
function ThemeDisplay() {
  const [data, setData] = useState(null);
  
  const theme = { dark: true }; // Referential inequality trigger

  useEffect(() => {
    fetchDataForTheme(theme).then(res => setData(res));
  }, [theme]);

  return <div>Theme Status</div>;
}

// After (Refactored Solution):
// Since the theme object does not rely on any reactive variables,
// we can move it outside the component entirely to keep its reference stable!
const theme = { dark: true }; 

function ThemeDisplay() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDataForTheme(theme).then(res => setData(res));
  }, []); // Static reference outside requires empty array dependency

  return <div>Theme Status</div>;
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Object.is Equality Comparison in React

**Problem:** Evaluate `Object.is()` for: 1. `Object.is(5, 5)` (`true`); 2. `Object.is({}, {})` (`false`); 3. `Object.is(NaN, NaN)` (`true`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. true, 2. false, 3. true
> ```
> ```text
> 1. true, 2. false, 3. true
> ```
>
> **Explanation:** React uses `Object.is` for state change and dependency array comparisons.
> 
---

### Exercise 3: Preserving Reference with useMemo

**Problem:** Preserve object reference `options = { theme: 'dark' }` across renders using `useMemo`.

**Expected output:**
> [!check]- Answer
> ```text
> const options = useMemo(() => ({ theme: 'dark' }), []);
> ```
> ```javascript
> const options = useMemo(() => ({ theme: 'dark' }), []);
> ```
>
> **Explanation:** `useMemo` preserves object memory references across re-renders.
> 
## 7. Related Terms
- [`useCallback` Hook](use_callback.md) — The hook designed to preserve function reference identities.
- [React.memo](../level_08/react_memo.md) — The component rendering cache that relies on shallow reference equality.
- [`useMemo` Hook](use_memo.md) — Related concept: `useMemo` Hook.

---

## 8. Key Takeaways
- JavaScript compares objects, arrays, and functions by reference (memory address).
- Primitives (strings, numbers) are compared by value.
- Re-declaring objects inside components allocates new references on every render.
- Changing references in hook dependency arrays can trigger infinite rendering loops.
- Use `useMemo` or `useCallback` to maintain reference identity across renders.
- If an object does not depend on reactive variables, move it outside the component function body.
