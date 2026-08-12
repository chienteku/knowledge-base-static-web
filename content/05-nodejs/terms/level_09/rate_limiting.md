# Rate Limiting

> **Level 9 — REST APIs & Best Practices**
> A defensive mechanism that restricts how many network requests a single user (or IP address) can make to your API within a specific timeframe, preventing server crashes and abuse.

---

## 1. Prerequisites
- [Express.js](../level_07/express_js.md) — Rate limiting is usually implemented as an Express middleware.
- [HTTP Status Codes](status_codes.md) — When a user is rate-limited, they receive a special status code (429).

---

## 2. Term Category

**API Security / Infrastructure (Node.js)**: Rate Limiting is a fundamental concept in this technology stack. **Level 9 — REST APIs & Best Practices**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A well-built Node.js server can handle thousands of requests per second. But what if a malicious hacker writes a script to send 100,000 requests per second to your `/login` route? 
This is called a **Denial of Service (DoS) attack**. The server will exhaust its database connections, run out of memory, and completely crash, bringing the entire application offline.
Even without hackers, a poorly written frontend loop can accidentally spam your API.
**Rate Limiting** is the shield. It tracks how many requests an IP address makes. If they exceed the limit (e.g., 100 requests per 15 minutes), the server instantly blocks them.

### (2) How it Works in Express
You don't need to write the tracking logic yourself. You use an NPM package like `express-rate-limit`.
```javascript
const rateLimit = require('express-rate-limit');

// Create the shield: Max 100 requests every 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

// Apply it to all API routes
app.use('/api/', apiLimiter);
```
When a user hits request #101, the middleware intercepts the request, refuses to call `next()`, and instantly returns an HTTP Status Code **`429 Too Many Requests`**.

### (3) Advanced: Redis Rate Limiting
The basic package stores IP addresses in the Node.js server's RAM. If you have 5 different servers running (a cluster), they don't share RAM! A user could send 100 requests to Server A, and 100 to Server B.
For enterprise applications, developers use an external, lightning-fast memory database called **Redis** to track rate limits globally across all servers simultaneously.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not applying strict limits to Auth routes

**The mistake:** A developer applies a global rate limit of 1000 requests per hour to their API. They think their login route is safe.

**Why it's wrong:** 1000 requests per hour is fine for reading blog posts, but it is a massive vulnerability for a `/login` route! A hacker can perform a "Brute Force" attack, guessing 1000 different passwords every single hour until they hack an account.
**Golden Rule:** Always create a second, ultra-strict rate limiter specifically for authentication routes (e.g., Max 5 login attempts per 15 minutes).

---



### Mistake 2: Using In-Memory Rate Limiting Stores in Clustered or Distributed Multi-Server Deployments

**The mistake:** Using default in-memory `express-rate-limit` across 8 load-balanced server instances.

**Why it's wrong:** In-memory stores track hit counts per process. An attacker can bypass limits by hitting different load-balanced server instances. Use Redis as a centralized rate-limit store.

*Incorrect:*
```javascript
app.use(rateLimit()); // ❌ In-memory store bypassed across multi-instance clusters!
```

*Fix:*
```javascript
const RedisStore = require('rate-limit-redis');
app.use(rateLimit({ store: new RedisStore({ client: redisClient }) }));
```

### Mistake 3: Failing to Trust Reverse Proxy Headers (`app.set('trust proxy', 1)`) Behind Nginx / ALB

**The mistake:** Running rate limiters behind Nginx without enabling `app.set('trust proxy', 1)` in Express.

**Why it's wrong:** Without `trust proxy`, Express sees Nginx's loopback IP (`127.0.0.1`) as client IP for ALL requests, rate-limiting the entire user base after the first user exceeds limits.

*Incorrect:*
```javascript
// Express behind Nginx reverse proxy without trust proxy setting
```

*Fix:*
```javascript
app.set('trust proxy', 1); // Trust first reverse proxy hop for true client IP
```

## 5. Practice Exercises

### Exercise 1: Sliding Window Log Rate Limiter Algorithm

**Scenario:** Implements a sliding window log rate limiting algorithm tracking timestamp arrays per client IP address.

**Requirements:**
1. Write slidingWindowRateLimiter(clientIp, limit, windowMs, ipLogMap).
2. Prune logs outside windowMs.
3. Return rate limit status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function slidingWindowRateLimiter(clientIp, limit = 5, windowMs = 60000, ipLogMap = new Map()) {
>   const now = Date.now();
>   const windowStart = now - windowMs;
>
>   let timestamps = ipLogMap.get(clientIp) || [];
>   // Prune timestamps older than current window
>   timestamps = timestamps.filter(ts => ts > windowStart);
>
>   if (timestamps.length >= limit) {
>     ipLogMap.set(clientIp, timestamps);
>     return {
>       allowed: false,
>       remaining: 0,
>       resetMs: timestamps[0] + windowMs - now
>     };
>   }
>
>   timestamps.push(now);
>   ipLogMap.set(clientIp, timestamps);
>
>   return {
>     allowed: true,
>     remaining: limit - timestamps.length,
>     resetMs: windowMs
>   };
> }
>
> // Verification tests
> const store = new Map();
> const ip = "192.168.1.1";
>
> for (let i = 0; i < 3; i++) {
>   slidingWindowRateLimiter(ip, 3, 1000, store);
> }
>
> const overflow = slidingWindowRateLimiter(ip, 3, 1000, store);
> console.assert(overflow.allowed === false, "Test 1 Failed: Blocked 4th request");
> console.assert(overflow.remaining === 0, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Sliding Window Log Algorithm**: Accurate rate limiting algorithm preventing traffic burst spikes at fixed window boundaries.
> 2. **Memory Footprint Trade-off**: Stores timestamp arrays in memory; best backed by Redis Sorted Sets (`ZADD`, `ZREMRANGEBYSCORE`) in distributed environments.
> 3. **HTTP Rate Limit Headers**: Sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers.
> 
---

### Exercise 2: Token Bucket Rate Limiter Algorithm

**Scenario:** Implements the Token Bucket algorithm refilling tokens at a continuous steady rate.

**Requirements:**
1. Write consumeBucketToken(bucketState, capacity, refillRatePerSec).
2. Refill tokens based on elapsed time.
3. Consume token if available.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function consumeBucketToken(bucketState, capacity = 10, refillRatePerSec = 2) {
>   const now = Date.now();
>   const elapsedSec = (now - (bucketState.lastRefillTime || now)) / 1000;
>
>   let tokens = (bucketState.tokens || capacity) + elapsedSec * refillRatePerSec;
>   if (tokens > capacity) tokens = capacity; // Cap at max capacity
>
>   bucketState.lastRefillTime = now;
>
>   if (tokens >= 1) {
>     bucketState.tokens = tokens - 1;
>     return { allowed: true, remainingTokens: Math.floor(bucketState.tokens) };
>   }
>
>   bucketState.tokens = tokens;
>   return { allowed: false, remainingTokens: 0 };
> }
>
> // Verification tests
> const bucket = { tokens: 1, lastRefillTime: Date.now() };
> const r1 = consumeBucketToken(bucket, 10, 2);
> console.assert(r1.allowed === true, "Test 1 Failed");
>
> const r2 = consumeBucketToken(bucket, 10, 2);
> console.assert(r2.allowed === false, "Test 2 Failed: Empty bucket blocked");
> ```
>
> #### Technical Explanation
>
> 1. **Token Bucket Algorithm**: Allows traffic bursts up to bucket `capacity` while enforcing steady long-term `refillRate`.
> 2. **Smooth Traffic Shaping**: Ideal for API gateways managing bursty consumer traffic patterns.
> 3. **Redis Implementation**: Efficiently implemented in Redis using Lua scripts for atomic token calculations.
> 
---

### Exercise 3: Tiered Rate Limiting by User Role Middleware

**Scenario:** Applies dynamic rate limit thresholds based on authenticated user tier (`anonymous`: 10 req/min, `basic`: 100 req/min, `premium`: 1000 req/min).

**Requirements:**
1. Write tieredRateLimitMiddleware(req, res, next).
2. Lookup user tier.
3. Apply role limit.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createTieredRateLimiter(storeMap = new Map()) {
>   const limits = {
>     anonymous: 2,
>     basic: 5,
>     premium: 10
>   };
>
>   return function tieredRateLimitMiddleware(req, res, next) {
>     const userRole = req.user?.role || "anonymous";
>     const key = req.user?.id ? `user_${req.user.id}` : `ip_${req.ip || "anon"}`;
>     const limit = limits[userRole] || limits.anonymous;
>
>     const currentCount = (storeMap.get(key) || 0) + 1;
>     storeMap.set(key, currentCount);
>
>     if (currentCount > limit) {
>       res.statusCode = 429;
>       return res.end(JSON.stringify({ error: `Rate limit exceeded for tier: ${userRole}` }));
>     }
>
>     next();
>   };
> }
>
> // Verification tests
> const store = new Map();
> const limiter = createTieredRateLimiter(store);
>
> let status = 0;
> const mockRes = { set statusCode(c) { status = c; }, end: () => {} };
>
> const anonReq = { ip: "1.1.1.1", user: null };
> limiter(anonReq, mockRes, () => {});
> limiter(anonReq, mockRes, () => {});
> limiter(anonReq, mockRes, () => {}); // 3rd request exceeds anon limit (2)!
>
> console.assert(status === 429, "Test 1 Failed: Anonymous blocked at limit 2");
> ```
>
> #### Technical Explanation
>
> 1. **Tiered Rate Limiting**: Monetizes API usage tiers by offering higher rate limits to paid subscribers.
> 2. **User vs IP Keys**: Rate limits authenticated users by `user.id` across devices; fallback to client IP for anonymous users.
> 3. **429 Too Many Requests**: Standard HTTP status code for rate limit rejection.
## 6. Related Terms
- [Middleware](../level_07/middleware.md) — Rate limiters are just bouncer middlewares.
- [HTTP Status Codes](status_codes.md) — The `429` code is the hallmark of rate limiting.

---

## 7. Key Takeaways
- **Rate Limiting** restricts how many requests an IP address can make to prevent DoS attacks and server crashes.
- When the limit is exceeded, the server returns a **429 Too Many Requests** status code.
- You can easily implement it in Node.js using the `express-rate-limit` middleware.
- Always apply ultra-strict rate limits to sensitive routes like Login and Password Reset to prevent Brute Force attacks.
