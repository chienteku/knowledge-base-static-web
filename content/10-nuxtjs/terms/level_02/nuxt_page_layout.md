# `<NuxtPage>` & `<NuxtLayout>` Components

> **Level 2 — Directory Structure & Routing**
> Built-in components used to configure route viewports and mount layout wrappers around dynamic page templates inside your root application layout.

---

## 1. Prerequisites
- [`app.vue`](app_vue.md) — The root template where these viewport wrappers are initialized.
- [`pages/` Directory](pages_directory.md) — The directory providing the files to render.

---

## 2. Term Category

**Routing / Navigation** (Routing & Layout Rendering Components): `<NuxtPage>` and `<NuxtLayout>` are core components that render active route views and master layout wrappers.



---

## 3. Explanation

### Environment Context
- **Server & Client** (Parsed on the server during initial SSR compilation and updated dynamically in the browser during SPA routing).

### (1) Design Motivation — "Why did we design this?"
In a typical full-stack web application, different routes share identical layout structures (like navigation sidebars, headers, and footers), but need to swap their central content block. 

To support clean template inheritance, Nuxt decouples layout outlines from page content views:
-   **`<NuxtPage>`** acts as the viewport window. It dynamically resolves which file inside the `pages/` directory matches the browser URL and imports it.
-   **`<NuxtLayout>`** acts as the outer container frame, wrapping the dynamic page content in reusable layout structures.

---

### (2) Route Viewports: `<NuxtPage>`
Under the hood, `<NuxtPage>` is a thin wrapper around Vue Router's `<router-view>` component. Placing it in a component template tells Nuxt: "Render the current page file here."

```vue
<!-- app.vue -->
<template>
  <main>
    <!-- Dynamic page files (like index.vue, about.vue) render here -->
    <NuxtPage />
  </main>
</template>
```

---

### (3) Layout Containers: `<NuxtLayout>`
`<NuxtLayout>` reads the page's metadata configuration (defined via `definePageMeta`) and fetches the corresponding wrapper template from the `layouts/` directory.

The standard integration inside `app.vue` wraps `<NuxtPage />` completely:

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

Nuxt resolves this structure as follows:
1.  **Request `yourwebsite.com/dashboard`:** Nuxt checks the `dashboard.vue` metadata. It sees `layout: 'admin'` is configured.
2.  **Load Layout:** Nuxt loads `layouts/admin.vue`.
3.  **Load Page:** Nuxt renders `pages/dashboard.vue` and injects it into the default `<slot />` viewport inside `layouts/admin.vue`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Wrapping components double-layouts inside both `app.vue` and the page template

**The mistake:** Wrapping `<NuxtLayout>` in `app.vue` and *also* writing a manual `<NuxtLayout>` tag directly inside a page:

```vue
<!-- app.vue -->
<template>
  <NuxtLayout> <!-- Layer 1: default.vue layout -->
    <NuxtPage />
  </NuxtLayout>
</template>

<!-- pages/contact.vue -->
<template>
  <NuxtLayout> <!-- Layer 2: Default layout is rendered AGAIN! -->
    <h1>Contact Us</h1>
  </NuxtLayout>
</template>
```

**Why it's wrong:** This structure mounts the default layout twice. Global navigation headers and footers will render duplicated in the browser DOM, and transitions will tearing.

**Golden Rule:** If `<NuxtLayout>` is defined in `app.vue`, do not write `<NuxtLayout>` tags inside individual page files. Instead, set the layout template dynamically via the page script: `definePageMeta({ layout: 'custom' })`.

---

### Mistake 2: Using Hardcoded `<NuxtLayout name="custom">` Wrapper When `definePageMeta` Is Available

**The mistake:** Wrapping page content inside `<NuxtLayout name="custom">` directly in page templates.

**Why it's wrong:** Hardcoding `<NuxtLayout>` inside page templates breaks layout transition animations and creates double layout nesting. Set layout via `definePageMeta({ layout: 'custom' })`.

*Incorrect:*
```vue
<!-- pages/about.vue -->
<template>
  <NuxtLayout name="custom"> <!-- ❌ Manual layout wrapping inside page template -->
    <h1>About</h1>
  </NuxtLayout>
</template>
```

*Fix:*
```vue
<!-- pages/about.vue -->
<script setup>
definePageMeta({ layout: 'custom' }); // Set layout cleanly in page meta
</script>
<template>
  <div><h1>About</h1></div>
</template>
```

---

### Mistake 3: Expecting Layout State to Persist When `setPageLayout()` Switches Layout Dynamically

**The mistake:** Expecting component state inside `layouts/default.vue` to persist when switching to `layouts/admin.vue` using `setPageLayout()`.

**Why it's wrong:** Switching layouts destroys the old layout instance and mounts a new layout component tree, resetting all layout-scoped state.

*Incorrect:*
```vue
/* Expecting layout state to persist during dynamic setPageLayout() transitions */
```

*Fix:*
```vue
/* Store shared layout state in Pinia or useState() composables */
```


---

## 5. Practice Exercises

### Exercise 1: Rendering Active Routes with `<NuxtPage>`

**Scenario:**
Implement `<NuxtPage>` inside `app.vue` with custom loading fallback slots.

**Requirements:**
1. Render `<NuxtPage />` inside `app.vue`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- app.vue -->
> <template>
>   <div>
>     <NuxtPage />
>   </div>
> </template>
> ```

> #### Technical Explanation
>
> 1. `<NuxtPage />` is Nuxt's wrapper built on top of Vue Router's `<RouterView />`.
> 2. Handles page component resolution, transitions, keep-alive state, and route key bindings.
> 3. Required for displaying views defined in the `pages/` directory.

---

### Exercise 2: Overriding Layout Bindings with `<NuxtLayout>` Props

**Scenario:**
Explicitly bind a custom layout name to `<NuxtLayout :name="layoutName">` dynamically.

**Requirements:**
1. Use `<NuxtLayout :name="currentLayout">`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const currentLayout = ref("default");
> </script>

<template>
  <div>
    <button @click="currentLayout = currentLayout === 'default' ? 'auth' : 'default'">
      Toggle Layout
    </button>
    <NuxtLayout :name="currentLayout">
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Binding `:name` on `<NuxtLayout>` explicitly overrides page-defined metadata layouts.
> 2. Enables global layout switching controlled by root application state.
> 3. High-level layout orchestration pattern.

---

### Exercise 3: Passing Props to Layouts using Named Slots

**Scenario:**
Pass custom header titles from pages into `<NuxtLayout>` named slots.

**Requirements:**
1. Use named slot `#header` inside layout and page.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- layouts/default.vue -->
> <template>
>   <div>
>     <header>
>       <slot name="header">
>         <h1>Default Header Title</h1>
>       </slot>
>     </header>
>     <main>
>       <slot />
>     </main>
>   </div>
> </template>
> ```

> #### Technical Explanation
>
> 1. `<NuxtLayout>` supports named Vue slots (`#header`, `#footer`).
> 2. Pages can project custom headers into parent layout templates directly.
> 3. Flexible slot-based template composition.

---




---

## 6. Related Terms
- [`app.vue`](app_vue.md) — The root node of the Vue app tree.
- [`layouts/` Directory](layouts_directory.md) — The folder where layout templates are stored.
- [`pages/` Directory](pages_directory.md) — Related concept: `pages/` Directory.

---

## 7. Key Takeaways
- `<NuxtPage>` renders the component corresponding to the active route.
- `<NuxtLayout>` wraps pages in reusable layouts from the `layouts/` directory.
- Keep layout wraps singular (typically wrapping `<NuxtPage>` in `app.vue`).
- Control page layouts dynamically via `definePageMeta({ layout: 'name' })`.
- Use `layout: false` to completely bypass layout wrappers on specific routes.
