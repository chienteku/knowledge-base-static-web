# `useLayoutEffect` Hook

> **Level 3 — Component Lifecycle & Effects**
> The synchronous sibling of `useEffect` that fires after DOM mutations but before the browser paints the screen.

---

## 1. Prerequisites
- [`useEffect` Hook](use_effect.md) — The asynchronous counterpart to this hook.
- [Component Lifecycle](component_lifecycle.md) — The rendering stages where effects are scheduled.

---

## 2. Term Category
- **Core Hook**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard `useEffect` callbacks run **asynchronously after** React has committed changes to the DOM and yielded control back to the browser. This is ideal for most side effects (like data fetching) because it does not block the browser's paint cycle, keeping the page responsive.

However, a challenge arises when an effect needs to measure the layout of a DOM element (such as its width or height) and use those dimensions to position another element (like a tooltip or popup) before the screen is updated:

If you use `useEffect` for this:
1.  React renders the tooltip at its default initial position (e.g. at coordinates `0, 0`).
2.  The browser paints the tooltip on the screen at `0, 0`. The user sees the tooltip flash at the top-left corner.
3.  Immediately after the paint, `useEffect` runs, measures the DOM node, calculates the correct positioning, and updates state.
4.  React re-renders the component and updates the DOM.
5.  The browser paints the tooltip in the correct position.

This process causes a noticeable **visual flicker** as the element jumps from its default position to its corrected position.

To prevent this, React provides **`useLayoutEffect`**:
-   **Synchronous Execution:** `useLayoutEffect` fires **synchronously** after React has modified the DOM, but **before** the browser paints the screen.
-   **Flicker Elimination:** React pauses the browser's paint cycle, executes the code inside `useLayoutEffect`, calculates any state changes, and applies them to the DOM. The browser then paints the final layout in a single pass. The user only sees the tooltip at its correct position.

---

### (2) Execution Order Comparison

```text
React Render ➔ DOM Mutated ➔ useLayoutEffect runs (Sync) ➔ Browser Paint ➔ useEffect runs (Async)
```

---

### (3) Reality Metaphor
Imagine setting up a theater play stage.
- **`useEffect` (Curtains Open First):** The stage crew opens the curtains (browser paint). The audience sees a table sitting in the middle of the stage. The crew then walks out in front of the audience, measures the distance, moves the table 5 feet to the left, and walks off. The audience saw the table jump (**visual flicker**).
- **`useLayoutEffect` (Behind the Curtains):** The stage crew keeps the curtains closed. They walk onto the dark stage, measure the distance, move the table to its correct position, and exit. Only then do they open the curtains. The audience only ever sees the table in its correct position.

---

### (4) Code Example: Positioning a Tooltip

```jsx
import React, { useState, useLayoutEffect, useRef } from 'react';

function Tooltip({ buttonRef, text }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  // useLayoutEffect is required here to prevent tooltip positioning flicker!
  useLayoutEffect(() => {
    if (!buttonRef.current || !tooltipRef.current) return;

    // 1. Measure the dimensions of the trigger button and the tooltip
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    // 2. Calculate the correct positioning coordinates
    const calculatedTop = buttonRect.top - tooltipRect.height - 10;
    const calculatedLeft = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2;

    // 3. Update state synchronously before paint occurs
    setPosition({
      top: calculatedTop,
      left: calculatedLeft
    });
  }, [buttonRef]);

  return (
    <div 
      ref={tooltipRef}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        background: 'black',
        color: 'white',
        padding: '5px'
      }}
    >
      {text}
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `useLayoutEffect` for standard asynchronous side effects

**The mistake:** Placing data fetching queries, timeouts, or state updates that do not impact layout styling inside a `useLayoutEffect` block:

```javascript
// BAD: Blocks browser painting while waiting for network requests!
useLayoutEffect(() => {
  fetch('/api/user').then(res => setData(res));
}, []);
```

**Why it's wrong:** Because `useLayoutEffect` runs synchronously, it **blocks** the browser from painting the screen until its execution is complete. Placing slow operations or API queries inside it will cause the browser to freeze, degrading the user experience.

*Fix:* Use `useEffect` for all standard side effects (data fetching, state updates, event listeners). Only use `useLayoutEffect` when you are measuring DOM dimensions or applying styles that must render immediately.

---



### Mistake 2: Using `useLayoutEffect` for Data Fetching or Async Network Operations

**The mistake:** Fetching API data inside `useLayoutEffect`.

**Why it's wrong:** `useLayoutEffect` runs SYNCHRONOUSLY before the browser paints the screen! Performing heavy calculations or blocking calls inside `useLayoutEffect` delays browser layout and paints, freezing the UI. Use `useEffect` for data fetching.

*Incorrect:*
```javascript
useLayoutEffect(() => {
  fetchData().then(setData); // ❌ Blocks browser paint!
}, []);
```

*Fix:*
```javascript
useEffect(() => {
  fetchData().then(setData); // Non-blocking paint execution
}, []);
```

### Mistake 3: Ignoring Server-Side Rendering (SSR) Warnings with `useLayoutEffect`

**The mistake:** Using `useLayoutEffect` in Next.js / SSR applications without checks.

**Why it's wrong:** `useLayoutEffect` cannot execute on the server (no DOM exists), triggering Next.js SSR warnings `useLayoutEffect does nothing on the server`. Use `useEffect` or check `typeof window !== 'undefined'`.

*Incorrect:*
```javascript
// Using useLayoutEffect in SSR components without window checks
```

*Fix:*
```javascript
Use useEffect for SSR components or fallback to useEffect on server
```

## 6. Practice Exercises

### Exercise 1: Hook Selection

**Problem:** Review the development scenarios below and select whether you should use `useEffect` or `useLayoutEffect`:

1.  Fetching a list of comments from a database API.
    *   **Answer:** `useEffect` (asynchronous, does not block paint).
2.  Adjusting the scroll position of a chat window when a new message arrives to prevent jumpiness.
    *   **Answer:** `useLayoutEffect` (synchronous, prevents layout jumps).
3.  Logging a page view event to an analytics server.
    *   **Answer:** `useEffect` (non-visual side effect).
4.  Measuring the height of a collapsable header to set its CSS transition height.
    *   **Answer:** `useLayoutEffect` (requires DOM layout measurements).

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Measuring DOM Dimensions with useLayoutEffect

**Problem:** Measure tooltip DOM `getBoundingClientRect()` inside `useLayoutEffect` to position it before browser paint.

**Expected output:**
> [!check]- Answer
> ```text
> useLayoutEffect(() => { const rect = ref.current.getBoundingClientRect(); setCoords({ width: rect.width, height: rect.height }); }, []);
> ```
> ```javascript
> useLayoutEffect(() => {
>   const rect = ref.current.getBoundingClientRect();
>   setCoords({ width: rect.width, height: rect.height });
> }, []);
> ```
>
> **Explanation:** `useLayoutEffect` reads and mutates DOM geometry synchronously before the screen is painted, preventing visual flicker.

---

### Exercise 3: useEffect vs useLayoutEffect Timing Comparison

**Problem:** Compare: `useEffect` (Runs asynchronously AFTER browser paint); `useLayoutEffect` (Runs synchronously BEFORE browser paint).

**Expected output:**
> [!check]- Answer
> ```text
> useEffect: runs asynchronously after paint; useLayoutEffect: runs synchronously before paint
> ```
> ```text
> useEffect: runs asynchronously after paint; useLayoutEffect: runs synchronously before paint
> ```
>
> **Explanation:** Use `useLayoutEffect` only when reading/mutating DOM layout measurements to prevent UI flickering.

## 7. Related Terms
- [`useEffect` Hook](use_effect.md) — The standard asynchronous hook for side effects.
- [`useRef` Hook](../level_04/use_ref.md) — The hook used to reference DOM nodes for layout measurement.

---

## 8. Key Takeaways
- `useLayoutEffect` runs synchronously after DOM updates, but before browser paint.
- It prevents visual flicker by scheduling updates before the screen is updated.
- Use it to measure DOM node dimensions or position elements dynamically (tooltips, popups).
- Do not use it for API queries or data fetching, as it blocks the browser paint cycle.
- Avoid using it in server-side rendered (SSR) contexts, as it triggers console warnings (use standard `useEffect` instead).
