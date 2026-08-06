# `definePageMeta` Compiler Macro

> **Level 2 — Directory Structure & Routing**
> An auto-imported compiler macro used inside page components to configure layout wrappers, route middleware checkpoints, and custom route validation rules.

---

## 1. Prerequisites
- [`pages/` Directory](pages_directory.md) — The folder where pages containing this macro reside.
- [File-based Routing](file_based_routing.md) — The router config updated by this compiler macro.

---

## 2. Term Category

**Routing / Navigation** (Page-Level Route Metadata): `definePageMeta()` is a compiler macro used to configure route metadata, layout selection, page transitions, and middleware for specific page components.



---

## 3. Explanation

### Environment Context
- **Server Only** (Extracted and compiled during build-time on the server; the configuration is stripped from the client's component runtime script).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Assigning Custom Layouts via `definePageMeta()`

**Scenario:**
Assign a custom layout `layouts/admin.vue` to page `pages/admin/index.vue` using `definePageMeta()`.

**Requirements:**
1. Execute `definePageMeta({ layout: "admin" })`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- pages/admin/index.vue -->
> <script setup lang="ts">
> definePageMeta({
>   layout: "admin"
> });
> </script>

<template>
  <div>
    <h1>Admin Control Panel</h1>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `definePageMeta()` is a compiler macro that sets route configuration metadata at component compile time.
> 2. `layout: "admin"` overrides the default layout (`layouts/default.vue`), rendering `layouts/admin.vue` instead.
> 3. Enables page-level layout customization.

---

### Exercise 2: Attaching Route Middleware and Custom Roles

**Scenario:**
Attach authentication middleware and custom role metadata (`auth`, `roles: ["admin"]`) to a dashboard route.

**Requirements:**
1. Configure `middleware` array and custom properties in `definePageMeta()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- pages/dashboard.vue -->
> <script setup lang="ts">
> definePageMeta({
>   middleware: ["auth"],
>   roles: ["admin", "editor"],
>   keepalive: true
> });
> </script>

<template>
  <div>
    <h1>Protected Dashboard</h1>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `middleware: ['auth']` executes named route middleware located in `middleware/auth.ts` before entering the route.
> 2. Custom metadata attributes (`roles`) are accessible via `useRoute().meta.roles`.
> 3. `keepalive: true` caches component DOM state across client navigation.

---

### Exercise 3: Dynamic Route Validation with `validate`

**Scenario:**
Validate that dynamic parameter `id` in `pages/users/[id].vue` is strictly a numeric integer string, returning 404 if invalid.

**Requirements:**
1. Use `validate: async (route) => ...` in `definePageMeta()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- pages/users/[id].vue -->
> <script setup lang="ts">
> definePageMeta({
>   validate: async (route) => {
>     // Check if id parameter contains numeric digits only
>     return typeof route.params.id === "string" && /^\d+$/.test(route.params.id);
>   }
> });
> </script>

<template>
  <div>
    <h1>User Profile ID: {{ $route.params.id }}</h1>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `validate` function receives the target `route` object before route entry.
> 2. Returning `false` or throwing an HTTP error triggers Nuxt's 404 Not Found error page automatically.
> 3. Prevents execution of invalid database queries for malformed URL parameters.

---




---

## 6. Related Terms
- [`pages/` Directory](pages_directory.md) — The folder where pages containing this macro reside.
- [Route Middleware](../level_08/route_middleware.md) — The middleware handlers attached via this macro.
- [`layouts/` Directory](layouts_directory.md) — Custom layout selection.

---

## 7. Key Takeaways
- `definePageMeta` is a compiler macro used inside page files to configure routes.
- It enables configuring page layouts, registering middleware, and validating parameters.
- If parameter validation returns `false`, Nuxt automatically renders a 404 page.
- Do not reference local runtime variables inside the macro config object.
- The macro is stripped from client bundles during compilation.
