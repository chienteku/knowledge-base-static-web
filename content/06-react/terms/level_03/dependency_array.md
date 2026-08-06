# Dependency Array

> **Level 3 — Component Lifecycle & Effects**
> The second argument passed to `useEffect`, `useCallback`, or `useMemo` that serves as a watchlist controlling when the hook re-executes.

---

## 1. Prerequisites

- [`useEffect` Hook](use_effect.md) — The hook whose execution schedule is controlled by the dependency array.
- [Component Lifecycle](component_lifecycle.md) — Understanding how updates and re-renders trigger dependency checks.

---

## 2. Term Category

**Rendering Mechanic (memoization & execution engine)**: The dependency array is a core configuration mechanism in React's hook engine. When a component re-renders, React inspects the elements in the dependency array using shallow equality comparison (`Object.is`). If every element in the array is identical to its previous render value, React skips running the effect callback or returning a newly recalculated memoized value.

Architecturally, the dependency array bridges React's declarative render cycle with imperative side effects and optimizations, enforcing predictable synchronization between reactive component variables and external systems.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Without a dependency array, an effect inside a component would execute after **every single render**. If an effect fetches data and updates state, that state update triggers a re-render, which fires the effect again—resulting in an infinite rendering loop.

React needed a way for developers to specify exact triggers:
- *"Run this API fetch ONLY when the `userId` prop changes."*
- *"Run this setup code ONLY ONCE when the component first mounts."*

By providing an array of dependencies, developers tell React which reactive values the effect depends on. React watches those values between renders, skipping execution when dependencies remain unchanged.

#### Three Array Configurations

1. **Omitted Array (`useEffect(fn)`):** Runs after initial mount AND after EVERY re-render. Prone to infinite loops if state setters are called inside.
2. **Empty Array `[]` (`useEffect(fn, [])`):** Runs ONLY ONCE after initial mount. Never re-runs during updates.
3. **Populated Array `[a, b]` (`useEffect(fn, [a, b])`):** Runs after initial mount AND whenever `a` or `b` changes reference between renders.

### (2) Reality Metaphor

Imagine a smart home security camera system.

- **No Dependency Array (Continuous Trigger):** The camera sends an alert to your phone every millisecond continuously, regardless of whether anything moves. Your phone memory fills up instantly (**infinite re-renders**).
- **Empty Array `[]` (Power-on Trigger):** The camera sends one alert when installed, then turns off permanently. It ignores motion for the rest of its lifespan (**mount-only execution**).
- **Populated Array `[motionSensor, doorSensor]` (Smart Watchlist):** The camera monitors two sensors. If motion is detected or the door opens, it records a video clip. If neither sensor changes, it stays quiet (**selective execution**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState, useEffect } from 'react';

function CounterWatcher({ count }) {
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]); // Re-runs strictly when `count` updates

  return <div>Current Count: {count}</div>;
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect, useMemo } from 'react';

function ProductCatalog({ category, searchFilter }) {
  const [products, setProducts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Effect 1: Runs when `category` changes
  useEffect(() => {
    let isCurrent = true;
    fetch(`/api/products?category=${category}`)
      .then(res => res.json())
      .then(data => {
        if (isCurrent) {
          setProducts(data);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      });
    return () => { isCurrent = false; };
  }, [category]); // Category watcher

  // Memoized Filter: Recalculates when `products` or `searchFilter` changes
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchFilter.toLowerCase()));
  }, [products, searchFilter]); // Watchlist for heavy calculations

  return (
    <div>
      <h3>Category: {category}</h3>
      <small>Last Refreshed: {lastUpdated}</small>
      <ul>
        {filteredProducts.map(p => <li key={p.id}>{p.name}</li>)}
      </ul>
    </div>
  );
}

export default ProductCatalog;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting Reactive Dependencies (Lying to the Dependency Array)

**The mistake:** Reading state or prop variables inside an effect callback while passing an empty array `[]` to force "run once" behavior.

**Why it's wrong:** Omitting reactive values creates **stale closure bugs**. The effect captures initial state snapshots forever, ignoring subsequent updates.

*Incorrect:*
```jsx
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1); // ❌ count is trapped at 0!
  }, 1000);
  return () => clearInterval(id);
}, []); // Lying to dependency array!
```

*Fix:*
```jsx
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => {
    setCount(prev => prev + 1); // ✅ Functional state updater avoids dependency
  }, 1000);
  return () => clearInterval(id);
}, []);
```

### Mistake 2: Passing Un-memoized Objects or Arrays into Dependencies

**The mistake:** Passing object or array literals declared directly inside component render bodies into dependency arrays.

**Why it's wrong:** React compares dependencies using `Object.is` (reference equality). Objects declared in component render bodies receive new memory addresses on every render frame, causing the effect to re-run infinitely.

*Incorrect:*
```jsx
function UserCard() {
  const options = { theme: 'dark' }; // ❌ New reference every render!
  useEffect(() => {
    applyTheme(options);
  }, [options]); // Infinite effect trigger loop!
}
```

*Fix:*
```jsx
function UserCard() {
  // Option A: Move static objects outside component
  // Option B: Destructure primitive values
  const theme = 'dark';
  useEffect(() => {
    applyTheme({ theme });
  }, [theme]); // ✅ Primitive string dependency
}
```

### Mistake 3: Modifying State Tracked by the Dependency Array Without Safeguards

**The mistake:** Calling `setItems([...items, newItem])` inside an effect that includes `[items]` in its dependency array.

**Why it's wrong:** Updating `items` triggers a re-render. The re-render sees that `items` changed reference, re-triggering the effect, causing an infinite loop.

*Incorrect:*
```jsx
useEffect(() => {
  setItems(prev => [...prev, 'auto-generated']); // ❌ Triggers infinite effect loop!
}, [items]);
```

*Fix:*
```jsx
// Trigger state updates in response to explicit user actions or event handlers
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Threshold Alert Watcher

**Scenario:** An industrial IoT console monitors reactor temperature metrics. You must configure an effect to send an alert when `temperature` exceeds `maxThreshold`, without triggering alerts when unrelated UI state updates.

**Requirements:**
1. Monitor `temperature` and `maxThreshold` props.
2. Trigger `sendAlert()` when `temperature > maxThreshold`.
3. Include only reactive values in the dependency array.
4. Prevent duplicate alerts when `theme` state updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect } from 'react';
> 
> export function TemperatureAlert({ temperature, maxThreshold, onAlert }) {
>   useEffect(() => {
>     if (temperature > maxThreshold) {
>       onAlert(`WARNING: Temperature ${temperature}°C exceeds limit ${maxThreshold}°C`);
>     }
>   }, [temperature, maxThreshold, onAlert]);
> 
>   return (
>     <div>
>       <span>Current: {temperature}°C</span> | <span>Limit: {maxThreshold}°C</span>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Targeted Watchlist**: `[temperature, maxThreshold, onAlert]` ensures the effect fires strictly when metrics change.
> 2. **Unrelated Render Isolation**: Toggling dark mode or search inputs does not re-run alert checks.
> 3. **Render Safety**: Conditionals remain inside the effect callback.
> 4. **ESLint Compliance**: All referenced reactive variables are explicitly specified.
> 
### Exercise 2: Financial Stock Portfolio Refresh

**Scenario:** A stock portfolio updates market valuations when `selectedPortfolioId` changes or when the user clicks "Manual Refresh" (`refreshKey`). Ensure effect dependencies trigger data fetches for both cases.

**Requirements:**
1. Fetch portfolio metrics when `selectedPortfolioId` or `refreshKey` changes.
2. Clean up pending fetches on dependency changes using `AbortController`.
3. Exclude non-reactive static configurations from dependencies.
4. Render current portfolio balances.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function PortfolioViewer({ selectedPortfolioId, refreshKey }) {
>   const [portfolio, setPortfolio] = useState(null);
> 
>   useEffect(() => {
>     const controller = new AbortController();
> 
>     async function loadPortfolio() {
>       try {
>         const res = await fetch(`/api/portfolios/${selectedPortfolioId}`, { signal: controller.signal });
>         const data = await res.json();
>         setPortfolio(data);
>       } catch (err) {
>         if (err.name !== 'AbortError') console.error(err);
>       }
>     }
> 
>     loadPortfolio();
> 
>     return () => controller.abort();
>   }, [selectedPortfolioId, refreshKey]);
> 
>   return (
>     <div>
>       <h4>Portfolio: {selectedPortfolioId}</h4>
>       <p>Balance: ${portfolio ? portfolio.balance : 'Loading...'}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Multi-Dependency Watch**: `[selectedPortfolioId, refreshKey]` handles both dropdown shifts and manual button clicks.
> 2. **Teardown Binding**: Changing dependencies triggers `controller.abort()` before running the next fetch.
> 3. **Closure Freshness**: Captures current `selectedPortfolioId` on every execution.
> 4. **Predictable Lifecycle**: Ensures backend data stays synchronized with UI selections.
> 
### Exercise 3: E-Commerce Shopping Cart Price Recalculator

**Scenario:** An e-commerce checkout page recalculates order subtotal using `useMemo`. Ensure the dependency array includes cart items and discount codes without recalculating on unrelated page scroll events.

**Requirements:**
1. Recalculate subtotal using `useMemo`.
2. Include `cartItems` and `discountPercent` in dependencies.
3. Compute total accurately.
4. Skip re-computations when user scroll state shifts.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useMemo } from 'react';
> 
> export function OrderSummary({ cartItems, discountPercent }) {
>   const subtotal = useMemo(() => {
>     return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
>   }, [cartItems]);
> 
>   const finalTotal = useMemo(() => {
>     return subtotal * (1 - discountPercent / 100);
>   }, [subtotal, discountPercent]);
> 
>   return (
>     <div>
>       <p>Subtotal: ${subtotal.toFixed(2)}</p>
>       <p>Discount: {discountPercent}%</p>
>       <h4>Total: ${finalTotal.toFixed(2)}</h4>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Chained Dependency Array**: `finalTotal` depends cleanly on `subtotal` and `discountPercent`.
> 2. **Performance Caching**: Array reduction math runs only when `cartItems` array updates.
> 3. **Shallow Equality**: React skips recalculation if references are identical.
> 4. **Pure Derived State**: Avoids redundant state setters by deriving values during render.
> 
---

## 6. Related Terms

- [`useEffect` Hook](use_effect.md) — The hook whose timing is controlled by dependency arrays.
- [Stale Closures](stale_closures.md) — Bugs caused by omitting referenced values from dependency arrays.
- [Immutability](../level_02/immutability.md) — The requirement for array objects to change references on updates.
- [`useCallback` Hook](../level_04/use_callback.md) — Performance hook using dependency arrays to cache functions.

---

## 7. Key Takeaways

- The dependency array controls when `useEffect`, `useCallback`, and `useMemo` execute.
- React compares dependencies using shallow equality (`Object.is`).
- **No Array:** Runs on mount and after every re-render.
- **Empty Array `[]`:** Runs once on mount.
- **Populated Array `[a, b]`:** Runs on mount and when `a` or `b` references change.
- Always include all reactive variables used inside the effect callback.
```
