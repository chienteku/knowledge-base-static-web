# React Hooks

> **Level 1 — Core Concepts & Architecture**
> Special built-in functions that let functional React components tap into state, lifecycles, and context.

---

## 1. Prerequisites
- [React Components](react_components.md) — The building blocks that hooks add features to.
---

## 2. Term Category
- **React Architecture**

---

## 3. Environment Context
- **Client Only** (Hooks only execute in the browser environment, not on Server Components).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Fix Rule Violation

**Problem:** Fix the component below so it does not violate the rules of hooks:

```typescript
// Before:
// export default function UserStatus({ id }) {
//   if (!id) return null;
//   const [name, setName] = useState('Guest');
//   return <div>User: {name}</div>;
// }

// Solution:
import React, { useState } from 'react';

export default function UserStatus({ id }: { id: string | null }) {
  const [name, setName] = useState<string>('Guest');

  if (!id) {
    return null;
  }

  return <div>User: {name}</div>;
}
```

> [!check]- Answer
> - Move the `useState` hook definition to the top of the function, before any conditional return statements.

---

### Exercise 2: Custom Hook Extraction Pattern

**Problem:** Write custom hook `useDebounce(value, delay)` returning debounced value using `useState` and `useEffect`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export function useDebounce(value, delay) { const [debounced, setDebounced] = useState(value); useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]); return debounced; }
> ```
> - Custom hooks encapsulate reusable stateful hook logic.
> 
> ```typescript
> import { useState, useEffect } from 'react';
> 
> export function useDebounce<T>(value: T, delay: number): T {
>   const [debouncedValue, setDebouncedValue] = useState<T>(value);
>   
>   useEffect(() => {
>     const handler = setTimeout(() => setDebouncedValue(value), delay);
>     return () => clearTimeout(handler);
>   }, [value, delay]);
>   
>   return debouncedValue;
> }
> ```

---

### Exercise 3: Rules of Hooks Matrix

**Problem:** State the 2 primary Rules of Hooks in React.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Call hooks ONLY at the top level (never inside loops, conditions, or nested functions).
> 2. Call hooks ONLY from React function components or custom hooks.
> ```
> - Rule 1: Call hooks ONLY at top level.
> - Rule 2: Call hooks ONLY from React functions.
> 
> ```text
> Never call hooks conditionally or inside standard JS functions.
> ```


---

## 7. Related Terms
- [Client Components (`"use client"`)](client_components.md) — Next.js files marked with `'use client'` that enable hooks.
- [React Components](react_components.md) — The visual wrapper surrounding hooks.
- [React `useEffect` Hook](../level_02/use_effect.md) — Related concept: React `useEffect` Hook.
---

## 8. Key Takeaways
- Hooks allow functional components to maintain state and handle lifecycle events.
- `useState` manages local variables; `useEffect` manages asynchronous side effects.
- Hooks must be declared unconditionally at the very top of functional components.
- In Next.js, you must add the `'use client'` directive to files containing hooks.
- Hooks cannot run inside Server Components.
