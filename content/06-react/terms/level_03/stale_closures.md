# Stale Closures

> **Level 3 — Component Lifecycle & Effects**
> Effects/callbacks capturing an old value because a dependency was omitted.

---

## 1. Prerequisites
- [`useEffect` Hook](../level_03/use_effect.md) — The hook where stale closures commonly manifest.
- [Dependency Array](../level_03/dependency_array.md) — The array used to refresh closure snapshots.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, a **Closure** is a function that retains access to variables declared in its outer scope, even after the outer function has finished executing. 

Because React functional components execute on every render, state and prop variables are re-created on each render cycle as constant snapshots.

If a component defines a long-lived callback (such as a `setTimeout`, a `setInterval`, or a `useEffect` callback) and that callback references a state variable, it closes over the state snapshot from the render cycle in which the callback was created.

If the state updates later and the callback runs afterward, the callback **still references the old state snapshot** from the earlier render cycle. This is a **Stale Closure**:
-   The closure is out of sync with the current state of the application.
-   This issue is the primary reason React uses the **Dependency Array**. The array tells React: *"Re-create this callback and run the effect again if any watched variable changes,"* refreshing the closure with new variable snapshots.

---

### (2) Reality Metaphor
Imagine a whiteboard in your kitchen.
- **The State (The Whiteboard):** You write your shopping list on the board. You update it regularly.
- **The Closure (A Photo of the Board):** On Monday, you take a photo of the whiteboard (**the callback is created**). The photo shows: *"Buy 1 Apple."*
- **Stale Closure (Shopping from the Photo):** On Wednesday, you update the whiteboard to read: *"Buy 5 Bananas."* On Thursday, you go shopping. Instead of looking at the whiteboard, you look only at the photo from Monday. You buy 1 Apple. The photo captured a snapshot of the whiteboard at a specific moment; it does not update to reflect subsequent changes. Your reference is stale.

---

### (3) Code Examples

#### 1. The Stale Closure Bug (Vulnerable Code)
```javascript
import React, { useState, useEffect } from 'react';

function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // BUG: count is locked at 0 because the closure is stale!
      setCount(count + 1); 
    }, 1000);
    
    return () => clearInterval(id);
    // Empty dependency array: the effect callback is never refreshed!
  }, []); 

  return <h1>Count: {count}</h1>; // Stays stuck at 1!
}
```

#### 2. The Fix (Using the State Updater Function)
You can avoid reading the state variable from the closure by passing an updater callback function to the state setter, which receives the latest state value dynamically:
```javascript
// GOOD: updater reads current state directly, bypassing closure scopes
useEffect(() => {
  const id = setInterval(() => {
    setCount(prevCount => prevCount + 1); // Reads latest value in memory
  }, 1000);
  
  return () => clearInterval(id);
}, []);
```

#### 3. The Fix (Refreshing the Dependency Array)
```javascript
// GOOD: Re-creates the effect whenever count updates, keeping closures fresh
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  
  return () => clearInterval(id);
}, [count]); // Re-runs on every update
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting referenced state variables from the dependency array to prevent effect re-runs

**The mistake:** Excluding a state variable from the dependency array because you want the effect to run only once (on mount), despite reading that variable inside the effect:

```javascript
const [user, setUser] = useState(null);

useEffect(() => {
  console.log(`Current user status: ${user?.status}`); // Reads user state
  // ... perform some logic ...
}, []); // BAD: Empty dependency array causes user references to stay stale!
```

**Why it's wrong:** If the `user` state updates later, any logic inside this effect will run with a `user` value of `null`, introducing bugs.

*Fix:* Always list every reactive variable (props, state, or derived variables) referenced inside your effect in the dependency array. If you want to bypass re-runs, refactor the code to use the updater pattern or a `useRef` reference container.

---



### Mistake 2: Capturing Stale State inside Long-Lived Timer Callbacks (`setInterval`)

**The mistake:** Calling `setInterval(() => setCount(count + 1), 1000)` inside `useEffect` with `[]` dependency array.

**Why it's wrong:** The timer closure captures the initial `count` constant value (`0`) at mount time. Every second, it evaluates `setCount(0 + 1)`, causing `count` to get stuck at `1` forever! Use functional updaters `setCount(c => c + 1)`.

*Incorrect:*
```javascript
useEffect(() => {
  const id = setInterval(() => { setCount(count + 1); }, 1000); // ❌ count is stale!
  return () => clearInterval(id);
}, []);
```

*Fix:*
```javascript
useEffect(() => {
  const id = setInterval(() => { setCount(c => c + 1); }, 1000); // Functional update avoids closure
  return () => clearInterval(id);
}, []);
```

### Mistake 3: Omitting Event Handler Callback Dependencies from `useCallback`

**The mistake:** Creating `const handleClick = useCallback(() => console.log(user.name), []);` with empty dependency array.

**Why it's wrong:** Omitting `user` from `useCallback` dependencies locks the closure onto the initial `user` object snapshot, logging outdated user data on subsequent clicks.

*Incorrect:*
```javascript
const logUser = useCallback(() => console.log(user.name), []); // ❌ Stale user closure!
```

*Fix:*
```javascript
const logUser = useCallback(() => console.log(user.name), [user]); // Includes dependency
```

## 6. Practice Exercises

### Exercise 1: Interval Sync Fix

**Problem:** The alert component below is supposed to log the latest message state after a 3-second delay, but it logs an empty string instead. Fix the bug without triggering multiple timeouts:

```jsx
// Before (Stale closure bug):
function AlertButton() {
  const [message, setMessage] = useState('');

  const handleShowAlert = () => {
    setTimeout(() => {
      alert(`Message: ${message}`);
    }, 3000);
  };

  return (
    <div>
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={handleShowAlert}>Show Alert</button>
    </div>
  );
}

// After (Refactored Solution using useRef):
import React, { useState, useRef, useEffect } from 'react';

function AlertButton() {
  const [message, setMessage] = useState('');
  
  // Use a mutable ref to store the latest value
  const messageRef = useRef('');

  // Keep ref synchronized with state updates without re-running timeouts
  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  const handleShowAlert = () => {
    setTimeout(() => {
      // Read from the mutable ref to get the latest snapshot
      alert(`Message: ${messageRef.current}`);
    }, 3000);
  };

  return (
    <div>
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={handleShowAlert}>Show Alert</button>
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Fixing Stale Closure with useRef

**Problem:** Use `useRef` to store latest state value accessible inside long-lived callback without re-subscribing.

**Expected output:**
```text
const countRef = useRef(count); useEffect(() => { countRef.current = count; }, [count]); useEffect(() => { const id = setInterval(() => console.log(countRef.current), 1000); return () => clearInterval(id); }, []);
```

> [!check]- Answer
> ```javascript
> const countRef = useRef(count);
> useEffect(() => {
>   countRef.current = count;
> }, [count]);
>
> useEffect(() => {
>   const id = setInterval(() => console.log(countRef.current), 1000);
>   return () => clearInterval(id);
> }, []);
> ```
>
> **Explanation:** `useRef` mutable container objects persist across renders, allowing callbacks to read `.current` without capturing stale closure values.

### Exercise 3: Definition of Stale Closure in React

**Problem:** Define Stale Closure in React (A closure function capturing variable state values from a previous render frame that have since updated).

**Expected output:**
```text
A closure function capturing variable state values from a previous render frame that have since updated
```

> [!check]- Answer
> ```text
> A closure function capturing variable state values from a previous render frame that have since updated
> ```
>
> **Explanation:** Stale closures occur when callbacks reference outdated variable scope snapshots.

## 7. Related Terms
- [Rules of Hooks](../../level_04/rules_of_hooks.md) — The guidelines ensuring dependencies match usage.
- [`useCallback` Hook](../../level_04/use_callback.md) — The hook for caching callback functions, prone to stale closures.

---

## 8. Key Takeaways
- A stale closure occurs when a callback retains references to old outer scope variables.
- React state updates create new constant snapshots on every render.
- Callbacks in `useEffect` close over the state from the render in which they are created.
- Empty dependency arrays prevent effects from updating, leading to stale closures.
- Resolve stale closures by adding variables to dependency arrays.
- Use state updater callbacks (`prev => prev + 1`) to update state without reading variables.
- Use `useRef` to store mutable variables that do not trigger re-renders.
