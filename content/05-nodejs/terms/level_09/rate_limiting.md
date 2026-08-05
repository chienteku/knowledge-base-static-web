# Rate Limiting

> **Level 9 — REST APIs & Best Practices**
> A defensive mechanism that restricts how many network requests a single user (or IP address) can make to your API within a specific timeframe, preventing server crashes and abuse.

---

## 1. Prerequisites
- [Express.js](../level_07/express_js.md) — Rate limiting is usually implemented as an Express middleware.
- [HTTP Status Codes](status_codes.md) — When a user is rate-limited, they receive a special status code (429).
---

## 2. Term Category
- **API Security / Infrastructure**

---

## 3. Environment Context
- **Node.js (Server Infrastructure)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Using In-Memory Rate Limiting Stores in Clustered or Distributed Multi-Server Deployments

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

### Mistake 5: Failing to Trust Reverse Proxy Headers (`app.set('trust proxy', 1)`) Behind Nginx / ALB

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



### Mistake 6: Using In-Memory Rate Limiting Stores in Clustered or Distributed Multi-Server Deployments

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

### Mistake 7: Failing to Trust Reverse Proxy Headers (`app.set('trust proxy', 1)`) Behind Nginx / ALB

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

## 6. Practice Exercises

### Exercise 1: The Status Code

**Problem:** You are building a frontend React app. You fetch data from a public API, but suddenly the API stops returning data and instead returns a `429` status code. What should your React app do?

**Expected output:**
> [!check]- Answer
> ```text
> A 429 status code means "Too Many Requests". Your React app should immediately stop sending requests, show a message to the user ("Please wait a moment"), and wait a few minutes before trying again. If you keep sending requests immediately, the API might ban your IP address permanently.
> ```
> - Does a 429 mean the server is broken, or does it mean YOU need to slow down?

---



### Exercise 2: Configuring Express Rate Limiter

**Problem:** Configure `express-rate-limit` allowing max 100 requests per 15 minutes per IP.

**Expected output:**
> [!check]- Answer
> ```text
> const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }); app.use(limiter);
> ```
> ```javascript
> const rateLimit = require('express-rate-limit');
> const limiter = rateLimit({
>   windowMs: 15 * 60 * 1000, // 15 minutes
>   max: 100
> });
> app.use(limiter);
> ```
>
> **Explanation:** `windowMs` sets time window duration; `max` specifies maximum allowed requests per window.

---

### Exercise 3: Rate Limit Exceeded Status Code

**Problem:** What standard HTTP status code is returned when a client exceeds rate limits? (`429 Too Many Requests`).

**Expected output:**
> [!check]- Answer
> ```text
> 429 Too Many Requests
> ```
> ```text
> 429 Too Many Requests
> ```
>
> **Explanation:** Status 429 informs clients to wait before sending further requests.

## 7. Related Terms
- [Middleware](../level_07/middleware.md) — Rate limiters are just bouncer middlewares.
- [HTTP Status Codes](status_codes.md) — The `429` code is the hallmark of rate limiting.
---

## 8. Key Takeaways
- **Rate Limiting** restricts how many requests an IP address can make to prevent DoS attacks and server crashes.
- When the limit is exceeded, the server returns a **429 Too Many Requests** status code.
- You can easily implement it in Node.js using the `express-rate-limit` middleware.
- Always apply ultra-strict rate limits to sensitive routes like Login and Password Reset to prevent Brute Force attacks.
