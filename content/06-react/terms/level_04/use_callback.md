# `useCallback` Hook

> **Level 4 — Advanced Hooks**
> A performance optimization hook that memoizes a function definition to preserve its memory reference identity across re-renders.

---

## 1. Prerequisites

- [`useMemo` Hook](use_memo.md) — The sister hook for memoizing values instead of function references.
- [React.memo](../level_08/react_memo.md) — Component render caching optimization relying on stable prop references.

---

## 2. Term Category

**Core Hook (function reference stabilizer)**: `useCallback` is React's built-in hook designed to freeze a callback function's memory address across component render cycles. In JavaScript, functions are objects; defining a function inside a component body allocates a brand new RAM memory address on every render frame.

Architecturally, passing un-memoized function references as props to child components optimized with `React.memo` causes `React.memo` to fail shallow prop equality checks (`Object.is`). `useCallback` preserves function reference stability until specified dependency array values update.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider a parent component rendering a heavily optimized child list:
```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // Re-allocated at a NEW memory address on EVERY render frame!
  const handleDelete = (id) => { console.log('Delete item', id); };

  return <ExpensiveChildList onDelete={handleDelete} />;
}
```
If `<ExpensiveChildList>` is wrapped in `React.memo`, React attempts to skip rendering when props stay identical. However, because `handleDelete` gets a new memory address on every parent render pass, `<ExpensiveChildList>` sees a new prop reference and re-renders anyway—destroying the optimization.

React introduced **`useCallback`** to solve this. It caches the function reference in memory. On subsequent re-renders, React hands back the exact same function reference from RAM unless elements in the dependency array change.

#### `useMemo` vs `useCallback`

- `useMemo` caches the **computed return value** of a function (`useMemo(() => computeValue(), [deps])`).
- `useCallback` caches the **function definition itself** (`useCallback(fn, [deps])`).
- In fact, `useCallback(fn, deps)` is syntactic shorthand for `useMemo(() => fn, deps)`.

### (2) Reality Metaphor

Imagine a corporate press office issuing official press release statements.

- **Un-memoized Function (New Paper Copies):** On every hourly update, the PR manager prints a brand new physical sheet of paper with the statement text (**new memory address**). Even if the statement text is identical word-for-word, the security desk stamps every physical paper sheet with a unique barcode. Archival staff assume it is a new document and process it (**unnecessary child re-renders**).
- **`useCallback` (Laminated Master Badge):** The PR manager laminates a single master reference badge (**frozen memory address**). On hourly updates, the manager presents the laminated badge. The security desk checks the barcode, sees it is the identical physical badge, and skips archival re-indexing (**skipping child re-renders**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState, useCallback } from 'react';

function StableCallbackDemo() {
  const [count, setCount] = useState(0);

  // ✅ Function memory reference frozen across re-renders
  const handleLog = useCallback(() => {
    console.log('Action logged');
  }, []); // Empty array: reference never shifts

  return <button onClick={handleLog}>Log Action ({count})</button>;
}
```

#### Fuller Example

```jsx
import React, { useState, useCallback } from 'react';

// Memoized Child Component
const ListItem = React.memo(({ item, onDelete }) => {
  console.log(`[Render ListItem]: ${item.name}`);
  return (
    <div>
      <span>{item.name}</span>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  );
});

function InventoryManager() {
  const [items, setItems] = useState([
    { id: 1, name: 'Sensor Module A' },
    { id: 2, name: 'Actuator Unit B' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ useCallback preserves reference, using functional updater to avoid dependency loop
  const handleDelete = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Filter items..."
      />
      {items.map((item) => (
        <ListItem key={item.id} item={item} onDelete={handleDelete} />
      ))}
    </div>
  );
}

export default InventoryManager;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Stale State Closures in `useCallback`

**The mistake:** Reading a state variable inside `useCallback` while omitting that variable from the dependency array.

**Why it's wrong:** The memoized function becomes trapped in a **stale closure**, reading initial state snapshots forever.

*Incorrect:*
```jsx
const [count, setCount] = useState(0);
const logCount = useCallback(() => {
  console.log('Count is:', count); // ❌ count trapped at 0!
}, []); // Missing count dependency!
```

*Fix:*
```jsx
const [count, setCount] = useState(0);
const logCount = useCallback(() => {
  console.log('Count is:', count); // ✅ Refreshes reference when count updates
}, [count]);
```

### Mistake 2: Using `useCallback` for Callbacks Passed Only to Native HTML Elements

**The mistake:** Wrapping `const handleClick = useCallback(...)` when passing `handleClick` to a standard `<button onClick={handleClick}>`.

**Why it's wrong:** `useCallback` does NOT execute functions faster. Its primary purpose is preserving reference equality for `React.memo` child components. Standard HTML elements do not benefit from memoized references.

*Incorrect:*
```jsx
// ❌ Unnecessary overhead: HTML <button> does not use React.memo
const handleClick = useCallback(() => setClickCount(c => c + 1), []);
return <button onClick={handleClick}>Click Me</button>;
```

*Fix:*
```jsx
// ✅ Plain inline function for native HTML elements
const handleClick = () => setClickCount(c => c + 1);
return <button onClick={handleClick}>Click Me</button>;
```

### Mistake 3: Including State Dependencies That Could Be Avoided via Functional Updaters

**The mistake:** Adding `[items]` to `useCallback` dependencies when calling `setItems([...items, newItem])`.

**Why it's wrong:** Adding `items` causes `useCallback` to regenerate a new function reference on every list update, defeating the memoization optimization.

*Incorrect:*
```jsx
const handleAdd = useCallback((newItem) => {
  setItems([...items, newItem]); // ❌ Requires items in dependency list
}, [items]);
```

*Fix:*
```jsx
const handleAdd = useCallback((newItem) => {
  setItems(prev => [...prev, newItem]); // ✅ Functional updater avoids items dependency
}, []);
```

---

## 5. Practice Exercises

### Exercise 1: IoT Industrial Valve Toggle Controller

**Scenario:** An industrial IoT dashboard controls 100 fluid valves. Each `<ValveCard />` is wrapped in `React.memo`. Preserve reference stability for `toggleValve` using `useCallback` so toggling one valve does not re-render the other 99 valve cards.

**Requirements:**
1. Wrap `<ValveCard />` in `React.memo`.
2. Implement `toggleValve` handler using `useCallback`.
3. Use functional state updaters (`setValves(prev => ...)`).
4. Verify unchanged valve cards skip re-renders.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useCallback } from 'react';
> 
> const ValveCard = React.memo(({ id, isOpen, onToggle }) => {
>   console.log(`[Render ValveCard]: ${id}`);
>   return (
>     <div>
>       <span>Valve {id}: {isOpen ? 'OPEN' : 'CLOSED'}</span>
>       <button onClick={() => onToggle(id)}>Toggle</button>
>     </div>
>   );
> });
> 
> export function FactoryValvePanel() {
>   const [valves, setValves] = useState([
>     { id: 'V-101', isOpen: false },
>     { id: 'V-102', isOpen: true }
>   ]);
> 
>   const handleToggle = useCallback((id) => {
>     setValves(prev => prev.map(v => v.id === id ? { ...v, isOpen: !v.isOpen } : v));
>   }, []);
> 
>   return (
>     <div>
>       {valves.map(v => (
>         <ValveCard key={v.id} id={v.id} isOpen={v.isOpen} onToggle={handleToggle} />
>       ))}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Reference Stability**: `useCallback` maintains identical `handleToggle` function pointers.
> 2. **Child Skip Optimization**: `React.memo` verifies identical `onToggle` props, skipping un-toggled cards.
> 3. **Functional Updaters**: `prev => ...` removes `valves` array from dependencies.
> 4. **Scalable Ingestion**: Prevents re-rendering 100 DOM subtrees.
> 
### Exercise 2: Financial Order Cancellation Handler

**Scenario:** A stock order book renders order rows wrapped in `React.memo`. Memoize `cancelOrder` callbacks so typing in market search inputs does not re-render order rows.

**Requirements:**
1. Memoize `cancelOrder` callback with `useCallback`.
2. Pass to `React.memo` order rows.
3. Keep search filter state updates isolated.
4. Render trading desk order book.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useCallback } from 'react';
> 
> const OrderRow = React.memo(({ orderId, symbol, onCancel }) => {
>   console.log(`[Render OrderRow]: ${orderId}`);
>   return (
>     <div>
>       <span>{symbol} (ID: {orderId})</span>
>       <button onClick={() => onCancel(orderId)}>Cancel</button>
>     </div>
>   );
> });
> 
> export function OrderBookDesk({ orders }) {
>   const [search, setSearch] = useState('');
> 
>   const handleCancel = useCallback((orderId) => {
>     console.log(`Cancelling order: ${orderId}`);
>   }, []);
> 
>   return (
>     <div>
>       <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
>       {orders.map(o => (
>         <OrderRow key={o.id} orderId={o.id} symbol={o.symbol} onCancel={handleCancel} />
>       ))}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Prop Reference Equality**: Preserves `onCancel` reference across search input renders.
> 2. **React.memo Alignment**: Enables `React.memo` shallow prop checks to succeed.
> 3. **Search Isolation**: Typing in search updates parent without child diffing overhead.
> 4. **Pure Callback Design**: Retains zero closure memory leaks.
> 
### Exercise 3: E-Commerce Quantity Incrementer Hook Sync

**Scenario:** An e-commerce cart renders items wrapped in `React.memo`. Use `useCallback` to stabilize item quantity increment/decrement callbacks.

**Requirements:**
1. Stabilize `updateQuantity` handler via `useCallback`.
2. Pass handler to `React.memo` item rows.
3. Use functional updaters for cart array state.
4. Render shopping cart items.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useCallback } from 'react';
> 
> const CartItemRow = React.memo(({ item, onUpdateQty }) => {
>   console.log(`[Render CartItemRow]: ${item.name}`);
>   return (
>     <div>
>       <span>{item.name} - Qty: {item.qty}</span>
>       <button onClick={() => onUpdateQty(item.id, item.qty + 1)}>+</button>
>       <button onClick={() => onUpdateQty(item.id, item.qty - 1)}>-</button>
>     </div>
>   );
> });
> 
> export function ShoppingCartDrawer() {
>   const [items, setItems] = useState([
>     { id: 1, name: 'Keyboard', qty: 1 },
>     { id: 2, name: 'Mouse', qty: 2 }
>   ]);
> 
>   const handleUpdateQty = useCallback((id, newQty) => {
>     setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, newQty) } : i));
>   }, []);
> 
>   return (
>     <div>
>       {items.map(item => (
>         <CartItemRow key={item.id} item={item} onUpdateQty={handleUpdateQty} />
>       ))}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Reference Freezing**: `useCallback` maintains identical function pointer addresses.
> 2. **State Isolation**: Functional update syntax avoids tracking `items` in dependency array.
> 3. **Render Optimization**: Un-modified row items skip re-renders completely.
> 4. **Declarative State**: Cart array updates immutably.
> 
---

## 6. Related Terms

- [`useMemo` Hook](use_memo.md) — Sister hook for caching value outputs.
- [React.memo](../level_08/react_memo.md) — Component render caching optimization.
- [Referential Equality](referential_equality.md) — Memory reference address comparison.
- [Stale Closures](../level_03/stale_closures.md) — Bugs caused by omitting referenced values from dependency arrays.

---

## 7. Key Takeaways

- `useCallback` memoizes function memory references across component render cycles.
- Its primary purpose is preserving referential equality for props passed to `React.memo` child components.
- Do not wrap functions passed only to native HTML elements (e.g. `<button onClick>`); it adds unnecessary overhead.
- Use functional state updaters (`prev => ...`) inside callbacks to minimize dependency array triggers.
- `useCallback(fn, deps)` is syntactic shorthand for `useMemo(() => fn, deps)`.
```

---

## File 7: `knowledge-base/06-react/terms/level_04/use_id.md`

```markdown
