# Referential Equality

> **Level 4 — Advanced Hooks**
> Why JavaScript compares objects and functions by memory reference address, and how un-memoized object references trigger unintended re-renders.

---

## 1. Prerequisites

- [Immutability](../level_02/immutability.md) — Modifying reference data structures requires allocating copy instances.
- [`useMemo` Hook](use_memo.md) — The hook used to preserve reference identities across renders.

---

## 2. Term Category

**Rendering Mechanic (reconciliation diffing engine)**: In JavaScript, comparison behaviors are divided into two categories:
1. **Primitives (Strings, Numbers, Booleans):** Compared by **value**. `"hello" === "hello"` evaluates to `true`.
2. **References (Objects, Arrays, Functions):** Compared by **reference** (memory address). `{ a: 1 } === { a: 1 }` evaluates to `false`.

In React's rendering pipeline, functional components execute their entire body on every render frame, re-allocating new memory addresses for all locally declared objects, arrays, and functions. Architecturally, passing un-memoized references to hook dependency arrays or `React.memo` child props triggers infinite loops or bypasses memoization.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

React uses shallow reference comparison (`Object.is`) in two critical locations:
1. **Dependency Arrays (`useEffect`, `useCallback`, `useMemo`):** Comparing dependencies between render passes.
2. **Component Memoization (`React.memo`):** Comparing incoming prop objects to determine whether to skip rendering.

Consider an object declared in a component render body:
```jsx
function UserDashboard() {
  // Re-allocated at a NEW memory address on EVERY render frame!
  const options = { limit: 10 };

  useEffect(() => {
    fetchLogs(options);
  }, [options]); // Object.is sees a NEW reference every render -> Infinite Loop!
}
```
Because `options` gets a fresh RAM address every render frame, `Object.is(oldOptions, newOptions)` evaluates to `false`. React assumes the dependency updated and fires the effect continuously.

To resolve referential inequality bugs, developers:
- Move static objects **outside the component function body**.
- Wrap local object/array definitions in `useMemo`.
- Wrap local callback functions in `useCallback`.
- Destructure primitive values into dependency arrays (`[options.limit]`).

### (2) Reality Metaphor

Imagine access control keys.

- **Primitive Comparison (Combination Lock):** A digital lock opens with code `1-2-3-4` (**primitive value**). Anyone presenting code `1-2-3-4` opens the lock. Writing the code on two separate paper notes does not change the combination value.
- **Reference Comparison (Physical Brass Keys):** A high-security vault requires presenting Key A (**memory address**). You make an exact duplicate brass Key B. Key B looks identical and opens the door lock, but a security scanner checking physical metal signatures rejects Key B because it is NOT physical Key A (**referential inequality**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState, useEffect, useMemo } from 'react';

function StableOptionsWatcher() {
  const [count, setCount] = useState(0);

  // ✅ useMemo preserves exact memory address identity between renders
  const queryParams = useMemo(() => ({ page: 1, limit: 20 }), []);

  useEffect(() => {
    console.log('Fetching logs with stable params...');
  }, [queryParams]); // Stable reference: fires once on mount

  return <button onClick={() => setCount(c => c + 1)}>Re-render ({count})</button>;
}
```

#### Fuller Example

```jsx
import React, { useState, useCallback } from 'react';

// Memoized Child Component
const FilterButton = React.memo(({ onFilterChange, label }) => {
  console.log(`[Child Render] FilterButton: ${label}`);
  return <button onClick={() => onFilterChange(label)}>{label}</button>;
});

function ProductCatalog() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  // ✅ useCallback preserves function reference identity across renders
  const handleFilterChange = useCallback((newCategory) => {
    setCategory(newCategory);
  }, []);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." />
      <p>Selected Category: {category}</p>
      
      {/* Passing stable callback reference preserves React.memo child optimization */}
      <FilterButton label="Electronics" onFilterChange={handleFilterChange} />
      <FilterButton label="Clothing" onFilterChange={handleFilterChange} />
    </div>
  );
}

export default ProductCatalog;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing Inline Arrow Functions to `React.memo` Child Components

**The mistake:** Passing `<MemoChild onClick={() => setVal(1)} />` directly inside JSX.

**Why it's wrong:** Inline arrow functions allocate new reference addresses on every parent render pass, causing `React.memo` to fail prop equality checks and re-render the child every time.

*Incorrect:*
```jsx
// ❌ Inline function breaks React.memo child optimization
<MemoizedButton onClick={() => handleClick()} />
```

*Fix:*
```jsx
const handleClick = useCallback(() => { ... }, []); // ✅ Preserves reference identity
<MemoizedButton onClick={handleClick} />
```

### Mistake 2: Expecting `{ a: 1 } === { a: 1 }` to Evaluate to True

**The mistake:** Comparing two separate objects with identical keys expecting deep value equality.

**Why it's wrong:** In JavaScript, object comparisons evaluate memory addresses, not key-value contents. `{ a: 1 } === { a: 1 }` returns `false`.

*Incorrect:*
```jsx
const objA = { role: 'admin' };
const objB = { role: 'admin' };
console.log(objA === objB); // ❌ false! Different RAM references
```

*Fix:*
```jsx
// Compare primitive scalar fields directly
console.log(objA.role === objB.role); // ✅ true
```

### Mistake 3: Creating Un-memoized Objects Inside Components and Passing to Dependencies

**The mistake:** Declaring `const config = { api: '/v1' }` in render and passing `[config]` to `useEffect`.

**Why it's wrong:** Re-allocating `config` on every render causes `useEffect` to trigger an infinite execution loop.

*Incorrect:*
```jsx
const config = { api: '/v1' }; // ❌ Re-created every render frame
useEffect(() => {
  fetch(config.api);
}, [config]); // Infinite loop!
```

*Fix:*
```jsx
// Option A: Move static objects outside the component
const CONFIG = { api: '/v1' };
// Option B: Wrap in useMemo
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Configuration Reference Stabilizer

**Scenario:** An industrial IoT dashboard passes a `config` object to a `useEffect` data fetcher. The code triggers an infinite fetch loop. Move static configurations outside or stabilize with `useMemo`.

**Requirements:**
1. Fix referential inequality bug causing infinite fetches.
2. Stabilize `config` object memory reference.
3. Include stabilized reference in effect dependencies.
4. Render current device metrics.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect, useMemo } from 'react';
> 
> export function DeviceTelemetryViewer({ deviceId }) {
>   const [data, setData] = useState(null);
> 
>   // Preserve referential equality across render cycles
>   const config = useMemo(() => ({
>     timeout: 5000,
>     retryCount: 3
>   }), []);
> 
>   useEffect(() => {
>     console.log(`Fetching device ${deviceId} with config timeout: ${config.timeout}`);
>     setData({ status: 'Active', deviceId });
>   }, [deviceId, config]);
> 
>   return <div>Device: {deviceId} | Status: {data ? data.status : 'Loading...'}</div>;
> }
> ```
>
> #### Technical Explanation
> 1. **Reference Stability**: `useMemo` guarantees `config` retains the exact same RAM memory address across renders.
> 2. **Loop Prevention**: `Object.is(oldConfig, newConfig)` returns `true`, stopping infinite effect execution.
> 3. **ESLint Compliance**: Safe inclusion of `config` in dependency array.
> 4. **Predictable Fetching**: Runs only when `deviceId` updates.
> 
### Exercise 2: Financial Trading Desk Callback Reference Lock

**Scenario:** A stock trading grid passes `onTradeExecute` callbacks to memoized `<RowItem />` components. Ensure typing in search filters does not re-render un-changed row components due to referential inequality.

**Requirements:**
1. Wrap `<RowItem />` in `React.memo`.
2. Stabilize `onTradeExecute` handler using `useCallback`.
3. Verify row components skip re-renders on search input typing.
4. Render trading desk grid.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useCallback } from 'react';
> 
> const RowItem = React.memo(({ symbol, price, onTrade }) => {
>   console.log(`[Render Row]: ${symbol}`);
>   return (
>     <div>
>       <span>{symbol}: ${price}</span>
>       <button onClick={() => onTrade(symbol)}>Trade</button>
>     </div>
>   );
> });
> 
> export function TradingDeskGrid({ stocks }) {
>   const [search, setSearch] = useState('');
> 
>   const handleTrade = useCallback((symbol) => {
>     console.log(`Executing trade for: ${symbol}`);
>   }, []);
> 
>   return (
>     <div>
>       <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter symbol..." />
>       {stocks.map(s => (
>         <RowItem key={s.symbol} symbol={s.symbol} price={s.price} onTrade={handleTrade} />
>       ))}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Function Reference Freeze**: `useCallback` returns identical function memory addresses between renders.
> 2. **Child Render Prevention**: `React.memo` detects identical `onTrade` prop references, skipping child re-renders.
> 3. **Input Responsiveness**: Typing in `search` state updates parent without re-rendering row list.
> 4. **Memory Hygiene**: Eliminates unnecessary virtual DOM diffing passes.
> 
### Exercise 3: E-Commerce Filter Array Reference Sync

**Scenario:** An e-commerce catalog receives `selectedTags` arrays. Stabilize array reference comparisons to prevent redundant product filter calculations.

**Requirements:**
1. Compare `selectedTags` primitive contents or wrap array creation in `useMemo`.
2. Recalculate catalog list only on tag content changes.
3. Skip recalculations when user toggles drawer UI states.
4. Render matched item counts.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useMemo } from 'react';
> 
> export function CatalogTagFilter({ products, rawTagString }) {
>   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
> 
>   // Convert comma-separated string to stable primitive array dependency
>   const tagList = useMemo(() => {
>     return rawTagString.split(',').map(t => t.trim()).filter(Boolean);
>   }, [rawTagString]);
> 
>   const filteredProducts = useMemo(() => {
>     if (!tagList.length) return products;
>     return products.filter(p => tagList.some(t => p.tags.includes(t)));
>   }, [products, tagList]);
> 
>   return (
>     <div>
>       <button onClick={() => setIsDrawerOpen(o => !o)}>Toggle Cart Drawer</button>
>       <h4>Matched Products: {filteredProducts.length}</h4>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Reference Normalization**: `useMemo` transforms string inputs into stable array references.
> 2. **Dependency Synchronization**: `filteredProducts` watches stable `tagList` references.
> 3. **UI Drawer Isolation**: Toggling `isDrawerOpen` preserves array references, skipping filtering loops.
> 4. **Declarative Computation**: Pure value derivation during render pass.
> 
---

## 6. Related Terms

- [`useCallback` Hook](use_callback.md) — Hook designed to preserve function reference identities.
- [`useMemo` Hook](use_memo.md) — Hook designed to preserve object/array reference identities.
- [React.memo](../level_08/react_memo.md) — Component render cache relying on shallow reference equality.
- [Immutability](../level_02/immutability.md) — Requirement for state updates to allocate fresh reference objects.

---

## 7. Key Takeaways

- JavaScript compares objects, arrays, and functions by reference (RAM memory address).
- Primitives (strings, numbers, booleans) are compared by value.
- Functional components re-allocate local object/function references on every render pass.
- Un-memoized references passed to dependency arrays cause infinite execution loops.
- Un-memoized references passed as props break `React.memo` child component optimizations.
- Use `useMemo` for objects/arrays and `useCallback` for functions to preserve referential equality.
```

---

## File 5: `knowledge-base/06-react/terms/level_04/rules_of_hooks.md`

```markdown
