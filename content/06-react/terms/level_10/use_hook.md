# Suspense for Data Fetching & the `use()` Hook

> **Level 10 — Modern React & Architectures**
> React 19's built-in API that dynamically resolves promises and reads context objects conditionally during render.

---

## 1. Prerequisites

- [The Context API](../level_06/context_api.md) — The global data provider that `use()` can consume conditionally.
- [Suspense](../level_08/suspense.md) — The component boundary system that catches pending promises unwrapped by `use()`.

---

## 2. Term Category

**Core Hook (asynchronous resource reader)**: The `use()` hook (or `use` API) is a React 19 primitive designed to read resources—specifically Promises and Context objects—directly during component rendering. Unlike all traditional React hooks (such as `useState` or `useEffect`), **`use()` can be invoked conditionally inside `if` statements and loops**.

When passed a Promise (`use(promise)`), React suspends rendering if the promise is pending, yielding execution control to the nearest parent `<Suspense>` boundary until the promise resolves. When passed a Context (`use(ThemeContext)`), it reads the current context value like `useContext`, but enables conditional consumption based on runtime logic.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Since the introduction of React Hooks in v16.8, built-in hooks have adhered to strict **Rules of Hooks**: they must be declared unconditionally at the top level of component function bodies. They cannot be called inside `if` blocks, `for` loops, or nested functions.

While this constraint simplifies React's internal fiber call-stack tracking, it creates architectural friction for conditional resource reading:
1. **Conditional Context Reading:** If a component only needs to read a `ThemeContext` or `UserContext` when a specific feature flag or prop is active, developers were forced to split logic into separate subcomponents to avoid violating hook rules.
2. **Data Promise Resolution:** Handling asynchronous data fetching in client components previously required manual `useEffect` + `useState` boilerplate or complex custom data fetching libraries.

React 19 introduced `use()` to address both pain points:
- **Rule Exception:** `use()` is uniquely designed to be called inside conditional statements and loops.
- **Native Suspense Data Fetching:** Server Components can pass data promises down to Client Components, where `use(promise)` unwraps the resolved data directly within the render pipeline, delegating loading states to `<Suspense>` boundaries.

### (2) Reality Metaphor

Imagine picking up a package at a local post office.

- **`useContext` (Mandatory Home Mailbox):** You are required to install a fixed mailbox at your front gate (**top-level hook declaration**). Even if you have no mail coming today, you must walk to the gate and check the box on every single render pass. You cannot choose to install a mailbox only when it rains.
- **The `use()` Hook (P.O. Box Counter Desk):** You walk up to the clerk's desk. If you hold a package notification slip (**conditional check `if (hasPackage)`**), you hand it to the clerk, who goes to the back room to retrieve your parcel (**unwrapping the promise**). If you hold no slip, you skip the counter entirely. Package retrieval happens strictly on demand.

### (3) React Code Examples

#### Short Snippet

```jsx
// ConditionalContextReader.jsx (React 19 use() Hook)
import { use } from 'react';
import { ThemeContext } from './ThemeContext';

export function Header({ isThemed }) {
  // Option: Call use() conditionally inside an if statement!
  if (isThemed) {
    const theme = use(ThemeContext);
    return <header style={{ background: theme.bg, color: theme.fg }}>Themed Header</header>;
  }

  return <header className="default-header">Standard Plain Header</header>;
}
```

#### Fuller Example

```jsx
// ProductCatalog.jsx
import { use, Suspense } from 'react';

// Client Component unwrapping promise passed from parent
function ProductGrid({ productsPromise }) {
  // use() unwraps promise; suspends component until promise resolves!
  const products = use(productsPromise);

  return (
    <ul className="product-grid">
      {products.map(product => (
        <li key={product.id} className="product-card">
          <h4>{product.name}</h4>
          <p>${product.price.toFixed(2)}</p>
        </li>
      ))}
    </ul>
  );
}

// Parent Component
export function ProductCatalog({ fetchPromise }) {
  return (
    <section className="catalog-section">
      <h2>Featured Inventory</h2>
      
      {/* Suspense fallback displays while use(fetchPromise) is pending */}
      <Suspense fallback={<div className="spinner">Fetching store inventory...</div>}>
        <ProductGrid productsPromise={fetchPromise} />
      </Suspense>
    </section>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating new Promise instances directly inside component render functions and passing them to `use()`

**The mistake:** Instantiating a `fetch()` request or `new Promise()` inside the body of a component calling `use()`.

**Why it's wrong:** Every render pass executes the component function body, creating a brand new Promise reference. When `use()` receives a new promise reference, React suspends rendering and schedules a re-render. Upon re-rendering, a *new* promise is instantiated again, causing an infinite rendering and network loop.

*Incorrect:*
```jsx
function BadComponent() {
  // ❌ Triggers infinite rendering loop! New promise created on every render!
  const data = use(fetch('/api/data').then(res => res.json()));
  return <div>{data.title}</div>;
}
```

*Fix:*
```jsx
// Promise created outside component scope or passed as a prop from Server Component
const dataPromise = fetch('/api/data').then(res => res.json());

function GoodComponent() {
  const data = use(dataPromise); // Stable promise reference
  return <div>{data.title}</div>;
}
```

### Mistake 2: Confusing `use()` with standard hooks and avoiding conditional statements

**The mistake:** Refactoring conditional `if` checks into multiple subcomponents under the false assumption that `use(Context)` violates the Rules of Hooks.

**Why it's wrong:** Unlike traditional hooks (`useState`, `useEffect`), React explicitly designed `use()` to be called inside conditional statements and loops.

*Incorrect:*
```jsx
// Unnecessary component splitting out of fear of calling use() inside if blocks
```

*Fix:*
```jsx
function SmartHeader({ showDetails }) {
  if (showDetails) {
    const details = use(DetailsContext); // Completely valid in React 19!
    return <div>{details.info}</div>;
  }
  return <div>Summary</div>;
}
```

### Mistake 3: Omitting `<Suspense>` boundaries when passing Promises to `use()`

**The mistake:** Calling `use(promise)` inside a component tree without wrapping the component in a parent `<Suspense>` boundary.

**Why it's wrong:** When `use(promise)` encounters a pending promise, it throws a promise signal up the component tree to be caught by a `<Suspense>` boundary. Without a parent `<Suspense>` wrapper, the unhandled promise causes an uncaught rendering error.

*Incorrect:*
```jsx
// ❌ Error: Unhandled suspended render! Missing Suspense boundary!
function Page({ dataPromise }) {
  return <DataList promise={dataPromise} />;
}
```

*Fix:*
```jsx
function Page({ dataPromise }) {
  return (
    <Suspense fallback={<p>Loading data...</p>}>
      <DataList promise={dataPromise} />
    </Suspense>
  );
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Plant Telemetry Conditional Sensor Reader

**Scenario:** Build an industrial IoT telemetry viewer where a component conditionally reads `SensorContext` only when sensor telemetry monitoring is enabled, unwrapping an async telemetry promise passed as a prop when active.

**Requirements:**
1. Read `TelemetryContext` conditionally using `use()` inside an `if` statement.
2. Unwrap `sensorPromise` using `use(sensorPromise)`.
3. Wrap component in `<Suspense>` fallback wrapper.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
> 
> import { use, Suspense, createContext } from 'react';
>
> export const TelemetryContext = createContext({ unit: 'Celsius' });
>
> function SensorReadout({ sensorPromise, isEnabled }) {
>   // 1. Conditional context consumption using use()
>   if (!isEnabled) {
>     return <p>Telemetry Monitoring Disabled.</p>;
>   }
> 
>   const { unit } = use(TelemetryContext);
>   // 2. Unwrap data promise using use()
>   const sensorData = use(sensorPromise);
> 
>   return (
>     <div className="readout-card">
>       <h4>Sensor: {sensorData.name}</h4>
>       <p>Reading: {sensorData.value} °{unit}</p>
>     </div>
>   );
> }
>
> export default function TelemetryWidget({ sensorPromise }) {
>   return (
>     <TelemetryContext.Provider value={{ unit: 'Celsius' }}>
>       <Suspense fallback={<div className="skeleton">Connecting to sensor...</div>}>
>         <SensorReadout sensorPromise={sensorPromise} isEnabled={true} />
>       </Suspense>
>     </TelemetryContext.Provider>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Conditional Hook Reading**: `use(TelemetryContext)` is executed conditionally inside `if (isEnabled)` without violating Rules of Hooks.
> 2. **Promise Resolution**: `use(sensorPromise)` unwraps the pending promise, suspending component render until data resolves.
> 3. **Suspense Catching**: Parent `<Suspense>` catches the suspended promise and renders fallback markup.
> 4. **Clean Component Architecture**: Eliminates `useEffect` data fetching boilerplate.
> 
### Exercise 2: Financial Live Order Book Promise Resolver

**Scenario:** Develop a Financial Trading Order Book component where market depth promises are passed down from a parent Server Component and unwrapped on demand using `use(orderBookPromise)`.

**Requirements:**
1. Implement `OrderBookGrid` component receiving `orderBookPromise`.
2. Unwrap promise using `use()`.
3. Render bid and ask list rows.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { use, Suspense } from 'react';
>
> function OrderBookGrid({ orderBookPromise }) {
>   const book = use(orderBookPromise);
> 
>   return (
>     <div className="book-grid">
>       <div className="bids">
>         <h5>Bids</h5>
>         {book.bids.map((bid, i) => (
>           <div key={i} className="row">${bid.price} ({bid.qty})</div>
>         ))}
>       </div>
>       <div className="asks">
>         <h5>Asks</h5>
>         {book.asks.map((ask, i) => (
>           <div key={i} className="row">${ask.price} ({ask.qty})</div>
>         ))}
>       </div>
>     </div>
>   );
> }
>
> export function TradingTerminal({ orderBookPromise }) {
>   return (
>     <div className="terminal-card">
>       <h3>Order Book Depth</h3>
>       <Suspense fallback={<div className="skeleton-grid">Loading depth...</div>}>
>         <OrderBookGrid orderBookPromise={orderBookPromise} />
>       </Suspense>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Direct Promise Unwrapping**: `OrderBookGrid` consumes `orderBookPromise` directly inside render via `use()`.
> 2. **Declarative Loading**: Component delegates loading UI rendering to parent `<Suspense fallback={...}>`.
> 3. **Zero State Boilerplate**: Eliminates local `useState(loading)` and `useState(data)` state variables.
> 4. **Render Integration**: React integrates promise resolution directly into component reconciliation.
> 
### Exercise 3: E-Commerce Dynamic Cart Region Context Reader

**Scenario:** Create an e-commerce shipping calculator component that conditionally reads a `RegionContext` only when international shipping is selected.

**Requirements:**
1. Check `isInternational` boolean prop inside `ShippingCalculator`.
2. Conditionally read `RegionContext` using `use()`.
3. Render calculated shipping estimate.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { use, createContext } from 'react';
>
> export const RegionContext = createContext({ currency: 'USD', taxRate: 0.08 });
>
> export function ShippingCalculator({ isInternational }) {
>   if (!isInternational) {
>     return <div className="shipping">Domestic Shipping: Flat $5.00</div>;
>   }
> 
>   // Conditionally read RegionContext using use()
>   const { currency, taxRate } = use(RegionContext);
>   const baseFee = 25.00;
>   const totalFee = (baseFee * (1 + taxRate)).toFixed(2);
> 
>   return (
>     <div className="shipping intl">
>       <p>International Duty & Shipping Fee: {totalFee} {currency}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Conditional Context Access**: `use(RegionContext)` is invoked inside conditional logic without breaking React hook invariants.
> 2. **Performance Efficiency**: Prevents context dependency subscriptions when domestic shipping is active.
> 3. **Clean Code Structure**: Avoids splitting code into secondary subcomponents just to read context values.
> 4. **Declarative Computation**: Computes total fee using unwrapped context properties cleanly during render.
> 
---

## 6. Related Terms

- [The Context API](../level_06/context_api.md) — The global data sharing mechanism read conditionally by `use()`.
- [Suspense](../level_08/suspense.md) — The boundary system catching pending promises unwrapped by `use()`.
- [React Server Components (RSC)](rsc.md) — Server components generating data promises for `use()`.

---

## 7. Key Takeaways

- `use()` is a React 19 hook used to resolve Promises and read Context objects during render.
- Unlike traditional hooks, `use()` can be called conditionally inside `if` statements and loops.
- Passing a pending promise to `use()` suspends component rendering until the promise resolves.
- Always wrap components unwrapping promises via `use()` inside a parent `<Suspense>` boundary.
- Never instantiate new Promise references directly inside component render bodies to prevent infinite rendering loops.
