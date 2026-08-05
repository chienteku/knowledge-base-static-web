# `layouts/` Directory

> **Level 2 — Directory Structure & Routing**
> A dedicated folder for creating reusable UI wrappers (like navbars and sidebars) that can wrap around your page components without re-rendering upon navigation.

---

## 1. Prerequisites
- [`app.vue`](app_vue.md) — Where the global layouts feature is initialized.
- [`pages/` Directory](pages_directory.md) — The content that gets wrapped by the layout.
- [`<NuxtPage>` & `<NuxtLayout>` Components](nuxt_page_layout.md) — The built-in components orchestrating layout loads.
- [`definePageMeta` Compiler Macro](define_page_meta.md) — The API used to override layout mappings.
- [Slots](../../../07-vue/terms/level_05/slots.md) — The Vue mechanism used to inject page templates.

---

## 2. Term Category
- **Directory Structure**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Most web applications have a consistent visual "shell"—for example, a top navigation bar and a footer that appear on every page. If you manually import the `<Navbar />` and `<Footer />` components into every single page in your `pages/` directory, you duplicate massive amounts of code. Worse, every time the user navigates, the Navbar component is destroyed and re-created, wasting performance.

The `layouts/` directory solves this by providing a persistent outer wrapper. The layout stays mounted in the DOM while only the page content inside it changes.

### (2) Core Concept
To use layouts, you create Vue components inside the `layouts/` directory. These components MUST contain a `<slot />` tag, which is where Nuxt will inject the current page content.

**Example: `layouts/default.vue`**
```vue
<template>
  <div>
    <TheNavbar /> <!-- Persistent Header -->
    
    <main class="container">
      <slot /> <!-- The current page goes here! -->
    </main>
    
    <TheFooter /> <!-- Persistent Footer -->
  </div>
</template>
```

### (3) Initializing Layouts
To make the layout system work, you must update your root `app.vue` file to use the `<NuxtLayout>` component:

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

### (4) Custom Layouts
By default, Nuxt wraps every page in `layouts/default.vue`. If you want a specific page (like an admin dashboard) to use a different layout, create a new file like `layouts/admin.vue`, and configure the page to use it:

```vue
<!-- pages/dashboard.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'admin' // Uses layouts/admin.vue
});
</script>

<template>
  <h1>Admin Dashboard</h1>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not including a single root element in the layout
**The mistake:** Creating a layout that has multiple root HTML nodes alongside the `<slot />`.

**Why it's wrong:** Due to how Vue handles transitions and DOM diffing across route changes, layouts with multiple root nodes can cause visual tearing, Hydration Mismatches, or crash the application during navigation.
**Golden Rule:** A layout file MUST have exactly one single root `<div>` (or other tag) wrapping the entire template.

*Incorrect:*
```vue
<template>
  <header>Nav</header>
  <slot />
  <footer>Footer</footer>
</template>
```

*Fix:*
```vue
<template>
  <div> <!-- Single root element! -->
    <header>Nav</header>
    <slot />
    <footer>Footer</footer>
  </div>
</template>
```

---

### Mistake 2: Omitting `<slot />` in Custom Layout Components

**The mistake:** Creating `layouts/custom.vue` without rendering `<slot />`.

**Why it's wrong:** Layouts wrap page content by injecting pages into the default `<slot />`. Omitting `<slot />` drops page rendering completely.

*Incorrect:*
```vue
<!-- layouts/custom.vue -->
<template>
  <div><Header /></div> <!-- ❌ Missing <slot />! Pages will not render! -->
</template>
```

*Fix:*
```vue
<!-- layouts/custom.vue -->
<template>
  <div>
    <Header />
    <slot /> <!-- Page content injected here -->
    <Footer />
  </div>
</template>
```

---

### Mistake 3: Writing Multiple Root Elements in Layout Templates (Hydration Failure)

**The mistake:** Writing `<template><Header /><slot /><Footer /></template>` without a single wrapping root element.

**Why it's wrong:** Layouts require a single HTML root element wrapper. Multiple root elements in layout templates cause Vue hydration mismatched DOM errors.

*Incorrect:*
```vue
<template>
  <Header /> <!-- ❌ Multiple root elements! -->
  <slot />
  <Footer />
</template>
```

*Fix:*
```vue
<template>
  <div> <!-- Single root container wrapper -->
    <Header />
    <slot />
    <Footer />
  </div>
</template>
```


---

## 6. Practice Exercises

### Exercise 1: Bypassing the Default Layout

**Problem:** You have a `layouts/default.vue` file containing your site navigation. You are building a `pages/login.vue` page, and you want the screen to be completely blank except for the login form (no navbar). How do you configure the login page to skip the default layout?

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup lang="ts">
> definePageMeta({
>   layout: false // Disables the layout system for this specific page
> });
> </script>
> ```
> - You can set the layout property to a boolean `false` inside the metadata macro to instruct Nuxt to bypass layout containers.

---

### Exercise 2: Custom Named Layout Setup Pattern

**Problem:** Write custom layout `layouts/admin.vue` rendering an admin sidebar header, `<slot />`, and footer wrapper.

**Expected output:**
> [!check]- Answer
> ```vue
> <template>
>   <div class="admin-layout">
>     <AdminSidebar />
>     <main><slot /></main>
>   </div>
> </template>
> ```
> - Named layout files in `layouts/` are referenced via `definePageMeta({ layout: 'admin' })`.
> 
> ```vue
> <!-- layouts/admin.vue -->
> <template>
>   <div class="flex min-h-screen">
>     <aside class="w-64 bg-gray-800 text-white">Admin Sidebar</aside>
>     <main class="flex-1 p-6">
>       <slot />
>     </main>
>   </div>
> </template>
> ```

---

### Exercise 3: Default Layout Naming Rule

**Problem:** What filename MUST be used in `layouts/` to automatically apply a layout to all pages by default?

**Expected output:**
> [!check]- Answer
> ```text
> layouts/default.vue
> ```
> - `layouts/default.vue` is applied automatically across all pages.
> 
> ```text
> layouts/default.vue
> ```


---

## 7. Related Terms
- [`app.vue`](app_vue.md) — Where `<NuxtLayout>` is placed to activate the system.
- [`<NuxtPage>` & `<NuxtLayout>` Components](nuxt_page_layout.md) — Related concept: `<NuxtPage>` & `<NuxtLayout>` Components.
- [`pages/` Directory](pages_directory.md) — pages/ directory.
- [`definePageMeta` Compiler Macro](define_page_meta.md) — Related concept: `definePageMeta` Compiler Macro.

---

## 8. Key Takeaways
- Layouts are persistent UI wrappers around your pages.
- They prevent expensive re-rendering of headers and sidebars during navigation.
- The `default.vue` layout applies to all pages automatically.
- Use `definePageMeta({ layout: 'name' })` to switch layouts on a per-page basis.
- Layouts must have a single root DOM element.
