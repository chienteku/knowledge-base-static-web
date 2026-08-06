# `useSyncExternalStore` Hook

> **Level 11 — Ecosystem Libraries**
> A built-in React 18 hook for subscribing components to external non-React data stores safely without concurrent rendering tearing.

---

## 1. Prerequisites

- [State Management (Redux / Zustand)](../level_06/state_management.md) — The concept of external data stores operating outside React's Fiber tree.
- [Rules of Hooks](../level_04/rules_of_hooks.md) — The usage guidelines governing hook execution and lifecycle subscriptions.

---

## 2. Term Category

**Core Hook (external store synchronization)**: `useSyncExternalStore` is a built-in React 18 hook designed to subscribe React components to state stores located outside React's internal fiber tree (such as Redux, Zustand, vanilla JavaScript event emitters, or browser web APIs like `navigator.onLine` and `window.innerWidth`).

With the introduction of **Concurrent Rendering** in React 18, React can pause, yield, and resume rendering cycles to prioritize urgent user interactions. If a component reads from an external non-React store that mutates while React is paused mid-render, different parts of the component tree can render using different store snapshots. This inconsistency is called **Tearing**. `useSyncExternalStore` prevents tearing by enforcing synchronous, consistent snapshot evaluations during concurrent renders.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Before React 18, subscribing components to external JavaScript stores was typically implemented using `useEffect` + `useState`:
```javascript
// Pre-React 18 subscription pattern (Vulnerable to Tearing in Concurrent React)
const [state, setState] = useState(externalStore.getState());

useEffect(() => {
  const unsubscribe = externalStore.subscribe(() => {
    setState(externalStore.getState());
  });
  return unsubscribe;
}, []);
```

While this pattern worked under React 17's synchronous rendering pipeline, it fails under React 18's Concurrent Architecture:
1. **Tearing Risk:** If `externalStore` mutates while React pauses rendering mid-tree, components rendered before the pause show Old State, while components rendered after the pause show New State, causing visible UI tearing.
2. **Hydration Mismatch:** Server-Side Rendered (SSR) components reading browser APIs often render mismatched snapshots on initial client hydration.

React 18 introduced `useSyncExternalStore` to resolve both issues:
- **`subscribe`:** Registers a subscription callback with the external store and returns an unsubscribe function.
- **`getSnapshot`:** Returns a snapshot of the current state of the external store. React compares snapshot return values using `Object.is` check to determine if re-rendering is needed.
- **`getServerSnapshot` (Optional):** Provides a static snapshot during Server-Side Rendering (SSR) to prevent hydration mismatches.

### (2) Reality Metaphor

Imagine a electronic stock ticker wall at a stock exchange.

- **Unsynchronized Tearing (Uncontrolled Screen Refresh):** Three giant digital screens on the wall display the price of Stock X. The screens read from a live ticker wire (**external non-React store**). If the price updates from $100 to $105 while the electrician is updating the screens one by one, Screen 1 displays $100 while Screen 2 displays $105, causing confusion for traders on the floor (**UI tearing bug**).
- **Camera Snapshot Sync (`useSyncExternalStore`):** Before updating any screen, a camera takes a high-speed frozen snapshot photo of the ticker ($100) (**`getSnapshot()`**). All three screens are updated simultaneously using this static photo. Once all screens match $100, the camera takes a new photo ($105), ensuring all screens update in perfect sync without displaying split numbers (**preventing tearing**).

### (3) React Code Examples

#### Short Snippet

```jsx
// ConnectionStatus.jsx (React 18 useSyncExternalStore)
import { useSyncExternalStore } from 'react';

// 1. Subscription function registering event listeners
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

// 2. Snapshot reader function
function getSnapshot() {
  return navigator.onLine; // Returns primitive boolean
}

export function ConnectionStatus() {
  // Synchronously subscribes to browser network status without tearing
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <div className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? '🟢 Online' : '🔴 Offline'}
    </div>
  );
}
```

#### Fuller Example

```jsx
// VanillaStore.js (External Non-React State Store)
let currentState = { count: 0 };
const listeners = new Set();

export const vanillaStore = {
  getState() {
    return currentState;
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  increment() {
    currentState = { count: currentState.count + 1 };
    listeners.forEach(listener => listener());
  }
};

// CounterComponent.jsx
import React, { useSyncExternalStore, useCallback } from 'react';
import { vanillaStore } from './VanillaStore';

export function CounterComponent() {
  // Subscribe to external store
  const subscribe = useCallback((callback) => vanillaStore.subscribe(callback), []);
  const getSnapshot = useCallback(() => vanillaStore.getState().count, []);

  const count = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <div className="store-card">
      <h3>Vanilla JS Store Count: {count}</h3>
      <button onClick={() => vanillaStore.increment()}>Increment External Store</button>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Returning a newly instantiated object or array from `getSnapshot()` on every execution

**The mistake:** Instantiating a new object `{ width: window.innerWidth }` inside the `getSnapshot` callback.

**Why it's wrong:** React compares snapshots returned by `getSnapshot()` using `Object.is` check. If `getSnapshot()` returns a new object reference on every call, React assumes the store state has changed and triggers a re-render. This causes another call to `getSnapshot()`, which returns another new object, triggering an infinite render loop!

*Incorrect:*
```javascript
// ❌ Triggers infinite rendering loop! New object reference returned every call!
const dimensions = useSyncExternalStore(
  subscribe,
  () => ({ width: window.innerWidth })
);
```

*Fix:*
```javascript
// Return primitive values (strings, numbers, booleans) or cached immutable object references
const width = useSyncExternalStore(
  subscribe,
  () => window.innerWidth // Primitive number reference is stable
);
```

### Mistake 2: Omitting the 3rd `getServerSnapshot` parameter in SSR applications

**The mistake:** Using `useSyncExternalStore(subscribe, getSnapshot)` in an SSR (Server-Side Rendering) application without providing the 3rd `getServerSnapshot` argument.

**Why it's wrong:** During SSR on a Node.js server, browser APIs (like `window` or `navigator`) are undefined. Without `getServerSnapshot`, React cannot determine initial HTML state on the server, throwing hydration mismatch warnings during client hydration.

*Incorrect:*
```javascript
// ❌ Missing 3rd SSR server snapshot param! Throws hydration mismatch in SSR!
const isOnline = useSyncExternalStore(subscribe, getSnapshot);
```

*Fix:*
```javascript
// Provide static server snapshot fallback for SSR
const isOnline = useSyncExternalStore(
  subscribe,
  getSnapshot,
  () => true // SSR server snapshot fallback
);
```

### Mistake 3: Defining inline `subscribe` or `getSnapshot` functions directly inside component render bodies

**The mistake:** Writing inline arrow functions for `subscribe` or `getSnapshot` without memoizing them or defining them outside the component.

**Why it's wrong:** Passing un-memoized inline functions causes `useSyncExternalStore` to resubscribe to the external store on every single component render pass.

*Incorrect:*
```jsx
// ❌ Re-subscribes on every component render pass!
function App() {
  const state = useSyncExternalStore(
    (cb) => store.subscribe(cb), // Inline function re-created every render!
    () => store.get()
  );
}
```

*Fix:*
```jsx
// Define subscribe and getSnapshot functions outside component scope or with useCallback
function subscribe(cb) { return store.subscribe(cb); }
function getSnapshot() { return store.get(); }

function App() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Mobile Window Orientation Store Subscription

**Scenario:** Create a custom React hook `useWindowDimensions` that subscribes to browser resize events using `useSyncExternalStore` to track screen width without tearing or infinite rendering loops.

**Requirements:**
1. Define `subscribe` function adding/removing `'resize'` event listeners.
2. Define `getSnapshot` returning primitive `window.innerWidth`.
3. Provide `getServerSnapshot` fallback returning default `1024`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import { useSyncExternalStore } from 'react';
>
> function subscribe(callback) {
>   window.addEventListener('resize', callback);
>   return () => window.removeEventListener('resize', callback);
> }
>
> function getSnapshot() {
>   return window.innerWidth; // Returns primitive number
> }
>
> function getServerSnapshot() {
>   return 1024; // Static fallback for SSR server render
> }
>
> export function useWindowWidth() {
>   return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
> }
>
> export function WindowWidthDisplay() {
>   const width = useWindowWidth();
> 
>   return (
>     <div className="width-card">
>       <h3>Viewport Width: {width}px</h3>
>       <p>Layout Mode: {width < 768 ? 'Mobile' : 'Desktop'}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Primitive Snapshot Stability**: `getSnapshot()` returns primitive `window.innerWidth` (number), preventing reference instability loops.
> 2. **Clean Event Cleanup**: `subscribe` function returns cleanup callback `removeEventListener`.
> 3. **SSR Hydration Guard**: `getServerSnapshot` returns static fallback `1024` during server render to prevent hydration errors.
> 4. **Tearing Prevention**: Guarantees all layout components read the exact same window width during concurrent React renders.
> 
### Exercise 2: Financial Trading Order Book Vanilla Store Subscription

**Scenario:** Subscribe a React trading component to an external vanilla JavaScript market depth store using `useSyncExternalStore`.

**Requirements:**
1. Define external `marketStore` object with `subscribe` and `getSnapshot`.
2. Ensure `getSnapshot` returns immutable price snapshot.
3. Render live market price in component.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import { useSyncExternalStore } from 'react';
>
> // External vanilla JS market store
> let currentPrice = 185.50;
> const listeners = new Set();
>
> export const marketStore = {
>   subscribe(callback) {
>     listeners.add(callback);
>     return () => listeners.delete(callback);
>   },
>   getSnapshot() {
>     return currentPrice;
>   },
>   updatePrice(newPrice) {
>     currentPrice = newPrice;
>     listeners.forEach(cb => cb());
>   }
> };
>
> export function LiveTickerDisplay() {
>   const price = useSyncExternalStore(marketStore.subscribe, marketStore.getSnapshot);
> 
>   return (
>     <div className="ticker-card">
>       <h4>AAPL Live Stock Quote</h4>
>       <p className="price-tag">${price.toFixed(2)}</p>
>       <button onClick={() => marketStore.updatePrice(price + 0.50)}>
>         Simulate Market Tick (+$0.50)
>       </button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **External Non-React Integration**: Links vanilla JavaScript event emitter store directly to React rendering queue.
> 2. **Synchronous Snapshot Check**: `Object.is` check evaluates primitive `currentPrice` number.
> 3. **Zero Tearing**: Component receives atomic price updates without tearing across concurrent sub-trees.
> 4. **Encapsulated Subscription**: Handles subscription lifecycles automatically without manual `useEffect` dependencies.
> 
### Exercise 3: E-Commerce Media Query Listener

**Scenario:** Implement a custom hook `useMediaQuery(query)` that uses `useSyncExternalStore` to subscribe to browser `window.matchMedia` query updates (e.g. `(prefers-color-scheme: dark)`).

**Requirements:**
1. Create `useMediaQuery` accepting CSS media query string.
2. Register `matchMedia` listener callback inside `subscribe`.
3. Return boolean match state.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import { useSyncExternalStore, useCallback } from 'react';
>
> export function useMediaQuery(query) {
>   const subscribe = useCallback((callback) => {
>     const matchMedia = window.matchMedia(query);
>     matchMedia.addEventListener('change', callback);
>     return () => matchMedia.removeEventListener('change', callback);
>   }, [query]);
> 
>   const getSnapshot = useCallback(() => {
>     return window.matchMedia(query).matches;
>   }, [query]);
> 
>   const getServerSnapshot = useCallback(() => false, []);
> 
>   return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
> }
>
> export function ThemePreferenceCard() {
>   const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
> 
>   return (
>     <div className={`theme-card ${isDarkMode ? 'dark' : 'light'}`}>
>       <p>System Preference: {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Dynamic Media Subscription**: `matchMedia.addEventListener('change', callback)` registers OS media query changes.
> 2. **Memoized Handlers**: `useCallback` memoizes `subscribe` and `getSnapshot` based on `query` string parameter.
> 3. **Boolean Snapshot**: Returns primitive boolean `matches` value to maintain snapshot reference stability.
> 4. **Cross-Component Consistency**: All components calling `useMediaQuery` receive perfectly synchronized updates.
> 
---

## 6. Related Terms

- [State Management (Redux / Zustand)](../level_06/state_management.md) — The global state container architectures integrated by `useSyncExternalStore`.
- [Rules of Hooks](../level_04/rules_of_hooks.md) — Guidelines governing hook execution.
- [Zustand](zustand.md) — State management library utilizing `useSyncExternalStore` under the hood.
- [Redux](redux.md) — Global state container library integrated via `useSyncExternalStore`.

---

## 7. Key Takeaways

- `useSyncExternalStore` subscribes components to external non-React state stores safely without UI tearing.
- Replaces legacy `useEffect` + `useState` subscription patterns vulnerable to concurrent rendering bugs.
- Requires `subscribe` and `getSnapshot` functions.
- `getSnapshot()` MUST return a primitive value or memoized immutable object to prevent infinite re-render loops.
- Supply the optional 3rd `getServerSnapshot` argument in SSR applications to prevent hydration mismatch warnings.
- Primarily used by state library authors (Redux, Zustand) and custom browser API hook developers.
