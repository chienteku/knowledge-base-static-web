# React `useEffect` Hook

> **Level 2 — App Router UI Elements**
> A hook that allows functional Client Components to perform side effects that synchronize React state with external non-React systems.

---

## 1. Prerequisites
- [React Hooks](../level_01/react_hooks.md) — The system governing hook executions.
---

## 2. Term Category
- **React Hook**

---

## 3. Environment Context
- **Client Only** (Side effects run after rendering inside the client's browser DOM).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
React components should ideally be pure functions that accept props, read state, and return JSX. However, real-world applications need to interact with external services and APIs that are not managed by React's rendering pipeline. Examples include:
-   Fetching data from a backend server.
-   Directly updating the browser document title.
-   Setting up intervals or timeouts.
-   Adding event listeners directly to the global `window` object.

**`useEffect`** was designed to solve this by providing a controlled entry point to run side effects. It schedules the effect code to run asynchronously *after* the component has rendered and the browser has painted the UI, ensuring that slow actions do not block the initial page paint.

---

### (2) Core Concept — Dependencies and Cleanup
The hook takes two arguments: the side effect function, and an optional array of dependencies:

```typescript
'use client';

import React, { useState, useEffect } from 'react';

export default function DocumentTracker() {
  const [clicks, setClicks] = useState<number>(0);

  // Synchronizes document title with local state
  useEffect(() => {
    document.title = `Total Clicks: ${clicks}`;
    
    // Optional: Dependency array controls when the effect executes
  }, [clicks]); // Only re-run when clicks state changes

  return (
    <button onClick={() => setClicks(clicks + 1)}>
      Increment Count
    </button>
  );
}
```

---

### (3) Effect Cleanups (Avoiding Memory Leaks)
Many side effects create persistent subscriptions or listeners that continue executing even after the component is unmounted (removed from the page). To prevent memory leaks, you must return a **Cleanup Function** from your effect block:

```typescript
'use client';

import React, { useEffect } from 'react';

export default function ScrollListener() {
  useEffect(() => {
    const handleScroll = () => console.log(window.scrollY);
    
    // 1. Establish subscription
    window.addEventListener('scroll', handleScroll);

    // 2. Return cleanup callback to tear down subscription
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Empty array means run once on mount, clean up on unmount

  return <p>Scroll down to see coordinates in console.</p>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Setting state unconditionally inside `useEffect` without dependencies

**The mistake:** Triggering a state update inside an effect without specifying dependencies, or missing dependencies:

```typescript
// BAD: Triggers an infinite rendering loop!
export default function InfiniteLoop() {
  const [data, setData] = useState(0);

  useEffect(() => {
    // State update triggers re-render, which triggers effect, which triggers state update...
    setData(data + 1); 
  }); 

  return <div>Count: {data}</div>;
}
```

**Why it's wrong:** Omitting the dependency array causes `useEffect` to execute on *every* single render. Since setting state triggers a re-render, the component gets trapped in an infinite rendering loop, eventually crashing the user's browser.

**Golden Rule:** Always declare a dependency array when calling `useEffect`, and verify that all state or prop variables referenced inside the effect are listed inside that array.

---

### Mistake 2: Using `useEffect` for Primary Data Fetching in Next.js App Router (Waterfall Trap)

**The mistake:** Fetching page data inside `useEffect` in a Client Component.

**Why it's wrong:** Fetching data in `useEffect` requires downloading JS bundles first, causing slow waterfalls, layout shifts, and poor SEO. Fetch data directly in async React Server Components.

*Incorrect:*
```typescript
'use client';
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/user').then(r => r.json()).then(setData); }, []); // ❌ CSR Waterfall!
}
```

*Fix:*
```typescript
// Async Server Component fetches data on server directly:
export default async function Page() {
  const res = await fetch('https://api.example.com/user');
  const data = await res.json();
  return <div>{data.name}</div>;
}
```

---

### Mistake 3: Forgetting Event Listener Cleanup Functions in `useEffect`

**The mistake:** Adding `window.addEventListener('scroll', handleScroll)` inside `useEffect` without returning a cleanup function.

**Why it's wrong:** Un-cleared window listeners remain registered after component unmounting, causing memory leaks and state updates on unmounted components.

*Incorrect:*
```typescript
useEffect(() => {
  window.addEventListener('resize', handleResize); // ❌ Missing cleanup return function!
}, []);
```

*Fix:*
```typescript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize); // Cleanup
}, []);
```


---

## 6. Practice Exercises

### Exercise 1: Window Resize Listener

**Problem:** Complete the component below to safely track the browser window width using `useEffect`, cleaning up the listener on unmount to prevent leaks:

```typescript
// components/WindowTracker.tsx
'use client';

import React, { useState, useEffect } from 'react';

export default function WindowTracker() {
  const [width, setWidth] = useState<number>(0);

  // Solution:
  useEffect(() => {
    // Only runs on the client after mount
    setWidth(window.innerWidth);

    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <p>Current Window Width: {width}px</p>;
}
```

> [!check]- Answer
> - Add a listener for `resize` events to the global `window` inside the effect, and return a callback that removes it.

---

### Exercise 2: Valid useEffect Use Case

**Problem:** Identify 1 valid scenario where `useEffect` is required inside a Next.js App Router Client Component.

**Expected output:**
> [!check]- Answer
> ```text
> Synchronizing third-party browser DOM libraries (e.g. D3.js charts, Mapbox maps, or browser localStorage synchronization).
> ```
> - `useEffect` is intended for browser DOM synchronization and third-party widgets.
> 
> ```tsx
> 'use client';
> useEffect(() => {
>   const chart = new Chart(canvasRef.current);
>   return () => chart.destroy();
> }, []);
> ```

---

### Exercise 3: useEffect Missing Dependency Bug

**Problem:** Why is omitting referenced variables from the `useEffect` dependency array (`[dept]`) dangerous in React?

**Expected output:**
> [!check]- Answer
> ```text
> The effect callback will capture stale closures of un-tracked variables, failing to re-run when dependencies change.
> ```
> - Missing dependencies create stale closure bugs.
> 
> ```typescript
> // Always include all referenced reactive values in dependency array
> useEffect(() => {
>   fetchData(id);
> }, [id]);
> ```


---

## 7. Related Terms
- [React Hooks](../level_01/react_hooks.md) — The parent hook mechanism.
- [`template.tsx`](template.md) — The Next.js UI file that intentionally re-triggers effects on page navigations.
---

## 8. Key Takeaways
- `useEffect` coordinates side effects that sync React state with external systems.
- Effects execute asynchronously after rendering and paint are completed.
- Use the dependency array to limit execution to when specific variables change.
- An empty dependency array `[]` ensures the effect runs only once on component mount.
- Return a cleanup function from your effect to tear down listeners, intervals, and subscriptions.
