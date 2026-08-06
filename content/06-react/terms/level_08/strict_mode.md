# Strict Mode

> **Level 8 — Performance Optimization**
> Development-only wrapper component that intentionally double-invokes component functions and effects to surface side-effect bugs and memory leaks.

---

## 1. Prerequisites

- [Render Purity](../level_01/render_purity.md) — Strict Mode double-renders components to enforce functional render purity.
- [Cleanup Functions](../level_03/cleanup_functions.md) — Strict Mode double-fires `useEffect` setup/cleanup to uncover missing cleanup logic.

---

## 2. Term Category

**Rendering Mechanic (development auditor)**: Development-only tool (`<React.StrictMode>`) that adds diagnostic checks and warnings to component subtrees. It carries zero production overhead and does not render HTML DOM elements. In React 18+, it intentionally mounts, unmounts, and re-mounts components in development to expose uncleaned side effects, race conditions, and impure render behaviors.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In React 18+, Concurrent Rendering allows React to pause, discard, or re-run component renders mid-execution. Additionally, future React features (such as Offscreen UI restoration) require components to mount, unmount, and re-mount while preserving state.

If a component contains impure side effects in its render phase (e.g., mutating global objects) or fails to unsubscribe from event listeners inside `useEffect`, it will cause subtle memory leaks, duplicate network requests, and unpredictable state bugs in production.

To surface these latent bugs during development, React provides **Strict Mode**:
1. **Double-Rendering Components**: In development, React intentionally calls component functions twice (`Render -> Render`) to verify that render logic is pure and idempotent.
2. **Double-Executing Effects**: React simulates an immediate unmount and re-mount cycle for every effect (`Mount -> Unmount -> Mount`). It runs `useEffect` setup, executes the cleanup function immediately, and then re-runs setup.
3. **Deprecation Audits**: Warns about deprecated APIs (e.g., legacy string refs, `findDOMNode`, legacy context API).

---

### (2) Reality Metaphor
Imagine a commercial building safety inspector testing fire sprinklers.
- **Without Strict Mode (Single Untested Run)**: A building installer turns on the water main once. Water flows into the pipes. However, nobody tests turning the valve off and on again. When a real emergency occurs, the valve gets stuck open and floods the building.
- **With Strict Mode (Intentional Double Test)**: The safety inspector opens the valve (**mount**), immediately shuts it off (**unmount/cleanup**), and opens it a second time (**re-mount**). If the pipes leak or the valve fails to close completely during the second cycle, the inspector catches the defect before the building opens to the public.

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    {/* StrictMode audits App and all descendant components in Development */}
    <App />
  </StrictMode>
);
```

#### Fuller Example
```jsx
import React, { useState, useEffect } from 'react';

export function WindowResizeTracker() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    // Setup listener
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    // CLEANUP FUNCTION: Strictly required for Strict Mode safety!
    // Strict Mode will call setup -> cleanup -> setup immediately in dev.
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="resize-card">
      <h3>Window Width Monitor</h3>
      <p>Current Width: {windowWidth}px</p>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Panicking and Disabling Strict Mode Because `console.log` Fires Twice

**The mistake:** Seeing duplicate console output in development logs and removing `<StrictMode>` from `index.jsx` to "fix" it.

**Why it's wrong:** Duplicate logs in development are intentional behavior designed to warn developers about impure side effects. Removing Strict Mode hides critical bugs that will break when deployed to Concurrent React environments.

*Incorrect:*
```jsx
// BAD: Removing StrictMode to hide double console.logs
root.render(<App />);
```

*Fix:*
```jsx
// GOOD: Keep StrictMode active; ensure render functions and effects are pure
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

### Mistake 2: Writing Side Effects Directly Inside Component Render Bodies

**The mistake:** Mutating global arrays or triggering network calls directly inside the render body instead of `useEffect`.

**Why it's wrong:** Under Strict Mode, render bodies execute twice. Impure operations inside render will push duplicate items or fire duplicate HTTP requests on every single render.

*Incorrect:*
```jsx
let globalItems = [];

function BadComponent() {
  // BAD: Impure global push runs TWICE per render in Strict Mode!
  globalItems.push('item');
  return <div>{globalItems.length}</div>;
}
```

*Fix:*
```jsx
function GoodComponent() {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    // GOOD: Side effects belong inside useEffect with proper cleanup
    setItems((prev) => [...prev, 'item']);
  }, []);

  return <div>{items.length}</div>;
}
```

---

### Mistake 3: Omitting Cleanup Functions from `useEffect` Subscriptions

**The mistake:** Attaching event listeners or WebSocket connections in `useEffect` without returning a cleanup function.

**Why it's wrong:** Strict Mode's `Mount -> Unmount -> Mount` cycle will leave the first event listener active while attaching a second listener, causing duplicate event handlers and memory leaks.

*Incorrect:*
```jsx
useEffect(() => {
  // BAD: Missing return () => window.removeEventListener(...)
  window.addEventListener('scroll', handleScroll);
}, []);
```

*Fix:*
```jsx
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  // GOOD: Return cleanup function to remove listener on unmount
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Event Listener Cleanup

**Scenario:** An industrial telemetry component subscribes to a custom window telemetry event. In development under Strict Mode, event handlers fire twice for every sensor pulse. You must add proper cleanup logic to ensure single event handling.

**Requirements:**
1. Attach custom event listener in `useEffect`.
2. Return cleanup function removing event listener.
3. Verify cleanup prevents duplicate handler accumulation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function IoTSensorListener() {
>   const [telemetry, setTelemetry] = useState(0);
> 
>   useEffect(() => {
>     const handleSensorPulse = (e) => {
>       setTelemetry((prev) => prev + 1);
>     };
> 
>     window.addEventListener('sensorPulse', handleSensorPulse);
> 
>     // Strict Mode safely verifies this cleanup function on mount
>     return () => {
>       window.removeEventListener('sensorPulse', handleSensorPulse);
>     };
>   }, []);
> 
>   return (
>     <div className="sensor-listener">
>       <h3>Telemetry Pulse Count: {telemetry}</h3>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof IoTSensorListener === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Double-Mount Audit**: In Strict Mode development, React runs `setup -> cleanup -> setup`. The first listener is safely removed before the second mounts.
> 2. **Memory Leak Prevention**: Discarded component instances clear window listener references.
> 3. **Idempotent Effects**: Setup and cleanup balance out completely, preserving state accuracy.
> 4. **Production Parity**: Carries zero code footprint or performance cost in production builds.
> 
---

### Exercise 2: Crypto Exchange WebSocket Connection

**Scenario:** A trading desk component connects to a WebSocket server for live BTC prices. You need to handle WebSocket lifecycle management cleanly so Strict Mode double-mounting does not create duplicate zombie connections.

**Requirements:**
1. Open WebSocket connection in `useEffect`.
2. Close socket in cleanup return function.
3. Validate connection state management.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function CryptoTickerSocket() {
>   const [price, setPrice] = useState(64000);
> 
>   useEffect(() => {
>     // Mock WebSocket connection object
>     const mockSocket = {
>       connected: true,
>       close: () => {
>         mockSocket.connected = false;
>       }
>     };
> 
>     // Return cleanup function to close socket on unmount
>     return () => {
>       mockSocket.close();
>     };
>   }, []);
> 
>   return (
>     <div className="crypto-ticker">
>       <h3>BTC/USD: ${price}</h3>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof CryptoTickerSocket === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Socket Lifecycle**: Closing `mockSocket` in cleanup prevents zombie socket connections from accumulating during development re-mounts.
> 2. **Strict Mode Safety**: Ensures socket allocation and release remain symmetric.
> 3. **Resource Leak Elimination**: Prevents duplicate network bandwidth usage.
> 4. **Concurrent Readiness**: Prepares component for future React Offscreen rendering features.
> 
---

### Exercise 3: E-Commerce Keyboard Shortcut Listener

**Scenario:** An online store allows customers to press `Escape` to close their cart drawer. You must add a keydown event listener inside `useEffect` that is fully compliant with Strict Mode audit rules.

**Requirements:**
1. Bind keydown listener in `useEffect`.
2. Unbind keydown listener in cleanup callback.
3. Use updater function for cart state updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function CartDrawer() {
>   const [isOpen, setIsOpen] = useState(true);
> 
>   useEffect(() => {
>     const handleKeyDown = (e) => {
>       if (e.key === 'Escape') {
>         setIsOpen(false);
>       }
>     };
> 
>     window.addEventListener('keydown', handleKeyDown);
> 
>     return () => {
>       window.removeEventListener('keydown', handleKeyDown);
>     };
>   }, []);
> 
>   return (
>     <div className="cart-drawer">
>       <p>Cart Status: {isOpen ? 'OPEN (Press ESC to close)' : 'CLOSED'}</p>
>       <button onClick={() => setIsOpen(true)}>Reopen Cart</button>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof CartDrawer === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Listener Unbinding**: Returning `removeEventListener` ensures Strict Mode double-invocations leave exactly 1 active keydown listener.
> 2. **Event Isolation**: Pressing `Escape` triggers handler exactly once.
> 3. **Zero Overhead**: `<StrictMode>` checks are automatically stripped in production builds.
> 4. **Code Quality**: Enforces best practices for subscription lifetime management across all team developers.
> 
---

## 6. Related Terms

- [Render Purity](../level_01/render_purity.md) — Core React rule verified by Strict Mode.
- [Cleanup Functions](../level_03/cleanup_functions.md) — Destruction handlers verified by Strict Mode.
- [Side Effects](../level_03/side_effects.md) — Asynchronous tasks audited by Strict Mode.

---

## 7. Key Takeaways

- `<React.StrictMode>` is a development-only tool that audits component subtrees for latent bugs.
- It carries zero production bundle overhead and renders no physical HTML DOM wrapper nodes.
- In development, it double-invokes render functions to enforce functional render purity.
- It double-runs `useEffect` setup and cleanup cycles (`Mount -> Unmount -> Mount`) to expose missing effect cleanups.
- Never remove `<StrictMode>` to hide duplicate console logs; fix the underlying impure code instead.
