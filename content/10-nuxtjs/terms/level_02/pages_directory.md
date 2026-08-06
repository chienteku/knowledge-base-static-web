# `pages/` Directory

> **Level 2 — Directory Structure & Routing**
> The dedicated folder in a Nuxt application where Vue components are automatically mapped to URL routes.

---

## 1. Prerequisites
- [File-based Routing](file_based_routing.md) — The concept that powers this directory.
- [`app.vue`](app_vue.md) — The entry point that renders these pages.

---

## 2. Term Category

**Routing / Navigation** (View Route Page Components): The `pages/` directory automatically generates application routes for each Vue component file placed within it.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
When building a website, the concept of a "Page" is universally understood. By enforcing a strict `pages/` directory, Nuxt creates a standardized project structure. Any developer joining your team immediately knows exactly where to look to find the code for `yoursite.com/contact`.

### (2) Core Concept
Every `.vue` file inside the `pages/` directory represents a distinct URL in your application. The path to the file perfectly mirrors the path in the browser.

When a user visits a route, the corresponding component is loaded and injected into the `<NuxtPage />` component inside your `app.vue`.

**Basic File Structure:**
```text
pages/
├── index.vue        # -> /
├── dashboard.vue    # -> /dashboard
└── profile/
    ├── index.vue    # -> /profile
    └── settings.vue # -> /profile/settings
```

### (3) Page Metadata
Because these components act as full pages, they often need special configuration, like determining which layout to use or setting a page title. You do this using the auto-imported `definePageMeta` compiler macro.

```vue
<script setup lang="ts">
// This macro is extracted at build time to configure the route.
definePageMeta({
  layout: 'admin', // Use the admin.vue layout instead of the default
  middleware: 'auth' // Require the user to be logged in to see this page
});
</script>

<template>
  <h1>Secret Dashboard</h1>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on `pages/` for small components
**The mistake:** Creating a file `pages/Navbar.vue` and importing it into `pages/index.vue`.

**Why it's wrong:** While the import will technically work, Nuxt will *also* create a public route at `/Navbar`. This is terrible for security and SEO.
**Golden Rule:** The `pages/` directory is strictly for routable pages. UI elements like buttons, navbars, and modals MUST go in the `components/` directory.

---

### Mistake 2: Deleting `pages/` Directory and Wondering Why Vue Router Features Disappear

**The mistake:** Removing `pages/` folder and expecting `useRoute()` or `<NuxtLink>` page navigation to function.

**Why it's wrong:** Nuxt 3 includes Vue Router ONLY if the `pages/` directory exists. If `pages/` is absent, Nuxt runs as a lightweight single-file app without router overhead.

*Incorrect:*
```vue
/* Removing pages/ folder and trying to use useRoute() or <NuxtLink> */
```

*Fix:*
```vue
/* Create pages/ directory to automatically enable Vue Router integration */
```

---

### Mistake 3: Adding Non-Page Asset Files (`.png`, `.scss`, `.ts`) inside `pages/` Directory

**The mistake:** Placing styles `pages/about.scss` or images `pages/hero.png` inside `pages/`.

**Why it's wrong:** The `pages/` directory scanner treats non-page files as potential route targets or build noise. Store styles in `assets/` and static images in `public/`.

*Incorrect:*
```vue
// pages/styles.scss ❌ Invalid placement in routing directory!
```

*Fix:*
```vue
// assets/styles/main.scss Correct asset directory
```


---

## 5. Practice Exercises

### Exercise 1: Creating Basic Route Components in `pages/`

**Scenario:**
Create `pages/index.vue` and `pages/about.vue` with navigation using `<NuxtLink>`.

**Requirements:**
1. Create `pages/index.vue` and `pages/about.vue`.
2. Navigate between routes using `<NuxtLink to="...">`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- pages/index.vue -->
> <template>
>   <div>
>     <h1>Home Page</h1>
>     <NuxtLink to="/about">Go to About</NuxtLink>
>   </div>
> </template>
> ```

> ```vue
> <!-- pages/about.vue -->
> <template>
>   <div>
>     <h1>About Page</h1>
>     <NuxtLink to="/">Back to Home</NuxtLink>
>   </div>
> </template>
> ```

> #### Technical Explanation
>
> 1. Vue files placed in `pages/` automatically become accessible top-level routes.
> 2. `<NuxtLink>` performs optimized client-side navigation without triggering full page reloads.
> 3. Prefetches JavaScript chunks for linked pages when links enter the browser viewport.

---

### Exercise 2: Implementing Nested Sub-Directory Routes

**Scenario:**
Structure `pages/settings/profile.vue` and `pages/settings/security.vue` under a settings sub-folder.

**Requirements:**
1. Create files in `pages/settings/`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Directory Structure:
> - pages/settings/profile.vue  -> URL: /settings/profile
> - pages/settings/security.vue -> URL: /settings/security
> ```

> #### Technical Explanation
>
> 1. Sub-directories in `pages/` map directly to URL sub-path prefixes.
> 2. Keeps route organization clean and modular across complex applications.
> 3. Automatically registered in Vue Router.

---

### Exercise 3: Customizing Route Keys for Re-render Optimization

**Scenario:**
Force page re-mounting when query parameters change using `key` property in `definePageMeta()`.

**Requirements:**
1. Configure `key: route => route.fullPath` in `definePageMeta()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> definePageMeta({
>   key: (route) => route.fullPath
> });
> </script>

<template>
  <div>
    <p>Search Query: {{ $route.query.q }}</p>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. By default, Vue Router reuses component instances when navigating between routes sharing the same component template.
> 2. Setting `key: route => route.fullPath` forces component destruction and re-creation whenever query parameters change.
> 3. Guarantees lifecycle hooks (`onMounted`) re-run on query navigation.

---




---

## 6. Related Terms
- [`components/` Directory](../level_03/components_directory.md) — Where non-routable Vue components belong.
- [Dynamic Routes](dynamic_routes.md) — How to create pages that handle variable URLs like `/products/123`.
- [`app.vue`](app_vue.md) — Related concept: `app.vue`.
- [`definePageMeta` Compiler Macro](define_page_meta.md) — Related concept: `definePageMeta` Compiler Macro.
- [File-based Routing](file_based_routing.md) — Related concept: File-based Routing.
- [NuxtLink Component](../level_03/nuxtlink_component.md) — Related concept: NuxtLink Component.
- [Global vs Named Middleware](../level_08/global_vs_named_middleware.md) — Related concept: Global vs Named Middleware.
- [Route Middleware](../level_08/route_middleware.md) — Related concept: Route Middleware.
- [`<NuxtPage>` & `<NuxtLayout>` Components](nuxt_page_layout.md) — NuxtPage component.
- [`layouts/` Directory](layouts_directory.md) — layouts/ directory.

---

## 7. Key Takeaways
- The `pages/` directory powers Nuxt's file-based routing.
- Every `.vue` file in this folder becomes a public URL.
- Use `definePageMeta` to assign layouts or route-specific middleware.
- Never place partial UI components inside this directory.
