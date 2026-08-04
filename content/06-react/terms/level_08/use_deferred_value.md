# `useDeferredValue` Hook

> **Level 8 — Performance Optimization**
> A hook to defer rendering slow UI components by updating a copy of a value asynchronously.

---

## 1. Prerequisites
- [Concurrent Rendering](../level_08/concurrent_rendering.md) — The core engine scheduling deferred rendering.
- [Re-rendering](../level_02/re_rendering.md) — The process React optimizes by delaying updates.

---

## 2. Term Category
- **Core Hook**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
The `useTransition` hook is useful when you have direct access to the state setter function (like `setQuery`). However, you often receive data from a parent component or a third-party library as a prop (like a `query` string), without any access to the function that updates it.

If this prop changes frequently and triggers a slow, resource-heavy component to render, the UI can become laggy.

React 18 provides the **`useDeferredValue`** hook to address this:
-   **Deferred Copy:** The hook accepts a value and returns a copy of that value that "lags behind" during fast updates.
-   **Prioritized Rendering:** When the input value changes, React updates the original value immediately and renders the responsive parts of the UI. It keeps the deferred value set to its *previous* value.
-   **Background Processing:** Once the urgent render is complete and painted, React starts a background render using the new deferred value.
-   **Interruptible:** If the user types another character before the background render finishes, React aborts the current render and starts a new one with the latest value.

---

### (2) Reality Metaphor
Imagine a store clerk assisting customers.
- **Urgent Value (Main Clerk):** A customer asks for the price of an item. The clerk looks it up on the screen immediately to provide fast service (**rendering the text input**).
- **Deferred Value (Back Office Clerk):** The customer asks for a detailed historical sales report for that item. The clerk writes the request on a notepad (**the deferred value**) and passes it to a back-office clerk (**background render**). The main clerk continues helping customers. Once the back-office clerk finishes the report, they bring it out (**updating the UI**). If the customer changes their mind before the report is finished, the main clerk calls the back office to cancel the old report and start a new one.

---

### (3) React Code Example: Filtering a Heavy List

```jsx
import React, { useState, useDeferredValue, useMemo } from 'react';

// A slow component that renders many items
const HeavyList = React.memo(({ query }) => {
  const items = useMemo(() => {
    const list = [];
    for (let i = 0; i < 20000; i++) {
      if (i.toString().includes(query)) {
        list.push(<li key={i}>Product #{i}</li>);
      }
    }
    return list;
  }, [query]);

  return <ul>{items}</ul>;
});

export default function SearchApp() {
  const [query, setQuery] = useState('');
  
  // Create a deferred copy of the query string
  const deferredQuery = useDeferredValue(query);

  // Check if the deferred value is currently catching up to the urgent value
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
        placeholder="Type to search..."
      />
      
      {/* Dim the list container while the deferred value catches up */}
      <div style={{ opacity: isStale ? 0.3 : 1, transition: 'opacity 0.2s' }}>
        <HeavyList query={deferredQuery} />
      </div>
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Passing a new object reference to `useDeferredValue` on every render

**The mistake:** Creating and passing a new object inline directly into the hook:

```javascript
// BAD: The object reference is new on every render, triggering constant updates!
const deferredOptions = useDeferredValue({ search: query });
```

**Why it's wrong:** `useDeferredValue` uses shallow equality comparisons (`Object.is`) to check if the value has changed. Because a new object is created on every render, the hook assumes the value has changed and schedules deferred renders continuously, defeating the optimization.

*Fix:* Pass only primitive values (strings, numbers, booleans) to `useDeferredValue`, or pass memoized object references:

```javascript
// GOOD: Pass the primitive string directly
const deferredQuery = useDeferredValue(query);
```

---



### Mistake 2: Using `useDeferredValue` for Local Form Controlled Text Inputs (Typing Lag Trap)

**The mistake:** Deferring text input state `<input value={deferredText} />`.

**Why it's wrong:** Deferring controlled input `value` props creates noticeable typing lag and caret jump bugs! Keep controlled `<input value={text}>` urgent and deferred values for heavy secondary list filters.

*Incorrect:*
```javascript
const [text, setText] = useState('');
const deferredText = useDeferredValue(text);
return <input value={deferredText} onChange={e => setText(e.target.value)} />; // ❌ Caret lag!
```

*Fix:*
```javascript
const [text, setText] = useState('');
const deferredText = useDeferredValue(text);
return (
  <>
    <input value={text} onChange={e => setText(e.target.value)} /> {/* Urgent */}
    <HeavyList query={deferredText} /> {/* Deferred */}
  </>
);
```

### Mistake 3: Using `useDeferredValue` Without `React.memo` on Heavy Child Components

**The mistake:** Passing `deferredQuery` to an un-memoized `<HeavyList query={deferredQuery} />`.

**Why it's wrong:** `useDeferredValue` defers value updates, causing React to render TWICE (first with old value, then with deferred value). If `<HeavyList />` is not wrapped in `React.memo`, it re-renders on the first pass anyway! Wrap child in `React.memo`.

*Incorrect:*
```javascript
// Passing deferredValue to un-memoized heavy child component
```

*Fix:*
```javascript
const HeavyList = React.memo(function HeavyList({ query }) { ... });
```

## 6. Practice Exercises

### Exercise 1: Hook Comparison

**Problem:** Review the development scenarios below and select whether you should use `useTransition` or `useDeferredValue`:

1.  You are importing a search query string as a prop from a router library and need to prevent a heavy map component from lagging:
    *   **Answer:** `useDeferredValue` (you do not control the state setter).
2.  You want to wrap a custom tab-button's `setTab` click handler to make switching panels non-blocking:
    *   **Answer:** `useTransition` (you control the state setter function).
3.  You want to show a spinner indicating that a background tab list render is in progress:
    *   **Answer:** `useTransition` (returns the `isPending` boolean flag).

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Deferring Search Query for Heavy List

**Problem:** Use `useDeferredValue` to defer heavy search filtering while keeping input typing instant.

**Expected output:**
> [!check]- Answer
> ```text
> function SearchPage() { const [query, setQuery] = useState(''); const deferredQuery = useDeferredValue(query); return <> <input value={query} onChange={e => setQuery(e.target.value)} /> <MemoizedList query={deferredQuery} /> <>; }
> ```
> ```javascript
> function SearchPage() {
>   const [query, setQuery] = useState('');
>   const deferredQuery = useDeferredValue(query);
>   return (
>     <>
>       <input value={query} onChange={e => setQuery(e.target.value)} />
>       <MemoizedList query={deferredQuery} />
>     </>
>   );
> }
> ```
>
> **Explanation:** `useDeferredValue` keeps input typing responsive while deferring heavy child list renders.

---

### Exercise 3: useDeferredValue vs Debounce Comparison

**Problem:** Compare: `debounce` (Fixed time delay e.g. 300ms regardless of CPU speed); `useDeferredValue` (Adaptive delay that renders immediately once CPU main thread is free).

**Expected output:**
> [!check]- Answer
> ```text
> debounce: fixed timer delay; useDeferredValue: adaptive rendering as soon as CPU main thread is free
> ```
> ```text
> debounce: fixed timer delay; useDeferredValue: adaptive rendering as soon as CPU main thread is free
> ```
>
> **Explanation:** `useDeferredValue` adapts dynamically to user device processing capabilities.

## 7. Related Terms
- [`useTransition` Hook](../level_08/use_transition.md) — Deferring updates when you control the state setter.
- [Concurrent Rendering](../level_08/concurrent_rendering.md) — The engine architecture that enables deferred rendering.

---

## 8. Key Takeaways
- `useDeferredValue` defers rendering slow UI components by updating a copy of a value in the background.
- It is useful when you receive values as props without access to state setters.
- The hook returns a value that lags behind the urgent value during fast updates.
- Background rendering runs asynchronously and yields to user input.
- Pass only primitive values or memoized object references to `useDeferredValue`.
- Compare `value !== deferredValue` to display loading indicators or dim old content.
