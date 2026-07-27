# React Query (TanStack Query) / SWR

> **Level 11 — Ecosystem Libraries**
> Powerful data-fetching libraries that manage server state, caching, background refetching, and synchronization, completely replacing the traditional `useEffect` + `fetch` pattern.

---

## 1. Prerequisites
- [Side Effects](../level_03/side_effects.md) — These libraries are the modern replacement for manual side effects.
- [`useEffect` Hook](../level_03/use_effect.md) — What these libraries allow you to delete.

---

## 2. Term Category
- **React Ecosystem / Data Fetching Library**

---

## 3. Environment Context
- **Client-Side (React DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional React, fetching data from an API is a nightmare. You have to create three separate state variables (`data`, `isLoading`, `isError`). You have to write a `useEffect` to trigger the fetch. You have to handle race conditions, caching, and retries manually.
```javascript
// The Old, Painful Way
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/users')
    .then(res => res.json())
    .then(data => { setData(data); setIsLoading(false); })
    .catch(err => { setError(err); setIsLoading(false); });
}, []);
```
**React Query** (and its competitor, **SWR**) completely delete all of that code. They provide a custom hook that does everything for you.

### (2) The Modern Way
With React Query, fetching data takes one line of code:
```javascript
import { useQuery } from '@tanstack/react-query';

function UserList() {
  // It provides the loading state, the error state, and the data automatically!
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users'], 
    queryFn: () => fetch('/api/users').then(res => res.json())
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p>Something went wrong!</p>;
  return <ul>{data.map(user => <li>{user.name}</li>)}</ul>;
}
```

### (3) The Magic of Caching & Stale-While-Revalidate
These libraries do much more than fetch data. They **Cache** the data globally!
If you visit the `<UserList>` component, it fetches the data and caches it under the key `['users']`.
If you navigate to a different page and come back, React Query will instantly show you the cached data (zero loading spinner!), while secretly fetching the newest data in the background and silently updating the UI if anything changed. This is called **Stale-While-Revalidate (SWR)**.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Storing Server Data in Redux/Global State

**The mistake:** A developer fetches a list of 500 users from their API, and immediately saves that entire list into their Redux Global Store so other components can use it.

**Why it's wrong:** API data is **Server State** (data you do not own; the server owns it and it can go out of date). Redux is for **Client State** (data the user controls, like dark mode or an open modal). 
**Golden Rule:** Never put API data in Redux. Let React Query handle the caching of Server State, and use Redux/Zustand strictly for Client UI State.

---



### Mistake 2: Using Non-Unique String Array Query Keys in `useQuery()`

**The mistake:** Using `useQuery({ queryKey: ['users'], queryFn: () => fetchUser(id) })` without including `id` in the query key.

**Why it's wrong:** React Query uses `queryKey` for internal cache indexing and refetching! Omitting `id` from `queryKey` causes all users to share the exact same cached data result. Include reactive parameters in keys: `queryKey: ['users', id]`.

*Incorrect:*
```javascript
useQuery({ queryKey: ['user'], queryFn: () => fetchUser(id) }); // ❌ Missing id in queryKey!
```

*Fix:*
```javascript
useQuery({ queryKey: ['user', id], queryFn: () => fetchUser(id) }); // Unique query key
```

### Mistake 3: Forgetting to Invalidate Queries via `queryClient.invalidateQueries()` After `useMutation()`

**The mistake:** Executing a data mutation `useMutation({ mutationFn: addTodo })` without invalidating the `'todos'` query cache.

**Why it's wrong:** After a mutation succeeds, React Query's cached list remains stale until invalidated or refetched! Call `queryClient.invalidateQueries({ queryKey: ['todos'] })` in `onSuccess`.

*Incorrect:*
```javascript
useMutation({ mutationFn: addTodo }); // ❌ Query cache remains stale!
```

*Fix:*
```javascript
useMutation({
  mutationFn: addTodo,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })
});
```

## 6. Practice Exercises

### Exercise 1: The Magic Cache

**Problem:** You use React Query to fetch the `['users']` data in the `<Header>` component. Deep down in the app, the `<Footer>` component also needs the user data. Do you need to pass it down via Props? Do you need to put it in Context?

**Expected output:**
```text
No! You just call the exact same `useQuery` hook in the `<Footer>` component.
Because React Query caches data globally by the `queryKey`, the `<Footer>` will instantly read the data from the cache without triggering a second network request. It acts as a global state manager for your API data!
```

> [!check]- Answer
> - Think about what the `queryKey` does.

---



### Exercise 2: Fetching Data with useQuery Hook

**Problem:** Fetch user data for `userId` using `useQuery` from `@tanstack/react-query`.

**Expected output:**
```text
const { data, isLoading, error } = useQuery({ queryKey: ['user', userId], queryFn: () => fetchUser(userId) });
```

> [!check]- Answer
> ```javascript
> const { data, isLoading, error } = useQuery({
>   queryKey: ['user', userId],
>   queryFn: () => fetchUser(userId)
> });
> ```
>
> **Explanation:** `useQuery` manages server state, caching, loading statuses, and refetching automatically.

### Exercise 3: Stale Time vs GC Time (Cache Time)

**Problem:** Compare: `staleTime` (Duration data is considered fresh before background refetch); `gcTime` (Duration unused query cache remains in memory before garbage collection).

**Expected output:**
```text
staleTime: duration data is considered fresh; gcTime: duration unused cache remains in memory
```

> [!check]- Answer
> ```text
> staleTime: duration data is considered fresh; gcTime: duration unused cache remains in memory
> ```
>
> **Explanation:** `staleTime` controls background refetching frequency; `gcTime` manages memory garbage collection.

## 7. Related Terms
- [`useEffect` Hook](../level_03/use_effect.md) — The manual tool that React Query makes obsolete for data fetching.
- [State Management](../level_06/state_management.md) — React Query acts as the global state manager specifically for API data.

---

## 8. Key Takeaways
- **React Query** and **SWR** are the modern industry standards for fetching data in React.
- They completely replace the manual `useState` + `useEffect` fetching pattern.
- They automatically manage `isLoading`, `isError`, caching, and retries.
- They use a "Stale-While-Revalidate" strategy to show cached data instantly while updating it in the background.
- They eliminate the need to store API data in global state managers like Redux.
