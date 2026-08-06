# `useAsyncData`

> **Level 5 — Data Fetching**
> The lower-level composable that powers Nuxt's SSR-safe data fetching. Unlike `useFetch`, which is strictly for HTTP requests, `useAsyncData` can wrap *any* asynchronous operation (like a database call or a third-party SDK) to prevent double-execution.

---

## 1. Prerequisites
- [`useFetch`](use_fetch.md) — The syntactic sugar built directly on top of `useAsyncData`.
- [Promise](../../../03-javascript/terms/level_06/promise.md) — The underlying asynchronous callback runtime wrapper.

---

## 2. Term Category

**Data Fetching** (Asynchronous Data Resolution Composable): `useAsyncData()` wraps asynchronous data fetching logic with SSR payload caching, pending indicators, and key-based deduplication.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
`useFetch` is perfect for hitting REST APIs via HTTP. But what if you aren't using an HTTP API? What if you are using a GraphQL client (like Apollo), a headless CMS SDK (like Contentful), or querying a local database directly?

If you run `await mySDK.getArticles()` in a Vue component, you hit the same SSR double-execution problem: it runs on the server, and then runs again on the client. 

`useAsyncData` is the generic wrapper that solves this. It takes a unique string key and an asynchronous function. It executes the function on the server, stores the result under the string key, and passes it to the client.

### (2) Core Concept
The syntax requires a unique string key (to identify the data payload) and a callback function that returns a Promise.

```vue
<script setup lang="ts">
import { myCustomCMS } from '~/utils/cms';

// 1. 'articles' is the unique cache key.
// 2. The callback is the async operation.
const { data, pending, error } = await useAsyncData('articles', async () => {
  return await myCustomCMS.fetchData();
});
</script>
```

*Note: `useFetch(url)` is literally just a shortcut for `useAsyncData(url, () => $fetch(url))`.*

### (3) Advanced: Multiple Concurrent Fetches
If you need to hit three different APIs before rendering a page, using three `await useFetch()` calls in a row creates a waterfall (they run one after another, which is slow). 

You can use `useAsyncData` combined with `Promise.all` to fetch them concurrently!

```vue
<script setup lang="ts">
const { data } = await useAsyncData('dashboard-data', async () => {
  const [users, posts] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/posts')
  ]);
  
  return { users, posts };
});
</script>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Re-using the same key across different API calls
**The mistake:** Naming your `useAsyncData` key something generic like `'data'` on multiple different pages.

**Why it's wrong:** The string key is global to the request. If the Home page uses `useAsyncData('data', ...)` and the About page uses `useAsyncData('data', ...)`, Nuxt will think they are the exact same payload. When navigating between the two, Nuxt will serve the Home page's data to the About page!
**Golden Rule:** The key must be absolutely unique across your entire application. (e.g., `'home-hero-content'`, `'about-team-list'`).

---

### Mistake 2: Omitting the Unique Key Parameter in Custom `useAsyncData` Calls

**The mistake:** Calling `useAsyncData(async () => dbQuery())` without a key argument.

**Why it's wrong:** Nuxt uses key strings to track and deduplicate payload cache. Omitting unique keys across components causes payload cache collisions or duplicate fetches.

*Incorrect:*
```typescript
const { data } = await useAsyncData(async () => fetchUser()); // ❌ Missing key parameter!
```

*Fix:*
```vue
const { data } = await useAsyncData('user-data-key', async () => fetchUser()); // Explicit unique key
```

---

### Mistake 3: Passing Non-Async Synchronous Functions to `useAsyncData`

**The mistake:** Passing a non-promise returning function `useAsyncData('key', () => 'static')`.

**Why it's wrong:** `useAsyncData` expects an async handler function returning a Promise. Pass async functions or promises.

*Incorrect:*
```vue
const { data } = await useAsyncData('key', () => 'plain string'); // ❌ Expected promise return!
```

*Fix:*
```vue
const { data } = await useAsyncData('key', async () => 'plain string');
```


---

## 5. Practice Exercises

### Exercise 1: Combining Multiple `$fetch` Calls inside `useAsyncData()`

**Scenario:**
Fetch user data and user permissions in parallel using `Promise.all` inside `useAsyncData()`.

**Requirements:**
1. Execute `Promise.all([$fetch('/api/user'), $fetch('/api/permissions')])` inside `useAsyncData()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data } = await useAsyncData("user-profile-bundle", async () => {
>   const [user, permissions] = await Promise.all([
>     $fetch("/api/user"),
>     $fetch("/api/permissions")
>   ]);
>   return { user, permissions };
> });
> </script>
> 
> <template>
>   <div v-if="data">
>     <h1>Welcome, {{ data.user.name }}</h1>
>     <p>Role: {{ data.permissions.role }}</p>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `useAsyncData()` wraps custom async functions, allowing multiple API requests to execute in parallel during SSR.
> 2. Bundles combined data results into a single payload cache entry under `"user-profile-bundle"`.
> 3. Reduces waterfall network request delays.
> 
---

### Exercise 2: Using the `transform` Option to Filter Response Attributes

**Scenario:**
Transform an API user list to extract ONLY user names and IDs before payload serialization.

**Requirements:**
1. Pass `transform` callback option to `useAsyncData()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data: userList } = await useAsyncData(
>   "users-summary",
>   () => $fetch("/api/users"),
>   {
>     transform: (users: any[]) => {
>       return users.map(u => ({ id: u.id, name: u.name }));
>     }
>   }
> );
> </script>
> 
> <template>
>   <ul>
>     <li v-for="u in userList" :key="u.id">{{ u.name }}</li>
>   </ul>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `transform` modifies the return data before it is written to the reactive `data` ref and `NuxtPayload`.
> 2. Filters out heavy, unnecessary API response attributes.
> 3. Reduces memory usage and SSR payload size.
> 
---

### Exercise 3: Deferred Data Fetching with `lazy: true`

**Scenario:**
Execute `useAsyncData()` without blocking client-side route navigation transitions using `lazy: true`.

**Requirements:**
1. Pass `{ lazy: true }` options object to `useAsyncData()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data: reports, pending } = useAsyncData(
>   "analytics-reports",
>   () => $fetch("/api/reports"),
>   { lazy: true }
> );
> </script>
> 
> <template>
>   <div>
>     <div v-if="pending">Loading Reports...</div>
>     <div v-else-if="reports">
>       <p>Total Reports: {{ reports.length }}</p>
>     </div>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `lazy: true` instructs Nuxt to navigate to the target page immediately while data fetching resolves in the background.
> 2. `pending` indicates whether background data resolution is currently in progress.
> 3. Improves perceived routing speed for heavy analytical pages.
> 
---


## 6. Related Terms
- [Caching Data](caching_data.md) — How the unique string key is used to cache data across navigations.
- [`$fetch` (ofetch)](dollar_fetch.md) — Related concept: `$fetch` (ofetch).
- [Fetching Errors & `clearNuxtData`](fetching_errors.md) — Related concept: Fetching Errors & `clearNuxtData`.
- [`useFetch`](use_fetch.md) — Related concept: `useFetch`.
- [`useLazyFetch` & `useLazyAsyncData` Hooks](use_lazy_fetch.md) — Related concept: `useLazyFetch` & `useLazyAsyncData` Hooks.

---

## 7. Key Takeaways
- `useAsyncData` is the SSR-safe wrapper for *any* asynchronous logic.
- It requires a globally unique string key.
- It returns the exact same reactive properties as `useFetch` (`data`, `pending`, `refresh`).
- It is ideal for SDKs, GraphQL clients, or concurrent `Promise.all` fetching.
