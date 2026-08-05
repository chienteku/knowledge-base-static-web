# `useLazyFetch` & `useLazyAsyncData` Hooks

> **Level 5 — Data Fetching**
> Non-blocking data-fetching hooks that trigger route transitions instantly while loading API payloads asynchronously in the background.

---

## 1. Prerequisites
- [`useFetch`](use_fetch.md) — The standard, blocking data-fetching hook.
- [`useAsyncData`](use_async_data.md) — The lower-level custom promise-fetching composable.

---

## 2. Term Category
- **Data Fetching**

---

## 3. Environment Context
- **Server & Client** (Executed server-side during initial load rendering, and client-side during instant route navigations).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Safe Property Reading

**Problem:** Complete the setup script block below using a watch expression to print the value of `post.title` to the console as soon as it resolves:

```vue
<script setup lang="ts">
import { watch } from 'vue';

const { data: post } = useLazyFetch('/api/post');

// Solution:
watch(post, (newPost) => {
  if (newPost) {
    console.log(newPost.title);
  }
});
</script>
```

> [!check]- Answer
> - The watch hook executes its callback whenever the watched reactive ref value (in this case, `post`) changes.

---

### Exercise 2: useLazyFetch Non-Blocking Pattern

**Problem:** Write Vue component using `useLazyFetch('/api/comments')` displaying a loading spinner while `pending` is true.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup>
> const { data: comments, pending } = await useLazyFetch('/api/comments');
> </script>
> <template>
>   <div v-if="pending">Loading comments...</div>
>   <ul v-else>
>     <li v-for="c in comments" :key="c.id">{{ c.text }}</li>
>   </ul>
> </template>
> ```
> - `useLazyFetch` provides instant page transitions with background data loading.
> 
> ```vue
> <script setup>
> const { data: comments, pending } = await useLazyFetch('/api/comments');
> </script>
> 
> <template>
>   <div>
>     <div v-if="pending" class="spinner">Loading comments...</div>
>     <ul v-else-if="comments">
>       <li v-for="comment in comments" :key="comment.id">
>         {{ comment.text }}
>       </li>
>     </ul>
>   </div>
> </template>
> ```

---

### Exercise 3: useFetch({ lazy: true }) Equivalence

**Problem:** Is `useLazyFetch(url)` identical to calling `useFetch(url, { lazy: true })`?

**Expected output:**
> [!check]- Answer
> ```text
> Yes. useLazyFetch is a shorthand wrapper for useFetch with { lazy: true } option.
> ```
> - `useLazyFetch` is a shorthand for `useFetch(url, { lazy: true })`.
> 
> ```text
> useLazyFetch(url) === useFetch(url, { lazy: true })
> ```


---

## 7. Related Terms
- [`useFetch`](use_fetch.md) — The blocking sibling composable.
- [`useAsyncData`](use_async_data.md) — The core promise wrapping composable.

---

## 8. Key Takeaways
- `useLazyFetch` triggers immediate page routing and loads data in the background.
- It returns `pending: true` and `data: null` immediately upon initialization.
- Use it to improve User Experience (UX) by rendering loading skeletons.
- Never try to read properties of lazy data directly in the synchronous setup script.
- Watch the reactive `data` ref to perform side-effects once the value resolves.
