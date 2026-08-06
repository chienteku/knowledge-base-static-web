# Memoization (the concept)

> **Level 4 — Advanced Hooks**
> Caching computed calculation outputs keyed on input dependencies to skip redundant computations across render cycles.

---

## 1. Prerequisites

- [`useMemo` Hook](use_memo.md) — The primary hook implementing value memoization.
- [`useCallback` Hook](use_callback.md) — The hook implementing function reference memoization.

---

## 2. Term Category

**Rendering Mechanic (component optimization engine)**: In computer science, **Memoization** is an optimization technique that stores the results of expensive function calls and returns cached outputs when identical input parameters recur. In React's rendering pipeline, functional components re-execute their entire body on every render pass.

Architecturally, React provides memoization mechanisms across three APIs (`useMemo`, `useCallback`, and `React.memo`). These APIs trade memory allocation (storing previous inputs and results) to save CPU execution cycles, preserving application frame rates during heavy updates.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Because React re-renders components whenever state or props change, any calculation declared directly inside a component body runs again from scratch.

If a component filters a list of 10,000 products, executes matrix math, or parses complex JSON payloads:
- Re-executing this heavy math on every unrelated state update (such as typing into a search bar) wastes CPU cycles.
- High CPU execution times cause frame drops, lagging UI input response times.

React introduced memoization utilities to cache calculation outputs. When a component re-renders, React checks whether calculation inputs (dependencies) changed. If dependencies are unchanged, React returns the cached output instantly without recalculating.

#### The Memoization Tradeoff

Memoization is NOT free:
- It requires **memory** to store cached arguments and return values.
- It consumes **CPU cycles** on every render to perform shallow equality checks (`Object.is`) on dependency array elements.

If a calculation is cheap (such as string concatenation `firstName + ' ' + lastName`), checking dependencies takes more CPU work than running the calculation itself. Memoization should be applied selectively to genuinely expensive computations or to preserve referential equality.

### (2) Reality Metaphor

Imagine a student completing math homework.

- **Without Memoization (Repeated Work):** A teacher asks: *"What is 482 multiplied by 37?"* The student works out long multiplication on paper for two minutes and answers `17,834`. Five minutes later, the teacher asks the exact same question. The student pulls out a fresh sheet of paper, recalculates long multiplication for two minutes, and answers `17,834` again (**wasted CPU cycles**).
- **With Memoization (Flashcard Cache):** The first time the teacher asks, the student calculates `17,834` and writes `482 * 37 = 17,834` on a flashcard (**caching the output**). The next time the teacher asks the same question, the student checks their flashcards and reads the answer instantly without recalculating (**cache hit**).

### (3) React Code Examples

#### Short Snippet
```jsx
import { useMemo, useState } from 'react';

function FactorialCalculator({ number }) {
  // Caching expensive factorial math computation across re-renders
  const factorial = useMemo(() => {
    console.log('Computing expensive factorial...');
    return computeFactorial(number);
  }, [number]);

  return <div>Factorial of {number} is {factorial}</div>;
}
```

#### Fuller Example
```jsx
import { useState, useMemo } from 'react';

// Expensive data processing function
function filterHeavyData(items, query) {
  console.log('Executing expensive array search filter...');
  return items.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
}

export function TransactionFilter({ transactions }) {
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('light');

  // Memoize filtered dataset so changing theme does NOT trigger re-filtering
  const filteredTransactions = useMemo(() => {
    return filterHeavyData(transactions, query);
  }, [transactions, query]);

  return (
    <div className={`panel ${theme}`}>
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle Theme ({theme})
      </button>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Filter transactions..."
      />
      <ul>
        {filteredTransactions.map(item => (
          <li key={item.id}>{item.name}: ${item.amount}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Memoizing Cheap Primitive String or Math Operations

**The mistake:** Wrapping basic string formatting or simple additions in `useMemo`.

**Why it's wrong:** Comparing dependencies in `useMemo` takes more CPU execution time than string concatenation. Over-memoizing cheap operations degrades performance.

*Incorrect:*
```jsx
// ❌ Over-memoization: calculation is faster than hook overhead
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);
```

*Fix:*
```jsx
// ✅ Calculate directly during render
const fullName = `${firstName} ${lastName}`;
```

### Mistake 2: Passing Un-memoized Callbacks to `React.memo` Components

**The mistake:** Wrapping a child component in `React.memo` but passing an inline arrow function prop `<MemoChild onClick={() => doSomething()} />`.

**Why it's wrong:** Inline arrow functions create new memory references on every render frame. `React.memo` detects prop reference changes and re-renders the child anyway, rendering memoization useless.

*Incorrect:*
```jsx
const MemoChild = React.memo(ChildComponent);
// In Parent render:
<MemoChild onClick={() => handleSave()} /> // ❌ Re-renders every time!
```

*Fix:*
```jsx
const handleSave = useCallback(() => { ... }, []); // ✅ Stable reference
<MemoChild onClick={handleSave} />
```

### Mistake 3: Expecting `useMemo` to Function as a Semantic Guarantee

**The mistake:** Relying on `useMemo` to prevent code execution for correctness rather than performance optimization.

**Why it's wrong:** React reserves the right to discard cached memoization memory under high memory pressure. Your code must remain functionally correct even if React clears caches and recalculates values.

*Incorrect:*
```jsx
// Relying on useMemo to execute side effects or ensure state correctness
```

*Fix:*
```jsx
// Use useMemo purely for performance caching of pure calculations
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Array Data Aggregator

**Scenario:** An industrial IoT dashboard displays telemetry for 20,000 sensor nodes. Calculate average temperature and max pressure metrics using `useMemo` to prevent UI stutter when toggling dark mode.

**Requirements:**
1. Receive `sensorData` array (20,000 items).
2. Calculate average temperature and peak pressure metrics inside `useMemo`.
3. Include `sensorData` in dependency array.
4. Skip calculations when unrelated `theme` state updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useMemo } from 'react';
> 
> export function TelemetryAggregator({ sensorData }) {
>   const [theme, setTheme] = useState('dark');
> 
>   const metrics = useMemo(() => {
>     console.log('Calculating heavy telemetry metrics...');
>     if (!sensorData.length) return { avgTemp: 0, maxPressure: 0 };
> 
>     let totalTemp = 0;
>     let maxP = 0;
> 
>     for (let i = 0; i < sensorData.length; i++) {
>       totalTemp += sensorData[i].temp;
>       if (sensorData[i].pressure > maxP) maxP = sensorData[i].pressure;
>     }
> 
>     return {
>       avgTemp: (totalTemp / sensorData.length).toFixed(2),
>       maxPressure: maxP
>     };
>   }, [sensorData]);
> 
>   return (
>     <div style={{ background: theme === 'dark' ? '#222' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }}>
>       <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>Toggle Theme</button>
>       <h4>Avg Temp: {metrics.avgTemp}°C | Peak Pressure: {metrics.maxPressure} PSI</h4>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Heavy Computational Shield**: Looping 20,000 items is cached inside `useMemo`.
> 2. **Dependency Precision**: `[sensorData]` ensures re-calculation occurs only on fresh telemetry feeds.
> 3. **UI Responsiveness**: Toggling `theme` state skips the loop, rendering instantly.
> 4. **Memory Tradeoff**: Caches output object reference safely.
> 
### Exercise 2: Financial Portfolio Risk Matrix Calculator

**Scenario:** A stock trading application computes risk portfolio covariance matrices for 500 equities. Memoize matrix math to keep search inputs responsive.

**Requirements:**
1. Compute matrix variance metrics using `useMemo`.
2. Re-compute matrix math when `portfolioItems` updates.
3. Keep search filter inputs smooth.
4. Render calculated risk scores.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useMemo } from 'react';
> 
> export function PortfolioRiskAnalyzer({ portfolioItems }) {
>   const [filter, setFilter] = useState('');
> 
>   const riskScore = useMemo(() => {
>     console.log('Running covariance risk matrix calculation...');
>     return portfolioItems.reduce((acc, item) => {
>       return acc + (item.volatility * item.allocation);
>     }, 0).toFixed(4);
>   }, [portfolioItems]);
> 
>   const filteredItems = useMemo(() => {
>     return portfolioItems.filter(item => item.symbol.toLowerCase().includes(filter.toLowerCase()));
>   }, [portfolioItems, filter]);
> 
>   return (
>     <div>
>       <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter equities..." />
>       <h4>Portfolio Risk Score: {riskScore}</h4>
>       <p>Filtered Equities Count: {filteredItems.length}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Isolated Computations**: `riskScore` matrix math is isolated from `filter` input changes.
> 2. **Targeted Caching**: Typing in search inputs re-computes `filteredItems` without re-running `riskScore`.
> 3. **Execution Savings**: Saves CPU iterations on every keypress.
> 4. **Pure Value Returns**: Both memoized calculations remain pure functions.
> 
### Exercise 3: E-Commerce Product Catalog Filter Engine

**Scenario:** An e-commerce site filters 10,000 product items by price range and category tags. Memoize filtered products using `useMemo`.

**Requirements:**
1. Filter product list using `useMemo`.
2. Watch `products`, `selectedCategory`, and `maxPrice`.
3. Skip computations when user toggles cart drawer UI.
4. Render filtered item counts.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useMemo } from 'react';
> 
> export function CatalogFilterEngine({ products }) {
>   const [category, setCategory] = useState('All');
>   const [maxPrice, setMaxPrice] = useState(1000);
>   const [isCartOpen, setIsCartOpen] = useState(false);
> 
>   const filteredCatalog = useMemo(() => {
>     console.log('Filtering catalog items...');
>     return products.filter(p => {
>       const matchCat = category === 'All' || p.category === category;
>       const matchPrice = p.price <= maxPrice;
>       return matchCat && matchPrice;
>     });
>   }, [products, category, maxPrice]);
> 
>   return (
>     <div>
>       <button onClick={() => setIsCartOpen(prev => !prev)}>Cart Drawer ({isCartOpen ? 'Open' : 'Closed'})</button>
>       <select value={category} onChange={e => setCategory(e.target.value)}>
>         <option value="All">All Categories</option>
>         <option value="Electronics">Electronics</option>
>       </select>
>       <input type="range" min="10" max="1000" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} />
>       <h4>Matching Products: {filteredCatalog.length}</h4>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Selective Triggering**: Toggling `isCartOpen` state does not trigger catalog filtering.
> 2. **Multi-Input Watch**: Dependency array `[products, category, maxPrice]` handles all filter inputs.
> 3. **Render Optimization**: Preserves frame rates during UI drawer state changes.
> 4. **Functional Correctness**: Computes derived catalog lists cleanly.
> 
---

## 6. Related Terms

- [`useMemo` Hook](use_memo.md) — The value memoization hook.
- [`useCallback` Hook](use_callback.md) — The function reference memoization hook.
- [React.memo](../level_08/react_memo.md) — Component render caching optimization.
- [Referential Equality](referential_equality.md) — Reference memory address comparison driving memoization decisions.

---

## 7. Key Takeaways

- Memoization caches computed function outputs to avoid redundant execution.
- React provides `useMemo` for values, `useCallback` for function references, and `React.memo` for components.
- Memoization has memory and CPU overhead (checking dependency arrays on every render).
- Do not memoize cheap, fast operations; apply it to heavy computations or referential stability.
- React 19 introduces the **React Compiler**, which automates memoization at compile time without manual hooks.
```

---

## File 4: `knowledge-base/06-react/terms/level_04/referential_equality.md`

```markdown
