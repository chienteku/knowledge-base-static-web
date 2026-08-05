# React.memo

> **Level 8 — Performance Optimization**
> A Higher-Order Component that wraps around a child component to prevent it from Re-rendering unless its incoming Props have actually changed.

---

## 1. Prerequisites
- [Re-rendering](../level_02/re_rendering.md) — The default behavior that `React.memo` stops.
- [`useMemo` Hook](../level_04/use_memo.md) — The hooks required to make `React.memo` actually work properly.

---

## 2. Term Category
- **React API / Performance Optimization**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
React's default behavior is cascading renders. **If a Parent component re-renders, every single Child component inside it will also re-render automatically.**
Usually, this is incredibly fast and you don't notice. But what if the Child component is a massive Data Table with 10,000 rows? If the Parent re-renders because the user typed in an unrelated text box, the massive Data Table will unnecessarily re-render, freezing the browser.
**`React.memo`** protects the Child component. It tells React: "Do NOT re-render this child unless the Props given to it have changed."

### (2) How to use it
You simply wrap your entire component definition in `React.memo()`.
```javascript
import { memo } from 'react';

// Wrap the component in memo()
const MassiveDataTable = memo(function MassiveDataTable({ data }) {
  console.log("Data Table Rendering!");
  return <table>{/* 10,000 rows */}</table>;
});

export default MassiveDataTable;
```
Now, if the Parent re-renders, React will look at the `data` prop. If the data is the exact same as last time, React skips the child entirely!

### (3) The Shallow Equality Catch
React checks if props changed using "Shallow Equality" (`Object.is`). 
If the Parent passes a simple string (`name="Alice"`), memo works perfectly.
But if the Parent passes an Object, Array, or Function, the Parent generates a brand new memory address on every render! React sees the new memory address, assumes the prop changed, and forces a re-render, completely destroying the `memo` optimization.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `memo` without `useCallback` or `useMemo`

**The mistake:** A developer wraps `<ExpensiveChart />` in `memo`. The Parent passes it an inline function: `<ExpensiveChart onClick={() => alert("Hi")} />`.

**Why it's wrong:** An inline function creates a new memory address on every render. `memo` sees the new memory address, assumes the `onClick` prop changed, and re-renders `<ExpensiveChart>` anyway! 
**Golden Rule:** If a component is wrapped in `memo`, any Objects, Arrays, or Functions passed to it as props MUST be wrapped in `useMemo` or `useCallback` by the Parent.

---



### Mistake 2: Wrapping Components in `React.memo` Without Memoizing Prop Objects/Callbacks

**The mistake:** Wrapping `<Child />` in `React.memo` while passing `<Child options={{ theme: 'dark' }} />`.

**Why it's wrong:** `React.memo` performs a **shallow comparison** of props (`Object.is`). Inline object literals `{}` and arrow functions `() => {}` create new references every render, forcing `React.memo` to re-render anyway. Use `useMemo` and `useCallback`.

*Incorrect:*
```javascript
const MemoChild = React.memo(Child);
// In parent:
<MemoChild onClick={() => setVal(1)} /> // ❌ Re-renders every time due to inline function reference!
```

*Fix:*
```javascript
const handleClick = useCallback(() => setVal(1), []);
<MemoChild onClick={handleClick} />
```

### Mistake 3: Using Custom ArePropsEqual Comparators Incorrectly Returning Reversed Booleans

**The mistake:** Writing `React.memo(Component, (prevProps, nextProps) => prevProps.id !== nextProps.id)`.

**Why it's wrong:** The custom `arePropsEqual` comparator function MUST return `true` IF PROPS ARE EQUAL (skip render), and `false` IF PROPS ARE DIFFERENT (re-render)! Returning reversed booleans causes broken updates.

*Incorrect:*
```javascript
React.memo(Comp, (prev, next) => prev.id !== next.id); // ❌ Reversed boolean logic!
```

*Fix:*
```javascript
React.memo(Comp, (prev, next) => prev.id === next.id); // Return true when equal to skip render
```

## 6. Practice Exercises

### Exercise 1: When to NOT use memo

**Problem:** You have a simple `<Button text="Submit" />` component. Should you wrap it in `React.memo` to optimize it?

**Expected output:**
> [!check]- Answer
> ```text
> No!
> `React.memo` has a performance cost! React has to take the time to run the `Object.is()` comparison on all the props. 
> For a simple button, running the comparison math actually takes LONGER than just letting the button re-render!
> ```
> - Does a simple `<button>` take a long time to render? Does the optimization cost more than the render?

---



### Exercise 2: Basic React.memo Component Wrapper

**Problem:** Wrap `ExpensiveList` component in `React.memo` to skip re-renders when `items` prop is reference-equal.

**Expected output:**
> [!check]- Answer
> ```text
> const ExpensiveList = React.memo(function ExpensiveList({ items }) { return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>; });
> ```
> ```javascript
> const ExpensiveList = React.memo(function ExpensiveList({ items }) {
>   return (
>     <ul>
>       {items.map(i => <li key={i.id}>{i.name}</li>)}
>     </ul>
>   );
> });
> ```
>
> **Explanation:** `React.memo` skips component re-renders if incoming props match previous props via shallow equality.

---

### Exercise 3: Custom Prop Comparison Function

**Problem:** Write `React.memo` with custom comparison function checking `prevProps.userId === nextProps.userId`.

**Expected output:**
> [!check]- Answer
> ```text
> const UserCard = React.memo(Card, (prev, next) => prev.userId === next.userId);
> ```
> ```javascript
> const UserCard = React.memo(Card, (prev, next) => prev.userId === next.userId);
> ```
>
> **Explanation:** Returning `true` from custom `arePropsEqual` functions tells React to skip re-rendering.

## 7. Related Terms
- [`useCallback` Hook](../level_04/use_callback.md) — Used by the Parent to pass stable functions to a `memo` child.
- [`useMemo` Hook](../level_04/use_memo.md) — Used by the Parent to pass stable objects/arrays to a `memo` child.
- [Re-rendering](../level_02/re_rendering.md) — Related concept: Re-rendering.
- [Memoization (the concept)](../level_04/memoization.md) — Related concept: Memoization (the concept).
- [Referential Equality](../level_04/referential_equality.md) — Related concept: Referential Equality.
- [The React Profiler](react_profiler.md) — Related concept: The React Profiler.

---

## 8. Key Takeaways
- **`React.memo`** prevents a Child component from re-rendering if its Props haven't changed.
- It intercepts React's default behavior (where Parent re-renders always trigger Child re-renders).
- It compares props using Shallow Equality (memory addresses).
- If you pass Objects, Arrays, or Functions to a `memo` component, you must stabilize their memory addresses using `useMemo` or `useCallback`.
- Do NOT use `memo` on every component. The comparison math is slower than the render time for simple components. Only use it on genuinely massive, expensive components.
