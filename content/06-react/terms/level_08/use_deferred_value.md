# `useDeferredValue` Hook

> **Level 8 — Performance Optimization**
> Built-in React Hook for deferring non-critical value updates to keep input fields and high-priority UI responsive.

---

## 1. Prerequisites

- [Concurrent Rendering](concurrent_rendering.md) — The underlying engine scheduling deferred value updates.
- [Re-rendering](../level_02/re_rendering.md) — The render execution loop optimized by delaying value propagation.

---

## 2. Term Category

**Core Hook (state deferral)**: Built-in React Hook (`const deferredValue = useDeferredValue(value)`) that returns a deferred version of a value that "lags behind" the primary urgent state value. When a fast-changing state (like typing in an input field) updates, `useDeferredValue` allows React to render the urgent state immediately with the old deferred value, and then execute a low-priority background render with the updated deferred value, unlike synchronous state derivations.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When users type into a search input or drag a slider, the input state updates on every keypress. If that input value is immediately passed down to render a complex component tree (e.g., filtering 2,000 items), the main thread freezes while computing the heavy child tree. This causes keypress lag and stuttering typing performance.

Historically, developers used **Debouncing** (`setTimeout` delays) or **Throttling**. However, debouncing introduces artificial fixed delays (e.g., waiting 300ms after typing stops), making the UI feel sluggish even on powerful devices.

React 18 introduced **`useDeferredValue`**:
1. **Adaptive Lag**: `useDeferredValue` does not use fixed timers. On fast devices, the deferred render completes almost instantly. On slow devices, React defers rendering the child tree until the user finishes typing.
2. **Interruptible Re-renders**: If the user types another character while React is mid-way through calculating the deferred render, React cancels the stale deferred render and starts a new deferred render with the latest value.
3. **Use Case Difference from `useTransition`**: Use `useTransition` when you control the state setter (`startTransition(() => setValue(...))`). Use `useDeferredValue` when you receive a value as a prop or hook parameter and do not own the state setter function.

---

### (2) Reality Metaphor
Imagine an executive assistant taking urgent phone calls.
- **Synchronous Rendering (Blocking Assistant)**: Every time a caller speaks a sentence (**input value**), the assistant immediately leaves their desk, walks to the filing room, archives the sentence in a heavy binder (**heavy render**), and returns to the desk before allowing the caller to speak the next word.
- **`useDeferredValue` (Agile Assistant)**: The assistant jot down the caller's words instantly on a notepad (**urgent input value**). While the caller speaks, the assistant stays on the phone. During natural pauses between sentences (**idle main thread**), the assistant files the notes in the archive binder (**deferred render**).

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React, { useState, useDeferredValue } from 'react';

export function SimpleDeferredInput() {
  const [query, setQuery] = useState('');
  // deferredQuery lags behind query during rapid typing
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {/* Heavy component receives deferred value */}
      <HeavyList query={deferredQuery} />
    </div>
  );
}
```

#### Fuller Example
```jsx
import React, { useState, useDeferredValue, useMemo, memo } from 'react';

// Memoized child list component
const FilteredList = memo(function FilteredList({ text }) {
  // Heavy computation simulated
  const items = useMemo(() => {
    if (!text) return [];
    return Array.from({ length: 2000 }, (_, idx) => ({
      id: idx,
      label: `Result for '${text}' item #${idx + 1}`
    }));
  }, [text]);

  return (
    <ul className="results-list">
      {items.map((item) => (
        <li key={item.id}>{item.label}</li>
      ))}
    </ul>
  );
});

export function DeferredSearchContainer() {
  const [text, setText] = useState('');
  // Defer heavy list recalculation
  const deferredText = useDeferredValue(text);

  // Detect when deferred value is lagging behind urgent state
  const isStale = text !== deferredText;

  return (
    <div className="search-container">
      <h2>Deferred Search Dashboard</h2>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type quickly to test deferral..."
      />

      <div style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        {isStale && <p className="stale-indicator">Updating list in background...</p>}
        <FilteredList text={deferredText} />
      </div>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Memoize Child Components Consuming Deferred Values

**The mistake:** Passing a `useDeferredValue` result into a child component that is NOT wrapped in `React.memo` or `useMemo`.

**Why it's wrong:** If the parent component re-renders when the urgent state changes, un-memoized child components will re-render immediately anyway, defeating the purpose of deferring the value.

*Incorrect:*
```jsx
function Parent() {
  const [val, setVal] = useState('');
  const deferred = useDeferredValue(val);
  // BAD: Un-memoized Child re-renders on EVERY parent state change!
  return <UnmemoizedChild value={deferred} />;
}
```

*Fix:*
```jsx
const MemoizedChild = memo(UnmemoizedChild);

function Parent() {
  const [val, setVal] = useState('');
  const deferred = useDeferredValue(val);
  // GOOD: Memoized child skips render until deferred value actually updates
  return <MemoizedChild value={deferred} />;
}
```

---

### Mistake 2: Confusing `useDeferredValue` with Lodash Debounce / Throttle

**The mistake:** Expecting `useDeferredValue` to delay network API requests like `debounce()`.

**Why it's wrong:** `useDeferredValue` defers *React UI rendering*, not asynchronous side effects. To debounce network requests, use standard debounce functions or custom timing hooks.

*Incorrect:*
```jsx
useEffect(() => {
  // BAD: Triggers network requests on every deferred change anyway!
  fetchData(deferredQuery);
}, [deferredQuery]);
```

*Fix:*
```jsx
// Use lodash.debounce for network API requests; use useDeferredValue for UI rendering
```

---

### Mistake 3: Passing Inline Objects or New Arrays Directly into `useDeferredValue`

**The mistake:** Writing `const deferredObj = useDeferredValue({ query })` with an inline object literal.

**Why it's wrong:** On every render, `{ query }` creates a new object reference. `useDeferredValue` sees a brand-new value reference every single frame and cannot determine that the contents are unchanged.

*Incorrect:*
```jsx
// BAD: Inline object literal creates new reference on every render
const deferred = useDeferredValue({ search: query });
```

*Fix:*
```jsx
// GOOD: Pass primitive values or memoized object references
const deferredSearch = useDeferredValue(query);
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Search Filter

**Scenario:** An industrial IoT console receives high-speed user input filtering 3,000 sensor logs. You need to defer the log filter value using `useDeferredValue` while keeping the text field responsive.

**Requirements:**
1. Maintain urgent search input state.
2. Defer search string using `useDeferredValue`.
3. Wrap log table component in `React.memo`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useDeferredValue, memo } from 'react';
> 
> const LogTable = memo(function LogTable({ query }) {
>   const logs = Array.from({ length: 1500 }, (_, i) => ({
>     id: i,
>     msg: `Sensor Log #${i + 1} - Status: ${query || 'NOMINAL'}`
>   }));
> 
>   return (
>     <ul className="log-list">
>       {logs.map((log) => (
>         <li key={log.id}>{log.msg}</li>
>       ))}
>     </ul>
>   );
> });
> 
> export function IoTLiveConsole() {
>   const [input, setInput] = useState('');
>   const deferredInput = useDeferredValue(input);
> 
>   return (
>     <div className="console-panel">
>       <h3>IoT Telemetry Console</h3>
>       <input
>         type="text"
>         value={input}
>         onChange={(e) => setInput(e.target.value)}
>         placeholder="Filter sensor logs..."
>       />
>       <LogTable query={deferredInput} />
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof IoTLiveConsole === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Immediate Input Paint**: `setInput` updates `input` state synchronously, keeping text input typing lag-free.
> 2. **Deferred Lag**: `useDeferredValue` returns previous query string during keypresses, scheduling background update.
> 3. **Memoized Child Boundary**: `LogTable` skips rendering until `deferredInput` resolves to a new value.
> 4. **Adaptive Scheduling**: React adjusts background render timing dynamically based on device CPU capabilities.
> 
---

### Exercise 2: Financial Order Depth Visualizer

**Scenario:** A crypto trading workspace receives live price threshold props from a parent component. You must defer the price threshold value to prevent heavy canvas chart recalculations during rapid slider adjustments.

**Requirements:**
1. Accept price threshold prop.
2. Defer threshold value using `useDeferredValue`.
3. Display visual opacity dimming when value is stale.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useDeferredValue, memo } from 'react';
> 
> const OrderCanvas = memo(function OrderCanvas({ price }) {
>   return (
>     <div className="canvas-placeholder">
>       <p>Rendering Order Depth Threshold: ${price}</p>
>     </div>
>   );
> });
> 
> export function OrderDepthController() {
>   const [price, setPrice] = useState(64000);
>   const deferredPrice = useDeferredValue(price);
>   const isStale = price !== deferredPrice;
> 
>   return (
>     <div className="depth-controller">
>       <h3>Order Depth Slider</h3>
>       <input
>         type="range"
>         min="50000"
>         max="80000"
>         value={price}
>         onChange={(e) => setPrice(Number(e.target.value))}
>       />
>       <span>Current: ${price}</span>
> 
>       <div style={{ opacity: isStale ? 0.5 : 1 }}>
>         <OrderCanvas price={deferredPrice} />
>       </div>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof OrderDepthController === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Slider Responsiveness**: Sliding the input updates `price` state immediately without frame stuttering.
> 2. **Visual Stale Feedback**: `isStale` compares `price !== deferredPrice`, dimming canvas opacity during background render.
> 3. **Priority Yielding**: If user drags slider continuously, intermediate canvas renders are safely discarded.
> 4. **Component Isolation**: `OrderCanvas` renders only when `deferredPrice` catches up.
> 
---

### Exercise 3: E-Commerce Storefront Filter

**Scenario:** An online store catalog receives category filter inputs. You must defer the filter string so product grid rendering yields to fast click selections.

**Requirements:**
1. Manage filter state in input field.
2. Defer filter value using `useDeferredValue`.
3. Wrap product list in `React.memo`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useDeferredValue, memo } from 'react';
> 
> const ProductGrid = memo(function ProductGrid({ filterText }) {
>   return (
>     <div className="grid">
>       <p>Displaying products matching: "{filterText}"</p>
>     </div>
>   );
> });
> 
> export function CatalogFilterView() {
>   const [filter, setFilter] = useState('');
>   const deferredFilter = useDeferredValue(filter);
> 
>   return (
>     <div className="catalog-filter">
>       <input
>         type="text"
>         value={filter}
>         onChange={(e) => setFilter(e.target.value)}
>         placeholder="Filter products..."
>       />
>       <ProductGrid filterText={deferredFilter} />
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof CatalogFilterView === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Non-Blocking Filtering**: Input field repaints synchronously while product grid re-renders in low-priority background phase.
> 2. **`React.memo` Requirement**: Ensures child component ignores parent re-renders until `deferredFilter` changes.
> 3. **Smooth UX**: Eliminates artificial debouncing delays while keeping interface smooth.
> 4. **Declarative Hook**: Replaces manual `setTimeout` management with native React concurrent scheduling.
> 
---

## 6. Related Terms

- [`useTransition` Hook](use_transition.md) — Companion hook used when you control the state setter callback directly.
- [Concurrent Rendering](concurrent_rendering.md) — Concurrent scheduling engine enabling deferred renders.
- [React.memo](react_memo.md) — Memoization HOC used to optimize child re-renders with deferred values.

---

## 7. Key Takeaways

- `useDeferredValue` returns a deferred version of a value that lags behind urgent state updates during heavy renders.
- Use `useDeferredValue` when receiving values as props or parameters when you do not own the state setter function.
- Always pair `useDeferredValue` with `React.memo` or `useMemo` on child components to block premature child re-renders.
- Unlike fixed debouncing timers (`setTimeout`), `useDeferredValue` adapts dynamically to device CPU performance.
- `useDeferredValue` optimizes React UI component rendering; it does not replace debouncing for network API calls.
