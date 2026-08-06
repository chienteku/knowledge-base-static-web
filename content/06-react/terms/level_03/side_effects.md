# Side Effects

> **Level 3 — Component Lifecycle & Effects**
> Operations executed by a component that interact with systems outside its scope, such as DOM mutations, network requests, or timers.

---

## 1. Prerequisites

- [Render Purity](../level_01/render_purity.md) — The rule that rendering functions must be pure and free of side effects.
- [Declarative Programming](../level_01/declarative_programming.md) — Isolating imperative side-effects from declarative component markup.

---

## 2. Term Category

**Rendering Mechanic (effect execution model)**: In functional programming, a pure function takes inputs and returns an output without mutating external state or interacting with the external world. React components are designed to behave as pure functions during the rendering phase.

A **Side Effect** (or "effect") is any operation that reaches outside the component's render execution context: writing to `localStorage`, fetching API data, establishing WebSocket connections, setting browser timers, or manually modifying DOM nodes. Architecturally, React requires side effects to be explicitly isolated within event handlers or effect hooks (`useEffect`, `useLayoutEffect`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If a developer places a side effect (such as `fetch('/api/logs')` or `document.title = 'New'`) directly inside the body of a component function, the effect runs during the rendering phase.

Because React can re-render components dozens of times per second (and may execute render functions multiple times under StrictMode or Concurrent Mode), executing side effects during render causes severe bugs:
- Bombarding network servers with duplicate HTTP requests.
- Writing corrupted logs into local browser storage.
- Causing visual layout thrashing and freezing the browser UI.

To preserve stability, React enforces a strict separation: **Rendering must remain pure; side effects must execute after render commitment (via `useEffect`) or in response to explicit user actions (via event handlers).**

### (2) Reality Metaphor

Imagine blueprint drawing versus constructing a building.

- **Pure Render (Blueprint Drafter):** An architect draws architectural plans on paper. Drawing a window on paper does not install glass, cut wood, or emit noise. The architect can erase and redraw the plan 50 times without altering physical reality.
- **Side Effect (Construction Crew):** Operating heavy machinery, pouring concrete, and installing electrical wiring alter the physical world permanently.
- **Rule of Isolation:** You would never allow a construction crew to start pouring concrete while the architect is still sketching preliminary blueprint drafts. React ensures blueprint drafting (rendering) completes before construction crews (side effects) operate.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useEffect, useState } from 'react';

function DocumentTitleUpdater({ title }) {
  // ✅ Safe side-effect executed post-render
  useEffect(() => {
    document.title = title;
  }, [title]);

  return <h3>Current Page: {title}</h3>;
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect } from 'react';

function AnalyticsTracker({ pageId }) {
  const [clickCount, setClickCount] = useState(0);

  // Side Effect Type A: Synchronizing external system on prop update
  useEffect(() => {
    let active = true;
    console.log(`Logging page view for: ${pageId}`);

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, timestamp: Date.now() })
    }).catch(err => console.error('Analytics log failed', err));

    return () => {
      active = false;
    };
  }, [pageId]);

  // Side Effect Type B: User event handler side-effect
  const handleButtonClick = () => {
    setClickCount(prev => prev + 1);
    // Directly trigger user-intent side effect in event handler
    localStorage.setItem(`clicks_${pageId}`, String(clickCount + 1));
  };

  return (
    <div className="analytics-box">
      <h4>Page: {pageId}</h4>
      <p>Interactions: {clickCount}</p>
      <button onClick={handleButtonClick}>Track Interaction</button>
    </div>
  );
}

export default AnalyticsTracker;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Executing Side Effects Directly in Component Render Bodies

**The mistake:** Calling `fetch()`, writing to `localStorage`, or setting timers directly inside the body of a component.

**Why it's wrong:** Component render bodies must remain pure. Executing side effects during render leads to duplicate calls under StrictMode and causes unexpected rendering loops.

*Incorrect:*
```jsx
function UserSettings({ theme }) {
  localStorage.setItem('theme', theme); // ❌ Impure side-effect during render!
  return <div>Theme: {theme}</div>;
}
```

*Fix:*
```jsx
function UserSettings({ theme }) {
  useEffect(() => {
    localStorage.setItem('theme', theme); // ✅ Isolated in useEffect
  }, [theme]);
  return <div>Theme: {theme}</div>;
}
```

### Mistake 2: Using Effects for User Event Responses That Belong in Event Handlers

**The mistake:** Setting state `setIsSubmitted(true)` in a button click handler, then using `useEffect` watching `isSubmitted` to trigger a form submit POST request.

**Why it's wrong:** Effects are designed for **synchronizing component state with external systems**, not handling user intent. Form submission belongs directly inside the form's `onSubmit` or button's `onClick` handler.

*Incorrect:*
```jsx
const [submitted, setSubmitted] = useState(false);
useEffect(() => {
  if (submitted) postData(); // ❌ Misusing effect for user event response
}, [submitted]);
```

*Fix:*
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  await postData(); // ✅ Direct imperative handler for user intent
};
```

### Mistake 3: Deriving State in `useEffect` Instead of During Render

**The mistake:** Updating a `fullName` state variable inside `useEffect` whenever `firstName` or `lastName` changes.

**Why it's wrong:** Triggering state updates inside effects forces an unnecessary extra re-render pass. Calculate derived state directly during rendering.

*Incorrect:*
```jsx
useEffect(() => {
  setFullName(`${firstName} ${lastName}`); // ❌ Extra re-render!
}, [firstName, lastName]);
```

*Fix:*
```jsx
const fullName = `${firstName} ${lastName}`; // ✅ Calculated during render
```

---

## 5. Practice Exercises

### Exercise 1: Industrial IoT Telemetry Logger

**Scenario:** An IoT sensor card displays pressure readings. When pressure exceeds safety limits, write a warning to an external audit log via HTTP POST without interfering with render performance.

**Requirements:**
1. Monitor `pressure` prop.
2. If `pressure > 100`, post a warning log via `fetch`.
3. Wrap side-effect logic inside `useEffect`.
4. Render current pressure value.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect } from 'react';
> 
> export function PressureMonitor({ sensorId, pressure }) {
>   useEffect(() => {
>     if (pressure > 100) {
>       fetch('/api/alerts', {
>         method: 'POST',
>         headers: { 'Content-Type': 'application/json' },
>         body: JSON.stringify({ sensorId, pressure, time: Date.now() })
>       }).catch(console.error);
>     }
>   }, [sensorId, pressure]);
> 
>   return (
>     <div>
>       <h4>Sensor: {sensorId}</h4>
>       <p>Pressure: {pressure} PSI</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Render Isolation**: HTTP POST requests execute post-paint, preserving render purity.
> 2. **Dependency Sync**: `[sensorId, pressure]` ensures alerts fire strictly on value shifts.
> 3. **Non-Blocking UI**: Asynchronous logging runs without freezing UI updates.
> 4. **StrictMode Compatibility**: Isolated side effects execute predictably across dev renders.
> 
### Exercise 2: Financial Order Submission Handler

**Scenario:** A stock trading form processes order submissions. Ensure the trade execution API call runs inside the submit event handler rather than inside a `useEffect`.

**Requirements:**
1. Capture order form submission event.
2. Prevent default browser submission behavior (`e.preventDefault()`).
3. Execute POST trade request directly inside `handleSubmit`.
4. Render order submission status.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function TradeOrderForm({ symbol }) {
>   const [amount, setAmount] = useState(10);
>   const [status, setStatus] = useState('Idle');
> 
>   const handleSubmit = async (e) => {
>     e.preventDefault();
>     setStatus('Submitting...');
>     try {
>       const res = await fetch('/api/trades', {
>         method: 'POST',
>         headers: { 'Content-Type': 'application/json' },
>         body: JSON.stringify({ symbol, amount })
>       });
>       if (res.ok) setStatus('Executed');
>       else setStatus('Failed');
>     } catch {
>       setStatus('Failed');
>     }
>   };
> 
>   return (
>     <form onSubmit={handleSubmit}>
>       <h4>Order: {symbol}</h4>
>       <input type="number" value={amount} onChange={e => setAmount(+e.target.value)} />
>       <button type="submit">Submit Trade</button>
>       <p>Status: {status}</p>
>     </form>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **User Intent Placement**: Action side effects belong in event handlers.
> 2. **No Redundant Effects**: Avoids artificial boolean states (`isSubmitting`) to trigger effects.
> 3. **Synchronous Interception**: `e.preventDefault()` prevents browser page reloads.
> 4. **Clean Feedback**: Updates UI state directly before and after API operations.
> 
### Exercise 3: E-Commerce Scroll Position Restorer

**Scenario:** An e-commerce catalog remembers window scroll positions when navigating between categories using browser session storage.

**Requirements:**
1. Save `window.scrollY` to `sessionStorage` on window scroll.
2. Attach window event listener inside `useEffect`.
3. Provide teardown cleanup removing scroll listener.
4. Restore scroll position on initial mount.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect } from 'react';
> 
> export function ScrollRestorer({ pageKey }) {
>   useEffect(() => {
>     const savedY = sessionStorage.getItem(`scroll_${pageKey}`);
>     if (savedY) {
>       window.scrollTo(0, parseInt(savedY, 10));
>     }
> 
>     const handleScroll = () => {
>       sessionStorage.setItem(`scroll_${pageKey}`, String(window.scrollY));
>     };
> 
>     window.addEventListener('scroll', handleScroll);
> 
>     return () => {
>       window.removeEventListener('scroll', handleScroll);
>     };
>   }, [pageKey]);
> 
>   return <div className="page-content">Restoring Scroll Position...</div>;
> }
> ```
>
> #### Technical Explanation
> 1. **External Sync**: `sessionStorage` and `window.scrollTo` reach outside React state cleanly.
> 2. **Teardown Isolation**: Cleaning up `removeEventListener` prevents memory leaks.
> 3. **Page Key Binding**: Dependencies re-bind listeners cleanly on route shifts.
> 4. **Render Purity**: Component render remains self-contained.
> 
---

## 6. Related Terms

- [Render Purity](../level_01/render_purity.md) — The core principle forbidding side effects during render.
- [`useEffect` Hook](use_effect.md) — The hook designed to encapsulate side effects.
- [Cleanup Functions](cleanup_functions.md) — Teardown callbacks for side effects.
- [Component Lifecycle](component_lifecycle.md) — Lifecycle timing governing effect execution.

---

## 7. Key Takeaways

- Side effects are operations that reach outside a component (DOM, storage, network, timers).
- React components must remain pure during the rendering phase.
- Never place side effects directly inside the component render function body.
- Put synchronization side effects inside `useEffect` or `useLayoutEffect`.
- Put user-intent side effects (form submission, button clicks) directly inside event handlers.
```

---

## File 6: `knowledge-base/06-react/terms/level_03/stale_closures.md`

```markdown
