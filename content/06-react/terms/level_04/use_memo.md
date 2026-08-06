# `useMemo` Hook

> **Level 4 — Advanced Hooks**
> A performance optimization hook that memoizes the computed return value of a calculation across re-renders.

---

## 1. Prerequisites

- [Re-rendering](../level_02/re_rendering.md) — Understanding that functional components re-execute top-to-bottom on updates.
- [Dependency Array](../level_03/dependency_array.md) — The watchlist mechanism controlling when `useMemo` recalculates outputs.

---

## 2. Term Category

**Core Hook (computed value memoizer)**: `useMemo` is React's built-in hook for caching computed values returned by expensive function calculations. In functional components, any calculation declared directly in the component body executes from scratch on every render pass.

Architecturally, `useMemo` accepts a calculation function and a dependency array. On re-renders, React inspects the dependency array using shallow equality (`Object.is`). If dependencies are unchanged, React skips re-running the calculation function and returns the cached value instantly.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider a component that filters and sorts an array of 50,000 items:
```jsx
function ProductDashboard({ products }) {
  const [search, setSearch] = useState('');

  // ❌ Executes 50,000 array iterations on EVERY render (including typing in search!)
  const sortedProducts = products.sort((a, b) => a.price - b.price);

  return <input value={search} onChange={e => setSearch(e.target.value)} />;
}
```
When the user types a character into the `search` input, the state updates and the component re-renders. Re-sorting 50,000 items on every single keystroke takes 200ms of CPU work, freezing the UI.

React introduced **`useMemo`** to solve this. By wrapping the calculation in `useMemo`, React remembers the sorted array result. If `search` state changes while `products` remains identical, React skips the sorting math and returns the cached array.

#### Primary Use Cases

1. **Caching Heavy Calculations:** Filtering, sorting, matrix transformations, or parsing large payloads.
2. **Preserving Referential Equality:** Caching object or array definitions passed to `useEffect` dependency arrays or `React.memo` child props.

### (2) Reality Metaphor

Imagine a restaurant tax accountant.

- **Without `useMemo` (Manual Recalculation):** Every time a server asks for the daily tax total, the accountant pulls out thousands of paper receipts and calculates tax totals manually for 30 minutes (**wasted CPU cycles**).
- **With `useMemo` (Ledger Summary):** The accountant calculates daily tax once and writes the total on a ledger cover sheet (**caching the output**). When servers ask for the total, the accountant reads the summary total instantly. Only when a new receipt is added to the stack (**dependency update**) does the accountant recalculate the total.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState, useMemo } from 'react';

function FactorialCalculator({ number }) {
  // ✅ Memoizes slow math output; recalculates only when `number` changes
  const factorial = useMemo(() => {
    let result = 1;
    for (let i = 1; i <= number; i++) { result *= i; }
    return result;
  }, [number]);

  return <p>Factorial of {number} = {factorial}</p>;
}
```

#### Fuller Example

```jsx
import React, { useState, useMemo } from 'react';

function FinancialPortfolioSummary({ transactions }) {
  const [filterType, setFilterType] = useState('ALL');
  const [theme, setTheme] = useState('dark');

  // ✅ Heavy calculation cached via useMemo
  const summaryMetrics = useMemo(() => {
    console.log('Running heavy portfolio transaction analytics...');
    let totalDeposits = 0;
    let totalWithdrawals = 0;

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (tx.type === 'DEPOSIT') totalDeposits += tx.amount;
      if (tx.type === 'WITHDRAWAL') totalWithdrawals += tx.amount;
    }

    return {
      netBalance: totalDeposits - totalWithdrawals,
      totalVolume: totalDeposits + totalWithdrawals
    };
  }, [transactions]); // Recalculates strictly when transaction array changes

  return (
    <div className={`summary-box ${theme}`}>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        Toggle UI Theme ({theme})
      </button>
      <h4>Net Balance: ${summaryMetrics.netBalance.toFixed(2)}</h4>
      <p>Total Volume: ${summaryMetrics.totalVolume.toFixed(2)}</p>
    </div>
  );
}

export default FinancialPortfolioSummary;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Memoizing Cheap Primitive Operations (Over-memoization)

**The mistake:** Wrapping simple arithmetic operations or basic string formatting in `useMemo`.

**Why it's wrong:** `useMemo` has memory and CPU overhead (allocating memory, running `Object.is` dependency checks). Wrapping `a + b` in `useMemo` makes components slower than computing `a + b` directly.

*Incorrect:*
```jsx
// ❌ Over-memoization: calculation is faster than hook overhead
const double = useMemo(() => count * 2, [count]);
```

*Fix:*
```jsx
// ✅ Compute directly during render
const double = count * 2;
```

### Mistake 2: Mutating `useMemo` Return Values Directly

**The mistake:** Writing `const sorted = useMemo(() => items.sort(), [items])`.

**Why it's wrong:** Array `.sort()` mutates arrays in place! Mutating memoized return values corrupts underlying state arrays across renders. Always copy arrays (`[...items].sort()`) before sorting.

*Incorrect:*
```jsx
const sorted = useMemo(() => items.sort(), [items]); // ❌ In-place mutation!
```

*Fix:*
```jsx
const sorted = useMemo(() => [...items].sort((a, b) => a.id - b.id), [items]); // ✅ Pure copy
```

### Mistake 3: Omitting Variables Used Inside `useMemo` from Dependencies

**The mistake:** Computing `price * quantity` inside `useMemo` while passing `[price]` only.

**Why it's wrong:** `useMemo` returns stale cached values when omitted dependencies update.

*Incorrect:*
```jsx
const total = useMemo(() => price * quantity, [price]); // ❌ Missing quantity!
```

*Fix:*
```jsx
const total = useMemo(() => price * quantity, [price, quantity]); // ✅ Complete dependencies
```

---

## 5. Practice Exercises

### Exercise 1: IoT Industrial Sensor Outlier Filter

**Scenario:** An industrial IoT monitoring node receives 50,000 telemetry records. Filter outlier readings exceeding safety limits using `useMemo` so toggling UI charts remains responsive.

**Requirements:**
1. Filter 50,000 items inside `useMemo`.
2. Include `readings` and `maxLimit` in dependencies.
3. Skip filter computations when `selectedChartType` UI state updates.
4. Render filtered outlier counts.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useMemo } from 'react';
> 
> export function TelemetryOutlierDetector({ readings, maxLimit }) {
>   const [chartType, setChartType] = useState('BAR');
> 
>   const outliers = useMemo(() => {
>     console.log('Filtering 50,000 telemetry items...');
>     return readings.filter(r => r.val > maxLimit);
>   }, [readings, maxLimit]);
> 
>   return (
>     <div>
>       <button onClick={() => setChartType(c => c === 'BAR' ? 'LINE' : 'BAR')}>Chart: {chartType}</button>
>       <h4>Outliers Detected: {outliers.length}</h4>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Heavy Calculation Cache**: Filtering 50,000 items is cached inside `useMemo`.
> 2. **Selective Execution**: Toggling `chartType` state skips the loop, rendering instantly.
> 3. **Dependency Precision**: `[readings, maxLimit]` recalculates only on metric shifts.
> 4. **UI Performance**: Eliminates frame drops during chart type toggles.
> 
### Exercise 2: Financial Order Book Depth Aggregator

**Scenario:** A stock order book aggregates bid/ask market depth arrays. Compute cumulative market volume using `useMemo`.

**Requirements:**
1. Compute cumulative volume using `useMemo`.
2. Depend on `bids` and `asks` arrays.
3. Avoid in-place array mutations.
4. Render market volume statistics.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useMemo } from 'react';
> 
> export function MarketDepthAggregator({ bids, asks }) {
>   const depthStats = useMemo(() => {
>     const totalBidVol = bids.reduce((acc, b) => acc + b.amount, 0);
>     const totalAskVol = asks.reduce((acc, a) => acc + a.amount, 0);
>     return {
>       totalBidVol,
>       totalAskVol,
>       imbalance: (totalBidVol - totalAskVol).toFixed(2)
>     };
>   }, [bids, asks]);
> 
>   return (
>     <div>
>       <p>Bid Volume: {depthStats.totalBidVol}</p>
>       <p>Ask Volume: {depthStats.totalAskVol}</p>
>       <h4>Market Imbalance: {depthStats.imbalance}</h4>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Pure Array Reduction**: Computes cumulative sums without mutating props.
> 2. **Calculated Output Cache**: Object return is cached, preserving referential equality.
> 3. **Dependency Alignment**: `[bids, asks]` recalculates when market depth changes.
> 4. **Performance Protection**: Preserves high-frequency trading desk rendering speeds.
> 
### Exercise 3: E-Commerce Product Search & Sort Engine

**Scenario:** An e-commerce catalog searches and sorts 10,000 products by price. Use `useMemo` to cache sorted search results.

**Requirements:**
1. Filter and sort product array inside `useMemo`.
2. Copy array `[...products]` before sorting.
3. Include `products`, `query`, and `sortBy` in dependencies.
4. Render sorted product list counts.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useMemo } from 'react';
> 
> export function ProductSearchEngine({ products }) {
>   const [query, setQuery] = useState('');
>   const [sortBy, setSortBy] = useState('price-asc');
> 
>   const processedProducts = useMemo(() => {
>     console.log('Searching and sorting products...');
>     const filtered = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
>     
>     // Copy array to prevent in-place mutation
>     return [...filtered].sort((a, b) => {
>       if (sortBy === 'price-asc') return a.price - b.price;
>       return b.price - a.price;
>     });
>   }, [products, query, sortBy]);
> 
>   return (
>     <div>
>       <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." />
>       <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
>         <option value="price-asc">Price Low-High</option>
>         <option value="price-desc">Price High-Low</option>
>       </select>
>       <h4>Matching Items: {processedProducts.length}</h4>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Immutability Safeguard**: `[...filtered].sort()` prevents mutating input arrays.
> 2. **Chained Operations**: Combines search filtering and sorting in a single memoized block.
> 3. **Dependency Guard**: Recalculates strictly when search parameters update.
> 4. **Render Responsiveness**: Keeps UI input typing fluid.
> 
---

## 6. Related Terms

- [`useCallback` Hook](use_callback.md) — Sister hook for memoizing function references.
- [Memoization (the concept)](memoization.md) — The computer science optimization concept.
- [Derived State](../level_02/derived_state.md) — Values derived during render passes.
- [Referential Equality](referential_equality.md) — Reference comparison driving `useMemo` decisions.

---

## 7. Key Takeaways

- `useMemo` caches the computed return value of a calculation function across re-renders.
- It re-runs the calculation only when elements in its dependency array change (`Object.is`).
- Use it for heavy calculations (sorting, filtering large lists) or to preserve referential equality of objects/arrays.
- Do NOT use it for cheap, fast operations (e.g. `a + b`); hook overhead makes simple operations slower.
- Never mutate arrays in place inside `useMemo` (always copy arrays `[...arr]` before sorting).
```

---

## File 9: `knowledge-base/06-react/terms/level_04/use_ref.md`

```markdown
