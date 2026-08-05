# `pages/` Directory

> **Level 2 — Directory Structure & Routing**
> The dedicated folder in a Nuxt application where Vue components are automatically mapped to URL routes.

---

## 1. Prerequisites
- [File-based Routing](file_based_routing.md) — The concept that powers this directory.
- [`app.vue`](app_vue.md) — The entry point that renders these pages.
---

## 2. Term Category
- **Directory Structure**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Configuring Page Metadata

**Problem:** You have a file `pages/login.vue`. Write the script block required to apply a custom layout named `minimal` to this specific page.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup lang="ts">
> definePageMeta({
>   layout: 'minimal'
> });
> </script>
> ```
> - The `definePageMeta` macro is auto-imported globally and can accept a configuration object with a `layout` string key matching the layout filename.

---

### Exercise 2: Pages Directory Enable Check

**Problem:** What simple project structure action automatically enables Vue Router in a Nuxt 3 project?

**Expected output:**
> [!check]- Answer
> ```text
> Creating a pages/ directory containing at least 1 .vue page file (e.g. pages/index.vue).
> ```
> - Creating the `pages/` directory automatically activates Vue Router.
> 
> ```text
> pages/index.vue -> Activates Vue Router
> ```

---

### Exercise 3: Custom Router Options Configuration

**Problem:** Which file in project root allows customizing Vue Router options (e.g. scrollBehavior)?

**Expected output:**
> [!check]- Answer
> ```text
> app/router.options.ts
> ```
> - `app/router.options.ts` configures custom Vue Router options.
> 
> ```typescript
> export default {
>   scrollBehavior(to, from, savedPosition) {
>     return savedPosition || { top: 0 };
>   }
> };
> ```


---

## 7. Related Terms
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

## 8. Key Takeaways
- The `pages/` directory powers Nuxt's file-based routing.
- Every `.vue` file in this folder becomes a public URL.
- Use `definePageMeta` to assign layouts or route-specific middleware.
- Never place partial UI components inside this directory.
