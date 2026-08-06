# `useTransition` Hook

> **Level 8 — Performance Optimization**
> Built-in React Hook for marking state updates as non-blocking transitions to keep user interfaces responsive during heavy re-renders.

---

## 1. Prerequisites

- [Concurrent Rendering](concurrent_rendering.md) — The engine mode powering transition scheduling.
- [`useState` Hook](../level_02/use_state.md) — The hook creating state updates enclosed inside transition callbacks.

---

## 2. Term Category

**Core Hook (state deferral)**: Built-in React Hook (`const [isPending, startTransition] = useTransition()`) that marks state updates as low-priority transitions. State updates wrapped inside `startTransition(() => { setState(...) })` can be interrupted by higher-priority user events (such as typing or clicking), allowing React to process urgent UI interactions immediately while rendering the transition in the background, unlike synchronous `useState` setters.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional React, every state update triggered by `setState` is treated as urgent. If clicking a tab triggers a state update that renders 3,000 components, React locks up the main thread until all 3,000 components are diffed and committed. During this time, the UI freezes, clicks are ignored, and hover states fail to respond.

React 18 introduced **`useTransition`** to differentiate between urgent and non-urgent state updates:
1. **Urgent Updates**: Reflect direct user physical actions like typing characters into an input field, clicking a checkbox, or pressing a button.
2. **Transition Updates**: Reflect view transitions like switching tabs, filtering a list, or rendering complex data graphs.
3. **`isPending` Indicator**: Returns a boolean `true` while the background transition is rendering, allowing developers to show inline loading spinners while keeping the existing UI interactive.
4. **Suspense Integration**: When switching views wrapped in `<Suspense>`, `useTransition` keeps the previous screen visible and interactive while the new screen renders in the background, avoiding jarring loading fallback flickers.

---

### (2) Reality Metaphor
Imagine a multi-lane highway system.
- **Synchronous Updates (Single Lane Highway)**: All vehicles—fast sports cars (**urgent text typing**) and heavy 18-wheeler cargo trucks (**heavy list updates**)—share a single lane. When a cargo truck stops, every sports car behind it is stuck waiting, unable to move.
- **`useTransition` (Express Toll Lane)**: The highway department creates an Express Lane (**urgent thread priority**) alongside the Cargo Freight Lane (**transition priority**). Fast sports cars zip down the Express Lane at 70 MPH, while heavy cargo trucks move smoothly in the Freight Lane without blocking sports cars.

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React, { useState, useTransition } from 'react';

export function TabButton({ children, onClick }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    // Mark parent state update as low-priority transition
    startTransition(() => {
      onClick();
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {children} {isPending && '...'}
    </button>
  );
}
```

#### Fuller Example
```jsx
import React, { useState, useTransition } from 'react';

function HeavyTabContent({ tabName }) {
  // Simulate heavy computation during tab render
  const items = Array.from({ length: 2500 }, (_, idx) => (
    <li key={idx}>
      {tabName} Row #{idx + 1}
    </li>
  ));
  return <ul className="tab-list">{items}</ul>;
}

export function MultiTabDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPending, startTransition] = useTransition();

  const handleTabSwitch = (nextTab) => {
    // Wrap heavy view transition inside startTransition
    startTransition(() => {
      setActiveTab(nextTab);
    });
  };

  return (
    <div className="tab-dashboard">
      <header className="tab-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => handleTabSwitch('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => handleTabSwitch('analytics')}
        >
          Analytics {isPending && '(Loading...)'}
        </button>
      </header>

      {isPending && <div className="pending-bar">Preparing {activeTab} view...</div>}

      <main className="tab-body">
        <HeavyTabContent tabName={activeTab} />
      </main>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Wrapping Text Input State Updates Inside `startTransition()`

**The mistake:** Wrapping text field `onChange` state setters inside `startTransition()`.

**Why it's wrong:** Text inputs are urgent physical user interactions. Delaying input state updates makes typing feel sluggish and out of sync with keypresses.

*Incorrect:*
```jsx
// BAD: Makes typing feel laggy and delayed
const handleType = (e) => {
  startTransition(() => {
    setInputValue(e.target.value);
  });
};
```

*Fix:*
```jsx
// GOOD: Keep text input state update urgent; transition non-urgent list filters
const handleType = (e) => {
  setInputValue(e.target.value); // Urgent
  startTransition(() => {
    setFilterQuery(e.target.value); // Transition
  });
};
```

---

### Mistake 2: Placing Asynchronous Code (Like `fetch`) Inside `startTransition()`

**The mistake:** Wrapping `async/await` network calls inside `startTransition(async () => { await fetch(...) })`.

**Why it's wrong:** The callback passed to `startTransition` must execute synchronously. Asynchronous code inside `startTransition` breaks React's tracking, preventing `isPending` from setting properly.

*Incorrect:*
```jsx
// BAD: Asynchronous callback inside startTransition
startTransition(async () => {
  const res = await fetch('/api/data');
  setData(await res.json());
});
```

*Fix:*
```jsx
// GOOD: Perform fetch first, then wrap synchronous setState inside startTransition
const res = await fetch('/api/data');
const json = await res.json();
startTransition(() => {
  setData(json);
});
```

---

### Mistake 3: Omitting `isPending` Visual Feedback

**The mistake:** Using `useTransition` without providing any visual feedback to the user while `isPending` is `true`.

**Why it's wrong:** Because transitions yield to the main thread, users might click a button and see no immediate UI change, assuming the button click was ignored.

*Incorrect:*
```jsx
// BAD: No feedback while background transition computes
<button onClick={() => startTransition(() => setTab('heavy'))}>Switch</button>
```

*Fix:*
```jsx
// GOOD: Provide pending state feedback
<button onClick={() => startTransition(() => setTab('heavy'))}>
  Switch {isPending && <Spinner />}
</button>
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Telemetry Tab Switcher

**Scenario:** An industrial IoT dashboard switches between live sensor readings and historical telemetry logs. Historical logs render 3,000 data cards. You must use `useTransition` to make tab switching responsive without freezing button hover states.

**Requirements:**
1. Manage active tab state.
2. Wrap tab switching in `startTransition`.
3. Display `isPending` status indicator.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useTransition } from 'react';
> 
> export function IoTTabController() {
>   const [tab, setTab] = useState('live');
>   const [isPending, startTransition] = useTransition();
> 
>   const switchTab = (nextTab) => {
>     startTransition(() => {
>       setTab(nextTab);
>     });
>   };
> 
>   return (
>     <div className="iot-tabs">
>       <div className="button-group">
>         <button onClick={() => switchTab('live')}>Live Feed</button>
>         <button onClick={() => switchTab('history')}>
>           Historical Telemetry {isPending && '...'}
>         </button>
>       </div>
> 
>       {isPending && <div className="loading">Rendering telemetry history...</div>}
>       <div className="view-panel">Current View: {tab.toUpperCase()}</div>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof IoTTabController === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Transition Wrapper**: `startTransition` marks `setTab('history')` as a low-priority render task.
> 2. **Interruption Safety**: High-priority user events (clicks on other controls) immediately interrupt background tab diffing.
> 3. **`isPending` Feedback**: Provides instant visual acknowledgement (`Loading...`) while background work computes.
> 4. **Frame Rate Protection**: Keeps button animations smooth at 60 FPS.
> 
---

### Exercise 2: Financial Order History Filter

**Scenario:** A crypto trading desk filters historical trade records across date ranges. You need to use `useTransition` so date slider adjustments remain smooth while updating thousands of transaction rows.

**Requirements:**
1. Implement date filter input.
2. Wrap trade filter state update in `startTransition`.
3. Verify state updaters use functional pattern.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useTransition } from 'react';
> 
> export function TradeHistoryFilter() {
>   const [days, setDays] = useState(7);
>   const [trades, setTrades] = useState([]);
>   const [isPending, startTransition] = useTransition();
> 
>   const handleSliderChange = (e) => {
>     const val = Number(e.target.value);
>     setDays(val);
> 
>     startTransition(() => {
>       const mockTrades = Array.from({ length: 2000 }, (_, i) => ({
>         id: i,
>         desc: `Trade #${i + 1} (${val} days ago)`
>       }));
>       setTrades(mockTrades);
>     });
>   };
> 
>   return (
>     <div className="trade-filter">
>       <h3>Trade History Filter</h3>
>       <input
>         type="range"
>         min="1"
>         max="30"
>         value={days}
>         onChange={handleSliderChange}
>       />
>       <span>Filter Range: Last {days} Days</span>
>       {isPending && <p>Filtering {trades.length} trade records...</p>}
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof TradeHistoryFilter === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Urgent Range Slider**: `setDays` updates slider position immediately on drag.
> 2. **Low-Priority Processing**: `setTrades` array creation runs inside `startTransition`.
> 3. **Cooperative Multitasking**: React yields to slider movement events between rendering array chunks.
> 4. **No Artificial Delays**: Unlike debouncing, rendering finishes as fast as the client CPU allows.
> 
---

### Exercise 3: E-Commerce Catalog View Switcher

**Scenario:** An online storefront switches product view modes between Grid and List view. You must wrap view mode changes in `useTransition` and handle `isPending` state.

**Requirements:**
1. State toggle for view mode.
2. Wrap setter inside `startTransition`.
3. Provide visual loading indicator.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useTransition } from 'react';
> 
> export function StorefrontViewSwitcher() {
>   const [mode, setMode] = useState('grid');
>   const [isPending, startTransition] = useTransition();
> 
>   const switchMode = (newMode) => {
>     startTransition(() => {
>       setMode(newMode);
>     });
>   };
> 
>   return (
>     <div className="view-switcher">
>       <button onClick={() => switchMode('grid')}>Grid View</button>
>       <button onClick={() => switchMode('list')}>
>         List View {isPending && '(Switching...)'}
>       </button>
>       <p>Active View Mode: {mode}</p>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof StorefrontViewSwitcher === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Transition Scheduling**: `switchMode` delegates rendering heavy catalog layouts to low-priority Fiber tasks.
> 2. **Pending Indicator**: Displays `(Switching...)` during view calculation.
> 3. **User Responsiveness**: UI remains interactive during view mutations.
> 4. **Fiber Re-prioritization**: Higher priority mouse events override active view transitions.
> 
---

## 6. Related Terms

- [Concurrent Rendering](concurrent_rendering.md) — Concurrent rendering engine supporting transitions.
- [`useDeferredValue` Hook](use_deferred_value.md) — Companion hook used when deferring prop values without direct setter access.
- [Suspense](suspense.md) — Boundary integrated with transitions to avoid hiding existing UI.

---

## 7. Key Takeaways

- `useTransition` returns `[isPending, startTransition]` to mark state updates as non-blocking transitions.
- Wrap non-urgent view transitions (tab switches, data filters) inside `startTransition(() => { setState(...) })`.
- Urgent updates (text field typing, keypresses) must remain outside `startTransition`.
- Use `isPending` to render loading indicators while background transitions calculate.
- Callbacks passed to `startTransition` must be synchronous; perform async fetches prior to calling `startTransition`.
