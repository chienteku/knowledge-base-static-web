# Data Fetching & Race Conditions

> **Level 3 — Component Lifecycle & Effects**
> Handling out-of-order asynchronous API responses when rapid state updates trigger multiple in-flight network requests.

---

## 1. Prerequisites

- [`useEffect` Hook](use_effect.md) — The hook encapsulating asynchronous data fetching queries.
- [Cleanup Functions](cleanup_functions.md) — The mechanism used to cancel or ignore out-of-date HTTP requests.

---

## 2. Term Category

**Rendering Mechanic (async synchronization)**: In single-page applications, a race condition occurs when multiple asynchronous network requests execute concurrently and complete in an order different from their invocation order. In React's render-and-commit pipeline, unmanaged race conditions lead to inconsistent UI states where outdated API responses overwrite active data choices.

Architecturally, React components must ensure that state updates derived from asynchronous network promises reflect only the most recent user intent. Managing race conditions requires clean synchronization patterns such as boolean cancellation flags or the Web API `AbortController` bound to effect cleanup returns.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Data fetching inside `useEffect` is a widespread pattern. However, naive implementations suffer from network timing vulnerabilities.

Consider a search interface or user selection menu:
1. User clicks **"User A"** (Request 1 sent to network).
2. User quickly clicks **"User B"** (Request 2 sent to network).

Network latency is inherently unpredictable. If Request 2 resolves in 50ms while Request 1 takes 800ms due to server delay:
- Request 2 finishes first: UI displays data for User B.
- Request 1 finishes second: UI overwrites active state with stale data for User A.

The user selected User B, but the screen displays User A. This inconsistency degrades application reliability.

To solve this, React developers use two main techniques within `useEffect`:
1. **The Active Flag Pattern:** A local boolean scoped inside the effect function (`let active = true`). The cleanup function sets `active = false`, causing late-arriving promises to ignore state updates.
2. **The `AbortController` Pattern:** Passing an `AbortSignal` to `fetch` calls. The cleanup function calls `controller.abort()`, terminating network processing at the browser engine level.

### (2) Reality Metaphor

Imagine mailing catalog order forms to a supplier.

- **Race Condition (No Cancellation):** You mail an order form for Product A. Five minutes later, you change your mind and mail an order form for Product B. The postal service delivers Form B first, and the supplier ships Product B. Later, delayed Form A arrives, and the supplier ships Product A. You end up with Product A, even though you wanted Product B.
- **Active Flag Strategy (Door Notice):** Before mailing Form B, you post a notice on your door: *"Accept deliveries for Product B only; reject Product A."* When delayed Product A arrives, the delivery driver reads the notice and returns the package.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (active) setUser(data);
      });

    return () => {
      active = false; // Invalidates state updates for stale fetch
    };
  }, [userId]);

  return <div>{user ? user.name : 'Loading...'}</div>;
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect } from 'react';

function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Search failed');
        return res.json();
      })
      .then(data => {
        setResults(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          console.log(`Fetch for "${query}" cancelled cleanly`);
        } else {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      controller.abort(); // Cancel HTTP request on query update or unmount
    };
  }, [query]);

  return (
    <div>
      {loading && <p>Searching...</p>}
      {error && <p className="error">{error}</p>}
      <ul>
        {results.map(item => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default SearchResults;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting Teardown Logic in Un-cached Data Fetches

**The mistake:** Initiating data fetches inside `useEffect` without returning a boolean flag reset or an `AbortController` cancellation.

**Why it's wrong:** Out-of-order network responses overwrite state updates from newer user selections, displaying stale data to users.

*Incorrect:*
```jsx
useEffect(() => {
  fetchData(selectedCategory).then(data => setData(data));
}, [selectedCategory]); // ❌ Vulnerable to race conditions!
```

*Fix:*
```jsx
useEffect(() => {
  let active = true;
  fetchData(selectedCategory).then(data => {
    if (active) setData(data);
  });
  return () => { active = false; }; // ✅ Safe active flag
}, [selectedCategory]);
```

### Mistake 2: Logging `AbortError` as an Application Failure

**The mistake:** Catching all errors in a `fetch` `.catch()` block without checking `err.name === 'AbortError'`.

**Why it's wrong:** Canceling a request with `AbortController` causes `fetch` to reject with an `AbortError`. Treating this intentional cancellation as a network error displays false error banners to users.

*Incorrect:*
```jsx
fetch(url, { signal })
  .then(res => res.json())
  .catch(err => setError(err.message)); // ❌ Treats AbortError as real crash!
```

*Fix:*
```jsx
fetch(url, { signal })
  .then(res => res.json())
  .catch(err => {
    if (err.name !== 'AbortError') setError(err.message);
  });
```

### Mistake 3: Creating Abort Controllers Outside the `useEffect` Hook

**The mistake:** Declaring `const controller = new AbortController()` outside `useEffect` or as a top-level component variable.

**Why it's wrong:** Instantiating `AbortController` outside the effect shares a single signal instance across multiple renders. Calling `.abort()` cancels all future fetch requests globally instead of scoping cancellation to individual effect updates.

*Incorrect:*
```jsx
const controller = new AbortController(); // ❌ Shared outer controller
function DataViewer({ id }) {
  useEffect(() => {
    fetch(`/api/${id}`, { signal: controller.signal });
  }, [id]);
}
```

*Fix:*
```jsx
function DataViewer({ id }) {
  useEffect(() => {
    const controller = new AbortController(); // ✅ Fresh instance per effect run
    fetch(`/api/${id}`, { signal: controller.signal });
    return () => controller.abort();
  }, [id]);
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Device Sensor Telemetry Fetching

**Scenario:** An IoT monitoring console switches between sensor devices (`DEV-101`, `DEV-102`). Because device connections vary in latency, fast switching can display `DEV-101` telemetry under `DEV-102`'s card. Implement the boolean flag pattern to ensure only the active device's telemetry renders.

**Requirements:**
1. Fetch sensor metrics when `deviceId` updates.
2. Maintain an `active` boolean flag inside the effect.
3. Set `active = false` in the effect cleanup function.
4. Render telemetry only when `active` is true.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function IoTSensorCard({ deviceId }) {
>   const [telemetry, setTelemetry] = useState(null);
> 
>   useEffect(() => {
>     let active = true;
> 
>     async function fetchTelemetry() {
>       const response = await fetch(`/api/sensors/${deviceId}`);
>       const data = await response.json();
>       if (active) {
>         setTelemetry(data);
>       }
>     }
> 
>     fetchTelemetry();
> 
>     return () => {
>       active = false;
>     };
>   }, [deviceId]);
> 
>   return (
>     <div>
>       <h4>Device: {deviceId}</h4>
>       <pre>{telemetry ? JSON.stringify(telemetry) : 'Loading...'}</pre>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Scoped State Variable**: `let active = true` is bound uniquely to each effect execution closure frame.
> 2. **Teardown Execution**: Changing `deviceId` executes cleanup, setting `active = false` for the previous request.
> 3. **State Guard**: Checking `if (active)` prevents stale async promise completions from triggering state updates.
> 4. **Render Consistency**: Guarantees displayed telemetry matches the latest `deviceId` prop.
> 
### Exercise 2: Financial Stock Ticker Search

**Scenario:** A stock trading portal features a search bar for ticker symbols. Fast typing triggers multiple concurrent queries. Use `AbortController` to abort pending network queries as the user types.

**Requirements:**
1. Instantiate `AbortController` in `useEffect` on `tickerQuery` updates.
2. Bind `signal` to `fetch`.
3. Call `controller.abort()` in cleanup.
4. Filter out `AbortError` from UI error displays.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function StockTickerSearch() {
>   const [query, setQuery] = useState('');
>   const [stocks, setStocks] = useState([]);
>   const [error, setError] = useState(null);
> 
>   useEffect(() => {
>     if (!query) {
>       setStocks([]);
>       return;
>     }
> 
>     const controller = new AbortController();
> 
>     fetch(`/api/stocks?query=${query}`, { signal: controller.signal })
>       .then(res => res.json())
>       .then(data => {
>         setStocks(data);
>         setError(null);
>       })
>       .catch(err => {
>         if (err.name !== 'AbortError') {
>           setError('Failed to fetch stock prices');
>         }
>       });
> 
>     return () => {
>       controller.abort();
>     };
>   }, [query]);
> 
>   return (
>     <div>
>       <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ticker symbol..." />
>       {error && <p>{error}</p>}
>       <ul>
>         {stocks.map(s => <li key={s.symbol}>{s.symbol}: ${s.price}</li>)}
>       </ul>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Engine Level Cancellation**: `controller.abort()` instructs the browser network stack to close HTTP connections.
> 2. **Signal Propagation**: Passing `controller.signal` links fetch promise resolution to controller signals.
> 3. **Error Isolation**: Checking `err.name !== 'AbortError'` ignores intentional cancellations.
> 4. **Memory Hygiene**: Eliminates dangling promise handlers in high-frequency input contexts.
> 
### Exercise 3: E-Commerce Category Filter

**Scenario:** An e-commerce store filters products by category tabs ("Electronics", "Clothing"). Ensure rapid tab clicking never leaves the catalog showing products from a previously selected tab.

**Requirements:**
1. Fetch category products when `category` state updates.
2. Use active flag validation inside async resolution handlers.
3. Render loading placeholders during category switches.
4. Clean up state flags on category transitions.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function CategoryCatalog({ category }) {
>   const [products, setProducts] = useState([]);
>   const [loading, setLoading] = useState(true);
> 
>   useEffect(() => {
>     let isCurrent = true;
>     setLoading(true);
> 
>     fetch(`/api/categories/${category}/products`)
>       .then(res => res.json())
>       .then(data => {
>         if (isCurrent) {
>           setProducts(data);
>           setLoading(false);
>         }
>       });
> 
>     return () => {
>       isCurrent = false;
>     };
>   }, [category]);
> 
>   if (loading) return <div>Loading {category}...</div>;
> 
>   return (
>     <ul>
>       {products.map(p => <li key={p.id}>{p.name}</li>)}
>     </ul>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Sync Flag Protection**: `isCurrent` invalidates state resolution if category changes mid-fetch.
> 2. **Loading State Sync**: `setLoading(true)` fires synchronously when category updates, giving immediate user feedback.
> 3. **Out-of-Order Safety**: Late resolving responses from previous categories are safely ignored.
> 4. **Declarative Cleanups**: Teardown logic relies purely on standard React effect returns.
> 
---

## 6. Related Terms

- [Cleanup Functions](cleanup_functions.md) — The effect return callback mechanism executing fetch cancellations.
- [`useEffect` Hook](use_effect.md) — The parent hook encapsulating asynchronous data fetching routines.
- [`useState` Hook](../level_02/use_state.md) — The state primitives updated by API fetch resolutions.
- [Side Effects](side_effects.md) — External network requests managed within React components.

---

## 7. Key Takeaways

- Data fetching race conditions occur when asynchronous requests resolve out of order due to network latency.
- Unmanaged race conditions allow stale API responses to overwrite active user state.
- Resolve race conditions using the **Active Flag pattern** (`let active = true; return () => { active = false; };`).
- Alternatively, use **`AbortController`** to cancel HTTP requests directly at the browser level.
- Always check `err.name !== 'AbortError'` to avoid displaying false error alerts on aborted fetches.
```

---

## File 4: `knowledge-base/06-react/terms/level_03/dependency_array.md`

```markdown
