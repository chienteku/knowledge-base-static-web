# Idempotency Keys

> **Level 6 — Advanced API Concepts**
> Client-supplied key so a retried POST doesn't double-charge.

---

## 1. Prerequisites
- [Idempotency](./idempotency.md) — The concept of safe request repetition.
- [Retry & Exponential Backoff](../level_05/retry_backoff.md) — The client-side request recovery loop.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Crucial for payment gateways (like Stripe or PayPal), financial ledgers, and critical resource creations.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Collision Prevention

**Problem:** Determine if the server should process the request or return the cached response:

1. **Request 1:** `POST /charge`, Header: `Idempotency-Key: abc`, Payload: `{ "amount": 10 }` -> (Server processes and returns `200 OK`).
2. **Request 2:** `POST /charge`, Header: `Idempotency-Key: xyz`, Payload: `{ "amount": 10 }`
3. **Request 3:** `POST /charge`, Header: `Idempotency-Key: abc`, Payload: `{ "amount": 10 }`

> [!check]- Answer
> - 1. **Processed** (First time seeing key `abc`).
> - 2. **Processed** (New key `xyz` is registered).
> - 3. **Cached Response Returned** (Matches cached key `abc`; server skips processing to prevent double-charging).


---

### Exercise 2: Idempotency Key Header Lifecycle

**Problem:** Trace the server workflow when receiving request with `Idempotency-Key: uuid-abc`:
1. Key check in Redis
2. Execution path
3. Cache storing

**Expected output:**
```text
1. Check Redis for uuid-abc
2. If key exists: Return cached response immediately without re-executing logic
3. If key missing: Lock key, execute business logic, store response in Redis with TTL, return response
```

> [!check]- Answer
> ```text
> 1. Search Redis for key uuid-abc.
> 2. If present -> Return cached HTTP status and body payload instantly.
> 3. If absent -> Acquire lock, execute transaction, save result in Redis (24h TTL), return response.
> ```
> - **Explanation:** Idempotency keys cache and return exact historical HTTP responses.
---

### Exercise 3: Standard Idempotency Header Name

**Problem:** What is the standard IETF draft header name for idempotency keys?

**Expected output:**
```text
Idempotency-Key
```

> [!check]- Answer
> ```http
> Idempotency-Key: 7b9b8b08-8e65-4f36-a363-2287f3b5f903
> ```
> - **Explanation:** `Idempotency-Key` is the standard header used by payment APIs (Stripe).
---

## 7. Related Terms
- [Idempotent vs Safe Methods](../level_02/idempotent_vs_safe_methods.md) — The HTTP safety definitions.
- [Rate Limiting (429 Too Many Requests)](./rate_limiting.md) — The server protections that clients retry against.

---

## 8. Key Takeaways
- Idempotency Keys allow clients to safely retry non-idempotent POST operations.
- The client generates the key (typically a UUID v4) and sends it in request headers.
- The server checks a cache (like Redis); if present, it returns the cached response and skips processing.
- Idempotency keys must be unique to the transaction; reusing keys for different payloads causes conflicts.
- Do not fetch keys from the server; let the client generate them locally.
