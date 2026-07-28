# Fetching Errors & `clearNuxtData`

> **Level 5 — Data Fetching**
> The pattern for gracefully handling API failures in `useFetch` and `useAsyncData`, and the utility used to manually purge corrupt or stale data from the Nuxt cache.

---

## 1. Prerequisites
- [`useFetch`](../level_05/use_fetch.md) — The composable that generates these errors.
- [Caching Data](../level_05/caching_data.md) — The cache that `clearNuxtData` interacts with.

---

## 2. Term Category
- **Error Handling**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When an API request fails (e.g., a 500 server error or a 404 not found), `useFetch` does not throw an immediate JavaScript exception that crashes your app. Instead, it captures the error and exposes it via the reactive `error` object. This allows you to render a beautiful fallback UI (like "Oops, we couldn't load the users") instead of a white screen of death.

However, once a fetch fails, Nuxt caches that failure. If the user clicks a "Retry" button, you must clear the old error state before fetching again, otherwise Nuxt might just serve the cached error.

### (2) The `error` object
The `error` object returned by `useFetch` is a `Ref` containing an `H3Error`. It has a `statusCode` and a `message`.

```vue
<script setup lang="ts">
const { data, error, pending } = await useFetch('/api/unstable-endpoint');
</script>

<template>
  <div>
    <div v-if="pending">Loading...</div>
    
    <!-- Render the error object gracefully -->
    <div v-else-if="error">
      <h2>Error {{ error.statusCode }}</h2>
      <p>{{ error.message }}</p>
    </div>
    
    <div v-else>
      <pre>{{ data }}</pre>
    </div>
  </div>
</template>
```

### (3) `clearNuxtData`
If the data on your page is stale (for example, the user just deleted a post and you need the list to update), or if a fetch failed and you want to retry, you need to wipe the cache. 

`clearNuxtData` takes the unique string key (or the URL) and deletes that entry from Nuxt's memory cache.

```vue
<script setup lang="ts">
const { data, refresh, error } = await useFetch('/api/posts', { key: 'posts-list' });

const retryFetch = async () => {
  // 1. Wipe the old (potentially errored) data from the cache
  clearNuxtData('posts-list');
  // 2. Trigger the fetch again
  await refresh();
};
</script>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that `clearNuxtData` does not trigger a re-fetch
**The mistake:** Calling `clearNuxtData('my-key')` and expecting the UI to instantly update with fresh data from the server.

**Why it's wrong:** `clearNuxtData` only deletes the data from memory. It does not automatically run the API request again. If you only call `clearNuxtData`, your UI will suddenly become empty because the data was deleted.
**Golden Rule:** Almost always follow up `clearNuxtData(key)` with a call to the `refresh()` function provided by `useFetch` to populate the cache with fresh data.

---

### Mistake 2: Ignoring `error` Ref Returned by `useFetch` (Silent Failures)

**The mistake:** Writing `const { data } = await useFetch('/api/data')` without destructuring or checking `error`.

**Why it's wrong:** `useFetch` does NOT throw uncaught promise rejections on HTTP 404 or 500 errors by default. It captures errors in the `error` ref. If unchecked, `data` resolves as `null` silently.

*Incorrect:*
```vue
<script setup>
const { data } = await useFetch('/api/users');
// ❌ If API 500s, data is null and template crashes silently!
</script>
```

*Fix:*
```vue
<script setup>
const { data, error } = await useFetch('/api/users');
if (error.value) {
  console.error('Fetch error status:', error.value.statusCode);
}
</script>
```

---

### Mistake 3: Using Native `try/catch` Around `useFetch` Expecting Error Catching

**The mistake:** Wrapping `try { const { data } = await useFetch(...) } catch (err)`.

**Why it's wrong:** `useFetch` catches network and HTTP errors internally, returning them in the `error` ref rather than throwing exception rejections. Use `fatal: true` option to force error boundaries.

*Incorrect:*
```vue
try {
  const { data } = await useFetch('/api/user'); // ❌ try/catch does NOT catch HTTP errors!
} catch (e) { ... }
```

*Fix:*
```vue
const { data, error } = await useFetch('/api/user');
if (error.value) {
  throw createError({ statusCode: error.value.statusCode, statusMessage: 'Failed to load' });
}
```


---

## 6. Practice Exercises

### Exercise 1: Wiping the entire cache

**Problem:** The user just successfully logged out. You want to ensure absolutely no cached data from their session remains in memory. How do you clear the ENTIRE Nuxt data cache at once?

**Expected output:**
> [!check]- Answer
> ```typescript
> // Calling clearNuxtData with no arguments clears everything!
> clearNuxtData();
> ```
> - The `clearNuxtData()` utility clears all cached keys globally when invoked without arguments.

---

### Exercise 2: Fatal Error Boundary Trigger Pattern

**Problem:** Write `useFetch` call setting `fatal: true` option so HTTP 404 response triggers Nuxt error page (`error.vue`).

**Expected output:**
> [!check]- Answer
> ```typescript
> const { data } = await useFetch('/api/item', { fatal: true });
> ```
> - `fatal: true` forces `useFetch` errors to trigger Nuxt full-page error boundaries.
> 
> ```vue
> <script setup>
> const { data, error } = await useFetch('/api/item', {
>   fatal: true // Triggers error.vue on failure
> });
> </script>
> ```

---

### Exercise 3: error Ref Properties

**Problem:** List 2 properties available on the `error.value` object returned by `useFetch`.

**Expected output:**
> [!check]- Answer
> ```text
> 1. statusCode (e.g. 404, 500)
> 2. statusMessage / message
> ```
> - `statusCode` -> HTTP status code
> - `statusMessage` -> Status message string
> 
> ```typescript
> console.log(error.value.statusCode, error.value.statusMessage);
> ```


---

## 7. Related Terms
- [`error.vue`](../level_10/error_vue.md) — How to trigger a full-page error instead of an inline component error.
- [`useAsyncData`](../level_05/use_async_data.md) — Works exactly the same way with `error` and `clearNuxtData`.

---

## 8. Key Takeaways
- `useFetch` captures API failures in a reactive `error` object instead of throwing a hard exception.
- You should use `v-else-if="error"` to render graceful fallback UIs.
- `clearNuxtData(key)` deletes data from the Nuxt memory cache.
- Always pair `clearNuxtData` with `refresh()` when you want to force a fresh network request.
