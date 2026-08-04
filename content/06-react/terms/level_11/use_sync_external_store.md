# `useSyncExternalStore` Hook

> **Level 11 — Ecosystem Libraries**
> React 18's built-in hook to safely subscribe to external data stores without concurrent rendering tearing.

---

## 1. Prerequisites
- [State Management](../level_06/state_management.md) — The concept of external data stores.
- [Rules of Hooks](../level_04/rules_of_hooks.md) — The usage guidelines governing hook execution.

---

## 2. Term Category
- **Core Hook**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
With the introduction of **Concurrent Rendering** in React 18, React can pause, yield, and resume rendering cycles.

This flexibility introduces a challenge if a component reads data from a source *outside* React's control, such as:
-   Global state managers (Redux, Zustand).
-   Vanilla JavaScript state stores.
-   Browser APIs (like `window.navigator.onLine` or `window.innerWidth`).

If React pauses a render chunk, the external data changes, and React resumes rendering, different parts of the component tree can render using different values. For example, a top-level header might render a user name as `"Alice"`, while a footer renders `"Bob"`.

This inconsistency is called **Tearing**: the UI displays split or inconsistent data, which can lead to layout issues or crashes.

To allow external stores to integrate with React's concurrent rendering pipeline, React 18 introduced the **`useSyncExternalStore`** hook:
-   **Tearing Prevention:** It ensures that updates from external stores are applied synchronously, preventing UI tearing.
-   **Standardized Subscription:** It provides a built-in API for library authors to link external state containers directly to React's rendering queue.

---

### (2) The Hook Signature
The hook accepts three arguments:
```javascript
const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
```
1.  **`subscribe`:** A function that receives a callback to register with the external store. It returns a cleanup function to unsubscribe when the component unmounts.
2.  **`getSnapshot`:** A function that returns a snapshot of the current state of the external store. React compares the snapshot return value between renders to determine if a re-render is required.
3.  **`getServerSnapshot` (Optional):** A function that returns the state snapshot during Server-Side Rendering (SSR) to prevent hydration mismatch errors.

---

### (3) Reality Metaphor
Imagine a trading floor displaying stock prices.
- **Tearing (Unsynchronized Screens):** You have three screens on the wall displaying the price of Stock X. The screens read the price directly from a live ticker feed (**the external store**). If the price updates from $10 to $12 while the screens are being updated, Screen 1 might display $10 while Screen 2 displays $12, causing confusion (**tearing**).
- **Snapshot Camera (`useSyncExternalStore`):** Before updating the screens, a camera takes a photo of the price ticker ($10). All screens are updated using this static photo (**rendering the snapshot**). Once the screens are updated, the photo is refreshed to $12, and a new synchronized update is scheduled, ensuring all screens display the same price.

---

### (4) React Code Example: Subscribing to Browser Connectivity Status

```jsx
import React, { useSyncExternalStore } from 'react';

// 1. Define the subscription handler
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  
  // Return cleanup function to remove event listeners
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

// 2. Define the snapshot reader
function getSnapshot() {
  return navigator.onLine; // Returns primitive boolean
}

// 3. Component consuming the external browser status
export default function ConnectionStatus() {
  // useSyncExternalStore handles the event listeners and updates state
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <div className={`status-banner ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? '🟢 Connected to Internet' : '🔴 You are Offline'}
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Returning a new object reference from `getSnapshot` on every execution

**The mistake:** Returning a new object inline from the `getSnapshot` callback:

```javascript
// BAD: Triggers infinite rendering loop!
const dimensions = useSyncExternalStore(
  subscribe,
  () => ({ width: window.innerWidth, height: window.innerHeight }) 
);
```

**Why it's wrong:** React compares snapshots using `Object.is` check. If `getSnapshot` returns a new object reference on every call, React assumes the state has changed and triggers a re-render. This causes another call to `getSnapshot`, which returns another new object, leading to an infinite render loop.

*Fix:* Return only primitive values (strings, numbers, booleans) from `getSnapshot`, or return a cached, memoized object:

```javascript
// GOOD: Return separate primitive values to keep references stable
const width = useSyncExternalStore(subscribe, () => window.innerWidth);
const height = useSyncExternalStore(subscribe, () => window.innerHeight);
```

---



### Mistake 2: Returning Newly Created Object/Array References in `getSnapshot` (Infinite Loop Trap)

**The mistake:** Writing `useSyncExternalStore(subscribe, () => ({ state: store.getState() }))`.

**Why it's wrong:** React uses `Object.is` to compare snapshots returned by `getSnapshot()`. Returning a new object `{}` on every call causes `useSyncExternalStore` to trigger an infinite re-render loop! Return immutable primitives or memoized objects.

*Incorrect:*
```javascript
useSyncExternalStore(sub, () => ({ data: store.get() })); // ❌ New object reference causes infinite loop!
```

*Fix:*
```javascript
useSyncExternalStore(sub, () => store.get()); // Return immutable cached snapshot reference
```

### Mistake 3: Failing to Provide a `getServerSnapshot` Parameter for Server-Side Rendering (SSR)

**The mistake:** Using `useSyncExternalStore(subscribe, getSnapshot)` in an SSR application without passing the 3rd `getServerSnapshot` argument.

**Why it's wrong:** Without `getServerSnapshot`, React cannot determine initial snapshot data during server rendering, throwing hydration mismatch errors during client hydration.

*Incorrect:*
```javascript
useSyncExternalStore(subscribe, getSnapshot); // ❌ Missing 3rd SSR server snapshot param!
```

*Fix:*
```javascript
useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
```

## 6. Practice Exercises

### Exercise 1: Custom Store Subscription

**Problem:** Complete the hook below to subscribe a component to a custom vanilla JavaScript state store using `useSyncExternalStore`:

```javascript
// externalStore.js
let state = { count: 0 };
const listeners = new Set();

export const store = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state.count; // Returns primitive count
  },
  increment() {
    state = { count: state.count + 1 };
    listeners.forEach(listener => listener());
  }
};

// CounterComponent.js
import React, { useSyncExternalStore } from 'react';
import { store } from './externalStore';

// Solution:
export default function CounterComponent() {
  const count = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return (
    <div>
      <p>Store Count: {count}</p>
      <button onClick={() => store.increment()}>Increment Store</button>
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Subscribing to Window Online Status Store

**Problem:** Subscribe to `navigator.onLine` store using `useSyncExternalStore`.

**Expected output:**
> [!check]- Answer
> ```text
> function subscribe(callback) { window.addEventListener('online', callback); window.addEventListener('offline', callback); return () => { window.removeEventListener('online', callback); window.removeEventListener('offline', callback); }; } function getSnapshot() { return navigator.onLine; } function useOnline() { return useSyncExternalStore(subscribe, getSnapshot); }
> ```
> ```javascript
> function subscribe(callback) {
>   window.addEventListener('online', callback);
>   window.addEventListener('offline', callback);
>   return () => {
>     window.removeEventListener('online', callback);
>     window.removeEventListener('offline', callback);
>   };
> }
> function getSnapshot() {
>   return navigator.onLine;
> }
> function useOnline() {
>   return useSyncExternalStore(subscribe, getSnapshot);
> }
> ```
>
> **Explanation:** `useSyncExternalStore` subscribes to external non-React stores without tearing bugs under Concurrent React.

---

### Exercise 3: Why useSyncExternalStore Exists

**Problem:** What concurrency issue does `useSyncExternalStore` solve for external state stores? (Prevents Tearing — inconsistent UI snapshots during concurrent renders).

**Expected output:**
> [!check]- Answer
> ```text
> Prevents Tearing (inconsistent UI snapshots during concurrent renders)
> ```
> ```text
> Prevents Tearing (inconsistent UI snapshots during concurrent renders)
> ```
>
> **Explanation:** `useSyncExternalStore` guarantees consistent synchronous store snapshots under Concurrent React.

## 7. Related Terms
- [State Management](../level_06/state_management.md) — The global state container architectures.
- [Zustand](../level_11/zustand.md) — The state library that uses this hook under the hood.

---

## 8. Key Takeaways
- `useSyncExternalStore` subscribes to external data sources.
- It prevents UI tearing during concurrent rendering.
- The hook requires a `subscribe` function and a `getSnapshot` function.
- `subscribe` registers event listeners and returns a cleanup function.
- `getSnapshot` must return a primitive value or a memoized object to prevent infinite rendering loops.
- `getServerSnapshot` prevents hydration errors during server-side rendering (SSR).
- It is primarily used by library authors to integrate state managers (Redux, Zustand) with React.
