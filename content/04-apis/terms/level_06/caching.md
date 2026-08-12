# Caching (ETag, Cache-Control)

> **Level 6 — Advanced API Concepts**
> The technique of temporarily storing the results of an expensive API call so that future requests can be served instantly without hitting the database.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — Caching intercepts this lifecycle to skip the server processing step.
- [HTTP Headers](../level_02/http_headers.md) — Caching is entirely controlled by specific HTTP headers.

---

## 2. Term Category

**API Performance / Infrastructure (Universal .)**: Caching (ETag, Cache-Control) is a fundamental concept in this technology stack. **Level 6 — Advanced API Concepts**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: HTTP Cache-Control Header Evaluator

**Scenario:** An HTTP cache manager parses Cache-Control response headers (`max-age`, `no-cache`, `no-store`, `private`) to determine caching rules.

**Requirements:**
1. Write evaluateCacheHeader(headerStr).
2. Extract max-age in seconds.
3. Check no-store and no-cache flags.
4. Return cache directive object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function evaluateCacheHeader(headerStr) {
>   if (!headerStr || typeof headerStr !== "string") {
>     return { cacheable: false, maxAge: 0, reason: "Missing Cache-Control header" };
>   }
>
>   const directives = headerStr.split(",").map(d => d.trim().toLowerCase());
>   const hasNoStore = directives.includes("no-store");
>   const hasNoCache = directives.includes("no-cache");
>   const isPrivate = directives.includes("private");
>
>   if (hasNoStore) {
>     return { cacheable: false, maxAge: 0, reason: "no-store directive forbids caching" };
>   }
>
>   let maxAge = 0;
>   for (const dir of directives) {
>     if (dir.startsWith("max-age=")) {
>       const val = parseInt(dir.split("=")[1], 10);
>       maxAge = isNaN(val) ? 0 : val;
>     }
>   }
>
>   return {
>     cacheable: maxAge > 0 && !hasNoStore,
>     requiresRevalidation: hasNoCache,
>     isPrivate,
>     maxAge
>   };
> }
>
> // Verification tests
> const res1 = evaluateCacheHeader("public, max-age=3600");
> console.assert(res1.cacheable === true && res1.maxAge === 3600, "Test 1 Failed");
>
> const res2 = evaluateCacheHeader("no-store, no-cache");
> console.assert(res2.cacheable === false, "Test 2 Failed");
>
> const res3 = evaluateCacheHeader("no-cache, max-age=60");
> console.assert(res3.requiresRevalidation === true, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Cache-Control Directives**: Standard HTTP header controlling browser and CDN caching behavior.
> 2. **no-store vs no-cache**: no-store forbids storing payload anywhere; no-cache allows storing but requires revalidating before serving.
> 3. **max-age Directive**: Specifies maximum duration in seconds response is considered fresh before revalidation.
> 
---

### Exercise 2: ETag & If-None-Match Conditional Request Handler (304 Not Modified)

**Scenario:** An API server uses ETag hash validation to return `304 Not Modified` for unchanged resources, saving bandwidth.

**Requirements:**
1. Write handleConditionalRequest(reqHeader, resourceData, mockHashFn).
2. Compute ETag hash of resourceData.
3. If ETag matches If-None-Match header, return 304.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleConditionalRequest(ifNoneMatchHeader, resourceData, mockHashFn) {
>   const etag = mockHashFn 
>     ? `"${mockHashFn(resourceData)}"` 
>     : `"${JSON.stringify(resourceData).length}_hash"`;
>
>   if (ifNoneMatchHeader && ifNoneMatchHeader === etag) {
>     return {
>       status: 304,
>       headers: { "ETag": etag },
>       body: null
>     };
>   }
>
>   return {
>     status: 200,
>     headers: { "ETag": etag },
>     body: resourceData
>   };
> }
>
> // Verification tests
> const data = { id: 1, name: "Widget" };
>
> const res1 = handleConditionalRequest(null, data);
> console.assert(res1.status === 200 && res1.headers.ETag !== undefined, "Test 1 Failed");
>
> const res2 = handleConditionalRequest(res1.headers.ETag, data);
> console.assert(res2.status === 304 && res2.body === null, "Test 2 Failed: Must return 304 with no body");
> ```
>
> #### Technical Explanation
>
> 1. **ETag (Entity Tag)**: HTTP header containing a cryptographic hash or version tag representing resource content.
> 2. **If-None-Match Request Header**: Client sends previously received ETag header; server compares content hash.
> 3. **304 Not Modified**: Status code indicating resource has not changed, allowing client to use cached copy with zero body bandwidth.
> 
---

### Exercise 3: In-Memory LRU (Least Recently Used) Cache Store

**Scenario:** An API client implements an LRU Cache with a maximum capacity limit, evicting the least recently accessed items when full.

**Requirements:**
1. Write createLruCache(capacity).
2. Implement get(key) and set(key, value).
3. Evict LRU item when size exceeds capacity.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createLruCache(capacity = 3) {
>   const map = new Map();
>
>   return {
>     get(key) {
>       if (!map.has(key)) return null;
>       const value = map.get(key);
>       map.delete(key);
>       map.set(key, value);
>       return value;
>     },
>     set(key, value) {
>       if (map.has(key)) {
>         map.delete(key);
>       } else if (map.size >= capacity) {
>         const oldestKey = map.keys().next().value;
>         map.delete(oldestKey);
>       }
>       map.set(key, value);
>     },
>     size() {
>       return map.size;
>     }
>   };
> }
>
> // Verification tests
> const lru = createLruCache(2);
> lru.set("a", 1);
> lru.set("b", 2);
> lru.get("a");
>
> lru.set("c", 3);
>
> console.assert(lru.get("a") === 1, "Test 1 Failed: 'a' preserved");
> console.assert(lru.get("b") === null, "Test 2 Failed: 'b' evicted");
> console.assert(lru.get("c") === 3, "Test 3 Failed: 'c' added");
> ```
>
> #### Technical Explanation
>
> 1. **LRU Cache Strategy**: Evicts least recently accessed items when capacity limit is reached.
> 2. **Map Key Order**: JavaScript Map maintains key insertion order; re-inserting items updates access recency.
> 3. **Memory Overflow Protection**: Bounded capacity prevents client or server memory exhaustion under heavy traffic.
---

## 6. Related Terms
- [HTTP Headers](../level_02/http_headers.md) — Where `Cache-Control` and `ETag` live.
- [HTTP Status Codes](../level_02/status_codes.md) — `304 Not Modified` is the king of bandwidth-saving codes.
- [Latency & Bandwidth](../level_01/latency_bandwidth.md) — Related concept: Latency & Bandwidth.
- [Cache Invalidation](cache_invalidation.md) — Related concept: Cache Invalidation.
- [Rate Limiting (429 Too Many Requests)](rate_limiting.md) — Rate limiting.
- [Circuit Breaker](circuit_breaker.md) — Circuit breaker pattern.

---

## 7. Key Takeaways
- **Caching** dramatically speeds up APIs and reduces server load by serving saved copies of data.
- **`Cache-Control`** dictates how long a browser or network router is allowed to use a saved copy without checking the server.
- **`ETag`** is a fingerprint of the data. If the fingerprint hasn't changed, the server returns a `304 Not Modified` to save bandwidth.
- "Cache Invalidation" (knowing when to delete a cache) is notoriously one of the hardest problems in Computer Science.
