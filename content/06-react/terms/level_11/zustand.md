# Zustand

> **Level 11 — Ecosystem Libraries**
> A minimal, fast, and selector-based global state manager that avoids Context re-render issues.

---

## 1. Prerequisites
- [State Management (Redux / Zustand)](../level_06/state_management.md) — The global state container concept.
- [`useReducer` Hook](../level_06/use_reducer.md) — The state-update logic pattern.

---

## 2. Term Category
- **Ecosystem / State Manager**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Managing global state across multiple components in React has historically been handled by either the Context API or Redux:
-   **Context API Bottleneck:** Context is easy to set up but suffers from performance issues. When a state variable inside a Context Provider changes, **every** component consuming that Context (via `useContext`) is forced to re-render, even if they only read a different, unrelated sub-property.
-   **Redux Boilerplate:** Redux is highly performant but requires significant boilerplate (actions, reducers, store configuration, action creators, middleware) to set up and maintain.

To bridge this gap, the community created **Zustand**:
-   **Selector-based Subscriptions:** Components subscribe to specific slices of global state using selector functions: `const user = useStore(state => state.user)`.
-   **Performance Optimization:** If other properties in the store change (e.g. `state.theme`), the component will not re-render because the selected value (`state.user`) remains referentially equal. This solves the Context re-render issue.
-   **Provider-less Store:** You do not need to wrap your component tree in Context Providers. The store is a standalone vanilla JavaScript object that can be read from and written to from anywhere, even outside of React components.

---

### (2) Reality Metaphor
Imagine sharing office updates.
- **Context API (Building Intercom):** An announcer broadcasts over the office intercom: *"Accountant Bob is heading to lunch."* Every employee in the building stops working, listens to the announcement, and returns to work, even if they do not work with Bob (**wasted rendering cycles**).
- **Zustand (Direct Pager System):** You subscribe to updates only for your team. When Bob goes to lunch, only the accounting team's pagers ring (**selector-based subscriptions**). Employees in other departments continue working without interruption (**no unnecessary renders**).

---

### (3) React Code Example: Counter & User Store

#### 1. Creating the Store (`store.js`)
```javascript
// store.js
import { create } from 'zustand';

// Define the global store containing state and action methods
export const useStore = create((set) => ({
  count: 0,
  username: 'Alice',
  
  // Action to increment count
  increment: () => set((state) => ({ count: state.count + 1 })),
  
  // Action to update username
  setUsername: (name) => set({ username: name })
}));
```

#### 2. Consuming the Store with Selectors
```jsx
// CounterDisplay.js
import React from 'react';
import { useStore } from './store';

export default function CounterDisplay() {
  // Select only the count state.
  // This component will ONLY re-render when state.count changes!
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={increment}>Add 1</button>
    </div>
  );
}
```

```jsx
// UsernameDisplay.js
import React from 'react';
import { useStore } from './store';

export default function UsernameDisplay() {
  // Selects only username. Changes to 'count' will NOT cause this to re-render!
  const username = useStore((state) => state.username);

  return <h3>Welcome back, {username}!</h3>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Destructuring the entire store object without using selector functions

**The mistake:** Destructuring state variables directly from the store hook call:

```javascript
// BAD: Subscribes the component to the ENTIRE store, causing unnecessary re-renders!
const { username, count } = useStore(); 
```

**Why it's wrong:** Calling `useStore()` without a selector function subscribes the component to all state updates in that store. If the `count` state updates, components that only read `username` will still be forced to re-render, re-introducing the Context API performance bottleneck.

*Fix:* Always use selector functions to extract only the specific state values your component needs:

```javascript
// GOOD: Component only updates when username changes
const username = useStore((state) => state.username);
```

---



### Mistake 2: Selecting Entire Store Object in Components (`useStore(state => state)`) Triggering Unneeded Re-Renders

**The mistake:** Calling `const state = useUserStore()` without selector functions.

**Why it's wrong:** Consuming the entire store causes the component to re-render whenever ANY property in the Zustand store mutates! Use selector functions `useUserStore(state => state.name)`.

*Incorrect:*
```javascript
const store = useUserStore(); // ❌ Component re-renders on ANY store update!
```

*Fix:*
```javascript
const name = useUserStore(state => state.name); // Selective re-rendering
```

### Mistake 3: Mutating State Directly inside Zustand Actions Without Spread Syntax or Immer Middleware

**The mistake:** Writing `set(state => { state.count += 1; return state; })` without Immer.

**Why it's wrong:** Zustand relies on shallow equality comparison of returned state objects. Mutating `state` directly without returning a new object reference prevents component updates.

*Incorrect:*
```javascript
inc: () => set(state => { state.count += 1; }) // ❌ Direct mutation without Immer!
```

*Fix:*
```javascript
inc: () => set(state => ({ count: state.count + 1 })) // Immutable state object
```

## 6. Practice Exercises

### Exercise 1: Theme Toggle Store

**Problem:** Complete the Zustand store and component below to support a global theme switcher (`'light'` or `'dark'`):

```jsx
import { create } from 'zustand';

// 1. Create the store
// Solution:
export const useThemeStore = create((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  }))
}));

// 2. Component consumption
import React from 'react';

function ThemeToggleButton() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <button 
      onClick={toggleTheme}
      style={{ 
        background: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#000'
      }}
    >
      Active Theme: {theme}
    </button>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Creating Zustand Store

**Problem:** Create Zustand store `useCounterStore` with `count` state and `increment` action.

**Expected output:**
> [!check]- Answer
> ```text
> import { create } from 'zustand'; const useCounterStore = create(set => ({ count: 0, increment: () => set(state => ({ count: state.count + 1 })) }));
> ```
> ```javascript
> import { create } from 'zustand';
>
> const useCounterStore = create(set => ({
>   count: 0,
>   increment: () => set(state => ({ count: state.count + 1 }))
> }));
> ```
>
> **Explanation:** `create()` returns a custom React hook to consume and update state across components.

---

### Exercise 3: Zustand Outside-React Usage

**Problem:** How do you read/write Zustand store state outside React components (e.g. in vanilla JS files)? (Use `useCounterStore.getState()` and `useCounterStore.setState()`).

**Expected output:**
> [!check]- Answer
> ```text
> useCounterStore.getState() and useCounterStore.setState()
> ```
> ```javascript
> const count = useCounterStore.getState().count;
> useCounterStore.setState({ count: 10 });
> ```
>
> **Explanation:** Zustand stores expose utility methods (`getState`, `setState`) for usage outside React component trees.

## 7. Related Terms
- [State Management (Redux / Zustand)](../level_06/state_management.md) — The architectural patterns for application data.
- [Redux](redux.md) — The traditional, action-reducer global state manager.
- [`useSyncExternalStore` Hook](use_sync_external_store.md) — The built-in React 18 hook that integrates stores with React state.

---

## 8. Key Takeaways
- Zustand is a lightweight global state management library for React.
- It uses selector-based subscriptions to prevent unnecessary component re-renders.
- Stores do not require wrapper Context Providers at the root of your application.
- State can be read and updated from anywhere, including outside of React components.
- Always use selector functions to target specific state slices.
- Do not destructure the hook directly without selectors to avoid performance issues.
