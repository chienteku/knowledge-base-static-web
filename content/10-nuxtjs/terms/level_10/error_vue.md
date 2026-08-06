# `error.vue` & `useError`

> **Level 10 — Error Handling & Production**
> A special root-level Vue component that completely replaces your entire application layout to display a fatal error message (like a 404 or 500) to the user.

---

## 1. Prerequisites
- [`app.vue`](../level_02/app_vue.md) — The root application instance `error.vue` completely replaces.
- [`createError`, `showError` & `clearError`](create_error.md) — The utility functions that trigger this page.

---

## 2. Term Category

**Framework Architecture** (Global Application Error Boundary Page): `error.vue` is the root error boundary component in Nuxt 3, handling unhandled application crashes and 404/500 errors gracefully.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
If a user visits a URL that doesn't exist (`/this-is-fake`), or if a critical server-side database fetch fails, you cannot just show them a blank screen. You need to show a stylized "404 Page Not Found" or "500 Internal Server Error" page.

In Nuxt, fatal errors completely break the Vue rendering lifecycle. To catch them, Nuxt provides a dedicated `error.vue` file. This file sits at the absolute root of your project (alongside `app.vue`). When a fatal error occurs, Nuxt unmounts `app.vue` entirely and mounts `error.vue` in its place.

### (2) Core Concept
Inside `error.vue`, Nuxt provides a `useError()` composable so you can read the error details and display them to the user.

```vue
<!-- error.vue (Located at the absolute root of the project) -->
<script setup lang="ts">
// Retrieve the fatal error object
const error = useError();

// A function to clear the error and send the user back home
const handleError = () => {
  clearError({ redirect: '/' });
};
</script>

<template>
  <div class="error-page">
    <h1>Error {{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    
    <button @click="handleError">Go back home</button>
  </div>
</template>
```

### (3) Recovering from an Error
Because `error.vue` completely replaces `app.vue`, the standard `<NuxtLink>` or `useRouter().push('/')` will not work to escape the error page! 

You **must** use the `clearError()` utility. This function wipes the fatal error from Nuxt's internal state and safely re-mounts the main `app.vue` application.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting `error.vue` inside the `pages/` directory
**The mistake:** Creating `pages/error.vue` instead of placing it at the root of the project.

**Why it's wrong:** Nuxt specifically looks for `error.vue` at the exact same level as `app.vue`. If you put it in `pages/`, Nuxt will think it is just a standard route (`yoursite.com/error`), and the global error handler will fall back to the ugly default Nuxt error screen.
**Golden Rule:** `error.vue` must always be at the root of the repository.

---

### Mistake 2: Placing `error.vue` inside `pages/` Directory Instead of Project Root

**The mistake:** Creating `pages/error.vue`.

**Why it's wrong:** Nuxt 3 recognizes `error.vue` ONLY when placed in the root directory (or `app/error.vue`). Placing it in `pages/` creates an accidental `/error` URL route instead of a global error boundary.

*Incorrect:*
```vue
// pages/error.vue ❌ Exposes accidental /error URL route!
```

*Fix:*
```vue
// error.vue (Project root directory)
```

---

### Mistake 3: Forgetting to Call `clearError()` Before Navigating Users Away from `error.vue`

**The mistake:** Writing `<NuxtLink to="/">Go Home</NuxtLink>` inside `error.vue` without calling `clearError()`.

**Why it's wrong:** Navigating away from `error.vue` without calling `clearError()` leaves the Nuxt global error state active, preventing the app from returning to normal page rendering.

*Incorrect:*
```vue
<!-- error.vue -->
<NuxtLink to="/">Go Home</NuxtLink> <!-- ❌ Error state remains active in router! -->
```

*Fix:*
```vue
<!-- error.vue -->
<button @click="clearError({ redirect: '/' })">Go Home</button>
```


---

## 5. Practice Exercises

### Exercise 1: Authoring Master `error.vue` Custom Error Page

**Scenario:**
Create root `error.vue` component displaying HTTP status code, message, and a reset button.

**Requirements:**
1. Create `error.vue` at project root accepting `error` prop.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- error.vue -->
> <script setup lang="ts">
> const props = defineProps({
>   error: Object
> });

const is404 = computed(() => props.error?.statusCode === 404);

function handleClear() {
  clearError({ redirect: "/" });
}
</script>

<template>
  <div class="error-container">
    <h1 v-if="is404">404 - Page Not Found</h1>
    <h1 v-else>An Unexpected Error Occurred</h1>
    <p class="error-msg">{{ props.error?.message }}</p>
    <button @click="handleClear">Back to Home</button>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `error.vue` placed at the project root acts as Nuxt's top-level error boundary template.
> 2. Automatically renders when unhandled exceptions occur during SSR or client navigation.
> 3. `clearError()` resets error state and redirects to target route.

---

### Exercise 2: Differentiating 404 vs 500 Errors in `error.vue`

**Scenario:**
Render custom graphics for 404 Not Found vs 500 Internal Server Error in `error.vue`.

**Requirements:**
1. Branch template rendering based on `props.error.statusCode`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- error.vue -->
> <script setup lang="ts">
> defineProps({ error: Object });
> </script>

<template>
  <div>
    <div v-if="error?.statusCode === 404">
      <h2>404</h2>
      <p>The page you requested does not exist.</p>
    </div>
    <div v-else-if="error?.statusCode === 500">
      <h2>500</h2>
      <p>Server error. Our engineers are investigating.</p>
    </div>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `props.error` receives `NuxtError` containing `statusCode`, `statusMessage`, and `stack`.
> 2. Conditional template branching displays user-friendly error UI based on status codes.
> 3. Standard error UX pattern.

---

### Exercise 3: Testing Custom Error Page Triggers

**Scenario:**
Test `error.vue` by throwing an error from `pages/test-error.vue`.

**Requirements:**
1. Throw `createError({ statusCode: 500, fatal: true })`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- pages/test-error.vue -->
> <script setup lang="ts">
> throw createError({
>   statusCode: 500,
>   statusMessage: "Test Server Crash Error",
>   fatal: true
> });
> </script>
> ```

> #### Technical Explanation
>
> 1. `fatal: true` forces Nuxt to clear the page layout and render `error.vue`.
> 2. Works across both SSR server execution and client SPA execution.
> 3. Diagnostic error testing technique.

---




---

## 6. Related Terms
- [`<NuxtErrorBoundary>` Component](nuxt_error_boundary.md) — How to handle non-fatal errors without destroying the whole page layout.
- [Fetching Errors & `clearNuxtData`](../level_05/fetching_errors.md) — Related concept: Fetching Errors & `clearNuxtData`.
- [`abortNavigation` Utility](../level_08/abort_navigation.md) — Related concept: `abortNavigation` Utility.
- [`createError`, `showError` & `clearError`](create_error.md) — Related concept: `createError`, `showError` & `clearError`.

---

## 7. Key Takeaways
- `error.vue` is a root-level file that completely replaces `app.vue` when a fatal error occurs.
- It is perfect for handling global 404s and 500s.
- You access the error details using `useError()`.
- You must use `clearError({ redirect: '/' })` to escape the error page and return to the main app.
