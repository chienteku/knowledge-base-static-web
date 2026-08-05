# Automatic Batching

> **Level 2 — State & Reactivity**
> React grouping multiple `setState` calls into one re-render (why state updates look asynchronous).

---

## 1. Prerequisites
- [State](state.md) — The variables being modified.
- [Re-rendering](re_rendering.md) — The UI update cycle triggered by state changes.
- [`useState` Hook](use_state.md) — The hook used to trigger state updates.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In interactive web applications, a single user interaction (like clicking a button) often triggers multiple state updates. For example, submitting a form might require you to:
1.  Set `setLoading(true)`
2.  Set `setFormData(data)`
3.  Set `setError(null)`

If React re-rendered the component immediately for every individual state setter call, this form submission would trigger three independent, sequential re-renders of the component tree. This would cause performance degradation and visual glitches, where the screen momentarily flashes partial states.

To prevent this, React uses **Batching**:
-   **Batching:** React groups multiple state updates into a single re-render. Instead of updating the DOM on every `setState` call, React collects all updates inside an event loop execution cycle and processes them together in one render pass.
-   **Automatic Batching (React 18):** In React 17 and earlier, batching only worked inside React's own event handlers (such as `onClick`). If you updated multiple states inside a `fetch()` promise response, a `setTimeout` callback, or a native DOM event listener, React would not batch them, executing multiple renders instead.
-   In React 18, React automatically batches all updates, regardless of where they originate (promises, timeouts, native event handlers, or hooks).

---

### (2) Reality Metaphor
Imagine sending letters to the post office.
- **Without Batching (One trip per letter):** You write a letter, drive to the post office to mail it, and drive home. You write a second letter, drive back to the post office, and drive home. You make three separate trips, wasting time and gas (**consuming CPU cycles and rendering resources**).
- **With Batching (Outgoing Mail Tray):** You write all three letters and place them in an outgoing tray on your desk (**scheduling updates**). At the end of the day, a courier picks up all three letters and delivers them to the post office together in a single trip (**one re-render**).

---

### (3) Code Examples

#### 1. Automatic Batching inside an Asynchronous Callback (React 18)
```javascript
import React, { useState } from 'react';

function UserApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = () => {
    setLoading(true); // Render 1 (Standard event handler batching)
    
    fetch('/api/user/1')
      .then(res => res.json())
      .then(data => {
        // React 18 automatically batches both updates below:
        setUser(data);
        setLoading(false);
        // Only 1 re-render occurs here instead of 2!
      });
  };

  console.log("Component Rendered!"); // Logs once for the click, once for the fetch resolve
  return <button onClick={handleFetch}>Load User</button>;
}
```

#### 2. Opting Out of Batching with `flushSync`
In rare cases (e.g., when you need to read a DOM measurement immediately after a state update), you can force React to update the DOM synchronously using `flushSync`:
```javascript
import { flushSync } from 'react-dom';

function toggleActive() {
  // Forces React to update the DOM immediately
  flushSync(() => {
    setActive(prev => !prev);
  });
  // DOM is guaranteed to be updated at this line!
  readNewDOMDimensions(); 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to read state immediately after calling its setter function

**The mistake:** Expecting a state variable to contain the newly updated value on the line immediately following the setter call:

```javascript
const [count, setCount] = useState(0);

const increment = () => {
  setCount(count + 1);
  console.log(count); // BAD: Logs 0, NOT 1!
};
```

**Why it's wrong:** Because React batches and schedules updates asynchronously, the `count` variable remains a constant value representing the *current* render cycle. The new value does not exist until the component executes its next render cycle.

*Fix:* If you need to use the calculated value immediately, assign it to a local variable first, or listen to the state change using `useEffect`:

```javascript
// GOOD: Uses a local variable for immediate logic
const newCount = count + 1;
setCount(newCount);
console.log(newCount); // Logs 1
```

---



### Mistake 2: Assuming Promises or Async Event Handlers Require Manual Batching in React 18+

**The mistake:** Wrapping state updates inside `ReactDOM.unstable_batchedUpdates()` inside async `fetch` callbacks in React 18+.

**Why it's wrong:** React 18 automatically batches ALL state updates regardless of origin (promises, `setTimeout`, native event handlers). Manual batching functions are obsolete.

*Incorrect:*
```javascript
fetch().then(() => {
  ReactDOM.unstable_batchedUpdates(() => { setCount(c => c + 1); setFlag(true); });
});
```

*Fix:*
```javascript
fetch().then(() => {
  setCount(c => c + 1); // Automatically batched in React 18+
  setFlag(true);
});
```

### Mistake 3: Expecting State Variable Values to Update Synchronously Immediately After Calling `setState`

**The mistake:** Calling `setCount(count + 1); console.log(count);` expecting `console.log` to print the new incremented value.

**Why it's wrong:** `setState` queues a state update for the NEXT render. The current local `count` variable constant remains unchanged until the next component render.

*Incorrect:*
```javascript
const handleClick = () => {
  setCount(count + 1);
  console.log(count); // ❌ Logs OLD value of count!
};
```

*Fix:*
```javascript
const handleClick = () => {
  const nextCount = count + 1;
  setCount(nextCount);
  console.log(nextCount); // Log updated value
};
```

## 6. Practice Exercises

### Exercise 1: Counting Renders

**Problem:** How many times will the console log `"Rendered!"` when the button is clicked in React 18?

```jsx
import React, { useState } from 'react';

function RenderCounter() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);

  const handleClick = () => {
    setTimeout(() => {
      setA(prev => prev + 1);
      setB(prev => prev + 1);
      setA(prev => prev + 1);
    }, 100);
  };

  console.log("Rendered!");
  return <button onClick={handleClick}>Trigger</button>;
}
```

> [!check]- Answer
> - Exactly **1 time** (excluding the initial render). Because of Automatic Batching in React 18, all three state updates inside the `setTimeout` callback are grouped and executed in a single re-render.


---



### Exercise 2: Opting Out of Automatic Batching with `flushSync`

**Problem:** Opt out of automatic batching to synchronously update DOM scroll position using `flushSync` from `react-dom`.

**Expected output:**
> [!check]- Answer
> ```text
> import { flushSync } from 'react-dom'; flushSync(() => { setIsOpen(true); }); listRef.current.scrollTop = 0;
> ```
> ```javascript
> import { flushSync } from 'react-dom';
>
> flushSync(() => {
>   setIsOpen(true);
> });
> // DOM is updated synchronously right here!
> listRef.current.scrollTop = 0;
> ```
>
> **Explanation:** `flushSync()` forces React to flush state updates synchronously to the DOM immediately.

---

### Exercise 3: Automatic Batching Render Counts

**Problem:** In React 18, how many re-renders occur when calling `setA(1)`, `setB(2)`, `setC(3)` inside a `setTimeout` callback? (1 single batched re-render).

**Expected output:**
> [!check]- Answer
> ```text
> 1 single batched re-render
> ```
> ```text
> 1 single batched re-render
> ```
>
> **Explanation:** Automatic batching groups all state updates within a microtask into a single re-render.

## 7. Related Terms
- [Re-rendering](re_rendering.md) — The UI update cycle triggered by state changes.
- [`useState` Hook](use_state.md) — The hook used to define and trigger state updates.

---

## 8. Key Takeaways
- Batching groups multiple state updates into a single render pass.
- It prevents unnecessary intermediate renders, improving application performance.
- React 18 automatically batches all updates, including those in promises, timeouts, and native handlers.
- State setter updates do not mutate the local variable immediately; state updates are applied asynchronously.
- Use `flushSync` to force synchronous DOM updates when reading layout dimensions is required.
