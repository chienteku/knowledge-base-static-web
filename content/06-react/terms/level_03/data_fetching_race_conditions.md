# Data Fetching & Race Conditions

> **Level 3 — Component Lifecycle & Effects**
> Why two in-flight fetches can resolve out of order, and cleaning up with a flag/`AbortController`.

---

## 1. Prerequisites
- [`useEffect` Hook](../level_03/use_effect.md) — The hook containing asynchronous data fetches.
- [Cleanup Functions](../level_03/cleanup_functions.md) — The function used to discard out-of-date responses.

---

## 2. Term Category
- **Core Hook**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Fetching data inside a `useEffect` hook is a common pattern in React. However, simple implementations often suffer from a performance and correctness bug: **Race Conditions**.

A race condition occurs when multiple asynchronous operations run concurrently, and their completion order differs from the order in which they were started. 

Imagine a user clicks on a category menu to view products:
1.  The user clicks **"Apples"** (Request 1 is sent).
2.  The user immediately clicks **"Bananas"** (Request 2 is sent).

Because network speeds are unpredictable, Request 2 (Bananas) might resolve in 100ms, while Request 1 (Apples) is delayed and takes 2 seconds to resolve.
-   Request 2 resolves first: the UI displays Bananas.
-   Request 1 resolves second: the UI overwrites the display with Apples.

The user selected Bananas, but the screen displays Apples. This is a race condition.

To prevent out-of-order updates, you must use a **Cleanup Function** inside the `useEffect` hook. There are two primary techniques to handle this:

#### 1. The Boolean Flag Technique (Recommended)
Declare a boolean variable (e.g. `let active = true`) inside the effect function body. The promise checks this variable before updating state. The cleanup function sets `active = false`. 

When the component re-renders because the category changed, the old effect's cleanup runs first, setting the old `active` flag to `false`. When the slow Request 1 finally resolves, it sees `active === false` and discards the result.

#### 2. The AbortController Technique
Use the browser's native `AbortController` API to cancel the HTTP request. The cleanup function calls `controller.abort()`, terminating the network request immediately.

---

### (2) Reality Metaphor
Imagine ordering items from a catalog.
- **Race Condition (No Cleanups):** You mail an order form for Item A. You change your mind and mail an order form for Item B. The vendor receives and ships Item B first. Later, the vendor processes the delayed order form for Item A and ships it. You receive Item A last, even though you wanted Item B.
- **Boolean Flag (Rejection List):** Before mailing the order form for Item B, you write a note on your door: *"Ignore any deliveries containing Item A."* When Item A arrives on your porch, you inspect the note, see it is no longer wanted, and return it to the sender.

---

### (3) React Code Examples

#### 1. The Boolean Flag Solution (Clean and Reliable)
```jsx
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true; // Flag scoped to this specific effect run

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (active) {
          setUser(data); // Only update state if this effect run is still active
        }
      });

    // Cleanup function executes when userId changes or component unmounts
    return () => {
      active = false; // Disables the state update for this effect run
    };
  }, [userId]);

  if (!user) return <p>Loading...</p>;
  return <div>{user.name}</div>;
}
```

#### 2. The AbortController Solution
```jsx
useEffect(() => {
  const controller = new AbortController();
  const { signal } = controller;

  fetch(`/api/data`, { signal })
    .then(res => res.json())
    .then(data => {
      setData(data);
    })
    .catch(err => {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted cleanly');
      } else {
        setError(err);
      }
    });

  return () => {
    controller.abort(); // Cancel the request immediately
  };
}, [query]);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Ignoring promise results inside cleanup loops

**The mistake:** Fetching data inside `useEffect` without returning any cleanup function to handle race conditions:

```javascript
// BAD: Vulnerable to race conditions and memory leaks!
useEffect(() => {
  fetch(`/api/user/${id}`)
    .then(res => res.json())
    .then(data => setUser(data));
}, [id]);
```

**Why it's wrong:** If the component unmounts or the query ID changes before the fetch completes, the promise callback will still execute. This can result in out-of-order UI updates or trigger memory leak warnings if the component is no longer mounted.

---



### Mistake 2: Ignoring Network Latency Ordering in `useEffect` Data Fetching (Race Condition Trap)

**The mistake:** User switches tabs from `User 1` to `User 2`. Request for `User 1` completes AFTER `User 2`, overwriting `User 2` data.

**Why it's wrong:** Fast network responses can resolve out of order! If Request 1 finishes after Request 2, stale data overwrites active state. Use a boolean `ignore` flag or `AbortController` in cleanup.

*Incorrect:*
```javascript
useEffect(() => {
  fetchData(userId).then(data => setData(data)); // ❌ Race condition!
}, [userId]);
```

*Fix:*
```javascript
useEffect(() => {
  let ignore = false;
  fetchData(userId).then(data => { if (!ignore) setData(data); });
  return () => { ignore = true; }; // Ignore out-of-order responses
}, [userId]);
```

### Mistake 3: Failing to Handle `AbortError` Rejections when Using `AbortController`

**The mistake:** Using `AbortController` without catching `AbortError` in `.catch()`.

**Why it's wrong:** Calling `controller.abort()` causes `fetch()` to reject with an `AbortError`. If unhandled, this error logs as an unhandled promise rejection in console.

*Incorrect:*
```javascript
fetch(url, { signal }).catch(err => setError(err)); // ❌ Logs AbortError as real error!
```

*Fix:*
```javascript
fetch(url, { signal }).catch(err => { if (err.name !== 'AbortError') setError(err); });
```

## 6. Practice Exercises

### Exercise 1: Search Auto-complete Cleanup

**Problem:** Complete the search input component below to prevent race conditions during fast typing using an active boolean flag:

```jsx
import React, { useState, useEffect } from 'react';

function SearchAutoComplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) return;

    // Solution:
    let isCurrent = true;

    fetch(`/api/search?q=${query}`)
      .then(res => res.json())
      .then(data => {
        if (isCurrent) {
          setResults(data);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [query]);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ul>{results.map(r => <li key={r.id}>{r.title}</li>)}</ul>
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Ignore Flag Race Condition Cleanup Pattern

**Problem:** Write data fetching `useEffect` using `let ignore = false` to prevent race conditions when `id` changes.

**Expected output:**
```text
useEffect(() => { let ignore = false; fetchUser(id).then(res => { if (!ignore) setUser(res); }); return () => { ignore = true; }; }, [id]);
```

> [!check]- Answer
> ```javascript
> useEffect(() => {
>   let ignore = false;
>   fetchUser(id).then(res => {
>     if (!ignore) setUser(res);
>   });
>   return () => {
>     ignore = true;
>   };
> }, [id]);
> ```
>
> **Explanation:** The `ignore` boolean flag invalidates stale async callbacks if `id` changes before fetch resolves.

### Exercise 3: Why Manual Data Fetching is Discouraged

**Problem:** Why use libraries like React Query or SWR instead of writing manual `useEffect` data fetching? (Handles race conditions, caching, revalidation, and loading states out of the box).

**Expected output:**
```text
Handles race conditions, caching, revalidation, and deduplication out of the box
```

> [!check]- Answer
> ```text
> Handles race conditions, caching, revalidation, and deduplication out of the box
> ```
>
> **Explanation:** Data fetching libraries automate race condition handling, caching, and state management.

## 7. Related Terms
- [Cleanup Functions](../level_03/cleanup_functions.md) — The lifecycle hooks used to execute fetch cancelations.
- [`useState` Hook](../level_02/use_state.md) — The state variables updated by fetch results.

---

## 8. Key Takeaways
- Race conditions occur when asynchronous requests resolve out of order.
- Predictable network response sequences are not guaranteed.
- Simple fetches inside `useEffect` without cleanups will cause display bugs.
- Use a boolean flag (`active = true`) inside your effect to ignore stale promise results.
- Set the flag to `false` inside the returned cleanup function.
- Alternatively, use `AbortController` to cancel pending HTTP requests.
- Use third-party libraries (like React Query or SWR) in large applications to handle caching and race conditions automatically.
