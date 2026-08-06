# Custom Hooks

> **Level 4 — Advanced Hooks**
> Reusable JavaScript functions that encapsulate stateful logic and built-in React hooks to share behavior across components.

---

## 1. Prerequisites

- [`useEffect` Hook](../level_03/use_effect.md) — The fundamental hook frequently composed inside custom hooks.
- [Rules of Hooks](rules_of_hooks.md) — The architectural guidelines governing custom hook implementations.

---

## 2. Term Category

**Component Pattern (stateful logic abstraction)**: Custom Hooks are user-defined JavaScript functions that encapsulate stateful component logic, combining standard built-in hooks (`useState`, `useEffect`, `useCallback`, `useRef`) into clean, reusable abstractions. Unlike traditional utility helper functions, custom hooks have direct access to React's Fiber hook engine.

Architecturally, custom hooks allow developers to share stateful behavior across distinct UI components without altering component hierarchies or resorting to inheritance. Calling a custom hook in multiple components instantiates **isolated local state** for each component instance.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In early React applications, sharing stateful logic (such as managing window resize listeners, handling form inputs, or fetching API data with loading states) required complex patterns like **Higher-Order Components (HOCs)** or **Render Props**.

These older patterns suffered from distinct drawbacks:
- **Wrapper Hell:** Nesting multiple HOCs wrapped component trees in dozens of artificial wrapper DOM/JSX nodes.
- **Implicit Props:** Passing data via HOCs obscured where props originated, leading to naming collisions.
- **Code Duplication:** Copy-pasting `useState` and `useEffect` blocks across `<Navbar />`, `<Sidebar />`, and `<Modal />` inflated codebase size.

React introduced **Custom Hooks** to solve this. By extracting hook calls into a function starting with `use`, developers can share stateful logic as easily as calling a standard JavaScript function.

#### Rules of Custom Hooks

1. **Name Prefix:** Must start with lowercase `use` (e.g., `useNetworkStatus`, `useFetch`, `useLocalStorage`). This convention enables the React ESLint plugin to enforce the Rules of Hooks inside the function.
2. **Hook Composition:** Must invoke at least one built-in React hook (`useState`, `useEffect`, etc.).
3. **Isolated State:** Each invocation creates completely independent state variables. Component A calling `useCounter()` does NOT share counter state with Component B.

### (2) Reality Metaphor

Imagine renting a standardized toolbox for home repairs.

- **Without Custom Hooks (Buying Individual Tools):** Every homeowner buys their own hammer, tape measure, screwdriver, and electric drill separately, organizing them manually on their own workbench.
- **Custom Hook (Standardized Toolbox):** A company packages the hammer, tape measure, and drill into a single portable "Home Repair Toolbox" (`useHomeRepair`). Each homeowner rents their own independent toolbox. The tools work identically, but one homeowner driving a nail in their living room does not affect the other homeowner's wall.

### (3) React Code Examples

#### Short Snippet

```jsx
import { useState, useEffect } from 'react';

// Custom Hook encapsulating browser online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect } from 'react';

// Custom Hook for reusable API fetching with loading & error states
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (isCurrent) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [url]);

  return { data, loading, error };
}

// Component consuming the custom hook
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);

  if (loading) return <p>Loading user profile...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>Email: {user.email}</p>
    </div>
  );
}

export default UserProfile;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting the Mandatory `use` Prefix

**The mistake:** Naming a custom hook function `function fetchUserData()` instead of `function useUserData()`.

**Why it's wrong:** The React Linter relies on the `use` prefix convention to enforce the [Rules of Hooks](rules_of_hooks.md). Without the prefix, the linter treats the function as a standard utility function and fails to catch illegal conditional hook calls.

*Incorrect:*
```jsx
function getWindowDimensions() {
  const [dim, setDim] = useState({ w: window.innerWidth }); // ❌ Lacks 'use' prefix!
  return dim;
}
```

*Fix:*
```jsx
function useWindowDimensions() {
  const [dim, setDim] = useState({ w: window.innerWidth }); // ✅ Correct 'use' prefix
  return dim;
}
```

### Mistake 2: Assuming Custom Hooks Share State Across Component Instances

**The mistake:** Calling `const counter = useCounter()` in Component A and Component B expecting them to share a global counter value.

**Why it's wrong:** Custom hooks share **stateful LOGIC**, not state values! Each component instance that invokes a custom hook receives its OWN isolated state instance.

*Incorrect:*
```jsx
// Expecting Component A and Component B to share custom hook state values automatically
```

*Fix:*
```jsx
// Use Context API or global store if shared state across instances is required
```

### Mistake 3: Returning Inline Objects Without Memoization in Custom Hooks

**The mistake:** Returning `return { data, updateData }` from a custom hook where `updateData` is an un-memoized inline function.

**Why it's wrong:** Consuming components that include the returned custom hook function in `useEffect` dependency arrays will suffer from infinite rendering loops due to changing function references.

*Incorrect:*
```jsx
function useForm(initial) {
  const [values, setValues] = useState(initial);
  const reset = () => setValues(initial); // ❌ New reference every render!
  return { values, reset };
}
```

*Fix:*
```jsx
function useForm(initial) {
  const [values, setValues] = useState(initial);
  const reset = useCallback(() => setValues(initial), [initial]); // ✅ Stable reference
  return { values, reset };
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Stream Custom Hook

**Scenario:** An industrial IoT dashboard displays telemetry for chemical reactors. Create a custom hook `useReactorTelemetry(reactorId)` that manages WebSocket streaming, returning `{ telemetry, isConnected }`.

**Requirements:**
1. Custom hook named `useReactorTelemetry`.
2. Connect to WebSocket matching `reactorId`.
3. Return `{ telemetry, isConnected }` object.
4. Provide safe socket teardown on unmount or `reactorId` change.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { useState, useEffect } from 'react';
> 
> export function useReactorTelemetry(reactorId) {
>   const [telemetry, setTelemetry] = useState(null);
>   const [isConnected, setIsConnected] = useState(false);
> 
>   useEffect(() => {
>     let active = true;
>     const ws = new WebSocket(`wss://telemetry.factory.com/reactors/${reactorId}`);
> 
>     ws.onopen = () => {
>       if (active) setIsConnected(true);
>     };
> 
>     ws.onmessage = (event) => {
>       if (active) {
>         setTelemetry(JSON.parse(event.data));
>       }
>     };
> 
>     ws.onclose = () => {
>       if (active) setIsConnected(false);
>     };
> 
>     return () => {
>       active = false;
>       ws.close();
>     };
>   }, [reactorId]);
> 
>   return { telemetry, isConnected };
> }
> ```
>
> #### Technical Explanation
> 1. **Logic Encapsulation**: WebSocket management is cleanly abstracted away from UI component JSX.
> 2. **Lifecycle Safety**: Effect teardown closes sockets when `reactorId` updates.
> 3. **Isolated Instance**: Consuming components receive dedicated telemetry state channels.
> 4. **Standard Naming**: `use` prefix guarantees linter rule enforcement.
> 
### Exercise 2: Financial Order Book Debounced Search Hook

**Scenario:** A stock trading desk inputs ticker queries. Create a custom hook `useDebouncedValue(value, delay)` to prevent spamming search queries on every keystroke.

**Requirements:**
1. Custom hook `useDebouncedValue(value, delay)`.
2. Maintain local `debouncedValue` state.
3. Update `debouncedValue` after specified `delay` using `setTimeout`.
4. Clean up timers on `value` or `delay` updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { useState, useEffect } from 'react';
> 
> export function useDebouncedValue(value, delay = 300) {
>   const [debouncedValue, setDebouncedValue] = useState(value);
> 
>   useEffect(() => {
>     const handler = setTimeout(() => {
>       setDebouncedValue(value);
>     }, delay);
> 
>     return () => {
>       clearTimeout(handler);
>     };
>   }, [value, delay]);
> 
>   return debouncedValue;
> }
> ```
>
> #### Technical Explanation
> 1. **Timer Teardown**: `clearTimeout` cancels pending state updates when fast typing occurs.
> 2. **Generic Abstraction**: Custom hook can debounce any value type across the application.
> 3. **Pure State Isolation**: Operates independently of consuming component UI logic.
> 4. **Declarative Output**: Returns stable debounced scalars for API queries.
> 
### Exercise 3: E-Commerce Session Storage Persisted State Hook

**Scenario:** An e-commerce checkout flow persists user selections in browser `sessionStorage`. Create a custom hook `useSessionStorage(key, initialValue)` behaving like `useState`.

**Requirements:**
1. Custom hook returning `[storedValue, setStoredValue]`.
2. Read initial value from `sessionStorage` fallback to `initialValue`.
3. Update `sessionStorage` whenever `storedValue` updates.
4. Support functional state updater callbacks.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { useState, useEffect, useCallback } from 'react';
> 
> export function useSessionStorage(key, initialValue) {
>   const [storedValue, setStoredValue] = useState(() => {
>     try {
>       const item = sessionStorage.getItem(key);
>       return item ? JSON.parse(item) : initialValue;
>     } catch {
>       return initialValue;
>     }
>   });
> 
>   useEffect(() => {
>     try {
>       sessionStorage.setItem(key, JSON.stringify(storedValue));
>     } catch (err) {
>       console.error('SessionStorage set failed', err);
>     }
>   }, [key, storedValue]);
> 
>   return [storedValue, setStoredValue];
> }
> ```
>
> #### Technical Explanation
> 1. **Lazy Initialization**: `useState(() => ...)` reads `sessionStorage` synchronously during initial render.
> 2. **Automatic Synchronization**: `useEffect` persists updates whenever `storedValue` shifts.
> 3. **Array Tuple Return**: Matches standard `useState` signature conventions.
> 4. **Error Resiliency**: `try/catch` guards prevent crashes in restricted iframe browser environments.
> 
---

## 6. Related Terms

- [Rules of Hooks](rules_of_hooks.md) — The architectural laws governing custom hook invocations.
- [`useEffect` Hook](../level_03/use_effect.md) — Built-in hook composed within custom hooks.
- [`useState` Hook](../level_02/use_state.md) — Built-in state primitive composed within custom hooks.
- [Higher-Order Components (HOC)](../level_07/hoc.md) — Legacy pattern replaced by custom hooks.

---

## 7. Key Takeaways

- Custom Hooks extract stateful logic into reusable JavaScript functions starting with `use`.
- They allow sharing stateful behavior without modifying component tree hierarchies.
- Custom Hooks share stateful *logic*, NOT state *values* (each call creates isolated local state).
- Always prefix custom hooks with `use` so linters can enforce Rules of Hooks.
- Return tuples `[state, setter]` or objects `{ data, loading }` tailored for consuming components.
```

---

## File 2: `knowledge-base/06-react/terms/level_04/forward_ref.md`

```markdown
