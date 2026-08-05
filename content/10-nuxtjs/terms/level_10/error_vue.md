# `error.vue` & `useError`

> **Level 10 — Error Handling & Production**
> A special root-level Vue component that completely replaces your entire application layout to display a fatal error message (like a 404 or 500) to the user.

---

## 1. Prerequisites
- [`app.vue`](../level_02/app_vue.md) — The root application instance `error.vue` completely replaces.
- [`createError`, `showError` & `clearError`](create_error.md) — The utility functions that trigger this page.

---

## 2. Term Category
- **Error Handling**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Handling 404s differently

**Problem:** Write the `<template>` block for an `error.vue` file that shows a picture of a lost dog if the `statusCode` is `404`, but shows a picture of a broken robot for any other error code.

**Expected output:**
> [!check]- Answer
> ```vue
> <template>
>   <div>
>     <img v-if="error.statusCode === 404" src="/lost-dog.jpg" alt="Not Found" />
>     <img v-else src="/broken-robot.jpg" alt="Server Error" />
>     
>     <button @click="clearError({ redirect: '/' })">Home</button>
>   </div>
> </template>
> ```
> - Read the `statusCode` property on the `error` object inside a conditional template block.

---

### Exercise 2: Global error.vue Setup Pattern

**Problem:** Write root `error.vue` component accepting `error` prop and displaying `error.statusCode`, `error.message`, and a button invoking `clearError({ redirect: '/' })`.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup>
> defineProps(['error']);
> </script>
> <template>
>   <div>
>     <h1>{{ error.statusCode }}</h1>
>     <p>{{ error.message }}</p>
>     <button @click="clearError({ redirect: '/' })">Clear Error</button>
>   </div>
> </template>
> ```
> - `error.vue` is the top-level error boundary component.
> 
> ```vue
> <!-- error.vue -->
> <script setup>
> const props = defineProps({
>   error: Object
> });
> 
> const handleClearError = () => clearError({ redirect: '/' });
> </script>
> 
> <template>
>   <div class="flex flex-col items-center justify-center min-h-screen">
>     <h1 class="text-4xl font-bold">{{ error.statusCode }}</h1>
>     <p class="mt-2 text-gray-600">{{ error.message }}</p>
>     <button @click="handleClearError" class="mt-4 btn">
>       Back to Homepage
>     </button>
>   </div>
> </template>
> ```

---

### Exercise 3: clearError Options

**Problem:** Which option object property passed to `clearError({ redirect: '/url' })` redirects the user while clearing error state?

**Expected output:**
> [!check]- Answer
> ```text
> redirect: '/url'
> ```
> - `redirect` specifies the target URL after clearing error state.
> 
> ```typescript
> clearError({ redirect: '/dashboard' });
> ```


---

## 7. Related Terms
- [`<NuxtErrorBoundary>` Component](nuxt_error_boundary.md) — How to handle non-fatal errors without destroying the whole page layout.
- [Fetching Errors & `clearNuxtData`](../level_05/fetching_errors.md) — Related concept: Fetching Errors & `clearNuxtData`.
- [`abortNavigation` Utility](../level_08/abort_navigation.md) — Related concept: `abortNavigation` Utility.
- [`createError`, `showError` & `clearError`](create_error.md) — Related concept: `createError`, `showError` & `clearError`.

---

## 8. Key Takeaways
- `error.vue` is a root-level file that completely replaces `app.vue` when a fatal error occurs.
- It is perfect for handling global 404s and 500s.
- You access the error details using `useError()`.
- You must use `clearError({ redirect: '/' })` to escape the error page and return to the main app.
