# Request Timeout

> **Level 5 — Fetching Data (Client-Side)**
> Aborting a request that hangs too long.

---

## 1. Prerequisites
- [The fetch() API](fetch.md) — The network request API.
- [Promises (in the context of networks)](promises.md) — The async data wrapper objects.
---

## 2. Term Category
- **Browser API / Networking**

---

## 3. Environment Context
- **Universal**: Applicable to browser scripting and Node.js backend request architectures.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Timeout Racer

**Problem:** Complete the logic for a custom Promise wrapper that rejects if the target network promise takes longer than `2000ms` using `Promise.race()`:

```javascript
function timeoutRace(networkPromise, timeoutMs = 2000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Timeout reached")), timeoutMs);
  });
  
  return Promise.race([networkPromise, timeoutPromise]);
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Promise.race Timeout Pattern

**Problem:** Write a `fetchWithTimeout(url, ms)` helper using `Promise.race()` and `setTimeout()`.

**Expected output:**
> [!check]- Answer
> ```text
> function fetchWithTimeout(url, ms) { const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)); return Promise.race([fetch(url), timeout]); }
> ```
> ```javascript
> function fetchWithTimeout(url, ms) {
> const timeout = new Promise((_, reject) =>
> setTimeout(() => reject(new Error('Request timed out')), ms)
> );
> return Promise.race([fetch(url), timeout]);
> }
> ```
> - **Explanation:** `Promise.race` settles as soon as either the fetch or timeout promise completes.
---

### Exercise 3: 504 Gateway Timeout Cause

**Problem:** What causes an HTTP `504 Gateway Timeout` status code?

**Expected output:**
> [!check]- Answer
> ```text
> An upstream server (like an API gateway, load balancer, or proxy) did not receive a timely response from an internal microservice.
> ```
> ```text
> An upstream server (like an API gateway, load balancer, or proxy) did not receive a timely response from an internal microservice.
> ```
> - **Explanation:** 504 signals gateway or proxy timeout waiting on backend processing.
---

## 7. Related Terms
- [AbortController / Cancellation](abortcontroller.md) — The browser API used to terminate active requests.
- [Retry & Exponential Backoff](retry_backoff.md) — The recovery patterns triggered after a request timeout occurs.
---

## 8. Key Takeaways
- Browser `fetch` requests can hang indefinitely if not configured with a timeout.
- Request Timeout enforces a maximum wait limit to keep the user interface responsive.
- Implement fetch timeouts using the `AbortController` API and a `setTimeout` handler.
- Always execute `clearTimeout()` when a request resolves to avoid memory leaks.
- Handle `AbortError` catch blocks to cleanly update the UI when timeouts occur.
