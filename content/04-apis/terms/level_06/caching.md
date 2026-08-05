# Caching (ETag, Cache-Control)

> **Level 6 — Advanced API Concepts**
> The technique of temporarily storing the results of an expensive API call so that future requests can be served instantly without hitting the database.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — Caching intercepts this lifecycle to skip the server processing step.
- [HTTP Headers](../level_02/http_headers.md) — Caching is entirely controlled by specific HTTP headers.
---

## 2. Term Category
- **API Performance / Infrastructure**

---

## 3. Environment Context
- **Universal** (Implemented on Browsers, CDNs, and Backend Servers).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If your API serves the daily weather for Tokyo, the weather only changes every few hours. 
If 100,000 users open your app in the same minute, your API will make 100,000 identical database queries to ask "What is the weather in Tokyo?" This is a massive waste of CPU, Database power, and network bandwidth.
Instead, we use **Caching**. The first user asks for the weather. The API calculates it, but also *saves a copy* (caches it) near the front door. For the next 99,999 users, the API simply hands them the saved copy instantly, without ever waking up the database.

### (2) Reality Metaphor
Imagine asking a librarian a complex math question: "What is 1,234 x 5,678?"
The librarian takes 5 minutes to do the math on a piece of paper, and tells you the answer is 7,006,652.
The librarian then *caches* the answer by writing it on a sticky note and putting it on her desk. When the next person walks up and asks the exact same question, she doesn't do the math again. She just reads the sticky note. 

### (3) HTTP Cache-Control
How does a browser know if it's allowed to save a copy of an API response? The Server tells it using the `Cache-Control` header.
- `Cache-Control: max-age=3600` — "Hey Browser, save this JSON in your local memory. If the user asks for this exact same URL within the next 3600 seconds (1 hour), don't even talk to me across the internet. Just use your saved copy!"
- `Cache-Control: no-store` — "Never save this. It is highly sensitive or changes every millisecond. Ask me for a fresh copy every single time."

### (4) ETags (Entity Tags)
What if the 1 hour expires? The Browser has to ask the Server for a fresh copy. But what if the data *hasn't actually changed* on the server? Downloading a 5MB JSON file again is a waste.
The Server solves this with an **`ETag`** (a fingerprint of the data, e.g., `ETag: "version-1"`).
When the 1 hour expires, the Browser sends a tiny request: "Hey Server, I have `version-1`. Has it changed?"
If the data is exactly the same, the Server responds with a **`304 Not Modified`** status code and an empty body. This means: "Your saved copy is still perfectly valid, keep using it!" This saves 5MB of bandwidth.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Caching User-Specific Data Globally

**The mistake:** A developer sets up a CDN (Content Delivery Network) caching layer for their API. They accidentally tell the CDN to cache the response for `GET /api/profile`. 

**Why it's wrong:** Bob logs in and hits `/api/profile`. The API returns Bob's private profile and the CDN *caches* it globally. 
Five seconds later, Alice logs in and hits `/api/profile`. The CDN intercepts the request, assumes the URLs are the same, and serves Alice the cached copy of Bob's private data! 
**Golden Rule:** Never cache endpoints that return personalized or authenticated data on public CDNs. Only cache public, shared data (like blog posts or weather data). Use `Cache-Control: private` to tell the browser it can cache it, but public servers cannot.

---

### Mistake 2: Setting `Cache-Control: public` on User-Specific Authenticated API Responses

**The mistake:** Returning `Cache-Control: public, max-age=3600` for `/api/user/profile` containing private user data.

**Why it's wrong:** `public` allows shared intermediate proxy servers and CDNs to cache the response. Subsequent requests from other users will serve them cached private profile data of the original user!

*Incorrect:*
```http
Cache-Control: public, max-age=3600 ; ❌ CDNs cache private user data publicly!
```

*Fix:*
```http
Cache-Control: private, no-cache, no-store ; Prevents public CDN caching of private data
```

---

### Mistake 3: Confusing `no-cache` with `no-store` in `Cache-Control` Headers

**The mistake:** Setting `Cache-Control: no-cache` expecting browsers to NEVER store the response.

**Why it's wrong:** `no-cache` means 'store the response, but validate with the origin server (ETag) before serving'. `no-store` tells browsers and proxies to NEVER write the response to disk or cache.

*Incorrect:*
```http
Cache-Control: no-cache ; ❌ Browser still stores file on disk!
```

*Fix:*
```http
Cache-Control: no-store ; Completely disables caching and disk storage
```


---

## 6. Practice Exercises

### Exercise 1: Fast, but Stale

**Problem:** You are building a news website API. You set `Cache-Control: max-age=86400` (24 hours) on the `/api/top-headlines` endpoint. 
A major breaking news event happens at noon. Your journalists publish the story to the database. Why are users complaining that they can't see the breaking news?

**Expected output:**
> [!check]- Answer
> ```text
> Because their browsers are using the cached copy! 
> You told the browsers they don't need to ask the server for updates for a full 24 hours. Even though the database updated, the browsers refuse to make a new network request until tomorrow. 
> Caching is a trade-off between Speed and "Staleness" (how outdated the data is).
> ```
> - What does `max-age` tell the browser to do for the next 24 hours?

---

### Exercise 2: ETag Validation Request Headers

**Problem:** When a client has a cached response with `ETag: "v123"`, which conditional header does it send on subsequent GET requests?

**Expected output:**
> [!check]- Answer
> ```text
> If-None-Match: "v123"
> ```
> ```http
> GET /api/items HTTP/1.1
> Host: api.example.com
> If-None-Match: "v123"
> ```
> - **Explanation:** `If-None-Match` sends stored ETag for conditional server validation.
---

### Exercise 3: HTTP 304 Not Modified Behavior

**Problem:** What does an HTTP `304 Not Modified` status code indicate to the client, and does it include a response body?

**Expected output:**
> [!check]- Answer
> ```text
> Indicates the cached resource is still fresh and unmodified. It contains NO response body.
> ```
> ```http
> HTTP/1.1 304 Not Modified
> ETag: "v123"
> (Empty Response Body)
> ```
> - **Explanation:** 304 Not Modified saves network bandwidth by omitting the payload body.
---

## 7. Related Terms
- [HTTP Headers](../level_02/http_headers.md) — Where `Cache-Control` and `ETag` live.
- [HTTP Status Codes](../level_02/status_codes.md) — `304 Not Modified` is the king of bandwidth-saving codes.
- [Latency & Bandwidth](../level_01/latency_bandwidth.md) — Related concept: Latency & Bandwidth.
- [Cache Invalidation](cache_invalidation.md) — Related concept: Cache Invalidation.
- [Rate Limiting (429 Too Many Requests)](rate_limiting.md) — Rate limiting.
- [Circuit Breaker](circuit_breaker.md) — Circuit breaker pattern.
---

## 8. Key Takeaways
- **Caching** dramatically speeds up APIs and reduces server load by serving saved copies of data.
- **`Cache-Control`** dictates how long a browser or network router is allowed to use a saved copy without checking the server.
- **`ETag`** is a fingerprint of the data. If the fingerprint hasn't changed, the server returns a `304 Not Modified` to save bandwidth.
- "Cache Invalidation" (knowing when to delete a cache) is notoriously one of the hardest problems in Computer Science.
