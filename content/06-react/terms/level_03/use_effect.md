# `useEffect` Hook

> **Level 3 — Component Lifecycle & Effects**
> The hook that allows functional components to safely execute Side Effects and hook into the Component Lifecycle. 

---

## 1. Prerequisites
- [Side Effects](side_effects.md) — The actions you execute inside this hook.
- [Component Lifecycle](component_lifecycle.md) — When this hook actually runs.

---

## 2. Term Category
- **Core React Hook**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Because you are forbidden from putting Side Effects (like `fetch()`) directly in the main body of your component, React provides `useEffect` as a safe sanctuary. 
React guarantees that the code inside `useEffect` will **only run AFTER the component has completely finished rendering the UI**. This ensures that heavy API calls will never block the UI from appearing on the screen.

### (2) How it works
`useEffect` takes two arguments:
1. A **Callback Function** (the Side Effect you want to run).
2. An optional **Dependency Array** (which controls *when* the effect runs).

```javascript
import { useEffect, useState } from 'react';

function UserProfile() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // This is the Side Effect!
    // It runs AFTER the <div>Loading...</div> is painted to the screen.
    fetch('/api/user')
      .then(res => res.json())
      .then(json => setData(json));
  }, []); // The empty array tells it to only run on Mount!

  return <div>{data ? data.name : "Loading..."}</div>;
}
```

### (3) The Timing
Because `useEffect` runs *after* the render, the flow looks like this:
1. Component function runs from top to bottom.
2. React paints the UI to the browser screen.
3. **React fires the `useEffect`.**
4. If the `useEffect` updates state, go back to step 1!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the Dependency Array

**The mistake:** A developer writes `useEffect(() => { fetch(...) })` but forgets to put the `[]` as the second argument.

**Why it's wrong:** If you provide NO dependency array, the `useEffect` will run after **EVERY SINGLE RENDER**. If your fetch updates state, it will trigger a re-render, which triggers the effect, which fetches, which updates state. Infinite loop!
**Golden Rule:** 99% of the time, your `useEffect` MUST have a dependency array (even if it's just an empty one `[]`).

---



### Mistake 2: Using `useEffect` for Transforming Data for Rendering (Unnecessary Effect Anti-Pattern)

**The mistake:** Updating `filteredItems` state inside `useEffect` whenever `items` or `query` changes.

**Why it's wrong:** Updating state inside `useEffect` triggers an UNNECESSARY EXTRA RE-RENDER cycle (Render 1 with old data -> Effect -> Render 2 with new data). Calculate data directly during render: `const filtered = items.filter(...)`.

*Incorrect:*
```javascript
useEffect(() => {
  setFilteredItems(items.filter(i => i.name.includes(query))); // ❌ Extra re-render!
}, [items, query]);
```

*Fix:*
```javascript
const filteredItems = items.filter(i => i.name.includes(query)); // Calculate during render!
```

### Mistake 3: Using `useEffect` to Chain State Updates Across Child Components

**The mistake:** Child A updates state in `useEffect` when Parent state changes, triggering Child B `useEffect` to update Parent.

**Why it's wrong:** Chaining state updates through `useEffect` creates cascading re-renders and potential infinite update loops. Calculate data during render or lift state up.

*Incorrect:*
```javascript
// Chaining useEffect state updates across child components
```

*Fix:*
```javascript
Consolidate state update logic into event handlers or compute during render
```

## 6. Practice Exercises

### Exercise 1: The Order of Operations

**Problem:** Look at this code. What order will the console logs print in?
```javascript
function App() {
  console.log("1. Component is rendering");

  useEffect(() => {
    console.log("2. Effect is running");
  }, []);

  return <div>{console.log("3. JSX is evaluating")}</div>;
}
```

**Expected output:**
> [!check]- Answer
> ```text
> The order will be: 1, 3, 2.
> The component function runs, the JSX evaluates, the screen is painted, and ONLY THEN does the `useEffect` run!
> ```
> - `useEffect` is designed specifically to not block the UI from painting.
> 
---



### Exercise 2: Syncing Document Title with useEffect

**Problem:** Update `document.title` to `"Count: ${count}"` whenever `count` updates using `useEffect`.

**Expected output:**
> [!check]- Answer
> ```text
> useEffect(() => { document.title = `Count: ${count}`; }, [count]);
> ```
> ```javascript
> useEffect(() => {
>   document.title = `Count: ${count}`;
> }, [count]);
> ```
>
> **Explanation:** `useEffect` synchronizes component state with external browser APIs like `document.title`.
> 
---

### Exercise 3: When NOT to Use useEffect

**Problem:** List 2 scenarios where `useEffect` should NOT be used (1. Transforming data for rendering; 2. Handling user event responses).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Transforming data for rendering; 2. Handling user event responses
> ```
> ```text
> 1. Transforming data for rendering; 2. Handling user event responses
> ```
>
> **Explanation:** Calculate data during render and handle user actions in event handlers.
> 
## 7. Related Terms
- [Dependency Array](dependency_array.md) — The second argument of `useEffect` that controls its timing.
- [Cleanup Functions](cleanup_functions.md) — What you return from `useEffect` to handle the Unmounting phase.
- [Render Purity](../level_01/render_purity.md) — Related concept: Render Purity.
- [Component Lifecycle](component_lifecycle.md) — Related concept: Component Lifecycle.
- [Side Effects](side_effects.md) — Related concept: Side Effects.
- [`useLayoutEffect` Hook](use_layout_effect.md) — Related concept: `useLayoutEffect` Hook.
- [Dynamic Segments (URL Parameters)](../level_09/dynamic_segments.md) — Related concept: Dynamic Segments (URL Parameters).
- [React Query (TanStack Query) / SWR](../level_11/react_query.md) — Related concept: React Query (TanStack Query) / SWR.

---

## 8. Key Takeaways
- **`useEffect`** is the safe place to execute Side Effects.
- It guarantees that your heavy logic will run **after** the UI has rendered, preventing the screen from freezing.
- It is the modern replacement for all old Class lifecycle methods (`componentDidMount`, etc).
- If you don't include a dependency array, the effect runs after every single render, often causing infinite loops.
