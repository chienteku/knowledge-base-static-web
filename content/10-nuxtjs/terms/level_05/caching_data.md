# Caching Data

> **Level 5 — Data Fetching**
> The mechanism by which Nuxt prevents unnecessary network requests during client-side navigation by storing the results of `useFetch` and `useAsyncData` in memory using their unique keys.

---

## 1. Prerequisites
- [`useAsyncData`](use_async_data.md) — The string key used here is the foundation of the cache.
- [`useFetch`](use_fetch.md) — The URL acts as the cache key here automatically.
- [Nuxt Payload (SSR State Transfer)](../level_04/nuxt_payload.md) — The payload data cache containing server responses.

---

## 2. Term Category

**Data Fetching** (SSR & Client Cache Deduplication): Data caching in Nuxt 3 prevents duplicate HTTP network requests across SSR server rendering and client hydration via payload cache keys.



---

## 3. Explanation

### Environment Context
- **Client Only** (During SPA navigations inside browser memory).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Customizing Data Cache Keys in `useAsyncData()`

**Scenario:**
Specify a custom unique cache key for `useAsyncData()` fetching user dashboard preferences.

**Requirements:**
1. Pass unique string key `"user-dashboard-prefs"` as first argument.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data: prefs } = await useAsyncData("user-dashboard-prefs", () => {
>   return $fetch("/api/user/preferences");
> });
> </script>

<template>
  <div v-if="prefs">
    <p>Theme Preference: {{ prefs.theme }}</p>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `useAsyncData()` uses the provided string key to store and retrieve data from `NuxtPayload`.
> 2. Prevents duplicate network fetching during client hydration by re-using payload data under `"user-dashboard-prefs"`.
> 3. Guarantees consistent data caching across server and client renders.

---

### Exercise 2: Clearing Data Caches via `clearNuxtData()`

**Scenario:**
Invalidate and re-fetch cached user data when a user updates their profile using `clearNuxtData()`.

**Requirements:**
1. Call `clearNuxtData("user-dashboard-prefs")` upon profile update.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> async function handleRefresh() {
>   // Invalidates payload cache for the specified key!
>   clearNuxtData("user-dashboard-prefs");
>   // Force re-fetch fresh data from the server
>   await refreshNuxtData("user-dashboard-prefs");
> }
> </script>

<template>
  <button @click="handleRefresh">Refresh Preferences</button>
</template>
```

> #### Technical Explanation
>
> 1. `clearNuxtData(key)` deletes cached data entries from Nuxt's payload cache repository.
> 2. `refreshNuxtData(key)` triggers active `useAsyncData()` or `useFetch()` listeners to re-execute network calls.
> 3. Standard cache invalidation pattern.

---

### Exercise 3: Setting Cache Time-To-Live (TTL) with Custom Deduplication

**Scenario:**
Configure data caching options to deduplicate duplicate component data requests within a 5-second window.

**Requirements:**
1. Set `dedupe: "defer"` or configure `getCachedData`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data: stats } = await useFetch("/api/stats", {
>   key: "live-stats",
>   getCachedData: (key, nuxtApp) => {
>     const data = nuxtApp.payload.data[key] || nuxtApp.static.data[key];
>     if (!data) return;
>     // Re-fetch if cached entry is older than 5000ms
>     const isExpired = Date.now() - data.fetchedAt > 5000;
>     return isExpired ? undefined : data;
>   }
> });
> </script>

<template>
  <div>
    <p>Stats: {{ stats }}</p>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `getCachedData` allows defining custom cache expiration logic based on timestamps or cache invalidation conditions.
> 2. Returning `undefined` forces Nuxt to issue a fresh HTTP network request.
> 3. Granular cache freshness control mechanism.

---




---

## 6. Related Terms
- [Fetching Errors & `clearNuxtData`](fetching_errors.md) — How to manually delete items from this cache.
- [`useAsyncData`](use_async_data.md) — Related concept: `useAsyncData`.
- [`useFetch`](use_fetch.md) — Related concept: `useFetch`.

---

## 7. Key Takeaways
- Nuxt caches data fetching results in memory using a unique string key.
- `useFetch` automatically uses its URL as the key.
- Caching makes SPA navigation instant but can result in stale data.
- You can manually control the cache using `getCachedData`.
