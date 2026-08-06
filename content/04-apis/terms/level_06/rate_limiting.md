# Rate Limiting (429 Too Many Requests)

> **Level 6 — Advanced API Concepts**
> A defensive mechanism where an API tracks how many requests a user makes in a certain time frame, and blocks them if they make too many.

---

## 1. Prerequisites
- [HTTP Status Codes](../level_02/status_codes.md) — Rate limiting uses a very specific 4xx status code.
- [API Keys](../level_04/api_keys.md) — How the server knows exactly *who* is making the requests.

---

## 2. Term Category
- **Security / Infrastructure**

---

## 3. Environment Context
- **Backend Architecture**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Billing Model

**Problem:** You are building a SaaS (Software as a Service) API. You offer a Free Tier and a Pro Tier ($99/month). How do you use Rate Limiting to enforce this business model?

**Expected output:**
> [!check]- Answer
> ```text
> You assign different Rate Limits based on the API Key! 
> If the API Key belongs to a Free Tier user, the backend sets their limit to 100 requests per day. If the API Key belongs to a Pro Tier user, the backend sets their limit to 10,000 requests per day. Rate limiting isn't just for security; it's the core engine of API monetization.
> ```
> - Rate limiting doesn't have to be a global setting. It can be per-user.
> 
---

### Exercise 2: Token Bucket vs Leaky Bucket Algorithms

**Problem:** Compare Token Bucket vs Leaky Bucket rate limiting algorithms.

**Expected output:**
> [!check]- Answer
> ```text
> Token Bucket allows short bursty traffic up to bucket capacity; Leaky Bucket forces smooth constant-rate request processing.
> ```
> ```text
> Token Bucket -> Allows bursty traffic up to token bucket capacity.
> Leaky Bucket -> Smooths out bursts to a strict constant output rate.
> ```
> - **Explanation:** Token Bucket handles bursty web traffic; Leaky Bucket smooths data flow.
---

### Exercise 3: HTTP 429 Retry Header

**Problem:** Which response header informs a rate-limited client how many seconds to wait before retrying?

**Expected output:**
> [!check]- Answer
> ```text
> Retry-After: 60
> ```
> ```http
> Retry-After: 60
> ```
> - **Explanation:** `Retry-After` communicates required delay in seconds or HTTP date string.
---

## 7. Related Terms
- [HTTP Status Codes](../level_02/status_codes.md) — `429` is the official code for Rate Limiting.
- [Error Handling (try / catch)](../level_05/error_handling.md) — Where you write the logic to pause your requests.
- [Bulk / Batch Requests](batch_requests.md) — Related concept: Bulk / Batch Requests.
- [Circuit Breaker](circuit_breaker.md) — Related concept: Circuit Breaker.
- [Idempotency Keys](idempotency_keys.md) — Related concept: Idempotency Keys.
- [Webhooks](webhooks.md) — Related concept: Webhooks.
- [Caching (ETag, Cache-Control)](caching.md) — Related concept: Caching (ETag, Cache-Control).
- [API Gateway](../level_10/api_gateway.md) — Related concept: API Gateway.

---

## 8. Key Takeaways
- **Rate Limiting** protects APIs from crashing due to too much traffic (accidental or malicious).
- Exceeding the limit results in a **`429 Too Many Requests`** HTTP error.
- Well-designed APIs use **Headers** to tell you exactly how many requests you have left and when the limit resets.
- Never write frontend code that blindly retries a request after receiving a 429!
