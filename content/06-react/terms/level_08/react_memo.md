# React.memo

> **Level 8 — Performance Optimization**
> Higher-order component for memoizing functional components to prevent unnecessary re-renders when props remain unchanged.

---

## 1. Prerequisites

- [Re-rendering](../level_02/re_rendering.md) — The default top-down re-rendering behavior that `React.memo` skips.
- [`useMemo` Hook](../level_04/use_memo.md) — Hook used by parent components to stabilize object/array prop references passed to `memo` children.

---

## 2. Term Category

**Component Pattern (hoc abstraction)**: Higher-Order Component wrapper that memoizes component render outputs. `React.memo` performs a shallow equality comparison on incoming props between renders. If props have not changed, React skips re-rendering the wrapped component and reuses the previous rendered Virtual DOM result, preventing expensive cascading renders down child component subtrees.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
By default in React, when a parent component re-renders, **all of its child components re-render automatically**, regardless of whether their props changed. In deep or wide component trees (such as tables with 500 rows), a single state update at the parent level triggers re-render calculations for 500 children, causing frame drops and input lag.

`React.memo` solves this by introducing memoization at the component boundary:
1. **Shallow Prop Comparison**: Before rendering a wrapped component, React compares previous props with new props using `Object.is()` shallow equality for every prop key.
2. **Render Bypassing**: If all prop values are referentially identical, React skips executing the component function entirely and reuses the previously rendered DOM output.
3. **Custom Comparators**: Developers can pass a second argument `arePropsEqual(prevProps, nextProps)` to customize comparison logic for complex data structures.

---

### (2) Reality Metaphor
Imagine an international airport border checkpoint.
- **Default Rendering (Full Inspection Every Pass)**: Every time the airport PA system makes an announcement (**parent re-render**), border guards force every passenger in the terminal (**child components**) to re-verify their passports, luggage, and visas from scratch, even if their flight information hasn't changed.
- **`React.memo` (Express Transit Pass)**: Passengers carrying an verified express pass (**`React.memo` wrapper**) present their pass to the guard. The guard compares the photo on the pass to the passenger's face (**shallow prop check**). If identical, the guard waves them through instantly without opening their luggage.

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React, { memo } from 'react';

// Component wrapped in React.memo
export const ExpensiveChild = memo(function ExpensiveChild({ title, value }) {
  // Re-renders ONLY if `title` or `value` changes
  return (
    <div className="expensive-box">
      <h3>{title}</h3>
      <p>Value: {value}</p>
    </div>
  );
});
```

#### Fuller Example
```jsx
import React, { useState, useCallback, memo } from 'react';

// Memoized child item component
const ListItem = memo(function ListItem({ item, onDelete }) {
  console.log(`Rendering Item #${item.id}`);
  return (
    <li className="list-item">
      <span>{item.name}</span>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </li>
  );
});

export function ItemListManager() {
  const [items, setItems] = useState([
    { id: 1, name: 'Task A' },
    { id: 2, name: 'Task B' },
    { id: 3, name: 'Task C' },
  ]);
  const [counter, setCounter] = useState(0);

  // useCallback stabilizes function reference across parent renders
  const handleDelete = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="manager-container">
      <h2>Task Manager</h2>
      <button onClick={() => setCounter((prev) => prev + 1)}>
        Parent Repaint Trigger (Counter: {counter})
      </button>

      <ul>
        {items.map((item) => (
          <ListItem key={item.id} item={item} onDelete={handleDelete} />
        ))}
      </ul>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing Inline Objects or Arrow Functions to `React.memo` Children

**The mistake:** Wrapping a child component in `React.memo` but passing inline objects or arrow functions as props from the parent.

**Why it's wrong:** On every parent render, inline objects (`style={{ color: 'red' }}`) and inline arrow functions (`onSelect={() => handleSelect(id)}`) receive new memory addresses. Shallow comparison fails every time, completely nullifying `React.memo`.

*Incorrect:*
```jsx
// BAD: Inline object and arrow function break memoization on every render
<MemoizedRow options={{ color: 'blue' }} onClick={() => doSomething(id)} />
```

*Fix:*
```jsx
// GOOD: Stabilize object with useMemo and function with useCallback
const options = useMemo(() => ({ color: 'blue' }), []);
const handleClick = useCallback(() => doSomething(id), [id]);

<MemoizedRow options={options} onClick={handleClick} />
```

---

### Mistake 2: Overusing `React.memo` on Cheap Lightweight Components

**The mistake:** Wrapping every single 2-line text component in `React.memo`.

**Why it's wrong:** `React.memo` adds overhead because React must allocate memory for previous props and execute shallow comparison loops on every render. For simple components, prop comparison costs more CPU time than rendering the simple JSX.

*Incorrect:*
```jsx
// BAD: Unnecessary overhead for trivial text component
export const SimpleText = memo(({ text }) => <span>{text}</span>);
```

*Fix:*
```jsx
// GOOD: Standard component for simple lightweight JSX
export const SimpleText = ({ text }) => <span>{text}</span>;
```

---

### Mistake 3: Expecting `React.memo` to Prevent Re-renders When Internal State or Context Changes

**The mistake:** Expecting a component wrapped in `React.memo` to skip re-rendering when its internal `useState` updates or a consumed `useContext` changes.

**Why it's wrong:** `React.memo` only checks incoming props. If a component's internal state updates or a Context it subscribes to emits a new value, React will always re-render the component.

*Incorrect:*
```jsx
// Expecting memo to block re-renders when Context updates
```

*Fix:*
```jsx
// Separate Context consumers into smaller isolated child components
```

---

## 5. Practice Exercises

### Exercise 1: IoT Industrial Sensor Grid

**Scenario:** An IoT sensor dashboard renders a table of 1,000 industrial sensors. Sensors emit updates every 100ms, but only 1 sensor changes per update. You must use `React.memo` so updating 1 sensor does not re-render the other 999 sensor rows.

**Requirements:**
1. Wrap `SensorRow` component in `React.memo`.
2. Stabilize row click handlers using `useCallback`.
3. Verify un-updated rows do not re-render using console logging or assertions.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useCallback, memo } from 'react';
> 
> // Memoized Sensor Row
> const SensorRow = memo(function SensorRow({ sensor, onToggle }) {
>   return (
>     <tr className="sensor-row">
>       <td>{sensor.id}</td>
>       <td>{sensor.temp}°C</td>
>       <td>{sensor.active ? 'ONLINE' : 'OFFLINE'}</td>
>       <td>
>         <button onClick={() => onToggle(sensor.id)}>Toggle State</button>
>       </td>
>     </tr>
>   );
> });
> 
> export function IoTSensorMatrix() {
>   const [sensors, setSensors] = useState([
>     { id: 'S1', temp: 45.2, active: true },
>     { id: 'S2', temp: 32.1, active: true },
>     { id: 'S3', temp: 88.7, active: false },
>   ]);
> 
>   const handleToggle = useCallback((id) => {
>     setSensors((prev) =>
>       prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
>     );
>   }, []);
> 
>   return (
>     <table className="sensor-table">
>       <thead>
>         <tr>
>           <th>Sensor</th>
>           <th>Temp</th>
>           <th>Status</th>
>           <th>Action</th>
>         </tr>
>       </thead>
>       <tbody>
>         {sensors.map((sensor) => (
>           <SensorRow key={sensor.id} sensor={sensor} onToggle={handleToggle} />
>         ))}
>       </tbody>
>     </table>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof SensorRow === 'object', 'SensorRow must be memoized object');
> }
> ```
>
> #### Technical Explanation
> 1. **Shallow Prop Check**: When `S1` toggles state, `React.memo` compares props for `S2` and `S3`. Since their sensor objects and `onToggle` reference are unchanged, their renders are skipped.
> 2. **Stable Handler**: `useCallback` prevents `onToggle` from generating a new function reference during state updates.
> 3. **DOM Preservation**: Existing DOM nodes for `S2` and `S3` remain untouched in browser layout memory.
> 4. **Scalability**: Keeps frame rates consistent even with thousands of dynamic grid rows.
> 
---

### Exercise 2: Crypto Order Book with Custom Comparator

**Scenario:** A financial trading order book updates high-frequency market depth. Orders contain floating-point timestamps that change on every message, but price and volume remain identical. You need to supply a custom `arePropsEqual` comparator to `React.memo`.

**Requirements:**
1. Implement `OrderBookRow` component.
2. Supply custom `arePropsEqual` comparator ignoring timestamp changes.
3. Verify custom comparison logic.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, memo } from 'react';
> 
> // Custom comparator: compare price and amount, ignore timestamp changes
> function areOrdersEqual(prevProps, nextProps) {
>   return (
>     prevProps.order.price === nextProps.order.price &&
>     prevProps.order.amount === nextProps.order.amount
>   );
> }
> 
> const OrderBookRow = memo(function OrderBookRow({ order }) {
>   return (
>     <div className="order-row">
>       <span>Price: ${order.price}</span> | <span>Qty: {order.amount}</span>
>     </div>
>   );
> }, areOrdersEqual);
> 
> export function CryptoOrderStream() {
>   const [orders, setOrders] = useState([
>     { id: 1, price: 64000, amount: 1.5, timestamp: 1000 },
>     { id: 2, price: 64050, amount: 0.8, timestamp: 1001 },
>   ]);
> 
>   const simulateHeartbeat = () => {
>     setOrders((prev) =>
>       prev.map((ord) => ({ ...ord, timestamp: Date.now() }))
>     );
>   };
> 
>   return (
>     <div className="order-stream">
>       <h3>Live Order Depth</h3>
>       <button onClick={simulateHeartbeat}>Simulate Heartbeat Tick</button>
>       {orders.map((ord) => (
>         <OrderBookRow key={ord.id} order={ord} />
>       ))}
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof OrderBookRow === 'object', 'OrderBookRow is memoized component');
> }
> ```
>
> #### Technical Explanation
> 1. **Custom Comparator**: `areOrdersEqual` overrides default shallow equality, checking specific fields (`price` and `amount`).
> 2. **Bypassing Irrelevant Updates**: Heartbeat timestamp changes trigger parent re-renders, but `OrderBookRow` skips rendering because price and amount are unchanged.
> 3. **Reduced Diffing**: Prevents Fiber diffing algorithm from running unnecessarily on complex order rows.
> 4. **Precision Control**: Grants developers fine-grained control over component update criteria.
> 
---

### Exercise 3: E-Commerce Catalog Product Card

**Scenario:** An online shopping catalog renders product cards. Selecting filter tags updates parent catalog state. You must wrap product cards in `React.memo` and stabilize array props using `useMemo`.

**Requirements:**
1. Wrap `ProductCard` in `React.memo`.
2. Stabilize product tag arrays in parent component using `useMemo`.
3. Validate memoization prevents child re-renders during filter state changes.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useMemo, memo } from 'react';
> 
> const ProductCard = memo(function ProductCard({ product }) {
>   return (
>     <div className="product-card">
>       <h4>{product.name}</h4>
>       <p>${product.price}</p>
>       <small>Tags: {product.tags.join(', ')}</small>
>     </div>
>   );
> });
> 
> export function StoreCatalog() {
>   const [filter, setFilter] = useState('ALL');
> 
>   // Memoize products array to maintain stable object references
>   const products = useMemo(
>     () => [
>       { id: 1, name: 'Headphones', price: 99, tags: ['audio', 'tech'] },
>       { id: 2, name: 'Desk Lamp', price: 45, tags: ['home', 'office'] },
>     ],
>     []
>   );
> 
>   return (
>     <div className="catalog">
>       <h3>Storefront Catalog</h3>
>       <button onClick={() => setFilter(filter === 'ALL' ? 'ACTIVE' : 'ALL')}>
>         Toggle Filter: {filter}
>       </button>
>       <div className="grid">
>         {products.map((p) => (
>           <ProductCard key={p.id} product={p} />
>         ))}
>       </div>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof ProductCard === 'object', 'Memoized component object');
> }
> ```
>
> #### Technical Explanation
> 1. **Reference Stability**: `useMemo` preserves `products` array identity between parent renders.
> 2. **Prop Equality**: `React.memo` performs shallow equality on `product` props; identical references skip re-renders.
> 3. **Filter Toggle Efficiency**: Toggling `filter` state re-renders `StoreCatalog` but skips `ProductCard` execution.
> 4. **Memory Management**: Reusing previous Virtual DOM nodes eliminates unnecessary DOM mutations.
> 
---

## 6. Related Terms

- [`useCallback` Hook](../level_04/use_callback.md) — Hook for preserving function reference stability.
- [`useMemo` Hook](../level_04/use_memo.md) — Hook for preserving object/array reference stability.
- [Re-rendering](../level_02/re_rendering.md) — The render execution loop optimized by memoization.

---

## 7. Key Takeaways

- `React.memo` is a Higher-Order Component that skips re-rendering when props remain unchanged.
- It performs a shallow equality comparison on incoming props using `Object.is()`.
- Pair `React.memo` with `useCallback` for functions and `useMemo` for objects/arrays to maintain stable prop references.
- Custom comparison functions can be passed as a second argument (`arePropsEqual`).
- Do not wrap every component blindly; memoization carries shallow comparison memory and CPU costs.
