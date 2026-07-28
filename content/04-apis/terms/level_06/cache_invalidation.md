# Cache Invalidation

> **Level 6 — Advanced API Concepts**
> Knowing when cached data is stale (the "hard problem").

---

## 1. Prerequisites
- [Caching (ETag, Cache-Control)](./caching.md) — The fundamental mechanisms for storing response states.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Applies to browser caches, CDN distributions, and backend Redis microservice caches.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Strategy Selector

**Problem:** Choose the most appropriate cache invalidation strategy (**TTL** or **Active Eviction**) for the following data types:

1. A blog article post content (updated once a month).
2. An online e-commerce shopping cart item list (updated frequently during a session).
3. Weather forecast metrics displayed on a homepage widgets tab.

> [!check]- Answer
> - 1. **Active Eviction** (The content changes rarely. We can cache it indefinitely, but we must evict the key immediately when the author clicks "Update Post").
> - 2. **Active Eviction** (Carts must be 100% accurate; checkout will fail if items are stale).
> - 3. **TTL** (Weather forecasts are transient and update hourly; a 15-minute TTL is simple and acceptable).


---

### Exercise 2: Cache Invalidation Strategies Comparison

**Problem:** Match the cache invalidation pattern to its definition:
1. Cache-Aside (Lazy Loading)
2. Write-Through
3. Time-To-Live (TTL) Expiration

**Expected output:**
> [!check]- Answer
> ```text
> 1. Application checks cache first; if miss, loads from DB and populates cache
> 2. Application updates DB and cache simultaneously during writes
> 3. Cache entry automatically expires after specified duration
> ```
> ```text
> 1. Cache-Aside -> Read misses load from DB and populate cache.
> 2. Write-Through -> Writes update DB and cache synchronously.
> 3. TTL Expiration -> Time-based automatic key deletion.
> ```
> - **Explanation:** Different invalidation patterns balance data freshness and database load.
---

### Exercise 3: Cache Stampede Mitigation

**Problem:** What is a Cache Stampede (Thundering Herd) and how can lock mechanisms prevent it?

**Expected output:**
> [!check]- Answer
> ```text
> A Cache Stampede occurs when a high-traffic cache key expires, causing thousands of concurrent requests to hit the database simultaneously. Distributed locks ensure only 1 request queries the DB while others wait for cache repopulation.
> ```
> ```text
> Distributed mutex locks ensure only 1 request queries the DB while others wait for cache repopulation.
> ```
> - **Explanation:** Locks prevent concurrent database queries during cache misses.
---

## 7. Related Terms
- [Caching (ETag, Cache-Control)](./caching.md) — The HTTP protocols utilizing cache validations.
- [Webhooks](./webhooks.md) — The event push notifications that can trigger remote cache evictions.

---

## 8. Key Takeaways
- Cache invalidation is the process of marking or deleting stale cache records when database states update.
- TTL (Time-To-Live) is a passive timer strategy; easy to write but permits temporary staleness.
- Active Eviction (Purging) deletes keys from the cache immediately during write queries, ensuring instant consistency.
- Write-Through updating updates both cache and database concurrently.
- Never use simple TTL caching for volatile financial or secure data.
