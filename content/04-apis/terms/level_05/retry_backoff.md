# Retry & Exponential Backoff

> **Level 5 — Fetching Data (Client-Side)**
> Re-attempting failed calls with growing delays.

---

## 1. Prerequisites
- [Error Handling (try / catch)](error_handling.md) — The core structure for trapping query failures.
- [Rate Limiting (429 Too Many Requests)](../level_06/rate_limiting.md) — The server-side restriction policy.

---

## 2. Term Category
- **Browser API / Networking**

---

## 3. Environment Context
- **Universal**: Crucial for client-side API calls and server-to-server microservice integrations.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Backoff Calculator

**Problem:** Calculate the exponential backoff delay (excluding jitter) for retry attempt #2 (the third try overall) if the base delay is set to `500ms`. The retry attempts are 0-indexed (Attempt 0 = 1st retry, Attempt 1 = 2nd retry).

> [!check]- Answer
> - The formula for exponential delay is $\text{Delay} = \text{base} \times 2^{\text{attempt}}$.
> - For attempt #1 (2nd retry), the delay is $500 \times 2^1 = 1000\text{ms}$.

> [!check]- Answer
> - **`2000ms`** (Calculation: $500 \times 2^2 = 500 \times 4 = 2000\text{ms}$).


---

### Exercise 2: Exponential Backoff Math Calculation

**Problem:** Calculate backoff delay for attempt #3 using formula `delay = 100ms * 2^attempt`.

**Expected output:**
> [!check]- Answer
> ```text
> 800ms (100ms * 2^3 = 100 * 8 = 800ms).
> ```
> ```text
> 800ms (100ms * 2^3 = 100 * 8 = 800ms).
> ```
> - **Explanation:** Exponential backoff doubles delay duration on each consecutive attempt.
---

### Exercise 3: Jitter Purpose in Retries

**Problem:** Why is random "Jitter" added to exponential backoff delay calculations?

**Expected output:**
> [!check]- Answer
> ```text
> Jitter introduces random variation to prevent thousands of retrying clients from executing retries at the exact same synchronized timestamp (thundering herd problem).
> ```
> ```text
> Jitter introduces random variation to prevent thousands of retrying clients from executing retries at the exact same synchronized timestamp (thundering herd problem).
> ```
> - **Explanation:** Random jitter breaks synchronized client retry spikes.
---

## 7. Related Terms
- [Idempotency](../level_06/idempotency.md) — The server property that makes repeating requests safe.
- [Request Timeout](request_timeout.md) — The client-side cancel condition that often triggers a retry loop.

---

## 8. Key Takeaways
- Retrying requests recovers your application from transient, temporary network drops.
- Immediate retries risk causing a Thundering Herd problem, crashing the server.
- Exponential backoff increases the delay exponentially between each retry attempt.
- Adding random Jitter desynchronizes retries from different clients to distribute server load.
- Never retry non-idempotent requests (`POST`) unless you are using idempotency keys.
