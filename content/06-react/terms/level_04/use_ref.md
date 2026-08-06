# `useRef` Hook

> **Level 4 — Advanced Hooks**
> A core hook that returns a mutable reference object whose `.current` property persists across renders without triggering component re-renders.

---

## 1. Prerequisites

- [`useState` Hook](../level_02/use_state.md) — The reactive counterpart to `useRef` that triggers UI re-renders on change.
- [Re-rendering](../level_02/re_rendering.md) — The component execution cycle intentionally bypassed by `useRef`.

---

## 2. Term Category

**Core Hook (mutable instance reference)**: `useRef` is React's built-in hook for storing mutable values that persist across component render cycles without triggering a re-render when mutated. Calling `useRef(initialValue)` returns a plain JavaScript object with a single mutable property: `{ current: initialValue }`.

Architecturally, `useRef` serves two primary roles:
1. **Persistent Silent State:** Holding background variables (timer IDs, previous prop snapshots, connection states) that do not impact visual JSX layout.
2. **Imperative DOM Access:** Holding direct references to real browser DOM elements (e.g. for input focusing, media playback, or DOM layout measurement).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In React, updating `useState` notifies React to schedule a component re-render.

However, components often need to track data that does NOT affect visual markup:
- Storing a `setInterval` handle ID to clear timers later.
- Storing an `AbortController` instance.
- Counting how many times a component has re-rendered for telemetry audit logs.

If you store a timer ID in `useState`, calling `setTimerId()` triggers an unnecessary re-render pass, wasting performance.

Furthermore, certain DOM actions are inherently imperative: auto-focusing an input, scrolling a chat window, or invoking HTML5 `<video>.play()`. Declarative JSX state cannot invoke imperative browser DOM methods directly.

React introduced **`useRef`** as an escape hatch for both problems:
- Direct mutations to `ref.current` persist silently across renders **without triggering re-renders**.
- Attaching `ref={myRef}` to a JSX element populates `myRef.current` with the underlying browser DOM element node.

#### `useState` vs `useRef` Comparison

| Feature | `useState` | `useRef` |
| :--- | :--- | :--- |
| **Triggers Re-render on Mutation?** | **YES** | **NO** |
| **Immutability Requirement?** | **YES** (Must call setter) | **NO** (Mutate `.current` directly) |
| **Primary Use Case** | Visual UI Data | DOM Nodes / Background Silent Data |

### (2) Reality Metaphor

Imagine a sports referee during a football match.

- **`useState` (The Stadium Scoreboard):** When a team scores, the referee signals the stadium operator to update the large electronic scoreboard. Every spectator in the stadium looks up and sees the new score (**triggers visual re-render**).
- **`useRef` (The Referee's Pocket Notebook):** The referee notes infractions, yellow cards, and exact match elapsed seconds in a small pocket notebook (**mutating `.current`**). Spectators do not see the notebook, and writing in it does not stop play or update the scoreboard (**silent persistence without re-rendering**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useRef } from 'react';

function SilentClickTracker() {
  const clickCount = useRef(0);

  const handleClick = () => {
    // ✅ Mutate .current directly without triggering a re-render
    clickCount.current += 1;
    console.log(`Button clicked ${clickCount.current} times silently`);
  };

  return <button onClick={handleClick}>Click Silently</button>;
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect, useRef } from 'react';

function Stopwatch() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Silent reference container holding background interval ID
  const timerRef = useRef(null);

  const startTimer = () => {
    if (isRunning) return;
    setIsRunning(true);
    // Store interval handle in ref without triggering extra re-renders
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    stopTimer();
    setSeconds(0);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="stopwatch-card">
      <h3>Elapsed: {seconds}s</h3>
      <div className="button-group">
        <button onClick={startTimer} disabled={isRunning}>Start</button>
        <button onClick={stopTimer} disabled={!isRunning}>Stop</button>
        <button onClick={resetTimer}>Reset</button>
      </div>
    </div>
  );
}

export default Stopwatch;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to Render `ref.current` in Visual JSX Markup

**The mistake:** Displaying `ref.current` in JSX expecting the screen to update when `ref.current` changes: `<div>Score: {scoreRef.current}</div>`.

**Why it's wrong:** Mutating `ref.current` does NOT trigger a re-render! The UI on screen will remain stuck displaying stale initial values.

*Incorrect:*
```jsx
const countRef = useRef(0);
const increment = () => { countRef.current += 1; }; // ❌ UI will NOT update on screen!
return <div onClick={increment}>Score: {countRef.current}</div>;
```

*Fix:*
```jsx
const [count, setCount] = useState(0);
const increment = () => { setCount(c => c + 1); }; // ✅ UI updates on screen
return <div onClick={increment}>Score: {count}</div>;
```

### Mistake 2: Reading or Mutating `ref.current` Directly Inside Component Render Bodies

**The mistake:** Writing `myRef.current = count + 1` directly in the component function body.

**Why it's wrong:** Reading or writing `ref.current` during rendering breaks render purity and violates Concurrent Mode guidelines. Mutate `ref.current` ONLY inside `useEffect` or event handlers.

*Incorrect:*
```jsx
function BadComponent() {
  const renderCount = useRef(0);
  renderCount.current += 1; // ❌ Impure mutation during render!
  return <div>Renders: {renderCount.current}</div>;
}
```

*Fix:*
```jsx
function GoodComponent() {
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1; // ✅ Safe mutation inside effect
  });
  return <div>Component</div>;
}
```

### Mistake 3: Expecting `ref.current` Mutations to Trigger `useEffect` Runs

**The mistake:** Passing a `ref` object to a `useEffect` dependency array `[myRef.current]` expecting the effect to run when `myRef.current` updates.

**Why it's wrong:** Mutating `myRef.current` is a plain JavaScript property assignment. React does not detect property mutations, so `useEffect` will NOT fire.

*Incorrect:*
```jsx
const myRef = useRef(0);
useEffect(() => {
  console.log('Ref updated!'); // ❌ Will NOT fire when myRef.current changes
}, [myRef.current]);
```

*Fix:*
```jsx
// Use useState if updates must trigger effects or re-renders
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Search Auto-Focuser

**Scenario:** An industrial IoT sensor console displays a search bar for device IDs. When an operator opens the search modal, automatically focus the `<input>` element using `useRef`.

**Requirements:**
1. Reference search `<input>` element with `useRef`.
2. Trigger `.focus()` inside `useEffect` on modal mount.
3. Bind `ref` prop to JSX `<input>`.
4. Render accessible search input.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect, useRef } from 'react';
> 
> export function SensorSearchModal({ isOpen }) {
>   const inputRef = useRef(null);
> 
>   useEffect(() => {
>     if (isOpen && inputRef.current) {
>       inputRef.current.focus();
>     }
>   }, [isOpen]);
> 
>   if (!isOpen) return null;
> 
>   return (
>     <div className="modal">
>       <h4>Search IoT Devices</h4>
>       <input ref={inputRef} type="text" placeholder="Enter Device ID..." />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Imperative DOM Access**: `inputRef.current` holds the real HTMLInputElement DOM node.
> 2. **Post-Paint Focus**: `useEffect` fires after DOM commit, executing `.focus()` safely.
> 3. **Ref Binding**: JSX `ref={inputRef}` attaches the DOM reference automatically.
> 4. **No Extra Re-renders**: Ref assignment occurs without triggering auxiliary render passes.
> 
### Exercise 2: Financial Trading Desk Previous Price Tracker

**Scenario:** A stock ticker displays live price updates. Compare current price with previous price using `useRef` to render green/red color indicators without causing extra re-renders.

**Requirements:**
1. Store previous price in `useRef(currentPrice)`.
2. Update ref in `useEffect` post-render.
3. Compare current price against `prevPriceRef.current` during render.
4. Render price directional indicators.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect, useRef } from 'react';
> 
> export function TickerPriceIndicator({ price }) {
>   const prevPriceRef = useRef(price);
> 
>   useEffect(() => {
>     prevPriceRef.current = price;
>   }, [price]);
> 
>   const prevPrice = prevPriceRef.current;
>   const isHigher = price > prevPrice;
>   const isLower = price < prevPrice;
> 
>   return (
>     <div>
>       <span>Price: ${price.toFixed(2)} </span>
>       {isHigher && <span style={{ color: 'green' }}>▲</span>}
>       {isLower && <span style={{ color: 'red' }}>▼</span>}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Previous Snapshot Persistence**: `useRef` holds the previous render frame's price snapshot.
> 2. **Post-Render Update**: `useEffect` updates `prevPriceRef.current` after comparison evaluates.
> 3. **Pure Direction Comparison**: Evaluates price trends during render cleanly.
> 4. **Zero Overhead**: Preserves performance without extra state setters.
> 
### Exercise 3: E-Commerce Media Player Video Controller

**Scenario:** An e-commerce product gallery displays product demo videos. Provide play and pause buttons controlling an HTML5 `<video>` element using `useRef`.

**Requirements:**
1. Reference `<video>` element with `useRef`.
2. Implement `handlePlay` calling `videoRef.current.play()`.
3. Implement `handlePause` calling `videoRef.current.pause()`.
4. Render custom video controls.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useRef } from 'react';
> 
> export function ProductVideoGallery({ videoSrc }) {
>   const videoRef = useRef(null);
> 
>   const handlePlay = () => {
>     videoRef.current?.play();
>   };
> 
>   const handlePause = () => {
>     videoRef.current?.pause();
>   };
> 
>   return (
>     <div>
>       <video ref={videoRef} src={videoSrc} width="300" />
>       <div>
>         <button onClick={handlePlay}>Play Demo</button>
>         <button onClick={handlePause}>Pause</button>
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Imperative Media Control**: Invokes native `.play()` and `.pause()` HTML5 media methods.
> 2. **Ref Binding**: `ref={videoRef}` attaches to the native `<video>` element.
> 3. **Null Safety**: Optional chaining (`videoRef.current?.play()`) guards unmounted nodes.
> 4. **Declarative Isolation**: Video element state remains managed by browser media engine.
> 
---

## 6. Related Terms

- [`useState` Hook](../level_02/use_state.md) — The reactive state counterpart to `useRef`.
- [Declarative Programming](../level_01/declarative_programming.md) — `useRef` acts as an escape hatch for imperative DOM actions.
- [`useLayoutEffect` Hook](../level_03/use_layout_effect.md) — Hook used for measuring DOM nodes held by refs.
- [`forwardRef` & `useImperativeHandle`](forward_ref.md) — Pattern for passing refs down component trees.

---

## 7. Key Takeaways

- `useRef(initialValue)` returns a mutable object `{ current: initialValue }` that persists across renders.
- Mutating `.current` does **NOT** trigger a component re-render.
- Primary use case 1: Storing background silent state (timer IDs, previous prop snapshots).
- Primary use case 2: Gaining direct imperative access to real DOM nodes (`inputRef.current.focus()`).
- Never read or write `ref.current` directly in the component render body (use `useEffect` or event handlers).
- Never use `useRef` to store data displayed visually in JSX markup (use `useState` instead).
```
