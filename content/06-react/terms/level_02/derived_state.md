# Derived State

> **Level 2 — State & Reactivity**
> Computing values dynamically on-the-fly during render execution instead of storing redundant duplicate state in `useState`.

---

## 1. Prerequisites

- [State](state.md) — The primary source state variables from which derived values are calculated.
- [Re-rendering](re_rendering.md) — The component execution loop that re-calculates local variables on every render pass.

---

## 2. Term Category

**Component Pattern (state computation pattern)**: Derived State is an architectural pattern in React where values are calculated on-the-fly directly inside the component body during render execution. Rather than storing calculated or transformed data inside redundant `useState` hooks and attempting to keep them synchronized using `useEffect`, derived values are computed dynamically from existing props or state snapshots.

This pattern enforces a single source of truth, eliminates out-of-sync state bugs, and prevents unnecessary extra re-render cycles.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A common beginner anti-pattern in React is storing redundant calculated data in state. For example, if a component displays a list of items and a search query, developers often create three separate state variables and use `useEffect` to sync them:

```jsx
// ❌ ANTI-PATTERN: Redundant state and extra sync effect!
const [items, setItems] = useState([]);
const [query, setQuery] = useState('');
const [filteredItems, setFilteredItems] = useState([]);

useEffect(() => {
  setFilteredItems(items.filter(i => i.name.includes(query)));
}, [items, query]);
```

This anti-pattern introduces severe issues:
1. **State Redundancy:** Storing `filteredItems` duplicates data already present in `items` and `query`.
2. **Double Renders:** Updating `query` triggers Render #1, which fires the `useEffect`, calling `setFilteredItems`, which triggers an unnecessary Render #2.
3. **Out-of-Sync Bugs:** If a developer updates `items` without running the sync effect, the UI displays stale filtered data.

React solves this through **Derived State**:
- Any value that can be computed from existing props or state should be computed directly inside the component body during render.
- Because React executes the component function on every render, local variables automatically recalculate with zero extra hooks.
- If a derivation is computationally expensive (e.g. sorting 10,000 items), wrap it in `useMemo` to cache the calculation.

### (2) Reality Metaphor
Imagine tracking your age on an identity card.

- **Redundant State (Manual Sync):** You write down your birth date AND your "Current Age" on a sticky note. Every year on your birthday, you must remember to cross out your age and write a new number. If you forget, your written age gets out of sync with your actual birth date.
- **Derived State (Dynamic Calculation):** You write down ONLY your "Birth Date" on the card. Whenever anyone asks: *"How old are you?"*, you check the current date, subtract your birth date, and state the answer. It is mathematically impossible for your age to get out of sync with your birth date because you calculate it dynamically on demand.

### (3) React Code Examples

#### Short Snippet
```jsx
// GOOD: Derived state computed dynamically during render. Zero hooks required!
function CartSummary({ items }) {
  const itemCount = items.length;
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return <div>Total ({itemCount} items): ${totalPrice.toFixed(2)}</div>;
}
```

#### Fuller Example
```jsx
import React, { useState, useMemo } from 'react';

export default function DerivedStateFilter({ userList }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Derived State: Filtered list is computed dynamically during render frame
  // Wrapped in useMemo to cache expensive array filtering
  const filteredUsers = useMemo(() => {
    return userList.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [userList, searchQuery, selectedRole]);

  // Derived State: Simple primitive calculations require NO useMemo
  const totalCount = userList.length;
  const matchCount = filteredUsers.length;

  return (
    <div className="filter-panel">
      <h3>User Directory ({matchCount} of {totalCount} shown)</h3>

      <input 
        value={searchQuery} 
        onChange={e => setSearchQuery(e.target.value)} 
        placeholder="Search names..." 
      />

      <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
        <option value="ALL">All Roles</option>
        <option value="Admin">Admin</option>
        <option value="Developer">Developer</option>
      </select>

      <ul>
        {filteredUsers.map(user => (
          <li key={user.id}>{user.name} — {user.role}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Copying Props into Initial State Variables (`useState(props.val)`)

**The mistake:** Initializing local state with an incoming prop: `const [userName, setUserName] = useState(user.name)`.

**Why it's wrong:** The `useState` initializer function evaluates ONLY when the component mounts. If the parent component updates and passes a new `user` prop later, the local `userName` state ignores the prop change, causing stale, out-of-sync UI data.

*Incorrect:*
```jsx
// ❌ Stale data bug: userName will NOT update when parent user prop changes!
function ProfileCard({ user }) {
  const [userName, setUserName] = useState(user.name);
  return <h3>{userName}</h3>;
}
```

*Fix:*
```jsx
// ✅ Derived State: Always displays the latest prop value dynamically
function ProfileCard({ user }) {
  const userName = user.name; // Computed during render!
  return <h3>{userName}</h3>;
}
```

### Mistake 2: Using `useEffect` to Synchronize State Variables

**The mistake:** Storing `firstName`, `lastName`, AND `fullName` in three state variables, using `useEffect` to sync `fullName`.

**Why it's wrong:** Updating state inside `useEffect` causes a double-render pass (Render #1 with old state -> Effect -> Render #2 with new state), degrading performance and creating potential infinite update loops.

*Incorrect:*
```jsx
const [first, setFirst] = useState('Alice');
const [last, setLast] = useState('Smith');
const [full, setFull] = useState('');

// ❌ Double render anti-pattern!
useEffect(() => {
  setFull(`${first} ${last}`);
}, [first, last]);
```

*Fix:*
```jsx
const [first, setFirst] = useState('Alice');
const [last, setLast] = useState('Smith');

// ✅ Derived State: Computed on-the-fly during render pass
const full = `${first} ${last}`;
```

### Mistake 3: Over-using `useMemo` for Cheap Primitive Calculations

**The mistake:** Wrapping simple string concatenations or basic array lengths in `useMemo`: `const count = useMemo(() => items.length, [items])`.

**Why it's wrong:** `useMemo` carries memory and dependency array comparison overhead. Calling `useMemo` for cheap primitive math is slower than simply recalculating the value on every render. Save `useMemo` for expensive operations (like filtering/sorting thousands of array items).

*Incorrect:*
```jsx
// ❌ Unnecessary useMemo overhead for basic property access!
const isListEmpty = useMemo(() => items.length === 0, [items]);
```

*Fix:*
```jsx
// ✅ Calculate basic primitives directly in render body
const isListEmpty = items.length === 0;
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Threshold Alert Summary (IoT Telemetry)

**Scenario:** An industrial IoT monitoring dashboard receives an array of sensor telemetry objects. Compute critical alert counts and average system voltage as derived state during render.

**Requirements:**
1. Create `TelemetrySummary` accepting a `sensors` array prop (`id`, `voltage`, `temp`, `isCritical`).
2. Calculate `criticalCount` and `avgVoltage` directly inside the component body without `useState` or `useEffect`.
3. Render summary indicators cleanly.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function TelemetrySummary({ sensors = [] }) {
>   // Derived State: Computed dynamically on every render pass
>   const criticalCount = sensors.filter(s => s.isCritical).length;
>   const totalVoltage = sensors.reduce((sum, s) => sum + s.voltage, 0);
>   const avgVoltage = sensors.length > 0 ? (totalVoltage / sensors.length).toFixed(1) : '0.0';
> 
>   return (
>     <div className="summary-card">
>       <h4>System Status Summary</h4>
>       <p>Total Active Sensors: {sensors.length}</p>
>       <p className={criticalCount > 0 ? 'text-danger' : 'text-success'}>
>         Critical Alerts: {criticalCount}
>       </p>
>       <p>Average Voltage: {avgVoltage} V</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Single Source of Truth**: All metrics derive directly from the primary `sensors` prop array.
> 2. **Zero Extra Hooks**: Computes totals and averages without `useState` or sync `useEffect` blocks.
> 3. **Eliminates Sync Bugs**: Impossible for `criticalCount` to desynchronize from `sensors` data updates.
> 4. **Render Performance**: Recalculating primitives during render executes in microsecond intervals.
> 
---

### Exercise 2: Financial Order Book Spread Calculation (Financial Trading)

**Scenario:** A trading terminal receives lists of bids and asks. Calculate bid/ask spread and order book imbalance ratios as derived state.

**Requirements:**
1. Create `OrderBookSpread` taking `bids` array and `asks` array.
2. Derive `highestBid`, `lowestAsk`, and `spread` (`lowestAsk - highestBid`).
3. Compute `spreadPercentage`.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function OrderBookSpread({ bids = [], asks = [] }) {
>   // Derived State calculations
>   const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.price)) : 0;
>   const lowestAsk = asks.length > 0 ? Math.min(...asks.map(a => a.price)) : 0;
>   const spread = lowestAsk > 0 && highestBid > 0 ? lowestAsk - highestBid : 0;
>   const spreadPercent = highestBid > 0 ? ((spread / highestBid) * 100).toFixed(3) : '0.000';
> 
>   return (
>     <div className="spread-panel">
>       <div className="spread-metric">
>         <span>Top Bid: ${highestBid.toFixed(2)}</span>
>         <span>Top Ask: ${lowestAsk.toFixed(2)}</span>
>       </div>
>       <div className="spread-value">
>         Spread: ${spread.toFixed(2)} ({spreadPercent}%)
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Pure Data Derivation**: Spread metrics calculate dynamically whenever new `bids` or `asks` props arrive.
> 2. **No Double Renders**: Avoids triggering extra render cycles caused by setter invocations inside effects.
> 3. **Math Safety Checks**: Guard clauses prevent division-by-zero errors during render execution.
> 4. **Declarative Output**: Component focuses purely on returning UI snapshots derived from market data.
> 
---

### Exercise 3: E-Commerce Shopping Cart Subtotal & Shipping (E-Commerce)

**Scenario:** An e-commerce checkout view calculates item subtotals, tax rates, free shipping thresholds, and grand total dynamically from cart items state.

**Requirements:**
1. Create `CartCheckout` taking `cartItems` array (`id`, `price`, `qty`) and `promoDiscount` (number).
2. Derive `subtotal`, `shippingCost` (free if subtotal > $50), `tax`, and `grandTotal`.
3. Render checkout breakdown list.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function CartCheckout({ cartItems = [], promoDiscount = 0 }) {
>   // Derived State Calculations
>   const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
>   const discountAmount = subtotal * (promoDiscount / 100);
>   const discountedSubtotal = subtotal - discountAmount;
>   const shippingCost = discountedSubtotal >= 50 || discountedSubtotal === 0 ? 0 : 9.99;
>   const tax = discountedSubtotal * 0.08;
>   const grandTotal = discountedSubtotal + shippingCost + tax;
> 
>   return (
>     <div className="checkout-summary">
>       <h4>Order Breakdown</h4>
>       <p>Subtotal: ${subtotal.toFixed(2)}</p>
>       {promoDiscount > 0 && <p>Discount ({promoDiscount}%): -${discountAmount.toFixed(2)}</p>}
>       <p>Shipping: {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</p>
>       <p>Estimated Tax (8%): ${tax.toFixed(2)}</p>
>       <hr />
>       <h3>Grand Total: ${grandTotal.toFixed(2)}</h3>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Multi-Step Derivation**: Calculates complex chained values (`subtotal` -> `discount` -> `shipping` -> `tax` -> `grandTotal`) in one pure render pass.
> 2. **Guaranteed Consistency**: Impossible for `grandTotal` to be calculated using an outdated `shippingCost`.
> 3. **Clean Code Structure**: Keeps state storage minimal (`cartItems` and `promoDiscount`) while deriving presentation logic.
> 4. **Reactivity**: Any quantity change automatically updates all downstream financial calculations instantly.
> 
---

## 6. Related Terms

- [State](state.md) — Primary source data variables managed in component memory.
- [Re-rendering](re_rendering.md) — The component re-evaluation loop where derived variables update.
- [Render Purity](../level_01/render_purity.md) — The functional rule requiring derived calculations to remain self-contained.
- [`useMemo` Hook](../level_04/use_memo.md) — Optimization hook used to cache expensive derived state calculations.

---

## 7. Key Takeaways

- **Derived State** is computed dynamically from props or state during render execution.
- Storing derived data in `useState` creates redundant state, out-of-sync bugs, and extra render cycles.
- Never use `useEffect` to synchronize secondary state variables based on primary state changes.
- Computing variables inside component render bodies is fast and maintains a single source of truth.
- Do not copy props into `useState(props.val)` initializers if the value must stay in sync with parent props.
- Wrap heavy, expensive array derivations (filtering thousands of items) in `useMemo`.
