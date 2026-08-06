# Redux

> **Level 11 — Ecosystem Libraries**
> A predictable global state management container for React applications enforcing strict unidirectional state updates through a centralized store, actions, and reducers.

---

## 1. Prerequisites

- [State Management (Redux / Zustand)](../level_06/state_management.md) — The global state container architecture implemented by Redux.
- [`useReducer` Hook](../level_06/use_reducer.md) — React's built-in hook implementing the flux reducer pattern.

---

## 2. Term Category

**Ecosystem (predictable state container)**: Redux is a centralized state management library designed around Flux application architecture principles. It maintains an application's entire global state tree inside a single, immutable JavaScript object store. State cannot be modified directly; changes are triggered strictly by dispatching **Actions** (plain objects describing an event) to pure **Reducer** functions.

In modern React development, Redux is implemented exclusively using **Redux Toolkit (RTK)** (`@reduxjs/toolkit`) and **React-Redux** (`react-redux`). Redux Toolkit eliminates legacy boilerplate code via `createSlice()`, integrating Immer.js internally to enable intuitive draft-mutation syntax while generating immutable state snapshots.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In large multi-component React applications, managing shared state using plain React props leads to severe architectural friction:
1. **Prop Drilling:** Passing state callbacks down 6 levels of component nesting to reach a deeply nested child widget.
2. **Chaotic State Mutations:** When 20 different components invoke scattered `setState` functions across an application, tracking *which* component modified data and *why* becomes nearly impossible, leading to race conditions and untraceable state bugs.

Redux was created to bring strict predictability and auditability to global application state. By centralizing global data into a single Store and forcing all state updates through explicit Action payloads, Redux ensures a 100% deterministic paper trail.

Every state change can be logged, inspected, and reversed in developer tools (enabling "Time-Travel Debugging"). Modern Redux Toolkit (`createSlice`) pairs this discipline with minimal setup overhead, making it a battle-tested choice for large enterprise applications requiring strict state governance.

### (2) Reality Metaphor

Imagine a commercial bank vault operation.

- **Unstructured State (Handing Cash Around the Office):** Employees keep cash in unlocked desk drawers, hand dollar bills across cubicles (**prop drilling**), and slip IOUs into random folders (**scattered `useState` calls**). When $500 goes missing at the end of the month, nobody knows who took it or where it went.
- **Redux Architecture (Centralized Bank Vault with Teller Ledgers):** All cash is locked inside a central vault (**The Redux Store**). Employees cannot walk into the vault. To deposit or withdraw funds, an employee fills out an official withdrawal slip (**Dispatches an Action**). A bank teller (**The Reducer**) checks the slip, updates the central balance ledger (**Calculates New State**), and issues a stamped receipt. If an error occurs, auditor logs show every transaction slip that ever occurred in sequence (**Time-Travel DevTools**).

### (3) React Code Examples

#### Short Snippet

```javascript
// store/counterSlice.js (Redux Toolkit)
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    // Draft-mutation syntax powered by Immer under the hood
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
    incrementByAmount: (state, action) => { state.value += action.payload; }
  }
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

#### Fuller Example

```jsx
// components/CounterWidget.jsx
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement, incrementByAmount } from '../store/counterSlice';

export function CounterWidget() {
  // Select granular slice of global state to prevent unnecessary re-renders
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div className="counter-card">
      <h2>Global Store Count: {count}</h2>
      <div className="button-group">
        <button onClick={() => dispatch(decrement())}>-1</button>
        <button onClick={() => dispatch(increment())}>+1</button>
        <button onClick={() => dispatch(incrementByAmount(5))}>+5</button>
      </div>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing local component UI state in the global Redux store

**The mistake:** Dispatching Redux actions to track whether a specific dropdown menu or modal tab is currently open in a single leaf component.

**Why it's wrong:** Redux is intended for **Global Shared State** (user sessions, shopping carts, shared application settings). Storing transient local UI state (like `isDropdownOpen`) in Redux pollutes the global store, forces unnecessary global re-renders, and adds overhead for data no other component cares about.

*Incorrect:*
```javascript
// ❌ Anti-pattern: Dispatching global Redux actions for local dropdown toggle!
dispatch(setSettingsDropdownOpen(true));
```

*Fix:*
```jsx
// Use local component useState for local UI state
const [isOpen, setIsOpen] = useState(false);
```

### Mistake 2: Selecting the entire global state object inside `useSelector(state => state)`

**The mistake:** Calling `const state = useSelector(state => state)` inside a component function.

**Why it's wrong:** Selecting the entire root state object causes the component to re-render whenever ANY value anywhere in the global Redux store changes, bypassing selector optimizations.

*Incorrect:*
```jsx
// ❌ Re-renders component whenever ANY store property updates!
const state = useSelector(state => state);
```

*Fix:*
```jsx
// Select only the specific primitive slice required
const userName = useSelector(state => state.user.name);
```

### Mistake 3: Using legacy Redux boilerplate (manual string action constants & switch-case reducers) in modern code

**The mistake:** Writing manual `const ADD_TODO = 'ADD_TODO';` action creators and manual switch statements in new applications.

**Why it's wrong:** Modern Redux strictly mandates using **Redux Toolkit (`@reduxjs/toolkit`)** with `createSlice()`. RTK reduces boilerplate code by 80%, incorporates Immer for safe state updates, and configures store middleware automatically.

*Incorrect:*
```javascript
// ❌ Legacy 2015 Redux boilerplate
function todoReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO': return [...state, action.payload];
    default: return state;
  }
}
```

*Fix:*
```javascript
// Modern Redux Toolkit createSlice
const todoSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: (state, action) => { state.push(action.payload); }
  }
});
```

---

## 5. Practice Exercises

### Exercise 1: IoT Plant Telemetry Alarm Redux Slice

**Scenario:** Implement a Redux Toolkit slice `telemetrySlice` for an IoT monitoring dashboard. The store maintains an array of active alarms and supports actions to trigger an alarm and silence an alarm by ID.

**Requirements:**
1. Create `telemetrySlice` using `createSlice`.
2. Define initial state `{ alarms: [] }`.
3. Add `triggerAlarm` and `silenceAlarm` reducers.
4. Export action creators and reducer.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // store/telemetrySlice.js
> import { createSlice } from '@reduxjs/toolkit';
>
> const initialState = {
>   alarms: []
> };
>
> export const telemetrySlice = createSlice({
>   name: 'telemetry',
>   initialState,
>   reducers: {
>     triggerAlarm: (state, action) => {
>       // Immer allows direct push
>       state.alarms.push({
>         id: action.payload.id,
>         sensorName: action.payload.sensorName,
>         silenced: false
>       });
>     },
>     silenceAlarm: (state, action) => {
>       const alarm = state.alarms.find(a => a.id === action.payload);
>       if (alarm) {
>         alarm.silenced = true;
>       }
>     }
>   }
> });
>
> export const { triggerAlarm, silenceAlarm } = telemetrySlice.actions;
> export default telemetrySlice.reducer;
> ```
>
> #### Technical Explanation
> 1. **Slice Modularization**: `createSlice` encapsulates action types, action creators, and reducer logic in a single file.
> 2. **Immer Mutability**: Mutating `state.alarms.push()` inside RTK reducers is safely translated into immutable updates under the hood.
> 3. **Payload Inspection**: `action.payload` extracts data arguments passed when dispatching actions.
> 4. **Granular Targeting**: `silenceAlarm` locates specific array elements by ID without manual array copying.
> 
### Exercise 2: Financial Trading Portfolio Redux Dispatch

**Scenario:** Develop a Financial Trading portfolio component that reads total cash balance from a Redux store using `useSelector`, dispatching a `depositCash` action when a user executes a deposit.

**Requirements:**
1. Select `cashBalance` using `useSelector`.
2. Get dispatch function via `useDispatch`.
3. Dispatch `depositCash(1000)` on button click.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import { useSelector, useDispatch } from 'react-redux';
> import { depositCash } from '../store/portfolioSlice';
>
> export function PortfolioBalanceCard() {
>   // Select cash balance value
>   const cashBalance = useSelector((state) => state.portfolio.cashBalance);
>   const dispatch = useDispatch();
> 
>   const handleDeposit = () => {
>     dispatch(depositCash(1000));
>   };
> 
>   return (
>     <div className="balance-card">
>       <h3>Portfolio Buying Power</h3>
>       <p className="amount">${cashBalance.toFixed(2)}</p>
>       <button onClick={handleDeposit} className="btn-deposit">
>         Deposit $1,000 Cash
>       </button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Granular Selector**: `useSelector(state => state.portfolio.cashBalance)` subscribes strictly to cash updates, preventing re-renders when other portfolio slices change.
> 2. **Action Dispatch**: `dispatch(depositCash(1000))` dispatches an action object `{ type: 'portfolio/depositCash', payload: 1000 }`.
> 3. **Unidirectional Flow**: UI dispatches action -> Reducer updates store -> Component re-renders with new balance.
> 4. **Encapsulated Redux Hooks**: `useSelector` and `useDispatch` link React components to the centralized Redux store.
> 
### Exercise 3: E-Commerce Shopping Cart Slice with Item Removal

**Scenario:** Build an e-commerce cart Redux slice managing cart items, providing reducers to add items and remove items by ID.

**Requirements:**
1. Create `cartSlice` managing `items` array.
2. Implement `addItem` (increments qty if item exists, else pushes).
3. Implement `removeItem` (filters out item by ID).

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // store/cartSlice.js
> import { createSlice } from '@reduxjs/toolkit';
>
> export const cartSlice = createSlice({
>   name: 'cart',
>   initialState: { items: [] },
>   reducers: {
>     addItem: (state, action) => {
>       const existing = state.items.find(i => i.id === action.payload.id);
>       if (existing) {
>         existing.quantity += 1;
>       } else {
>         state.items.push({ ...action.payload, quantity: 1 });
>       }
>     },
>     removeItem: (state, action) => {
>       state.items = state.items.filter(i => i.id !== action.payload);
>     }
>   }
> });
>
> export const { addItem, removeItem } = cartSlice.actions;
> export default cartSlice.reducer;
> ```
>
> #### Technical Explanation
> 1. **Item Deduction Logic**: `addItem` inspects existing item arrays before pushing new records.
> 2. **Immer Draft Updates**: Direct mutations like `existing.quantity += 1` execute safely inside RTK reducers.
> 3. **Array Re-assignment**: Reassigning `state.items = ...` is permitted in RTK when returning a new array.
> 4. **Export Patterns**: Slice exports action creators and reducer for store integration cleanly.
> 
---

## 6. Related Terms

- [State Management (Redux / Zustand)](../level_06/state_management.md) — The parent architectural paradigm.
- [`useReducer` Hook](../level_06/use_reducer.md) — React's built-in single-component reducer hook.
- [Zustand](zustand.md) — Lightweight, selector-based global state alternative.
- [React Query (TanStack Query) / SWR](react_query.md) — Async server state manager replacing API state in Redux.

---

## 7. Key Takeaways

- Redux is a predictable global state manager maintaining application data in a centralized store.
- Always use **Redux Toolkit (`@reduxjs/toolkit`)** and `createSlice()` for modern Redux development.
- State updates are triggered strictly by dispatching Actions to pure Reducer functions.
- Select granular state slices via `useSelector(state => state.slice.prop)` to optimize component re-renders.
- Never put local UI state (like dropdown toggles) or API server response caches into Redux.
