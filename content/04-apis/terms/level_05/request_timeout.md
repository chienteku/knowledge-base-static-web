# Request Timeout

> **Level 5 — Fetching Data (Client-Side)**
> Aborting a request that hangs too long.

---

## 1. Prerequisites
- [The fetch() API](fetch.md) — The network request API.
- [Promises (in the context of networks)](promises.md) — The async data wrapper objects.

---

## 2. Term Category

**Browser API / Networking (Universal: Applicable to browser scripting and Node.js backend request architectures.)**: Request Timeout is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, the browser `fetch()` API does not have a built-in timeout limit. If a server experiences extreme load, or a network router silently drops packets, your request can hang indefinitely. 

Leaving requests open indefinitely is bad practice. The user is stuck staring at a loading spinner, wasting browser sockets, device battery, and memory.

To keep applications responsive, developers implement a **Request Timeout**:
- A timeout defines a maximum wait duration (for example, `5000ms`).
- If the server does not respond within this window, the client cancels the network request, alerts the user, or attempts a retry.
- **Implementation:** Because `fetch` lacks a direct config property (like `{ timeout: 5000 }`), we implement timeouts using the browser's built-in **`AbortController`** API alongside a standard `setTimeout` timer.

### (2) Reality Metaphor
Imagine waiting in a restaurant drive-thru lane.
- **Without a Timeout** is like sitting in the lane indefinitely. The kitchen is backed up, but you refuse to leave. You sit there for 4 hours, running your engine, wasting gas (**browser sockets/memory**), and blocking other cars.
- **Implementing a Timeout** is like looking at your watch when you pull into the lane and deciding: *"If I don't get my food in 10 minutes, I am driving away."* If the 10-minute timer hits, you pull out of the lane (**abort the request**) and drive to another restaurant.

---

### (3) Technical Implementation in JavaScript

To create a clean timeout pattern, we must wrap `fetch` inside a helper function that sets a timer to trigger `controller.abort()`:

```javascript
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  // 1. Create the AbortController instance
  const controller = new AbortController();
  const { signal } = controller;
  
  // 2. Set up the timeout timer to trigger abort()
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal // 3. Pass the controller's signal to fetch
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    // 4. CRITICAL: Clear the timer when the request finishes 
    // to prevent memory leaks!
    clearTimeout(timer);
  }
}

// Usage:
try {
  const res = await fetchWithTimeout('/api/slow-report', {}, 3000);
  const data = await res.json();
  console.log("Report data loaded:", data);
} catch (err) {
  console.error(err.message); // If slow, prints: "Request timed out after 3000ms"
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to clear the `setTimeout` timer on success

**The mistake:** Neglecting to call `clearTimeout(timer)` inside the `finally` block or on a successful request.

**Why it's wrong:** If a request succeeds in `100ms`, but your timeout limit was set to `5000ms`, the browser keeps the timer running in the background for the remaining `4900ms`. If you run thousands of fetches, this creates a build-up of active timers in memory, causing memory leaks and degraded performance.

---

### Mistake 2: Leaving API Requests Without Timestamps or Timeout Constraints (Hanging Connection Vulnerability)

**The mistake:** Issuing network `fetch()` calls without timeout constraints on servers or clients.

**Why it's wrong:** Networks stall indefinitely due to dropped packets or backend deadlocks. Without timeouts, application threads remain blocked forever, depleting connection pools.

*Incorrect:*
```javascript
// Indefinitely hanging fetch call
const data = await fetch('https://unstable-api.com/data'); // ❌ Can hang indefinitely!
```

*Fix:*
```javascript
// Add timeout constraint using AbortSignal.timeout:
const data = await fetch('https://unstable-api.com/data', {
  signal: AbortSignal.timeout(8000) // Timeout after 8 seconds
});
```

---

### Mistake 3: Confusing Client Connection Timeout with Backend Gateway Timeout (`504 Gateway Timeout`)

**The mistake:** Configuring client-side timeout to 30 seconds when reverse proxy (Nginx) has a 10-second timeout.

**Why it's wrong:** If upstream proxies (Nginx/Cloudflare) time out before the client, Nginx returns HTTP 504 Gateway Timeout to the client regardless of client-side settings.

*Incorrect:*
```http
/* Client waits 30s, but reverse proxy drops connection at 10s with 504 status */
```

*Fix:*
```http
/* Align client timeouts, proxy read timeouts, and backend processing constraints */
```


---

## 5. Practice Exercises

### Exercise 1: Promise.race Request Timeout Guard

**Scenario:** An API client wraps fetch requests with a timeout race timer to abort requests that hang longer than expected.

**Requirements:**
1. Write fetchWithRaceTimeout(url, timeoutMs, mockFetch).
2. Race fetch against setTimeout rejection promise.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function fetchWithRaceTimeout(url, timeoutMs = 2000, mockFetch) {
>   const fetchFn = mockFetch || globalThis.fetch;
>
>   let timeoutId;
>   const timeoutPromise = new Promise((_, reject) => {
>     timeoutId = setTimeout(() => {
>       const err = new Error(`Request timed out after ${timeoutMs}ms`);
>       err.name = "TimeoutError";
>       reject(err);
>     }, timeoutMs);
>   });
>
>   return Promise.race([
>     fetchFn(url).then(res => {
>       clearTimeout(timeoutId);
>       return res;
>     }),
>     timeoutPromise
>   ]);
> }
>
> // Verification tests
> const slowFetch = (url) => new Promise(res => setTimeout(() => res({ ok: true }), 100));
>
> fetchWithRaceTimeout("https://api.com/slow", 20, slowFetch).catch(err => {
>   console.assert(err.name === "TimeoutError", "Test 1 Failed: Must reject with TimeoutError");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Promise.race Mechanics**: Promise.race resolves or rejects as soon as ANY of the input promises settles.
> 2. **Hanging Request Defense**: Prevents network requests from blocking client execution indefinitely.
> 3. **Timer Cleanup Mandatory**: Always clear setTimeout timers when request finishes to avoid memory leaks.
> 
---

### Exercise 2: Adaptive Network Timeout Estimator

**Scenario:** Calculates optimal HTTP request timeout duration dynamically based on rolling average RTT (Round Trip Time).

**Requirements:**
1. Write calculateAdaptiveTimeout(rttHistoryMs, safetyMultiplier).
2. Compute average RTT.
3. Apply safety multiplier (e.g. 2x) with min/max caps.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateAdaptiveTimeout(rttHistoryMs = [], safetyMultiplier = 2.5, minMs = 1000, maxMs = 10000) {
>   if (!Array.isArray(rttHistoryMs) || rttHistoryMs.length === 0) {
>     return 3000; // Default fallback timeout
>   }
>
>   const sum = rttHistoryMs.reduce((a, b) => a + b, 0);
>   const avgRtt = sum / rttHistoryMs.length;
>   const estimatedMs = Math.round(avgRtt * safetyMultiplier);
>
>   if (estimatedMs < minMs) return minMs;
>   if (estimatedMs > maxMs) return maxMs;
>
>   return estimatedMs;
> }
>
> // Verification tests
> console.assert(calculateAdaptiveTimeout([100, 200, 150], 2) === 600, "Test 1 Failed: (150 avg * 2 = 300 -> min 1000 cap applied)");
> console.assert(calculateAdaptiveTimeout([1000, 2000], 2) === 3000, "Test 2 Failed: 1500 avg * 2 = 3000ms");
> ```
>
> #### Technical Explanation
>
> 1. **Adaptive Timeout Strategy**: Adjusts timeout thresholds dynamically based on current network conditions (mobile vs fiber).
> 2. **RTT Moving Average**: Uses recent latency measurements to estimate realistic response times.
> 3. **Min/Max Timeout Bounds**: Prevents timeouts from becoming too aggressive (causing false timeouts) or too loose.
> 
---

### Exercise 3: Socket Cleanup on Timeout Abort

**Scenario:** Integrates AbortController with request timeout to ensure underlying TCP socket connection is closed when timeout fires.

**Requirements:**
1. Write fetchWithAbortTimeout(url, timeoutMs, mockFetch).
2. Trigger controller.abort() inside timeout callback.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchWithAbortTimeout(url, timeoutMs = 2000, mockFetch) {
>   const controller = new AbortController();
>   const timer = setTimeout(() => controller.abort(), timeoutMs);
>   const fetchFn = mockFetch || globalThis.fetch;
>
>   try {
>     const res = await fetchFn(url, { signal: controller.signal });
>     clearTimeout(timer);
>     return res;
>   } catch (err) {
>     clearTimeout(timer);
>     if (err.name === "AbortError") {
>       throw new Error(`HTTP Request aborted due to ${timeoutMs}ms timeout`);
>     }
>     throw err;
>   }
> }
>
> // Verification tests
> const hangingFetch = (url, opts) => new Promise((_, rej) => {
>   opts.signal.addEventListener("abort", () => {
>     const e = new Error("Aborted");
>     e.name = "AbortError";
>     rej(e);
>   });
> });
>
> fetchWithAbortTimeout("https://api.com/hang", 30, hangingFetch).catch(err => {
>   console.assert(err.message.includes("aborted due to 30ms timeout"), "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Socket Connection Closure**: Aborting signal closes active TCP/TLS connection sockets server-to-server.
> 2. **Resource Reclamation**: Frees client browser memory and socket pool slots immediately.
> 3. **Native Fetch Standard**: Standard modern pattern for implementing timeout guards in JavaScript.
---

## 6. Related Terms
- [AbortController / Cancellation](abortcontroller.md) — The browser API used to terminate active requests.
- [Retry & Exponential Backoff](retry_backoff.md) — The recovery patterns triggered after a request timeout occurs.

---

## 7. Key Takeaways
- Browser `fetch` requests can hang indefinitely if not configured with a timeout.
- Request Timeout enforces a maximum wait limit to keep the user interface responsive.
- Implement fetch timeouts using the `AbortController` API and a `setTimeout` handler.
- Always execute `clearTimeout()` when a request resolves to avoid memory leaks.
- Handle `AbortError` catch blocks to cleanly update the UI when timeouts occur.
