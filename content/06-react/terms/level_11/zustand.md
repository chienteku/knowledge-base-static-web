# Zustand

> **Level 11 — Ecosystem Libraries**
> A minimal, fast, and selector-based global state management library for React that eliminates Context re-render bottlenecks and Provider wrappers.

---

## 1. Prerequisites

- [State Management (Redux / Zustand)](../level_06/state_management.md) — The global state container concept implemented by Zustand.
- [`useReducer` Hook](../level_06/use_reducer.md) — The state update pattern underlying store actions.

---

## 2. Term Category

**Ecosystem (lightweight state store)**: Zustand is a lightweight, unopinionated global state management library for React. Built on a publish-subscribe architecture and powered internally by [`useSyncExternalStore`](use_sync_external_store.md), Zustand allows developers to create centralized data stores as standalone vanilla JavaScript objects without requiring top-level `<Provider>` wrapper components in the React tree.

Zustand uses **selector-based subscriptions** (`useStore(state => state.user)`). Components subscribe strictly to specific primitive properties or slices of global state. When unrelated state properties in the store change, subscribing components do not re-render, eliminating the performance re-render bottlenecks associated with React Context.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Managing global state across multiple components in React has historically been handled by either the Context API or Redux:
1. **Context API Bottlenecks:** While Context is built into React, it suffers from severe performance issues in medium-to-large apps. When any state value inside a Context Provider updates, **every** component consuming that Context (via `useContext`) is forced to re-render, even if the component only reads an unrelated property.
2. **Redux Boilerplate:** Redux is highly performant but requires significant boilerplate code (slices, actions, dispatchers, store providers, middleware) for simple global state needs.

Zustand was created to bridge this architectural gap:
- **Provider-less Architecture:** You do not wrap component trees in `<Context.Provider>` wrappers. The store is created once using `create()` and exported as a custom React hook.
- **Selector-based Subscriptions:** Components subscribe to specific state slices via selector functions: `const count = useStore(state => state.count)`. If `state.userName` updates elsewhere in the store, the component reading `state.count` does not re-render.
- **Outside-React Usage:** Store state can be read, updated, and subscribed to directly in vanilla JavaScript files outside React components via `store.getState()` and `store.setState()`.

### (2) Reality Metaphor

Imagine an office communication system.

- **React Context API (Building PA Intercom System):** The office administrator announces over the building-wide intercom: *"Accountant Bob's desk telephone number has changed."* Every employee in the building stops working, listens to the entire announcement, and resumes work (**wasted re-render cycles across all context consumers**), even though 95% of employees never call Bob.
- **Zustand (Direct Pager System):** Employees subscribe only to topics relevant to their specific department (**selector-based subscriptions**). When Accountant Bob's number changes, only the accounting team's pagers buzz (**selective re-rendering**). Employees in marketing and engineering continue working without interruption (**zero unnecessary re-renders**).

### (3) React Code Examples

#### Short Snippet

```javascript
// store/useCounterStore.js (Zustand Store Creation)
import { create } from 'zustand';

export const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 })
}));
```

#### Fuller Example

```jsx
// components/UserDashboard.jsx
'use client';

import { create } from 'zustand';

// 1. Create centralized store containing state and actions
const useUserStore = create((set) => ({
  userName: 'Alex Rivera',
  role: 'Architect',
  loginCount: 42,
  
  // Actions
  setUserName: (name) => set({ userName: name }),
  incrementLogin: () => set((state) => ({ loginCount: state.loginCount + 1 }))
}));

// 2. Component subscribing ONLY to userName
export function UserBadge() {
  // Selector function ensures component re-renders ONLY when userName updates
  const userName = useUserStore((state) => state.userName);
  
  return <span className="badge">User: {userName}</span>;
}

// 3. Component subscribing ONLY to loginCount and actions
export function LoginTracker() {
  const loginCount = useUserStore((state) => state.loginCount);
  const incrementLogin = useUserStore((state) => state.incrementLogin);

  return (
    <div className="login-card">
      <p>Logins: {loginCount}</p>
      <button onClick={incrementLogin}>Record Login</button>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Destructuring the entire store object without supplying selector functions

**The mistake:** Calling `const { userName, count } = useUserStore()` without passing a selector function to the store hook.

**Why it's wrong:** Calling `useStore()` without a selector function subscribes the component to ALL state updates in that store. If `count` updates, components that only destructure `userName` will still be forced to re-render, re-introducing Context API performance bottlenecks.

*Incorrect:*
```jsx
// ❌ Anti-pattern: Subscribes component to ALL store updates!
function Profile() {
  const { userName } = useUserStore(); // Missing selector!
  return <div>{userName}</div>;
}
```

*Fix:*
```jsx
// Supply granular selector function
function Profile() {
  const userName = useUserStore((state) => state.userName);
  return <div>{userName}</div>;
}
```

### Mistake 2: Mutating state directly inside Zustand store actions without returning new object references or using Immer

**The mistake:** Writing `set((state) => { state.count += 1; return state; })` inside a store action without Immer middleware.

**Why it's wrong:** Zustand performs shallow equality checks on returned state objects. Mutating `state` directly without returning a new object reference causes `useSyncExternalStore` equality checks to evaluate as unchanged, skipping component updates.

*Incorrect:*
```javascript
// ❌ Direct state mutation without Immer! Skipping component re-renders!
inc: () => set((state) => { state.count += 1; return state; })
```

*Fix:*
```javascript
// Return new state object reference using spread syntax
inc: () => set((state) => ({ count: state.count + 1 }))
```

### Mistake 3: Storing API server response data in Zustand stores instead of using async state tools like React Query

**The mistake:** Fetching server API endpoints and manually storing response arrays inside a Zustand store.

**Why it's wrong:** Server response data is **Server State** (data owned remotely that can go stale). Storing API data in Zustand requires manual implementation of caching, loading flags, background refetching, and deduplication.

*Incorrect:*
```javascript
// ❌ Anti-pattern: Manually storing server API data in Zustand!
fetchUsers: async () => {
  const res = await fetch('/api/users');
  set({ users: await res.json() });
}
```

*Fix:*
```javascript
// Use React Query for Server State; keep Zustand for Client State
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Unit Preference Store

**Scenario:** Create a Zustand store `useTelemetryStore` managing global temperature unit preferences (`'CELSIUS'` or `'FAHRENHEIT'`). Implement selector-based components to toggle units and display converted sensor temperatures.

**Requirements:**
1. Create store with `unit` state (`'CELSIUS'` default) and `toggleUnit` action.
2. Build `UnitToggleButton` component selecting `toggleUnit`.
3. Build `TemperatureReadout` selecting `unit` and converting °C to °F.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
> 
> import { create } from 'zustand';
> 
> // 1. Create Zustand Store
> export const useTelemetryStore = create((set) => ({
>   unit: 'CELSIUS',
>   toggleUnit: () => set((state) => ({ 
>     unit: state.unit === 'CELSIUS' ? 'FAHRENHEIT' : 'CELSIUS' 
>   }))
> }));
> 
> // 2. Toggle Button Component
> export function UnitToggleButton() {
>   const unit = useTelemetryStore((state) => state.unit);
>   const toggleUnit = useTelemetryStore((state) => state.toggleUnit);
> 
>   return (
>     <button onClick={toggleUnit} className="btn-toggle">
>       Active Unit: °{unit === 'CELSIUS' ? 'C' : 'F'} (Click to Toggle)
>     </button>
>   );
> }
> 
> // 3. Readout Component
> export function TemperatureReadout({ tempInCelsius }) {
>   const unit = useTelemetryStore((state) => state.unit);
>   
>   const displayTemp = unit === 'FAHRENHEIT' 
>     ? (tempInCelsius * 9/5 + 32).toFixed(1)
>     : tempInCelsius.toFixed(1);
> 
>   return (
>     <div className="readout">
>       <span>Temperature: {displayTemp} °{unit === 'CELSIUS' ? 'C' : 'F'}</span>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Zero Provider Overhead**: Store initializes via `create()` without root `<Provider>` wrappers.
> 2. **Granular Selectors**: `useTelemetryStore(state => state.unit)` subscribes strictly to `unit` state updates.
> 3. **Immutable Action Updates**: `toggleUnit` returns a fresh state object `{ unit: ... }`.
> 4. **Runtime Conversion**: `TemperatureReadout` computes displayed value dynamically during render based on selected unit.
> 
### Exercise 2: Financial Trading Order Ticket State Store

**Scenario:** Develop a Zustand store `useOrderTicketStore` managing dynamic stock ticker symbols, order types (`'MARKET'` or `'LIMIT'`), and share quantities for a trading terminal desk.

**Requirements:**
1. Create store with `symbol`, `orderType`, `quantity`, and setter actions.
2. Implement `OrderSummary` selecting only `symbol` and `quantity`.
3. Implement `OrderControls` dispatching setter actions.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
> 
> import { create } from 'zustand';
> 
> export const useOrderTicketStore = create((set) => ({
>   symbol: 'AAPL',
>   orderType: 'MARKET',
>   quantity: 10,
>   setSymbol: (symbol) => set({ symbol }),
>   setOrderType: (orderType) => set({ orderType }),
>   setQuantity: (quantity) => set({ quantity: Math.max(1, quantity) })
> }));
> 
> export function OrderSummary() {
>   // Select only symbol and quantity
>   const symbol = useOrderTicketStore((state) => state.symbol);
>   const quantity = useOrderTicketStore((state) => state.quantity);
> 
>   return (
>     <div className="summary-box">
>       <h4>Order Ticket Summary</h4>
>       <p>Target: {quantity} shares of {symbol}</p>
>     </div>
>   );
> }
> 
> export function OrderControls() {
>   const quantity = useOrderTicketStore((state) => state.quantity);
>   const setQuantity = useOrderTicketStore((state) => state.setQuantity);
> 
>   return (
>     <div className="qty-controls">
>       <button onClick={() => setQuantity(quantity - 1)}>-</button>
>       <span>Qty: {quantity}</span>
>       <button onClick={() => setQuantity(quantity + 1)}>+</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Selector Re-render Isolation**: Changes to `orderType` will not trigger re-renders in `OrderSummary` or `OrderControls`.
> 2. **State Validation**: `setQuantity` enforces minimum quantity bounds (`Math.max(1, quantity)`).
> 3. **Action Co-location**: Store actions are co-located directly alongside state properties inside the store definition.
> 4. **Decoupled Architecture**: Components consume shared state without prop drilling.
> 
### Exercise 3: E-Commerce Shopping Drawer Open/Close Store (Outside-React Usage)

**Scenario:** Implement a global Zustand drawer store `useDrawerStore` for an e-commerce platform. Demonstrate calling `useDrawerStore.getState().openDrawer()` from a vanilla JavaScript analytics event listener outside React components.

**Requirements:**
1. Create `useDrawerStore` managing `isOpen` state and `openDrawer` / `closeDrawer` actions.
2. Build `CartDrawer` component subscribing to `isOpen`.
3. Demonstrate vanilla JS outside-React store execution.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
> 
> import { create } from 'zustand';
> 
> export const useDrawerStore = create((set) => ({
>   isOpen: false,
>   openDrawer: () => set({ isOpen: true }),
>   closeDrawer: () => set({ isOpen: false })
> }));
> 
> // Vanilla JavaScript helper function outside React component trees
> export function triggerCartOpenFromAnalytics() {
>   // Outside-React store access via getState()
>   console.log('Opening cart drawer from external analytics trigger...');
>   useDrawerStore.getState().openDrawer();
> }
> 
> export function CartDrawer() {
>   const isOpen = useDrawerStore((state) => state.isOpen);
>   const closeDrawer = useDrawerStore((state) => state.closeDrawer);
> 
>   if (!isOpen) return null;
> 
>   return (
>     <div className="drawer-overlay">
>       <aside className="drawer-panel">
>         <h3>Your Shopping Cart</h3>
>         <button onClick={closeDrawer} className="btn-close">Close Drawer</button>
>       </aside>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Outside-React Store API**: `useDrawerStore.getState()` reads and dispatches actions directly from non-React JavaScript code.
> 2. **Provider-less Mount**: `CartDrawer` reads store state without needing root `<DrawerProvider>` context wrappers.
> 3. **Boolean Conditional Render**: Returns `null` when `isOpen` is `false`.
> 4. **Performance Efficiency**: Only components selecting `isOpen` re-render during drawer state toggles.
> 
---

## 6. Related Terms

- [State Management (Redux / Zustand)](../level_06/state_management.md) — The global state container architecture.
- [`useSyncExternalStore` Hook](use_sync_external_store.md) — The built-in React 18 hook powering Zustand's store subscriptions.
- [Redux](redux.md) — Action-reducer based state container alternative.
- [React Query (TanStack Query) / SWR](react_query.md) — Async server state manager complementary to Zustand.

---

## 7. Key Takeaways

- Zustand is a lightweight, fast global state management library for React.
- Does not require top-level `<Provider>` wrapper components in the React tree.
- Uses selector-based subscriptions (`useStore(state => state.prop)`) to eliminate Context API re-render bottlenecks.
- Action methods are defined directly inside the store object alongside state variables.
- Always use selector functions when consuming store state to prevent unnecessary component re-renders.
- Store state can be accessed and mutated outside of React components using `store.getState()` and `store.setState()`.
