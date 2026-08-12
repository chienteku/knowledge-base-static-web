# Promise.all / Parallel Requests

> **Level 5 — Fetching Data (Client-Side)**
> Firing many requests concurrently and awaiting all.

---

## 1. Prerequisites
- [Promises (in the context of networks)](promises.md) — The async data wrapper objects.
- [async / await](async_await.md) — The syntax used to orchestrate Promise resolutions.

---

## 2. Term Category

**Browser API / Networking (Universal: Available in browser scripts and Node.js backend processes.)**: Promise.all / Parallel Requests is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Concurrent API Bulk Fetcher with Promise.all()

**Scenario:** An API dashboard fetches user, order, and notification data concurrently to populate a dashboard view.

**Requirements:**
1. Write fetchDashboardData(fetchUser, fetchOrders, fetchNotifications).
2. Run requests concurrently with Promise.all().
3. Return aggregated object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchDashboardData(fetchUser, fetchOrders, fetchNotifications) {
>   const [user, orders, notifications] = await Promise.all([
>     fetchUser(),
>     fetchOrders(),
>     fetchNotifications()
>   ]);
>
>   return { user, orders, notifications };
> }
>
> // Verification tests
> const fUser = async () => ({ name: "Alice" });
> const fOrders = async () => [{ id: 1 }];
> const fNotifs = async () => ["msg1"];
>
> fetchDashboardData(fUser, fOrders, fNotifs).then(data => {
>   console.assert(data.user.name === "Alice" && data.orders.length === 1, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Promise.all Concurrency**: Executes multiple promises concurrently and resolves when ALL promises resolve successfully.
> 2. **Latency Optimization**: Total latency equals duration of the slowest single request instead of sum of all requests.
> 3. **Fail-Fast Behavior**: If any single promise rejects, Promise.all immediately rejects with that error.
> 
---

### Exercise 2: Failure-Resilient Batch Fetcher with Promise.allSettled()

**Scenario:** An API aggregator uses `Promise.allSettled()` to fetch batch items, preserving successful results even if some requests fail.

**Requirements:**
1. Write fetchBatchResilient(urlsArray, fetchFn).
2. Execute with Promise.allSettled().
3. Return object { succeeded, failed }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchBatchResilient(urlsArray = [], fetchFn) {
>   const promiseArray = urlsArray.map(url => fetchFn(url));
>   const results = await Promise.allSettled(promiseArray);
>
>   const succeeded = [];
>   const failed = [];
>
>   results.forEach((res, i) => {
>     if (res.status === "fulfilled") {
>       succeeded.push({ url: urlsArray[i], data: res.value });
>     } else {
>       failed.push({ url: urlsArray[i], error: res.reason?.message || "Failed" });
>     }
>   });
>
>   return { succeeded, failed };
> }
>
> // Verification tests
> const mockFetch = async (url) => {
>   if (url.includes("bad")) throw new Error("404 Not Found");
>   return { url, status: "OK" };
> };
>
> fetchBatchResilient(["/api/good", "/api/bad"], mockFetch).then(res => {
>   console.assert(res.succeeded.length === 1 && res.failed.length === 1, "Test 1 Failed");
>   console.assert(res.succeeded[0].url === "/api/good", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Promise.allSettled Advantage**: Never rejects; waits for ALL promises to settle regardless of fulfillment or rejection.
> 2. **Partial Success Recovery**: Allows UI to display successful items while rendering fallback UI for failed items.
> 3. **Settled Result Structure**: Returns objects with status: 'fulfilled' (value) or status: 'rejected' (reason).
> 
---

### Exercise 3: Concurrency-Limited Batch Promise Executor

**Scenario:** A rate-limited API batch runner limits maximum concurrent in-flight requests (e.g. max 2 at a time) to prevent server 429 throttling.

**Requirements:**
1. Write runWithConcurrencyLimit(tasksArray, limit).
2. Execute tasks in batches of limit size.
3. Return all results.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function runWithConcurrencyLimit(taskFunctions = [], limit = 2) {
>   const results = [];
>   const executing = new Set();
>
>   for (const task of taskFunctions) {
>     const p = Promise.resolve().then(() => task());
>     results.push(p);
>     executing.add(p);
>
>     const clean = () => executing.delete(p);
>     p.then(clean, clean);
>
>     if (executing.size >= limit) {
>       await Promise.race(executing);
>     }
>   }
>
>   return Promise.all(results);
> }
>
> // Verification tests
> let active = 0;
> let maxObserved = 0;
>
> const makeTask = (id) => async () => {
>   active++;
>   maxObserved = Math.max(maxObserved, active);
>   await new Promise(r => setTimeout(r, 20));
>   active--;
>   return id;
> };
>
> const tasks = [makeTask(1), makeTask(2), makeTask(3), makeTask(4)];
> runWithConcurrencyLimit(tasks, 2).then(res => {
>   console.assert(res.length === 4, "Test 1 Failed");
>   console.assert(maxObserved <= 2, "Test 2 Failed: Concurrency must not exceed 2");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Throttling Prevention**: Limiting concurrency prevents overwhelming API endpoints and hitting 429 Rate Limit thresholds.
> 2. **Promise.race Pool Management**: Promise.race waits for whichever in-flight promise completes first, freeing slot for next task.
> 3. **Controlled Batch Throughput**: Balances execution speed with backend database connection limits.
---

## 6. Related Terms
- [The fetch() API](fetch.md) — The network request builder.
- [Latency & Bandwidth](../level_01/latency_bandwidth.md) — The physical network constraints optimized by parallel connections.

---

## 7. Key Takeaways
- Sequential `await` statements block subsequent requests from starting, compounding network latency.
- `Promise.all` triggers multiple network requests concurrently, running them in parallel.
- The total wait time of `Promise.all` is limited to the duration of the slowest request.
- `Promise.all` is fail-fast; a single rejection rejects the entire array immediately.
- Use `Promise.all` only for independent requests; query dependent requests sequentially.
