# Idempotency Keys

> **Level 6 — Advanced API Concepts**
> Client-supplied key so a retried POST doesn't double-charge.

---

## 1. Prerequisites
- [Idempotency](idempotency.md) — The concept of safe request repetition.
- [Retry & Exponential Backoff](../level_05/retry_backoff.md) — The client-side request recovery loop.

---

## 2. Term Category

**Architecture / Design (Universal: Crucial for payment gateways , financial ledgers, and critical resource creations.)**: Idempotency Keys is a fundamental concept in this technology stack. **Level 6 — Advanced API Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Certain operations are non-idempotent by nature—for example, calling `POST /api/payments` to charge a customer's credit card. If the client makes a payment request, but the network connection drops before receiving the server's response, the client enters an uncertain state.
- If the client retries the request, they risk charging the user's card twice.
- If they do not retry, the checkout process fails silently.

To allow clients to safely retry non-idempotent `POST` requests, APIs implement **Idempotency Keys**:
- **The Key:** A unique, random client-generated string (typically a UUID v4) sent inside a custom HTTP header (e.g. `Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`).
- **Server Cache Verification:** When the server receives a request with this header, it checks a fast database cache (like Redis) to see if it has already processed a request with that exact key:
  - **If the key is not in cache (New Request):** The server processes the request, saves the response status and payload in the cache linked to that key, and returns the response.
  - **If the key is in cache (Duplicate Request):** The server skips processing entirely. It simply returns the cached response from the first execution immediately.

---

### (2) Reality Metaphor
Imagine buying a movie ticket.
- **Without an Idempotency Key:** You hand the teller a $10 bill. If you walk up again, hand them a $10 bill, they give you a second ticket. You have spent $20 for two tickets.
- **With an Idempotency Key:** You write a unique serial code (e.g. `"TXN-998"`) on a slip of paper and slide it to the teller with your money.
  - The teller logs: `"TXN-998 is associated with Ticket #12"`.
  - If the power goes out, and you return to the counter 5 minutes later unsure if the purchase went through, you hand them the exact same slip `"TXN-998"`.
  - The teller checks their log: *"Ah, TXN-998 has already been processed. Here is the Ticket #12 you bought earlier."* They do not charge you again.

---

### (3) Backend Implementation Architecture (Express & Redis)

Here is a conceptual middleware implementing idempotency checks on the server:

```javascript
import Redis from 'ioredis';
const redis = new Redis();

async function idempotencyMiddleware(req, res, next) {
  const key = req.headers['idempotency-key'];
  
  if (!key) {
    return next(); // If no key is provided, skip validation
  }

  // 1. Check if the key has been processed in Redis
  const cachedResponse = await redis.get(`idempotency:${key}`);
  
  if (cachedResponse) {
    const { status, body } = JSON.parse(cachedResponse);
    console.log(`Duplicate request detected. Returning cached response for key: ${key}`);
    return res.status(status).json(body);
  }

  // 2. Intercept response to cache it on successful execution
  const originalJson = res.json;
  res.json = function (body) {
    // Cache the response status and body in Redis (expires in 24 hours)
    redis.set(`idempotency:${key}`, JSON.stringify({
      status: res.statusCode,
      body: body
    }), 'EX', 86400);
    
    return originalJson.call(this, body);
  };

  next();
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Generating the idempotency key on the server side

**The mistake:** Creating an endpoint `GET /api/get-idempotency-key` for the client to fetch a key before making a POST request.

**Why it's wrong:** This introduces a round-trip dependency. If the request to fetch the key fails, the client is still blocked. The key must be generated **locally by the client** (using UUID libraries) to ensure it is available immediately without network calls.

### Mistake 2: Reusing the same key for different request payloads

**The mistake:** Sending `Idempotency-Key: 123` to purchase a `$10` book, and later sending the same `Idempotency-Key: 123` to purchase a `$100` watch.

**Why it's wrong:** The server will find key `123` in the cache and immediately return the cached response for the `$10` book, ignoring the `$100` watch request. The watch will never be purchased.

*Fix:* The key must be unique to the specific intent and payload of that transaction. If the payload values change, a new key must be generated.

---

### Mistake 3: Reusing the Same Idempotency Key Across Different Request Payloads

**The mistake:** Sending `Idempotency-Key: key-123` for a $10 payment, and then sending `Idempotency-Key: key-123` for a $500 payment.

**Why it's wrong:** If payload parameters change for an existing Idempotency Key, the server must reject the request with HTTP `400 Bad Request` or `409 Conflict` (Payload Mismatch Error).

*Incorrect:*
```http
/* Reusing key-123 with modified payload parameters */
POST /api/payments (Idempotency-Key: key-123, amount: 500)
```

*Fix:*
```http
// Server checks stored payload hash for key-123 and returns 409 Conflict if payload changed
HTTP/1.1 409 Conflict
Content-Type: application/json

{"error": "Idempotency key payload mismatch"}
```

---

### Mistake 4: Storing Idempotency Keys in Server Memory Without Persistence (Redis)

**The mistake:** Storing processed Idempotency Keys in JS memory arrays (`const keys = new Set()`).

**Why it's wrong:** Server restarts or multi-instance load balancing loses memory arrays, causing retried requests to execute twice. Store keys in Redis with TTL.

*Incorrect:*
```javascript
const keyStore = new Set(); // ❌ Memory storage fails on multi-server clusters!
```

*Fix:*
```javascript
// Store idempotency key and cached response in Redis with 24h TTL:
await redis.set(`idempotency:${key}`, JSON.stringify(response), 'EX', 86400);
```


---

## 5. Practice Exercises

### Exercise 1: Idempotency-Key Header Processing Middleware

**Scenario:** A billing API middleware inspects the `Idempotency-Key` header on POST payment requests, returning cached responses for duplicate keys.

**Requirements:**
1. Write processIdempotentPayment(idempotencyKey, paymentPayload, cacheMap).
2. If key cached, return saved response.
3. Else process payment and save in cacheMap.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processIdempotentPayment(idempotencyKey, paymentPayload, cacheMap = new Map()) {
>   if (!idempotencyKey || typeof idempotencyKey !== "string") {
>     return { status: 400, error: "Missing Idempotency-Key header" };
>   }
>
>   if (cacheMap.has(idempotencyKey)) {
>     const cached = cacheMap.get(idempotencyKey);
>     return {
>       status: cached.status,
>       isDuplicateResponse: true,
>       body: cached.body
>     };
>   }
>
>   // Process new payment transaction
>   const responseBody = {
>     chargeId: `ch_${Date.now()}`,
>     amount: paymentPayload.amount,
>     status: "SUCCEEDED"
>   };
>
>   cacheMap.set(idempotencyKey, { status: 201, body: responseBody });
>
>   return {
>     status: 201,
>     isDuplicateResponse: false,
>     body: responseBody
>   };
> }
>
> // Verification tests
> const cache = new Map();
> const key = "key_uuid_8888";
> const payload = { amount: 100 };
>
> const res1 = processIdempotentPayment(key, payload, cache);
> console.assert(res1.status === 201 && res1.isDuplicateResponse === false, "Test 1 Failed");
>
> const res2 = processIdempotentPayment(key, payload, cache);
> console.assert(res2.status === 201 && res2.isDuplicateResponse === true, "Test 2 Failed");
> console.assert(res1.body.chargeId === res2.body.chargeId, "Test 3 Failed: Must return identical charge ID");
> ```
>
> #### Technical Explanation
>
> 1. **Idempotency-Key Header Pattern**: Client sends unique UUID header with non-idempotent POST requests.
> 2. **Response Caching**: Server caches HTTP status code and response body under key; duplicate requests replay cached response.
> 3. **Financial API Defense**: Prevents charging customers twice during network timeouts or accidental button double-clicks.
> 
---

### Exercise 2: Idempotency Lock & Concurrent Collision Guard

**Scenario:** A lock manager handles concurrent duplicate requests arriving simultaneously with the same `Idempotency-Key`, placing secondary requests in IN_PROGRESS lock wait.

**Requirements:**
1. Write acquireIdempotencyLock(key, lockStore).
2. If key is locked, return 409 Conflict.
3. Set lock status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function acquireIdempotencyLock(key, lockStore = new Map()) {
>   if (lockStore.has(key)) {
>     const lock = lockStore.get(key);
>     if (lock.status === "IN_PROGRESS") {
>       return { acquired: false, status: 409, error: "Concurrent request in progress for this Idempotency-Key" };
>     }
>     if (lock.status === "COMPLETED") {
>       return { acquired: false, status: 200, cachedResponse: lock.response };
>     }
>   }
>
>   lockStore.set(key, { status: "IN_PROGRESS", startTime: Date.now() });
>   return { acquired: true };
> }
>
> // Verification tests
> const locks = new Map();
> const k = "key_123";
>
> const first = acquireIdempotencyLock(k, locks);
> console.assert(first.acquired === true, "Test 1 Failed");
>
> const concurrent = acquireIdempotencyLock(k, locks);
> console.assert(concurrent.acquired === false && concurrent.status === 409, "Test 2 Failed: Concurrent lock must return 409 Conflict");
> ```
>
> #### Technical Explanation
>
> 1. **Concurrent Request Race Conditions**: Two identical requests with same key arriving simultaneously require lock coordination.
> 2. **IN_PROGRESS Status Lock**: Locks key while first request is processing to prevent double database execution.
> 3. **409 Conflict Status**: Returns 409 Conflict if client sends concurrent duplicate before first request completes.
> 
---

### Exercise 3: Idempotency Key Cache TTL Expiration Manager

**Scenario:** A key expiration manager purges cached idempotency keys after a configured TTL (e.g. 24 hours).

**Requirements:**
1. Write purgeExpiredIdempotencyKeys(cacheMap, maxAgeMs).
2. Delete entries older than maxAgeMs.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function purgeExpiredIdempotencyKeys(cacheMap = new Map(), maxAgeMs = 86400000) {
>   const now = Date.now();
>   let purgedCount = 0;
>
>   for (const [key, record] of cacheMap.entries()) {
>     if (now - record.created > maxAgeMs) {
>       cacheMap.delete(key);
>       purgedCount++;
>     }
>   }
>
>   return { purgedCount, remainingCount: cacheMap.size };
> }
>
> // Verification tests
> const cache = new Map([
>   ["k1", { created: Date.now() - 100000 }],
>   ["k2", { created: Date.now() - 90000000 }] // Expired! (> 86400000ms)
> ]);
>
> const res = purgeExpiredIdempotencyKeys(cache, 86400000);
> console.assert(res.purgedCount === 1, "Test 1 Failed");
> console.assert(cache.has("k1") === true && cache.has("k2") === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Idempotency Key TTL**: Idempotency keys should be retained for 24-48 hours to handle retries, then purged to free memory.
> 2. **Memory Footprint Control**: Purging old keys prevents unbounded growth in Redis / database storage.
> 3. **Client Key Generation Rule**: Clients generate fresh V4 UUIDs for every distinct business transaction attempt.
---

## 6. Related Terms
- [Idempotent vs Safe Methods](../level_02/idempotent_vs_safe_methods.md) — The HTTP safety definitions.
- [Rate Limiting (429 Too Many Requests)](rate_limiting.md) — The server protections that clients retry against.

---

## 7. Key Takeaways
- Idempotency Keys allow clients to safely retry non-idempotent POST operations.
- The client generates the key (typically a UUID v4) and sends it in request headers.
- The server checks a cache (like Redis); if present, it returns the cached response and skips processing.
- Idempotency keys must be unique to the transaction; reusing keys for different payloads causes conflicts.
- Do not fetch keys from the server; let the client generate them locally.
