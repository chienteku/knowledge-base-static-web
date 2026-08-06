# `useFetch`

> **Level 5 — Data Fetching**
> The standard, SSR-friendly composable for fetching data inside Vue components. It prevents double-fetching by intelligently transferring data fetched on the server directly to the client payload.

---

## 1. Prerequisites
- [`$fetch` (ofetch)](dollar_fetch.md) — The underlying HTTP client that `useFetch` uses.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The process that `useFetch` optimizes.
- [Nuxt Payload (SSR State Transfer)](../level_04/nuxt_payload.md) — The mechanism conveying server responses to client hydration cache pools.

---

## 2. Term Category

**Data Fetching** (High-Level Reactive Fetch Composable): `useFetch()` is Nuxt 3's primary reactive data fetching composable combining `$fetch` and `useAsyncData()` into a single wrapper.



---

## 3. Explanation

### Environment Context
- **Server & Client**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Basic Reactive Data Fetching with `useFetch()`

**Scenario:**
Fetch a product item using `useFetch("/api/products/1")` and display title, price, and loading state.

**Requirements:**
1. Use `useFetch()` to extract `data`, `pending`, and `error`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data: product, pending, error } = await useFetch("/api/products/1");
> </script>

<template>
  <div>
    <div v-if="pending">Loading product details...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else-if="product">
      <h1>{{ product.title }}</h1>
      <p>Price: ${{ product.price }}</p>
    </div>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `useFetch()` is Nuxt 3's primary composable combining `$fetch` and `useAsyncData()` auto-key generation into a single wrapper.
> 2. `await useFetch()` blocks server HTML rendering until data resolves, ensuring full SSR content generation.
> 3. Automatically handles payload caching and payload hydration.

---

### Exercise 2: Reactive URL Refetching with Computed Watchers

**Scenario:**
Re-fetch user profile data automatically whenever a reactive search parameter `searchId` changes.

**Requirements:**
1. Pass reactive computed URL string to `useFetch()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const userId = ref(1);

// Passing a computed URL automatically re-fetches when userId changes!
const { data: user, pending } = await useFetch(() => `/api/users/${userId.value}`);
</script>

<template>
  <div>
    <button @click="userId++">Next User (ID: {{ userId }})</button>
    <p v-if="pending">Loading user {{ userId }}...</p>
    <p v-else-if="user">User Name: {{ user.name }}</p>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Passing a getter function (`() => \`/api/users/\${userId.value}\``) to `useFetch()` instructs Nuxt to watch reactive dependencies.
> 2. Mutating `userId.value` automatically triggers a network re-fetch for the new URL.
> 3. Declarative reactive data fetching model.

---

### Exercise 3: Passing Headers and Query String Params to `useFetch()`

**Scenario:**
Pass reactive query parameters (`page`, `search`) and custom headers to `useFetch()`.

**Requirements:**
1. Configure `query` and `headers` options in `useFetch()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const page = ref(1);
> const searchQuery = ref("");

const { data: items } = await useFetch("/api/search", {
  query: { page, q: searchQuery },
  headers: {
    "X-Custom-Client": "Nuxt3-Frontend"
  }
});
</script>

<template>
  <div>
    <input v-model="searchQuery" placeholder="Search items..." />
    <button @click="page++">Next Page ({{ page }})</button>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Reactive refs passed inside the `query` object are automatically watched by `useFetch()`.
> 2. Updating `page` or `searchQuery` triggers a new query fetch with updated URL query strings (`/api/search?page=2&q=...`).
> 3. Idiomatic Nuxt 3 search and pagination model.

---




---

## 6. Related Terms
- [`useAsyncData`](use_async_data.md) — The lower-level composable that powers `useFetch`.
- [Caching Data](caching_data.md) — How `useFetch` avoids refetching when navigating back and forth between pages.
- [Dynamic Routes](../level_02/dynamic_routes.md) — Related concept: Dynamic Routes.
- [`$fetch` (ofetch)](dollar_fetch.md) — Related concept: `$fetch` (ofetch).
- [`useLazyFetch` & `useLazyAsyncData` Hooks](use_lazy_fetch.md) — Related concept: `useLazyFetch` & `useLazyAsyncData` Hooks.
- [Vue Suspense Integration](../level_09/vue_suspense.md) — Related concept: Vue Suspense Integration.

---

## 7. Key Takeaways
- `useFetch` prevents SSR double-fetching by transferring server data to the client.
- It returns reactive properties: `data`, `pending`, `error`, and `refresh`.
- Passing reactive variables (refs) into the query/URL automatically triggers a refetch.
- Always `await` it to ensure data is present in the initial server HTML.
