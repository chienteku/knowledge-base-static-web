# `useReducer` Hook

> **Level 6 — Context & Global State**
> A built-in React Hook for managing complex, multi-variable component state transitions using a predictable, pure Reducer function and Action dispatch pattern.

---

## 1. Prerequisites

- [`useState` Hook](../level_02/use_state.md) — Understanding standard state updates before transitioning to reducer-driven state machines.
- [Immutability](../level_02/immutability.md) — The strict rule requiring reducers to return new state object references.
- [State Management (Redux / Zustand)](state_management.md) — The global architecture pattern that `useReducer` mirrors locally inside components.

---

## 2. Term Category

**Core Hook (state machine primitive)**: `useReducer` is a built-in React Hook designed to manage complex component state objects or state logic where upcoming state depends directly on previous state snapshot values.

Instead of invoking individual state setters scattered across event handlers (`setName`, `setError`, `setIsLoading`), components execute `useReducer(reducer, initialState)`. This returns a tuple containing the current `state` snapshot and a `dispatch` function. Components trigger state updates by dispatching **Action** objects (`dispatch({ type: 'ACTION_TYPE', payload: data })`). A pure, synchronous **Reducer** function sitting outside component scope receives `(currentState, action)` and computes the next state object snapshot.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When building complex UI features (such as multi-step forms, asynchronous data fetching pipelines, or interactive data grids), components often manage 5 or 6 interdependent state variables (`data`, `isLoading`, `error`, `isSubmitting`, `validationErrors`). Updating this state with `useState` requires executing 4 separate `setState` calls inside a single button handler, leading to race conditions, incomplete state updates, and untangleable bugs.

`useReducer` solves this by decoupling *what happened* (the Action) from *how state changes* (the Reducer):

1. **State Machine Predictability:** The Reducer function centralizes all state transitions into a single `switch` statement outside component render lifecycle.
2. **Simplified Event Handlers:** Event handlers become thin dispatchers (`dispatch({ type: 'SUBMIT' })`), leaving complex state calculation rules to pure reducer functions.
3. **Optimized Prop Passing:** Rather than passing 5 separate setter functions down to child components, parent components pass a single stable `dispatch` function reference.

### (2) Reality Metaphor

Imagine a bank teller operating behind a bulletproof security counter window.

In a **`useState` model**, bank customers walk behind the counter, manually open cash drawers, add bills, change ledger books, and count coins themselves (**direct component state mutation**). If two customers do this simultaneously, ledger accounting breaks down.

In a **`useReducer` model**, bank customers remain outside the security counter. If a customer wants to deposit money, they fill out a standardized deposit slip (**dispatching an Action object: `{ type: 'DEPOSIT', payload: 500 }`**) and slide it through the counter slot to the certified teller (**the pure Reducer function**). The teller receives the slip, verifies account balances, updates the official ledger according to strict banking rules, and hands back an updated bank statement (**returning new state**). The customer never touches cash drawers directly.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useReducer } from 'react';

// Pure reducer function defined outside component scope
function counterReducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + action.payload };
    case 'RESET':
      return { count: 0 };
    default:
      return state;
  }
}

function SimpleCounter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT', payload: 1 })}>+1</button>
      <button onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
    </div>
  );
}

export default SimpleCounter;
```

#### Fuller Example

```jsx
import React, { useReducer } from 'react';

// Initial state object holding complex data fetch pipeline state
const initialState = {
  data: null,
  isLoading: false,
  error: null
};

// Reducer function governing data fetch transitions
function fetchReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, data: action.payload, error: null };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function DataFetchPanel({ endpointUrl }) {
  const [state, dispatch] = useReducer(fetchReducer, initialState);

  const handleFetchData = async () => {
    // 1. Dispatch action declaring request start
    dispatch({ type: 'FETCH_START' });
    try {
      // Perform async fetch outside reducer
      const response = await fetch(endpointUrl);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const json = await response.json();
      // 2. Dispatch success action with data payload
      dispatch({ type: 'FETCH_SUCCESS', payload: json });
    } catch (err) {
      // 3. Dispatch failure action with error payload
      dispatch({ type: 'FETCH_ERROR', payload: err.message });
    }
  };

  return (
    <div className="fetch-panel">
      <h3>Async Data Fetch State Machine</h3>
      <button onClick={handleFetchData} disabled={state.isLoading}>
        {state.isLoading ? 'Fetching Data...' : 'Fetch Telemetry'}
      </button>
      <button onClick={() => dispatch({ type: 'RESET' })}>Reset Panel</button>

      {state.error && <div className="error-box">Error: {state.error}</div>}
      {state.data && <pre className="data-box">{JSON.stringify(state.data, null, 2)}</pre>}
    </div>
  );
}

export default DataFetchPanel;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating State Objects Directly Inside the Reducer Function

**The mistake:** Writing `state.count = state.count + 1; return state;` inside a reducer.

**Why it's wrong:** React compares state snapshots using `Object.is()`. Mutating existing `state` in-place modifies the original object in memory and returns the exact same reference. React assumes state did not change and skips re-rendering the component UI completely! Reducers MUST return brand new object copies.

*Incorrect:*
```jsx
function reducer(state, action) {
  if (action.type === 'inc') {
    state.count += 1; // ❌ Direct state object mutation!
    return state;
  }
}
```

*Fix:*
```jsx
function reducer(state, action) {
  if (action.type === 'inc') {
    return { ...state, count: state.count + 1 }; // Return new object snapshot
  }
}
```

### Mistake 2: Performing Asynchronous Operations or Impure Side-Effects Inside Reducer Functions

**The mistake:** Calling `fetch()`, `setTimeout()`, or `Math.random()` inside a reducer function.

**Why it's wrong:** Reducers MUST be pure calculations ($State_{new} = Reducer(State_{current}, Action)$). Executing side-effects inside reducers causes duplicate side-effects (especially under Strict Mode or Concurrent Rendering) and breaks predictable state debugging. Perform async logic in event handlers, then dispatch pure actions.

*Incorrect:*
```jsx
function reducer(state, action) {
  if (action.type === 'FETCH') {
    // ❌ Side-effect inside pure reducer function!
    fetch('/api').then(res => res.json());
  }
}
```

*Fix:*
```jsx
// Perform async fetch in event handler, then dispatch pure action
const handleLoad = async () => {
  const data = await fetch('/api');
  dispatch({ type: 'SET_DATA', payload: data });
};
```

### Mistake 3: Overusing `useReducer` for Simple Primitive Variables

**The mistake:** Converting a simple boolean toggle (`const [isOpen, setIsOpen] = useState(false)`) into a 20-line `useReducer` switch block.

**Why it's wrong:** `useReducer` introduces boilerplate (switch statements, action creators, type strings). Using it for independent boolean or string primitives adds unnecessary complexity. Reserve `useReducer` for complex state objects with interdependent properties.

*Incorrect:*
```jsx
// ❌ 15 lines of reducer code to toggle a simple boolean!
```

*Fix:*
```jsx
// Use standard useState for simple booleans
const [isOpen, setIsOpen] = useState(false);
```

---

## 5. Practice Exercises

### Exercise 1: Industrial IoT Gateway Connection State Machine

**Scenario:** Implement an industrial IoT connection status state machine using `useReducer`. States include `'DISCONNECTED'`, `'CONNECTING'`, `'CONNECTED'`, and `'ERROR'`.

**Requirements:**
1. Define pure `gatewayReducer` managing `status`, `ip`, and `retryCount`.
2. Implement actions: `'CONNECT'`, `'CONNECT_SUCCESS'`, `'CONNECT_FAIL'`, `'DISCONNECT'`.
3. Increment `retryCount` automatically on `'CONNECT_FAIL'`.
4. Add runtime test assertions for reducer transition output.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useReducer } from 'react';
> 
> const initialGatewayState = {
>   status: 'DISCONNECTED',
>   ip: '192.168.1.100',
>   retryCount: 0,
>   error: null
> };
> 
> export function gatewayReducer(state, action) {
>   switch (action.type) {
>     case 'CONNECT':
>       return { ...state, status: 'CONNECTING', error: null };
>     case 'CONNECT_SUCCESS':
>       return { ...state, status: 'CONNECTED', retryCount: 0, error: null };
>     case 'CONNECT_FAIL':
>       return {
>         ...state,
>         status: 'ERROR',
>         retryCount: state.retryCount + 1,
>         error: action.payload
>       };
>     case 'DISCONNECT':
>       return { ...state, status: 'DISCONNECTED', error: null };
>     default:
>       return state;
>   }
> }
> 
> export function IoTGatewayControl() {
>   const [state, dispatch] = useReducer(gatewayReducer, initialGatewayState);
> 
>   return (
>     <div className="gateway-control">
>       <h3>Gateway Status: {state.status}</h3>
>       <p>IP: {state.ip} | Retries: {state.retryCount}</p>
>       {state.error && <p className="error">Error: {state.error}</p>}
> 
>       <button onClick={() => dispatch({ type: 'CONNECT' })}>Connect</button>
>       <button onClick={() => dispatch({ type: 'CONNECT_SUCCESS' })}>Simulate Success</button>
>       <button onClick={() => dispatch({ type: 'CONNECT_FAIL', payload: 'Timeout' })}>Simulate Fail</button>
>     </div>
>   );
> }
> 
> export function testGatewayReducer() {
>   const state = gatewayReducer(initialGatewayState, { type: 'CONNECT_FAIL', payload: 'Connection Timeout' });
>   console.assert(state.status === 'ERROR' && state.retryCount === 1, 'Gateway reducer fail test');
> }
> ```
>
> #### Technical Explanation
> 1. **Pure State Transition Calculations**: Computes predictable connection status snapshots based strictly on action types.
> 2. **Immutable Retry Tracking**: Increments `retryCount` safely without mutating current state memory references.
> 3. **Decoupled Business Rules**: Offloads state machine rules into pure testable functions outside React UI components.
> 4. **Synchronous Reducer Assertion**: Tests state transitions directly via pure function calls (`gatewayReducer()`).
> 
### Exercise 2: Financial Stock Order Ticket State Machine (useReducer)

**Scenario:** Build an institutional trading order form state machine using `useReducer`. Manage `symbol`, `shares`, `orderType` (`'LIMIT'` | `'MARKET'`), and `isSubmitted`.

**Requirements:**
1. Implement `orderTicketReducer` supporting `'SET_FIELD'` and `'SUBMIT_ORDER'`.
2. Clear form fields on `'RESET'`.
3. Ensure immutable object updates inside reducer.
4. Include runtime test assertions for field updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useReducer } from 'react';
> 
> const initialTicket = {
>   symbol: 'AAPL',
>   shares: 100,
>   orderType: 'MARKET',
>   isSubmitted: false
> };
> 
> export function orderTicketReducer(state, action) {
>   switch (action.type) {
>     case 'SET_FIELD':
>       return { ...state, [action.field]: action.value };
>     case 'SUBMIT_ORDER':
>       return { ...state, isSubmitted: true };
>     case 'RESET':
>       return initialTicket;
>     default:
>       return state;
>   }
> }
> 
> export function OrderTicketPanel() {
>   const [state, dispatch] = useReducer(orderTicketReducer, initialTicket);
> 
>   return (
>     <div className="ticket-panel">
>       <h3>Order Ticket ({state.orderType})</h3>
>       <input
>         value={state.symbol}
>         onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'symbol', value: e.target.value })}
>       />
>       <button onClick={() => dispatch({ type: 'SUBMIT_ORDER' })}>Submit Order</button>
>     </div>
>   );
> }
> 
> export function testOrderTicketReducer() {
>   const next = orderTicketReducer(initialTicket, { type: 'SET_FIELD', field: 'symbol', value: 'NVDA' });
>   console.assert(next.symbol === 'NVDA', 'Order ticket field update check');
> }
> ```
>
> #### Technical Explanation
> 1. **Dynamic Field Updates**: Uses computed property names (`[action.field]`) inside pure reducer functions.
> 2. **Single Dispatch Handler**: Consolidates multi-input update actions into unified `'SET_FIELD'` dispatches.
> 3. **Immutable Reset**: Restores initial state cleanly by returning the frozen `initialTicket` object reference.
> 4. **Isolated Function Verification**: Verifies reducer state calculations independently of React rendering.
> 
### Exercise 3: Healthcare Patient EHR Triage Assessment Reducer

**Scenario:** Create a hospital EHR triage assessment state machine using `useReducer`. Manage `heartRate`, `bloodPressure`, `triageLevel` (`'LOW'`, `'URGENT'`, `'CRITICAL'`).

**Requirements:**
1. Implement `triageReducer` calculating `triageLevel` dynamically on vital updates.
2. Provide `'UPDATE_VITALS'` action type.
3. Include runtime test assertions for triage severity updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useReducer } from 'react';
> 
> const initialTriage = { heartRate: 75, bloodPressure: 120, triageLevel: 'LOW' };
> 
> export function triageReducer(state, action) {
>   switch (action.type) {
>     case 'UPDATE_VITALS': {
>       const hr = action.payload.heartRate ?? state.heartRate;
>       const bp = action.payload.bloodPressure ?? state.bloodPressure;
>       let level = 'LOW';
>       if (hr > 120 || bp > 160) level = 'CRITICAL';
>       else if (hr > 100 || bp > 140) level = 'URGENT';
> 
>       return { heartRate: hr, bloodPressure: bp, triageLevel: level };
>     }
>     default:
>       return state;
>   }
> }
> 
> export function testTriageReducer() {
>   const res = triageReducer(initialTriage, { type: 'UPDATE_VITALS', payload: { heartRate: 130 } });
>   console.assert(res.triageLevel === 'CRITICAL', 'Triage reducer critical level check');
> }
> ```
>
> #### Technical Explanation
> 1. **Derived Triage Severity**: Calculates `triageLevel` synchronously within the pure reducer function based on vital thresholds.
> 2. **Nullish Coalescing Defense**: Merges partial vital payloads safely using `??` operators.
> 3. **Centralized Business Rules**: Houses medical severity logic inside testable reducer functions.
> 4. **Synchronous Test Assertion**: Tests health assessment logic deterministically.
> 
---

## 6. Related Terms

- [`useState` Hook](../level_02/use_state.md) — The fundamental state hook replaced by `useReducer` for complex state logic.
- [Immutability](../level_02/immutability.md) — The strict requirement for returning new state object snapshots.
- [State Management (Redux / Zustand)](state_management.md) — The global state store pattern mirrored locally by `useReducer`.
- [Rules of Hooks](../level_04/rules_of_hooks.md) — Mandatory execution rules governing `useReducer` declarations.

---

## 7. Key Takeaways

- `useReducer` manages complex, multi-variable component state using pure Reducer functions and Action dispatches.
- Executing `useReducer(reducer, initialState)` returns `[state, dispatch]`.
- Reducer functions MUST be pure calculations that return brand new object references (`return { ...state, key: val }`).
- Never perform asynchronous operations (`fetch`) or side-effects inside Reducer functions; execute side-effects in event handlers then dispatch pure actions.
- Use `useState` for simple independent primitives; reserve `useReducer` for complex state objects with interdependent properties.
