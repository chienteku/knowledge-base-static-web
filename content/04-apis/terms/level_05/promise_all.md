# Promise.all / Parallel Requests

> **Level 5 — Fetching Data (Client-Side)**
> Firing many requests concurrently and awaiting all.

---

## 1. Prerequisites
- [Promises (in the context of networks)](./promises.md) — The async data wrapper objects.
- [async / await](./async_await.md) — The syntax used to orchestrate Promise resolutions.

---

## 2. Term Category
- **Browser API / Networking**

---

## 3. Environment Context
- **Universal**: Available in browser scripts and Node.js backend processes.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Modern dashboards often need to fetch multiple independent resources from an API—for example, loading a user's profile, fetching their recent orders, and downloading their notification count.

If we fetch these resources sequentially using separate `await` statements, each request is blocked from starting until the previous request has completed:
```javascript
// Total time: 100ms + 150ms + 120ms = 370ms!
const profile = await fetch('/profile').then(r => r.json()); // 100ms
const orders = await fetch('/orders').then(r => r.json());   // 150ms
const alerts = await fetch('/alerts').then(r => r.json());   // 120ms
```
This is highly inefficient because none of these queries depend on each other.

To solve this, JavaScript provides **`Promise.all`**:
- It takes an array of Promises and executes them **in parallel (concurrently)**.
- All requests travel across the network wire at the same time.
- The total wait time shrinks from the *sum* of all RTTs down to the travel time of the **single slowest request** (in this case, `150ms` instead of `370ms`).

#### Fail-Fast Behavior
`Promise.all` is **fail-fast**. If *any* promise in the array rejects (e.g. the `/orders` request fails with a network error), `Promise.all` rejects immediately with that error, discarding the successful results of the other requests. 

*Alternative:* If you want all requests to finish regardless of individual failures, use **`Promise.allSettled`**, which returns an array of success/failure descriptors for each input.

### (2) Reality Metaphor
Imagine buying bread, meat, and flowers from three separate shops.
- **Sequential Requests** are like **doing the shopping alone**. You walk to the bakery, wait in line, buy bread. Then you walk to the butcher, wait in line, buy meat. Finally, you walk to the florist. Your total time is the sum of all journeys.
- **Parallel Requests (`Promise.all`)** are like **sending three friends** at the same time. Friend A runs to the bakery, Friend B to the butcher, and Friend C to the florist. You all meet back at the car. Your total wait time is simply the time taken by the single slowest friend.
- **Fail-Fast** is like receiving a text that Friend B slipped and got injured. You cancel the picnic immediately (`Promise.all` rejects), ignoring that Friend A successfully bought the bread.

---

### (3) JavaScript Implementation Example

#### Concurrent Requests utilizing `Promise.all`
```javascript
async function loadDashboard() {
  console.time('Dashboard Load');
  
  try {
    // 1. Initiate fetches concurrently (do not use await on the fetch lines!)
    const profilePromise = fetch('/profile').then(r => r.json());
    const ordersPromise = fetch('/orders').then(r => r.json());
    const alertsPromise = fetch('/alerts').then(r => r.json());
    
    // 2. Await their collective resolution
    const [profile, orders, alerts] = await Promise.all([
      profilePromise,
      ordersPromise,
      ordersPromise
    ]);
    
    console.log("Profile Name:", profile.name);
    console.log("Orders Count:", orders.length);
    console.timeEnd('Dashboard Load'); // Output will be ~150ms instead of 370ms
  } catch (error) {
    console.error("Dashboard failed to load due to a query failure:", error);
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `Promise.all` for dependent requests

**The mistake:** Attempting to fetch a post's comments before you have resolved the post's ID.

**Why it's wrong:** You cannot query `/posts/ID/comments` until you know the ID. If you pass both requests to `Promise.all`, the comment fetch will execute immediately with an `undefined` ID, causing an API failure.

*Incorrect:*
```javascript
// Comment request will fail because post data is not yet resolved!
const [post, comments] = await Promise.all([
  fetch('/api/latest-post').then(r => r.json()),
  fetch(`/api/posts/${post.id}/comments`).then(r => r.json()) // ERROR!
]);
```

*Fix:* Fetch the dependent post first, then use `Promise.all` for any subsequent independent sub-requests.

---

### Mistake 2: Using `Promise.all()` When You Need All Promises to Settle Regardless of Individual Failures

**The mistake:** Executing 10 independent background fetch calls with `Promise.all()` where 1 failure aborts all 9 successful results.

**Why it's wrong:** `Promise.all()` exhibits 'fail-fast' behavior. If ANY single promise rejects, the entire `Promise.all()` call rejects immediately. Use `Promise.allSettled()` for fault-tolerant batch requests.

*Incorrect:*
```javascript
// 1 failed API call rejects entire batch
const results = await Promise.all([fetch1, fetch2, fetch3]); // ❌ Fails if fetch2 rejects!
```

*Fix:*
```javascript
// Use Promise.allSettled to capture individual success/failure states:
const results = await Promise.allSettled([fetch1, fetch2, fetch3]);
```

---

### Mistake 3: Passing Non-Promise Functions Instead of Invoked Promises into `Promise.all()`

**The mistake:** Passing function references `Promise.all([fetchData1, fetchData2])` without calling them `fetchData1()`. 

**Why it's wrong:** `Promise.all()` expects an array of Promise instances. Passing function references converts non-promise objects, yielding un-executed function references.

*Incorrect:*
```javascript
Promise.all([fetchUser, fetchOrders]); // ❌ Passed function references without calling them!
```

*Fix:*
```javascript
Promise.all([fetchUser(), fetchOrders()]); // Pass returned Promise instances
```


---

## 6. Practice Exercises

### Exercise 1: Parallel Optimization

**Problem:** Refactor the sequential queries below into parallel queries using `Promise.all`:

```javascript
async function getAccountData() {
  const settings = await fetch('/api/settings').then(r => r.json());
  const theme = await fetch('/api/theme').then(r => r.json());
  return { settings, theme };
}
```

> [!check]- Answer
> - ```javascript
> - async function getAccountData() {
> - const [settings, theme] = await Promise.all([
> - fetch('/api/settings').then(r => r.json()),
> - fetch('/api/theme').then(r => r.json())
> - ]);
> - return { settings, theme };
> - }
> - ```


---

### Exercise 2: Parallel API Request Wrapper Pattern

**Problem:** Write `async` function fetching `/api/user` and `/api/posts` in parallel using `Promise.all()`.

**Expected output:**
> [!check]- Answer
> ```text
> const [userRes, postsRes] = await Promise.all([fetch('/api/user'), fetch('/api/posts')]); const user = await userRes.json(); const posts = await postsRes.json();
> ```
> ```javascript
> const [userRes, postsRes] = await Promise.all([
> fetch('/api/user'),
> fetch('/api/posts')
> ]);
> const user = await userRes.json();
> const posts = await postsRes.json();
> ```
> - **Explanation:** `Promise.all()` executes concurrent requests simultaneously, reducing latency.
---

### Exercise 3: Promise Combinator Matrix

**Problem:** Match the Promise combinator to its behavior:
1. `Promise.all` 
2. `Promise.allSettled` 
3. `Promise.race` 
4. `Promise.any` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Fails fast if any promise rejects; resolves when all succeed
> 2. Resolves after all promises settle (success or failure)
> 3. Settles as soon as FIRST promise settles (resolve or reject)
> 4. Resolves as soon as FIRST promise fulfills (ignores rejections unless all fail)
> ```
> ```text
> 1. Promise.all -> Resolves when all fulfill; fails fast on first rejection.
> 2. Promise.allSettled -> Resolves after all settle (returns status objects).
> 3. Promise.race -> Settles on first settled promise (fulfilled or rejected).
> 4. Promise.any -> Resolves on first fulfilled promise (ignores rejections).
> ```
> - **Explanation:** Different promise combinators handle concurrent execution outcomes.
---

## 7. Related Terms
- [The fetch() API](./fetch.md) — The network request builder.
- [Latency & Bandwidth](../level_01/latency_bandwidth.md) — The physical network constraints optimized by parallel connections.

---

## 8. Key Takeaways
- Sequential `await` statements block subsequent requests from starting, compounding network latency.
- `Promise.all` triggers multiple network requests concurrently, running them in parallel.
- The total wait time of `Promise.all` is limited to the duration of the slowest request.
- `Promise.all` is fail-fast; a single rejection rejects the entire array immediately.
- Use `Promise.all` only for independent requests; query dependent requests sequentially.
