# `useAsyncData`

> **Level 5 — Data Fetching**
> The lower-level composable that powers Nuxt's SSR-safe data fetching. Unlike `useFetch`, which is strictly for HTTP requests, `useAsyncData` can wrap *any* asynchronous operation (like a database call or a third-party SDK) to prevent double-execution.

---

## 1. Prerequisites
- [`useFetch`](use_fetch.md) — The syntactic sugar built directly on top of `useAsyncData`.
- [Promise](../../../03-javascript/terms/level_06/promise.md) — The underlying asynchronous callback runtime wrapper.

---

## 2. Term Category
- **Data Fetching**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Transforming Data

**Problem:** You are fetching an array of 100 users, but your UI only needs the first 3 usernames. Sending 100 full user objects from the server to the client wastes massive payload size. How can you use the `transform` option in `useAsyncData` to only return the necessary data?

**Expected output:**
> [!check]- Answer
> ```typescript
> const { data } = await useAsyncData('users', 
>   () => $fetch('/api/users'), 
>   {
>     transform: (users) => users.slice(0, 3).map(u => u.username)
>   }
> );
> ```
> - The `transform` configuration property accepts a mapping function that receives the raw resolved API result and returns the sliced format.

---

### Exercise 2: useAsyncData Transform Data Pattern

**Problem:** Write `useAsyncData` call with custom `transform` function mapping array of user objects to extract only user names.

**Expected output:**
> [!check]- Answer
> ```typescript
> const { data: names } = await useAsyncData('users-names', () => $fetch('/api/users'), {
>   transform: (users) => users.map(u => u.name)
> });
> ```
> - `transform` option sanitizes data payload before payload serialization.
> 
> ```typescript
> const { data: userNames } = await useAsyncData(
>   'user-names-list',
>   () => $fetch('/api/users'),
>   {
>     transform: (users: Array<{ id: number; name: string }>) =>
>       users.map((user) => user.name)
>   }
> );
> ```

---

### Exercise 3: useAsyncData lazy Option

**Problem:** What effect does setting `{ lazy: true }` have on `useAsyncData` during navigation?

**Expected output:**
> [!check]- Answer
> ```text
> It prevents navigation blocking, resolving the async data in background while page transition renders immediately.
> ```
> - `{ lazy: true }` renders page immediately without blocking router navigation.
> 
> ```typescript
> const { data, pending } = await useAsyncData('key', () => fetcher(), { lazy: true });
> ```


---

## 7. Related Terms
- [Caching Data](caching_data.md) — How the unique string key is used to cache data across navigations.
- [`$fetch` (ofetch)](dollar_fetch.md) — Related concept: `$fetch` (ofetch).
- [Fetching Errors & `clearNuxtData`](fetching_errors.md) — Related concept: Fetching Errors & `clearNuxtData`.
- [`useFetch`](use_fetch.md) — Related concept: `useFetch`.
- [`useLazyFetch` & `useLazyAsyncData` Hooks](use_lazy_fetch.md) — Related concept: `useLazyFetch` & `useLazyAsyncData` Hooks.

---

## 8. Key Takeaways
- `useAsyncData` is the SSR-safe wrapper for *any* asynchronous logic.
- It requires a globally unique string key.
- It returns the exact same reactive properties as `useFetch` (`data`, `pending`, `refresh`).
- It is ideal for SDKs, GraphQL clients, or concurrent `Promise.all` fetching.
