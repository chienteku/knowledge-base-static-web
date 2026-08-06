# Component Lifecycle

> **Level 3 — Component Lifecycle & Effects**
> The three distinct execution phases of a React component instance: Mounting (Birth), Updating (Life), and Unmounting (Death).

---

## 1. Prerequisites

- [Components](../level_01/components.md) — The fundamental UI building blocks governed by lifecycle execution phases.
- [Re-rendering](../level_02/re_rendering.md) — The render execution cycle representing the updating lifecycle phase.

---

## 2. Term Category

**Rendering Mechanic (component execution lifecycle)**: The Component Lifecycle defines the sequence of operations React performs when creating, updating, and destroying component nodes in the Virtual DOM tree. In class-based React, lifecycle steps were bound to discrete imperatively named class methods (`componentDidMount`, `componentDidUpdate`, `componentWillUnmount`).

In modern React (v18+), functional components express lifecycle synchronization declaratively through hooks (`useEffect`, `useLayoutEffect`, `useInsertionEffect`). Rather than imperative lifecycle step management, functional component lifecycles model data synchronization between component props/state and external systems.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A React UI component is dynamic. It does not simply generate static HTML once; it responds to user interactions, network responses, and application state transitions over time.

Engineers require predictable execution hooks to execute logic at precise moments:
- **Mounting:** Ingesting initial API data, opening WebSocket subscriptions, initializing third-party canvas instances.
- **Updating:** Synchronizing component state changes with browser storage, validating prop changes, re-calculating canvas layouts.
- **Unmounting:** Canceling active intervals, unsubscribing from event emitters, destroying WebGL contexts.

Understanding lifecycle timing enables developers to prevent infinite re-render loops, eliminate UI stutter, and preserve browser memory efficiency.

### (2) Reality Metaphor

Imagine a theatrical stage play.

- **Mounting (Opening Night):** Set design builds props, actors enter the stage for the first time, and stage lights turn on. This phase happens exactly once at the beginning of the performance.
- **Updating (Scene Progression):** Actors dialogue, move across the stage, and change costumes in response to script cues. The stage remains intact while actors adjust positions repeatedly across scenes.
- **Unmounting (Curtain Call):** The play ends, actors exit the stage, lights turn off, and stage crews dismantle the set, leaving the stage clean for the next show.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useEffect, useState } from 'react';

function LifecycleLogger() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Mounted or Updated: Count is', count);
    return () => console.log('Cleanup before next update or unmount');
  }, [count]);

  return <button onClick={() => setCount(prev => prev + 1)}>Count: {count}</button>;
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect } from 'react';

function UserActivityMonitor({ userId }) {
  const [status, setStatus] = useState('Offline');
  const [lastActive, setLastActive] = useState(null);

  // Mounting & Dependency Updating Lifecycle Phase
  useEffect(() => {
    console.log(`[Mount/Update] Subscribing to user status: ${userId}`);
    setStatus('Connecting...');

    const subscription = fakeStatusService.subscribe(userId, (data) => {
      setStatus(data.status);
      setLastActive(data.timestamp);
    });

    // Unmounting & Dependency Teardown Lifecycle Phase
    return () => {
      console.log(`[Unmount/Teardown] Unsubscribing from user status: ${userId}`);
      subscription.unsubscribe();
    };
  }, [userId]);

  return (
    <div className="status-card">
      <h3>User: {userId}</h3>
      <p>Status: {status}</p>
      {lastActive && <small>Last Active: {lastActive}</small>}
    </div>
  );
}

const fakeStatusService = {
  subscribe(id, callback) {
    const timer = setInterval(() => {
      callback({ status: 'Online', timestamp: new Date().toLocaleTimeString() });
    }, 1000);
    return { unsubscribe: () => clearInterval(timer) };
  }
};

export default UserActivityMonitor;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Mount Data Fetching with Unconditional Effect Execution

**The mistake:** Writing an effect without a dependency array to fetch initial API data.

**Why it's wrong:** Omitting the dependency array causes the effect to run on **every single update**. The state setter inside the fetch callback triggers an update, which triggers the effect, creating an infinite fetch rendering loop.

*Incorrect:*
```jsx
useEffect(() => {
  fetch('/api/user').then(res => res.json()).then(setUser);
}); // ❌ Missing dependency array: runs on mount AND every update!
```

*Fix:*
```jsx
useEffect(() => {
  fetch('/api/user').then(res => res.json()).then(setUser);
}, []); // ✅ Empty dependency array: runs strictly on mount
```

### Mistake 2: Using Legacy Class Component Lifecycle Methods in Function Components

**The mistake:** Attempting to write `componentDidMount()` or `componentWillUnmount()` directly inside a functional component body.

**Why it's wrong:** Functional components do not support class method lifecycle syntax. Attempting to define them causes JavaScript syntax errors or silently ignores execution.

*Incorrect:*
```jsx
function Dashboard() {
  componentDidMount() {
    // ❌ Invalid syntax inside functional components
    fetchData();
  }
  return <div>Dashboard</div>;
}
```

*Fix:*
```jsx
function Dashboard() {
  useEffect(() => {
    fetchData();
  }, []); // Equivalent to mount lifecycle execution
  return <div>Dashboard</div>;
}
```

### Mistake 3: Mental Mapping to Class Lifecycles Instead of State Synchronization

**The mistake:** Treating `useEffect` purely as a mechanical trigger for `componentDidMount` + `componentDidUpdate`.

**Why it's wrong:** React functional components re-render continuously; `useEffect` is designed to synchronize local state with external systems based on reactive dependency changes, not imperatively execute step sequences.

*Incorrect:*
```jsx
// Trying to imperatively manage multi-step lifecycle sequences across effects
```

*Fix:*
```jsx
// Declare effects as direct synchronization bounds of reactive dependencies
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Dashboard Lifecycle Track

**Scenario:** An energy grid telemetry dashboard mounts component nodes representing solar power inverters. You must log distinct lifecycle events ("Mounted", "Updated", "Unmounting") to an audit telemetry service when inverters initialize or disconnect.

**Requirements:**
1. Log "Inverter Mounted" on initial render.
2. Log "Inverter Output Updated" when the `kwOutput` prop changes.
3. Log "Inverter Unmounted" in the effect teardown callback.
4. Execute without infinite updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect } from 'react';
> 
> export function InverterNode({ inverterId, kwOutput, onAuditLog }) {
>   // Mount & Unmount Lifecycle
>   useEffect(() => {
>     onAuditLog(`Inverter ${inverterId} Mounted`);
>     return () => {
>       onAuditLog(`Inverter ${inverterId} Unmounted`);
>     };
>   }, [inverterId, onAuditLog]);
> 
>   // Update Lifecycle for kwOutput
>   useEffect(() => {
>     onAuditLog(`Inverter ${inverterId} Output Updated: ${kwOutput} kW`);
>   }, [inverterId, kwOutput, onAuditLog]);
> 
>   return (
>     <div className="inverter-card">
>       <h4>Inverter ID: {inverterId}</h4>
>       <p>Current Power: {kwOutput} kW</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Lifecycle Separation**: Using separate `useEffect` hooks cleanly isolates mount/unmount concerns from specific prop update tracking.
> 2. **Mount Phase**: The first effect with `[inverterId]` dependency fires once when the inverter mounts.
> 3. **Update Phase**: The second effect tracking `kwOutput` executes on subsequent render passes whenever power output shifts.
> 4. **Teardown Execution**: Returning a callback in the primary effect guarantees an unmount log when node components exit the DOM.
> 
### Exercise 2: Financial Ticker Stream Subscription

**Scenario:** A stock trading application displays real-time price feeds for tickers. When switching tickers from `AAPL` to `TSLA`, the component must complete unmount/cleanup of the `AAPL` stream before initializing the `TSLA` update phase.

**Requirements:**
1. Track active ticker symbol.
2. Simulate streaming price updates using interval timers.
3. Clean up older stream timers during update/unmount phases.
4. Display active trading price.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function TickerStream({ symbol }) {
>   const [price, setPrice] = useState(150.0);
> 
>   useEffect(() => {
>     console.log(`[Mount/Update Phase] Initializing stream for ${symbol}`);
>     
>     const intervalId = setInterval(() => {
>       setPrice(prev => +(prev + (Math.random() - 0.48)).toFixed(2));
>     }, 800);
> 
>     return () => {
>       console.log(`[Unmount/Teardown Phase] Terminating stream for ${symbol}`);
>       clearInterval(intervalId);
>     };
>   }, [symbol]);
> 
>   return (
>     <div>
>       <h3>Ticker: {symbol}</h3>
>       <p>Price: ${price.toFixed(2)}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Symbol Invalidation**: Changing `symbol` forces React to run the teardown callback for the old symbol prior to mounting the new ticker stream.
> 2. **Functional State Updaters**: `setPrice(prev => ...)` guarantees updates read current state without needing `price` in the effect dependency list.
> 3. **Resource Protection**: Clearing intervals prevents background accumulation of dangling market feeds.
> 4. **Render Pipeline Integrity**: Component rendering remains pure, delegating socket initialization to post-paint lifecycle execution.
> 
### Exercise 3: Health Monitor Patient Session Manager

**Scenario:** A hospital patient monitoring station mounts patient data cards. The card must log session duration metrics, clearing timers when patient cards unmount or change.

**Requirements:**
1. Track patient active duration in seconds.
2. Increment elapsed timer using `setInterval` on mount.
3. Reset timer when `patientId` updates.
4. Clear timers on component unmount.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function PatientMonitorCard({ patientId }) {
>   const [elapsedSeconds, setElapsedSeconds] = useState(0);
> 
>   useEffect(() => {
>     setElapsedSeconds(0);
>     const timer = setInterval(() => {
>       setElapsedSeconds(prev => prev + 1);
>     }, 1000);
> 
>     return () => {
>       clearInterval(timer);
>     };
>   }, [patientId]);
> 
>   return (
>     <div className="patient-card">
>       <h4>Patient ID: {patientId}</h4>
>       <p>Session Elapsed: {elapsedSeconds}s</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Session Initialization**: Resetting `elapsedSeconds(0)` inside the effect resets metrics cleanly whenever `patientId` changes.
> 2. **Lifecycle Reset**: The `[patientId]` dependency ensures changing patients disposes of the active timer and spawns a fresh session.
> 3. **Unmount Safety**: `clearInterval(timer)` prevents memory leaks when patient cards are closed.
> 4. **State Isolation**: Timer state is bound strictly to the local component lifecycle instance.
> 
---

## 6. Related Terms

- [`useEffect` Hook](use_effect.md) — The hook API for executing side effects across component lifecycle phases.
- [Cleanup Functions](cleanup_functions.md) — Functions returned from effects to handle unmounting teardown.
- [Re-rendering](../level_02/re_rendering.md) — The component updating phase triggered by state or prop modifications.
- [Side Effects](side_effects.md) — Operations executed during mounting or updating lifecycle phases.

---

## 7. Key Takeaways

- The Component Lifecycle consists of three phases: Mounting (Birth), Updating (Life), and Unmounting (Death).
- Functional components handle all lifecycle phases declaratively using `useEffect` and dependency array configurations.
- Passing an empty array `[]` to `useEffect` mimics initial mounting execution.
- Returning a callback function from `useEffect` handles unmounting teardown and pre-update cleanups.
- Modern React models lifecycles as reactive state synchronization rather than imperative method calls.
```
