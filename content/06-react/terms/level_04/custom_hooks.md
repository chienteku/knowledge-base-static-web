# Custom Hooks

> **Level 4 — Advanced Hooks**
> Your own, personalized React Hooks. They allow you to extract complex state logic out of your components into reusable, standalone JavaScript functions.

---

## 1. Prerequisites
- [`useEffect` Hook](../level_03/use_effect.md) — Custom hooks are usually just a combination of these built-in hooks.
- [Rules of Hooks](rules_of_hooks.md) — The rules apply strictly to your custom hooks.

---

## 2. Term Category
- **React Architecture / Code Reusability**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you have a component that tracks whether the user's browser window is currently online or offline. You need `useState` to store the boolean, and `useEffect` to listen to the browser's "online" and "offline" events.
If you need this logic in the `<Navbar />`, the `<Checkout />`, and the `<VideoPlayer />` components, you would normally have to copy-paste all that `useState` and `useEffect` code three times.
**Custom Hooks** allow you to bundle that logic into a single, reusable function.

### (2) How to build one
A Custom Hook is literally just a standard JavaScript function that:
1. Starts with the word `use` (e.g., `useNetworkStatus`).
2. Calls other React Hooks inside of it.

```javascript
// useNetworkStatus.js
import { useState, useEffect } from 'react';

// 1. Starts with 'use'
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  // 2. Uses built-in hooks inside
  useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  }, []);

  // 3. Returns whatever data the component needs!
  return isOnline; 
}
```

### (3) How to use it
Now, any component in your app can use this logic with a single line of code!
```javascript
import { useNetworkStatus } from './useNetworkStatus';

function Navbar() {
  const isOnline = useNetworkStatus(); // Magic!

  return <div>{isOnline ? "🟢 Online" : "🔴 Offline"}</div>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not starting the name with "use"

**The mistake:** A developer writes a custom hook but names it `getNetworkStatus()`.

**Why it's wrong:** The React Linter enforces the [Rules of Hooks](../level_04/rules_of_hooks.md) purely based on the function name! If it doesn't start with `use`, the Linter assumes it's a normal JavaScript function. It will not warn you if you accidentally put a hook inside a `for` loop, leading to fatal crashes in production.
**Golden Rule:** Custom Hooks MUST always, without exception, start with a lowercase `use` (e.g., `useFetch`, `useAuth`, `useWindowSize`).

---



### Mistake 2: Naming Custom Hooks Without the Mandatory `use` Prefix

**The mistake:** Naming a custom hook function `function fetchUserData()` instead of `function useUserData()`.

**Why it's wrong:** React and the React ESLint plugin rely on the `use` prefix convention (e.g. `useOnlineStatus`) to enforce the Rules of Hooks (e.g. preventing hook calls inside conditions). Custom hooks without `use` bypass linting checks.

*Incorrect:*
```javascript
function getWindowSize() {
  const [size, setSize] = useState(0); // ❌ Lacks 'use' prefix!
  return size;
}
```

*Fix:*
```javascript
function useWindowSize() {
  const [size, setSize] = useState(0); // Correct 'use' prefix
  return size;
}
```

### Mistake 3: Expecting Custom Hooks to Share State Across Component Instances Automatically

**The mistake:** Assuming calling `useCounter()` in Component A and Component B shares the same counter state.

**Why it's wrong:** Custom hooks share **stateful LOGIC**, NOT state values! Each component instance that calls a custom hook receives its OWN isolated local state.

*Incorrect:*
```javascript
// Expecting Component A and Component B to share custom hook state automatically
```

*Fix:*
```javascript
Use Context API or state management store if shared state across components is required
```

## 6. Practice Exercises

### Exercise 1: State Isolation

**Problem:** The `<Navbar />` and `<Footer />` components both call `const isOnline = useNetworkStatus()`. If the Navbar somehow forcefully changes the `isOnline` state to false, does the Footer's state also change to false?

**Expected output:**
> [!check]- Answer
> ```text
> No! 
> Custom Hooks share STATEFUL LOGIC, not the STATE ITSELF.
> Every time you call a custom hook, a completely independent instance of `useState` is created for that specific component. The Navbar and Footer have completely separate state variables.
> ```
> - Calling a hook is just like calling `useState` normally in two different components.
> 
---



### Exercise 2: Creating `useOnlineStatus` Custom Hook

**Problem:** Create custom hook `useOnlineStatus()` tracking `navigator.onLine` window event listeners.

**Expected output:**
> [!check]- Answer
> ```text
> function useOnlineStatus() { const [isOnline, setIsOnline] = useState(navigator.onLine); useEffect(() => { const handleOnline = () => setIsOnline(true); const handleOffline = () => setIsOnline(false); window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline); return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); }; }, []); return isOnline; }
> ```
> ```javascript
> function useOnlineStatus() {
>   const [isOnline, setIsOnline] = useState(navigator.onLine);
>   useEffect(() => {
>     const handleOnline = () => setIsOnline(true);
>     const handleOffline = () => setIsOnline(false);
>     window.addEventListener('online', handleOnline);
>     window.addEventListener('offline', handleOffline);
>     return () => {
>       window.removeEventListener('online', handleOnline);
>       window.removeEventListener('offline', handleOffline);
>     };
>   }, []);
>   return isOnline;
> }
> ```
>
> **Explanation:** Custom hooks encapsulate stateful event listener logic into reusable functions.
> 
---

### Exercise 3: Custom Hook Return Types

**Problem:** What data types can custom hooks return? (Any data type: arrays `[state, setter]`, objects `{ data, loading }`, or primitive values).

**Expected output:**
> [!check]- Answer
> ```text
> Any data type: arrays, objects, or primitive scalar values
> ```
> ```text
> Any data type: arrays, objects, or primitive scalar values
> ```
>
> **Explanation:** Custom hooks return formatted data structures tailored for consuming components.
> 
## 7. Related Terms
- [Rules of Hooks](rules_of_hooks.md) — Why the "use" prefix is strictly enforced.
- [Components](../level_01/components.md) — The ultimate consumers of your Custom Hooks.
- [`useContext` Hook](../level_06/use_context.md) — Related concept: `useContext` Hook.
- [Higher-Order Components (HOC)](../level_07/hoc.md) — Related concept: Higher-Order Components (HOC).
- [Render Props](../level_07/render_props.md) — Related concept: Render Props.
- [TypeScript with React](../level_11/typescript_react.md) — Related concept: TypeScript with React.

---

## 8. Key Takeaways
- **Custom Hooks** allow you to extract and reuse React logic (`useState` + `useEffect`) across multiple components.
- They are just normal JavaScript functions that call other hooks.
- They MUST start with the word `use` so React can enforce the Rules of Hooks.
- Custom Hooks share the *logic*, not the *state*. Calling the hook in two different components creates two completely isolated states.
