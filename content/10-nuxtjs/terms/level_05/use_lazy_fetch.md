# `useLazyFetch` & `useLazyAsyncData` Hooks

> **Level 5 — Data Fetching**
> Non-blocking data-fetching hooks that trigger route transitions instantly while loading API payloads asynchronously in the background.

---

## 1. Prerequisites
- [`useFetch`](use_fetch.md) — The standard, blocking data-fetching hook.
- [`useAsyncData`](use_async_data.md) — The lower-level custom promise-fetching composable.

---

## 2. Term Category

**Data Fetching** (Non-Blocking Lazy Data Fetching): `useLazyFetch()` executes data fetching asynchronously without blocking client-side or server-side route navigation transitions.



---

## 3. Explanation

### Environment Context
- **Server & Client** (Executed server-side during initial load rendering, and client-side during instant route navigations).

### (1) Design Motivation — "Why did we design this?"
By default, the statement `await useFetch()` is **blocking**. When a user navigates between pages on the client side (e.g., clicking a link to `/reports`):
1.  Nuxt intercepts the click.
2.  Nuxt halts the page transition.
3.  Nuxt waits for the `/reports` API network request to resolve.
4.  Once resolved, Nuxt swaps the layout.

If the API endpoint is slow (taking 2 or 3 seconds), the user experiences a frozen screen with zero visual feedback. 

**`useLazyFetch`** and **`useLazyAsyncData`** resolve this: they run the request in the background and trigger the route transition **immediately**, allowing you to show loading skeletons or spinners on the target page.

---

### (2) How it Works: `useLazyFetch`
`useLazyFetch` is syntactically identical to `useFetch`, but defaults the configuration option `{ lazy: true }` behind the scenes.

Because it does not block navigation, it returns a reactive state structure immediately:
-   **`data`** starts as `null` (or your defined default value).
-   **`pending`** starts as `true`.

```vue
<!-- pages/dashboard.vue -->
<script setup lang="ts">
// Page transitions immediately! No await keyword is used.
const { data: stats, pending } = useLazyFetch('/api/slow-stats');
</script>

<template>
  <div>
    <h1>Analytics Dashboard</h1>

    <!-- 1. Display loading feedback while data is in transit -->
    <div v-if="pending">
      <p>Loading stats... (Showing loading skeleton)</p>
    </div>

    <!-- 2. Render actual data once resolved -->
    <div v-else>
      <p>Active Users: {{ stats?.activeUsers }}</p>
    </div>
  </div>
</template>
```

---

### (3) Under the Hood: `useLazyAsyncData`
Just as `useFetch` is a shorthand for `useAsyncData` + `$fetch`, `useLazyFetch` is a shorthand for `useLazyAsyncData` wrapping a `$fetch` function:

```typescript
// These two declarations are equivalent:
const { data } = useLazyFetch('/api/data');
const { data } = useLazyAsyncData('my-key', () => $fetch('/api/data'));
```

Use `useLazyAsyncData` when you need to run custom promise operations (e.g. hitting multiple APIs concurrently with `Promise.all()`) without blocking the route transition.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to access data properties in setup code before resolution

**The mistake:** Trying to read nested properties of the fetched lazy data directly inside the synchronous setup script:

```vue
<!-- BAD: Crashes the component instantly! -->
<script setup>
const { data: post } = useLazyFetch('/api/post');

// ❌ Crashes with: "Cannot read properties of null (reading 'title')"
const pageTitle = post.value.title;
</script>
```

**Why it's wrong:** Because `useLazyFetch` is non-blocking, `post.value` is still `null` when the script runs. The component template compiles immediately. Attempting to parse properties of a null object crashes the execution runtime.

**Golden Rule:** Always protect dynamic templates with `v-if` conditionals or optional chaining (`post?.title`), and execute side-effects depending on the loaded values inside a Vue `watch` hook instead of synchronous script code.

---

### Mistake 2: Expecting `useLazyFetch` Data to Be Resolved Immediately on Component Mount

**The mistake:** Attempting to access `data.value.title` directly without checking `pending` status or nullability.

**Why it's wrong:** `useLazyFetch` does NOT block navigation. `data.value` is `null` initially while `pending.value` is `true`. Reading properties directly on `data.value` throws a `Cannot read property of null` error.

*Incorrect:*
```vue
<template>
  <div>{{ data.title }}</div> <!-- ❌ TypeError: Cannot read property 'title' of null! -->
</template>
```

*Fix:*
```vue
<template>
  <div v-if="pending">Loading...</div>
  <div v-else-if="data">{{ data.title }}</div>
</template>
```

---

### Mistake 3: Using `useLazyFetch` on Critical SEO-Blocking Landing Page Content

**The mistake:** Fetching critical landing page header text with `useLazyFetch`.

**Why it's wrong:** `useLazyFetch` defers data fetching to non-blocking background requests. For critical SEO content, deferring data fetching results in empty initial server HTML. Use `useFetch` instead.

*Incorrect:*
```vue
/* Using useLazyFetch for main hero text on landing page */
```

*Fix:*
```vue
/* Use await useFetch() for critical SEO-blocking content */
```


---

## 5. Practice Exercises

### Exercise 1: Implementing Non-Blocking Page Navigation with `useLazyFetch()`

**Scenario:**
Fetch product recommendations using `useLazyFetch()` to avoid blocking client page navigation transitions.

**Requirements:**
1. Execute `useLazyFetch("/api/recommendations")`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data: recommendations, pending } = useLazyFetch("/api/recommendations");
> </script>

<template>
  <div>
    <h2>Product Recommendations</h2>
    <div v-if="pending" class="skeleton-loader">
      <p>Loading personalized recommendations...</p>
    </div>
    <ul v-else-if="recommendations">
      <li v-for="item in recommendations" :key="item.id">{{ item.name }}</li>
    </ul>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `useLazyFetch()` is shorthand for `useFetch(url, { lazy: true })`.
> 2. Route navigation transitions complete immediately without waiting for server network requests to resolve.
> 3. `pending` state indicates when background data processing completes.

---

### Exercise 2: Combining `useLazyFetch()` with Client-Side Skeletons

**Scenario:**
Display a UI card skeleton while `useLazyFetch()` loads secondary dashboard widgets.

**Requirements:**
1. Render skeleton UI when `pending` is `true`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data: stats, pending } = useLazyFetch("/api/analytics/summary");
> </script>

<template>
  <div class="widget-card">
    <h3>Analytics Summary</h3>
    <template v-if="pending">
      <div class="placeholder-shimmer">---</div>
    </template>
    <template v-else-if="stats">
      <p>Total Views: {{ stats.views }}</p>
      <p>Conversions: {{ stats.conversions }}</p>
    </template>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Non-blocking lazy fetching allows primary page elements to display instantly while secondary data loads asynchronously.
> 2. Prevents slow secondary microservice endpoints from delaying page load transitions.
> 3. Improves Web Vitals and perceived user interaction speed.

---

### Exercise 3: Controlling Server-Side Execution of Lazy Fetches

**Scenario:**
Configure `useLazyFetch()` to execute ONLY on the client browser (`server: false`).

**Requirements:**
1. Pass `{ server: false }` to `useLazyFetch()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const { data: userActivity, pending } = useLazyFetch("/api/user/activity", {
>   server: false
> });
> </script>

<template>
  <div>
    <p v-if="pending">Fetching live user activity...</p>
    <div v-else-if="userActivity">
      <p>Last Login: {{ userActivity.lastLogin }}</p>
    </div>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `server: false` instructs Nuxt to skip data fetching completely during server SSR rendering.
> 2. Data fetching begins in the browser immediately after client hydration completes.
> 3. Ideal for non-critical user activity logs or browser-only widgets.

---




---

## 6. Related Terms
- [`useFetch`](use_fetch.md) — The blocking sibling composable.
- [`useAsyncData`](use_async_data.md) — The core promise wrapping composable.

---

## 7. Key Takeaways
- `useLazyFetch` triggers immediate page routing and loads data in the background.
- It returns `pending: true` and `data: null` immediately upon initialization.
- Use it to improve User Experience (UX) by rendering loading skeletons.
- Never try to read properties of lazy data directly in the synchronous setup script.
- Watch the reactive `data` ref to perform side-effects once the value resolves.
