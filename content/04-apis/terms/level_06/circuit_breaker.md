# Circuit Breaker

> **Level 6 — Advanced API Concepts**
> Failing fast when a downstream API is down.

---

## 1. Prerequisites
- [Error Handling (try / catch)](../level_05/error_handling.md) — The structure used to catch request errors.
- [Retry & Exponential Backoff](../level_05/retry_backoff.md) — The client-side request recovery loop.
---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Vital for microservices architectures, cloud application gateways, and server integrations.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: State Auditor

**Problem:** Review this log history of a circuit breaker wrapper configured with a **cooldown of 30s** and a **failure threshold of 3**. Identify the state of the circuit breaker at log entry #6:

1. `[10:00:00]` Request 1 failed.
2. `[10:00:01]` Request 2 failed.
3. `[10:00:02]` Request 3 failed. (Circuit state transitions)
4. `[10:00:05]` Request 4 failed with: "Circuit Breaker is OPEN. Request blocked."
5. `[10:00:10]` Request 5 failed with: "Circuit Breaker is OPEN. Request blocked."
6. `[10:00:45]` Request 6 triggered.

> [!check]- Answer
> - **`HALF-OPEN`** (The circuit tripped at 10:00:02. The 30-second cool-down window expired at 10:00:32. At 10:00:45, the next request transitions the breaker to the Half-Open state to test the downstream server).


---

### Exercise 2: Circuit Breaker 3-State Life Cycle Matrix

**Problem:** Describe the 3 operational states of a Circuit Breaker:
1. CLOSED
2. OPEN
3. HALF-OPEN

**Expected output:**
> [!check]- Answer
> ```text
> 1. CLOSED: Normal operation; requests pass through to downstream service
> 2. OPEN: Downstream service is failing; requests fail fast immediately without calling service
> 3. HALF-OPEN: Trial period; canary requests test if downstream service has recovered
> ```
> ```text
> CLOSED    -> Normal flow. Requests pass to downstream service.
> OPEN      -> Service failing. Calls fail fast immediately without execution.
> HALF-OPEN -> Testing recovery. Canary requests check downstream health.
> ```
> - **Explanation:** Circuit Breakers protect system resources when downstream services fail.
---

### Exercise 3: Fallback Response Pattern

**Problem:** What should a Circuit Breaker return when in the OPEN state to maintain degraded user experience?

**Expected output:**
> [!check]- Answer
> ```text
> A cached fallback response or default degraded static payload.
> ```
> ```javascript
> breaker.fallback(() => ({ items: [], cached: true, offline: true }));
> ```
> - **Explanation:** Fallback responses prevent cascade UI crashes when microservices fail.
---

## 7. Related Terms
- [Rate Limiting (429 Too Many Requests)](rate_limiting.md) — The server defense policy that client circuit breakers help mitigate.
- [Webhooks](webhooks.md) — Asynchronous push notifications that bypass synchronous HTTP waiting loops.
- [Caching (ETag, Cache-Control)](caching.md) — Related concept: Caching (ETag, Cache-Control).
---

## 8. Key Takeaways
- The Circuit Breaker pattern prevents downstream API outages from causing cascading failures in your own system.
- In the CLOSED state, requests pass through and failure counts are tracked.
- In the OPEN state, the breaker fails fast locally to protect threads and prevent server overload.
- In the HALF-OPEN state, a small trial batch of requests is allowed to pass through to test recovery.
- Configure reasonable failure thresholds and cool-down timers to avoid unnecessary service blocks.
