# Automatic Batching

> **Level 2 — State & Reactivity**
> React's performance mechanic of grouping multiple state setter calls into a single re-render cycle across all event contexts.

---

## 1. Prerequisites

- [State](state.md) — The state variables being updated.
- [Re-rendering](re_rendering.md) — The component re-evaluation cycle triggered by state updates.
- [`useState` Hook](use_state.md) — The hook used to declare and update state variables.

---

## 2. Term Category

**Rendering Mechanic (state batching engine)**: Automatic Batching is a core performance optimization mechanic introduced in React 18. Batching is the process where React groups multiple state update setter calls into a single re-render pass, preventing intermediate component re-evaluations and eliminating visual layout flicker.

While earlier versions of React only batched state updates within React synthetic event handlers (like `onClick`), React 18 automatically batches ALL state updates regardless of where they originate—including promises, `setTimeout` timers, native DOM event listeners, and fetch callbacks.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In interactive web applications, a single user action (such as submitting a form or fetching data) frequently triggers multiple state updates:

```javascript
setLoading(true);
setUser(data);
setError(null);
```

If React re-rendered the component immediately upon each individual setter invocation, this single action would trigger three sequential re-render cycles. Multiple renders consume excessive CPU cycles and cause visual layout flashing where partial states (e.g., `user` loaded while `loading` is still `true`) render to the screen for split seconds.

React solves this through **Batching**:
- **Legacy Batching (React 17 and earlier):** React batched updates *only* when called inside React synthetic event handlers (`onClick`). However, if state setters executed inside asynchronous callbacks (such as `fetch().then()`, `setTimeout`, or native event listeners), React failed to batch them, triggering independent re-renders for every setter.
- **Automatic Batching (React 18+):** React 18 uses its Fiber engine microtask queue to batch ALL state updates within the same JavaScript execution microtask, ensuring a single combined re-render cycle regardless of asynchronous execution context.

### (2) Reality Metaphor
Imagine mailing letters at the local post office.

- **Un-batched Delivery (Individual Trips):** You write three separate letters. After writing the first letter, you get into your car, drive to the post office, drop off the letter, and drive back home. You repeat this entire driving process for the second and third letters. You make three long trips, wasting time and fuel (**consuming CPU and rendering resources**).
- **Automatic Batching (Outgoing Mail Tray):** You write all three letters and place them in an outgoing tray on your desk (**scheduling state updates**). At the end of the hour, a mail carrier arrives once, collects all three letters simultaneously, and delivers them to the post office in a single trip (**one unified re-render pass**).

### (3) React Code Examples

#### Short Snippet
```jsx
// React 18 automatically batches both setter calls inside async callbacks into 1 render
import { useState } from 'react';

function UserLoader() {
  const [user, setUser] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const loadData = () => {
    setIsPending(true);
    fetch('/api/user/1')
      .then(res => res.json())
      .then(data => {
        // Automatic Batching in React 18: Triggers ONLY 1 combined re-render!
        setUser(data);
        setIsPending(false);
      });
  };

  return <button onClick={loadData}>Load User</button>;
}
```

#### Fuller Example
```jsx
import React, { useState } from 'react';
import { flushSync } from 'react-dom';

export default function BatchingComparison() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  console.log("Component evaluated! (Render count indicator)");

  const handleStandardAsyncBatch = () => {
    setTimeout(() => {
      // Both setters execute inside setTimeout; React 18 batches them into 1 render!
      setCount(c => c + 1);
      setFlag(f => !f);
    }, 100);
  };

  const handleForcedSynchronousRender = () => {
    // flushSync forces React to flush state updates synchronously to the DOM immediately
    flushSync(() => {
      setCount(c => c + 1);
    });
    // DOM is updated right here!
    flushSync(() => {
      setFlag(f => !f);
    });
  };

  return (
    <div className="batching-box">
      <h3>Automatic Batching Demo</h3>
      <p>Count: {count} | Flag: {flag ? 'TRUE' : 'FALSE'}</p>

      <button onClick={handleStandardAsyncBatch}>
        Async Update (Batched - 1 Render)
      </button>

      <button onClick={handleForcedSynchronousRender}>
        Bypass Batching via flushSync (2 Renders)
      </button>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Read Updated State Immediately After Calling Setter

**The mistake:** Calling `setCount(count + 1)` and attempting to read `console.log(count)` on the next line expecting the new value.

**Why it's wrong:** State setters do not mutate local scope variables synchronously! Setters place update requests into React's update queue to be batched and evaluated during the *next* render cycle. The local variable `count` remains a constant snapshot representing the current render frame.

*Incorrect:*
```jsx
const [score, setScore] = useState(0);

const handleWin = () => {
  setScore(100);
  // ❌ Logs 0, NOT 100! Score snapshot updates on next render frame.
  console.log(score); 
};
```

*Fix:*
```jsx
const [score, setScore] = useState(0);

const handleWin = () => {
  const nextScore = 100;
  setScore(nextScore);
  // ✅ Read local variable directly for immediate logic
  console.log(nextScore); 
};
```

### Mistake 2: Using Legacy `ReactDOM.unstable_batchedUpdates` in React 18+

**The mistake:** Wrapping async state updates inside `ReactDOM.unstable_batchedUpdates(() => { ... })` inside fetch promises in React 18+.

**Why it's wrong:** Automatic Batching in React 18 automatically handles state batching across all asynchronous contexts (promises, timers, native listeners). Legacy batching wrapper functions are redundant and obsolete.

*Incorrect:*
```jsx
// ❌ Legacy manual batching wrapper is obsolete in React 18!
fetch('/api').then(() => {
  ReactDOM.unstable_batchedUpdates(() => {
    setCount(c => c + 1);
    setReady(true);
  });
});
```

*Fix:*
```jsx
// ✅ React 18 automatically batches these updates out of the box
fetch('/api').then(() => {
  setCount(c => c + 1);
  setReady(true);
});
```

### Mistake 3: Overusing `flushSync` Breaking Render Performance

**The mistake:** Wrapping every state setter inside `flushSync(() => setState(...))` to force synchronous rendering.

**Why it's wrong:** `flushSync` interrupts React's batching pipeline, forcing immediate synchronous DOM layout recalculations. Overusing `flushSync` degrades performance and causes visual UI stuttering. Only use `flushSync` when reading DOM measurements (like scroll position) immediately after a state update.

*Incorrect:*
```jsx
// ❌ Forces unnecessary synchronous DOM updates!
const handleUpdate = () => {
  flushSync(() => setName('Alice'));
  flushSync(() => setAge(30));
};
```

*Fix:*
```jsx
// ✅ Allow React to batch updates automatically
const handleUpdate = () => {
  setName('Alice');
  setAge(30);
};
```

---

## 5. Practice Exercises

### Exercise 1: IoT Industrial Telemetry Batching Monitor (IoT Telemetry)

**Scenario:** An industrial IoT monitoring client receives multi-sensor telemetry payloads over WebSockets. Multiple sensor states (`temperature`, `pressure`, `humidity`) update rapidly. Verify Automatic Batching groups these updates into a single re-render.

**Requirements:**
1. Create `SensorMonitor` managing `temp`, `pressure`, and `humidity` state.
2. Track total component renders using a render counter reference.
3. Simulate an async WebSocket message updating all three states simultaneously inside `setTimeout`.
4. Demonstrate that render count increments by exactly 1 per WebSocket frame.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useRef } from 'react';
> 
> export function SensorMonitor() {
>   const [temp, setTemp] = useState(22.0);
>   const [pressure, setPressure] = useState(101.3);
>   const [humidity, setHumidity] = useState(45.0);
> 
>   const renderCount = useRef(0);
>   renderCount.current += 1;
> 
>   const handleReceiveTelemetry = () => {
>     // Simulated async WebSocket event
>     setTimeout(() => {
>       // React 18 automatically batches all 3 updates into 1 render pass!
>       setTemp(25.4);
>       setPressure(103.1);
>       setHumidity(50.2);
>     }, 50);
>   };
> 
>   return (
>     <div className="telemetry-box">
>       <h4>IoT Telemetry Monitor</h4>
>       <p>Renders Executed: {renderCount.current}</p>
>       <p>Temp: {temp}°C | Pressure: {pressure}kPa | Humidity: {humidity}%</p>
>       <button onClick={handleReceiveTelemetry}>Simulate WebSocket Payload</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Microtask Batching**: React 18 batches `setTemp`, `setPressure`, and `setHumidity` inside `setTimeout` into a single render pass.
> 2. **Render Counter Tracking**: `renderCount.current` increments by exactly 1 rather than 3 when the payload arrives.
> 3. **Layout Stability**: Prevents intermediate renders where temperature updates before humidity.
> 4. **Resource Optimization**: Saves main-thread CPU diffing cycles during high-frequency data ingestion.
> 
---

### Exercise 2: High-Frequency Trading Order Status Batching (Financial Trading)

**Scenario:** A trading terminal updates order execution status, filled volume, and account balance upon receiving trade execution receipts. Ensure updates inside Promise callbacks batch cleanly.

**Requirements:**
1. Create `TradeExecution` managing `status`, `filledQty`, and `balance`.
2. Update all 3 state variables inside an asynchronous `fetch()` promise response.
3. Verify Automatic Batching executes a single render cycle upon promise resolution.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function TradeExecution() {
>   const [status, setStatus] = useState('PENDING');
>   const [filledQty, setFilledQty] = useState(0);
>   const [balance, setBalance] = useState(10000);
> 
>   const executeTrade = () => {
>     // Simulated async order execution API promise
>     Promise.resolve({ status: 'FILLED', qty: 50, cost: 2500 }).then(res => {
>       // React 18 batches promise resolutions automatically!
>       setStatus(res.status);
>       setFilledQty(res.qty);
>       setBalance(prev => prev - res.cost);
>     });
>   };
> 
>   return (
>     <div className="trade-card">
>       <h4>Order Execution Status: {status}</h4>
>       <p>Filled Shares: {filledQty} | Account Cash: ${balance}</p>
>       <button onClick={executeTrade}>Submit Buy Order</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Promise Batching**: Async promise callbacks (`.then()`) undergo automatic batching out of the box in React 18.
> 2. **Updater Function Pattern**: `setBalance(prev => prev - res.cost)` calculates updated balances safely within the batched queue.
> 3. **Atomic UI Sync**: Financial UI guarantees that order status, filled quantity, and cash balance render simultaneously.
> 4. **No Flashing States**: Avoids intermediate states where cash balance drops before filled shares display.
> 
---

### Exercise 3: E-Commerce Checkout Form Multi-State Reset (E-Commerce)

**Scenario:** An e-commerce checkout page resets promotional codes, shipping methods, and cart items when changing payment methods. Use `flushSync` only when scroll positioning reading is required.

**Requirements:**
1. Create `CheckoutReset` managing `promoCode`, `shippingMethod`, and `cartTotal`.
2. Demonstrate standard automatic batching when resetting fields.
3. Show `flushSync` usage when DOM measurements must be read synchronously after state changes.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useRef } from 'react';
> import { flushSync } from 'react-dom';
> 
> export function CheckoutReset() {
>   const [promo, setPromo] = useState('SUMMER10');
>   const [shipping, setShipping] = useState('EXPRESS');
>   const scrollRef = useRef(null);
> 
>   const handleStandardReset = () => {
>     // Standard automatic batching: 1 combined render
>     setPromo('');
>     setShipping('STANDARD');
>   };
> 
>   const handleResetAndScroll = () => {
>     // Force synchronous DOM update to read scroll dimensions immediately
>     flushSync(() => {
>       setPromo('');
>       setShipping('STANDARD');
>     });
>     // DOM is updated synchronously; scroll position can be set safely
>     if (scrollRef.current) {
>       scrollRef.current.scrollTop = 0;
>     }
>   };
> 
>   return (
>     <div ref={scrollRef} className="checkout-panel" style={{ height: '150px', overflowY: 'scroll' }}>
>       <h4>Checkout Settings</h4>
>       <p>Promo: {promo || 'None'} | Shipping: {shipping}</p>
>       <button onClick={handleStandardReset}>Reset Settings (Batched)</button>
>       <button onClick={handleResetAndScroll}>Reset & Scroll Top (flushSync)</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Default Microtask Batching**: `handleStandardReset` batches setter calls into one microtask pass.
> 2. **Surgical flushSync Usage**: `flushSync` is applied strictly when immediate DOM measurement operations (`scrollTop = 0`) depend on updated DOM layouts.
> 3. **Controlled Scheduling**: Demonstrates balancing automatic performance optimization with necessary DOM synchronization escape hatches.
> 4. **Functional Predictability**: State updates follow deterministic update queues across execution flows.
> 
---

## 6. Related Terms

- [Re-rendering](re_rendering.md) — The UI update cycle triggered when batched state updates execute.
- [State](state.md) — Component memory variables managed by batching update queues.
- [`useState` Hook](use_state.md) — The primary hook used to queue batched state updates.
- [The Fiber Architecture](../level_01/fiber_architecture.md) — The unit-of-work engine that schedules batched rendering queues.

---

## 7. Key Takeaways

- **Automatic Batching** groups multiple state setter calls into a single re-render cycle.
- React 18 automatically batches updates across ALL contexts: synthetic handlers, promises, timeouts, and native listeners.
- Batching prevents intermediate partial renders and eliminates visual layout flashing.
- State setter calls do NOT update local variables synchronously; updated values appear on the next render.
- Use `flushSync` sparingly only when DOM measurements must be read immediately following a state update.
