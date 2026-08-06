# `useTransition` Hook

> **Level 8 — Performance Optimization**
> A hook to mark state updates as low-priority transitions that yield to user input.

---

## 1. Prerequisites
- [Concurrent Rendering](concurrent_rendering.md) — The engine mode that powers transitions.
- [`useState` Hook](../level_02/use_state.md) — The hook creating the states being updated.

---

## 2. Term Category
- **Core Hook**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, all state updates in React are treated as urgent. If a single user action (like typing in a search input) updates two states—the input text value and a filtered product list—both updates are scheduled at the same priority level. The browser's paint cycle is blocked until both updates complete, resulting in input lag.

To address this, React 18 introduced the **`useTransition`** hook:
-   **Split Priorities:** It allows you to separate urgent state updates (like typing in a field) from low-priority transitions (like rendering a list or changing tabs).
-   **`isPending` State:** The hook returns an `isPending` boolean, which becomes `true` while the background transition is rendering. This allows you to show inline loading spinners or dim old content, indicating to the user that work is happening.
-   **Yielding Thread:** Updates wrapped inside `startTransition` are interruptible. If a user types a new character while React is rendering the transition, React will pause, process the text update, and restart the transition using the new query.

---

### (2) Reality Metaphor
Imagine an airport security line.
- **Urgent Updates (VIP Fast Track):** User interactions that require immediate feedback (typing, clicking buttons). They are fast-tracked to the front of the queue (**rendered instantly**).
- **Transition Updates (Standard Line):** Heavy rendering tasks (charts, lists). They wait in the standard queue (**rendered in the background**).
- If a new VIP passenger arrives at security, the guard pauses the standard line (**interrupts background rendering**), processes the VIP passenger, and then resumes checking standard passengers.

---

### (3) React Code Example: Slow Tab Switcher

```jsx
import React, { useState, useTransition } from 'react';

function TabSwitcher() {
  const [tab, setTab] = useState('about');
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (nextTab) => {
    // startTransition tells React this tab render can be interrupted
    startTransition(() => {
      setTab(nextTab);
    });
  };

  return (
    <div>
      <div className="tabs">
        <button onClick={() => handleTabChange('about')}>About</button>
        <button onClick={() => handleTabChange('posts')}>Blog Posts (Slow)</button>
      </div>

      <hr />

      {/* Dim the active container while the transition renders */}
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        {tab === 'about' && <AboutTab />}
        {tab === 'posts' && <SlowPostsTab />}
      </div>
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Wrapping a text input's state value update in a transition

**The mistake:** Wrapping the state setter that controls an input field's text value inside `startTransition`:

```javascript
// BAD: Causes the input text to become laggy and out of sync with typing!
const handleChange = (e) => {
  startTransition(() => {
    setInputValue(e.target.value); 
  });
};
```

**Why it's wrong:** An input element must update its displayed value in sync with the user's keystrokes. Delaying this update breaks standard typing behavior.

*Fix:* Keep the input state update urgent. Only wrap downstream, heavier state updates (like filter lists) inside `startTransition`:

```javascript
// GOOD: Urgent input update, deferred filter list update
const handleChange = (e) => {
  setInputValue(e.target.value); // Urgent
  
  startTransition(() => {
    setFilterQuery(e.target.value); // Low priority
  });
};
```

---



### Mistake 2: Wrapping Synchronous Controlled Form Input State Updates inside `startTransition`

**The mistake:** Wrapping input typing state `startTransition(() => setInputValue(e.target.value))`.

**Why it's wrong:** Controlled input state updates MUST be urgent! Marking input typing as a transition causes input typing latency and caret jump bugs. Keep input state updates urgent.

*Incorrect:*
```javascript
onChange={e => {
  startTransition(() => setInputText(e.target.value)); // ❌ Input lag!
}}
```

*Fix:*
```javascript
onChange={e => {
  setInputText(e.target.value); // Urgent typing update
  startTransition(() => setFilterList(e.target.value)); // Non-urgent transition
}}
```

### Mistake 3: Executing Asynchronous Operations inside `startTransition` Callbacks (React 18 vs 19)

**The mistake:** Executing `startTransition(async () => { await apiCall(); setVal(1); })` in React 18.

**Why it's wrong:** In React 18, `startTransition` callbacks MUST be strictly synchronous! Passing async functions to `startTransition` in React 18 breaks transition tracking. (React 19 Server Actions expand async transition support).

*Incorrect:*
```javascript
startTransition(async () => { await fetch(); setData(x); }); // ❌ Async in React 18 startTransition!
```

*Fix:*
```javascript
const data = await fetch(); startTransition(() => setData(data)); // Sync dispatch in React 18
```

## 6. Practice Exercises

### Exercise 1: Implementing Transitions

**Problem:** Complete the component below to make the search results update non-blocking, so that typing in the input field remains responsive:

```jsx
import React, { useState, useTransition } from 'react';

function SearchResults() {
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('');
  
  // Solution:
  const [isPending, startTransition] = useTransition();

  const handleType = (e) => {
    setInput(e.target.value); // Urgent update

    startTransition(() => {
      setFilter(e.target.value); // Non-blocking update
    });
  };

  return (
    <div>
      <input value={input} onChange={handleType} />
      {isPending && <p>Searching...</p>}
      <HeavyList query={filter} />
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Tab Switching with useTransition

**Problem:** Use `useTransition` to mark non-urgent tab switching state update and display loading indicator via `isPending`.

**Expected output:**
> [!check]- Answer
> ```text
> function Tabs() { const [tab, setTab] = useState('home'); const [isPending, startTransition] = useTransition(); const selectTab = nextTab => { startTransition(() => setTab(nextTab)); }; return <> <button onClick={() => selectTab('heavy')}>{isPending ? 'Loading...' : 'Heavy Tab'}</button> {tab === 'heavy' && <HeavyTab />} <>; }
> ```
> ```javascript
> function Tabs() {
>   const [tab, setTab] = useState('home');
>   const [isPending, startTransition] = useTransition();
>   const selectTab = nextTab => {
>     startTransition(() => {
>       setTab(nextTab);
>     });
>   };
>   return (
>     <>
>       <button onClick={() => selectTab('heavy')}>
>         {isPending ? 'Loading...' : 'Heavy Tab'}
>       </button>
>       {tab === 'heavy' && <HeavyTab />}
>     </>
>   );
> }
> ```
>
> **Explanation:** `useTransition` marks tab state updates as non-blocking transitions while providing `isPending` status.
> 
---

### Exercise 3: useTransition Hook Signature

**Problem:** What tuple does `const [isPending, startTransition] = useTransition()` return? (Boolean `isPending` status and `startTransition(callback)` function).

**Expected output:**
> [!check]- Answer
> ```text
> Boolean isPending status and startTransition(callback) function
> ```
> ```text
> Boolean isPending status and startTransition(callback) function
> ```
>
> **Explanation:** `isPending` indicates whether a background transition render is currently in progress.
> 
## 7. Related Terms
- [Concurrent Rendering](concurrent_rendering.md) — The rendering mode that supports transitions.
- [`useDeferredValue` Hook](use_deferred_value.md) — Deferring updates when you do not control the state setter.
- [Suspense](suspense.md) — Related concept: Suspense.

---

## 8. Key Takeaways
- `useTransition` splits state updates into high and low priority.
- Low-priority updates are interruptible, preventing UI freeze.
- `isPending` indicates when a transition is rendering in the background.
- Do not wrap input value states inside transitions.
- Wrap only slow, secondary updates (like data lists or page tabs) inside `startTransition`.
- Third-party state setters can also be wrapped inside transitions.
