# Fetching Errors & `clearNuxtData`

> **Level 5 — Data Fetching**
> The pattern for gracefully handling API failures in `useFetch` and `useAsyncData`, and the utility used to manually purge corrupt or stale data from the Nuxt cache.

---

## 1. Prerequisites
- [`useFetch`](use_fetch.md) — The composable that generates these errors.
- [Caching Data](caching_data.md) — The cache that `clearNuxtData` interacts with.

---

## 2. Term Category

**Data Fetching** (HTTP Error Handling & Recovery): Data fetching error handling captures, handles, and clears HTTP 4xx/5xx errors returned by `useFetch()` and `useAsyncData()`.



---

## 3. Explanation

### Environment Context
- **Server & Client**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Handling Fetch Errors Returned by `useFetch()`

**Scenario:**
Display an error banner when `useFetch()` receives an HTTP 500 or 404 response.

**Requirements:**
1. Extract `error` property from `useFetch()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data: user, error } = await useFetch("/api/user/9999");
> </script>
> 
> <template>
>   <div>
>     <div v-if="error" class="error-banner">
>       <p>Failed to load user profile: {{ error.statusMessage || error.message }}</p>
>       <p>HTTP Code: {{ error.statusCode }}</p>
>     </div>
>     <div v-else-if="user">
>       <h1>User: {{ user.name }}</h1>
>     </div>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `useFetch()` returns an `error` reactive ref containing a Nuxt `FetchError` object when request execution fails.
> 2. `error.statusCode` exposes HTTP status codes (e.g. 404, 500).
> 3. Prevents application crashes by capturing data fetching errors gracefully.
> 
---

### Exercise 2: Triggering Full Nuxt Error Pages with `fatal: true`

**Scenario:**
Configure `useFetch()` to trigger Nuxt's full-screen `error.vue` page when fetching critical route data fails.

**Requirements:**
1. Pass `fatal: true` to `createError()` or handle in watch block.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const route = useRoute();
> const { data: post, error } = await useFetch(`/api/posts/${route.params.id}`);
> 
> if (error.value) {
>   // Triggers full Nuxt error boundary page (error.vue)
>   throw createError({
>     statusCode: error.value.statusCode || 404,
>     statusMessage: "Post Not Found",
>     fatal: true
>   });
> }
> </script>
> 
> <template>
>   <article v-if="post">
>     <h1>{{ post.title }}</h1>
>   </article>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. Throwing `createError({ fatal: true })` forces Nuxt to render the root `error.vue` error boundary template.
> 2. Works consistently on both server SSR and client browser environments.
> 3. Standard method for handling non-recoverable 404/500 route errors.
> 
---

### Exercise 3: Retrying Failed Fetch Operations with `refresh()`

**Scenario:**
Provide a retry button for users to clear fetch errors and retry network data fetching.

**Requirements:**
1. Call `refresh()` returned by `useFetch()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data: feed, error, refresh, pending } = await useFetch("/api/live-feed");
> </script>
> 
> <template>
>   <div>
>     <div v-if="error">
>       <p>Error loading feed.</p>
>       <button @click="() => refresh()" :disabled="pending">
>         {{ pending ? "Retrying..." : "Retry Fetch" }}
>       </button>
>     </div>
>     <div v-else-if="feed">
>       <ul>
>         <li v-for="item in feed" :key="item.id">{{ item.text }}</li>
>       </ul>
>     </div>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `refresh()` re-executes the data fetching function associated with `useFetch()`.
> 2. Clears previous error states and updates `pending` indicators automatically during retry execution.
> 3. Standard user error recovery pattern.
> 
---


## 6. Related Terms
- [`error.vue` & `useError`](../level_10/error_vue.md) — How to trigger a full-page error instead of an inline component error.
- [`useAsyncData`](use_async_data.md) — Works exactly the same way with `error` and `clearNuxtData`.
- [Caching Data](caching_data.md) — Related concept: Caching Data.

---

## 7. Key Takeaways
- `useFetch` captures API failures in a reactive `error` object instead of throwing a hard exception.
- You should use `v-else-if="error"` to render graceful fallback UIs.
- `clearNuxtData(key)` deletes data from the Nuxt memory cache.
- Always pair `clearNuxtData` with `refresh()` when you want to force a fresh network request.
