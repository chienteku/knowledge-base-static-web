# State Management (Redux / Zustand)

> **Level 6 — Context & Global State**
> Architectural patterns and external library stores designed to manage complex, rapidly changing application-wide state with fine-grained subscription reactivity.

---

## 1. Prerequisites

- [The Context API](context_api.md) — Understanding built-in React context broadcasting and its reactivity limitations.
- [Prop Drilling](prop_drilling.md) — The data-flow anti-pattern solved by centralized state stores.
- [Unidirectional Data Flow](../level_02/unidirectional_flow.md) — The core state update architecture underpinning external store models.

---

## 2. Term Category

**Ecosystem (global state architecture)**: State Management in React refers to the architectural strategies and external ecosystem stores (such as Redux Toolkit, Zustand, or Jotai) used to manage complex, shared application data outside the React component tree.

While built-in React tools like `useState` and `useContext` handle local component state and low-frequency context distribution, external state managers maintain a centralized, decoupled data store. Component views subscribe to specific slices of store data using **Selector Functions**. When store data updates, external state managers use fine-grained reactivity to re-render *only* those specific components whose subscribed selector values changed, avoiding the tree-wide re-render cascades inherent in Context API updates.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

As React applications scale into enterprise applications (such as complex e-commerce platforms, real-time trading desks, or industrial monitoring dashboards), state management requirements grow rapidly. Passing state via props causes deep Prop Drilling, while putting high-frequency state into the built-in Context API causes severe performance bottlenecks because Context lacks selector-based fine-grained subscriptions.

To solve this, the React ecosystem created **State Management Libraries**:

- **Redux (Redux Toolkit):** Introduced predictable state updates using strict unidirectional cycles: components dispatch **Actions**, pure **Reducer** functions compute new immutable state snapshots in a centralized **Store**, and components listen via `useSelector`.
- **Zustand:** Introduced a modern, lightweight, hook-centric alternative. Developers define stores as custom hooks without Redux action/reducer boilerplate, while preserving selector subscriptions for high-performance rendering.

These libraries decouple business logic from UI rendering, enable time-travel debugging, simplify state persistence, and guarantee fine-grained reactivity for high-frequency application data.

### (2) Reality Metaphor

Imagine a central stock exchange ticker broadcast system.

If the stock exchange used the **Context API**, every time a single stock price updated (e.g., AAPL moved $0.01), the central exchange would sound a massive siren (**triggering a context update**), forcing every single investor in the city to stop what they are doing, re-examine their entire financial portfolio (**re-rendering subscriber components**), and check if their specific stocks changed.

If the stock exchange used a **State Management Library with Selectors (Redux / Zustand)**, investors hire specialized automated trading bots (**Selector Functions**) tuned strictly to specific tickers. When AAPL updates, *only* the bot listening to AAPL wakes up to execute a trade. Investors holding TSLA or NVDA remain completely undisturbed (**zero unnecessary re-renders**).

### (3) React Code Examples

#### Short Snippet

```jsx
import { create } from 'zustand';

// 1. Create a global Zustand store outside the React component tree
export const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 })
}));

// 2. Component subscribes strictly to the 'count' primitive via selector!
function CounterDisplay() {
  const count = useCounterStore((state) => state.count);
  return <h1>Current Count: {count}</h1>;
}
```

#### Fuller Example

```jsx
import React from 'react';
import { create } from 'zustand';

// 1. Define global Telemetry Store using Zustand
const useTelemetryStore = create((set) => ({
  sensors: [
    { id: 's1', name: 'Pressure Sensor', val: 101.3, status: 'NORMAL' },
    { id: 's2', name: 'Temperature Sensor', val: 88.4, status: 'WARNING' }
  ],
  systemAlerts: 1,

  // Action updaters
  updateSensorValue: (id, newVal) =>
    set((state) => ({
      sensors: state.sensors.map((s) =>
        s.id === id
          ? { ...s, val: newVal, status: newVal > 90 ? 'WARNING' : 'NORMAL' }
          : s
      )
    })),

  clearAlerts: () => set({ systemAlerts: 0 })
}));

// 2. Component A: Subscribes ONLY to systemAlerts
function AlertHeader() {
  // Selector guarantees component re-renders strictly when systemAlerts changes!
  const systemAlerts = useTelemetryStore((state) => state.systemAlerts);
  const clearAlerts = useTelemetryStore((state) => state.clearAlerts);

  return (
    <header className="alert-header">
      <h3>Active System Alerts: {systemAlerts}</h3>
      {systemAlerts > 0 && <button onClick={clearAlerts}>Dismiss Alerts</button>}
    </header>
  );
}

// 3. Component B: Subscribes ONLY to the sensors array
function SensorList() {
  const sensors = useTelemetryStore((state) => state.sensors);
  const updateValue = useTelemetryStore((state) => state.updateSensorValue);

  return (
    <ul className="sensor-list">
      {sensors.map((sensor) => (
        <li key={sensor.id} className={`sensor-item ${sensor.status.toLowerCase()}`}>
          <span>{sensor.name}: {sensor.val}</span>
          <button onClick={() => updateValue(sensor.id, (sensor.val + 5).toFixed(1))}>
            + Increase Simulation Value
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <div className="telemetry-app">
      <AlertHeader />
      <SensorList />
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Subscribing to the Entire Store Object Instead of Using Selector Functions

**The mistake:** Writing `const state = useStore()` without specifying a selector function.

**Why it's wrong:** Grabbing the entire store object destroys fine-grained reactivity! When any single property anywhere in the global store changes, your component receives a new state object reference and is forced to re-render, even if it only uses a single untouched variable.

*Incorrect:*
```jsx
function BadComponent() {
  // ❌ Subscribes to the entire store object; re-renders on ANY store change!
  const state = useTelemetryStore();
  return <div>Alerts: {state.systemAlerts}</div>;
}
```

*Fix:*
```jsx
function GoodComponent() {
  // Use selector function to pull out only the specific primitive needed
  const systemAlerts = useTelemetryStore((state) => state.systemAlerts);
  return <div>Alerts: {systemAlerts}</div>;
}
```

### Mistake 2: Storing Local View UI State in Global Stores

**The mistake:** Putting transient form inputs, modal open/close booleans, or dropdown toggle states into global Redux or Zustand stores.

**Why it's wrong:** Global state stores should be reserved for shared application data (user auth, active cart, telemetry readings). Storing local component UI toggles in global stores bloats store files, complicates state resets, and adds unnecessary architectural overhead. Use local `useState`.

*Incorrect:*
```jsx
// ❌ Storing local modal toggle boolean in global Redux store!
const useGlobalStore = create(() => ({ isModalOpen: false }));
```

*Fix:*
```jsx
// Colocate local UI state using standard useState hook
function ModalContainer() {
  const [isOpen, setIsOpen] = useState(false);
  return <button onClick={() => setIsOpen(true)}>Open Modal</button>;
}
```

### Mistake 3: Confusing Client UI State with Server API Cache Data

**The mistake:** Writing manual Redux reducers and actions to fetch, cache, deduplicate, and invalidate server REST API responses manually.

**Why it's wrong:** Server API data has different requirements (background refetching, cache expiration, optimistic updates, request deduplication) than client UI state. Managing API caching manually in Redux leads to massive boilerplate. Use **React Query (TanStack Query)** or **SWR** for server cache management, reserving Zustand/Redux for client UI state.

*Incorrect:*
```jsx
// Writing 100 lines of custom Redux reducers for API cache invalidation
```

*Fix:*
```jsx
// Use React Query for server cache data and Zustand for client UI state
const { data, isLoading } = useQuery(['user'], fetchUserData);
```

---

## 5. Practice Exercises

### Exercise 1: Industrial IoT Gateway Telemetry Store (Zustand)

**Scenario:** Create a Zustand store for an industrial IoT monitoring system managing sensor telemetry streams (`temperature`, `pressure`, `isEmergency`). Components subscribe to individual metrics to optimize render speed.

**Requirements:**
1. Define a Zustand store `useIoTStore`.
2. Include state updaters for `updateTemp`, `updatePressure`, and `triggerEmergency`.
3. Create 2 separate subscriber components using selector functions.
4. Include runtime test assertions for store updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { create } from 'zustand';
> 
> export const useIoTStore = create((set) => ({
>   temperature: 22.0,
>   pressure: 101.3,
>   isEmergency: false,
> 
>   setTemperature: (temp) => set({ temperature: temp }),
>   setPressure: (press) => set({ pressure: press }),
>   triggerEmergency: () => set({ isEmergency: true })
> }));
> 
> export function TemperatureGauge() {
>   const temp = useIoTStore((state) => state.temperature);
>   return <div className="gauge">Temperature: {temp}°C</div>;
> }
> 
> export function PressureGauge() {
>   const pressure = useIoTStore((state) => state.pressure);
>   return <div className="gauge">Pressure: {pressure} kPa</div>;
> }
> 
> export function testIoTStore() {
>   useIoTStore.getState().setTemperature(45.0);
>   console.assert(useIoTStore.getState().temperature === 45.0, 'Zustand temp update test');
> }
> ```
>
> #### Technical Explanation
> 1. **Selector Subscriptions**: `TemperatureGauge` subscribes strictly to `state.temperature`, ignoring pressure updates entirely.
> 2. **Decoupled Store Definition**: Creates store instance outside React render lifecycles.
> 3. **Direct Store Testing**: Uses `useIoTStore.getState()` to execute synchronous assertions without mounting React trees.
> 4. **Fine-Grained Re-rendering**: Eliminates re-render overhead across un-subscribed sibling component nodes.
> 
### Exercise 2: Financial Trading Order Book Store (Zustand)

**Scenario:** Implement an institutional stock trading order book store managing `bids` array and `lastTradePrice`. Component widgets subscribe strictly to required slices.

**Requirements:**
1. Create `useOrderBookStore` with `addBid` and `setLastPrice` updaters.
2. Implement selector functions for `bids` and `lastTradePrice`.
3. Include runtime test assertions for order book state updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { create } from 'zustand';
> 
> export const useOrderBookStore = create((set) => ({
>   bids: [{ id: 'b1', price: 185.0, qty: 100 }],
>   lastTradePrice: 185.25,
> 
>   addBid: (bid) => set((state) => ({ bids: [...state.bids, bid] })),
>   setLastTradePrice: (price) => set({ lastTradePrice: price })
> }));
> 
> export function LastPriceDisplay() {
>   const price = useOrderBookStore((s) => s.lastTradePrice);
>   return <div className="ticker-badge">Last Price: ${price}</div>;
> }
> 
> export function testOrderBookStore() {
>   useOrderBookStore.getState().setLastTradePrice(190.0);
>   console.assert(useOrderBookStore.getState().lastTradePrice === 190.0, 'Order book price update check');
> }
> ```
>
> #### Technical Explanation
> 1. **Isolated Ticker Re-rendering**: `LastPriceDisplay` re-renders strictly when `lastTradePrice` updates, ignoring bid list additions.
> 2. **Immutable Array Updaters**: Uses spread syntax (`[...state.bids, bid]`) inside store updater callbacks.
> 3. **Zero Context Overhead**: Eliminates top-level Provider wrapping requirements.
> 4. **Selector Efficiency**: Prevents trade execution panels from re-rendering during high-frequency ticker updates.
> 
### Exercise 3: Healthcare Patient EHR Bed Allocation Store (Zustand)

**Scenario:** Build a hospital bed management store tracking `occupiedBeds` count and `availableBeds` list.

**Requirements:**
1. Create `useBedStore` with `occupyBed` and `vacateBed` actions.
2. Implement selector subscriptions for `occupiedBeds`.
3. Add runtime assertions for bed count state updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { create } from 'zustand';
> 
> export const useBedStore = create((set) => ({
>   occupiedCount: 12,
>   totalBeds: 20,
> 
>   occupyBed: () => set((state) => ({ occupiedCount: Math.min(state.occupiedCount + 1, state.totalBeds) })),
>   vacateBed: () => set((state) => ({ occupiedCount: Math.max(state.occupiedCount - 1, 0) }))
> }));
> 
> export function BedOccupancyHeader() {
>   const occupied = useBedStore((s) => s.occupiedCount);
>   const total = useBedStore((s) => s.totalBeds);
>   return <h3>Hospital Occupancy: {occupied} / {total} Beds</h3>;
> }
> 
> export function testBedStore() {
>   useBedStore.getState().occupyBed();
>   console.assert(useBedStore.getState().occupiedCount === 13, 'Bed occupancy update test');
> }
> ```
>
> #### Technical Explanation
> 1. **Bounded State Transitions**: Clamps maximum and minimum bed counts inside store updater functions (`Math.min`, `Math.max`).
> 2. **Atomic Selectors**: Pulls primitive numbers (`occupiedCount`, `totalBeds`) to maximize rendering stability.
> 3. **Decoupled Business Logic**: Houses domain logic inside store updaters rather than UI components.
> 4. **Independent Store Verification**: Tests state transitions directly via synchronous `getState()` methods.
> 
---

## 6. Related Terms

- [The Context API](context_api.md) — Built-in React context broadcasting mechanism.
- [`useReducer` Hook](use_reducer.md) — Local component state hook implementing the Redux action/reducer pattern.
- [Prop Drilling](prop_drilling.md) — Passing props down component trees without global stores.
- [React Query (TanStack Query) / SWR](../level_11/react_query.md) — Specialized library for managing server API cache data.

---

## 7. Key Takeaways

- External State Managers (Redux, Zustand) manage shared application data in centralized stores outside the React tree.
- Unlike Context, state managers support fine-grained reactivity via Selector Functions, re-rendering only components whose subscribed values change.
- Redux uses strict Actions, Reducers, and a immutable Store; Zustand provides a lightweight, hook-centric alternative.
- Always use Selector Functions (`useStore(state => state.val)`) to subscribe to specific primitive values rather than entire store objects.
- Use local `useState` for transient UI toggles and React Query for server API cache data; reserve global stores for shared client app state.
