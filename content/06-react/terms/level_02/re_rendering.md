# Re-rendering

> **Level 2 — State & Reactivity**
> The execution lifecycle phase where React calls a component's function again to generate a new Virtual DOM snapshot when underlying data changes.

---

## 1. Prerequisites

- [Virtual DOM](../level_01/virtual_dom.md) — Re-rendering is the process of building new Virtual DOM trees in RAM.
- [State](state.md) — State mutations serve as the primary trigger for component re-renders.

---

## 2. Term Category

**Rendering Mechanic (execution lifecycle)**: Re-rendering is a core execution mechanic in React's component lifecycle. In React, user interfaces are expressed as a pure mathematical projection of data: $UI = f(State, Props)$.

When a component's internal state changes or its parent component updates, React calls the component's JavaScript function again. The function executes from top to bottom, evaluating local variables and returning a new Virtual DOM tree. React then compares this new tree against the previous Virtual DOM tree via Reconciliation and commits any calculated differences to the browser screen.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional web development, when data changed (such as receiving a new message count), developers wrote manual imperative commands to select and update specific HTML elements: `document.getElementById('badge').innerText = newCount`. As applications grew complex with thousands of dynamic elements, keeping track of manual DOM update triggers became impossible, leading to missing updates and out-of-sync visual bugs.

React eliminated manual DOM tracking by introducing **Automated Re-rendering**:
- Whenever data changes, React re-executes the component function automatically.
- Developers write code assuming the component renders fresh from scratch for every state snapshot.
- React handles the underlying Virtual DOM diffing and updates the screen efficiently.

#### The Three Re-render Triggers
A component will re-render ONLY when one of three events occurs:
1. **Internal State Changes:** The component calls a `useState` or `useReducer` setter function.
2. **Parent Component Re-renders:** When a parent component re-renders, React by default re-renders ALL of its child components recursively down the tree (the "re-render waterfall").
3. **Custom Hook State Changes:** A custom hook consumed by the component updates internal state.

*(Note: Changing a component's `props` causes a re-render precisely because the parent component re-rendered to pass those new props!)*

### (2) Reality Metaphor
Imagine a digital photo frame displaying a clock.

- **Manual DOM Updates (Painting a Picture Frame):** To update the time from 10:00 to 10:01, you pick up a paint brush, scrape off the "0" digit paint on the glass, repaint a "1" digit, and wait for it to dry. Doing this manually every minute is tedious and error-prone.
- **React Re-rendering (Digital Screen Refresh):** The photo frame is an electronic LED display screen. Every minute, the display controller receives a new time signal (**state update**), clears the pixel array, and renders a complete new digital image frame in 0.001 seconds (**re-render**). You simply provide the current time data, and the display handles rendering the fresh image frame automatically.

### (3) React Code Examples

#### Short Snippet
```jsx
// Calling setCount triggers a component re-render: React calls Counter() again
function Counter() {
  const [count, setCount] = useState(0);
  console.log("Component re-rendered! Count is:", count);

  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
```

#### Fuller Example
```jsx
import React, { useState } from 'react';

// Child component: re-renders whenever Parent re-renders by default!
function ChildBadge({ label }) {
  console.log(`[Re-render] ChildBadge (${label}) executed`);
  return <span className="badge">{label}</span>;
}

export default function RenderWaterfallDemo() {
  const [parentCount, setParentCount] = useState(0);
  const [text, setText] = useState('');

  console.log("[Re-render] Parent Component executed");

  return (
    <div className="demo-box">
      <h3>Re-render Waterfall Demo</h3>
      <p>Parent State Count: {parentCount}</p>

      <button onClick={() => setParentCount(c => c + 1)}>
        Update Parent State
      </button>

      <input 
        value={text} 
        onChange={e => setText(e.target.value)} 
        placeholder="Type text..." 
      />

      {/* 
        Updating parentCount or text causes Parent to re-render, 
        which automatically forces ChildBadge to re-render too!
      */}
      <ChildBadge label="Static Badge Text" />
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The Infinite Re-render Loop (Calling State Setters in Render Bodies)

**The mistake:** Calling a `useState` setter function directly inside the main body of a component function.

**Why it's wrong:**
1. Component function runs.
2. It executes `setCount(1)` in the render body.
3. `setCount(1)` queues a **Re-render**.
4. Component function runs again, executing `setCount(1)` again.
5. This creates an infinite loop that crashes the browser in seconds (`Too many re-renders. React limits the number of renders to prevent an infinite loop`).

*Incorrect:*
```jsx
function BadComponent() {
  const [data, setData] = useState('initial');
  // ❌ Setter called directly in render body causes infinite re-render loop!
  setData('updated'); 
  return <div>{data}</div>;
}
```

*Fix:*
```jsx
function GoodComponent() {
  const [data, setData] = useState('initial');
  // ✅ Call setters inside event handlers or useEffect
  const handleUpdate = () => setData('updated');
  return <button onClick={handleUpdate}>{data}</button>;
}
```

### Mistake 2: Assuming Child Components Only Re-render When Their Props Change

**The mistake:** Expecting `<Child />` to skip re-rendering when `<Parent />` updates its own internal state because `<Child />` received no new props.

**Why it's wrong:** By default in React, when a parent component re-renders, ALL of its child components re-render recursively down the subtree, regardless of whether their props changed. To skip unnecessary child re-renders when props are unchanged, wrap the child in `React.memo()`.

*Incorrect:*
```jsx
// Expecting Child to skip re-render when Parent state updates
function Parent() {
  const [count, setCount] = useState(0);
  return <div><button onClick={() => setCount(c+1)}>Inc</button><Child /></div>;
}
```

*Fix:*
```jsx
// ✅ React.memo skips child re-renders if props have not changed referentially
const Child = React.memo(function Child() {
  return <div>Child Content</div>;
});
```

### Mistake 3: Passing Inline Object Literals or Arrow Functions to Memoized Children

**The mistake:** Passing `<MemoChild style={{ color: 'red' }} onClick={() => doSomething()} />`.

**Why it's wrong:** Inline object literals `{}` and arrow functions `() => {}` create BRAND NEW memory references on every parent render cycle. `React.memo` checks props via shallow referential equality (`Object.is`). Because the prop references are new every time, `React.memo` assumes props changed and re-renders the child anyway.

*Incorrect:*
```jsx
// ❌ Inline object creates a new memory reference every render, bypassing React.memo!
<MemoChild options={{ theme: 'dark' }} />
```

*Fix:*
```jsx
// ✅ Preserve referential equality across renders using useMemo / useCallback
const options = useMemo(() => ({ theme: 'dark' }), []);
<MemoChild options={options} />
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Dashboard Render Counter (IoT Telemetry)

**Scenario:** An industrial IoT dashboard displays telemetry readings. Create a render counter diagnostic overlay that tracks how many times component re-renders execute when updating sensor states.

**Requirements:**
1. Create `TelemetryDashboard` managing `sensorVal` state.
2. Use `useRef` to count and display total component re-renders.
3. Add a button updating `sensorVal` to trigger re-renders.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useRef } from 'react';
> 
> export function TelemetryDashboard() {
>   const [sensorVal, setSensorVal] = useState(100);
>   const renderCount = useRef(0);
> 
>   // Ref current increments on every render pass without triggering new renders
>   renderCount.current += 1;
> 
>   return (
>     <div className="dashboard-card">
>       <h4>IoT Sensor Telemetry</h4>
>       <p>Current Reading: {sensorVal} PSI</p>
>       <p className="debug">Total Component Renders: {renderCount.current}</p>
>       <button onClick={() => setSensorVal(prev => prev + 5)}>
>         Increment Sensor Reading
>       </button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Render Trigger**: Calling `setSensorVal` alters state, triggering React to re-evaluate `TelemetryDashboard()`.
> 2. **Ref Count Tracking**: `useRef` stores mutable values across renders without triggering additional re-renders when mutated.
> 3. **Top-to-Bottom Execution**: The function executes from line 1 down to the return JSX on every state update.
> 4. **State Snapshot**: `sensorVal` holds updated numbers on each subsequent render pass.
> 
---

### Exercise 2: Financial Trading Order Book Re-render Isolation (Financial Trading)

**Scenario:** A high-frequency trading ticket re-renders rapidly due to live market ticks. Isolate re-renders so static header UI subtrees do not re-render unnecessarily using `React.memo`.

**Requirements:**
1. Create a `StaticHeader` component wrapped in `React.memo`.
2. Create `OrderTicker` parent managing rapidly updating `price` state.
3. Verify via `console.log` that `StaticHeader` skips re-rendering when price updates.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> // Memoized child component: skips re-renders if props are referentially identical
> const StaticHeader = React.memo(function StaticHeader() {
>   console.log("[Render Skip] StaticHeader rendered");
>   return <header><h3>High-Frequency Order Book</h3></header>;
> });
> 
> export function OrderTicker() {
>   const [price, setPrice] = useState(150.00);
> 
>   const handleTick = () => {
>     setPrice(prev => Number((prev + 0.05).toFixed(2)));
>   };
> 
>   return (
>     <div className="ticker-card">
>       <StaticHeader />
>       <p>Active Price: ${price.toFixed(2)}</p>
>       <button onClick={handleTick}>Simulate Price Tick</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Default Waterfall Prevention**: `React.memo` intercepts the default parent-to-child re-render waterfall.
> 2. **Shallow Prop Check**: `StaticHeader` receives zero props; `React.memo` detects identical prop snapshots and skips evaluation.
> 3. **Main-Thread Savings**: Prevents expensive child subtree evaluation during high-frequency parent state changes.
> 4. **Render Boundary**: Isolates state re-renders strictly to components that depend on `price`.
> 
---

### Exercise 3: E-Commerce Search Input & List Re-render Optimization (E-Commerce)

**Scenario:** An e-commerce product page re-renders on every search input keystroke. Optimize child product list re-renders using `useMemo` and component composition.

**Requirements:**
1. Create `SearchableCatalog` parent managing `query` state.
2. Filter heavy product lists inside `useMemo`.
3. Demonstrate maintaining responsive typing input during catalog re-renders.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useMemo } from 'react';
> 
> function ProductList({ products }) {
>   console.log("[Render] ProductList rendered");
>   return (
>     <ul>
>       {products.map(p => <li key={p.id}>{p.name} - ${p.price}</li>)}
>     </ul>
>   );
> }
> 
> export function SearchableCatalog({ allProducts = [] }) {
>   const [query, setQuery] = useState('');
> 
>   // Recalculate filtered array only when query or allProducts change
>   const filteredProducts = useMemo(() => {
>     return allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
>   }, [query, allProducts]);
> 
>   return (
>     <div className="catalog-panel">
>       <input 
>         value={query} 
>         onChange={e => setQuery(e.target.value)} 
>         placeholder="Filter products..." 
>       />
>       <ProductList products={filteredProducts} />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **State Trigger**: Keystrokes call `setQuery`, queueing a re-render of `SearchableCatalog`.
> 2. **Memoized Derivation**: `useMemo` re-calculates filtered items efficiently during render.
> 3. **Prop Reference Alignment**: `filteredProducts` passes calculated arrays down to child lists.
> 4. **Fluid Input Response**: Input typing remains responsive while React updates Virtual DOM snapshots.
> 
---

## 6. Related Terms

- [Virtual DOM](../level_01/virtual_dom.md) — What React constructs during a component re-render pass.
- [State](state.md) — Changing state is the primary trigger for a re-render.
- [Automatic Batching](automatic_batching.md) — Performance mechanic grouping state setters into a single re-render pass.
- [React.memo](../level_08/react_memo.md) — Wrapper used to skip unnecessary child re-renders.

---

## 7. Key Takeaways

- **Re-rendering** is React calling a component function again to generate a new Virtual DOM tree.
- A component re-renders when: 1) Its state updates, 2) Its parent re-renders, or 3) A consumed custom hook updates.
- By default, when a parent component re-renders, ALL child components re-render recursively (waterfall effect).
- Calling state setters directly in component render bodies causes infinite re-render loops.
- Use `React.memo` to skip child re-renders when incoming props remain referentially identical.
