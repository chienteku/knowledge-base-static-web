# Reconciliation

> **Level 1 — Core Concepts**
> React's heuristic $O(N)$ tree-diffing algorithm that compares old vs new Virtual DOM trees to compute the minimal set of real DOM mutations.

---

## 1. Prerequisites

- [Virtual DOM](virtual_dom.md) — The in-memory tree structures compared by the reconciliation algorithm.

---

## 2. Term Category

**Rendering Mechanic (tree diffing engine)**: Reconciliation is React's engine-level algorithm for diffing two Virtual DOM trees. In computer science, finding the minimum number of modifications to transform one arbitrary tree into another has a time complexity of $O(N^3)$. For a tree with 1,000 DOM elements, an $O(N^3)$ algorithm would execute 1,000,000,000 comparison operations per update, completely freezing browser frames.

React solves this by implementing a heuristic $O(N)$ linear-time reconciliation algorithm based on two practical assumptions:
1. Two elements of different component types will produce completely different trees.
2. The developer can hint which child elements are stable across renders using a unique `key` prop.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When state changes in a React application, React renders a new Virtual DOM tree representing what the UI should look like now. To update the browser screen efficiently, React must compare this new Virtual DOM tree with the previous Virtual DOM tree and determine the exact minimum set of DOM mutations needed.

Instead of performing expensive full-tree structural analysis, React's **Reconciliation** algorithm applies two fast heuristic rules:

#### Rule 1: Element Type Matching
- **Same Type Elements:** If two elements have the same tag type (e.g. `<div className="old">` vs `<div className="new">`), React keeps the existing DOM node, updates only the modified attributes (e.g. updating `className`), and recursively diffs the children.
- **Different Type Elements:** If element tag types differ (e.g. replacing a `<div>` with a `<section>`, or a `<Header>` with a `<Footer>`), React completely unmounts the old element subtree, destroying its associated DOM nodes and internal component state, and mounts the new subtree from scratch.

#### Rule 2: List Key Matching
When rendering arrays of child elements, React matches old children with new children using the `key` prop. If keys match across renders, React re-orders, moves, or updates existing DOM nodes instead of destroying and recreating them.

### (2) Reality Metaphor
Imagine a home renovation architect comparing architectural floor plans.

- **$O(N^3)$ Comparison (Brick-by-Brick Inspection):** The architect inspects every single brick, electrical wire, and pipe in the entire house from scratch to verify if a kitchen cabinet changed color. It takes months to evaluate a simple paint change.
- **Reconciliation Heuristics (Spotting the Difference):** The architect overlays the new blueprint over the old one. If a room is labeled "Kitchen" on both plans (**same element type**), the architect only repaints the cabinet doors. If a room label changes from "Bedroom" to "Bathroom" (**different element type**), the architect tears down the bedroom walls completely and constructs a bathroom from scratch.

### (3) React Code Examples

#### Short Snippet
```jsx
// Changing keys forces React reconciliation to discard the old component
// instance and remount a fresh component with reset state.
function UserProfileWrapper({ userId }) {
  return <UserProfile key={userId} userId={userId} />;
}
```

#### Fuller Example
```jsx
import React, { useState } from 'react';

// When element type changes from <div> to <section>, Reconciliation destroys Child state!
function CounterChild() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}

export default function TypeDiffingDemo() {
  const [useSection, setUseSection] = useState(false);

  return (
    <div className="demo-box">
      <button onClick={() => setUseSection(prev => !prev)}>
        Toggle Wrapper Element Tag Type
      </button>

      {/* 
        Toggling tag type between <div> and <section> forces Reconciliation 
        to unmount CounterChild completely, resetting count state back to 0!
      */}
      {useSection ? (
        <section className="wrapper">
          <CounterChild />
        </section>
      ) : (
        <div className="wrapper">
          <CounterChild />
        </div>
      )}
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Array Index as List Keys on Reorderable Lists

**The mistake:** Writing `items.map((item, index) => <TodoItem key={index} text={item.text} />)`.

**Why it's wrong:** Array indices are NOT stable identifiers. If items are inserted, deleted, or reordered, array indices shift position. React matches keys to previous render positions, causing inputs, focus states, and component state snapshots to remain attached to the WRONG DOM elements.

*Incorrect:*
```jsx
// ❌ Index keys break state alignment on reorder or deletion!
{todos.map((todo, index) => (
  <TodoItem key={index} todo={todo} />
))}
```

*Fix:*
```jsx
// ✅ Stable unique ID preserves component state alignment during list edits
{todos.map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}
```

### Mistake 2: Changing Component Element Types at the Same Tree Depth

**The mistake:** Swapping root container tags from `<div>` to `<main>` based on state conditions when child components maintain active state.

**Why it's wrong:** Changing container element types triggers Rule 1 of Reconciliation: React unmounts the entire element subtree, destroying all child component states, DOM focus, and un-committed form data. Keep wrapper element types consistent across renders.

*Incorrect:*
```jsx
// ❌ Unmounts <Form> and loses user input when isFullWidth toggles!
return isFullWidth ? (
  <main className="container"><Form /></main>
) : (
  <div className="container"><Form /></div>
);
```

*Fix:*
```jsx
// ✅ Same <div> type retains <Form> state while updating CSS classes
return (
  <div className={isFullWidth ? 'container-full' : 'container-boxed'}>
    <Form />
  </div>
);
```

### Mistake 3: Generating Random Key Values During Render (`key={Math.random()}`)

**The mistake:** Writing `<Item key={Math.random()} />` inside map iterations.

**Why it's wrong:** Generating random keys on every render guarantees that keys NEVER match across renders. React is forced to unmount and remount every single list item DOM node on every state update, destroying performance and scroll position.

*Incorrect:*
```jsx
// ❌ Forces total unmount/remount on EVERY render!
{items.map(item => (
  <ListItem key={Math.random()} data={item} />
))}
```

*Fix:*
```jsx
// ✅ Persistent database primary key
{items.map(item => (
  <ListItem key={item.id} data={item} />
))}
```

---

## 5. Practice Exercises

### Exercise 1: Telemetry Sensor List Re-ordering (IoT Telemetry)

**Scenario:** An industrial IoT dashboard re-orders sensor rows dynamically by highest temperature. Fix state corruption bugs caused by index keys during re-ordering.

**Requirements:**
1. Create `SensorRow` component maintaining local toggle state (`expanded`).
2. Map over `sensors` array re-ordered by temperature.
3. Assign stable `sensor.id` keys so expanded row states remain tied to the correct physical sensor when list positions change.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function SensorRow({ sensor }) {
>   const [expanded, setExpanded] = useState(false);
> 
>   return (
>     <div className="sensor-row">
>       <span>{sensor.name}: {sensor.temp}°C</span>
>       <button onClick={() => setExpanded(prev => !prev)}>
>         {expanded ? 'Hide Details' : 'Show Details'}
>       </button>
>       {expanded && <div className="details">Voltage: {sensor.voltage}V</div>}
>     </div>
>   );
> }
> 
> export function SortedTelemetryList({ initialSensors }) {
>   const [sensors, setSensors] = useState(initialSensors);
> 
>   const sortByTemp = () => {
>     const sorted = [...sensors].sort((a, b) => b.temp - a.temp);
>     setSensors(sorted);
>   };
> 
>   return (
>     <div>
>       <button onClick={sortByTemp}>Sort by Highest Temp</button>
>       {sensors.map(sensor => (
>         // Stable sensor.id key ensures expanded state stays with correct sensor
>         <SensorRow key={sensor.id} sensor={sensor} />
>       ))}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Stable Key Matching**: Using `key={sensor.id}` allows Reconciliation to pair existing `SensorRow` Fiber nodes with their new array position.
> 2. **State Preservation**: Component local state (`expanded`) remains bound to the physical sensor data rather than the array index position.
> 3. **Minimal DOM Moves**: React re-orders existing DOM nodes in place without unmounting or re-creating element trees.
> 4. **Pure Sorting**: Spreading `[...sensors]` before sorting ensures array immutability during render operations.
> 
---

### Exercise 2: Order Book Form Reset via Key Change (Financial Trading)

**Scenario:** A trading ticket component allows switching active stocks (`ticker`). Ensure switching tickers resets all dirty form inputs completely using Reconciliation key behavior.

**Requirements:**
1. Create `OrderTicketForm` maintaining local state (`quantity`, `price`).
2. Render parent component passing `key={selectedTicker}` to `<OrderTicketForm />`.
3. Verify that changing `selectedTicker` forces Reconciliation to unmount the old ticket and mount a clean form.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function OrderTicketForm({ ticker }) {
>   const [quantity, setQuantity] = useState(100);
>   const [limitPrice, setLimitPrice] = useState(150.00);
> 
>   return (
>     <div className="ticket-form">
>       <h4>Order Ticket for {ticker}</h4>
>       <label>Quantity: 
>         <input 
>           type="number" 
>           value={quantity} 
>           onChange={e => setQuantity(Number(e.target.value))} 
>         />
>       </label>
>       <label>Limit Price: 
>         <input 
>           type="number" 
>           value={limitPrice} 
>           onChange={e => setLimitPrice(Number(e.target.value))} 
>         />
>       </label>
>     </div>
>   );
> }
> 
> export function TradingDesk() {
>   const [activeTicker, setActiveTicker] = useState('AAPL');
> 
>   return (
>     <div>
>       <select value={activeTicker} onChange={e => setActiveTicker(e.target.value)}>
>         <option value="AAPL">Apple (AAPL)</option>
>         <option value="TSLA">Tesla (TSLA)</option>
>         <option value="NVDA">NVIDIA (NVDA)</option>
>       </select>
> 
>       {/* Changing key forces Reconciliation to unmount old instance and mount fresh state */}
>       <OrderTicketForm key={activeTicker} ticker={activeTicker} />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Key-Driven Reset**: Changing the `key` prop on `<OrderTicketForm key={activeTicker}>` tells Reconciliation the element identity has changed.
> 2. **Subtree Unmounting**: React tears down the old component Fiber node, discarding dirty local input states.
> 3. **Fresh Mounting**: React mounts a fresh component instance with clean initial state values.
> 4. **Declarative State Cleanup**: Eliminates manual `useEffect` reset handlers when switching active data contexts.
> 
---

### Exercise 3: E-Commerce Product View Layout Swap (E-Commerce)

**Scenario:** An e-commerce catalog toggles between Grid View (`<div>`) and List View (`<div>`) without losing active item selections. Keep wrapper element types consistent so Reconciliation preserves subtree state.

**Requirements:**
1. Create `ProductCatalog` toggling between grid and list layouts.
2. Keep root wrapper element tag types identical (`<div>`) across both views.
3. Update layout styling using dynamic CSS class names (`layout-grid` vs `layout-list`).
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function ProductCard({ product }) {
>   const [selected, setSelected] = useState(false);
>   return (
>     <div className={`card ${selected ? 'selected' : ''}`} onClick={() => setSelected(!selected)}>
>       <h5>{product.name}</h5>
>       <p>${product.price}</p>
>     </div>
>   );
> }
> 
> export function ProductView({ products }) {
>   const [isGrid, setIsGrid] = useState(true);
> 
>   return (
>     <div>
>       <button onClick={() => setIsGrid(prev => !prev)}>
>         Switch to {isGrid ? 'List' : 'Grid'} View
>       </button>
> 
>       {/* Root element type <div> is preserved; Reconciliation updates class name only */}
>       <div className={isGrid ? 'layout-grid' : 'layout-list'}>
>         {products.map(p => (
>           <ProductCard key={p.id} product={p} />
>         ))}
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Same-Type Diffing**: Maintaining `<div>` as the container tag across both views allows Reconciliation to update attributes without unmounting children.
> 2. **State Preservation**: Selection states (`selected`) inside `<ProductCard>` remain active when toggling layout views.
> 3. **Surgical DOM Updates**: React updates container `className` properties while leaving child DOM nodes intact.
> 4. **Performance Efficiency**: Avoids total DOM element recreation during layout presentation swaps.
> 
---

## 6. Related Terms

- [Virtual DOM](virtual_dom.md) — The in-memory tree snapshots compared during reconciliation.
- [The Fiber Architecture](fiber_architecture.md) — The engine executing the reconciliation queue.
- [Re-rendering](../level_02/re_rendering.md) — The process that evaluates components to generate new Virtual DOM trees.
- [Lists & Keys](../level_05/lists_and_keys.md) — Developer rules for providing stable keys to list reconciliation.

---

## 7. Key Takeaways

- **Reconciliation** is React's heuristic $O(N)$ tree-diffing algorithm.
- Elements of different types cause React to unmount the entire subtree and rebuild it from scratch.
- Same-type DOM elements keep existing nodes and update only modified attributes.
- Use stable, unique keys (like database IDs) for mapped array lists; NEVER use array indices for reorderable lists.
- Pass a new `key` prop to a component to force React to unmount it and reset its state completely.
