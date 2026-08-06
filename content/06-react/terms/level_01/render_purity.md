# Render Purity

> **Level 1 — Core Concepts**
> The rule that a component's render function must act as a pure function of its props and state, returning identical JSX without mutating external variables or causing side effects during execution.

---

## 1. Prerequisites

- [Components](components.md) — The functional units that must remain pure during render.
- [Props (Properties)](props.md) — The read-only input parameters passed to components.

---

## 2. Term Category

**Rendering Mechanic (functional contract)**: Render Purity is a core contract enforced by React's rendering pipeline. Borrowed from functional programming, a pure function is one that:
1. Returns the exact same output given the exact same input parameters.
2. Causes zero side effects (it does not modify variables, objects, or systems outside its local function scope).

In React, component render execution must remain strictly pure. Given identical props and state snapshot values, a component function must evaluate to identical JSX output without mutating outer-scope objects or executing side effects.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
To optimize rendering performance, React relies on key assumptions about component execution. React's Fiber engine may execute components in parallel, pre-render components in background threads, or discard incomplete renders mid-execution to respond to user interactions.

If a component performs a side effect during render (such as mutating a global variable, issuing an HTTP `fetch` request, writing to local storage, or calling `Math.random()`), it is **impure**.

Impure components cause severe bugs under modern React engines:
- **Visual Glitches:** Rendered values desynchronize across re-render cycles.
- **Memory Leaks:** Impure event listeners or subscriptions duplicate repeatedly.
- **Concurrent Failures:** Incomplete or discarded renders leave global application state corrupted.

React enforces **Render Purity** so component rendering remains predictable, testable, and compatible with Fiber, Concurrent Mode, and Strict Mode double-rendering.

### (2) Reality Metaphor
Imagine baking a cake using a printed recipe card.

- **Impure Recipe (Modifying the Kitchen Wall):** The recipe reads: *"To bake this cake, check the number written on the kitchen wall, add 1 to it, write the new number back on the wall, and add that many cups of sugar."* If two bakers attempt to bake cakes simultaneously using this recipe, they continuously overwrite each other's numbers on the wall, ruining both cakes (**corrupting state**).
- **Pure Recipe (Self-Contained Function):** The recipe reads: *"Combine 2 cups of flour, 3 eggs, and 1 cup of sugar to yield a cake."* The recipe depends solely on specified input ingredients and alters nothing outside the mixing bowl. Ten bakers can follow this recipe simultaneously in separate kitchens; every cake will turn out identical (**pure rendering**).

### (3) React Code Examples

#### Short Snippet
```jsx
// GOOD: Pure component deriving output strictly from props
function TemperatureBadge({ celsius }) {
  const fahrenheit = (celsius * 9/5) + 32;
  return <span className="badge">{celsius}°C ({fahrenheit.toFixed(1)}°F)</span>;
}
```

#### Fuller Example
```jsx
import React, { useState } from 'react';

// BAD (Impure): Mutates outer variable during render!
let globalGuestCounter = 0;
function ImpureCup() {
  globalGuestCounter += 1; // ❌ Side effect in render body!
  return <div>Cup for guest #{globalGuestCounter}</div>;
}

// GOOD (Pure): Receives guest number as a prop
function PureCup({ guestNumber }) {
  return <div>Cup for guest #{guestNumber}</div>;
}

export default function GuestTable() {
  return (
    <div className="table-card">
      <h3>Impure vs Pure Rendering</h3>
      
      {/* Pure components evaluate predictably regardless of re-render frequency */}
      <PureCup guestNumber={1} />
      <PureCup guestNumber={2} />
      <PureCup guestNumber={3} />
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating Existing Props, State, or Array Inputs in Place

**The mistake:** Calling `.sort()` or `.push()` directly on an array passed as a prop during render.

**Why it's wrong:** Array methods like `.sort()`, `.push()`, and `.splice()` mutate the original array object in-place. Because `items` is an object reference passed from a parent component, mutating it alters parent state during render, violating purity and breaking memoization.

*Incorrect:*
```jsx
function SortedList({ items }) {
  // ❌ Impure! .sort() mutates the array prop in-place!
  const sorted = items.sort(); 
  return <ul>{sorted.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}
```

**Why it's wrong:** Array methods like `.sort()`, `.push()`, and `.splice()` mutate the original array object in-place. Because `items` is an object reference passed from a parent component, mutating it alters parent state during render, violating purity and breaking memoization.

*Fix:* Shallow-copy the array using spread syntax `[...items]` before performing mutations:
```jsx
function SortedList({ items }) {
  // ✅ Pure: Creates a new array copy before sorting
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  return <ul>{sorted.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}
```

### Mistake 2: Generating Non-Deterministic Values (`Math.random()`, `Date.now()`) During Render

**The mistake:** Generating element keys or form element IDs using `id={`field-${Math.random()}`}` inside a render function.

**Why it's wrong:** Pure functions must return identical outputs for identical inputs. Calling `Math.random()` or `new Date()` inside render generates different values on every render cycle, breaking Server-Side Rendering (SSR) hydration matching and causing unnecessary DOM rebuilds.

*Incorrect:*
```jsx
function FormField({ label }) {
  // ❌ Impure! Different ID generated on every single render cycle.
  const id = `input-${Math.random()}`;
  return <div><label htmlFor={id}>{label}</label><input id={id} /></div>;
}
```

*Fix:*
```jsx
import { useId } from 'react';

function FormField({ label }) {
  // ✅ Pure: React's useId hook generates deterministic identifiers
  const id = useId();
  return <div><label htmlFor={id}>{label}</label><input id={id} /></div>;
}
```

### Mistake 3: Executing Network Requests or State Updates Directly in Render

**The mistake:** Calling `fetch()` or state setters (`setCount(...)`) unconditionally inside the main body of a component function.

**Why it's wrong:** Render functions evaluate whenever props or state change. Initiating side effects directly in render causes infinite re-render loops or duplicate network traffic. Side effects belong inside event handlers (`onClick`) or `useEffect`.

*Incorrect:*
```jsx
function UserProfile({ userId }) {
  const [data, setData] = useState(null);
  // ❌ Side-effect directly in render body causes infinite re-render loop!
  fetch(`/api/user/${userId}`).then(res => res.json()).then(d => setData(d));
  return <div>{data?.name}</div>;
}
```

*Fix:*
```jsx
function UserProfile({ userId }) {
  const [data, setData] = useState(null);
  // ✅ Encapsulate side effects in useEffect
  useEffect(() => {
    fetch(`/api/user/${userId}`).then(res => res.json()).then(d => setData(d));
  }, [userId]);
  return <div>{data?.name}</div>;
}
```

---

## 5. Practice Exercises

### Exercise 1: Telemetry Data Smoother (IoT Telemetry)

**Scenario:** An IoT sensor dashboard receives raw noise readings. The `SmoothTelemetry` component must compute a moving average without mutating the incoming historical reading array prop.

**Requirements:**
1. Create `SmoothTelemetry` accepting a `readings` array prop (numbers).
2. Compute the average of the last 5 readings.
3. Use non-mutating array operations (`slice`, `reduce`).
4. Ensure the original `readings` array remains completely unchanged.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function SmoothTelemetry({ readings = [] }) {
>   // Pure derivation: slice returns a new array copy without mutating readings
>   const recentReadings = readings.slice(-5);
>   const average = recentReadings.length > 0
>     ? recentReadings.reduce((sum, r) => sum + r, 0) / recentReadings.length
>     : 0;
> 
>   return (
>     <div className="telemetry-card">
>       <h4>5-Point Moving Average</h4>
>       <div className="metric-display">{average.toFixed(2)} units</div>
>       <small>Total Raw Samples: {readings.length}</small>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Non-Mutating Slicing**: `.slice(-5)` creates a shallow copy of array slices without altering the input `readings` prop array.
> 2. **Pure Reduction**: `.reduce()` calculates sums over local variables without mutating outer-scope data.
> 3. **Deterministic Output**: Given the same `readings` array input, the component returns identical JSX markup every time.
> 4. **Zero Side Effects**: Contains no global mutations, timers, or network calls inside the render pass.
> 
---

### Exercise 2: Financial Order Book Sorting (Financial Trading)

**Scenario:** A trading application receives an array of market orders. Create a `SortedOrderBook` component that sorts orders by price (descending for bids) without mutating parent data.

**Requirements:**
1. Create `SortedOrderBook` taking an `orders` prop array (`id`, `price`, `volume`, `type`).
2. Shallow-copy `orders` before calling `.sort()`.
3. Filter bids vs asks cleanly during render.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function SortedOrderBook({ orders = [] }) {
>   // Pure copy before sorting prevents mutating parent orders state array
>   const sortedBids = [...orders]
>     .filter(o => o.type === 'BID')
>     .sort((a, b) => b.price - a.price);
> 
>   return (
>     <div className="order-book-list">
>       <h4>Top Bids</h4>
>       <ul>
>         {sortedBids.map(bid => (
>           <li key={bid.id}>
>             ${bid.price.toFixed(2)} — {bid.volume} units
>           </li>
>         ))}
>       </ul>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Array Spread Copying**: `[...orders]` creates a fresh array container, allowing `.sort()` to execute purely.
> 2. **Chained Pure Methods**: `.filter()` returns a new array, keeping operations isolated within render scope.
> 3. **State Integrity**: Protects parent state arrays from unintended sorting mutations across render updates.
> 4. **Strict Mode Safety**: Functions predictably when React Strict Mode executes renders twice in development.
> 
---

### Exercise 3: E-Commerce Price Currency Converter (E-Commerce)

**Scenario:** An international store component converts product catalog prices dynamically based on currency exchange rates without modifying product object props.

**Requirements:**
1. Create `ConvertedPrice` taking `product` object (`id`, `priceUSD`) and `exchangeRate` (number).
2. Calculate target currency value purely during render.
3. Avoid mutating `product.priceUSD` or attaching calculated properties to `product`.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function ConvertedPrice({ product, exchangeRate, currencySymbol = '€' }) {
>   // Pure local calculation without mutating product object properties
>   const convertedAmount = (product.priceUSD * exchangeRate).toFixed(2);
> 
>   return (
>     <span className="price-tag">
>       {currencySymbol}{convertedAmount}
>     </span>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Read-Only Props**: Treats `product` as an immutable object snapshot; reads `priceUSD` without property mutation.
> 2. **Local Variable Derivation**: `convertedAmount` computes on-the-fly without requiring local state or effects.
> 3. **Referential Stability**: Avoids altering underlying object memory references shared across components.
> 4. **Testability**: Pure component logic allows effortless unit testing with static prop inputs.
> 
---

## 6. Related Terms

- [Components](components.md) — The functional units required to comply with render purity contracts.
- [Props (Properties)](props.md) — Read-only input parameters passed into pure component functions.
- [Side Effects](../level_03/side_effects.md) — Operations (fetching, subscriptions) that must be isolated from render execution.
- [`useEffect` Hook](../level_03/use_effect.md) — React hook used to execute side effects safely outside render passes.
- [Strict Mode](../level_08/strict_mode.md) — Development tool that double-invokes renders to catch purity violations.

---

## 7. Key Takeaways

- Render Purity mandates that components act as pure functions of props and state.
- Given identical inputs, a component must always return identical JSX markup.
- Render functions must NEVER modify global variables, outer-scope objects, or incoming props.
- Never call mutating array methods (`.sort()`, `.push()`) directly on props; shallow-copy first (`[...items]`).
- Keep side effects (API calls, DOM updates, timers) out of render bodies; place them in event handlers or `useEffect`.
