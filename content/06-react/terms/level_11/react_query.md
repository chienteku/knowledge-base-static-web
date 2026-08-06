# React Query (TanStack Query) / SWR

> **Level 11 — Ecosystem Libraries**
> Industry-standard data-fetching libraries that manage server state, caching, background refetching, and synchronization.

---

## 1. Prerequisites

- [Side Effects](../level_03/side_effects.md) — Asynchronous data fetching is a side effect managed declaratively by React Query.
- [`useEffect` Hook](../level_03/use_effect.md) — The manual hook pattern that React Query replaces for API interactions.

---

## 2. Term Category

**Ecosystem (async state manager)**: React Query (part of TanStack Query) and SWR are specialized asynchronous server state management libraries for React. While client state managers (like Redux or Zustand) handle synchronous UI state owned by the browser application, React Query manages **Server State**—data hosted remotely on backend databases or microservices that can go out of date without client knowledge.

React Query replaces manual `useEffect` data-fetching logic by providing specialized custom hooks (`useQuery`, `useMutation`). It automatically manages cache indexing, loading/error states, duplicate request deduplication, background refetching upon window refocus, retries, optimistic updates, and garbage collection.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional Client-Side Rendered React applications, fetching API data required writing repetitive, error-prone imperative boilerplate inside every component:
```jsx
// Legacy useEffect + useState data fetching pattern
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  let isMounted = true;
  fetch('/api/users')
    .then(res => res.json())
    .then(resData => {
      if (isMounted) {
        setData(resData);
        setIsLoading(false);
      }
    })
    .catch(err => {
      if (isMounted) {
        setError(err);
        setIsLoading(false);
      }
    });
  return () => { isMounted = false; }; // Race condition handling
}, []);
```

This manual approach introduces severe production issues:
1. **No Shared Cache:** If two components read the same user data, both fire separate redundant network requests.
2. **Stale Data:** Data downloaded into local component state stays static; if another user updates the database, the screen displays stale data indefinitely.
3. **Complex Boilerplate:** Every single data component requires 20+ lines of identical state setup.

React Query completely eliminates this boilerplate. Utilizing a **Stale-While-Revalidate (SWR)** caching strategy, `useQuery` immediately serves cached data to the screen (zero loading spinner latency) while background-refetching fresh data from the server and updating the UI seamlessly.

### (2) Reality Metaphor

Imagine a library reference desk.

- **Manual `useEffect` (Hiring an Investigator Every Visit):** Every time you enter a room and want to check a book's availability, you hire a research assistant (**write `useEffect` & `fetch`**). The assistant puts on a coat, walks across town to the central library (**network request**), searches the stacks, and walks back 15 minutes later (**high latency**). If you walk into another room and ask the same question, a second assistant is dispatched to walk across town again (**duplicate fetch**).
- **React Query (Local Desktop Cache with Radio Wire):** You walk into the room. A local reference ledger sits on your desk (**global React Query cache**). You open the ledger and read the answer instantly (**sub-millisecond cache read**). Meanwhile, a silent radio operator on the desk calls the central library in the background (**background refetch**). If the library reports a book was checked out, the operator updates your ledger, and your display refreshes silently.

### (3) React Code Examples

#### Short Snippet

```jsx
// UserList.jsx (TanStack React Query v5)
import { useQuery } from '@tanstack/react-query';

export function UserList() {
  // useQuery handles loading, error, caching, and background refetching automatically
  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(res => res.json())
  });

  if (isLoading) return <div className="spinner">Loading users...</div>;
  if (isError) return <div className="error">Error: {error.message}</div>;

  return (
    <ul className="user-list">
      {users.map(user => (
        <li key={user.id}>{user.name} ({user.email})</li>
      ))}
    </ul>
  );
}
```

#### Fuller Example

```jsx
// PatientVitalsTracker.jsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchPatientVitals(patientId) {
  const res = await fetch(`/api/patients/${patientId}/vitals`);
  if (!res.ok) throw new Error('Failed to fetch patient vitals');
  return res.json();
}

async function updateVitalsBaseline({ patientId, newHr }) {
  const res = await fetch(`/api/patients/${patientId}/vitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ heartRate: newHr })
  });
  if (!res.ok) throw new Error('Failed to update vitals');
  return res.json();
}

export function PatientVitalsTracker({ patientId }) {
  const queryClient = useQueryClient();

  // 1. Fetch server state with unique query key
  const { data: vitals, isLoading, isError } = useQuery({
    queryKey: ['patient-vitals', patientId],
    queryFn: () => fetchPatientVitals(patientId),
    staleTime: 10000 // Data remains fresh for 10 seconds before background refetch
  });

  // 2. Mutation handler for updating server state
  const mutation = useMutation({
    mutationFn: updateVitalsBaseline,
    onSuccess: () => {
      // Invalidate query cache to trigger automatic refetching
      queryClient.invalidateQueries({ queryKey: ['patient-vitals', patientId] });
    }
  });

  const handleUpdate = () => {
    mutation.mutate({ patientId, newHr: 72 });
  };

  if (isLoading) return <p>Loading patient telemetry...</p>;
  if (isError) return <p>Telemetry stream offline.</p>;

  return (
    <div className="vitals-card">
      <h3>Patient #{patientId} Vitals</h3>
      <p>Heart Rate: {vitals.heartRate} BPM</p>
      <p>Blood Pressure: {vitals.bpSys}/{vitals.bpDia} mmHg</p>

      <button 
        onClick={handleUpdate} 
        disabled={mutation.isPending}
        className="btn-update"
      >
        {mutation.isPending ? 'Syncing...' : 'Reset HR Baseline (72 BPM)'}
      </button>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing server API data in global client state stores (Redux or Zustand)

**The mistake:** Fetching API data and immediately saving the array response into a global Redux or Zustand store.

**Why it's wrong:** API data is **Server State** (remotely owned data subject to staleness). Redux/Zustand are designed for **Client State** (locally owned UI state like modal visibility or dark mode). Storing API data in Redux forces developers to manually re-implement caching, loading, refetching, and normalization logic.

*Incorrect:*
```jsx
// ❌ Anti-pattern: Storing server API data manually inside global Redux!
useEffect(() => {
  fetch('/api/users').then(res => res.json()).then(data => {
    dispatch(setGlobalUsers(data));
  });
}, []);
```

*Fix:*
```jsx
// Let React Query handle server state caching automatically
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
```

### Mistake 2: Using non-unique query keys for parameterized queries

**The mistake:** Using a static `queryKey: ['user']` for queries that accept dynamic parameters (e.g. `userId`).

**Why it's wrong:** React Query indexes its global cache based on `queryKey`. Omitting reactive variables (like `userId`) causes all users to share the exact same cached response object.

*Incorrect:*
```javascript
// ❌ Static key: user #1 and user #2 will return identical cached data!
useQuery({ queryKey: ['user'], queryFn: () => fetchUser(userId) });
```

*Fix:*
```javascript
// Include reactive parameters in the queryKey array
useQuery({ queryKey: ['user', userId], queryFn: () => fetchUser(userId) });
```

### Mistake 3: Forgetting to invalidate queries via `queryClient.invalidateQueries()` after mutations

**The mistake:** Executing a `useMutation` write operation (e.g., adding a new item) without invalidating the relevant query key cache.

**Why it's wrong:** After a mutation succeeds on the backend database, React Query's cached list remains stale until explicitly invalidated or refetched.

*Incorrect:*
```javascript
// ❌ Cache remains stale after mutation succeeds!
const mutation = useMutation({ mutationFn: createTodo });
```

*Fix:*
```javascript
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    // Purge stale cache and refetch fresh list automatically
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  }
});
```

---

## 5. Practice Exercises

### Exercise 1: IoT Turbine Telemetry Query with Refetch Interval

**Scenario:** Develop an IoT telemetry dashboard component that queries live turbine metrics using React Query, polling the backend API automatically every 5 seconds.

**Requirements:**
1. Use `useQuery` with `queryKey: ['turbine-telemetry', turbineId]`.
2. Configure `refetchInterval: 5000` (5-second polling).
3. Render live RPM and temperature metrics.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import { useQuery } from '@tanstack/react-query';
>
> async function fetchTurbineMetrics(turbineId) {
>   const res = await fetch(`/api/iot/turbines/${turbineId}`);
>   if (!res.ok) throw new Error('Telemetry fetch failed');
>   return res.json();
> }
>
> export function TurbineTelemetryWidget({ turbineId = 't-401' }) {
>   const { data: metrics, isLoading, isError, isFetching } = useQuery({
>     queryKey: ['turbine-telemetry', turbineId],
>     queryFn: () => fetchTurbineMetrics(turbineId),
>     refetchInterval: 5000 // Polling every 5 seconds
>   });
> 
>   if (isLoading) return <p>Connecting to turbine sensors...</p>;
>   if (isError) return <p>Error: Telemetry stream unreachable.</p>;
> 
>   return (
>     <div className="telemetry-card">
>       <header className="card-header">
>         <h3>Turbine #{turbineId} Telemetry</h3>
>         {isFetching && <span className="refetch-pill">Syncing...</span>}
>       </header>
> 
>       <div className="metrics-body">
>         <p>Rotational Speed: <strong>{metrics.rpm} RPM</strong></p>
>         <p>Core Temp: <strong>{metrics.temp}°C</strong></p>
>         <p>Vibration Index: <strong>{metrics.vibration} mm/s</strong></p>
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Automatic Polling**: `refetchInterval: 5000` configures background polling without writing manual `setInterval` hooks.
> 2. **Background Indicator**: `isFetching` indicates active background refetching while preserving existing `data` on screen.
> 3. **Unique Cache Index**: `queryKey: ['turbine-telemetry', turbineId]` isolates cache entries per turbine ID.
> 4. **Declarative Error States**: Handles loading and error statuses cleanly via destructuring.
> 
### Exercise 2: Financial Order Cancellation Mutation

**Scenario:** Build a Financial Trading open orders panel where clicking "Cancel Order" triggers a `useMutation` call, invalidating the `['open-orders']` query cache upon completion.

**Requirements:**
1. Implement `useQuery` fetching open orders.
2. Implement `useMutation` executing order cancellation POST request.
3. Invalidate `['open-orders']` inside `onSuccess` callback.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
>
> async function fetchOpenOrders() {
>   const res = await fetch('/api/trading/orders/open');
>   return res.json();
> }
>
> async function cancelOrderApi(orderId) {
>   const res = await fetch(`/api/trading/orders/${orderId}/cancel`, { method: 'POST' });
>   return res.json();
> }
>
> export function OpenOrdersDesk() {
>   const queryClient = useQueryClient();
> 
>   const { data: orders, isLoading } = useQuery({
>     queryKey: ['open-orders'],
>     queryFn: fetchOpenOrders
>   });
> 
>   const cancelMutation = useMutation({
>     mutationFn: cancelOrderApi,
>     onSuccess: () => {
>       // Invalidate open orders cache to force immediate refetch
>       queryClient.invalidateQueries({ queryKey: ['open-orders'] });
>     }
>   });
> 
>   if (isLoading) return <p>Loading active order desk...</p>;
> 
>   return (
>     <div className="orders-desk">
>       <h3>Active Open Orders</h3>
>       <ul>
>         {orders.map(order => (
>           <li key={order.id} className="order-row">
>             <span>{order.symbol} ({order.qty} @ ${order.price})</span>
>             <button 
>               onClick={() => cancelMutation.mutate(order.id)}
>               disabled={cancelMutation.isPending}
>               className="btn-cancel"
>             >
>               {cancelMutation.isPending ? 'Canceling...' : 'Cancel Order'}
>             </button>
>           </li>
>         ))}
>       </ul>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Cache Invalidation**: `invalidateQueries({ queryKey: ['open-orders'] })` forces React Query to purge stale orders and refetch fresh data.
> 2. **Mutation State**: `cancelMutation.isPending` disables buttons during active network cancellation requests.
> 3. **Declarative Mutation Execution**: `cancelMutation.mutate(order.id)` triggers mutation execution cleanly on click.
> 4. **Decoupled Server State**: Order desk data remains synchronized without manual array splicing in client state.
> 
### Exercise 3: E-Commerce Shopping Cart Optimistic Update

**Scenario:** Implement an e-commerce shopping cart item quantity updater using React Query's `onMutate` optimistic update callback to modify cart cache before network completion.

**Requirements:**
1. Configure `useMutation` with `onMutate` callback.
2. Update cache optimistically via `queryClient.setQueryData()`.
3. Roll back cache context if network request fails inside `onError`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import { useMutation, useQueryClient } from '@tanstack/react-query';
>
> async function updateItemQtyApi({ itemId, quantity }) {
>   const res = await fetch(`/api/cart/items/${itemId}`, {
>     method: 'PATCH',
>     headers: { 'Content-Type': 'application/json' },
>     body: JSON.stringify({ quantity })
>   });
>   if (!res.ok) throw new Error('Update failed');
>   return res.json();
> }
>
> export function OptimisticCartItem({ item }) {
>   const queryClient = useQueryClient();
> 
>   const mutation = useMutation({
>     mutationFn: updateItemQtyApi,
>     onMutate: async (newItem) => {
>       // 1. Cancel outgoing refetches
>       await queryClient.cancelQueries({ queryKey: ['cart'] });
>       // 2. Snapshot previous value
>       const previousCart = queryClient.getQueryData(['cart']);
>       // 3. Optimistically update cache
>       queryClient.setQueryData(['cart'], old => 
>         old ? old.map(i => i.id === newItem.itemId ? { ...i, quantity: newItem.quantity } : i) : []
>       );
>       return { previousCart };
>     },
>     onError: (err, newItem, context) => {
>       // 4. Rollback to snapshot on error
>       if (context?.previousCart) {
>         queryClient.setQueryData(['cart'], context.previousCart);
>       }
>     },
>     onSettled: () => {
>       queryClient.invalidateQueries({ queryKey: ['cart'] });
>     }
>   });
> 
>   return (
>     <div className="cart-item-row">
>       <span>{item.name}</span>
>       <button onClick={() => mutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}>
>         +1 (Optimistic)
>       </button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Optimistic Cache Mutation**: `setQueryData()` updates local cache immediately before network round-trip completes.
> 2. **Rollback Snapshot**: `context.previousCart` captures pre-mutation state to revert UI safely if network fails.
> 3. **Refetch Synchronization**: `onSettled` invalidates queries to guarantee server-client consistency.
> 4. **Sub-Millisecond UI Response**: User views quantity updates instantly without waiting for server response latency.
> 
---

## 6. Related Terms

- [`useEffect` Hook](../level_03/use_effect.md) — The manual effect hook replaced by React Query.
- [Side Effects](../level_03/side_effects.md) — Async network requests managed declaratively.
- [Redux](redux.md) — Client state container distinct from server state management.
- [Zustand](zustand.md) — Lightweight client state manager.

---

## 7. Key Takeaways

- React Query and SWR manage asynchronous **Server State**, caching, loading, and refetching automatically.
- Replaces manual `useState` + `useEffect` fetching boilerplate with single `useQuery` calls.
- Leverages Stale-While-Revalidate (SWR) caching to serve instant cached UI while refetching in the background.
- Include all reactive parameters in `queryKey` arrays to ensure unique cache indexing.
- Use `useMutation` for write operations, invalidating queries via `invalidateQueries()` on success.
- Never store API server data inside client state managers like Redux or Zustand.
