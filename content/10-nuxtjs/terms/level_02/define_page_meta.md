# `definePageMeta` Compiler Macro

> **Level 2 — Directory Structure & Routing**
> An auto-imported compiler macro used inside page components to configure layout wrappers, route middleware checkpoints, and custom route validation rules.

---

## 1. Prerequisites
- [`pages/` Directory](../level_02/pages_directory.md) — The folder where pages containing this macro reside.
- [File-based Routing](../level_02/file_based_routing.md) — The router config updated by this compiler macro.

---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Server Only** (Extracted and compiled during build-time on the server; the configuration is stripped from the client's component runtime script).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Pages require route-specific behaviors:
-   A login page needs a clean, headerless layout.
-   An admin dashboard needs to register an authentication redirect checkpoint.
-   A dynamic detail page needs to instantly reject invalid URL parameters.

In standard Vue Router, these metadata properties are configured inside the centralized `router.ts` mapping list. 

Because Nuxt uses file-based routing, there is no centralized router config file for you to edit. The **`definePageMeta`** compiler macro was designed to let you configure route metadata directly inside the page file itself. The compiler scans these macros at build-time, extracts the properties, and inlines them into the generated routing configurations.

---

### (2) Core Configurations Supported
Common properties declared inside `definePageMeta` include:

-   **`layout`:** Sets the containing wrapper from `layouts/` (e.g., `layout: 'admin'`). Use `layout: false` to disable layouts.
-   **`middleware`:** Attaches named route middleware checks (e.g., `middleware: 'auth'`).
-   **`validate`:** A callback function that receives the route object and validates if parameter constraints are met (e.g. checking if ID is numeric). If it returns `false`, Nuxt automatically throws a 404 error.
-   **`alias`:** Creates a path alias (e.g. setting `alias: '/home'` on `index.vue` allows visiting both `/` and `/home`).

```vue
<!-- pages/posts/[id].vue -->
<script setup lang="ts">
// Configure route behaviors
definePageMeta({
  layout: 'blog',
  middleware: 'auth',
  validate: async (route) => {
    // Only allow numeric IDs (e.g. /posts/123)
    return /^\d+$/.test(route.params.id as string);
  }
});
</script>

<template>
  <main>
    <h1>Post ID: {{ $route.params.id }}</h1>
  </main>
</template>
```

---

### (3) The Compiler Macro Boundary
Because `definePageMeta` is a compiler macro, it undergoes **static extraction**. The Nuxt compiler strips the macro from the component before running the code. 

As a consequence of this separation, **you cannot access variables declared inside `<script setup>`** from within the `definePageMeta` config block. The configuration is isolated from the runtime component instance state.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Referencing runtime component variables inside `definePageMeta`

**The mistake:** Trying to read reactive variables or local components in the config block:

```vue
<!-- BAD: Component variables are not compiled yet! -->
<script setup lang="ts">
import { ref } from 'vue';

const currentTheme = ref('dark');

definePageMeta({
  layout: currentTheme.value // ❌ Compile Error: currentTheme is not defined!
});
</script>
```

**Why it's wrong:** Because the compiler extracts the config object statically *before* compiling the setup function, variables like `currentTheme` do not exist yet. The configuration must be composed of statically resolvable values (strings, arrays, independent helper functions).

**Golden Rule:** Keep `definePageMeta` parameters static. Do not reference local reactive variables or constants declared in `<script setup>`.

---

### Mistake 2: Calling `definePageMeta()` inside Asynchronous Callbacks or Lifecycle Hooks

**The mistake:** Calling `definePageMeta()` inside `onMounted()` or an async function.

**Why it's wrong:** `definePageMeta()` is a compiler macro that MUST be called at the top level of `<script setup>`. It cannot be executed inside functions or lifecycle hooks.

*Incorrect:*
```vue
<script setup>
onMounted(() => {
  definePageMeta({ layout: 'custom' }); // ❌ Error: Compiler macro inside hook!
});
</script>
```

*Fix:*
```vue
<script setup>
// Call macro at top level of script setup:
definePageMeta({
  layout: 'custom'
});
</script>
```

---

### Mistake 3: Passing Non-Static Reactive Refs to `definePageMeta()` Properties

**The mistake:** Writing `definePageMeta({ layout: currentLayout.value })` using dynamic client reactive state.

**Why it's wrong:** `definePageMeta()` is evaluated statically during route extraction. Passing dynamic runtime refs to layout properties fails.

*Incorrect:*
```vue
const currentLayout = ref('dark');
definePageMeta({ layout: currentLayout.value }); // ❌ Cannot use dynamic refs in definePageMeta!
```

*Fix:*
```vue
definePageMeta({
  layout: 'dark' // Static layout string
});
```


---

## 6. Practice Exercises

### Exercise 1: Configure Route Validation

**Problem:** You are building an account settings route `pages/account/[username].vue`. Write the `definePageMeta` config block that attaches the `user-auth` middleware and validates that the `username` path parameter does not contain spaces.

```vue
<!-- Solution: -->
<script setup lang="ts">
definePageMeta({
  middleware: 'user-auth',
  validate: async (route) => {
    const username = route.params.username as string;
    return !username.includes(' ');
  }
});
</script>
```

> [!check]- Answer
> - The `validate` option takes a function receiving `route` and returning a boolean.

---

### Exercise 2: definePageMeta Guard & Layout Configuration Pattern

**Problem:** Write `definePageMeta()` block configuring layout `'auth'`, middleware `'auth'`, and custom meta `requiresAdmin: true`.

**Expected output:**
```vue
<script setup>
definePageMeta({
  layout: 'auth',
  middleware: ['auth'],
  requiresAdmin: true
});
</script>
```

> [!check]- Answer
> - `definePageMeta` configures page layouts, middleware, and route meta.
> 
> ```vue
> <script setup>
> definePageMeta({
>   layout: 'auth',
>   middleware: ['auth'],
>   requiresAdmin: true
> });
> </script>
> ```

---

### Exercise 3: Disabling Layout via definePageMeta

**Problem:** Write `definePageMeta()` setting disabling layout wrapping for a specific page.

**Expected output:**
```typescript
definePageMeta({ layout: false });
```

> [!check]- Answer
> - `layout: false` disables layout wrapping.
> 
> ```typescript
> definePageMeta({
>   layout: false
> });
> ```


---

## 7. Related Terms
- [`pages/` Directory](../level_02/pages_directory.md) — The folder where pages containing this macro reside.
- [Route Middleware](../level_08/route_middleware.md) — The middleware handlers attached via this macro.

---

## 8. Key Takeaways
- `definePageMeta` is a compiler macro used inside page files to configure routes.
- It enables configuring page layouts, registering middleware, and validating parameters.
- If parameter validation returns `false`, Nuxt automatically renders a 404 page.
- Do not reference local runtime variables inside the macro config object.
- The macro is stripped from client bundles during compilation.
