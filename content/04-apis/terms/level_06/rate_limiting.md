# Rate Limiting (429 Too Many Requests)

> **Level 6 — Advanced API Concepts**
> A defensive mechanism where an API tracks how many requests a user makes in a certain time frame, and blocks them if they make too many.

---

## 1. Prerequisites
- [HTTP Status Codes](../level_02/status_codes.md) — Rate limiting uses a very specific 4xx status code.
- [API Keys](../level_04/api_keys.md) — How the server knows exactly *who* is making the requests.

---

## 2. Term Category

**Security / Infrastructure (Backend Architecture)**: Rate Limiting (429 Too Many Requests) is a fundamental concept in this technology stack. **Level 6 — Advanced API Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
APIs are expensive to run. Every time a Client calls your API, it uses your server's CPU and database memory. 
If a malicious hacker (or just a junior developer who accidentally wrote an infinite `while` loop) sends 10,000 requests per second to your API, your server will completely crash (a DDoS attack), taking the website offline for all your legitimate customers.
To protect the servers, engineers invented **Rate Limiting**. The server keeps a tally: "User Bob has made 50 requests in the last minute. The limit is 60. Let him through." If Bob hits 61 requests, the server instantly throws a wall up and refuses to process the request.

### (2) Reality Metaphor
Think of a nightclub bouncer. 
The club has a strict fire-code limit of 100 people. The bouncer has a clicker. Every time someone walks in, he clicks. If the club hits 100 people, the bouncer crosses his arms and says, "One in, one out." He refuses to let anyone else inside until the limit resets or people leave.

### (3) The 429 Status Code & Headers
If you hit a Rate Limit, the API will return a **`429 Too Many Requests`** HTTP status code. 
A good API will also send special HTTP Headers back in the response to tell the developer *exactly* when they are allowed to try again:
- `X-RateLimit-Limit: 60` (You are allowed 60 requests per minute).
- `X-RateLimit-Remaining: 0` (You have 0 left).
- `X-RateLimit-Reset: 1680003200` (A timestamp of exactly when your limit resets back to 60).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Ignoring the 429 in Frontend Code

**The mistake:** A frontend app receives a `429 Too Many Requests` from the API. The developer's error handling code just says: `if (!response.ok) { fetchAgain(); }`.

**Why it's wrong:** You just created a DDoS attack on yourself! The server blocked you for making too many requests, so your code immediately fires *another* request, which gets blocked, so it fires *another* request. You will be permanently blacklisted by the API provider. 
**Golden Rule:** If you receive a `429`, your code MUST pause. You should read the `X-RateLimit-Reset` header and use `setTimeout` to literally put your JavaScript to sleep until the API allows you to speak again.

---

### Mistake 2: Rate Limiting Unauthenticated Clients Solely by IP Address Behind NAT Proxies

**The mistake:** Limiting requests by client IP address (`req.ip`) for users inside corporate offices or university campuses.

**Why it's wrong:** Thousands of employees behind a corporate NAT share a single public IP address. Rate limiting by IP blocks the entire company when 1 user exceeds limits.

*Incorrect:*
```javascript
// Rate limiting by IP address only
const key = req.ip; // ❌ Blocks entire corporate network sharing public IP!
```

*Fix:*
```javascript
// Rate limit by combined IP + User-Agent or authenticated API Key / User ID:
const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
```

---

### Mistake 3: Omitting Standard Rate Limit Headers in API Responses

**The mistake:** Enforcing rate limits without providing `RateLimit-Limit` or `Retry-After` headers in HTTP responses.

**Why it's wrong:** Without rate limit headers, API clients cannot adapt request rates proactively before getting blocked by HTTP `429 Too Many Requests`.

*Incorrect:*
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{"error": "Rate limit exceeded"} // ❌ Missing Retry-After header!
```

*Fix:*
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700000060
```


---

## 5. Practice Exercises

### Exercise 1: Token Bucket Rate Limiter Algorithm

**Scenario:** An API gateway implements a Token Bucket Rate Limiter that allows burst capacity while enforcing an average request refill rate.

**Requirements:**
1. Write createTokenBucket(capacity, refillRatePerSec).
2. Implement consume(tokens).
3. Refill tokens based on elapsed time.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createTokenBucket(capacity = 5, refillRatePerSec = 1) {
>   let tokens = capacity;
>   let lastRefill = Date.now();
>
>   return {
>     consume(tokensRequested = 1) {
>       const now = Date.now();
>       const elapsedSeconds = (now - lastRefill) / 1000;
>       tokens = Math.min(capacity, tokens + elapsedSeconds * refillRatePerSec);
>       lastRefill = now;
>
>       if (tokens >= tokensRequested) {
>         tokens -= tokensRequested;
>         return { allowed: true, remainingTokens: Math.floor(tokens) };
>       }
>
>       return { allowed: false, remainingTokens: Math.floor(tokens) };
>     }
>   };
> }
>
> // Verification tests
> const bucket = createTokenBucket(2, 1);
> console.assert(bucket.consume(1).allowed === true, "Test 1 Failed");
> console.assert(bucket.consume(1).allowed === true, "Test 2 Failed");
> console.assert(bucket.consume(1).allowed === false, "Test 3 Failed: Bucket empty!");
> ```
>
> #### Technical Explanation
>
> 1. **Token Bucket Algorithm**: Allows temporary traffic bursts up to capacity while refilling tokens continuously at fixed rate.
> 2. **Burst Handling**: Capacity parameter controls maximum burst size allowed in a fraction of a second.
> 3. **Smooth Refill Rate**: Continuously adds tokens to bucket based on elapsed time delta.
> 
---

### Exercise 2: Sliding Window Log Rate Limiter Middleware

**Scenario:** An API security filter logs request timestamps in a sliding window to block client IP addresses exceeding request limits.

**Requirements:**
1. Write checkSlidingWindowRateLimit(clientIp, windowMs, maxRequests, logStore).
2. Filter logs older than windowMs.
3. Check count against maxRequests.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function checkSlidingWindowRateLimit(clientIp, windowMs = 60000, maxRequests = 3, logStore = new Map()) {
>   const now = Date.now();
>   const windowStart = now - windowMs;
>
>   const timestamps = logStore.get(clientIp) || [];
>   // Filter out timestamps outside current sliding window
>   const validTimestamps = timestamps.filter(ts => ts > windowStart);
>
>   if (validTimestamps.length >= maxRequests) {
>     logStore.set(clientIp, validTimestamps);
>     return {
>       allowed: false,
>       status: 429,
>       currentCount: validTimestamps.length,
>       retryAfterSeconds: Math.ceil((validTimestamps[0] - windowStart) / 1000)
>     };
>   }
>
>   validTimestamps.push(now);
>   logStore.set(clientIp, validTimestamps);
>
>   return {
>     allowed: true,
>     status: 200,
>     currentCount: validTimestamps.length
>   };
> }
>
> // Verification tests
> const store = new Map();
> const ip = "192.168.1.1";
>
> console.assert(checkSlidingWindowRateLimit(ip, 10000, 2, store).allowed === true, "Test 1 Failed");
> console.assert(checkSlidingWindowRateLimit(ip, 10000, 2, store).allowed === true, "Test 2 Failed");
> console.assert(checkSlidingWindowRateLimit(ip, 10000, 2, store).allowed === false, "Test 3 Failed: 3rd request blocked");
> ```
>
> #### Technical Explanation
>
> 1. **Sliding Window Accuracy**: Accurate sliding window tracking prevents boundary burst exploits inherent in fixed window limiters.
> 2. **429 Too Many Requests**: Standard HTTP status code returned when client rate limits are exceeded.
> 3. **Memory Optimization**: Requires pruning old timestamps to manage memory consumption.
> 
---

### Exercise 3: HTTP Rate Limit Response Headers Generator

**Scenario:** An API middleware builds standard RFC 6585 rate limit response headers for client consumption.

**Requirements:**
1. Write buildRateLimitHeaders(limit, remaining, resetTimeMs).
2. Return X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildRateLimitHeaders(limit = 100, remaining = 99, resetTimeMs) {
>   const resetEpochSeconds = Math.ceil(resetTimeMs / 1000);
>
>   return {
>     "X-RateLimit-Limit": String(limit),
>     "X-RateLimit-Remaining": String(Math.max(0, remaining)),
>     "X-RateLimit-Reset": String(resetEpochSeconds)
>   };
> }
>
> // Verification tests
> const headers = buildRateLimitHeaders(60, 45, Date.now() + 30000);
> console.assert(headers["X-RateLimit-Limit"] === "60", "Test 1 Failed");
> console.assert(headers["X-RateLimit-Remaining"] === "45", "Test 2 Failed");
> console.assert(headers["X-RateLimit-Reset"] !== undefined, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **X-RateLimit Headers**: De-facto standard headers informing client of remaining quota before throttling.
> 2. **X-RateLimit-Limit**: Maximum number of allowed requests per time window.
> 3. **X-RateLimit-Remaining**: Number of requests client has remaining in current window.
> 4. **X-RateLimit-Reset**: Unix epoch timestamp when current rate limit window resets.
---

## 6. Related Terms
- [HTTP Status Codes](../level_02/status_codes.md) — `429` is the official code for Rate Limiting.
- [Error Handling (try / catch)](../level_05/error_handling.md) — Where you write the logic to pause your requests.
- [Bulk / Batch Requests](batch_requests.md) — Related concept: Bulk / Batch Requests.
- [Circuit Breaker](circuit_breaker.md) — Related concept: Circuit Breaker.
- [Idempotency Keys](idempotency_keys.md) — Related concept: Idempotency Keys.
- [Webhooks](webhooks.md) — Related concept: Webhooks.
- [Caching (ETag, Cache-Control)](caching.md) — Related concept: Caching (ETag, Cache-Control).
- [API Gateway](../level_10/api_gateway.md) — Related concept: API Gateway.

---

## 7. Key Takeaways
- **Rate Limiting** protects APIs from crashing due to too much traffic (accidental or malicious).
- Exceeding the limit results in a **`429 Too Many Requests`** HTTP error.
- Well-designed APIs use **Headers** to tell you exactly how many requests you have left and when the limit resets.
- Never write frontend code that blindly retries a request after receiving a 429!
