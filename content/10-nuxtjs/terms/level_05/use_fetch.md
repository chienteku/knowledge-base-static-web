# `useFetch`

> **Level 5 — Data Fetching**
> The standard, SSR-friendly composable for fetching data inside Vue components. It prevents double-fetching by intelligently transferring data fetched on the server directly to the client payload.

---

## 1. Prerequisites
- [`$fetch` (ofetch)](../level_05/dollar_fetch.md) — The underlying HTTP client that `useFetch` uses.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The process that `useFetch` optimizes.
- [Nuxt Payload (SSR State Transfer)](../level_04/nuxt_payload.md) — The mechanism conveying server responses to client hydration cache pools.

---

## 2. Term Category
- **Data Fetching**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you use a standard `$fetch` (or Axios) call directly inside a Vue component, the code executes twice: the Node server fetches the data to render the HTML, and then the browser fetches the exact same data to hydrate the page. This is inefficient and causes visual tearing.

`useFetch` solves this by acting as a smart wrapper around `$fetch`. When `useFetch` runs on the server, it fetches the data and saves it into Nuxt's internal state payload (embedded in the HTML). When the browser boots up, `useFetch` checks the payload. If the data is already there, it *skips* the network request entirely and instantly hydrates the UI.

### (2) Core Concept
`useFetch` returns several reactive variables. The most common are `data`, `pending`, `error`, and `refresh`.

```vue
<script setup lang="ts">
// The URL is automatically used as a unique cache key!
const { data: user, pending, error } = await useFetch('/api/user/123');
</script>

<template>
  <div>
    <!-- Handle loading state (only visible on client-side navigation) -->
    <p v-if="pending">Loading user profile...</p>
    
    <!-- Handle errors -->
    <p v-else-if="error">Error loading user: {{ error.message }}</p>
    
    <!-- Render data -->
    <div v-else>
      <h1>{{ user.name }}</h1>
    </div>
  </div>
</template>
```

### (3) Automatic Reactivity
If you pass a reactive variable to the URL or query parameters, `useFetch` will automatically re-fetch the data when that variable changes!

```vue
<script setup>
const page = ref(1);

// Because we pass `page` (a ref) directly to the query, 
// Nuxt automatically re-fetches whenever `page` changes!
const { data } = await useFetch('/api/articles', {
  query: { page } 
});
</script>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not awaiting `useFetch` when you need the data for SEO
**The mistake:** Calling `useFetch` without the `await` keyword.

**Why it's wrong:** If you do not `await` the fetch, the server will immediately finish rendering the HTML *before* the data arrives. The resulting HTML will just say "Loading..." (or be completely blank). Search engines won't see your data, destroying your SEO.
**Golden Rule:** Always `await` your `useFetch` calls if you want the data to be rendered in the HTML sent from the server.

*Incorrect:*
```vue
<script setup>
// Server sends empty HTML to the browser!
const { data } = useFetch('/api/seo-critical-data');
</script>
```

*Fix:*
```vue
<script setup>
// Server waits for the data before sending HTML!
const { data } = await useFetch('/api/seo-critical-data');
</script>
```

---

### Mistake 2: Passing String Concatenations with Un-Ref'd Params to `useFetch` (Missing Reactivity)

**The mistake:** Writing `const { data } = await useFetch('/api/post/' + id.value)` when `id` changes dynamically.

**Why it's wrong:** Passing static string concatenation captures `id.value` once at component initialization. Subsequent changes to `id.value` will NOT re-fetch data. Pass a getter function `() => '/api/post/' + id.value`.

*Incorrect:*
```typescript
const id = ref(1);
const { data } = await useFetch('/api/post/' + id.value); // ❌ Does NOT refetch when id.value changes!
```

*Fix:*
```vue
const id = ref(1);
const { data } = await useFetch(() => `/api/post/${id.value}`); // Refetches automatically on id change
```

---

### Mistake 3: Forgetting `watch` Array Option for Dynamic Reactive Dependencies

**The mistake:** Passing reactive non-URL refs (e.g. `page`, `filter`) without adding them to `watch` array or getter URL.

**Why it's wrong:** If API parameters are passed in `query` options object `query: { page: page.value }`, `useFetch` will not detect changes unless `watch: [page]` is specified or getter functions are used.

*Incorrect:*
```vue
const page = ref(1);
const { data } = await useFetch('/api/items', { query: { page: page.value } }); // ❌ Page changes ignored!
```

*Fix:*
```vue
const page = ref(1);
const { data } = await useFetch('/api/items', { query: { page }, watch: [page] }); // Re-fetches when page changes
```


---

## 6. Practice Exercises

### Exercise 1: Refreshing Data

**Problem:** You have a `useFetch` call getting a list of products. The user clicks a "Refresh" button. How do you trigger the `useFetch` to fire again without reloading the page?

**Expected output:**
```vue
<script setup lang="ts">
// Extract the refresh function
const { data: products, refresh } = await useFetch('/api/products');
</script>

<template>
  <!-- Call the function on click -->
  <button @click="refresh()">Refresh Products</button>
</template>
```

> [!check]- Answer
> - You can destructure the `refresh` method returned by `useFetch()` and trigger it inside a click listener.

---

### Exercise 2: Reactive useFetch Query Pattern

**Problem:** Write `useFetch` call querying `/api/search` with reactive `searchQuery` ref, setting `watch: [searchQuery]` and `pick: ['results']`.

**Expected output:**
```typescript
const searchQuery = ref('');
const { data } = await useFetch('/api/search', {
  query: { q: searchQuery },
  watch: [searchQuery],
  pick: ['results']
});
```

> [!check]- Answer
> - `query`, `watch`, and `pick` options optimize reactive fetching.
> 
> ```typescript
> const searchQuery = ref('');
> 
> const { data: results, pending } = await useFetch('/api/search', {
>   query: { q: searchQuery },
>   watch: [searchQuery],
>   pick: ['results']
> });
> ```

---

### Exercise 3: useFetch pick Option Benefit

**Problem:** How does `pick: ['id', 'title']` improve Nuxt 3 performance?

**Expected output:**
```text
It extracts ONLY specified properties from API responses, reducing payload serialization size and client memory overhead.
```

> [!check]- Answer
> - `pick` reduces payload serialization network size.
> 
> ```typescript
> useFetch('/api/user', { pick: ['id', 'name'] });
> ```


---

## 7. Related Terms
- [`useAsyncData`](../level_05/use_async_data.md) — The lower-level composable that powers `useFetch`.
- [Caching Data](../level_05/caching_data.md) — How `useFetch` avoids refetching when navigating back and forth between pages.

---

## 8. Key Takeaways
- `useFetch` prevents SSR double-fetching by transferring server data to the client.
- It returns reactive properties: `data`, `pending`, `error`, and `refresh`.
- Passing reactive variables (refs) into the query/URL automatically triggers a refetch.
- Always `await` it to ensure data is present in the initial server HTML.
