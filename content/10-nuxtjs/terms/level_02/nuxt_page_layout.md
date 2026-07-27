# `<NuxtPage>` & `<NuxtLayout>` Components

> **Level 2 — Directory Structure & Routing**
> Built-in components used to configure route viewports and mount layout wrappers around dynamic page templates inside your root application layout.

---

## 1. Prerequisites
- [`app.vue`](../level_02/app_vue.md) — The root template where these viewport wrappers are initialized.
- [`pages/` Directory](../level_02/pages_directory.md) — The directory providing the files to render.

---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Server & Client** (Parsed on the server during initial SSR compilation and updated dynamically in the browser during SPA routing).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Conditional Layout Rendering

**Problem:** You want your application's routes to load within the standard layout by default, except for the `/login` route, which requires a clean, empty canvas. Show how to configure `app.vue` and `pages/login.vue` using metadata configurations.

```vue
<!-- app.vue (Solution): -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

```vue
<!-- pages/login.vue (Solution): -->
<script setup lang="ts">
definePageMeta({
  layout: false // Disables the layout container for this page completely
});
</script>

<template>
  <form>
    <input type="email" placeholder="Email" />
    <input type="password" placeholder="Password" />
    <button>Log In</button>
  </form>
</template>
```

> [!check]- Answer
> - Setting `layout: false` in `definePageMeta` tells `<NuxtLayout>` to bypass wrapping and pass `<NuxtPage />` through directly.

---

### Exercise 2: Dynamic Layout Switching Pattern

**Problem:** Write `<script setup>` function toggling layout between `'default'` and `'dark'` using `setPageLayout()`.

**Expected output:**
```vue
<script setup>
function toggleLayout() {
  setPageLayout('dark');
}
</script>
```

> [!check]- Answer
> - `setPageLayout()` dynamically changes the active layout at runtime.
> 
> ```vue
> <script setup>
> const isDark = ref(false);
> 
> function switchLayout() {
>   isDark.value = !isDark.value;
>   setPageLayout(isDark.value ? 'dark' : 'default');
> }
> </script>
> 
> <template>
>   <button @click="switchLayout">Toggle Dark Layout</button>
> </template>
> ```

---

### Exercise 3: NuxtLayout Slot Props

**Problem:** How do you pass custom slot props from `<NuxtLayout>` to layout templates?

**Expected output:**
```text
Via named or default slots on <NuxtLayout :name="layoutName">.
```

> [!check]- Answer
> - `<NuxtLayout>` accepts props passed down to layout components.
> 
> ```vue
> <NuxtLayout name="custom" :user="currentUser" />
> ```


---

## 7. Related Terms
- [`app.vue`](../level_02/app_vue.md) — The root node of the Vue app tree.
- [`layouts/` Directory](../level_02/layouts_directory.md) — The folder where layout templates are stored.

---

## 8. Key Takeaways
- `<NuxtPage>` renders the component corresponding to the active route.
- `<NuxtLayout>` wraps pages in reusable layouts from the `layouts/` directory.
- Keep layout wraps singular (typically wrapping `<NuxtPage>` in `app.vue`).
- Control page layouts dynamically via `definePageMeta({ layout: 'name' })`.
- Use `layout: false` to completely bypass layout wrappers on specific routes.
