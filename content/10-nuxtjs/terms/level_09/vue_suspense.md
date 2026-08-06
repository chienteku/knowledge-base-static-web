# Vue Suspense Integration

> **Level 9 — Advanced Rendering & Architecture**
> A built-in Vue 3 component that Nuxt utilizes heavily under the hood to orchestrate asynchronous data fetching (`useFetch` / `useAsyncData`) and guarantee that a page is fully resolved before it is rendered or transitioned.

---

## 1. Prerequisites
- [`useFetch`](../level_05/use_fetch.md) — The asynchronous composables that Suspense listens to.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — Specifically, the use of top-level `await` inside `<script setup>`.
- [Hydration](../level_01/hydration.md) — Asynchronous component resolution during client hydration.

---

## 2. Term Category

**Framework Architecture** (Asynchronous Component Tree Orchestration): Vue `<Suspense>` manages nested async data dependencies across component trees before rendering final hydrated views.



---

## 3. Explanation

### Environment Context
- **Server & Client**

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

## 4. Common Mistakes & Pitfalls

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




---

## 5. Practice Exercises

### Exercise 1: Managing Async Component Boundaries with `<Suspense>`

**Scenario:**
Wrap an async data-fetching component inside Vue `<Suspense>` with a `#fallback` slot.

**Requirements:**
1. Use `<Suspense>` with `#default` and `#fallback` slots.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <template>
>   <div>
>     <Suspense>
>       <template #default>
>         <AsyncUserProfileWidget />
>       </template>
>       <template #fallback>
>         <div class="loading-spinner">Loading Profile...</div>
>       </template>
>     </Suspense>
>   </div>
> </template>
> ```

> #### Technical Explanation
>
> 1. Vue `<Suspense>` is a built-in feature orchestrating async component dependencies in component trees.
> 2. Renders `#fallback` content until top-level `await` calls in child components resolve.
> 3. Nuxt 3 integrates `<Suspense>` internally inside `<NuxtPage>` and `<NuxtLayout>`.

---

### Exercise 2: Top-Level `await` in `<script setup>`

**Scenario:**
Use top-level `await` inside `<script setup>` of a child component managed by `<Suspense>`.

**Requirements:**
1. Execute `await $fetch()` directly at script setup top level.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- AsyncUserProfileWidget.vue -->
> <script setup lang="ts">
> // Top-level await implicitly turns component setup into an async Promise!
> const user = await $fetch("/api/user/profile");
> </script>

<template>
  <div v-if="user">
    <h2>User Profile: {{ user.name }}</h2>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Top-level `await` converts the component's `setup()` function into an asynchronous Promise.
> 2. Parent `<Suspense>` boundaries intercept the pending Promise and display loading fallbacks automatically.
> 3. Standard async component architecture in Vue 3 and Nuxt 3.

---

### Exercise 3: Handling Errors in Suspended Async Component Trees

**Scenario:**
Intercept async setup errors inside suspended component trees using `onErrorCaptured()`.

**Requirements:**
1. Register `onErrorCaptured((err) => ...)` in parent component.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const hasError = ref(false);

onErrorCaptured((error) => {
  console.error("Async Component Tree Error Captured:", error);
  hasError.value = true;
  return false; // Prevents error from propagating higher
});
</script>

<template>
  <div>
    <div v-if="hasError" class="error-msg">Failed to load async components.</div>
    <Suspense v-else>
      <AsyncUserProfileWidget />
    </Suspense>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `onErrorCaptured()` intercepts unhandled exceptions thrown during async setup execution.
> 2. Returning `false` prevents the error from bubbling up to global error handlers.
> 3. Provides robust error boundary protection for suspended component trees.

---




---

## 6. Related Terms
- [`useFetch`](../level_05/use_fetch.md) — The tool used to interact with the Suspense boundary.

---

## 7. Key Takeaways
- `<Suspense>` is a Vue 3 feature that orchestrates asynchronous component loading.
- Nuxt automatically wraps your pages in a Suspense boundary.
- Top-level `await` inside `<script setup>` pauses Suspense until the promise resolves.
- This pause ensures perfect SSR and prevents rendering empty data.
- Use `useLazyFetch` to bypass Suspense and prevent slow APIs from blocking page transitions.
