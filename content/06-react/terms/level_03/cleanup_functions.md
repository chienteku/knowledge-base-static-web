# Cleanup Functions

> **Level 3 — Component Lifecycle & Effects**
> A function returned by `useEffect` that React executes right before component unmounting or prior to effect re-execution, preventing memory leaks.

---

## 1. Prerequisites

- [`useEffect` Hook](use_effect.md) — The React hook where cleanup functions are registered and returned.
- [Component Lifecycle](component_lifecycle.md) — Understanding the unmounting phase and dependency update triggers.

---

## 2. Term Category

**Rendering Mechanic (effect teardown pipeline)**: In React's rendering engine, a cleanup function is an explicit callback returned from within an effect hook (`useEffect` or `useLayoutEffect`). Unlike raw DOM event teardowns or imperative manual cleanup scripts, React manages the invocation timing of cleanup functions automatically, executing them either during component unmounting or immediately before re-running the effect on dependency changes.

Architecturally, cleanup functions preserve render purity by guaranteeing that side effects—such as active network sockets, browser timers, global window listeners, or DOM subscriptions—are safely dismantled. This prevents memory leaks, dangling promise callbacks, and duplicate event listeners in single-page applications.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When React components interact with external systems—such as opening a WebSocket connection to a chat server or attaching a browser window scroll listener—those connections persist in memory outside React's Virtual DOM tree. If a component unmounts without closing these connections, the resources remain active in the background.

If a user navigates back and forth between screens, repeatedly mounting and unmounting a component, an app without proper teardown logic will instantiate dozens of duplicate listeners and open sockets. Eventually, browser memory leaks accumulate and cause severe performance degradation or tab crashes.

React solved this by introducing a return value convention for effects. If an effect returns a function, React registers that function into Fiber's update queue and guarantees it will run at the exact moment before the effect is disposed or re-evaluated.

### (2) Reality Metaphor

Imagine renting a hotel room for a weekend stay.

- **Effect Execution (Mounting):** You unpack your luggage, plug in your phone charger, and turn on the air conditioner.
- **Without Cleanup (Abandoned Room):** You check out of the hotel without turning off the AC, leaving the room lights blaring and your personal items taking up space indefinitely. The room cannot be reused efficiently.
- **Cleanup Function (Check-out Checklist):** Before turning over room keys to housekeeping, you execute a check-out routine: unplugging appliances, packing your belongings, and switching off lights. React ensures this check-out checklist executes automatically every time you vacate the room (unmount) or change rooms (dependency update).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useEffect, useState } from 'react';

function WindowResizeTracker() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    // Teardown callback executed on unmount or before next effect run
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <p>Window Width: {width}px</p>;
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect } from 'react';

function TelemetryStreamViewer({ deviceId }) {
  const [telemetry, setTelemetry] = useState(null);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    let isSubscribed = true;
    const socket = new WebSocket(`wss://telemetry.example.com/devices/${deviceId}`);

    socket.onopen = () => {
      if (isSubscribed) setStatus('Connected');
    };

    socket.onmessage = (event) => {
      if (isSubscribed) {
        const payload = JSON.parse(event.data);
        setTelemetry(payload);
      }
    };

    socket.onerror = () => {
      if (isSubscribed) setStatus('Error');
    };

    // Cleanup executes when deviceId changes or component unmounts
    return () => {
      isSubscribed = false;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [deviceId]);

  return (
    <div className="telemetry-card">
      <h3>Device: {deviceId}</h3>
      <p>Status: {status}</p>
      {telemetry && <pre>{JSON.stringify(telemetry, null, 2)}</pre>}
    </div>
  );
}

export default TelemetryStreamViewer;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Returning a Promise Instead of a Cleanup Function

**The mistake:** Marking the `useEffect` callback function as `async`, which causes it to implicitly return a Promise object instead of a synchronous teardown function.

**Why it's wrong:** React expects effect return values to be either `undefined` or a synchronous cleanup function. When `useEffect` returns a Promise, React cannot execute it as a cleanup function and throws a runtime console error.

*Incorrect:*
```jsx
// ❌ Fatal Error: async effect returns a Promise
useEffect(async () => {
  const data = await fetchSensorData();
  setSensorData(data);
  return () => {
    stopSensorStream();
  };
}, []);
```

*Fix:*
```jsx
// ✅ Correct: async logic scoped inside inner function
useEffect(() => {
  let isMounted = true;
  async function loadData() {
    const data = await fetchSensorData();
    if (isMounted) setSensorData(data);
  }
  loadData();
  return () => {
    isMounted = false;
    stopSensorStream();
  };
}, []);
```

### Mistake 2: Omitting Cleanup Functions for Global Event Listeners

**The mistake:** Adding global window or document event listeners inside an effect without returning a teardown function to remove them.

**Why it's wrong:** Every time the component mounts or re-renders, a duplicate listener is registered on the `window` object. This causes memory leaks and duplicate handler executions.

*Incorrect:*
```jsx
useEffect(() => {
  window.addEventListener('keydown', handleKeyPress);
  // ❌ Missing cleanup: listener remains attached forever
}, []);
```

*Fix:*
```jsx
useEffect(() => {
  window.addEventListener('keydown', handleKeyPress);
  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}, [handleKeyPress]);
```

### Mistake 3: Assuming Cleanup Functions Only Run During Component Unmounting

**The mistake:** Believing that returned cleanup functions execute solely when a component leaves the DOM.

**Why it's wrong:** Cleanup functions execute **before every re-execution** of an effect when its dependencies change, in addition to running on unmounting. Writing cleanup logic that assumes a single execution on unmount leads to unexpected state reset bugs.

*Incorrect:*
```jsx
useEffect(() => {
  const timer = setTimeout(() => {
    sendMetrics(metricId);
  }, 5000);
  // ❌ Assuming this runs only on final unmount, resetting state prematurely
  return () => {
    resetGlobalMetricsStore();
  };
}, [metricId]);
```

*Fix:*
```jsx
useEffect(() => {
  const timer = setTimeout(() => {
    sendMetrics(metricId);
  }, 5000);
  return () => {
    clearTimeout(timer); // Safely cancel pending timer before next metricId run
  };
}, [metricId]);
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Stream Teardown

**Scenario:** An industrial IoT dashboard monitors temperature telemetry from chemical reactors. When a user switches between reactors, the active telemetry stream must close safely before establishing a connection to the new reactor to prevent cross-contamination of sensor telemetry streams.

**Requirements:**
1. Establish a mock subscription using `setInterval` that fires every 500ms for a given `reactorId`.
2. Update local `temperature` state with generated values.
3. Return a cleanup function that calls `clearInterval` to cancel active polling on `reactorId` change or unmount.
4. Provide technical explanation covering timer handles and cleanup lifecycle timing.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function ReactorMonitor({ reactorId, onCleanupExecuted }) {
>   const [temperature, setTemperature] = useState(25.0);
> 
>   useEffect(() => {
>     const intervalId = setInterval(() => {
>       setTemperature((prev) => +(prev + (Math.random() - 0.49)).toFixed(2));
>     }, 500);
> 
>     return () => {
>       clearInterval(intervalId);
>       if (onCleanupExecuted) {
>         onCleanupExecuted(reactorId);
>       }
>     };
>   }, [reactorId, onCleanupExecuted]);
> 
>   return (
>     <div>
>       <h4>Reactor: {reactorId}</h4>
>       <p>Temperature: {temperature} °C</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Effect Registration**: `useEffect` initializes the interval timer for data ingestion based on the active `reactorId` prop.
> 2. **State Isolation**: State setter functions use functional updates (`prev => ...`) to calculate new values independently of external variables.
> 3. **Teardown Cycle**: Changing `reactorId` triggers the cleanup return function, executing `clearInterval` before registering the next effect.
> 4. **Verification Hook**: The test container captures cleanup callbacks, verifying zero leaked timers across state shifts.
> 
### Exercise 2: Financial Order Book WebSocket Subscription

**Scenario:** A high-frequency trading application connects to a WebSocket server for live order book updates. If the trader changes currency pairs (e.g., from `BTC-USD` to `ETH-USD`), the previous socket must terminate immediately to avoid rendering stale order book depths.

**Requirements:**
1. Connect to a WebSocket endpoint matching a `symbol` prop.
2. Maintain active order book bid/ask depth in state.
3. Clean up the connection on `symbol` changes using `socket.close()`.
4. Handle unexpected disconnects gracefully without updating state post-unmount.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function OrderBook({ symbol }) {
>   const [book, setBook] = useState({ bids: [], asks: [] });
>   const [isConnected, setIsConnected] = useState(false);
> 
>   useEffect(() => {
>     let isMounted = true;
>     const ws = new WebSocket(`wss://api.exchange.com/ws/v3/${symbol}`);
> 
>     ws.onopen = () => {
>       if (isMounted) setIsConnected(true);
>     };
> 
>     ws.onmessage = (event) => {
>       if (isMounted) {
>         const data = JSON.parse(event.data);
>         setBook({ bids: data.bids || [], asks: data.asks || [] });
>       }
>     };
> 
>     return () => {
>       isMounted = false;
>       if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
>         ws.close();
>       }
>       setIsConnected(false);
>     };
>   }, [symbol]);
> 
>   return (
>     <div>
>       <h3>Order Book: {symbol}</h3>
>       <p>Status: {isConnected ? 'Live' : 'Disconnected'}</p>
>       <div>Bids: {book.bids.length} | Asks: {book.asks.length}</div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Boolean Mounting Safeguard**: The `isMounted` flag ensures asynchronous socket callbacks do not attempt state updates if socket closure takes time.
> 2. **Explicit Socket Disconnection**: `ws.close()` prevents open sockets from accumulating in memory when switching trading pairs.
> 3. **Dependency Syncing**: Specifying `[symbol]` forces React to run cleanup on the old pair before establishing the new stream.
> 4. **State Stabilization**: Setting connection state to `false` during teardown keeps the UI synchronized with underlying transport states.
> 
### Exercise 3: E-Commerce Search Abort Controller Sync

**Scenario:** An e-commerce search bar triggers API queries on every keystroke. Fast typing causes out-of-order responses. You must cancel pending HTTP requests using `AbortController` in the effect cleanup function.

**Requirements:**
1. Instantiates `AbortController` inside `useEffect` when `query` updates.
2. Passes `controller.signal` to `fetch`.
3. Calls `controller.abort()` in the cleanup return function.
4. Catches `AbortError` gracefully without logging it as an application error.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function ProductSearch() {
>   const [query, setQuery] = useState('');
>   const [results, setResults] = useState([]);
>   const [error, setError] = useState(null);
> 
>   useEffect(() => {
>     if (!query.trim()) {
>       setResults([]);
>       return;
>     }
> 
>     const controller = new AbortController();
> 
>     async function executeSearch() {
>       try {
>         const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`, {
>           signal: controller.signal
>         });
>         const data = await response.json();
>         setResults(data);
>         setError(null);
>       } catch (err) {
>         if (err.name !== 'AbortError') {
>           setError(err.message);
>         }
>       }
>     }
> 
>     executeSearch();
> 
>     return () => {
>       controller.abort();
>     };
>   }, [query]);
> 
>   return (
>     <div>
>       <input
>         type="text"
>         value={query}
>         onChange={(e) => setQuery(e.target.value)}
>         placeholder="Search products..."
>       />
>       {error && <p className="error">{error}</p>}
>       <ul>
>         {results.map((product) => (
>           <li key={product.id}>{product.name}</li>
>         ))}
>       </ul>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **AbortSignal Binding**: Passing `controller.signal` into `fetch` binds the HTTP request lifecycle to the component's effect lifetime.
> 2. **Teardown Abort**: `controller.abort()` cancels in-flight HTTP requests immediately when `query` changes or component unmounts.
> 3. **Error Discrimination**: Checking `err.name !== 'AbortError'` distinguishes intentionally cancelled fetches from real network failures.
> 4. **Race Condition Prevention**: Discarding aborted HTTP promises guarantees that fast responses never overwrite newer search queries out of order.
> 
---

## 6. Related Terms

- [`useEffect` Hook](use_effect.md) — The core hook for managing asynchronous side effects and returning cleanup callbacks.
- [Component Lifecycle](component_lifecycle.md) — The rendering lifecycle phases (mounting, updating, unmounting) controlling cleanup execution.
- [Data Fetching & Race Conditions](data_fetching_race_conditions.md) — Utilizing cleanup functions with boolean flags or `AbortController` to handle out-of-order network responses.
- [Side Effects](side_effects.md) — External browser interactions that must be isolated and managed via cleanups.

---

## 7. Key Takeaways

- Cleanup functions are returned directly from `useEffect` or `useLayoutEffect` to dismantle side effects.
- They execute immediately before an effect re-runs (due to dependency updates) and when a component unmounts.
- Never declare an effect callback as `async` because it implicitly returns a Promise instead of a synchronous cleanup function.
- Always use cleanups to remove window listeners, clear timers (`clearInterval`, `clearTimeout`), and abort HTTP requests (`AbortController`).
- Cleanup logic prevents memory leaks, duplicate event execution, and race condition bugs in single-page applications.
```

---

## File 2: `knowledge-base/06-react/terms/level_03/component_lifecycle.md`

```markdown
