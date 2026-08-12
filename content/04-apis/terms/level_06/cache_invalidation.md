# Cache Invalidation

> **Level 6 — Advanced API Concepts**
> Knowing when cached data is stale (the "hard problem").

---

## 1. Prerequisites
- [Caching (ETag, Cache-Control)](caching.md) — The fundamental mechanisms for storing response states.

---

## 2. Term Category

**Architecture / Design (Universal: Applies to browser caches, CDN distributions, and backend Redis microservice caches.)**: Cache Invalidation is a fundamental concept in this technology stack. **Level 6 — Advanced API Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Phil Karlton famously wrote: *"There are only two hard things in Computer Science: cache invalidation and naming things."*

Storing API data in a fast memory cache (like Redis) to avoid expensive database queries is straightforward. The real challenge is **invalidation**—knowing exactly when the underlying database has changed, meaning the cached data is now stale (incorrect) and must be updated or deleted.

If you invalidate too early, you lose the performance benefits of caching. If you invalidate too late, users see outdated, stale information, leading to application bugs.

---

### (2) Cache Invalidation Strategies

#### 1. Time-To-Live (TTL) / Expiration (Passive)
The simplest approach. Every cached item is saved with an expiration timer (e.g. `TTL = 60 seconds`). Once the timer expires, the item is automatically deleted. The next request is forced to query the database, fetching fresh data.
*   **Pros:** Easy to implement; ensures the cache eventually corrects itself.
*   **Cons:** Users see stale data for up to 60 seconds after a database write.

#### 2. Active Eviction / Purging (Event-Driven)
When a write operation occurs (e.g. updating a profile), the application code explicitly deletes the associated key from the cache database:
```javascript
async function updateUser(userId, newData) {
  await db.query("UPDATE users SET ? WHERE id = ?", [newData, userId]);
  await redis.del(`user:${userId}`); // Active Eviction (Purge)
}
```
The next read request finds a cache miss and fetches the updated row from the database.
*   **Pros:** Instant consistency; data is always fresh.
*   **Cons:** High complexity; developers must write eviction code in every single route that modifies data.

#### 3. Write-Through Caching
The application treats the cache as the primary entry point. When writing data, the cache is updated first, and the cache controller immediately writes the data to the database before returning success.
*   **Pros:** Cache is never stale.
*   **Cons:** Write latency increases because you wait for two write operations to complete.

---

### (3) Reality Metaphor
Imagine a restaurant **printed menu on the wall** (**the cache**) vs the kitchen's **actual ingredient stock** (**the database**).
- **TTL Caching** is like printing a new menu board **every Monday morning**. If the kitchen runs out of lobster on Tuesday, the menu board still lists it. Customers order lobster and get turned down, experiencing lag. The menu board is only corrected next Monday.
- **Active Eviction (Purging)** is like the chef walking to the menu board the **exact second they run out of lobster** and erasing it with chalk. The menu board is always 100% accurate.

---

### (4) Code Example: TTL Check vs. Active Eviction

#### 1. Passive TTL Cache Lookup
```javascript
async function getCachedUser(userId) {
  const cached = await redis.get(`user:${userId}`);
  
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss -> Query DB and save with 5-minute TTL (300 seconds)
  const user = await db.fetchUser(userId);
  await redis.set(`user:${userId}`, JSON.stringify(user), 'EX', 300);
  return user;
}
```

#### 2. Active Eviction on Update
```javascript
async function deleteUserAccount(userId) {
  await db.deleteUser(userId);
  // Evict immediately so future reads don't fetch the deleted user
  await redis.del(`user:${userId}`); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Setting long TTLs on volatile, high-security data

**The mistake:** Caching a user's bank account wallet balance with a 30-minute TTL.

**Why it's wrong:** If a user deposits money, their balance will show as outdated for 30 minutes, leading to panic and unnecessary support tickets. Worse, they might attempt to double-spend because the cached balance is stale.

*Fix:* Never cache volatile financial data or critical permissions strings using passive TTLs alone. These must be evicted immediately upon write events, or bypassed entirely.

---

### Mistake 2: Forgetting to Invalidate Cached Read Endpoints After Database Mutations

**The mistake:** Updating a user's name via `PUT /users/5` without clearing cached Redis entry for `GET /users/5`.

**Why it's wrong:** Failing to invalidate or update cached entries causes read queries to serve stale outdated data to clients indefinitely until TTL expires.

*Incorrect:*
```javascript
app.put('/users/:id', async (req, res) => {
  await db.updateUser(req.params.id, req.body);
  // ❌ Missing redis.del(`user:${req.params.id}`)! Cache serves stale data!
});
```

*Fix:*
```javascript
app.put('/users/:id', async (req, res) => {
  await db.updateUser(req.params.id, req.body);
  await redis.del(`user:${req.params.id}`); // Invalidate cached entry immediately
  res.json({ success: true });
});
```

---

### Mistake 3: Using Global Cache Flushing (`FLUSHALL`) During Single Resource Updates

**The mistake:** Executing `redis.flushall()` whenever a single product is updated.

**Why it's wrong:** Flushing the entire cache empties all cached database queries simultaneously, causing a sudden spike in database CPU usage ("Cache Stampede"). Targeted key deletion should be used instead.

*Incorrect:*
```javascript
await redis.flushall(); // ❌ Clears all application cache entries!
```

*Fix:*
```javascript
await redis.del(`product:${productId}`); // Target specific key deletion
```


---

## 5. Practice Exercises

### Exercise 1: Tag-Based API Cache Invalidation Engine

**Scenario:** A caching layer decorates cached responses with tags (e.g. `users`, `user:42`) and invalidates matching entries on resource mutation.

**Requirements:**
1. Write setCache(key, value, tags).
2. Write invalidateTags(tagsToInvalidate).
3. Purge matching items.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createTaggedCache() {
>   const store = new Map();
>
>   return {
>     set(key, value, tags = []) {
>       store.set(key, { value, tags: new Set(tags) });
>     },
>     get(key) {
>       const item = store.get(key);
>       return item ? item.value : null;
>     },
>     invalidateTags(tagsToInvalidate = []) {
>       const purgeSet = new Set(tagsToInvalidate);
>       let count = 0;
>
>       for (const [key, item] of store.entries()) {
>         const hasMatchingTag = Array.from(item.tags).some(t => purgeSet.has(t));
>         if (hasMatchingTag) {
>           store.delete(key);
>           count++;
>         }
>       }
>       return count;
>     }
>   };
> }
>
> // Verification tests
> const cache = createTaggedCache();
> cache.set("/users/42", { name: "Alice" }, ["users", "user:42"]);
> cache.set("/users/43", { name: "Bob" }, ["users", "user:43"]);
>
> console.assert(cache.get("/users/42").name === "Alice", "Test 1 Failed");
>
> cache.invalidateTags(["user:42"]);
> console.assert(cache.get("/users/42") === null, "Test 2 Failed: Item user:42 must be purged");
> console.assert(cache.get("/users/43") !== null, "Test 3 Failed: Unrelated items preserved");
> ```
>
> #### Technical Explanation
>
> 1. **Cache Invalidation Problem**: Phil Karlton quote: 'There are only two hard things in Computer Science: cache invalidation and naming things.'
> 2. **Tag-Based Invalidation**: Associates cached items with domain tags allowing targeted group purges.
> 3. **Fine-Grained Purging**: Invalidates specific entity caches without purging the entire global cache store.
> 
---

### Exercise 2: Stale-While-Revalidate (SWR) Invalidation Manager

**Scenario:** An SWR cache serves stale data instantly while triggering an asynchronous background revalidation fetch.

**Requirements:**
1. Write swrFetch(key, fetchFn, cacheStore).
2. Return cached value immediately.
3. Fetch fresh data in background.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createSwrManager(cacheStore = new Map()) {
>   return async function swrFetch(key, fetchFn) {
>     const cached = cacheStore.get(key);
>
>     const revalidatePromise = (async () => {
>       try {
>         const freshData = await fetchFn();
>         cacheStore.set(key, { data: freshData, timestamp: Date.now() });
>         return freshData;
>       } catch (e) {
>         return cached ? cached.data : null;
>       }
>     })();
>
>     if (cached) {
>       revalidatePromise.catch(() => {});
>       return { data: cached.data, isStale: true };
>     }
>
>     const fresh = await revalidatePromise;
>     return { data: fresh, isStale: false };
>   };
> }
>
> // Verification tests
> const store = new Map([["/data", { data: "stale_v1", timestamp: Date.now() - 10000 }]]);
> const swr = createSwrManager(store);
>
> let fetchCalled = false;
> const mockFetch = async () => {
>   fetchCalled = true;
>   return "fresh_v2";
> };
>
> swr("/data", mockFetch).then(res => {
>   console.assert(res.isStale === true && res.data === "stale_v1", "Test 1 Failed: Must return stale data immediately");
>   console.assert(fetchCalled === true, "Test 2 Failed: Must trigger background revalidation");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Stale-While-Revalidate Pattern**: RFC 5861 HTTP cache control extension balancing zero-latency loads with freshness.
> 2. **Zero Latency UI**: Users get instant cached content while new data loads asynchronously behind the scenes.
> 3. **Background Revalidation**: Keeps cached data fresh without blocking main thread execution.
> 
---

### Exercise 3: Mutation-Triggered Cache Invalidation Interceptor

**Scenario:** An API client middleware automatically invalidates cached GET endpoints whenever a POST/PUT/DELETE mutation occurs on the same resource path.

**Requirements:**
1. Write handleApiCall(method, path, data, cacheStore, fetchFn).
2. If GET, read/set cache.
3. If mutation (POST/PUT/DELETE), invalidate path cache.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function handleApiCall(method, path, data, cacheStore = new Map(), fetchFn) {
>   const m = method.toUpperCase();
>
>   if (m === "GET") {
>     if (cacheStore.has(path)) {
>       return { source: "CACHE", data: cacheStore.get(path) };
>     }
>     const res = await fetchFn(method, path, data);
>     cacheStore.set(path, res);
>     return { source: "NETWORK", data: res };
>   }
>
>   const parentPath = path.substring(0, path.lastIndexOf("/")) || path;
>   cacheStore.delete(path);
>   cacheStore.delete(parentPath);
>
>   const res = await fetchFn(method, path, data);
>   return { source: "NETWORK", data: res };
> }
>
> // Verification tests
> const store = new Map();
> const mockFetch = async (m, p, d) => ({ result: "ok" });
>
> handleApiCall("GET", "/users/1", null, store, mockFetch).then(r1 => {
>   console.assert(r1.source === "NETWORK", "Test 1 Failed");
>
>   return handleApiCall("GET", "/users/1", null, store, mockFetch).then(r2 => {
>     console.assert(r2.source === "CACHE", "Test 2 Failed");
>
>     return handleApiCall("PUT", "/users/1", { name: "Alice" }, store, mockFetch).then(r3 => {
>       console.assert(store.has("/users/1") === false, "Test 3 Failed: Cache must be invalidated after PUT");
>     });
>   });
> });
> ```
>
> #### Technical Explanation
>
> 1. **Automatic Mutation Invalidation**: Ensures mutations immediately clear related read caches to prevent UI data inconsistency.
> 2. **Parent Resource Invalidation**: Mutating a item (/users/1) invalidates both item cache and collection cache (/users).
> 3. **Cache Coherency**: Guarantees clients see updated data on subsequent GET calls following a mutation.
---

## 6. Related Terms
- [Caching (ETag, Cache-Control)](caching.md) — The HTTP protocols utilizing cache validations.
- [Webhooks](webhooks.md) — The event push notifications that can trigger remote cache evictions.

---

## 7. Key Takeaways
- Cache invalidation is the process of marking or deleting stale cache records when database states update.
- TTL (Time-To-Live) is a passive timer strategy; easy to write but permits temporary staleness.
- Active Eviction (Purging) deletes keys from the cache immediately during write queries, ensuring instant consistency.
- Write-Through updating updates both cache and database concurrently.
- Never use simple TTL caching for volatile financial or secure data.
