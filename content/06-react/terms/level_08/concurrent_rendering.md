# Concurrent Rendering

> **Level 8 — Performance Optimization**
> React 18's interruptible rendering engine allowing UI tasks to be paused, prioritized, or discarded.

---

## 1. Prerequisites

- [The Fiber Architecture](../level_01/fiber_architecture.md) — The cooperative scheduling engine enabling chunked render execution.
- [Render Purity](../level_01/render_purity.md) — Crucial because paused concurrent rendering cycles can be re-evaluated multiple times before committing.

---

## 2. Term Category

**Rendering Mechanic (concurrent engine)**: Internal engine mechanism in React 18+ that transitions rendering from synchronous blocking execution to interruptible task scheduling. Built on top of Fiber architecture, Concurrent Rendering yields control back to the browser main thread during large updates, ensuring high-priority user events (such as typing or clicking) receive immediate frame paints, unlike legacy synchronous render engines.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In React 17 and earlier versions, rendering was a monolithic, synchronous operation. Once a component state update triggered a render tree evaluation, React locked up the main JavaScript thread until the entire Virtual DOM tree was diffed and committed to the browser DOM.

When rendering complex UI trees (e.g., thousands of table rows, rich canvas graphics, or complex tree structures), this synchronous lockup caused input lag, dropped animation frames, and unresponsive user interfaces. Users typing into a search box experienced keypress stuttering because the main thread could not process browser input events until React finished rendering.

React 18 solved this by introducing **Concurrent Rendering**:
1. **Interruptible Execution**: React splits rendering work into small work units assigned to Fiber nodes. After processing each unit, React checks if higher-priority events exist in the browser event queue.
2. **Priority-Based Scheduling**: User interactions (typing, clicking, tapping) are tagged as Urgent priorities. List filtering, tab switching, and chart updates are tagged as Non-Urgent Transition priorities.
3. **Task Discarding & Pause/Resume**: If a user types a new character while React is mid-way through rendering a heavy list for a previous character, React abandons the stale rendering work in memory and immediately begins processing the new input event.

---

### (2) Reality Metaphor
Imagine a busy restaurant kitchen.
- **Synchronous Rendering (Blocking Chef)**: A customer orders a 50-course catering feast. The chef refuses to answer any questions or hand out simple drinks until all 50 dishes are cooked and plated. A long line of walk-in customers wanting simple sodas forms out the door, unable to be served.
- **Concurrent Rendering (Agile Chef)**: The chef begins slicing vegetables for the 50-course feast (**rendering chunk**). After each slice, the chef glances at the front counter. When a walk-in customer asks for a soda (**urgent input**), the chef pauses vegetable prep, hands the customer their soda, and then resumes preparing the 50-course feast (**background transition**).

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React, { useState, useTransition } from 'react';

export function SearchBox() {
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleInput = (e) => {
    // Urgent update: text input updates immediately
    setInput(e.target.value);
    
    // Non-urgent transition: background list processing can be interrupted
    startTransition(() => {
      // Slow state updates wrapped here yield to main thread
    });
  };

  return <input value={input} onChange={handleInput} />;
}
```

#### Fuller Example
```jsx
import React, { useState, useTransition } from 'react';

// Generates a mock heavy array of data rows
function generateHeavyData(query) {
  if (!query) return [];
  const items = [];
  for (let i = 0; i < 5000; i++) {
    items.push(`${query} - Result Row #${i + 1}`);
  }
  return items;
}

export function ConcurrentDataGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearchChange = (e) => {
    const nextQuery = e.target.value;
    
    // Priority 1: Immediate state update keeps text input responsive
    setSearchTerm(nextQuery);

    // Priority 2: Wrap heavy 5,000-item recalculation in interruptible transition
    startTransition(() => {
      const data = generateHeavyData(nextQuery);
      setFilteredResults(data);
    });
  };

  return (
    <div className="grid-container">
      <h2>Concurrent Data Grid</h2>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Type to filter 5,000 items..."
        className="search-field"
      />

      {isPending && <div className="pending-indicator">Rendering updated results...</div>}

      <ul className="results-list">
        {filteredResults.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Concurrent Rendering with Multi-Threading Speedups

**The mistake:** Assuming Concurrent Rendering runs JavaScript on worker threads to make computationally heavy, unoptimized functions execute faster.

**Why it's wrong:** JavaScript remains strictly single-threaded. Concurrent Rendering changes *when* work is executed by chunking renders, not *how fast* CPU math runs. A 500ms synchronous loop in a render body will still block the browser main thread.

*Incorrect:*
```jsx
function HeavyComponent() {
  // BAD: Synchronous heavy math directly inside render still blocks thread
  const data = hugeArray.sort((a, b) => expensiveCalc(a) - expensiveCalc(b));
  return <div>{data.length}</div>;
}
```

*Fix:*
```jsx
function HeavyComponent() {
  // GOOD: Cache computation with useMemo; use transitions to schedule updates
  const data = useMemo(() => hugeArray.sort((a, b) => expensiveCalc(a) - expensiveCalc(b)), [hugeArray]);
  return <div>{data.length}</div>;
}
```

---

### Mistake 2: Executing Impure Side Effects During Render Phase

**The mistake:** Mutating external variables, modifying DOM directly, or pushing items to global arrays during component render when Concurrent Rendering is enabled.

**Why it's wrong:** Under Concurrent Rendering, React can evaluate a component render phase, pause it, throw away the intermediate Fiber tree, and restart rendering from scratch. Impure side effects inside render will execute multiple times unexpectedly.

*Incorrect:*
```jsx
let renderCount = 0;

function CounterDisplay() {
  // BAD: Impure global mutation during render phase
  renderCount += 1;
  return <div>Render Count: {renderCount}</div>;
}
```

*Fix:*
```jsx
function CounterDisplay() {
  // GOOD: Isolate side effects in useEffect
  useEffect(() => {
    // Perform external tracking safely after commit phase
  }, []);
  return <div>Clean Component</div>;
}
```

---

### Mistake 3: Performing Heavy Filtering Synchronously on Keypress

**The mistake:** Updating large dataset states synchronously inside text input `onChange` handlers without utilizing priority transitions.

**Why it's wrong:** Synchronous updates assign equal priority to typing and heavy list diffing, causing noticeable input delay and dropped animation frames.

*Incorrect:*
```jsx
// BAD: Synchronous state updates freeze typing responsiveness
onChange={(e) => {
  setQuery(e.target.value);
  setResults(filterHeavyList(e.target.value)); // Blocks frame paint!
}}
```

*Fix:*
```jsx
// GOOD: Split urgent typing from interruptible list calculation
onChange={(e) => {
  setQuery(e.target.value);
  startTransition(() => {
    setResults(filterHeavyList(e.target.value));
  });
}}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Network Dashboard

**Scenario:** An industrial plant dashboard monitors thousands of IoT sensor telemetry signals. High-frequency background readings update temperature graphs, while operators type critical emergency command overrides. You need to leverage Concurrent Rendering so command typing never stutters.

**Requirements:**
1. Maintain urgent input state for operator command text field.
2. Use `useTransition` to process non-urgent telemetry graph updates.
3. Show visual pending indicator while background graph transition is processing.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useTransition } from 'react';
> 
> export function IoTSensorDashboard() {
>   const [commandText, setCommandText] = useState('');
>   const [telemetryLogs, setTelemetryLogs] = useState([]);
>   const [isPending, startTransition] = useTransition();
> 
>   const handleCommandInput = (e) => {
>     const text = e.target.value;
>     // Urgent state update: keep operator command field immediate
>     setCommandText(text);
> 
>     // Non-urgent background processing: update telemetry filter
>     startTransition(() => {
>       const mockLogs = Array.from({ length: 2000 }, (_, i) => ({
>         id: i,
>         sensor: `Sensor-${i % 50}`,
>         status: text ? `Matched: ${text}` : 'Nominal'
>       }));
>       setTelemetryLogs(mockLogs);
>     });
>   };
> 
>   return (
>     <div className="telemetry-dashboard">
>       <h2>IoT Control Center</h2>
>       <input
>         type="text"
>         value={commandText}
>         onChange={handleCommandInput}
>         placeholder="Enter emergency command..."
>         className="command-input"
>       />
> 
>       {isPending && <p className="status">Processing telemetry graph filter...</p>}
> 
>       <div className="log-summary">
>         <p>Active Sensors Processed: {telemetryLogs.length}</p>
>       </div>
>     </div>
>   );
> }
> 
> // Mock assertion
> if (typeof window !== 'undefined') {
>   console.assert(typeof IoTSensorDashboard === 'function', 'Dashboard must be function');
> }
> ```
>
> #### Technical Explanation
> 1. **Urgent Keypress Dispatch**: `setCommandText` executes immediately, triggering browser text paint without waiting for list diffing.
> 2. **`startTransition` Wrapping**: Enclosing `setTelemetryLogs` marks the 2,000-item array recalculation as an interruptible low-priority task.
> 3. **Cooperative Yielding**: If the operator types another character mid-render, React pauses the log calculation, processes the keypress, and restarts the render.
> 4. **Pending UI State**: `isPending` provides real-time feedback while background work yields to frame paints.
> 
---

### Exercise 2: Cryptocurrency Trading Order Desk

**Scenario:** A financial exchange web application displays real-time order books. Traded asset order books undergo frequent updates. Users filtering order books by price thresholds must experience zero UI stuttering.

**Requirements:**
1. Implement urgent state for price filter input field.
2. Wrap order book calculation in `startTransition`.
3. Verify state updates use functional updater patterns where appropriate.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useTransition } from 'react';
> 
> export function CryptoOrderDesk() {
>   const [priceFilter, setPriceFilter] = useState('');
>   const [orderBook, setOrderBook] = useState([]);
>   const [isPending, startTransition] = useTransition();
> 
>   const handleFilterChange = (e) => {
>     const val = e.target.value;
>     setPriceFilter(val);
> 
>     startTransition(() => {
>       const filtered = Array.from({ length: 3000 }, (_, i) => ({
>         id: `order-${i}`,
>         price: 60000 + i * 2,
>         amount: (i * 0.05).toFixed(2)
>       })).filter((order) => !val || order.price >= Number(val));
> 
>       setOrderBook(filtered);
>     });
>   };
> 
>   return (
>     <div className="trading-desk">
>       <h3>Crypto Order Desk</h3>
>       <input
>         type="number"
>         value={priceFilter}
>         onChange={handleFilterChange}
>         placeholder="Min Price Filter ($)..."
>       />
>       {isPending && <span>Updating Order Depth...</span>}
>       <p>Matching Orders: {orderBook.length}</p>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof CryptoOrderDesk === 'function', 'Component exists');
> }
> ```
>
> #### Technical Explanation
> 1. **Priority Scheduling**: Text input rendering is assigned priority tier 1; order depth computation is assigned tier 2.
> 2. **Fiber Interruption**: React Fiber engine pauses `setOrderBook` calculation if new price input numbers arrive.
> 3. **Memory Garbage Reduction**: Intermediate incomplete Fiber subtrees are safely discarded before DOM commit.
> 4. **Frame Consistency**: FPS rates stay locked at 60fps during intense market volatility and active searching.
> 
---

### Exercise 3: E-Commerce Product Catalog Search

**Scenario:** A retail storefront features a catalog with thousands of items. Users filtering products by keyword must see instant keystroke feedback while product grid renders yield to input events.

**Requirements:**
1. Manage user search input state immediately.
2. Defer catalog grid state updates using `startTransition`.
3. Display non-blocking loader indicator.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useTransition } from 'react';
> 
> export function CatalogSearch() {
>   const [query, setQuery] = useState('');
>   const [items, setItems] = useState([]);
>   const [isPending, startTransition] = useTransition();
> 
>   const onSearch = (e) => {
>     const text = e.target.value;
>     setQuery(text);
> 
>     startTransition(() => {
>       const matched = Array.from({ length: 1500 }, (_, idx) => ({
>         id: idx,
>         name: `Product ${text} #${idx}`
>       }));
>       setItems(matched);
>     });
>   };
> 
>   return (
>     <div className="storefront-search">
>       <input
>         type="text"
>         value={query}
>         onChange={onSearch}
>         placeholder="Search catalog..."
>       />
>       {isPending && <span className="loader">Filtering items...</span>}
>       <div className="item-count">Found {items.length} items</div>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof CatalogSearch === 'function', 'Component exists');
> }
> ```
>
> #### Technical Explanation
> 1. **Non-Blocking UI**: Keystrokes render synchronously without waiting for catalog list calculation.
> 2. **Concurrent Scheduling**: Fiber work units yield back to browser main loop between chunk evaluations.
> 3. **Discarding Stale Work**: Fast typing automatically invalidates previous query renders before DOM layout.
> 4. **User Experience**: Visual pending indicators maintain UI clarity during intensive search operations.
> 
---

## 6. Related Terms

- [The Fiber Architecture](../level_01/fiber_architecture.md) — The virtual frame data structure enabling interruptible rendering.
- [`useTransition` Hook](use_transition.md) — Hook for marking state updates as non-blocking transition priorities.
- [`useDeferredValue` Hook](use_deferred_value.md) — Hook for deferring expensive derived values.

---

## 7. Key Takeaways

- Concurrent rendering transforms React from synchronous blocking rendering to interruptible priority-based task scheduling.
- Fiber architecture splits rendering work into small units, yielding control back to the browser main thread between units.
- User input events (typing, clicking) receive immediate frame rendering priority over background list/graph updates.
- Incomplete concurrent renders can be paused, resumed, or discarded cleanly without affecting the active browser DOM.
- Render functions must remain pure because concurrent scheduling may evaluate render bodies multiple times before committing.
