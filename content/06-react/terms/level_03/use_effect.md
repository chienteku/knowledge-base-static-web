# `useEffect` Hook

> **Level 3 — Component Lifecycle & Effects**
> The primary React hook allowing functional components to execute side effects asynchronously after rendering and browser paint.

---

## 1. Prerequisites

- [Side Effects](side_effects.md) — Understanding external operations executed outside render cycles.
- [Component Lifecycle](component_lifecycle.md) — Understanding the mounting, updating, and unmounting rendering phases.

---

## 2. Term Category

**Core Hook (side effect primitive)**: `useEffect` is React's built-in hook for managing asynchronous side effects and synchronizing components with external non-React systems. Unlike class component lifecycle methods (`componentDidMount`, `componentDidUpdate`), `useEffect` operates post-render and post-paint, ensuring heavy operations do not block browser rendering updates.

Architecturally, `useEffect` accepts a callback function and an optional dependency array. It schedules execution into Fiber's post-commit phase, automatically handling setup and teardown cycles.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

React components must be pure functions during rendering: given identical props and state, they must return identical JSX markup without mutating global data or executing imperative actions.

However, real-world web applications require imperative interactions:
- Fetching API data from remote servers.
- Subscribing to WebSockets or browser DOM events.
- Synchronizing state with `localStorage` or `document.title`.

If these operations ran directly inside the component body, they would execute on every render frame, causing network floods, UI lag, and infinite re-render loops.

React introduced **`useEffect`** to solve this. It guarantees that effect callbacks execute **after React commits updates to the DOM and the browser paints the screen**, keeping the user interface smooth and responsive.

#### Execution Order Pipeline

1. **Render Phase:** React executes component functions and evaluates JSX.
2. **Commit Phase:** React updates real DOM nodes.
3. **Browser Paint:** Browser paints pixels onto the user's screen.
4. **Effect Execution:** React asynchronously executes `useEffect` callbacks.

### (2) Reality Metaphor

Imagine a restaurant dining experience.

- **Component Render (Kitchen Cook):** The chef prepares meals based on table orders. Cooking must remain focused purely on preparing food efficiently without leaving the kitchen.
- **Browser Paint (Food Delivery):** Waitstaff delivers hot food to the customer's table immediately. The customer starts eating without delay.
- **`useEffect` (Post-Meal Operations):** After food is served, staff complete background duties: sending table receipts to accounting, logging inventory metrics, and clearing dirty dishes. These background operations happen post-service without keeping the customer waiting for their meal.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState, useEffect } from 'react';

function SimpleTitleSync() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Clicked ${count} times`;
  }, [count]);

  return <button onClick={() => setCount(prev => prev + 1)}>Count: {count}</button>;
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect } from 'react';

function UserProfileCard({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('User not found');
        return res.json();
      })
      .then(data => {
        if (active) {
          setUser(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) return <div>Loading user profile...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="profile-card">
      <h3>{user.name}</h3>
      <p>Email: {user.email}</p>
    </div>
  );
}

export default UserProfileCard;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting the Dependency Array

**The mistake:** Writing `useEffect(() => { fetch(...) })` without supplying a second argument.

**Why it's wrong:** Omitting the dependency array causes the effect to run on **every single render**. If the effect updates state, it triggers a continuous infinite re-render loop.

*Incorrect:*
```jsx
useEffect(() => {
  fetchData().then(setData); // ❌ Missing dependency array: Infinite loop!
});
```

*Fix:*
```jsx
useEffect(() => {
  fetchData().then(setData); // ✅ Runs once on mount
}, []);
```

### Mistake 2: Transforming Data for Rendering Inside `useEffect`

**The mistake:** Updating a `filteredItems` state variable inside `useEffect` whenever `items` or `query` changes.

**Why it's wrong:** Updating state inside effects causes an unnecessary extra re-render cycle (Render 1 -> Effect -> Render 2). Derive transformed data directly during rendering or use `useMemo`.

*Incorrect:*
```jsx
useEffect(() => {
  setFilteredItems(items.filter(i => i.name.includes(query))); // ❌ Extra re-render!
}, [items, query]);
```

*Fix:*
```jsx
const filteredItems = items.filter(i => i.name.includes(query)); // ✅ Calculated during render
```

### Mistake 3: Marking `useEffect` Callback as `async`

**The mistake:** Defining `useEffect(async () => { await fetch(); }, [])`.

**Why it's wrong:** Async functions implicitly return a Promise. React requires effect callbacks to return either `undefined` or a synchronous teardown function.

*Incorrect:*
```jsx
useEffect(async () => {
  const res = await fetch('/api'); // ❌ Implicitly returns Promise!
}, []);
```

*Fix:*
```jsx
useEffect(() => {
  async function load() {
    const res = await fetch('/api');
  }
  load();
}, []);
```

---

## 5. Practice Exercises

### Exercise 1: IoT Temperature Alarm Monitor

**Scenario:** An industrial IoT console monitors temperature sensors. Synchronize browser tab title text to alert operators when temperatures cross threshold limits.

**Requirements:**
1. Accept `temperature` prop.
2. Update `document.title` to `"⚠️ HIGH TEMP: X°C"` when `temperature > 80`.
3. Reset `document.title` to `"Normal: X°C"` when within limits.
4. Execute via `useEffect`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect } from 'react';
> 
> export function TemperatureTitleSync({ temperature }) {
>   useEffect(() => {
>     if (temperature > 80) {
>       document.title = `⚠️ HIGH TEMP: ${temperature}°C`;
>     } else {
>       document.title = `Normal: ${temperature}°C`;
>     }
>   }, [temperature]);
> 
>   return <div>Current Monitored Temperature: {temperature}°C</div>;
> }
> ```
>
> #### Technical Explanation
> 1. **Post-Paint Sync**: `document.title` updates after browser paint without blocking UI rendering.
> 2. **Reactive Dependencies**: `[temperature]` ensures DOM title updates only when metrics change.
> 3. **Pure Render Context**: The component return remains clean JSX.
> 4. **Browser Integration**: Direct native API integration managed safely.
> 
### Exercise 2: Financial Live Price Feed Switcher

**Scenario:** A stock dashboard streams prices for selected stock symbols (`AAPL`, `GOOGL`). Manage WebSockets safely using `useEffect` setup and teardown callbacks.

**Requirements:**
1. Connect to WebSocket feed matching `symbol`.
2. Update price state on incoming messages.
3. Close previous socket on `symbol` update.
4. Render current streaming price.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function LiveStockFeed({ symbol }) {
>   const [price, setPrice] = useState(null);
> 
>   useEffect(() => {
>     let isCurrent = true;
>     const ws = new WebSocket(`wss://stocks.example.com/${symbol}`);
> 
>     ws.onmessage = (e) => {
>       if (isCurrent) {
>         const data = JSON.parse(e.data);
>         setPrice(data.price);
>       }
>     };
> 
>     return () => {
>       isCurrent = false;
>       ws.close();
>     };
>   }, [symbol]);
> 
>   return <div>Symbol: {symbol} | Price: ${price ?? 'Loading...'}</div>;
> }
> ```
>
> #### Technical Explanation
> 1. **Asynchronous Subscription**: Socket setup runs post-render.
> 2. **Teardown Security**: `ws.close()` terminates stale streams on symbol updates.
> 3. **Mounting Guard**: `isCurrent` prevents state updates on unmounted nodes.
> 4. **Dependency Syncing**: `[symbol]` orchestrates clean transition lifecycles.
> 
### Exercise 3: E-Commerce Window Resize Product Layout Adapter

**Scenario:** An e-commerce grid calculates visible column counts based on browser window width. Update columns dynamically using a window resize listener inside `useEffect`.

**Requirements:**
1. Track `window.innerWidth` in state.
2. Attach `resize` window listener in `useEffect`.
3. Compute columns based on width thresholds.
4. Remove window listener in effect cleanup return.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function ResponsiveProductGrid() {
>   const [width, setWidth] = useState(window.innerWidth);
> 
>   useEffect(() => {
>     const handleResize = () => setWidth(window.innerWidth);
>     window.addEventListener('resize', handleResize);
>     return () => window.removeEventListener('resize', handleResize);
>   }, []);
> 
>   const columns = width > 1024 ? 4 : width > 768 ? 3 : 1;
> 
>   return (
>     <div>
>       <p>Window Width: {width}px | Grid Columns: {columns}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Window Listener Binding**: `window.addEventListener` attaches safely post-mount.
> 2. **Teardown Hygiene**: `removeEventListener` prevents duplicate event executions.
> 3. **Derived Metrics**: Column count is computed during render from state.
> 4. **Event Optimization**: Keeps global browser event bindings clean.
> 
---

## 6. Related Terms

- [Dependency Array](dependency_array.md) — The watchlist controlling `useEffect` execution timing.
- [Cleanup Functions](cleanup_functions.md) — Teardown functions returned from `useEffect`.
- [Side Effects](side_effects.md) — External operations managed by `useEffect`.
- [`useLayoutEffect` Hook](use_layout_effect.md) — Synchronous layout measurement sibling to `useEffect`.

---

## 7. Key Takeaways

- `useEffect` executes side effects asynchronously **after** DOM updates and browser paint.
- It is the standard hook for data fetching, subscriptions, timers, and browser API sync.
- Always provide a dependency array to avoid unintended infinite re-render loops.
- Return a cleanup function to dismantle event listeners, timers, or network sockets.
- Never mark `useEffect` callbacks as `async`.
```

---

## File 8: `knowledge-base/06-react/terms/level_03/use_layout_effect.md`

```markdown
