# Retry & Exponential Backoff

> **Level 5 — Fetching Data (Client-Side)**
> Re-attempting failed calls with growing delays.

---

## 1. Prerequisites
- [Error Handling (try / catch)](error_handling.md) — The core structure for trapping query failures.
- [Rate Limiting (429 Too Many Requests)](../level_06/rate_limiting.md) — The server-side restriction policy.

---

## 2. Term Category

**Browser API / Networking (Universal: Crucial for client-side API calls and server-to-server microservice integrations.)**: Retry & Exponential Backoff is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Mobile and wireless network connections are inherently unstable. Temporary network dropouts, router congestion, or server-side CPU spikes can cause API requests to fail. These are known as **transient errors**—errors that resolve themselves if you wait a brief moment.

If your client application displays an error screen immediately on a transient failure, the user experience suffers. Instead, the application should retry the request.

However, retrying immediately in a tight loop is dangerous:
- If a server is struggling under heavy traffic, and thousands of clients start hammering it with instant, rapid retries, it triggers a **Thundering Herd** problem—a self-inflicted Distributed Denial of Service (DDoS) attack that crashes the server.

To prevent this, developers implement **Exponential Backoff with Jitter**:
- **Exponential Backoff:** The client increases the wait time exponentially between each retry attempt (e.g. wait `1s`, then `2s`, then `4s`, then `8s`).
- **Jitter:** A small random delay added to the backoff time. This ensures that different clients do not retry at the exact same millisecond mark, spreading the server load evenly over time.

---

### (2) Reality Metaphor
Imagine seeking feedback from a busy office manager.
- **Naive Retry** is like **knocking on their door every 2 seconds** until they answer. This irritates the manager, interrupts their recovery work, and ensures they stay behind locked doors longer.
- **Exponential Backoff** is like knocking once. If there is no reply, you decide: *"I'll wait 2 minutes."* Next time, you wait 4 minutes, then 8 minutes, and then 16 minutes. You give the manager breathing room to clear their backlog.
- **Jitter** is like multiple employees waiting. Instead of all knocking exactly at the 5-minute mark, some wait 4 minutes and 30 seconds, while others wait 5 minutes and 15 seconds.

---

### (3) JavaScript Implementation Example

```javascript
// Helper delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, retries = 3, baseDelayMs = 1000) {
  try {
    const res = await fetch(url, options);
    
    // Treat server overload (503) or rate limit (429) as retryable errors
    if (!res.ok) {
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      return res; // Return client error statuses (like 404) immediately without retrying
    }
    return res;
  } catch (error) {
    if (retries === 0) {
      throw new Error(`Max retries reached. Original error: ${error.message}`);
    }
    
    // Calculate exponential delay: base * 2^attempt
    const expDelay = baseDelayMs * Math.pow(2, 3 - retries);
    
    // Add random jitter: +/- 30% of the calculated delay
    const jitter = (Math.random() - 0.5) * 0.3 * expDelay;
    const finalDelay = expDelay + jitter;
    
    console.warn(`Request failed: ${error.message}. Retrying in ${Math.round(finalDelay)}ms...`);
    await delay(finalDelay);
    
    return fetchWithRetry(url, options, retries - 1, baseDelayMs);
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Retrying non-idempotent requests (like `POST`)

**The mistake:** Automatically retrying a failed `POST /api/orders/checkout` request when a connection drops.

**Why it's wrong:** The network connection might have dropped *after* the server successfully processed the request but *before* it sent the response. If you retry the POST request, the server will process it a second time, charging the user's card twice.

*Fix:* Only retry **safe or idempotent methods** (like `GET`, `PUT`, `DELETE`). Do not retry `POST` requests unless your API implements **Idempotency Keys** to identify duplicate payloads.

---

### Mistake 2: Executing Immediate Retries Without Exponential Backoff ("Retry Storm Anti-Pattern")

**The mistake:** Retrying failed API requests immediately in a tight `while` loop when a server returns 503 Service Unavailable.

**Why it's wrong:** Immediate retries send thousands of requests per second to a struggling server, compounding server overload and crashing infrastructure. Implement **Exponential Backoff with Jitter**.

*Incorrect:*
```javascript
// Immediate retry loop without backoff delay
while (retries < 5) {
  try { return await fetch(url); }
  catch (e) { retries++; } // ❌ Floods struggling server instantly!
}
```

*Fix:*
```javascript
// Exponential backoff delay (2^retry * 100ms):
const delay = Math.pow(2, attempt) * 100 + Math.random() * 100;
await new Promise(r => setTimeout(r, delay));
```

---

### Mistake 3: Retrying Non-Idempotent Request Methods (e.g. `POST`) Automatically

**The mistake:** Retrying failed `POST /api/payments` requests on network timeouts without idempotency keys.

**Why it's wrong:** If a `POST` payment request succeeded on the server but timed out on the network return path, retrying creates duplicate payment charges. Retries must be limited to safe/idempotent methods or use Idempotency Keys.

*Incorrect:*
```http
/* Retrying POST requests on 500 error without Idempotency-Key */
```

*Fix:*
```http
/* Include Idempotency-Key header or retry GET/PUT requests exclusively */
```


---

## 5. Practice Exercises

### Exercise 1: Exponential Backoff & Full Jitter Retry Engine

**Scenario:** An API client retries failed HTTP requests using exponential backoff delay with randomized Full Jitter to prevent thundering herd problems.

**Requirements:**
1. Write fetchWithBackoff(fn, maxRetries, baseDelayMs).
2. Calculate `delay = min(maxDelay, baseDelay * 2^attempt)`.
3. Apply Full Jitter `random() * delay`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchWithBackoff(asyncFn, maxRetries = 3, baseDelayMs = 100, mockSleep) {
>   let attempt = 0;
>   const sleep = mockSleep || ((ms) => new Promise(r => setTimeout(r, ms)));
>
>   while (attempt <= maxRetries) {
>     try {
>       return await asyncFn();
>     } catch (err) {
>       if (attempt === maxRetries) throw err;
>
>       // Exponential backoff: base * 2^attempt
>       const expDelay = baseDelayMs * Math.pow(2, attempt);
>       // Full Jitter: random between 0 and expDelay
>       const jitterDelay = Math.floor(Math.random() * expDelay);
>
>       await sleep(jitterDelay);
>       attempt++;
>     }
>   }
> }
>
> // Verification tests
> let calls = 0;
> const delays = [];
> const mockSleep = async (ms) => delays.push(ms);
> const flakyFn = async () => {
>   calls++;
>   if (calls < 3) throw new Error("503 Service Unavailable");
>   return "SUCCESS";
> };
>
> fetchWithBackoff(flakyFn, 3, 100, mockSleep).then(res => {
>   console.assert(res === "SUCCESS", "Test 1 Failed");
>   console.assert(calls === 3, "Test 2 Failed: Retried twice");
>   console.assert(delays.length === 2, "Test 3 Failed: Slept twice");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Exponential Backoff Formula**: Multiplies delay by power of 2 (100ms, 200ms, 400ms, 800ms) on consecutive failures.
> 2. **Full Jitter Purpose**: Randomizes delay intervals to spread out retry bursts across multiple distributed clients.
> 3. **Thundering Herd Problem**: Without jitter, synchronized retries from thousands of clients crush recovering backend servers.
> 
---

### Exercise 2: Retry-After Header Aware Retry Strategy

**Scenario:** An API client inspects HTTP 429 / 503 response headers and honors server-requested `Retry-After` delay intervals.

**Requirements:**
1. Write executeRetryAfter(fetchFn, maxRetries).
2. If 429 response, read `Retry-After` header (seconds or HTTP Date).
3. Sleep requested duration.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeRetryAfter(fetchFn, maxRetries = 2, mockSleep) {
>   let attempt = 0;
>   const sleep = mockSleep || ((ms) => new Promise(r => setTimeout(r, ms)));
>
>   while (attempt <= maxRetries) {
>     const res = await fetchFn();
>     if (res.status !== 429 && res.status !== 503) {
>       return res;
>     }
>
>     if (attempt === maxRetries) return res;
>
>     const retryAfterHeader = res.headers?.get("retry-after") || res.headers?.get("Retry-After");
>     let delayMs = 1000; // Default fallback delay
>
>     if (retryAfterHeader) {
>       const seconds = parseInt(retryAfterHeader, 10);
>       if (!isNaN(seconds)) {
>         delayMs = seconds * 1000;
>       }
>     }
>
>     await sleep(delayMs);
>     attempt++;
>   }
> }
>
> // Verification tests
> let attempts = 0;
> const sleptMs = [];
> const mockSleep = async (ms) => sleptMs.push(ms);
>
> const mockRateLimited = async () => {
>   attempts++;
>   if (attempts === 1) {
>     return {
>       status: 429,
>       headers: new Map([["retry-after", "3"]]) // Server asks for 3s delay
>     };
>   }
>   return { status: 200, data: "OK" };
> };
>
> executeRetryAfter(mockRateLimited, 2, mockSleep).then(res => {
>   console.assert(res.status === 200, "Test 1 Failed");
>   console.assert(sleptMs[0] === 3000, "Test 2 Failed: Must honor 3 second Retry-After header");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Retry-After Header**: HTTP header sent with 429 Too Many Requests or 503 Service Unavailable responses.
> 2. **Header Format Variants**: Header contains either delay integer in seconds (`Retry-After: 120`) or HTTP Date string.
> 3. **Server Rate Governance**: Honoring server delay request prevents getting permanently IP banned by backend firewalls.
> 
---

### Exercise 3: Circuit Breaker Pattern Integration for Failed Retries

**Scenario:** Implements a Circuit Breaker state machine (CLOSED -> OPEN -> HALF_OPEN) to trip and stop retries when service error rate spikes.

**Requirements:**
1. Write createCircuitBreaker(fn, failureThreshold, resetTimeoutMs).
2. Track failures; trip to OPEN state when threshold exceeded.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createCircuitBreaker(asyncFn, failureThreshold = 3, resetTimeoutMs = 1000) {
>   let state = "CLOSED";
>   let failureCount = 0;
>   let nextAttemptTime = 0;
>
>   return async function call(...args) {
>     const now = Date.now();
>
>     if (state === "OPEN") {
>       if (now > nextAttemptTime) {
>         state = "HALF_OPEN";
>       } else {
>         throw new Error("CircuitBreaker: OPEN - Request blocked");
>       }
>     }
>
>     try {
>       const result = await asyncFn(...args);
>       if (state === "HALF_OPEN") {
>         state = "CLOSED";
>         failureCount = 0;
>       }
>       return result;
>     } catch (err) {
>       failureCount++;
>       if (failureCount >= failureThreshold) {
>         state = "OPEN";
>         nextAttemptTime = Date.now() + resetTimeoutMs;
>       }
>       throw err;
>     }
>   };
> }
>
> // Verification tests
> const failingApi = async () => { throw new Error("DB Error"); };
> const breaker = createCircuitBreaker(failingApi, 2, 500);
>
> breaker().catch(() => {});
> breaker().catch(() => {}); // Failure threshold (2) reached!
>
> breaker().catch(err => {
>   console.assert(err.message.includes("CircuitBreaker: OPEN"), "Test 1 Failed: Circuit must trip to OPEN");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Circuit Breaker Purpose**: Prevents cascading failures by stopping network requests to failing downstream services.
> 2. **CLOSED State**: Normal operation: requests pass through.
> 3. **OPEN State**: Failures exceeded threshold: immediately trips and fails requests without network dispatch.
> 4. **HALF-OPEN State**: Test state: allows single probe request to check if downstream service recovered.
---

## 6. Related Terms
- [Idempotency](../level_06/idempotency.md) — The server property that makes repeating requests safe.
- [Request Timeout](request_timeout.md) — The client-side cancel condition that often triggers a retry loop.

---

## 7. Key Takeaways
- Retrying requests recovers your application from transient, temporary network drops.
- Immediate retries risk causing a Thundering Herd problem, crashing the server.
- Exponential backoff increases the delay exponentially between each retry attempt.
- Adding random Jitter desynchronizes retries from different clients to distribute server load.
- Never retry non-idempotent requests (`POST`) unless you are using idempotency keys.
