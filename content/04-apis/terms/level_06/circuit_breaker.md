# Circuit Breaker

> **Level 6 — Advanced API Concepts**
> Failing fast when a downstream API is down.

---

## 1. Prerequisites
- [Error Handling (try / catch)](../level_05/error_handling.md) — The structure used to catch request errors.
- [Retry & Exponential Backoff](../level_05/retry_backoff.md) — The client-side request recovery loop.

---

## 2. Term Category

**Architecture / Design (Universal: Vital for microservices architectures, cloud application gateways, and server integrations.)**: Circuit Breaker is a fundamental concept in this technology stack. **Level 6 — Advanced API Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern web architectures, servers frequently call downstream APIs (for instance, an e-commerce server calling a third-party payment gateway like Stripe). If the downstream API experiences an outage, it might take 30 seconds to respond to each request before timing out.

If your server blindly forwards requests to this broken downstream API, your local application threads will become blocked waiting for those 30-second timeouts. This rapidly exhausts your server's thread pool, memory, and database connections, causing **your** server to crash. This is called a **cascading failure**.

To prevent cascading outages, developers implement the **Circuit Breaker** pattern:
- It acts as an electrical safety fuse wrapped around a network query function.
- It intercepts requests and manages state transitions to shield your system:

```text
       Success
    ┌────────────┐
    ▼            │
┌────────┐  Failure limit  ┌────────┐  Cool-down time  ┌───────────┐
│ CLOSED │ ──────────────> │  OPEN  │ ───────────────> │ HALF-OPEN │
└────────┘  (Trips circuit)└────────┘                  └───────────┘
    ▲                                                        │
    │                                                        │
    └───────────────── Success trial ────────────────────────┘
```

---

### (2) The Three States of a Circuit Breaker

#### 1. Closed (Normal Operation)
- **Behavior:** The circuit is intact. Requests flow directly through to the downstream API.
- **Tracking:** The breaker monitors the failure rate (e.g. counting errors or calculating failure percentage over a sliding time window).

#### 2. Open (Tripped / Blocked)
- **Behavior:** Triggered when the failure rate crosses a configured threshold (e.g. 5 consecutive errors).
- **Action:** The breaker **fails fast**. It rejects all subsequent incoming requests immediately at the local level with a custom error, without sending any network traffic to the downstream service. This protects your local threads and gives the struggling downstream API time to recover.

#### 3. Half-Open (Testing Recovery)
- **Behavior:** Triggered automatically after a cool-down period (e.g. 60 seconds).
- **Action:** The breaker permits a small trial batch of requests to pass through to the downstream API:
  - If the trial requests succeed, the breaker resets to the **Closed** state, resuming normal service.
  - If a trial request fails, the breaker assumes the service is still down and immediately returns to the **Open** state, resetting the cool-down timer.

---

### (3) Reality Metaphor
Imagine your home toaster.
- **Closed (Normal):** You push the lever down. Current flows safely through the house wires to heat the elements.
- **Short-Circuit (Outage):** Water leaks into the toaster. The current surges violently.
- **Open (Tripped):** The electrical panel's **Circuit Breaker** instantly snaps open, cutting off electricity to the kitchen. This stops the surge before it heats the walls and burns down your entire house (**cascading failure**).
- **Half-Open (Testing):** Later, you dry the toaster and flip the breaker switch back on. You carefully test the toaster. If it works, you keep using it. If it sparks again, the breaker trips instantly once more.

---

### (4) JavaScript Implementation Example

A simple programmatic wrapper for a circuit breaker:

```javascript
class CircuitBreaker {
  constructor(requestFunction, failureThreshold = 3, cooldownMs = 5000) {
    this.requestFunction = requestFunction;
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    
    this.state = 'CLOSED';
    this.failures = 0;
    this.nextAttemptTime = 0;
  }

  async execute(...args) {
    const now = Date.now();

    // 1. Check if circuit is OPEN and cool-down has expired
    if (this.state === 'OPEN') {
      if (now > this.nextAttemptTime) {
        this.state = 'HALF-OPEN';
        console.log("Circuit entered HALF-OPEN state. Testing recovery...");
      } else {
        throw new Error("Circuit Breaker is OPEN. Request blocked.");
      }
    }

    try {
      const result = await this.requestFunction(...args);
      this.success();
      return result;
    } catch (error) {
      this.failure();
      throw error;
    }
  }

  success() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  failure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.cooldownMs;
      console.error(`Circuit TRIPPED (OPEN). Cooldown: ${this.cooldownMs}ms`);
    }
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Setting the failure threshold too low

**The mistake:** Configuring a circuit breaker to trip open after a single request failure.

**Why it's wrong:** Temporary network hiccups are normal on the internet. Tripping the breaker after a single error causes minor network glitches to trigger full local service outages. The threshold should be calculated over a window (e.g. 5 consecutive errors or a 50% failure rate over 20 requests).

---

### Mistake 2: Leaving Circuit Breakers in Open State Permanently Without Half-Open Health Checks

**The mistake:** Configuring a Circuit Breaker to trip to OPEN state on error but lacking a HALF-OPEN retry transition.

**Why it's wrong:** Without a HALF-OPEN state, the system never tests if the downstream service has recovered, keeping the breaker OPEN and failing all requests indefinitely.

*Incorrect:*
```http
/* Breaker trips OPEN on error but lacks auto-retry timer to test recovery */
```

*Fix:*
```http
/* Implement HALF-OPEN state timer (e.g. test 1 canary request after 30s) */
```

---

### Mistake 3: Setting Breaker Error Thresholds Too Low (Hypersensitive Breaker Trips)

**The mistake:** Tripping a Circuit Breaker OPEN after a single transient network timeout (`failureThreshold: 1`).

**Why it's wrong:** Transient blips are normal in distributed networks. Tripping breakers on single errors causes cascading system outages. Use percentage error thresholds (e.g. 50% errors over 10s).

*Incorrect:*
```javascript
const breaker = new CircuitBreaker(fn, { failureThreshold: 1 }); // ❌ Tripped by 1 transient blip!
```

*Fix:*
```javascript
const breaker = new CircuitBreaker(fn, {
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});
```


---

## 5. Practice Exercises

### Exercise 1: Circuit Breaker State Machine Engine

**Scenario:** A fault-tolerant microservice client implements a Circuit Breaker state machine (CLOSED -> OPEN -> HALF_OPEN).

**Requirements:**
1. Write createCircuitBreaker(asyncFn, failureThreshold, resetTimeoutMs).
2. Track state transitions.
3. Block calls in OPEN state.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createCircuitBreaker(asyncFn, failureThreshold = 2, resetTimeoutMs = 1000) {
>   let state = "CLOSED";
>   let failureCount = 0;
>   let nextAttemptTime = 0;
>
>   return async function execute(...args) {
>     const now = Date.now();
>
>     if (state === "OPEN") {
>       if (now > nextAttemptTime) {
>         state = "HALF_OPEN";
>       } else {
>         return { status: 503, state: "OPEN", error: "Circuit Breaker is OPEN" };
>       }
>     }
>
>     try {
>       const result = await asyncFn(...args);
>       if (state === "HALF_OPEN") {
>         state = "CLOSED";
>         failureCount = 0;
>       }
>       return { status: 200, state: "CLOSED", data: result };
>     } catch (err) {
>       failureCount++;
>       if (failureCount >= failureThreshold) {
>         state = "OPEN";
>         nextAttemptTime = Date.now() + resetTimeoutMs;
>       }
>       return { status: 500, state, error: err.message };
>     }
>   };
> }
>
> // Verification tests
> const flakyFn = async () => { throw new Error("Database Timeout"); };
> const breaker = createCircuitBreaker(flakyFn, 2, 500);
>
> breaker().then(res1 => {
>   console.assert(res1.state === "CLOSED", "Test 1 Failed");
>   return breaker().then(res2 => {
>     console.assert(res2.state === "OPEN", "Test 2 Failed: Circuit must trip to OPEN");
>     return breaker().then(res3 => {
>       console.assert(res3.status === 503 && res3.state === "OPEN", "Test 3 Failed: Blocked call");
>     });
>   });
> });
> ```
>
> #### Technical Explanation
>
> 1. **Circuit Breaker Pattern**: Defends microservices against cascading failures by stopping calls to broken downstream services.
> 2. **CLOSED State**: Normal operation: calls are dispatched to downstream service.
> 3. **OPEN State**: Failures exceeded threshold: immediately rejects calls locally without network dispatch.
> 4. **HALF_OPEN State**: Probe state: allows test call to check if downstream service recovered.
> 
---

### Exercise 2: Fallback Router Integration for Tripped Circuits

**Scenario:** An API gateway routes requests to a secondary fallback cache when the primary service's Circuit Breaker is OPEN.

**Requirements:**
1. Write executeWithFallbackRoute(primaryBreakerCall, fallbackCacheCall).
2. If primary returns 503 OPEN, execute fallbackCacheCall.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeWithFallbackRoute(primaryCall, fallbackCall) {
>   const primaryRes = await primaryCall();
>
>   if (primaryRes.status === 503 && primaryRes.state === "OPEN") {
>     const fallbackData = await fallbackCall();
>     return {
>       status: 200,
>       source: "FALLBACK_CACHE",
>       data: fallbackData
>     };
>   }
>
>   return { source: "PRIMARY_SERVICE", ...primaryRes };
> }
>
> // Verification tests
> const openPrimary = async () => ({ status: 503, state: "OPEN" });
> const fallbackCache = async () => ({ id: 42, cached: true });
>
> executeWithFallbackRoute(openPrimary, fallbackCache).then(res => {
>   console.assert(res.source === "FALLBACK_CACHE" && res.data.id === 42, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Graceful Service Degradation**: Serving stale or cached fallback data when primary microservices fail.
> 2. **Cascading Failure Prevention**: Isolates failing services so overall application functionality remains available.
> 3. **API Gateway Fallback Routing**: Standard pattern in Netflix Hystrix and Resilience4j microservice architectures.
> 
---

### Exercise 3: Rolling Window Failure Rate Auditor

**Scenario:** Tracks API call failure rates over a sliding 60-second window to decide when to trip the circuit breaker.

**Requirements:**
1. Write auditRollingFailureRate(callLogsWindow, maxFailureRatePercentage).
2. Calculate failure percentage.
3. Trip circuit if failure rate > max.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditRollingFailureRate(callLogsWindow = [], maxFailureRatePct = 50) {
>   if (callLogsWindow.length === 0) return { tripCircuit: false, failureRatePct: 0 };
>
>   const failedCount = callLogsWindow.filter(log => log.success === false).length;
>   const failureRatePct = Math.round((failedCount / callLogsWindow.length) * 100);
>
>   return {
>     tripCircuit: failureRatePct >= maxFailureRatePct,
>     failureRatePct,
>     totalCalls: callLogsWindow.length
>   };
> }
>
> // Verification tests
> const logs = [
>   { success: true }, { success: false }, { success: false }, { success: false }
> ];
>
> const audit = auditRollingFailureRate(logs, 50);
> console.assert(audit.failureRatePct === 75, "Test 1 Failed: 3/4 = 75%");
> console.assert(audit.tripCircuit === true, "Test 2 Failed: Must trip when rate > 50%");
> ```
>
> #### Technical Explanation
>
> 1. **Rolling Window Statistics**: Evaluates health over recent time windows rather than total lifetime call counts.
> 2. **Failure Rate Threshold**: Trips circuit when percentage of failed calls exceeds configured limit (e.g. 50%).
> 3. **Minimum Volume Guard**: Requires a minimum call volume in window before evaluating error percentage.
---

## 6. Related Terms
- [Rate Limiting (429 Too Many Requests)](rate_limiting.md) — The server defense policy that client circuit breakers help mitigate.
- [Webhooks](webhooks.md) — Asynchronous push notifications that bypass synchronous HTTP waiting loops.
- [Caching (ETag, Cache-Control)](caching.md) — Related concept: Caching (ETag, Cache-Control).

---

## 7. Key Takeaways
- The Circuit Breaker pattern prevents downstream API outages from causing cascading failures in your own system.
- In the CLOSED state, requests pass through and failure counts are tracked.
- In the OPEN state, the breaker fails fast locally to protect threads and prevent server overload.
- In the HALF-OPEN state, a small trial batch of requests is allowed to pass through to test recovery.
- Configure reasonable failure thresholds and cool-down timers to avoid unnecessary service blocks.
