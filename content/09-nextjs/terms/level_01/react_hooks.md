# React Hooks

> **Level 1 — Core Concepts & Architecture**
> Special built-in functions that let functional React components tap into state, lifecycles, and context.

---

## 1. Prerequisites
- [React Components](react_components.md) — The building blocks that hooks add features to.

---

## 2. Term Category

**React Server Component** (Client-Side React Hooks): React Hooks (`useState`, `useEffect`, `useContext`) enable state management and side effects inside Client Components.



---

## 3. Explanation

### Environment Context
- **Client Only** (Hooks only execute in the browser environment, not on Server Components).

### (1) Design Motivation — "Why did we design this?"
In early versions of React, components were divided into class components and functional components. Functional components were simple, stateless presentation functions that accepted props and returned JSX. If a developer needed to track state (like a toggle flag) or trigger side effects (like fetching data after mount), they had to refactor the entire function into a complex class component (using `this.state` and lifecycle methods like `componentDidMount`).

React 16.8 introduced **Hooks** to solve this. Hooks allow you to use state and other React features without writing a class component. This makes code clean, shareable, and easy to maintain. In Next.js, hooks are essential for building interactive Client Components.

---

### (2) Core Concept — State and Effect Hooks
The two most foundational hooks are `useState` and `useEffect`:

```typescript
'use client'; // Required in Next.js to use hooks!

import React, { useState, useEffect } from 'react';

export default function ClickCounter() {
  // 1. Declare state variable 'count' initialized to 0
  const [count, setCount] = useState<number>(0);

  // 2. Declare side effect hook to update tab title when count changes
  useEffect(() => {
    document.title = `Clicked ${count} times`;
  }, [count]); // Dependency array: only re-run effect when count changes

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

---

### (3) The Strict Rules of Hooks
To ensure React links hooks correctly to component state between renders, they must follow two strict rules:
1.  **Only Call Hooks at the Top Level:** Do not call hooks inside loops, conditions (`if` blocks), or nested functions. React relies on the execution order of hook calls to remain identical on every render.
2.  **Only Call Hooks from React Functions:** Call hooks only from React functional components or custom hooks, never from standard helper functions.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Calling a hook conditionally

**The mistake:** Putting a hook call inside an `if` block:

```typescript
// BAD: Violates the rules of hooks by rendering conditionally!
export default function ConditionalStatus({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (!isLoggedIn) {
    return <p>Please log in.</p>;
  }

  // Hook called after a return statement and inside condition
  const [data, setData] = useState(null); 
  return <div>Welcome!</div>;
}
```

**Why it's wrong:** React keeps track of state variables by their execution index sequence. If a hook call is skipped during a render pass because a condition is met, all subsequent hook values shift, corrupting the component's state.

**Golden Rule:** Always declare hooks unconditionally at the very top of your functional components.

---

### Mistake 2: Invoking React Hooks inside React Server Components (RSC)

**The mistake:** Writing `const [state, setState] = useState(0)` inside a Server Component.

**Why it's wrong:** React hooks (`useState`, `useEffect`, `useRef`) run ONLY in the browser environment. Server Components execute on the server and do not support stateful hooks. Add `'use client'`.

*Incorrect:*
```typescript
// Server Component (default)
import { useState } from 'react';
export default function Page() {
  const [count, setCount] = useState(0); // ❌ Error: Hooks only work in Client Components!
}
```

*Fix:*
```typescript
'use client'; // Convert to Client Component
import { useState } from 'react';
export default function Page() {
  const [count, setCount] = useState(0);
}
```

---

### Mistake 3: Calling React Hooks Conditionally Inside `if` Statements or Loops

**The mistake:** Writing `if (isLoggedIn) { useEffect(() => {}, []); }`.

**Why it's wrong:** React relies on the strict call order of hooks across re-renders. Calling hooks conditionally breaks React's internal fiber hook index, causing fatal runtime crashes. Follow Rules of Hooks.

*Incorrect:*
```typescript
if (condition) {
  useEffect(() => {}, []); // ❌ Violation of Rules of Hooks!
}
```

*Fix:*
```typescript
useEffect(() => {
  if (condition) {
    // Place condition INSIDE the hook callback
  }
}, [condition]);
```


---

## 5. Practice Exercises

### Exercise 1: Managing Local Component State with `useState()`

**Scenario:**
Create an interactive input field component tracking search state using `useState()`.

**Requirements:**
1. Implement `useState("")` inside `"use client"` component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  return (
    <div className="p-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search..."
        className="p-2 border rounded w-full"
      />
      <p className="mt-2 text-sm text-gray-600">Active Query: {query}</p>
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. `useState(initialValue)` returns a stateful value and a setter function to update it.
> 2. Mutating state via setter function triggers component re-rendering.
> 3. React hooks require marking the component file with `"use client"`.

---

### Exercise 2: Managing Side Effects with `useEffect()`

**Scenario:**
Subscribe to browser window resize events using `useEffect()` and clean up the listener on unmount.

**Requirements:**
1. Add event listener in `useEffect()` and return cleanup function.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useState, useEffect } from "react";

export default function WindowSize() {
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    // Client-side window access
    setWidth(window.innerWidth);
    
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <p>Window Width: {width}px</p>;
}
```

> #### Technical Explanation
>
> 1. `useEffect(callback, dependencies)` executes side effects after component rendering.
> 2. Returning a function from the callback performs cleanup when the component unmounts or dependencies update.
> 3. Empty dependency array `[]` runs the effect once on mount.

---

### Exercise 3: Optimizing Derived Values with `useMemo()`

**Scenario:**
Memoize an expensive array filter operation using `useMemo()` to prevent unnecessary recalculations.

**Requirements:**
1. Wrap calculation in `useMemo()`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useState, useMemo } from "react";

export default function FilteredList({ items }: { items: string[] }) {
  const [filter, setFilter] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) => item.toLowerCase().includes(filter.toLowerCase()));
  }, [items, filter]);

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <ul>
        {filteredItems.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. `useMemo(() => value, [deps])` caches the result of an expensive calculation between renders.
> 2. Re-evaluates ONLY when dependency array values change.
> 3. Prevents CPU performance bottlenecks during component re-renders.

---




---

## 6. Related Terms
- [Client Components (`"use client"`)](client_components.md) — Next.js files marked with `'use client'` that enable hooks.
- [React Components](react_components.md) — The visual wrapper surrounding hooks.
- [React `useEffect` Hook](../level_02/use_effect.md) — Related concept: React `useEffect` Hook.

---

## 7. Key Takeaways
- Hooks allow functional components to maintain state and handle lifecycle events.
- `useState` manages local variables; `useEffect` manages asynchronous side effects.
- Hooks must be declared unconditionally at the very top of functional components.
- In Next.js, you must add the `'use client'` directive to files containing hooks.
- Hooks cannot run inside Server Components.
