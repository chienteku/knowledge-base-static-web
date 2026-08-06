# `useLayoutEffect` Hook

> **Level 3 — Component Lifecycle & Effects**
> A synchronous sibling of `useEffect` that fires after DOM mutations but BEFORE the browser paints the screen.

---

## 1. Prerequisites

- [`useEffect` Hook](use_effect.md) — The asynchronous counterpart executed post-paint.
- [Component Lifecycle](component_lifecycle.md) — Understanding render commit and paint stages.

---

## 2. Term Category

**Core Hook (synchronous DOM layout observer)**: `useLayoutEffect` is React's built-in hook for executing synchronous DOM measurements and mutations before the browser paints visual frame updates. Unlike `useEffect` (which runs asynchronously after paint), `useLayoutEffect` blocks browser painting until its execution and any subsequent state updates complete.

Architecturally, `useLayoutEffect` prevents visual UI flickering when positioning popovers, measuring container dimensions, or adjusting scroll positions dynamically.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Standard `useEffect` runs **asynchronously after** the browser paints DOM updates onto the user's screen. This is ideal for 95% of side effects because it avoids blocking screen updates.

However, consider positioning a dynamic UI Tooltip:
1. React renders Tooltip at default coordinates `(0, 0)`.
2. Browser paints Tooltip at `(0, 0)` on screen.
3. `useEffect` fires post-paint, measures button bounds, and calculates correct position `(250, 120)`.
4. State updates and React re-renders Tooltip at `(250, 120)`.
5. Browser paints Tooltip at `(250, 120)`.

The user sees the Tooltip flash briefly at `(0, 0)` before jumping to `(250, 120)`. This visual artifact is called **layout flicker**.

React introduced **`useLayoutEffect`** to eliminate flicker:
- **Synchronous Blocking Execution:** Runs after DOM mutations but **before browser paint**.
- **Flicker Elimination:** State updates triggered inside `useLayoutEffect` re-render synchronously before the browser draws a single pixel, ensuring users see only the final corrected layout.

#### Pipeline Comparison

```text
Render Phase ➔ DOM Mutated ➔ useLayoutEffect (Sync) ➔ Browser Paint ➔ useEffect (Async)
```

### (2) Reality Metaphor

Imagine stage crew preparing a theater performance.

- **`useEffect` (Open Curtains First):** Stage curtains open (browser paint). Audience sees a table in the center of the stage. Stagehands run out, measure distances, push table 10 feet left, and exit. Audience sees table jump (**visual flicker**).
- **`useLayoutEffect` (Behind Closed Curtains):** Curtains stay closed. Stagehands enter dark stage, measure distances, move table to correct position, and exit. Curtains open. Audience sees table instantly in correct position (**zero flicker**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState, useLayoutEffect, useRef } from 'react';

function ContainerWidthReader() {
  const [width, setWidth] = useState(0);
  const divRef = useRef(null);

  useLayoutEffect(() => {
    if (divRef.current) {
      setWidth(divRef.current.getBoundingClientRect().width);
    }
  }, []);

  return <div ref={divRef}>Measured Container Width: {width}px</div>;
}
```

#### Fuller Example

```jsx
import React, { useState, useLayoutEffect, useRef } from 'react';

function AutoPositionTooltip({ targetRef, text }) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useLayoutEffect(() => {
    if (!targetRef.current || !tooltipRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    // Calculate position above target element
    const top = targetRect.top - tooltipRect.height - 8;
    const left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;

    setCoords({ top, left });
  }, [targetRef]);

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        backgroundColor: '#333',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '4px',
        pointerEvents: 'none'
      }}
    >
      {text}
    </div>
  );
}

export default AutoPositionTooltip;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `useLayoutEffect` for Data Fetching or API Calls

**The mistake:** Placing API data fetches or heavy computation inside `useLayoutEffect`.

**Why it's wrong:** `useLayoutEffect` blocks browser painting. Performing slow asynchronous queries or heavy math inside it freezes screen rendering, degrading responsiveness.

*Incorrect:*
```jsx
useLayoutEffect(() => {
  fetch('/api/data').then(res => setData(res)); // ❌ Blocks browser paint!
}, []);
```

*Fix:*
```jsx
useEffect(() => {
  fetch('/api/data').then(res => setData(res)); // ✅ Asynchronous post-paint fetch
}, []);
```

### Mistake 2: Ignoring Server-Side Rendering (SSR) Warnings

**The mistake:** Calling `useLayoutEffect` in Next.js or SSR applications without window guards.

**Why it's wrong:** HTML generated on Node.js servers has no DOM layout. `useLayoutEffect` cannot execute on servers, triggering hydration warning messages (`useLayoutEffect does nothing on the server`).

*Incorrect:*
```jsx
// Directly invoking useLayoutEffect in SSR components
useLayoutEffect(() => {
  setHeight(ref.current.clientHeight);
}, []);
```

*Fix:*
```jsx
// Fallback to useEffect on server or wrap in window check
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
```

### Mistake 3: Overusing `useLayoutEffect` When `useEffect` Suffices

**The mistake:** Using `useLayoutEffect` everywhere out of habit or precaution.

**Why it's wrong:** Synchronous blocking execution slows page renders. Use `useLayoutEffect` strictly for layout measurements and styling adjustments that cause visual flickering.

*Incorrect:*
```jsx
useLayoutEffect(() => {
  document.title = 'New Page'; // ❌ Non-visual DOM mutation doesn't need pre-paint sync
}, []);
```

*Fix:*
```jsx
useEffect(() => {
  document.title = 'New Page'; // ✅ Use useEffect for non-flicker side-effects
}, []);
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Gauge Auto-Fitter

**Scenario:** An industrial IoT dashboard displays analog circular gauges. Measure gauge wrapper DOM dimensions before paint to calculate SVG radius values without visual size pop-in.

**Requirements:**
1. Measure wrapper `clientWidth` using `useLayoutEffect`.
2. Compute SVG radius value synchronously.
3. Prevent visual layout jumps.
4. Render responsive SVG gauge.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useLayoutEffect, useRef } from 'react';
> 
> export function CircularGauge({ value }) {
>   const wrapperRef = useRef(null);
>   const [radius, setRadius] = useState(50);
> 
>   useLayoutEffect(() => {
>     if (wrapperRef.current) {
>       const width = wrapperRef.current.clientWidth;
>       setRadius(Math.floor(width / 4));
>     }
>   }, []);
> 
>   return (
>     <div ref={wrapperRef} style={{ width: '100%', maxWidth: '300px' }}>
>       <svg width={radius * 2} height={radius * 2}>
>         <circle cx={radius} cy={radius} r={radius - 5} stroke="blue" strokeWidth="4" fill="none" />
>       </svg>
>       <p>Value: {value}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Pre-Paint Measurement**: `clientWidth` is read synchronously before browser drawing.
> 2. **Flicker Elimination**: Radius state updates prior to visual paint pass.
> 3. **Ref Binding**: Direct DOM access enabled by `useRef`.
> 4. **Smooth Experience**: Eliminates SVG scaling layout jump.
> 
### Exercise 2: Financial Order Depth Chart Auto-Scroll

**Scenario:** A trading terminal order book auto-scrolls to center active market bid/ask spreads. Use `useLayoutEffect` to adjust container scroll offsets smoothly before rendering frame paints.

**Requirements:**
1. Reference order list scroll container with `useRef`.
2. Measure `scrollTop` position.
3. Synchronize scroll position before paint pass.
4. Ensure zero visual scroll jumping.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useLayoutEffect, useRef } from 'react';
> 
> export function OrderBookScroll({ activeSpreadIndex }) {
>   const containerRef = useRef(null);
> 
>   useLayoutEffect(() => {
>     if (containerRef.current) {
>       const rowHeight = 30;
>       containerRef.current.scrollTop = activeSpreadIndex * rowHeight - 100;
>     }
>   }, [activeSpreadIndex]);
> 
>   return (
>     <div ref={containerRef} style={{ height: '300px', overflowY: 'auto' }}>
>       {Array.from({ length: 50 }).map((_, i) => (
>         <div key={i} style={{ height: '30px', background: i === activeSpreadIndex ? '#ffe0b2' : 'transparent' }}>
>           Row {i}: Order Spread Data
>         </div>
>       ))}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Pre-Paint Scroll Sync**: `scrollTop` updates synchronously before screen frame paint.
> 2. **Zero Jumpiness**: Prevents visual scroll jumps during market volatility shifts.
> 3. **DOM Mutation Alignment**: Modifies DOM scroll position directly prior to render pass.
> 4. **Responsive Layout**: Adjusts offsets accurately per spread index.
> 
### Exercise 3: E-Commerce Dropdown Popover Positioner

**Scenario:** An e-commerce filter popover aligns below category trigger buttons. Calculate popover coordinates synchronously in `useLayoutEffect` to avoid popover alignment jumps.

**Requirements:**
1. Measure trigger button `getBoundingClientRect()`.
2. Set popover top/left coordinates.
3. Run alignment synchronously before paint.
4. Render popover overlay cleanly.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useLayoutEffect, useRef } from 'react';
> 
> export function CategoryPopover({ triggerRef, isOpen, children }) {
>   const popoverRef = useRef(null);
>   const [pos, setPos] = useState({ top: 0, left: 0 });
> 
>   useLayoutEffect(() => {
>     if (isOpen && triggerRef.current && popoverRef.current) {
>       const triggerRect = triggerRef.current.getBoundingClientRect();
>       setPos({
>         top: triggerRect.bottom + window.scrollY + 4,
>         left: triggerRect.left + window.scrollX
>       });
>     }
>   }, [isOpen, triggerRef]);
> 
>   if (!isOpen) return null;
> 
>   return (
>     <div
>       ref={popoverRef}
>       style={{
>         position: 'absolute',
>         top: `${pos.top}px`,
>         left: `${pos.left}px`,
>         boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
>         backgroundColor: '#fff',
>         padding: '12px'
>       }}
    >
>       {children}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Synchronous Alignment**: Pre-paint coordinate computation prevents visual jumps.
> 2. **Rect Bounds Reading**: `getBoundingClientRect()` calculates exact viewport offsets.
> 3. **Conditional Execution**: Runs layout positioning only when popover opens.
> 4. **Seamless UX**: Users see popovers exclusively in calculated positions.
> 
---

## 6. Related Terms

- [`useEffect` Hook](use_effect.md) — Asynchronous post-paint effect counterpart.
- [`useRef` Hook](../level_04/use_ref.md) — Reference hook used for measuring DOM nodes.
- [Component Lifecycle](component_lifecycle.md) — Render and commit execution pipeline.

---

## 7. Key Takeaways

- `useLayoutEffect` executes synchronously after DOM mutations but **before browser paint**.
- Use it strictly to measure DOM nodes and adjust styles/positions to prevent visual flicker.
- Do NOT use it for API requests or heavy computation, as it blocks browser painting.
- In SSR contexts, use `useEffect` or isomorphic window checks to avoid hydration warnings.
```
