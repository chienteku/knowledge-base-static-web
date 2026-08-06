# The Fiber Architecture

> **Level 1 — Core Concepts**
> React's internal unit-of-work engine that enables asynchronous, interruptible rendering and task prioritization.

---

## 1. Prerequisites

- [Virtual DOM](virtual_dom.md) — The visual tree structure represented internally by Fiber nodes.
- [Reconciliation](reconciliation.md) — The diffing process scheduled and executed by the Fiber engine.

---

## 2. Term Category

**Rendering Mechanic (reconciliation engine)**: The Fiber Architecture is React's core rendering engine and reconciliation algorithm rewritten in React 16. Replacing the legacy synchronous "Stack Reconciler", Fiber reimagines component trees as a virtual call stack composed of linked-list "Fiber nodes".

This structure enables React to split reconciliation work into small, asynchronous units of work, allowing rendering tasks to be paused, aborted, resumed, or prioritized based on browser animation frames and user interaction events.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Before React 16, React processed updates using the legacy Stack Reconciler. When state changed, React recursively walked down the entire Virtual DOM tree, computed changes, and updated the real DOM in a single synchronous call stack block.

If an application had a large component tree, a single render cycle could block the browser main thread for 100 milliseconds or longer. Because browser layout rendering, user typing, and animations run on that same single thread, long synchronous renders caused dropped animation frames, UI freezing, and input lag.

To solve this main-thread starvation problem, React engineers completely rebuilt the core engine into **Fiber**:
- **Fiber Nodes as Units of Work:** Each React element maps to a Fiber node (a plain JavaScript object containing element type, state, props, and pointers to child, sibling, and parent return nodes).
- **Two-Phase Rendering Engine:**
  1. **Render/Reconciliation Phase (Asynchronous & Interruptible):** React traverses the Fiber tree and calculates diffs. If a high-priority browser task (like a user click or keypress) arrives mid-render, React pauses or discards the current render work, yields execution back to the browser event loop, and resumes later.
  2. **Commit Phase (Synchronous & Fast):** React applies calculated DOM changes in a single uninterrupted pass to ensure screen visual consistency.

### (2) Reality Metaphor
Imagine a restaurant kitchen preparing a 10-course banquet menu.

- **Stack Reconciler (Legacy Chef):** The chef starts cooking all 10 courses in one uninterrupted marathon session. Even if a customer runs up to report an emergency or request a glass of water, the chef refuses to pause mid-dish. The customer waits indefinitely (**browser main thread freezes**).
- **Fiber Engine (Modern Chef):** The chef breaks cooking down into discrete 2-minute micro-tasks (chopping onions, searing one steak). Between micro-tasks, the chef glances up at the service counter (**browser event loop**). If an urgent customer request arrives, the chef pauses food prep, handles the urgent request immediately (**UI stays responsive**), and then picks up cooking right where they left off.

### (3) React Code Examples

#### Short Snippet
```jsx
// Fiber schedules rendering based on task priority.
// Concurrent hooks like useTransition rely directly on Fiber's interruptible pipeline.
import { useState, useTransition } from 'react';

function PrioritySearch() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    // High Priority: Input text updates immediately
    setQuery(e.target.value);
    
    // Low Priority: Heavy search filtering can be interrupted by Fiber
    startTransition(() => {
      // Complex search logic...
    });
  };

  return <input value={query} onChange={handleChange} />;
}
```

#### Fuller Example
```jsx
import React, { useState, useTransition } from 'react';

// Heavy list item component simulating complex rendering
function HeavyItem({ index, query }) {
  // Artificial CPU work simulation
  const startTime = performance.now();
  while (performance.now() - startTime < 0.5) {}

  return <div className="list-item">Item #{index} for "{query}"</div>;
}

export default function InterruptibleList() {
  const [text, setText] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleInputChange = (e) => {
    const value = e.target.value;
    // High-priority update: Keeps typing smooth on main thread
    setText(value);

    // Low-priority Fiber update: Interruptible during heavy list generation
    startTransition(() => {
      setDeferredQuery(value);
    });
  };

  return (
    <div className="container">
      <input value={text} onChange={handleInputChange} placeholder="Type rapidly..." />
      {isPending && <span className="spinner">Yielding main thread...</span>}
      <div className="heavy-grid">
        {Array.from({ length: 200 }).map((_, i) => (
          <HeavyItem key={i} index={i} query={deferredQuery} />
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Executing Impure Side Effects Directly Inside Render Bodies

**The mistake:** Executing network requests, global state mutations, or timers directly in component render bodies instead of `useEffect`.

**Why it's wrong:** Under Fiber's interruptible engine, the Render phase can be paused, restarted, or completely discarded multiple times before committing. Impure side effects in render functions execute multiple times, causing duplicate API requests, memory leaks, and inconsistent application states.

*Incorrect:*
```jsx
function UserProfile({ userId }) {
  // ❌ Side-effect executed in Fiber Render Phase! May run multiple times.
  fetch(`/api/users/${userId}`).then(res => res.json());

  return <div>User Profile</div>;
}
```

*Fix:*
```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // ✅ Side-effects safely executed in Commit Phase via useEffect
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]);

  return <div>{user ? user.name : 'Loading...'}</div>;
}
```

### Mistake 2: Expecting Fiber Render Traversal to Run as a Single Synchronous Stack

**The mistake:** Assuming long rendering loops in React 18 will block user input events in the exact same manner as legacy React versions.

**Why it's wrong:** Fiber breaks component reconciliation into linked-list traversals (`child`, `sibling`, `return`). Assuming synchronous execution prevents developers from leveraging Concurrent features like `useTransition` and `useDeferredValue`.

*Incorrect:*
```jsx
// Assuming long render tasks cannot be interrupted by user input
```

*Fix:*
```jsx
// Wrap non-urgent updates in startTransition to allow Fiber task splitting
startTransition(() => {
  setLargeDataset(filteredResults);
});
```

### Mistake 3: Writing State Setters inside Render Bodies Causing Fiber Re-render Loops

**The mistake:** Calling a state setter function unconditionally inside the component body.

**Why it's wrong:** Calling `setState` directly during render forces Fiber to restart the render phase immediately, leading to an infinite loop error (`Too many re-renders. React limits the number of renders to prevent an infinite loop`).

*Incorrect:*
```jsx
function Counter({ initialCount }) {
  const [count, setCount] = useState(initialCount);
  setCount(initialCount); // ❌ Forces Fiber into infinite render loop!
  return <div>{count}</div>;
}
```

*Fix:*
```jsx
function Counter({ initialCount }) {
  const [count, setCount] = useState(initialCount);
  // Compute during render or handle updates via event handlers/effects
  return <div>{count}</div>;
}
```

---

## 5. Practice Exercises

### Exercise 1: Real-Time Financial Order Book Priority Rendering (Financial Trading)

**Scenario:** A trading terminal receives high-frequency market order book updates (100 updates/sec). Rendering every update synchronously freezes user input controls. Implement `useTransition` to let Fiber prioritize user input over order book rendering.

**Requirements:**
1. Create a `TradingTerminal` component managing `filterSymbol` (high priority) and `orderBookData` (low priority).
2. Use `useTransition` to mark order book data processing as low priority.
3. Display a loading indicator when Fiber defers low-priority updates.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useTransition } from 'react';
> 
> export function TradingTerminal({ fullBookData }) {
>   const [symbol, setSymbol] = useState('BTC-USD');
>   const [activeBook, setActiveBook] = useState(fullBookData);
>   const [isPending, startTransition] = useTransition();
> 
>   const handleSymbolChange = (e) => {
>     const nextSymbol = e.target.value;
>     // Urgent: Input text updates immediately for zero typing latency
>     setSymbol(nextSymbol);
> 
>     // Non-urgent: Fiber defers heavy dataset filter if user types fast
>     startTransition(() => {
>       const filtered = fullBookData.filter(item => item.symbol.includes(nextSymbol));
>       setActiveBook(filtered);
>     });
>   };
> 
>   return (
>     <div className="terminal">
>       <input value={symbol} onChange={handleSymbolChange} placeholder="Filter pair..." />
>       {isPending && <span className="pending-indicator">Updating order book...</span>}
>       <div className="book-list">
>         {activeBook.slice(0, 50).map(row => (
>           <div key={row.id} className="row">{row.symbol}: ${row.price}</div>
>         ))}
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Priority Segmentation**: Input text state (`symbol`) is updated synchronously, while `activeBook` filtering runs inside `startTransition`.
> 2. **Fiber Interruptibility**: If the user continues typing, Fiber pauses and discards incomplete `activeBook` renders to respond to new keypresses.
> 3. **Non-Blocking Main Thread**: High-frequency updates remain smooth without freezing interactive input fields.
> 4. **Pending State Visuals**: `isPending` provides immediate feedback to users while Fiber processes background work.
> 
---

### Exercise 2: Patient Medical Image Filtering (Healthcare)

**Scenario:** A diagnostic imaging system applies image filters to high-resolution DICOM scans. Use deferred rendering concepts so UI slice controls remain responsive while Fiber renders image adjustments.

**Requirements:**
1. Create a `ScanViewer` component receiving `sliceIndex` and `filterContrast`.
2. Wrap heavy filter computations in Fiber-friendly rendering abstractions.
3. Ensure slider movements respond smoothly while image calculations process.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useDeferredValue } from 'react';
> 
> export function ScanViewer({ rawImageData }) {
>   const [contrast, setContrast] = useState(100);
>   // Defer heavy contrast calculation value
>   const deferredContrast = useDeferredValue(contrast);
> 
>   return (
>     <div className="scan-container">
>       <label>
>         Contrast Adjustment: {contrast}%
>         <input 
>           type="range" 
>           min="50" 
>           max="200" 
>           value={contrast} 
>           onChange={e => setContrast(Number(e.target.value))} 
>         />
>       </label>
>       <div className="viewport">
>         {/* Heavy scan preview renders using deferred contrast */}
>         <RenderProcessedScan data={rawImageData} contrast={deferredContrast} />
>       </div>
>     </div>
>   );
> }
> 
> function RenderProcessedScan({ data, contrast }) {
>   // Simulated heavy image processing work
>   return <div className="dicom-canvas">Rendered Image (Contrast: {contrast}%)</div>;
> }
> ```
>
> #### Technical Explanation
> 1. **Deferred Value Hook**: `useDeferredValue(contrast)` creates a low-priority copy of contrast values for heavy render subtrees.
> 2. **Immediate Range Input Response**: The range slider stays fluid because primary state updates immediately.
> 3. **Fiber Work Scheduling**: Fiber renders `RenderProcessedScan` in the background, interrupting it if the user moves the slider again.
> 4. **Frame Preservation**: Avoids dropped animation frames during rapid diagnostic slider adjustments.
> 
---

### Exercise 3: E-Commerce Product Catalog Filter (E-Commerce)

**Scenario:** An e-commerce product catalog filters 10,000 inventory items based on category selections. Implement Fiber-friendly rendering to preserve smooth scrolling.

**Requirements:**
1. Create `ProductCatalog` accepting an array of 5,000 product objects.
2. Allow filtering by category dropdown.
3. Use `useTransition` so dropdown closing animations are not delayed by catalog updates.
4. Display a subtle status indicator during Fiber deferred rendering.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useTransition } from 'react';
> 
> export function ProductCatalog({ products }) {
>   const [category, setCategory] = useState('All');
>   const [filteredList, setFilteredList] = useState(products);
>   const [isPending, startTransition] = useTransition();
> 
>   const handleCategorySelect = (e) => {
>     const selected = e.target.value;
>     setCategory(selected); // Urgent UI update for dropdown response
> 
>     startTransition(() => {
>       // Low-priority catalog filtering
>       const result = selected === 'All' 
>         ? products 
>         : products.filter(p => p.category === selected);
>       setFilteredList(result);
>     });
>   };
> 
>   return (
>     <div className="catalog-wrapper">
>       <select value={category} onChange={handleCategorySelect}>
>         <option value="All">All Categories</option>
>         <option value="Electronics">Electronics</option>
>         <option value="Apparel">Apparel</option>
>       </select>
> 
>       {isPending && <p className="loading-note">Filtering catalog in background...</p>}
> 
>       <div className="grid">
>         {filteredList.slice(0, 100).map(item => (
>           <div key={item.id} className="card">{item.name} - ${item.price}</div>
>         ))}
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Smooth UI Controls**: Dropdown selection updates instantly without waiting for 5,000 array filters to complete.
> 2. **Interruptible Rendering**: Fiber processes the new catalog list asynchronously, yielding to main-thread input events.
> 3. **Background Reconciliation**: Reconciliation computes diffs in memory without blocking active layout animations.
> 4. **User Feedback Integration**: `isPending` communicates background progress transparently.
> 
---

## 6. Related Terms

- [Reconciliation](reconciliation.md) — The diffing process scheduled and executed by the Fiber engine.
- [Virtual DOM](virtual_dom.md) — The in-memory tree nodes represented by Fiber architecture structures.
- [Concurrent Rendering](../level_08/concurrent_rendering.md) — Advanced feature set built on top of Fiber's interruptible engine.
- [Suspense](../level_08/suspense.md) — Async rendering feature that pauses component subtrees until data dependencies resolve.

---

## 7. Key Takeaways

- **Fiber** is the core rendering engine introduced in React 16 to enable interruptible rendering.
- It maps component trees to a virtual linked-list structure composed of individual Fiber nodes.
- Fiber splits rendering into an **asynchronous Render Phase** and a **synchronous Commit Phase**.
- The Render phase can be paused, restarted, or aborted to keep the browser main thread responsive.
- Render functions MUST remain pure because Fiber may execute them multiple times before committing.
