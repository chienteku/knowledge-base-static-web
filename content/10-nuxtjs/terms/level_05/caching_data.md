# Caching Data

> **Level 5 — Data Fetching**
> The mechanism by which Nuxt prevents unnecessary network requests during client-side navigation by storing the results of `useFetch` and `useAsyncData` in memory using their unique keys.

---

## 1. Prerequisites
- [`useAsyncData`](../level_05/use_async_data.md) — The string key used here is the foundation of the cache.
- [`useFetch`](../level_05/use_fetch.md) — The URL acts as the cache key here automatically.
- [Nuxt Payload (SSR State Transfer)](../level_04/nuxt_payload.md) — The payload data cache containing server responses.

---

## 2. Term Category
- **Performance Optimization**

---

## 3. Environment Context
- **Client Only** (During SPA navigations inside browser memory).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine a user starts on the Home page, clicks a link to the About page, and then clicks the "Back" button to return to the Home page. 

If Nuxt did not cache data, returning to the Home page would trigger `useFetch('/api/home')` again, forcing the user to wait for a network request to see content they literally just saw a second ago. By caching data in memory based on the unique key, Nuxt makes backwards and forwards SPA navigation instantaneous.

### (2) Core Concept
By default, both `useFetch` and `useAsyncData` cache their results in memory *for the duration of the user's session*.

If you execute `useFetch('/api/products')`, Nuxt uses the string `'/api/products'` as the cache key.
If you navigate away and come back, Nuxt sees the key, realizes it already has the data, and skips the network request.

### (3) The `getCachedData` option
Sometimes you want finer control. Maybe you want to bypass the cache if the data is older than 5 minutes. You can do this by using the `getCachedData` option, which gives you access to the Nuxt app context.

```vue
<script setup lang="ts">
const { data } = await useFetch('/api/stats', {
  key: 'dashboard-stats',
  // Custom caching logic!
  getCachedData: (key, nuxtApp) => {
    // 1. Look for the data in the payload cache
    const data = nuxtApp.payload.data[key];
    
    // 2. If we don't have it, or some condition fails, return null to force a refetch
    if (!data) return null;
    
    // 3. Otherwise, return the cached data to skip the network request
    return data;
  }
});
</script>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on component-level state for cache invalidation
**The mistake:** Assuming that because a component was destroyed (`unmounted`), its cached data is also destroyed.

**Why it's wrong:** The cache is stored at the *Nuxt Application* level, not the component level. If the component mounts again later, it will instantly load the old, cached data instead of making a fresh request.
**Golden Rule:** If your data changes frequently and must ALWAYS be fresh when the user visits the page (like a live stock ticker), you must explicitly disable the cache or use the `clearNuxtData` utility before fetching.

*To bypass the cache on every component mount:*
```vue
<script setup>
// Adding a random Date timestamp to the query forces a unique URL, bypassing the cache
const { data } = await useFetch('/api/stocks', {
  query: { t: Date.now() } 
});
</script>
```

---

### Mistake 2: Using `useFetch` Without Key Caching Strategy When Querying Dynamic Parameters

**The mistake:** Calling `useFetch(() => `/api/user?id=${id.value}`)` without configuring key generation.

**Why it's wrong:** `useFetch` caches responses based on key names. Passing a dynamic URL function automatically handles key generation, but passing hardcoded string URLs misses dynamic cache invalidation.

*Incorrect:*
```vue
const { data } = await useFetch('/api/user?id=' + id.value); // ❌ Static string key misses param reactivity!
```

*Fix:*
```vue
const { data } = await useFetch(() => `/api/user?id=${id.value}`); // Dynamic function key updates reactively
```

---

### Mistake 3: Confusing Client Cache Invalidation (`refresh()`) with Server Storage Caching

**The mistake:** Expecting `refresh()` from `useFetch` to clear backend Nitro server storage cache.

**Why it's wrong:** `refresh()` invalidates client-side payload cache and triggers a new HTTP fetch request. If the backend Nitro route handler has server storage caching enabled, Nitro will return cached data.

*Incorrect:*
```vue
/* Expecting client refresh() to clear server-side cached route responses */
```

*Fix:*
```vue
/* Send Cache-Control headers or use Nitro cachedEventHandler({ invalidation: ... }) */
```


---

## 6. Practice Exercises

### Exercise 1: Cache Keys

**Problem:** You write `const { data } = await useAsyncData('user-123', fetchUser);`. You navigate away, and then a totally different component runs `const { data } = await useAsyncData('user-123', fetchAdmin)`. Which function is actually executed the second time?

**Expected output:**
> [!check]- Answer
> ```text
> Neither! 
> Because the key 'user-123' already exists in the cache, Nuxt immediately returns the data from the first fetch. `fetchAdmin` is never called. This is why unique keys are critical!
> ```
> - Nuxt searches the memory cache for any matching string key first before attempting to execute custom query callbacks.

---

### Exercise 2: useFetch Deduplication & Key Caching

**Problem:** Write `useFetch` call retrieving product list with custom cache key `'products-key'` and 60-second client cache.

**Expected output:**
> [!check]- Answer
> ```typescript
> const { data: products } = await useFetch('/api/products', { key: 'products-key' });
> ```
> - `key` option specifies explicit cache key for `useFetch`.
> 
> ```typescript
> const { data: products, refresh } = await useFetch('/api/products', {
>   key: 'products-list-key'
> });
> ```

---

### Exercise 3: getCachedData Option Function

**Problem:** Which `useAsyncData` option function allows defining custom cache hit validation logic?

**Expected output:**
> [!check]- Answer
> ```text
> getCachedData: (key) => nuxtApp.payload.data[key] || nuxtApp.static.data[key]
> ```
> - `getCachedData` customizes cache retrieval behavior.
> 
> ```typescript
> const { data } = await useAsyncData('key', () => fetcher(), {
>   getCachedData(key) {
>     const data = nuxtApp.payload.data[key];
>     if (!data) return;
>     return data;
>   }
> });
> ```


---

## 7. Related Terms
- [Fetching Errors & `clearNuxtData`](../level_05/fetching_errors.md) — How to manually delete items from this cache.

---

## 8. Key Takeaways
- Nuxt caches data fetching results in memory using a unique string key.
- `useFetch` automatically uses its URL as the key.
- Caching makes SPA navigation instant but can result in stale data.
- You can manually control the cache using `getCachedData`.
