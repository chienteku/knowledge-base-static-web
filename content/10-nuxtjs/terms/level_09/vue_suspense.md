# Vue Suspense Integration

> **Level 9 — Advanced Rendering & Architecture**
> A built-in Vue 3 component that Nuxt utilizes heavily under the hood to orchestrate asynchronous data fetching (`useFetch` / `useAsyncData`) and guarantee that a page is fully resolved before it is rendered or transitioned.

---

## 1. Prerequisites
- [`useFetch`](../level_05/use_fetch.md) — The asynchronous composables that Suspense listens to.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — Specifically, the use of top-level `await` inside `<script setup>`.

---

## 2. Term Category
- **Rendering Strategies**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue 2, if a component needed to fetch data before rendering, you had to manually track a `isLoading` boolean. If a parent component had 3 children that all needed to fetch data, coordinating those loading states was a nightmare. 

Vue 3 introduced `<Suspense>`. It acts as a boundary. If any component inside the Suspense boundary has an unresolved asynchronous operation (like an `await useFetch()`), Suspense intercepts it. It waits for *all* asynchronous operations within its boundary to finish before finally rendering the actual component. While it waits, it can display a fallback UI.

### (2) How Nuxt uses Suspense
You rarely write `<Suspense>` manually in Nuxt 3. Nuxt automatically wraps your entire application (specifically the `<NuxtPage>` and layout components) inside a giant Suspense boundary.

This is why you can safely write top-level `await` in your pages:

```vue
<!-- pages/dashboard.vue -->
<script setup lang="ts">
// Because Nuxt wraps this page in Suspense, the page transition 
// WILL NOT complete until this fetch is fully resolved!
const { data } = await useFetch('/api/heavy-dashboard-data');
</script>

<template>
  <div>{{ data }}</div>
</template>
```

### (3) Suspense and SSR
During Server-Side Rendering (SSR), the Node.js server executes the component. It hits the `await`, and Suspense tells the server to pause. The server waits for the data to arrive, injects it into the template, and *then* sends the fully-formed HTML to the browser. This guarantees flawless SEO.

### (4) Bypassing Suspense (Lazy Fetching)
Sometimes you don't want the page transition to wait. You want the page to load instantly and show an inline loading spinner. To bypass Suspense, you drop the `await` keyword, or use `useLazyFetch`.

```vue
<script setup lang="ts">
// By using useLazyFetch, Suspense ignores this promise.
// The page transitions instantly, and 'pending' will be true initially.
const { data, pending } = useLazyFetch('/api/slow-data');
</script>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Blocking page transitions with slow APIs
**The mistake:** Using standard `await useFetch()` to load a non-critical sidebar widget that takes 3 seconds to resolve from a slow API.

**Why it's wrong:** Because Suspense halts the entire component tree, the user will click a link and the screen will freeze for 3 seconds while Nuxt waits for the slow API to resolve. The app will feel incredibly sluggish.
**Golden Rule:** Only use `await useFetch()` for data that is absolutely critical for the page's primary layout or SEO. For non-critical data (like a sidebar or comments section), use `useLazyFetch` so it doesn't block Suspense.

---

### Mistake 2: Placing `<Suspense>` Boundaries Below Async Components in Component Hierarchy

**The mistake:** Wrapping `<Suspense>` INSIDE an async component body.

**Why it's wrong:** A `<Suspense>` boundary MUST wrap **above** async components in the template tree. Placing it inside the async component prevents fallback rendering.

*Incorrect:*
```vue
<template>
  <div>
    {{ await fetchData() }} <!-- ❌ Await executes before inner Suspense! -->
    <Suspense><AsyncChild /></Suspense>
  </div>
</template>
```

*Fix:*
```vue
<template>
  <Suspense>
    <template #default><AsyncChild /></template>
    <template #fallback>Loading...</template>
  </Suspense>
</template>
```

---

### Mistake 3: Confusing Nuxt Page `<NuxtPage />` Suspense Handling with Manual Vue Suspense

**The mistake:** Wrapping `<NuxtPage />` inside a manual `<Suspense>` tag in `app.vue`.

**Why it's wrong:** `<NuxtPage />` and `<NuxtLayout>` include built-in Suspense boundaries out of the box. Nesting an extra `<Suspense>` boundary can cause page transition hydration glitches.

*Incorrect:*
```vue
<!-- app.vue -->
<Suspense>
  <NuxtPage /> <!-- ❌ Redundant manual Suspense wrapper around NuxtPage! -->
</Suspense>
```

*Fix:*
```vue
<!-- app.vue -->
<NuxtLayout>
  <NuxtPage /> <!-- Built-in Suspense support -->
</NuxtLayout>
```


---

### Mistake 4: Placing `<Suspense>` Boundaries Below Async Components in Component Hierarchy

**The mistake:** Wrapping `<Suspense>` INSIDE an async component body.

**Why it's wrong:** A `<Suspense>` boundary MUST wrap **above** async components in the template tree. Placing it inside the async component prevents fallback rendering.

*Incorrect:*
```vue
<template>
  <div>
    {{ await fetchData() }} <!-- ❌ Await executes before inner Suspense! -->
    <Suspense><AsyncChild /></Suspense>
  </div>
</template>
```

*Fix:*
```vue
<template>
  <Suspense>
    <template #default><AsyncChild /></template>
    <template #fallback>Loading...</template>
  </Suspense>
</template>
```

---

### Mistake 5: Confusing Nuxt Page `<NuxtPage />` Suspense Handling with Manual Vue Suspense

**The mistake:** Wrapping `<NuxtPage />` inside a manual `<Suspense>` tag in `app.vue`.

**Why it's wrong:** `<NuxtPage />` and `<NuxtLayout>` include built-in Suspense boundaries out of the box. Nesting an extra `<Suspense>` boundary can cause page transition hydration glitches.

*Incorrect:*
```vue
<!-- app.vue -->
<Suspense>
  <NuxtPage /> <!-- ❌ Redundant manual Suspense wrapper around NuxtPage! -->
</Suspense>
```

*Fix:*
```vue
<!-- app.vue -->
<NuxtLayout>
  <NuxtPage /> <!-- Built-in Suspense support -->
</NuxtLayout>
```


---

### Mistake 6: Placing `<Suspense>` Boundaries Below Async Components in Component Hierarchy

**The mistake:** Wrapping `<Suspense>` INSIDE an async component body.

**Why it's wrong:** A `<Suspense>` boundary MUST wrap **above** async components in the template tree. Placing it inside the async component prevents fallback rendering.

*Incorrect:*
```vue
<template>
  <div>
    {{ await fetchData() }} <!-- ❌ Await executes before inner Suspense! -->
    <Suspense><AsyncChild /></Suspense>
  </div>
</template>
```

*Fix:*
```vue
<template>
  <Suspense>
    <template #default><AsyncChild /></template>
    <template #fallback>Loading...</template>
  </Suspense>
</template>
```

---

### Mistake 7: Confusing Nuxt Page `<NuxtPage />` Suspense Handling with Manual Vue Suspense

**The mistake:** Wrapping `<NuxtPage />` inside a manual `<Suspense>` tag in `app.vue`.

**Why it's wrong:** `<NuxtPage />` and `<NuxtLayout>` include built-in Suspense boundaries out of the box. Nesting an extra `<Suspense>` boundary can cause page transition hydration glitches.

*Incorrect:*
```vue
<!-- app.vue -->
<Suspense>
  <NuxtPage /> <!-- ❌ Redundant manual Suspense wrapper around NuxtPage! -->
</Suspense>
```

*Fix:*
```vue
<!-- app.vue -->
<NuxtLayout>
  <NuxtPage /> <!-- Built-in Suspense support -->
</NuxtLayout>
```


---

## 6. Practice Exercises

### Exercise 1: Identifying Suspense Triggers

**Problem:** Look at the following code:
```vue
<script setup>
const req1 = await useFetch('/api/fast');
const req2 = useLazyFetch('/api/slow');
</script>
```
Which of these two requests actually causes the Nuxt Suspense boundary to pause the page rendering?

**Expected output:**
> [!check]- Answer
> ```text
> req1.
> Because it uses `await useFetch`, it registers as an asynchronous dependency that Suspense must wait for. `useLazyFetch` intentionally tells Suspense to ignore it.
> ```
> - Only functions prefixed with `await` halt execution synchronous compiler flows inside setup blocks.

---

### Exercise 2: Vue Suspense Component Pattern

**Problem:** Write Vue template wrapping async component `<AsyncUserCard />` in `<Suspense>` with `<template #fallback>` spinner.

**Expected output:**
> [!check]- Answer
> ```vue
> <template>
>   <Suspense>
>     <template #default>
>       <AsyncUserCard />
>     </template>
>     <template #fallback>
>       <div>Loading user...</div>
>     </template>
>   </Suspense>
> </template>
> ```
> - `<Suspense>` handles async top-level `<script setup>` dependencies.
> 
> ```vue
> <template>
>   <Suspense>
>     <template #default>
>       <AsyncUserCard />
>     </template>
>     <template #fallback>
>       <div class="animate-pulse">Loading user profile...</div>
>     </template>
>   </Suspense>
> </template>
> ```

---

### Exercise 3: Top-Level Await Requirement

**Problem:** What triggers a component to activate a parent `<Suspense>` boundary in Vue 3?

**Expected output:**
> [!check]- Answer
> ```text
> Having a top-level await statement inside <script setup> or returning a Promise from setup().
> ```
> - Top-level `await` inside `<script setup>` activates `<Suspense>`.
> 
> ```vue
> <script setup>
> const data = await fetchAsyncData(); // Activates parent <Suspense>
> </script>
> ```


---

## 7. Related Terms
- [`useFetch`](../level_05/use_fetch.md) — The tool used to interact with the Suspense boundary.

---

## 8. Key Takeaways
- `<Suspense>` is a Vue 3 feature that orchestrates asynchronous component loading.
- Nuxt automatically wraps your pages in a Suspense boundary.
- Top-level `await` inside `<script setup>` pauses Suspense until the promise resolves.
- This pause ensures perfect SSR and prevents rendering empty data.
- Use `useLazyFetch` to bypass Suspense and prevent slow APIs from blocking page transitions.
